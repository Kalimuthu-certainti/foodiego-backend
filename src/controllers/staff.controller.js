"use strict";

/**
 * Staff (restaurant_user_mapping) controllers — THIN.
 * Parse the request, delegate to the service, shape the HTTP response, and
 * forward errors to the central error handler via next().
 */

const staffService = require("../services/staff.service");

/**
 * @route   POST /api/restaurant-users
 * @desc    Invite a user onto the caller's brand scope (sends invite SMS stub; audit INVITE)
 * @access  Private: BRAND_OWNER + scopeCheck(brandId)
 * @body    { userId: string, role: string, brandId: string, restaurantId?: string, branchId?: string, phone: string(10) }
 * @returns 201 Mapping (status active) | 400 | 401 | 403
 */
async function invite(req, res, next) {
  try {
    const mapping = await staffService.invite(req.user.id, req.body);
    return res.status(201).json(mapping);
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   DELETE /api/restaurant-users/:id
 * @desc    Remove a staff mapping (status=removed; revokes user refresh tokens; audit REMOVE)
 * @access  Private: BRAND_OWNER + scopeCheck(mappingId)
 * @returns 204 No Content | 401 | 403 | 404
 */
async function remove(req, res, next) {
  try {
    await staffService.remove(req.user.id, req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   GET /api/restaurant-users
 * @desc    List mappings for the caller's brand
 * @access  Private: BRAND_OWNER + scopeCheck(brandId)
 * @query   ?brandId=<brandId>
 * @returns 200 Mapping[] | 401 | 403
 */
async function list(req, res, next) {
  try {
    const mappings = await staffService.listByBrand(req.query.brandId);
    return res.status(200).json(mappings);
  } catch (err) {
    return next(err);
  }
}

module.exports = { invite, remove, list };
