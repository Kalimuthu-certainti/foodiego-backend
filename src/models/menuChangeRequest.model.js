"use strict";

/**
 * Domain model factory for `menu_change_requests`.
 * status defaults to MENU_REQUEST_STATUS.PENDING (no Admin approval this phase).
 * Mirrors db/migrations/06_menu_change_requests.sql.
 */

const { randomUUID } = require("crypto");
const { MENU_REQUEST_STATUS } = require("../config/constants");

/**
 * @param {object} input
 * @param {string} [input.id]
 * @param {string} input.brand_id
 * @param {(object|Array)} input.items    proposed items/changes (JSONB)
 * @param {string} [input.status]         defaults MENU_REQUEST_STATUS.PENDING
 * @param {?string} [input.reason]        defaults null
 * @param {string} [input.created_at]
 * @returns {object} a shaped menu-change-request row
 */
function makeMenuChangeRequest({
  id,
  brand_id,
  items,
  status,
  reason,
  created_at,
} = {}) {
  return {
    id: id || randomUUID(),
    brand_id,
    items,
    status: status || MENU_REQUEST_STATUS.PENDING,
    reason: reason ?? null,
    created_at: created_at || new Date().toISOString(),
  };
}

module.exports = { makeMenuChangeRequest };
