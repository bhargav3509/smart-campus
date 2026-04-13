const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

// ── Password strength validator ──
const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('one uppercase letter');
  if (!/[0-9]/.test(password)) errors.push('one number');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('one special character');
  return errors;
};

// Register
exports.register = async (req, res) => {
  const { name, email, password, role, department } = req.body;

  // Password validation
  const pwErrors = validatePassword(password || '');
  if (pwErrors.length > 0) {
    return res.status(400).json({
      message: `Password must contain ${pwErrors.join(', ')}.`
    });
  }

  try {
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
      [name, email, hashedPassword, role || 'student', department]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const user = result.rows[0];

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [hashedToken, expiry, user.id]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password/${rawToken}`;

    const { sendPasswordResetEmail } = require('../services/emailService');
    await sendPasswordResetEmail(user.email, user.name, resetLink);

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Password validation
  const pwErrors = validatePassword(password || '');
  if (pwErrors.length > 0) {
    return res.status(400).json({
      message: `Password must contain ${pwErrors.join(', ')}.`
    });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const result = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [hashedToken]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset link.' });
    }

    const user = result.rows[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};