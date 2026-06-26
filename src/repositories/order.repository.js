"use strict";

/**
 * Order data-access over the in-memory store ONLY (no business logic).
 * All methods are async for the future pg swap.
 */

const { store } = require("../config/database");
const { makeOrder } = require("../models/order.model");

/**
 * @param {object} data
 * @returns {Promise<object>}
 */
async function create(data) {
  const order = makeOrder(data);
  store.orders.set(order.id, order);
  return order;
}

/**
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  return store.orders.get(id) || null;
}

/**
 * List orders with optional filters + pagination.
 *
 * @param {object} opts
 * @param {string}  [opts.brandId]
 * @param {string}  [opts.branchId]
 * @param {string}  [opts.status]
 * @param {string}  [opts.from]      YYYY-MM-DD placed_at lower bound (inclusive)
 * @param {string}  [opts.to]        YYYY-MM-DD placed_at upper bound (inclusive, end of day)
 * @param {string}  [opts.search]    matches order_number or customer_name (case-insensitive)
 * @param {number}  [opts.page=1]
 * @param {number}  [opts.limit=10]
 * @returns {Promise<{ orders: object[], total: number, page: number, limit: number }>}
 */
async function findAll({
  brandId,
  branchId,
  status,
  from,
  to,
  search,
  page = 1,
  limit = 10,
} = {}) {
  const toEnd = to ? `${to}T23:59:59.999Z` : null;

  const filtered = [];
  for (const order of store.orders.values()) {
    if (brandId && order.brand_id !== brandId) continue;
    if (branchId && order.branch_id !== branchId) continue;
    if (status && order.status !== status) continue;
    if (from && order.placed_at < from) continue;
    if (toEnd && order.placed_at > toEnd) continue;
    if (search) {
      const q = search.toLowerCase();
      const matchNum = order.order_number.toLowerCase().includes(q);
      const matchCust = (order.customer_name || "").toLowerCase().includes(q);
      if (!matchNum && !matchCust) continue;
    }
    filtered.push(order);
  }

  // Most recent first
  filtered.sort((a, b) => b.placed_at.localeCompare(a.placed_at));

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const orders = filtered.slice(offset, offset + limit);

  return { orders, total, page, limit };
}

/**
 * Count orders per status for a brand.
 * @param {string} brandId
 * @returns {Promise<object>}
 */
async function summarize(brandId) {
  const counts = {
    placed_count: 0,
    confirmed_count: 0,
    preparing_count: 0,
    out_for_delivery_count: 0,
    delivered_count: 0,
    cancelled_count: 0,
  };
  for (const order of store.orders.values()) {
    if (order.brand_id !== brandId) continue;
    const key = `${order.status}_count`;
    if (Object.prototype.hasOwnProperty.call(counts, key)) counts[key]++;
  }
  return counts;
}

/**
 * Patch an existing order; bumps updated_at. Returns null if not found.
 * @param {string} id
 * @param {object} patch
 * @returns {Promise<object|null>}
 */
async function update(id, patch) {
  const order = store.orders.get(id);
  if (!order) return null;
  const updated = {
    ...order,
    ...patch,
    id: order.id,
    updated_at: new Date().toISOString(),
  };
  store.orders.set(id, updated);
  return updated;
}

module.exports = { create, findById, findAll, summarize, update };
