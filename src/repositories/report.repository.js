"use strict";

/**
 * Report data-access over the in-memory store ONLY (no business logic).
 *
 * Report rows are flat { brand_id, day, orders, revenue } records. Real rows
 * will later come from order data via the `mv_brand_report` materialized view
 * (see db/migrations/09_mv_brand_report.sql); until then the seed loads demo
 * rows so the dashboard has something to show. All methods async for the pg swap.
 */

const { store } = require("../config/database");

/**
 * Brand report rows, optionally bounded by an inclusive [from, to] day window.
 * `day` is a "YYYY-MM-DD" string, so lexical comparison is also chronological.
 * @param {string} brandId
 * @param {{from?: string, to?: string}} [window]
 * @returns {Promise<object[]>} rows sorted by day ascending
 */
async function findByBrand(brandId, { from, to } = {}) {
  return store.reports
    .filter((row) => row.brand_id === brandId)
    .filter((row) => (from ? row.day >= from : true))
    .filter((row) => (to ? row.day <= to : true))
    .sort((a, b) => a.day.localeCompare(b.day));
}

/**
 * Append a report row.
 * @param {object} data { brand_id, day, orders, revenue }
 * @returns {Promise<object>}
 */
async function create(data) {
  store.reports.push(data);
  return data;
}

module.exports = { findByBrand, create };
