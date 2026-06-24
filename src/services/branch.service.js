"use strict";

/**
 * Branch business logic. Sits between the (thin) controller and the
 * repositories. Owns the audit trail for mutations (CREATE here).
 *
 * Scope ownership (does the caller own the restaurant?) is enforced upstream by
 * the scopeCheck("restaurantId") middleware, so the service can trust that the
 * restaurant belongs to the caller — but we still verify the restaurant exists
 * to fail cleanly with a 404 rather than persisting an orphan branch.
 */

const branchRepo = require("../repositories/branch.repository");
const restaurantRepo = require("../repositories/restaurant.repository");
const audit = require("../utils/audit");
const { AUDIT_ACTION, ENTITY } = require("../config/constants");
const { NotFoundError } = require("../utils/errors");

/**
 * Create a branch under a (caller-owned) restaurant, persisting working_hours.
 *
 * @param {string} actorId  the authenticated brand owner's id
 * @param {object} input    validated body { restaurantId, name, lat, lng, workingHours }
 * @returns {Promise<object>} the created branch row
 */
async function create(actorId, { restaurantId, name, lat, lng, workingHours }) {
  const restaurant = await restaurantRepo.findById(restaurantId);
  if (!restaurant) {
    throw new NotFoundError("Restaurant not found");
  }

  const branch = await branchRepo.create({
    restaurant_id: restaurantId,
    name,
    lat,
    lng,
    working_hours: workingHours,
  });

  audit.log(actorId, AUDIT_ACTION.CREATE, ENTITY.BRANCH, branch.id, {
    restaurant_id: restaurantId,
    name,
  });

  return branch;
}

/**
 * List all branches under a restaurant.
 * @param {string} restaurantId
 * @returns {Promise<object[]>}
 */
async function listByRestaurant(restaurantId) {
  return branchRepo.findByRestaurant(restaurantId);
}

module.exports = { create, listByRestaurant };
