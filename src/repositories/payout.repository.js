"use strict";

/**
 * Payout data-access over the in-memory store ONLY (no business logic).
 * create() is used by the seed (real payout rows arrive from later phases).
 * All methods async for the future pg swap.
 */

const { store } = require("../config/database");
const { makePayout } = require("../models/payout.model");

/**
 * @param {string} brandId
 * @returns {Promise<object[]>}
 */
async function findByBrand(brandId) {
  const result = [];
  for (const payout of store.payouts.values()) {
    if (payout.brand_id === brandId) result.push(payout);
  }
  return result;
}

/**
 * @param {object} data
 * @returns {Promise<object>}
 */
async function create(data) {
  const payout = makePayout(data);
  store.payouts.set(payout.id, payout);
  return payout;
}

module.exports = { findByBrand, create };
