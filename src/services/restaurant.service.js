"use strict";

/**
 * Restaurant business logic. Controllers stay thin; this layer owns the rules
 * and writes the audit trail on mutations. Data access goes through the
 * repository only (which talks to the in-memory store / future pg pool).
 */

const restaurantRepo = require("../repositories/restaurant.repository");
const audit = require("../utils/audit");
const { AUDIT_ACTION, ENTITY } = require("../config/constants");

/**
 * Create a restaurant under an (already scope-checked) owned brand.
 * The caller (scopeCheck middleware) guarantees actorId owns brandId.
 *
 * @param {string} actorId acting brand owner id (for audit)
 * @param {object} input { brandId, name, gstNo, email, phone }
 * @returns {Promise<object>} the created restaurant row
 */
async function create(actorId, { brandId, name, gstNo, email, phone }) {
  const restaurant = await restaurantRepo.create({
    brand_id: brandId,
    name,
    gst_no: gstNo,
    email,
    phone,
  });

  audit.log(actorId, AUDIT_ACTION.CREATE, ENTITY.RESTAURANT, restaurant.id, {
    brand_id: brandId,
    name,
  });

  return restaurant;
}

/**
 * List restaurants for an owned brand.
 * @param {string} brandId
 * @returns {Promise<object[]>}
 */
async function listByBrand(brandId) {
  return restaurantRepo.findByBrand(brandId);
}

module.exports = { create, listByBrand };
