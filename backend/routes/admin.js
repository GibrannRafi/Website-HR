const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const adminAuth = require('../middlewares/adminAuth');

/**
 * GET /api/admin/stats
 * Statistik global platform untuk dashboard admin
 */
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [[totalHR]] = await pool.query("SELECT COUNT(*) as total FROM users WHERE role = 'hr'");
    const [[totalJobs]] = await pool.query('SELECT COUNT(*) as total FROM jobdesks');
    const [[totalApplicants]] = await pool.query('SELECT COUNT(*) as total FROM applicants');
    const [[avgScore]] = await pool.query('SELECT AVG(match_score) as avg FROM applicants WHERE match_score > 0');
    const [[hired]] = await pool.query("SELECT COUNT(*) as total FROM applicants WHERE screening_status = 'Hired'");
    const [[activeJobs]] = await pool.query("SELECT COUNT(*) as total FROM jobdesks WHERE status = 'active'");

    res.json({
      totalHR: totalHR.total,
      totalJobs: totalJobs.total,
      totalApplicants: totalApplicants.total,
      avgScore: Math.round((avgScore.avg || 0) * 10) / 10,
      hired: hired.total,
      activeJobs: activeJobs.total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/admin/users
 * Daftar semua HR user beserta statistiknya
 */
router.get('/users', adminAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.company, u.role, u.created_at,
        COUNT(DISTINCT j.id) as total_jobs,
        COUNT(DISTINCT a.id) as total_applicants
      FROM users u
      LEFT JOIN jobdesks j ON j.created_by = u.id
      LEFT JOIN applicants a ON a.jobdesk_id = j.id
      WHERE u.role = 'hr'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Nonaktifkan / aktifkan akun HR (set role)
 */
router.patch('/users/:id/status', adminAuth, async (req, res) => {
  const { action } = req.body; // 'activate' | 'deactivate'
  try {
    const [[user]] = await pool.query("SELECT id, role FROM users WHERE id = ? AND role = 'hr'", [req.params.id]);
    if (!user) return res.status(404).json({ message: 'HR user not found' });

    // Kita pakai kolom is_active jika ada, atau simpan di role
    // Untuk simplicity: deactivate = set role ke 'inactive', activate = set ke 'hr'
    const newRole = action === 'deactivate' ? 'inactive' : 'hr';
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [newRole, req.params.id]);
    res.json({ message: `User ${action}d successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Hapus akun HR
 */
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const [[user]] = await pool.query("SELECT id FROM users WHERE id = ? AND role != 'admin'", [req.params.id]);
    if (!user) return res.status(404).json({ message: 'User not found or cannot delete admin' });
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/admin/activity
 * Aktivitas terbaru di seluruh platform
 */
router.get('/activity', adminAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.id, a.name as applicant_name, a.email, a.match_score,
        a.screening_status, a.received_at,
        j.title as job_title,
        u.name as hr_name, u.company
      FROM applicants a
      JOIN jobdesks j ON a.jobdesk_id = j.id
      JOIN users u ON j.created_by = u.id
      ORDER BY a.received_at DESC
      LIMIT 20
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
