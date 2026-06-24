"use strict";

/**
 * Report / payout controllers. THIN: parse the request, delegate to the
 * service, shape the response, forward errors to next(). No business logic.
 */

const reportService = require("../services/report.service");
const { toCsv } = require("../utils/csv");

/**
 * @route   GET /api/brands/:id/reports
 * @desc    Returns brand report rows (empty this phase; sourced from order data later)
 * @access  Private: BRAND_OWNER + scopeCheck(brandId)
 * @query   ?from=<ISO date>&to=<ISO date>
 * @returns 200 ReportRow[] (empty until order data exists) | 401 | 403 | 404
 */
async function getReports(req, res, next) {
  try {
    const brandId = req.params.id;
    const { from, to } = req.query;
    const rows = await reportService.getReports(brandId, from, to);
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   GET /api/brands/:id/payouts
 * @desc    JSON list of brand payouts by default; format=csv streams a text/csv document
 * @access  Private: BRAND_OWNER, ADMIN + scopeCheck(brandId)
 * @query   ?format=csv (optional; omit for JSON)
 * @returns 200 Payout[] (or text/csv when format=csv) | 401 | 403 | 404
 */
async function getPayouts(req, res, next) {
  try {
    const brandId = req.params.id;
    const payouts = await reportService.getPayouts(brandId);

    if (req.query.format === "csv") {
      const csv = toCsv(payouts, [
        "id",
        "brand_id",
        "period",
        "gross",
        "fee",
        "net",
        "status",
      ]);
      res.set("Content-Type", "text/csv");
      return res.status(200).send(csv);
    }

    return res.status(200).json(payouts);
  } catch (err) {
    return next(err);
  }
}

module.exports = { getReports, getPayouts };
