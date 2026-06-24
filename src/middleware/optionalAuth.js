const { verifyAccessToken } = require('../config/jwt');

const optionalAuth = (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const payload = verifyAccessToken(auth.split(' ')[1]);
      req.dinerId = payload.sub;
    } else {
      req.dinerId = null;
    }
  } catch {
    req.diner = null;
  }
  next();
};

module.exports = optionalAuth;
