"use strict";

/**
 * Domain model factory for `restaurants`.
 * Mirrors db/migrations/03_restaurants.sql.
 */

const { randomUUID } = require("crypto");

/**
 * @param {object} input
 * @param {string} [input.id]
 * @param {string} input.brand_id
 * @param {string} input.name
 * @param {string} input.gst_no    exactly 15 chars (validated upstream)
 * @param {string} input.email
 * @param {string} input.phone     10 digits (validated upstream)
 * @param {string} [input.created_at]
 * @returns {object} a shaped restaurant row
 */
function makeRestaurant({
  id,
  brand_id,
  name,
  gst_no,
  email,
  phone,
  created_at,
} = {}) {
  return {
    id: id || randomUUID(),
    brand_id,
    name,
    gst_no,
    email,
    phone,
    created_at: created_at || new Date().toISOString(),
  };
}

module.exports = { makeRestaurant };
