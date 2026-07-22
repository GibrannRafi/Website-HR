const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * SMTP Transporter untuk mengirim email ke pelamar
 * Konfigurasi: gunakan Gmail dengan App Password
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP connection
transporter.verify((err, success) => {
  if (err) {
    console.warn('⚠️  SMTP not configured. Email sending will be disabled.', err.message);
  } else {
    console.log('✅ SMTP ready for sending emails');
  }
});

/**
 * Kirim email ke pelamar
 * @param {Object} options - { to, subject, html, text }
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({
      from: `"Atelier HR" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Template email undangan interview
 */
function interviewInvitationTemplate({ applicantName, jobTitle, hrName, scheduleInfo }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Inter', Arial, sans-serif; background: #fcf8f9; margin: 0; padding: 40px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(15,23,42,0.06); }
    .header { background: #565e74; padding: 40px; text-align: center; }
    .header h1 { color: #f7f7ff; font-size: 24px; margin: 0; letter-spacing: -0.5px; }
    .body { padding: 40px; color: #323235; }
    .body h2 { font-size: 20px; color: #323235; margin-bottom: 16px; }
    .body p { font-size: 15px; line-height: 1.7; color: #5f5f61; margin-bottom: 16px; }
    .highlight { background: #dae2fd; color: #373f54; padding: 16px 24px; border-radius: 10px; font-weight: 600; margin: 24px 0; }
    .footer { background: #f0edef; padding: 24px 40px; text-align: center; font-size: 12px; color: #7b7a7d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Atelier HR</h1>
    </div>
    <div class="body">
      <h2>Undangan Interview — ${jobTitle}</h2>
      <p>Yth. <strong>${applicantName}</strong>,</p>
      <p>Terima kasih telah melamar posisi <strong>${jobTitle}</strong> di perusahaan kami. Setelah melalui proses seleksi awal, kami dengan senang hati mengundang Anda untuk mengikuti sesi interview.</p>
      <div class="highlight">
        ${scheduleInfo || 'Detail jadwal akan diinformasikan segera melalui email lanjutan.'}
      </div>
      <p>Mohon konfirmasi kehadiran Anda dengan membalas email ini. Jika ada pertanyaan, jangan ragu untuk menghubungi kami.</p>
      <p>Salam hangat,<br><strong>${hrName || 'Tim HR Atelier'}</strong></p>
    </div>
    <div class="footer">
      <p>© 2024 Atelier HR Management. Confidential.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

module.exports = { sendEmail, interviewInvitationTemplate };
