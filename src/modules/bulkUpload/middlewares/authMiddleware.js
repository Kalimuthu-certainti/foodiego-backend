"use strict";

// Auth for the bulk-upload module, wired to the MAIN backend's auth so a normal
// FoodieGo login works here with no extra config:
//  - verifyAccessToken uses the same JWT secret (config.jwt.accessSecret) and
//    returns { id, role, scopes } (id mapped from the token's `sub`), which is
//    exactly what these controllers expect (req.user.id / req.user.role).
//  - Roles are the main backend's enum (BRAND_OWNER / ADMIN), not the lowercase
//    'restaurant_owner' the standalone service used.
const { verifyAccessToken } = require("../../../utils/tokens");
const { ROLES } = require("../../../config/constants");
const { error } = require("../utils/responseFormatter");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return error(res, "No token provided", 401);
  }

  try {
    req.user = verifyAccessToken(token); // { id, role, scopes }
    return next();
  } catch (err) {
    return error(res, "Invalid or expired token", 401);
  }
};

const isAdmin = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.role !== ROLES.ADMIN) {
      return error(res, "Access denied. Admin only.", 403);
    }
    next();
  });
};

const isOwner = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.role !== ROLES.BRAND_OWNER) {
      return error(res, "Access denied. Brand owners only.", 403);
    }
    next();
  });
};

const isAdminOrOwner = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.BRAND_OWNER) {
      return error(res, "Access denied. Admin or Brand Owner only.", 403);
    }
    next();
  });
};

module.exports = { authMiddleware, isAdmin, isOwner, isAdminOrOwner };
