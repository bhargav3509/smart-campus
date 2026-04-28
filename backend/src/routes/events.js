const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../utils/upload');
const pool = require('../config/db');
const {
  getEvents,
  getEvent,
  createEvent,
  publishEvent,
  registerForEvent,
  updateEventPoster,
  getEventQR
} = require('../controllers/eventController');

router.get('/', auth, getEvents);

// Faculty: get my own events (all statuses)
router.get('/my', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, v.name as venue_name
       FROM events e
       LEFT JOIN venues v ON e.venue_id = v.id
       WHERE e.organizer_id = $1
       ORDER BY e.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, getEvent);
router.get('/:id/qr', auth, getEventQR);
router.post('/', auth, upload.single('poster'), createEvent);
router.put('/:id/publish', auth, publishEvent);
router.put('/:id/poster', auth, upload.single('poster'), updateEventPoster);
router.post('/:id/register', auth, registerForEvent);
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }
    // Delete related registrations first, then the event
    await pool.query('DELETE FROM registrations WHERE event_id = $1', [req.params.id]);
    await pool.query('DELETE FROM bookings WHERE event_id = $1', [req.params.id]);
    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;