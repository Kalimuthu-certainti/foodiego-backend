const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

const signAccessToken = (payload) =>
  jwt.sign(payload, SECRET, { expiresIn: '15m' });

const verifyAccessToken = (token) =>
  jwt.verify(token, SECRET);

module.exports = { signAccessToken, verifyAccessToken };
