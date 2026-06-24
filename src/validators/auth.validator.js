"use strict";

/**
 * Joi schemas for the auth domain. Consumed by the validate() middleware,
 * which strips unknown keys and surfaces every failed rule as a 400.
 */

const Joi = require("joi");

/**
 * POST /api/auth/login — credentials.
 */
const login = Joi.object({
  // trim + lowercase so a stray capital or surrounding whitespace still matches
  // the stored (lower-cased) email instead of failing as "invalid".
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
  password: Joi.string().required(),
});

/**
 * POST /api/auth/refresh — exchange a refresh token for a fresh access token.
 */
const refresh = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = { login, refresh };
