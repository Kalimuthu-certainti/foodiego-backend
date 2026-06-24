const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 200,
  message: { error: { code: 429, message: 'Too many requests' } },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const createLimiter = (max, keyPrefix = '') =>
  rateLimit({
    windowMs: 60 * 1000,
    limit: max,
    keyGenerator: (req) => `${keyPrefix}:${req.ip ?? 'unknown'}`,
    validate: { keyGeneratorIpFallback: false },
    message: { error: { code: 429, message: 'Too many requests' } },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

module.exports = { globalLimiter, createLimiter };
