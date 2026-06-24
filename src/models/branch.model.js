"use strict";

/**
 * Domain model factory for `branches`.
 * working_hours is the JSONB day->[{open,close}] shape; defaults to {}.
 * is_open defaults false (toggled by a cron later). Mirrors db/migrations/04_branches.sql.
 */

const { randomUUID } = require("crypto");

/**
 * @param {object} input
 * @param {string} [input.id]
 * @param {string} input.restaurant_id
 * @param {string} input.name
 * @param {number} input.lat            -90..90
 * @param {number} input.lng            -180..180
 * @param {object} [input.working_hours] defaults {}
 * @param {boolean} [input.is_open]      defaults false
 * @returns {object} a shaped branch row
 */
function makeBranch({
  id,
  restaurant_id,
  name,
  lat,
  lng,
  working_hours,
  is_open,
} = {}) {
  return {
    id: id || randomUUID(),
    restaurant_id,
    name,
    lat,
    lng,
    working_hours: working_hours === undefined ? {} : working_hours,
    is_open: is_open === undefined ? false : is_open,
  };
}

module.exports = { makeBranch };
