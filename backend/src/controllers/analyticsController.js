const pool = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    const [users, events, venues, bookings, registrations, topEvents] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'faculty' THEN 1 ELSE 0 END) as faculty,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
        FROM users`),

      pool.query(`SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft
        FROM events`),

      pool.query(`SELECT COUNT(*) as total FROM venues WHERE is_active = true`),

      pool.query(`SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
        FROM bookings`),

      pool.query(`SELECT COUNT(*) as total FROM registrations WHERE status != 'cancelled'`),

      pool.query(`SELECT title, registration_count, max_attendees, venue_name
        FROM event_stats
        ORDER BY registration_count DESC
        LIMIT 5`)
    ]);

    res.json({
      users: users.rows[0],
      events: events.rows[0],
      venues: venues.rows[0],
      bookings: bookings.rows[0],
      registrations: registrations.rows[0],
      topEvents: topEvents.rows
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};