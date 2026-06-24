const Joi = require('joi');

// Reusable field rules
const phone = Joi.string().length(10).pattern(/^[0-9]+$/).required()
  .messages({ 'string.length': 'Enter a valid 10-digit phone number', 'string.pattern.base': 'Enter a valid 10-digit phone number' });

const otp = Joi.string().length(6).pattern(/^[0-9]+$/).required()
  .messages({ 'string.length': 'Enter the 6-digit OTP', 'string.pattern.base': 'Enter the 6-digit OTP' });

const username = Joi.string().min(3).max(30).alphanum().required()
  .messages({ 'string.min': 'Username must be at least 3 characters', 'string.max': 'Username must be at most 30 characters' });

const email = Joi.string().email().optional().allow('', null)
  .messages({ 'string.email': 'Enter a valid email address' });

// ── Schemas ───────────────────────────────────────────────────

const sendOtpSchema = Joi.object({
  phone,
  purpose: Joi.string().valid('REGISTER', 'LOGIN').required(),
});

const verifyOtpSchema = Joi.object({
  phone,
  otp,
  purpose: Joi.string().valid('REGISTER', 'LOGIN').required(),
  username: Joi.when('purpose', { is: 'REGISTER', then: username, otherwise: Joi.forbidden() }),
  email: Joi.when('purpose', { is: 'REGISTER', then: email, otherwise: Joi.forbidden() }),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const updateEmailSchema = Joi.object({
  email: Joi.string().email().allow('', null).optional()
    .messages({ 'string.email': 'Enter a valid email address' }),
});

// ── Middleware factory ─────────────────────────────────────────
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
        fields: error.details.map((d) => ({ field: d.path[0], message: d.message })),
      });
    }
    next();
  };
}

module.exports = { validate, sendOtpSchema, verifyOtpSchema, refreshSchema, updateEmailSchema };
