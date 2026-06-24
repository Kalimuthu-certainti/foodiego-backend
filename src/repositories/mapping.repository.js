"use strict";

/**
 * Mapping (restaurant_user_mapping) data-access over the in-memory store ONLY.
 *
 * Also home to ownsScope() — the scope resolver used by the scopeCheck
 * middleware. It walks the hierarchy up to brands.owner_id so a Brand Owner can
 * only ever touch their own brand / restaurants / branches / mappings.
 * All methods async for the future pg swap.
 */

const { store } = require("../config/database");
const { makeMapping } = require("../models/mapping.model");

/**
 * @param {object} data
 * @returns {Promise<object>}
 */
async function create(data) {
  const mapping = makeMapping(data);
  store.mappings.set(mapping.id, mapping);
  return mapping;
}

/**
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  return store.mappings.get(id) || null;
}

/**
 * @param {string} brandId
 * @returns {Promise<object[]>}
 */
async function findByBrand(brandId) {
  const result = [];
  for (const mapping of store.mappings.values()) {
    if (mapping.brand_id === brandId) result.push(mapping);
  }
  return result;
}

/**
 * Patch an existing mapping in place; returns the updated row (or null).
 * @param {string} id
 * @param {object} patch
 * @returns {Promise<object|null>}
 */
async function update(id, patch) {
  const mapping = store.mappings.get(id);
  if (!mapping) return null;
  const updated = { ...mapping, ...patch, id: mapping.id };
  store.mappings.set(id, updated);
  return updated;
}

/**
 * Scope resolver: does `userId` own the entity identified by (`key`, `id`)?
 * Resolves ownership up the chain to brands.owner_id using the store directly.
 *
 *   "brandId"      -> brand.owner_id === userId
 *   "restaurantId" -> restaurant -> brand -> owner === userId
 *   "branchId"     -> branch -> restaurant -> brand -> owner === userId
 *   "mappingId"    -> mapping's own scope (brand/restaurant/branch), recursed
 *
 * A falsy id always resolves to false.
 *
 * @param {string} userId
 * @param {string} key  one of brandId | restaurantId | branchId | mappingId
 * @param {string} id
 * @returns {Promise<boolean>}
 */
async function ownsScope(userId, key, id) {
  if (!id) return false;

  switch (key) {
    case "brandId": {
      const brand = store.brands.get(id);
      return Boolean(brand && brand.owner_id === userId);
    }

    case "restaurantId": {
      const restaurant = store.restaurants.get(id);
      if (!restaurant) return false;
      return ownsScope(userId, "brandId", restaurant.brand_id);
    }

    case "branchId": {
      const branch = store.branches.get(id);
      if (!branch) return false;
      return ownsScope(userId, "restaurantId", branch.restaurant_id);
    }

    case "mappingId": {
      const mapping = store.mappings.get(id);
      if (!mapping) return false;
      if (mapping.brand_id) return ownsScope(userId, "brandId", mapping.brand_id);
      if (mapping.restaurant_id)
        return ownsScope(userId, "restaurantId", mapping.restaurant_id);
      if (mapping.branch_id)
        return ownsScope(userId, "branchId", mapping.branch_id);
      return false;
    }

    default:
      return false;
  }
}

/**
 * Does the entity identified by (`key`, `id`) exist at all (regardless of
 * ownership)? Lets scopeCheck distinguish "not found" (-> controller 404) from
 * "found but not owned" (-> 403 + SCOPE_DENIED), so a legitimate owner querying
 * a just-deleted resource gets a clean 404 instead of a misleading denial.
 *
 * @param {string} key one of brandId | restaurantId | branchId | mappingId
 * @param {string} id
 * @returns {Promise<boolean>}
 */
async function entityExists(key, id) {
  if (!id) return false;
  switch (key) {
    case "brandId":
      return store.brands.has(id);
    case "restaurantId":
      return store.restaurants.has(id);
    case "branchId":
      return store.branches.has(id);
    case "mappingId":
      return store.mappings.has(id);
    default:
      return false;
  }
}

module.exports = {
  create,
  findById,
  findByBrand,
  update,
  ownsScope,
  entityExists,
};
