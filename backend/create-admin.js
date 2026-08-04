require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function createAdmin() {
  try {
    // Check if role column exists first (MySQL < 8 doesn't support IF NOT EXISTS for columns)
    const [cols] = await pool.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'"
    );
    if (cols.length === 0) {
      await pool.query(
        "ALTER TABLE users ADD COLUMN role ENUM('admin', 'hr', 'inactive') NOT NULL DEFAULT 'hr' AFTER company"
      );
      console.log('✅ Role column added');
    } else {
      console.log('✅ Role column already exists');
    }

    const email = 'admin@portalhr.com';
    const password = 'Admin@1234';
    const hashed = await bcrypt.hash(password, 10);

    // Check if admin exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      // Update existing to admin
      await pool.query("UPDATE users SET role = 'admin', password = ? WHERE email = ?", [hashed, email]);
      console.log('✅ Admin account updated!');
    } else {
      await pool.query(
        "INSERT INTO users (name, email, password, company, role) VALUES (?, ?, ?, ?, 'admin')",
        ['Administrator', email, hashed, 'Portal HR System']
      );
      console.log('✅ Admin account created!');
    }

    console.log(`📧 Email   : ${email}`);
    console.log(`🔑 Password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAdmin();
