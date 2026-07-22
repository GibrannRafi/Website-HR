/**
 * TalentSift v2 — Node.js Bridge ke Python Scorer Service
 *
 * Python Flask service (ml/scorer_service.py) yang load model .pkl / SBERT
 * berjalan di http://localhost:5001 (atau https://... di production)
 *
 * Node.js ini memanggil Flask via HTTP/HTTPS dan mengembalikan hasil scoring.
 */

const http = require('http');
const https = require('https');

const SCORER_URL = process.env.SCORER_URL || 'http://localhost:5001';

/**
 * Helper: POST ke Python Flask scorer (dukung http dan https)
 */
function postToScorer(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const url = new URL(endpoint, SCORER_URL);
    const client = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Invalid JSON from scorer service'));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Scorer service unreachable: ${err.message}. Pastikan scorer_service.py berjalan.`));
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Scorer service timeout'));
    });

    req.write(body);
    req.end();
  });
}

/**
 * Cek apakah Python scorer service aktif (dukung http dan https)
 */
async function isScorerAvailable() {
  return new Promise((resolve) => {
    try {
      const url = new URL('/health', SCORER_URL);
      const client = url.protocol === 'https:' ? https : http;

      const req = client.get(url.href, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(3000, () => { req.destroy(); resolve(false); });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Score satu CV terhadap satu job description
 * Memanggil Python Flask /score endpoint
 *
 * @param {string} cvText - Text CV yang sudah di-extract
 * @param {string} jobDescription - Deskripsi jobdesk
 * @returns {{ score, label, requirement_analysis, insight_summary, raw_score }}
 */
async function scoreCVAgainstJob(cvText, jobDescription) {
  if (!cvText || !jobDescription) {
    return { score: 0, label: 'Review Needed', requirement_analysis: [], insight_summary: null, raw_score: 0 };
  }

  try {
    const result = await postToScorer('/score', {
      cv_text: cvText,
      job_description: jobDescription,
    });

    if (result.error) throw new Error(result.error);

    return {
      score: result.score,
      label: result.label,
      requirement_analysis: result.requirement_analysis || [],
      insight_summary: result.insight_summary || null,
      raw_score: result.raw_score || 0,
    };
  } catch (err) {
    console.error('⚠️ Scorer service error:', err.message);
    return {
      score: 0,
      label: 'Review Needed',
      requirement_analysis: [],
      insight_summary: null,
      raw_score: 0,
      error: err.message,
    };
  }
}

/**
 * Batch score banyak applicants sekaligus
 * Memanggil Python Flask /score-batch endpoint
 *
 * @param {Array} applicants - [{ id, cv_text }, ...]
 * @param {string} jobDescription
 * @returns {Array} [{ id, score, label, requirement_analysis, insight_summary }, ...]
 */
async function batchScore(applicants, jobDescription) {
  if (!applicants?.length || !jobDescription) return [];

  try {
    const result = await postToScorer('/score-batch', {
      applicants: applicants.map((a) => ({ id: a.id, cv_text: a.cv_text || '' })),
      job_description: jobDescription,
    });

    if (result.error) throw new Error(result.error);

    return result.results || [];
  } catch (err) {
    console.error('⚠️ Batch scorer error:', err.message);
    return applicants.map((a) => ({ id: a.id, score: 0, label: 'Review Needed' }));
  }
}

module.exports = { scoreCVAgainstJob, batchScore, isScorerAvailable };
