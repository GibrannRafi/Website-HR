/**
 * Email Poller — IMAP inbox monitor untuk lamaran kerja
 *
 * Filter ketat & presisi per PT:
 * 1. Hanya email HARI INI yang belum dibaca
 * 2. Pre-filter subject: match dengan jobdesk aktif di database
 *    (Mendukung pencocokan presisi NAMA PT + POSISI agar tidak tertukar antar HRD PT yang berbeda)
 * 3. Parse CV (dengan 10s timeout pelindung) → Score dengan TalentSift v2 → Simpan ke DB
 */

const Imap          = require('imap');
const { simpleParser } = require('mailparser');
const pdfParse      = require('pdf-parse');
const path          = require('path');
const fs            = require('fs');
const pool          = require('../config/db');
const { scoreCVAgainstJob } = require('../ml/scorer');

require('dotenv').config();

// Buat folder uploads jika belum ada
const ATTACHMENTS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(ATTACHMENTS_DIR)) fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Normalisasi string: hapus karakter non-alphanumeric untuk pencocokan fleksibel
 * "LAMARAN KERJA - BACK END - PT ABC" -> "LAMARANKERJABACKENDPTABC"
 */
function normalizeStr(str) {
  return (str || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function getActiveEmailSubjects() {
  const [rows] = await pool.query(`
    SELECT 
      j.id, 
      j.email_subject, 
      j.subject_keyword, 
      j.description, 
      j.title,
      u.company
    FROM jobdesks j
    LEFT JOIN users u ON j.created_by = u.id
    WHERE j.status = "active"
  `);
  return rows;
}

async function extractTextFromPDF(buffer) {
  try {
    const pdfPromise = pdfParse(buffer);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PDF parse timeout (>10s)')), 10000)
    );
    const data = await Promise.race([pdfPromise, timeoutPromise]);
    return data.text || '';
  } catch (err) {
    console.error('  ⚠️ PDF parse error:', err.message);
    return '';
  }
}

async function extractCVText(attachment) {
  const ext = path.extname(attachment.filename || '').toLowerCase();
  if (ext === '.pdf')                        return await extractTextFromPDF(attachment.content);
  if (['.txt', '.text'].includes(ext))       return attachment.content.toString('utf-8');
  if (['.doc', '.docx'].includes(ext))       return attachment.content.toString('utf-8').replace(/<[^>]*>/g, ' ');
  return '';
}

function saveAttachment(buffer, filename) {
  const safeName = `${Date.now()}_${filename.replace(/[^a-z0-9._-]/gi, '_')}`;
  const filePath = path.join(ATTACHMENTS_DIR, safeName);
  fs.writeFileSync(filePath, buffer);
  return { filePath, safeName };
}

// ─────────────────────────────────────────────
// Process a single email
// ─────────────────────────────────────────────

async function processEmail(parsedEmail, activeJobdesks) {
  const subject   = (parsedEmail.subject || '').trim();
  const from      = parsedEmail.from?.value?.[0];
  const fromEmail = from?.address || '';
  const fromName  = from?.name || fromEmail.split('@')[0];

  console.log(`Processing: "${subject}" from ${fromEmail}`);

  const normSubject = normalizeStr(subject);

  // ── Peringkat Pencocokan (Prioritaskan pencocokan NAMA PT + POSISI) ──
  let matchedJob = null;

  // Priority 1: Match persis full email_subject (cth: "LAMARAN KERJA - BACK END - PT ABC")
  matchedJob = activeJobdesks.find(job => {
    const normJobSubject = normalizeStr(job.email_subject);
    return normJobSubject && (normSubject.includes(normJobSubject) || normJobSubject.includes(normSubject));
  });

  // Priority 2: Match Posisi AND Nama PT (cth: subjek email punya kata "BACK END" DAN "PT ABC")
  if (!matchedJob) {
    matchedJob = activeJobdesks.find(job => {
      const normKeyword = normalizeStr(job.subject_keyword || job.title);
      const normCompany = normalizeStr(job.company);
      if (normKeyword && normCompany) {
        return normSubject.includes(normKeyword) && normSubject.includes(normCompany);
      }
      return false;
    });
  }

  // Priority 3: Fallback ke match Posisi / Keyword saja (jika nama PT di subjek tidak ditulis pelamar)
  if (!matchedJob) {
    matchedJob = activeJobdesks.find(job => {
      const normKeyword = normalizeStr(job.subject_keyword || job.title);
      return normKeyword && normSubject.includes(normKeyword);
    });
  }

  if (!matchedJob) {
    const available = activeJobdesks.map(j => `${j.title} (${j.company || 'No Company'})`).join(', ');
    console.log(`  Skipped: Subject "${subject}" does not match active jobdesks. (Active jobdesks: ${available})`);
    return null;
  }

  console.log(`  ✅ Matched: "${matchedJob.title}" - ${matchedJob.company || 'N/A'} (Job ID: ${matchedJob.id})`);

  // Skip jika pelamar & jobdesk ini sudah pernah diproses
  const [existing] = await pool.query(
    'SELECT id FROM applicants WHERE email = ? AND jobdesk_id = ?',
    [fromEmail, matchedJob.id]
  );
  if (existing.length > 0) {
    console.log(`  Skipped (already processed): ${fromEmail} for job ID ${matchedJob.id}`);
    return null;
  }

  // Ekstrak teks CV dari attachment
  let cvText = parsedEmail.text || '';
  let cvPath = null;
  let cvFilename = null;

  if (parsedEmail.attachments?.length > 0) {
    for (const att of parsedEmail.attachments) {
      const ext = path.extname(att.filename || '').toLowerCase();
      if (['.pdf', '.doc', '.docx', '.txt'].includes(ext)) {
        console.log(`  Extracting CV attachment: ${att.filename}...`);
        const extracted = await extractCVText(att);
        if (extracted && extracted.length > 50) {
          cvText = extracted;
          const saved = saveAttachment(att.content, att.filename);
          cvPath     = saved.filePath;
          cvFilename = saved.safeName;
          console.log(`  Extracted ${extracted.length} chars from ${att.filename}`);
          break;
        }
      }
    }
  }

  if (!cvText || cvText.length < 20) {
    cvText = parsedEmail.text || 'No CV content';
  }

  // Score dengan TalentSift v2
  console.log(`  Scoring CV with TalentSift v2...`);
  const scoreResult = await scoreCVAgainstJob(cvText, matchedJob.description || matchedJob.title);
  console.log(`  Score: ${scoreResult.score}% → ${scoreResult.label}`);

  // Simpan ke database
  const [result] = await pool.query(
    `INSERT INTO applicants
     (jobdesk_id, name, email, cv_filename, cv_path, cv_text, match_score, screening_status, email_status, received_at, requirement_analysis, insight_summary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Integrated', NOW(), ?, ?)`,
    [
      matchedJob.id,
      fromName,
      fromEmail,
      cvFilename,
      cvPath,
      cvText.substring(0, 50000),
      scoreResult.score,
      scoreResult.label,
      JSON.stringify(scoreResult.requirement_analysis || []),
      JSON.stringify(scoreResult.insight_summary || null)
    ]
  );

  console.log(`  🎉 Saved applicant: ${fromName} (ID: ${result.insertId}) for ${matchedJob.company || 'Job'} (${matchedJob.title})`);
  return result.insertId;
}

// ─────────────────────────────────────────────
// Main IMAP poller
// ─────────────────────────────────────────────

function pollInbox() {
  const user     = process.env.IMAP_USER;
  const password = process.env.IMAP_PASS;

  if (!user || !password) {
    console.log('IMAP not configured — email polling disabled');
    return;
  }

  const imap = new Imap({
    user,
    password,
    host:         process.env.IMAP_HOST || 'imap.gmail.com',
    port:         parseInt(process.env.IMAP_PORT) || 993,
    tls:          process.env.IMAP_TLS !== 'false',
    tlsOptions:   { rejectUnauthorized: false },
    connTimeout:  30000,   // 30 detik untuk konek
    authTimeout:  15000,   // 15 detik untuk auth
    keepalive:    false,
  });

  imap.once('error', (err) => {
    console.error('IMAP error:', err.message);
  });

  imap.once('ready', () => {
    imap.openBox('INBOX', false, async (err) => {
      if (err) {
        console.error('IMAP openBox error:', err.message);
        imap.end();
        return;
      }

      let activeJobdesks;
      try {
        activeJobdesks = await getActiveEmailSubjects();
      } catch (dbErr) {
        console.error('DB error getting jobdesks:', dbErr.message);
        imap.end();
        return;
      }

      if (!activeJobdesks.length) {
        imap.end();
        return;
      }

      // Hanya email hari ini yang belum dibaca
      const today   = new Date();
      const dateStr = today.toLocaleDateString('en-US', {
        day: '2-digit', month: 'short', year: 'numeric',
      });

      imap.search(['UNSEEN', ['SINCE', dateStr]], (searchErr, results) => {
        if (searchErr || !results || results.length === 0) {
          console.log('No new emails today');
          imap.end();
          return;
        }

        console.log(`${results.length} unread email(s) today — processing...`);

        const fetch = imap.fetch(results, { bodies: '', markSeen: false });

        fetch.on('message', (msg) => {
          const chunks = [];
          msg.on('body', (stream) => {
            stream.on('data', c => chunks.push(c));
            stream.once('end', async () => {
              try {
                const parsed = await simpleParser(Buffer.concat(chunks));

                // Tandai sebagai SEEN
                msg.once('attributes', (attrs) => {
                  imap.addFlags(attrs.uid, ['\\Seen'], () => {});
                });

                await processEmail(parsed, activeJobdesks);
              } catch (e) {
                console.error('Parse error:', e.message);
              }
            });
          });
        });

        fetch.once('error', (e) => {
          console.error('Fetch error:', e.message);
          imap.end();
        });

        fetch.once('end', () => {
          imap.end();
        });
      });
    });
  });

  imap.connect();
}

// ─────────────────────────────────────────────
// Start periodic polling
// ─────────────────────────────────────────────

function startEmailPoller() {
  const intervalMinutes = parseInt(process.env.EMAIL_POLL_INTERVAL) || 5;
  console.log(`Email poller started (interval: ${intervalMinutes} min)`);
  pollInbox();
  setInterval(pollInbox, intervalMinutes * 60 * 1000);
}

module.exports = { startEmailPoller, pollInbox };
