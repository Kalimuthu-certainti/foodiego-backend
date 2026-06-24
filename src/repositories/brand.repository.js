"use strict";

/**
 * Brand data-access over the in-memory store ONLY (no business logic).
 * All methods async for the future pg swap.
 */

const { store } = require("../config/database");
const { makeBrand } = require("../models/brand.model");

/**
 * @param {object} data
 * @returns {Promise<object>}
 */
async function create(data) {
  const brand = makeBrand(data);
  store.brands.set(brand.id, brand);
  return brand;
}

/**
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  return store.brands.get(id) || null;
}

/**
 * @param {string} ownerId
 * @returns {Promise<object[]>}
 */
async function findByOwner(ownerId) {
  const result = [];
  for (const brand of store.brands.values()) {
    if (brand.owner_id === ownerId) result.push(brand);
  }
  return result;
}

/**
 * Patch an existing brand in place; returns the updated row (or null if absent).
 * @param {string} id
 * @param {object} patch
 * @returns {Promise<object|null>}
 */
async function update(id, patch) {
  const brand = store.brands.get(id);
  if (!brand) return null;
  const updated = { ...brand, ...patch, id: brand.id };
  store.brands.set(id, updated);
  return updated;
}

/**
 * @param {string} id
 * @returns {Promise<boolean>} true if a row was removed
 */
async function remove(id) {
  return store.brands.delete(id);
}

module.exports = { create, findById, findByOwner, update, remove };
