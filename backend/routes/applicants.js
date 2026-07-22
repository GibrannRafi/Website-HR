const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middlewares/auth');
const { sendEmail, interviewInvitationTemplate } = require('../config/email');

/**
 * PATCH /api/applicants/:id/status
 * Update screening status
 */
router.patch('/:id/status', auth, async (req, res) => {
  const { screening_status } = req.body;
  const validStatuses = ['Screening', 'Shortlisted', 'Technical Test', 'Final Interview', 'Hired', 'Rejected', 'Review Needed'];
  if (!validStatuses.includes(screening_status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  try {
    const [[applicant]] = await pool.query(
      'SELECT a.id FROM applicants a JOIN jobdesks j ON a.jobdesk_id = j.id WHERE a.id = ? AND j.created_by = ?',
      [req.params.id, req.user.id]
    );
    if (!applicant) return res.status(403).json({ message: 'Access denied or Applicant not found' });

    await pool.query(
      'UPDATE applicants SET screening_status = ? WHERE id = ?',
      [screening_status, req.params.id]
    );
    const [[updated]] = await pool.query('SELECT * FROM applicants WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/applicants/:id/send-email
 * Send interview invitation email to applicant
 */
router.post('/:id/send-email', auth, async (req, res) => {
  try {
    const [[applicant]] = await pool.query(
      'SELECT a.*, j.title as job_title FROM applicants a JOIN jobdesks j ON a.jobdesk_id = j.id WHERE a.id = ? AND j.created_by = ?',
      [req.params.id, req.user.id]
    );
    if (!applicant) return res.status(404).json({ message: 'Applicant not found or access denied' });

    const html = interviewInvitationTemplate({
      applicantName: applicant.name,
      jobTitle: applicant.job_title,
      hrName: 'Tim HR Portal',
      scheduleInfo: 'Jadwal interview akan dikonfirmasi melalui email lanjutan.',
    });

    const result = await sendEmail({
      to: applicant.email,
      subject: `Undangan Interview — ${applicant.job_title}`,
      html,
      text: `Yth. ${applicant.name}, Anda diundang untuk interview posisi ${applicant.job_title}.`,
    });

    // Log email
    await pool.query(
      'INSERT INTO email_logs (applicant_id, jobdesk_id, subject, status, sent_at) VALUES (?, ?, ?, ?, NOW())',
      [
        applicant.id,
        applicant.jobdesk_id,
        `Undangan Interview — ${applicant.job_title}`,
        result.success ? 'sent' : 'failed',
      ]
    );

    if (result.success) {
      // Update email_status
      await pool.query('UPDATE applicants SET email_status = "Integrated" WHERE id = ?', [req.params.id]);
      res.json({ message: `Email sent to ${applicant.email}` });
    } else {
      res.status(500).json({ message: 'Email delivery failed', error: result.error });
    }
  } catch (err) {
    console.error('Send email error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/applicants/:id
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const [[applicant]] = await pool.query(
      'SELECT a.* FROM applicants a JOIN jobdesks j ON a.jobdesk_id = j.id WHERE a.id = ? AND j.created_by = ?',
      [req.params.id, req.user.id]
    );
    if (!applicant) return res.status(404).json({ message: 'Applicant not found or access denied' });
    res.json(applicant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/applicants/:id
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const [[applicant]] = await pool.query(
      'SELECT a.id FROM applicants a JOIN jobdesks j ON a.jobdesk_id = j.id WHERE a.id = ? AND j.created_by = ?',
      [req.params.id, req.user.id]
    );
    if (!applicant) return res.status(403).json({ message: 'Access denied or Applicant not found' });

    await pool.query('DELETE FROM applicants WHERE id = ?', [req.params.id]);
    res.json({ message: 'Applicant removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
