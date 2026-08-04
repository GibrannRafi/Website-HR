const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  const { name, email, company, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  try {
    // Check existing user
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, company) VALUES (?, ?, ?, ?)',
      [name, email, hashed, company || '']
    );

    res.status(201).json({
      message: 'Registration successful',
      userId: result.insertId,
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    let users;
    try {
      [users] = await pool.query(
        'SELECT id, name, email, password, company, role FROM users WHERE email = ?',
        [email]
      );
    } catch (err) {
      // Fallback for production DB if 'role' column is not yet migrated
      [users] = await pool.query(
        'SELECT id, name, email, password, company FROM users WHERE email = ?',
        [email]
      );
    }

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not configured');
    }

    const userRole = user.role || 'hr';

    const token = jwt.sign(
      { id: user.id, email: user.email, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        role: userRole,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;
