"use strict";

/**
 * Domain model factory for `users`.
 *
 * Plain-object factory (NOT an ORM). Applies defaults + shape so a row looks
 * identical whether it came from the in-memory store now, or from Postgres later.
 * Mirrors db/migrations/01_users.sql.
 */

const { randomUUID } = require("crypto");
const { ROLES } = require("../config/constants");

/**
 * @param {object} input
 * @param {string} [input.id]
 * @param {string} input.email
 * @param {string} input.password_hash
 * @param {string} [input.name]
 * @param {string} [input.role]            defaults to ROLES.BRAND_OWNER
 * @param {string} [input.phone]
 * @param {string} [input.created_at]      ISO timestamp
 * @returns {object} a shaped user row
 */
function makeUser({
  id,
  email,
  password_hash,
  name,
  role,
  phone,
  created_at,
} = {}) {
  return {
    id: id || randomUUID(),
    email,
    password_hash,
    name: name ?? null,
    role: role || ROLES.BRAND_OWNER,
    phone: phone ?? null,
    created_at: created_at || new Date().toISOString(),
  };
}

module.exports = { makeUser };
