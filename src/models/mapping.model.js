"use strict";

/**
 * Domain model factory for `restaurant_user_mapping`.
 *
 * Scope is one of brand_id / restaurant_id / branch_id (the rest null).
 * status defaults to MAPPING_STATUS.INVITED; the staff service promotes it to
 * ACTIVE for this phase so the mapping shows in the invitee's next-login scope.
 * Mirrors db/migrations/05_restaurant_user_mapping.sql.
 */

const { randomUUID } = require("crypto");
const { MAPPING_STATUS } = require("../config/constants");

/**
 * @param {object} input
 * @param {string} [input.id]
 * @param {string} input.user_id
 * @param {string} input.role
 * @param {?string} [input.brand_id]
 * @param {?string} [input.restaurant_id]
 * @param {?string} [input.branch_id]
 * @param {string} [input.status]       defaults MAPPING_STATUS.INVITED
 * @param {string} [input.created_at]
 * @returns {object} a shaped mapping row
 */
function makeMapping({
  id,
  user_id,
  role,
  brand_id,
  restaurant_id,
  branch_id,
  status,
  created_at,
} = {}) {
  return {
    id: id || randomUUID(),
    user_id,
    role,
    brand_id: brand_id ?? null,
    restaurant_id: restaurant_id ?? null,
    branch_id: branch_id ?? null,
    status: status || MAPPING_STATUS.INVITED,
    created_at: created_at || new Date().toISOString(),
  };
}

module.exports = { makeMapping };
