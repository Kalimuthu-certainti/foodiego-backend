const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKey = fs.readFileSync(process.env.JWT_PRIVATE_KEY_PATH, 'utf8');
const publicKey  = fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH, 'utf8');

const ACCESS_EXPIRY  = process.env.JWT_ACCESS_EXPIRY  || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

// Sign access token (RS256)
function signAccessToken(payload) {
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: ACCESS_EXPIRY,
  });
}

// Verify access token
function verifyAccessToken(token) {
  return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
}

module.exports = { signAccessToken, verifyAccessToken, REFRESH_EXPIRY };
