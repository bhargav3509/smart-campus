const pool = require('../config/db');

// Get notifications for logged-in user
exports.getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark a notification as read
exports.markRead = async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark all as read
exports.markAllRead = async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper to create a notification (used internally by other controllers)
exports.createNotification = async (userId, message) => {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, message) VALUES ($1, $2)`,
      [userId, message]
    );
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};