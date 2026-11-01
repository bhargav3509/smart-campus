const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const authenticate = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

// GET /api/admin/users — List all users (admin + super_admin)
router.get('/users', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, department, is_active, university_id, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/accounts — Create a new admin account (super_admin only)
router.post('/accounts', authenticate, requireRole('super_admin'), async (req, res) => {
  const { university_id, email, name, password, department } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, department, university_id, is_active)
       VALUES ($1, $2, $3, 'admin', $4, $5, true)
       RETURNING id, name, email, role, department, is_active, university_id, created_at`,
      [name, email, hashedPassword, department, university_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'An account with this email or University ID already exists.' });
    }
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/status — Toggle is_active
router.put('/users/:id/status', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  const { is_active } = req.body;
  const targetId = parseInt(req.params.id, 10);

  try {
    // Fetch the target user's role first
    const targetRes = await pool.query('SELECT role FROM users WHERE id = $1', [targetId]);
    if (targetRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const targetRole = targetRes.rows[0].role;

    // Admin cannot deactivate other admins or super_admins
    if (req.user.role === 'admin' && ['admin', 'super_admin'].includes(targetRole)) {
      return res.status(403).json({ message: 'Access denied: insufficient privileges' });
    }

    const result = await pool.query(
      `UPDATE users SET is_active = $1 WHERE id = $2
       RETURNING id, name, email, role, department, is_active, university_id, created_at`,
      [is_active, targetId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/accounts/:id — Delete an admin account (super_admin only)
router.delete('/accounts/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  try {
    const targetRes = await pool.query('SELECT role FROM users WHERE id = $1', [targetId]);
    if (targetRes.rows.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (targetRes.rows[0].role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot delete a super_admin account.' });
    }
    await pool.query('DELETE FROM users WHERE id = $1', [targetId]);
    res.json({ message: 'Admin account deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/authorized-users — List all authorized_users records
router.get('/authorized-users', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM authorized_users ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

