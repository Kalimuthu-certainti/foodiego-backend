const jwt = require('jsonwebtoken');
const fs  = require('fs');
const path = require('path');

const privateKey = fs.readFileSync(process.env.JWT_PRIVATE_KEY_PATH || path.join(__dirname, '../../keys/private.pem'), 'utf8');
const publicKey  = fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH  || path.join(__dirname, '../../keys/public.pem'),  'utf8');

const ACCESS_EXPIRY  = process.env.JWT_ACCESS_EXPIRY  || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

const signAccessToken = (payload) =>
  jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: ACCESS_EXPIRY });

const verifyAccessToken = (token) =>
  jwt.verify(token, publicKey, { algorithms: ['RS256'] });

module.exports = { signAccessToken, verifyAccessToken, REFRESH_EXPIRY };
