"use strict";

const { ForbiddenError } = require("../utils/errors");

/**
 * roleCheck([...allowedRoles]) -> middleware that 403s when the caller's role
 * is not in the allow-list. Assumes jwtVerify has already populated req.user.
 */
function roleCheck(roles) {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    return next(new ForbiddenError("Insufficient role"));
  };
}

module.exports = roleCheck;
