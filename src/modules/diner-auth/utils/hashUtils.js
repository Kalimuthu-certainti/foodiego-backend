const crypto = require('crypto');

/**
 * Returns SHA-256 hex hash of a value.
 * Used for OTP hashing and refresh token hashing.
 */
function hashSHA256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

module.exports = { hashSHA256 };
