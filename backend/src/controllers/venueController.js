const pool = require('../config/db');

// Get all venues
exports.getVenues = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM venues WHERE is_active = true ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single venue
exports.getVenue = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM venues WHERE id = $1', [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create venue (admin only)
exports.createVenue = async (req, res) => {
  const { name, capacity, location, amenities } = req.body;
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }
    const result = await pool.query(
      'INSERT INTO venues (name, capacity, location, amenities) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, capacity, location, amenities || {}]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update venue (admin only)
exports.updateVenue = async (req, res) => {
  const { name, capacity, location, amenities, is_active } = req.body;
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }
    const result = await pool.query(
      'UPDATE venues SET name=$1, capacity=$2, location=$3, amenities=$4, is_active=$5 WHERE id=$6 RETURNING *',
      [name, capacity, location, amenities || {}, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};