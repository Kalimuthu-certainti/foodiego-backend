const { verifyAccessToken } = require('../config/jwt');

const optionalAuth = (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      req.diner = verifyAccessToken(auth.split(' ')[1]);
    } else {
      req.diner = null;
    }
  } catch {
    req.diner = null;
  }
  next();
};

module.exports = optionalAuth;
