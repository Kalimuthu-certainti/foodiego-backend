"use strict";

/**
 * Domain model factory for `brands`.
 *
 * Auto-approve phase: a new brand defaults to status APPROVED / is_active true.
 * The status + is_active columns are kept so flipping REQUIRE_ADMIN_APPROVAL=true
 * later needs no schema change. Mirrors db/migrations/02_brands.sql.
 */

const { randomUUID } = require("crypto");
const { BRAND_STATUS } = require("../config/constants");

/**
 * @param {object} input
 * @param {string} [input.id]
 * @param {string} input.owner_id
 * @param {string} input.name
 * @param {string} [input.status]          defaults BRAND_STATUS.APPROVED
 * @param {boolean} [input.is_active]       defaults true
 * @param {boolean} [input.menu_locked]     defaults false
 * @param {?string} [input.reject_reason]   defaults null
 * @param {string} [input.created_at]
 * @returns {object} a shaped brand row
 */
function makeBrand({
  id,
  owner_id,
  name,
  status,
  is_active,
  menu_locked,
  reject_reason,
  created_at,
} = {}) {
  return {
    id: id || randomUUID(),
    owner_id,
    name,
    status: status || BRAND_STATUS.APPROVED,
    is_active: is_active === undefined ? true : is_active,
    menu_locked: menu_locked === undefined ? false : menu_locked,
    reject_reason: reject_reason ?? null,
    created_at: created_at || new Date().toISOString(),
  };
}

module.exports = { makeBrand };
