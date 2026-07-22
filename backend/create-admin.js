/**
 * Script sekali jalan: buat user HR demo
 * Jalankan: node create-admin.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function createAdmin() {
  try {
    // Cek apakah user sudah ada
    const [existing] = await pool.query('SELECT id, email FROM users');
    console.log('Users yang ada di DB:', existing);

    // Hash password baru
    const password = 'admin123';
    const hashed = await bcrypt.hash(password, 10);
    console.log('Hash baru:', hashed);

    // Insert / update admin
    const [result] = await pool.query(`
      INSERT INTO users (name, email, password, company)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE password = VALUES(password)
    `, ['HR Admin', 'admin@atelier.hr', hashed, 'Atelier HR']);

    console.log('');
    console.log('=== BERHASIL ===');
    console.log('Email   : admin@atelier.hr');
    console.log('Password: admin123');
    console.log('================');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createAdmin();
