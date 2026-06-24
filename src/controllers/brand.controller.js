"use strict";

/**
 * Brand controllers — THIN. Each handler parses the request, calls the service,
 * sends the response, and forwards errors to next(). No business logic or data
 * access lives here.
 */

const brandService = require("../services/brand.service");

/**
 * @route   POST /api/brands
 * @desc    Create a brand owned by the caller (auto status=approved, is_active=true)
 * @access  Private: BRAND_OWNER
 * @body    { name: string }
 * @returns 201 Brand | 400 (validation) | 401 (no/invalid token) | 403 (wrong role)
 */
async function create(req, res, next) {
  try {
    const brand = await brandService.create(req.user.id, { name: req.body.name });
    return res.status(201).json(brand);
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   GET /api/brands
 * @desc    List the brands owned by the caller
 * @access  Private: BRAND_OWNER
 * @returns 200 Brand[] (caller-owned) | 401 (no/invalid token) | 403 (wrong role)
 */
async function list(req, res, next) {
  try {
    const brands = await brandService.list(req.user.id);
    return res.status(200).json(brands);
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   GET /api/brands/:id
 * @desc    Fetch a single brand owned by the caller
 * @access  Private: BRAND_OWNER + scopeCheck(brandId)
 * @returns 200 Brand | 401 (no/invalid token) | 403 (wrong role/scope) | 404 (not found)
 */
async function get(req, res, next) {
  try {
    const brand = await brandService.get(req.params.id);
    return res.status(200).json(brand);
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   PATCH /api/brands/:id
 * @desc    Update a brand owned by the caller
 * @access  Private: BRAND_OWNER + scopeCheck(brandId)
 * @body    { name?: string }
 * @returns 200 Brand | 400 (validation) | 401 (no/invalid token) | 403 (wrong role/scope) | 404 (not found)
 */
async function update(req, res, next) {
  try {
    const brand = await brandService.update(req.user.id, req.params.id, req.body);
    return res.status(200).json(brand);
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   DELETE /api/brands/:id
 * @desc    Delete a brand owned by the caller
 * @access  Private: BRAND_OWNER + scopeCheck(brandId)
 * @returns 204 (no content) | 401 (no/invalid token) | 403 (wrong role/scope) | 404 (not found)
 */
async function remove(req, res, next) {
  try {
    await brandService.remove(req.user.id, req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, list, get, update, remove };
