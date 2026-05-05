const redis = require('redis');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

const clientConfig = {
  url: redisUrl,
  socket: {
    // Stop retrying after 3 attempts — Redis is optional for core functionality
    reconnectStrategy: (retries) => {
      if (retries >= 3) {
        console.warn('Redis unavailable — running without cache/realtime features.');
        return false; // stop retrying
      }
      return Math.min(retries * 500, 3000);
    },
  },
};

// Railway/Supabase Redis requires TLS (rediss:// protocol)
if (redisUrl.startsWith('rediss://')) {
  clientConfig.socket = { ...clientConfig.socket, tls: true, rejectUnauthorized: false };
}

const client = redis.createClient(clientConfig);

client.on('connect', () => {
  console.log('Connected to Redis successfully!');
});

client.on('error', (err) => {
  // Only log first error — reconnectStrategy handles the rest
  if (!client._warnedRedis) {
    console.warn('Redis connection issue:', err.message);
    client._warnedRedis = true;
  }
});

client.connect().catch(() => {
  // Silently ignore — reconnectStrategy already logs the warning
});

module.exports = client;