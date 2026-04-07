const {
  sendRegistrationConfirmation,
  sendEventPublishedEmail,
  sendRegistrationCancelledEmail,
} = require('../services/emailService');
const pool = require('../config/db');
const { uploadToS3 } = require('../utils/s3');

// Get all events
// Get all events (with optional search & filter)
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

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND e.status = $${params.length}`;
    } else if (!status && req.user.role !== 'admin') {
      // Students and faculty only see published events
      query += ` AND e.status = 'published'`;
    }
    // admin with no status filter or status=all sees everything

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

    let poster_url = null;
    if (req.file) {
      poster_url = await uploadToS3(req.file, 'posters');
    }

    const result = await pool.query(
      `INSERT INTO events (title, description, organizer_id, venue_id, start_time, end_time, max_attendees, poster_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, req.user.id, venue_id, start_time, end_time, max_attendees, poster_url]
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
    const event = result.rows[0];

    // Get venue name
    const venueResult = await pool.query(
      'SELECT name FROM venues WHERE id = $1', [event.venue_id]
    );
    event.venue_name = venueResult.rows[0]?.name || 'TBA';

    // Notify all students
    const students = await pool.query(
      `SELECT id, name, email FROM users WHERE role = 'student'`
    );
    for (const student of students.rows) {
      sendEventPublishedEmail(student.email, student.name, event);
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Register for event (RSVP)
exports.registerForEvent = async (req, res) => {
  try {
    const eventResult = await pool.query(
      `SELECT e.*, v.name as venue_name FROM events e
       LEFT JOIN venues v ON e.venue_id = v.id
       WHERE e.id = $1`, [req.params.id]
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

    // Send confirmation email
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];
    const event = eventResult.rows[0];
    sendRegistrationConfirmation(user.email, user.name, event);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Update event poster
exports.updateEventPoster = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const poster_url = await uploadToS3(req.file, 'posters');
    const result = await pool.query(
      `UPDATE events SET poster_url = $1 WHERE id = $2 RETURNING *`,
      [poster_url, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const QRCode = require('qrcode');

// Generate QR code for event registration
exports.getEventQR = async (req, res) => {
  try {
    const { id } = req.params;

    // Check event exists
    const result = await pool.query(
      `SELECT e.*, v.name as venue_name FROM events e
       LEFT JOIN venues v ON e.venue_id = v.id
       WHERE e.id = $1`, [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = result.rows[0];

    // QR code contains a registration URL
    const qrData = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register-event/${id}`;

    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1d4ed8',
        light: '#ffffff',
      },
    });

    res.json({
      qr_code: qrCodeBase64,
      event_id: id,
      event_title: event.title,
      venue: event.venue_name,
      start_time: event.start_time,
      registration_url: qrData,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};