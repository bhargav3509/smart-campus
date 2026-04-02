const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../config/db');
const { sendRegistrationCancelledEmail } = require('../services/emailService');

// Get my registrations
router.get('/my', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, e.title as event_title, e.start_time, e.end_time, v.name as venue_name
       FROM registrations r
       LEFT JOIN events e ON r.event_id = e.id
       LEFT JOIN venues v ON e.venue_id = v.id
       WHERE r.user_id = $1
       ORDER BY r.registered_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cancel registration
router.delete('/:eventId', auth, async (req, res) => {
  try {
    // Get event title and user info before deleting
    const eventResult = await pool.query(
      'SELECT title FROM events WHERE id = $1', [req.params.eventId]
    );
    const userResult = await pool.query(
      'SELECT name, email FROM users WHERE id = $1', [req.user.id]
    );

    await pool.query(
      'DELETE FROM registrations WHERE event_id = $1 AND user_id = $2',
      [req.params.eventId, req.user.id]
    );

    // Send cancellation email
    if (eventResult.rows[0] && userResult.rows[0]) {
      sendRegistrationCancelledEmail(
        userResult.rows[0].email,
        userResult.rows[0].name,
        eventResult.rows[0].title
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;