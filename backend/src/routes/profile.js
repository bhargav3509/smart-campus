const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../config/db');
const upload = require('../utils/upload');
const { uploadToS3 } = require('../utils/s3');

// Get my profile
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, department, phone, branch, section, uid, bio, avatar_url, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update my profile
router.put('/me', auth, async (req, res) => {
  const { name, phone, department, branch, section, uid, bio } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        department = COALESCE($3, department),
        branch = COALESCE($4, branch),
        section = COALESCE($5, section),
        uid = COALESCE($6, uid),
        bio = COALESCE($7, bio)
       WHERE id = $8
       RETURNING id, name, email, role, department, phone, branch, section, uid, bio, avatar_url`,
      [name, phone, department, branch, section, uid, bio, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'UID already taken by another user' });
    }
    res.status(500).json({ message: err.message });
  }
});

// Upload avatar
router.put('/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const avatar_url = await uploadToS3(req.file, 'avatars');
    const result = await pool.query(
      `UPDATE users SET avatar_url = $1 WHERE id = $2
       RETURNING id, name, email, role, department, phone, branch, section, uid, bio, avatar_url`,
      [avatar_url, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get any user profile by id (admin only)
router.get('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }
    const result = await pool.query(
      `SELECT id, name, email, role, department, phone, branch, section, uid, bio, avatar_url, created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;