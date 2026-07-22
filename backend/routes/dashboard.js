const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middlewares/auth');

/**
 * GET /api/dashboard/stats
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const [[applicantsRow]] = await pool.query(
      'SELECT COUNT(a.id) as total FROM applicants a JOIN jobdesks j ON a.jobdesk_id = j.id WHERE j.created_by = ?',
      [req.user.id]
    );
    const [[jobdesksRow]] = await pool.query(
      'SELECT COUNT(*) as total FROM jobdesks WHERE status = "active" AND created_by = ?',
      [req.user.id]
    );
    const [[pendingRow]] = await pool.query(
      'SELECT COUNT(a.id) as total FROM applicants a JOIN jobdesks j ON a.jobdesk_id = j.id WHERE a.screening_status = "Screening" AND j.created_by = ?',
      [req.user.id]
    );
    const [[avgRow]] = await pool.query(
      'SELECT AVG(a.match_score) as avg FROM applicants a JOIN jobdesks j ON a.jobdesk_id = j.id WHERE a.match_score > 0 AND j.created_by = ?',
      [req.user.id]
    );

    res.json({
      totalApplicants: applicantsRow.total,
      activeJobdesks: jobdesksRow.total,
      pendingScreenings: pendingRow.total,
      matchAvg: Math.round((avgRow.avg || 0) * 10) / 10,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/dashboard/activities
 */
router.get('/activities', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.id,
        a.name,
        a.screening_status,
        a.received_at,
        j.title as job_title
      FROM applicants a
      JOIN jobdesks j ON a.jobdesk_id = j.id
      WHERE j.created_by = ?
      ORDER BY a.received_at DESC
      LIMIT 10
    `, [req.user.id]);

    const activities = rows.map(r => ({
      id: r.id,
      type: r.screening_status === 'Final Interview' ? 'interview'
            : r.screening_status === 'Hired' ? 'offer'
            : 'screening',
      title: `New Applicant for ${r.job_title}`,
      subtitle: `${r.name} • ${new Date(r.received_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      tag: r.screening_status,
      tagClass: r.screening_status === 'Final Interview' ? 'badge-active'
                : r.screening_status === 'Hired' ? 'px-3 py-1 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold rounded-full uppercase tracking-tight'
                : 'badge-secondary',
    }));

    res.json(activities);
  } catch (err) {
    console.error('Activities error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
