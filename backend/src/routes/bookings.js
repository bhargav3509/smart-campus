const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../config/db');
const {
  getBookings,
  createBooking,
  updateBookingStatus,
  cancelBooking
} = require('../controllers/bookingController');

router.get('/', auth, getBookings);
router.post('/', auth, createBooking);
router.put('/:id/status', auth, updateBookingStatus);
router.put('/:id/cancel', auth, cancelBooking);
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;