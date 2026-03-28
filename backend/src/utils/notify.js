const redis = require('../config/redis');

const notify = async (userId, message) => {
  const key = `notifications:${userId}`;
  const payload = JSON.stringify({ message, time: new Date().toISOString() });
  await redis.lpush(key, payload);
  await redis.ltrim(key, 0, 19); // keep only 20
};

module.exports = notify;