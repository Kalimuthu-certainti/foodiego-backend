"use strict";

const { verifyAccessToken } = require("../utils/tokens");
const { UnauthorizedError } = require("../utils/errors");

/**
 * Extract the Bearer access token, verify it, and attach
 * req.user = { id, role, scopes }. Missing/invalid -> 401.
 */
function jwtVerify(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new UnauthorizedError("Missing or malformed Authorization header"));
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = jwtVerify;
