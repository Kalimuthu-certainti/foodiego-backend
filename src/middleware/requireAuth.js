const { verifyAccessToken } = require('../config/jwt');

const requireAuth = (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
      return res.status(401).json({ error: { code: 401, message: 'Authentication required' } });
    const payload = verifyAccessToken(auth.split(' ')[1]);
    req.dinerId = payload.sub;
    next();
  } catch (err) {
    const status = err.name === 'TokenExpiredError' ? 403 : 401;
    res.status(status).json({ error: { code: status, message: err.message } });
  }
};

module.exports = requireAuth;
