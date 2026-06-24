"use strict";

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { config } = require("../config");
const { UnauthorizedError } = require("./errors");

/**
 * JWT access + refresh token helpers.
 *
 * Refresh tokens carry a per-token `jti`. The set of currently-valid jti per
 * user is tracked in an IN-MEMORY Map for this phase — revoking a user wipes
 * their set so a stolen/old refresh token can no longer mint access tokens.
 * (Persist this table in the DB later; the API here stays the same.)
 */
const activeRefreshJtis = new Map(); // userId -> Set<jti>

function issueAccessToken(user) {
  const payload = { sub: user.id, role: user.role, scopes: user.scopes || [] };
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessTtl,
  });
}

function issueRefreshToken(user) {
  const jti = crypto.randomUUID();
  if (!activeRefreshJtis.has(user.id)) {
    activeRefreshJtis.set(user.id, new Set());
  }
  activeRefreshJtis.get(user.id).add(jti);
  return jwt.sign({ sub: user.id, jti }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshTtl,
  });
}

function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    return { id: decoded.sub, role: decoded.role, scopes: decoded.scopes || [] };
  } catch (err) {
    throw new UnauthorizedError("Invalid or expired access token");
  }
}

function verifyRefreshToken(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.refreshSecret);
  } catch (err) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }
  const set = activeRefreshJtis.get(decoded.sub);
  if (!set || !set.has(decoded.jti)) {
    throw new UnauthorizedError("Refresh token has been revoked");
  }
  return { id: decoded.sub, jti: decoded.jti };
}

function revokeRefreshTokensForUser(userId) {
  activeRefreshJtis.delete(userId);
}

function revokeRefreshToken(userId, jti) {
  const set = activeRefreshJtis.get(userId);
  if (set) set.delete(jti);
}

module.exports = {
  issueAccessToken,
  issueRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshTokensForUser,
  revokeRefreshToken,
};
