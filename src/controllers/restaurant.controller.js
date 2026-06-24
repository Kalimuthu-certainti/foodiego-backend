"use strict";

/**
 * Restaurant controllers — THIN: parse req, call service, send response,
 * forward errors to next(). All logic + audit live in the service.
 */

const restaurantService = require("../services/restaurant.service");

/**
 * @route   POST /api/restaurants
 * @desc    Create a restaurant under a brand owned by the caller
 * @access  Private: BRAND_OWNER + scopeCheck(brandId)
 * @body    { brandId: string, name: string, gstNo: string(15), email: string(email), phone: string(10 digits) }
 * @returns 201 Restaurant | 400 (validation) | 401 (no/invalid token) | 403 (wrong role / not owner of brandId)
 */
async function create(req, res, next) {
  try {
    const restaurant = await restaurantService.create(req.user.id, req.body);
    return res.status(201).json(restaurant);
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   GET /api/restaurants
 * @desc    List all restaurants for a brand owned by the caller
 * @access  Private: BRAND_OWNER + scopeCheck(brandId)
 * @query   ?brandId=string (required)
 * @returns 200 Restaurant[] | 401 (no/invalid token) | 403 (wrong role / not owner of brandId)
 */
async function list(req, res, next) {
  try {
    const restaurants = await restaurantService.listByBrand(req.query.brandId);
    return res.status(200).json(restaurants);
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, list };
