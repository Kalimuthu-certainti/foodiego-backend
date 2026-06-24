"use strict";

/**
 * Report / payout business logic.
 *
 * Reports are read-only and (this phase) intentionally empty: the rows come from
 * later order data + the `mv_brand_report` materialized view (see
 * db/migrations/09_mv_brand_report.sql). The signature is stable so wiring the
 * real aggregation later needs no controller/route change.
 *
 * Payouts read straight from the payout repository (data access stays there).
 * No mutations here, so no audit entries — audit is for write paths only.
 */

const payoutRepository = require("../repositories/payout.repository");
const reportRepository = require("../repositories/report.repository");

/**
 * Brand report rows for an optional date window. Rows live in the report store
 * (seeded as demo data now; sourced from order data + `mv_brand_report` later).
 * @param {string} brandId
 * @param {string} [from] `YYYY-MM-DD` window start (inclusive)
 * @param {string} [to]   `YYYY-MM-DD` window end (inclusive)
 * @returns {Promise<object[]>} report rows
 */
async function getReports(brandId, from, to) {
  return reportRepository.findByBrand(brandId, { from, to });
}

/**
 * All payouts for a brand.
 * @param {string} brandId
 * @returns {Promise<object[]>}
 */
async function getPayouts(brandId) {
  return payoutRepository.findByBrand(brandId);
}

module.exports = { getReports, getPayouts };
