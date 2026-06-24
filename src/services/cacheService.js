const redis = require('../config/redis');
const crypto = require('crypto');

const get = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
};

const set = async (key, data, ttl) => {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch { /* noop */ }
};

const buildRestaurantKey = (lat, lng, filters, page) => {
  const filterHash = crypto.createHash('md5').update(JSON.stringify(filters)).digest('hex').slice(0, 8);
  return `restaurants:${parseFloat(lat).toFixed(2)}:${parseFloat(lng).toFixed(2)}:${filterHash}:${page}`;
};

const invalidate = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch { /* noop */ }
};

module.exports = { get, set, buildRestaurantKey, invalidate };
