const rateLimit = require('express-rate-limit');

// 3 OTP requests per phone per 10 minutes
const sendOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => `otp_send:${req.ip}:${req.body?.phone ?? ''}`,
  handler: (_req, res) =>
    res.status(429).json({ error: 'Too many OTP requests. Please wait 10 minutes before trying again.' }),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// 10 verify attempts per phone per 15 minutes
const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `otp_verify:${req.ip}:${req.body?.phone ?? ''}`,
  handler: (_req, res) =>
    res.status(429).json({ error: 'Too many verification attempts. Please wait 15 minutes before trying again.' }),
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { sendOtpLimiter, verifyOtpLimiter };
