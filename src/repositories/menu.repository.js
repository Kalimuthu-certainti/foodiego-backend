"use strict";

/**
 * Menu-change-request data-access over the in-memory store ONLY (no logic).
 * Menu submission itself is just a flag on the brand row (brand.menu_locked),
 * handled by the brand repository; this repo only owns change requests.
 * All methods async for the future pg swap.
 */

const { store } = require("../config/database");
const { makeMenuChangeRequest } = require("../models/menuChangeRequest.model");

/**
 * @param {object} data
 * @returns {Promise<object>}
 */
async function createChangeRequest(data) {
  const request = makeMenuChangeRequest(data);
  store.menuChangeRequests.set(request.id, request);
  return request;
}

/**
 * @param {string} brandId
 * @returns {Promise<object[]>}
 */
async function findChangeRequestsByBrand(brandId) {
  const result = [];
  for (const request of store.menuChangeRequests.values()) {
    if (request.brand_id === brandId) result.push(request);
  }
  return result;
}

module.exports = { createChangeRequest, findChangeRequestsByBrand };
