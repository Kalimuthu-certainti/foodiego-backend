const { verifyAccessToken } = require('../../../config/jwt');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.dinerId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

module.exports = { authenticate };
