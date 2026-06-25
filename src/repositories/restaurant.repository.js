"use strict";

/**
 * Restaurant data-access. The in-memory store stays the source of truth; when a
 * Postgres pool is configured (production), we ALSO write through to it and load
 * from it on boot, so restaurants survive restarts. In tests / no-DB, the pool is
 * null and this behaves exactly like the original in-memory repository.
 */

const { store } = require("../config/database");
const pool = require("../config/pgPool");
const { makeRestaurant } = require("../models/restaurant.model");

/**
 * @param {object} data
 * @returns {Promise<object>}
 */
async function create(data) {
  const restaurant = makeRestaurant(data);
  store.restaurants.set(restaurant.id, restaurant);

  if (pool) {
    // The bulk module's `restaurants` table has user_id NOT NULL; use the owning
    // brand's owner. Best-effort: a DB hiccup must not fail restaurant creation.
    const ownerId = store.brands.get(restaurant.brand_id)?.owner_id ?? null;
    try {
      await pool.query(
        `INSERT INTO restaurants (restaurant_id, user_id, brand_id, name, gst_no, email, phone, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
         ON CONFLICT (restaurant_id) DO UPDATE SET
           brand_id = EXCLUDED.brand_id, name = EXCLUDED.name, gst_no = EXCLUDED.gst_no,
           email = EXCLUDED.email, phone = EXCLUDED.phone, updated_at = NOW()`,
        [
          restaurant.id,
          ownerId,
          restaurant.brand_id,
          restaurant.name,
          restaurant.gst_no || null,
          restaurant.email || null,
          restaurant.phone,
        ],
      );
    } catch (err) {
      console.error("[restaurant.repository] persist failed:", err.message);
    }
  }

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

/**
 * Boot loader: hydrate the in-memory store with persisted restaurants (those that
 * belong to a brand — i.e. created by the main app, not bulk-only rows).
 * @returns {Promise<number>} how many rows were loaded
 */
async function loadAll() {
  if (!pool) return 0;
  const { rows } = await pool.query(
    `SELECT restaurant_id, brand_id, name, gst_no, email, phone, created_at
     FROM restaurants WHERE brand_id IS NOT NULL`,
  );
  for (const r of rows) {
    store.restaurants.set(r.restaurant_id, {
      id: r.restaurant_id,
      brand_id: r.brand_id,
      name: r.name,
      gst_no: r.gst_no,
      email: r.email,
      phone: r.phone,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    });
  }
  return rows.length;
}

module.exports = { create, findById, findByBrand, loadAll };
