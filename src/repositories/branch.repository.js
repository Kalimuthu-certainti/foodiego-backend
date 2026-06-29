"use strict";

/**
 * Branch data-access over the in-memory store ONLY (no business logic).
 * All methods async for the future pg swap.
 */

const { store } = require("../config/database");
const { makeBranch } = require("../models/branch.model");

/**
 * @param {object} data
 * @returns {Promise<object>}
 */
async function create(data) {
  const branch = makeBranch(data);
  store.branches.set(branch.id, branch);
  return branch;
}

/**
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  return store.branches.get(id) || null;
}

/**
 * @param {string} restaurantId
 * @returns {Promise<object[]>}
 */
async function findByRestaurant(restaurantId) {
  const result = [];
  for (const branch of store.branches.values()) {
    if (branch.restaurant_id === restaurantId) result.push(branch);
  }
  return result;
}

/**
 * @param {string} id
 * @param {object} patch
 * @returns {Promise<object|null>}
 */
async function update(id, patch) {
  const branch = store.branches.get(id);
  if (!branch) return null;
  const updated = { ...branch, ...patch, updated_at: new Date().toISOString() };
  store.branches.set(id, updated);
  return updated;
}

module.exports = { create, findById, findByRestaurant, update };
