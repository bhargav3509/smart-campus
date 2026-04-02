const pool = require('../config/db');
const { createNotification } = require('./notificationController');

// Get all bookings
exports.getBookings = async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'admin') {
      query = `SELECT b.*, u.name as user_name, v.name as venue_name
               FROM bookings b
               LEFT JOIN users u ON b.user_id = u.id
               LEFT JOIN venues v ON b.venue_id = v.id
               ORDER BY b.created_at DESC`;
      params = [];
    } else {
      query = `SELECT b.*, v.name as venue_name
               FROM bookings b
               LEFT JOIN venues v ON b.venue_id = v.id
               WHERE b.user_id = $1
               ORDER BY b.created_at DESC`;
      params = [req.user.id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create booking
exports.createBooking = async (req, res) => {
  const { venue_id, start_time, end_time } = req.body;
  try {
    const conflict = await pool.query(
      `SELECT * FROM bookings
       WHERE venue_id = $1
       AND status != 'cancelled'
       AND (start_time, end_time) OVERLAPS ($2::timestamp, $3::timestamp)`,
      [venue_id, start_time, end_time]
    );
    if (conflict.rows.length > 0) {
      return res.status(400).json({ message: 'Venue already booked for this time slot' });
    }
    const result = await pool.query(
      `INSERT INTO bookings (venue_id, user_id, start_time, end_time)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [venue_id, req.user.id, start_time, end_time]
    );

    // Notify all admins
    const admins = await pool.query(`SELECT id FROM users WHERE role = 'admin'`);
    const venueResult = await pool.query(`SELECT name FROM venues WHERE id = $1`, [venue_id]);
    const venueName = venueResult.rows[0]?.name || 'a venue';
    for (const admin of admins.rows) {
      await createNotification(admin.id, `New booking request for "${venueName}" from ${req.user.id}`);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Approve or Reject booking (admin only)
exports.updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    const result = await pool.query(
      `UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    const booking = result.rows[0];

    // Get venue name
    const venueResult = await pool.query(
      'SELECT name FROM venues WHERE id = $1', [booking.venue_id]
    );
    booking.venue_name = venueResult.rows[0]?.name || 'Unknown venue';

    // Notify the user
    const userResult = await pool.query(
      'SELECT name, email FROM users WHERE id = $1', [booking.user_id]
    );
    const user = userResult.rows[0];

    // Send email notification
    const { sendBookingStatusEmail } = require('../services/emailService');
    sendBookingStatusEmail(user.email, user.name, booking, status);

    // Also create in-app notification
    const { createNotification } = require('./notificationController');
    await createNotification(
      booking.user_id,
      `Your booking for "${booking.venue_name}" has been ${status}.`
    );

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE bookings SET status = 'cancelled'
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found or not yours' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};