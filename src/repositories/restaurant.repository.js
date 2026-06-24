"use strict";

/**
 * Restaurant data-access over the in-memory store ONLY (no business logic).
 * All methods async for the future pg swap.
 */

const { store } = require("../config/database");
const { makeRestaurant } = require("../models/restaurant.model");

/**
 * @param {object} data
 * @returns {Promise<object>}
 */
async function create(data) {
  const restaurant = makeRestaurant(data);
  store.restaurants.set(restaurant.id, restaurant);
  return restaurant;
}

/**
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  return store.restaurants.get(id) || null;
}

/**
 * @param {string} brandId
 * @returns {Promise<object[]>}
 */
async function findByBrand(brandId) {
  const result = [];
  for (const restaurant of store.restaurants.values()) {
    if (restaurant.brand_id === brandId) result.push(restaurant);
  }
  return result;
}

module.exports = { create, findById, findByBrand };
