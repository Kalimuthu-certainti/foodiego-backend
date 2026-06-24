const jwt = require('jsonwebtoken');
const { error } = require('../utils/responseFormatter');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'No token provided', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
};

const isAdmin = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') {
      return error(res, 'Access denied. Admin only.', 403);
    }
    next();
  });

};

const isOwner = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'restaurant_owner') {
      return error(res, 'Access denied. Restaurant owners only.', 403);
    }
    next();
  });
};

const isAdminOrOwner = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin' && req.user.role !== 'restaurant_owner') {
      return error(res, 'Access denied. Admin or Restaurant Owner only.', 403);
    }
    next();
  });
};

module.exports = { authMiddleware, isAdmin, isOwner, isAdminOrOwner };