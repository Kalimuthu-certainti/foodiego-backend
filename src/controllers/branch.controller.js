"use strict";

/**
 * Branch controller — THIN. Parses the request, delegates to the service, sends
 * the response, and forwards errors to next(). No business logic, no data
 * access here.
 */

const branchService = require("../services/branch.service");

/**
 * @route   POST /api/branches
 * @desc    Create a branch for a restaurant owned by the caller
 * @access  Private: BRAND_OWNER + scopeCheck(restaurantId)
 * @body    { restaurantId: string, name: string, lat: number, lng: number, workingHours: object }
 * @returns 201 Branch | 400 (validation) | 401 (no/invalid token) | 403 (wrong role or scope)
 */
async function create(req, res, next) {
  try {
    const branch = await branchService.create(req.user.id, req.body);
    return res.status(201).json(branch);
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   GET /api/branches
 * @desc    List all branches for a restaurant owned by the caller
 * @access  Private: BRAND_OWNER + scopeCheck(restaurantId)
 * @query   ?restaurantId=<string>
 * @returns 200 Branch[] | 401 (no/invalid token) | 403 (wrong role or scope)
 */
async function list(req, res, next) {
  try {
    const branches = await branchService.listByRestaurant(
      req.query.restaurantId
    );
    return res.status(200).json(branches);
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, list };
