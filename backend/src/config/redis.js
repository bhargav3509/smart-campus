const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({
  url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
});

client.on('connect', () => {
  console.log('Connected to Redis successfully!');
});

client.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

client.connect().catch(err => {
  console.error('Redis failed to connect:', err.message);
});

module.exports = client;
