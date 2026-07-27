const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middlewares/auth');
const { batchScore } = require('../ml/scorer');

/**
 * GET /api/jobdesks
 */
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        j.*,
        COUNT(a.id) as candidate_count
      FROM jobdesks j
      LEFT JOIN applicants a ON j.id = a.jobdesk_id
      WHERE j.created_by = ?
      GROUP BY j.id
      ORDER BY j.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/jobdesks/stats
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const [[totalRow]] = await pool.query('SELECT COUNT(*) as total FROM jobdesks WHERE status != "closed" AND created_by = ?', [req.user.id]);
    res.json({
      totalOpenings: totalRow.total,
      appConversion: 75,
      interviewCompletion: 50,
      avgTimeToHire: 18,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/jobdesks/:id
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const [[job]] = await pool.query('SELECT * FROM jobdesks WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!job) return res.status(404).json({ message: 'Jobdesk not found or access denied' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/jobdesks/:id/applicants
 */
router.get('/:id/applicants', auth, async (req, res) => {
  try {
    // Verify ownership first
    const [[job]] = await pool.query('SELECT id FROM jobdesks WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!job) return res.status(403).json({ message: 'Access denied' });

    const [rows] = await pool.query(
      'SELECT * FROM applicants WHERE jobdesk_id = ? ORDER BY match_score DESC',
      [req.params.id]
    );
    const parsedRows = rows.map(r => ({
      ...r,
      requirement_analysis: typeof r.requirement_analysis === 'string' ? JSON.parse(r.requirement_analysis) : r.requirement_analysis || [],
      insight_summary: typeof r.insight_summary === 'string' ? JSON.parse(r.insight_summary) : r.insight_summary || null
    }));
    res.json(parsedRows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/jobdesks/:id/summary
 */
router.get('/:id/summary', auth, async (req, res) => {
  try {
    // Verify ownership first
    const [[job]] = await pool.query('SELECT id FROM jobdesks WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!job) return res.status(403).json({ message: 'Access denied' });

    const [[inScreening]] = await pool.query(
      'SELECT COUNT(*) as total FROM applicants WHERE jobdesk_id = ? AND screening_status = "Screening"',
      [req.params.id]
    );
    const [[interviewed]] = await pool.query(
      'SELECT COUNT(*) as total FROM applicants WHERE jobdesk_id = ? AND screening_status IN ("Technical Test","Final Interview")',
      [req.params.id]
    );
    const [[onHold]] = await pool.query(
      'SELECT COUNT(*) as total FROM applicants WHERE jobdesk_id = ? AND screening_status = "Review Needed"',
      [req.params.id]
    );
    const [[avgScore]] = await pool.query(
      'SELECT AVG(match_score) as avg FROM applicants WHERE jobdesk_id = ? AND match_score > 0',
      [req.params.id]
    );

    res.json({
      inScreening: inScreening.total,
      interviewed: interviewed.total,
      onHold: onHold.total,
      avgScore: Math.round((avgScore.avg || 0) * 10) / 10,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/jobdesks
 * Create a new jobdesk with automated Email Subject:
 * LAMARAN KERJA - {NAMA POSISI} - {NAMA PERUSAHAAN}
 */
router.post('/', auth, async (req, res) => {
  const { title, department, experience_level, description } = req.body;
  if (!title || !department) {
    return res.status(400).json({ message: 'title and department are required' });
  }
  try {
    // Fetch HR user company
    const [[user]] = await pool.query('SELECT company FROM users WHERE id = ?', [req.user.id]);
    const companyName = (user?.company || '').trim().toUpperCase() || 'PT ABC INDONESIA';
    
    const cleanTitle = title.trim().toUpperCase();
    const subjectKeyword = cleanTitle;
    const emailSubject = `LAMARAN KERJA - ${cleanTitle} - ${companyName}`;

    const [result] = await pool.query(
      `INSERT INTO jobdesks (title, subject_keyword, email_subject, department, experience_level, description, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
      [title.trim(), subjectKeyword, emailSubject, department, experience_level || 'Mid-level', description || '', req.user.id]
    );
    const [[created]] = await pool.query('SELECT * FROM jobdesks WHERE id = ?', [result.insertId]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/jobdesks/:id
 * Update a jobdesk
 */
router.put('/:id', auth, async (req, res) => {
  const { title, department, experience_level, description, status } = req.body;
  if (!title || !department) {
    return res.status(400).json({ message: 'title and department are required' });
  }
  try {
    // Fetch existing jobdesk to preserve or update email subject
    const [[job]] = await pool.query('SELECT * FROM jobdesks WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!job) {
      return res.status(403).json({ message: 'Access denied or Jobdesk not found' });
    }

    // Fetch HR user company
    const [[user]] = await pool.query('SELECT company FROM users WHERE id = ?', [req.user.id]);
    const companyName = (user?.company || '').trim().toUpperCase() || 'PT ABC INDONESIA';

    const cleanTitle = title.trim().toUpperCase();
    const subjectKeyword = cleanTitle;
    const emailSubject = `LAMARAN KERJA - ${cleanTitle} - ${companyName}`;

    const [result] = await pool.query(
      `UPDATE jobdesks SET title=?, subject_keyword=?, email_subject=?, department=?, experience_level=?, description=?, status=?
       WHERE id = ? AND created_by = ?`,
      [title.trim(), subjectKeyword, emailSubject, department, experience_level, description, status || 'active', req.params.id, req.user.id]
    );

    const [[updated]] = await pool.query('SELECT * FROM jobdesks WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/jobdesks/:id
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM jobdesks WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (result.affectedRows === 0) {
      return res.status(403).json({ message: 'Access denied or Jobdesk not found' });
    }
    res.json({ message: 'Jobdesk deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/jobdesks/:id/rescore
 * Re-run AI scoring for all applicants in this jobdesk
 */
router.post('/:id/rescore', auth, async (req, res) => {
  try {
    const [[job]] = await pool.query('SELECT * FROM jobdesks WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!job) return res.status(403).json({ message: 'Access denied' });

    const [applicants] = await pool.query(
      'SELECT id, cv_text FROM applicants WHERE jobdesk_id = ?',
      [req.params.id]
    );

    if (applicants.length === 0) {
      return res.json({ message: 'No applicants to score', updated: 0 });
    }

    const scored = await batchScore(applicants, job.description || job.title);

    // Update scores
    for (const s of scored) {
      await pool.query(
        'UPDATE applicants SET match_score = ?, screening_status = ?, requirement_analysis = ?, insight_summary = ? WHERE id = ?',
        [s.score, s.label, JSON.stringify(s.requirement_analysis || []), JSON.stringify(s.insight_summary || null), s.id]
      );
    }

    res.json({ message: 'Re-scoring complete', updated: scored.length, scores: scored });
  } catch (err) {
    console.error('Rescore error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
