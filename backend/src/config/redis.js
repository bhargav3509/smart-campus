const redis = require('redis');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

const clientConfig = {
  url: redisUrl,
};

// Railway Redis requires TLS (rediss:// protocol)
if (redisUrl.startsWith('rediss://')) {
  clientConfig.socket = {
    tls: true,
    rejectUnauthorized: false,
  };
}

const client = redis.createClient(clientConfig);

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