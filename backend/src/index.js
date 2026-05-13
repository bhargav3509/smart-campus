// Force IPv4 DNS resolution — Render free tier doesn't support IPv6 outbound (smtp.gmail.com fails with ENETUNREACH on IPv6)
require('dns').setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const pool = require('./config/db');
const redis = require('./config/redis');
const authRoutes = require('./routes/auth');
const venueRoutes = require('./routes/venues');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const notificationRoutes = require('./routes/notifications');
const registrationRoutes = require('./routes/registrations');
const analyticsRoutes = require('./routes/analytics');
const profileRoutes = require('./routes/profile');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'EveSphere API is running!' });
});

// Health check — keeps Supabase active (prevents free-tier pause) and Render warm
app.get('/health', async (req, res) => {
  const status = { status: 'ok', db: 'unknown', redis: 'unknown', timestamp: new Date().toISOString() };
  try {
    await pool.query('SELECT 1');
    status.db = 'connected';
  } catch (err) {
    status.db = 'error';
    status.status = 'degraded';
  }
  try {
    const redisClient = redis.getClient ? redis.getClient() : redis;
    if (redisClient && redisClient.ping) {
      await redisClient.ping();
      status.redis = 'connected';
    } else {
      status.redis = 'unavailable';
    }
  } catch {
    status.redis = 'unavailable';
  }
  const httpStatus = status.status === 'ok' ? 200 : 207;
  res.status(httpStatus).json(status);
});
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/profile', profileRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;