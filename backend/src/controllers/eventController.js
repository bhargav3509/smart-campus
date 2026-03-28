const pool = require('../config/db');

// Get all events
// Get all events (with optional search & filter)
exports.getEvents = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = `
      SELECT e.*, u.name as organizer_name, v.name as venue_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN venues v ON e.venue_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (e.title ILIKE $${params.length} OR e.description ILIKE $${params.length})`;
    }

    if (status) {
      params.push(status);
      query += ` AND e.status = $${params.length}`;
    } else {
      query += ` AND e.status = 'published'`;
    }

    query += ` ORDER BY e.start_time ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single event
exports.getEvent = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, u.name as organizer_name, v.name as venue_name
       FROM events e
       LEFT JOIN users u ON e.organizer_id = u.id
       LEFT JOIN venues v ON e.venue_id = v.id
       WHERE e.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create event
exports.createEvent = async (req, res) => {
  const { title, description, venue_id, start_time, end_time, max_attendees } = req.body;
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Faculty or Admin only' });
    }
    const result = await pool.query(
      `INSERT INTO events (title, description, organizer_id, venue_id, start_time, end_time, max_attendees)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, req.user.id, venue_id, start_time, end_time, max_attendees]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Publish event (admin approves)
exports.publishEvent = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }
    const result = await pool.query(
      `UPDATE events SET status = 'published' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Register for event (RSVP)
exports.registerForEvent = async (req, res) => {
  try {
    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1', [req.params.id]
    );
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const existing = await pool.query(
      'SELECT * FROM registrations WHERE event_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Already registered' });
    }

    const result = await pool.query(
      'INSERT INTO registrations (event_id, user_id) VALUES ($1, $2) RETURNING *',
      [req.params.id, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};