const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
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

module.exports = router;