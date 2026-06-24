"use strict";

const { ownsScope, entityExists } = require("../repositories/mapping.repository");
const audit = require("../utils/audit");
const { AUDIT_ACTION, ROLES } = require("../config/constants");
const { ForbiddenError } = require("../utils/errors");

/**
 * scopeCheck(key) -> middleware confirming the caller owns the resource the
 * request targets. `key` is one of "brandId" | "restaurantId" | "branchId" |
 * "mappingId". The id is resolved from body, then query, then the route param
 * `:id`.
 *
 * Resolution order:
 *   - ADMIN bypasses ownership entirely (e.g. payouts "also allows ADMIN").
 *   - Owner of the resource -> allowed.
 *   - Resource does not exist -> fall through so the controller returns 404
 *     (no misleading SCOPE_DENIED for an owner's just-deleted resource).
 *   - Resource exists but is owned by someone else -> 403 + SCOPE_DENIED audit
 *     (the key security guarantee).
 */
function scopeCheck(key) {
  return async (req, res, next) => {
    if (req.user && req.user.role === ROLES.ADMIN) {
      return next();
    }

    const id =
      (req.body && req.body[key]) ||
      (req.query && req.query[key]) ||
      (req.params && req.params.id);

    try {
      if (await ownsScope(req.user.id, key, id)) {
        return next();
      }
      if (!(await entityExists(key, id))) {
        return next();
      }
      audit.log(req.user.id, AUDIT_ACTION.SCOPE_DENIED, key, id || null, {
        path: req.originalUrl,
      });
      return next(new ForbiddenError("You can only manage your own brand"));
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = scopeCheck;
