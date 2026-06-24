"use strict";

/**
 * Domain model factory for `payouts`.
 * status defaults to PAYOUT_STATUS.PENDING. Mirrors db/migrations/07_payouts.sql.
 */

const { randomUUID } = require("crypto");
const { PAYOUT_STATUS } = require("../config/constants");

/**
 * @param {object} input
 * @param {string} [input.id]
 * @param {string} input.brand_id
 * @param {string} input.period      e.g. "2026-06"
 * @param {number} [input.gross]
 * @param {number} [input.fee]
 * @param {number} [input.net]
 * @param {string} [input.status]     defaults PAYOUT_STATUS.PENDING
 * @returns {object} a shaped payout row
 */
function makePayout({ id, brand_id, period, gross, fee, net, status } = {}) {
  return {
    id: id || randomUUID(),
    brand_id,
    period,
    gross: gross ?? null,
    fee: fee ?? null,
    net: net ?? null,
    status: status || PAYOUT_STATUS.PENDING,
  };
}

module.exports = { makePayout };
