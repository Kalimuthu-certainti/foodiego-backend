"use strict";

/**
 * MENU controller — THIN. Parse the request, call the service, send the
 * response, and forward errors to next(). No business logic or data access.
 */

const menuService = require("../services/menu.service");

/**
 * @route   POST /api/brands/:id/menu-submission
 * @desc    Submit a brand's menu, locking it (menu_locked=true); writes an UPDATE audit entry
 * @access  Private: BRAND_OWNER + scopeCheck(brandId)
 * @body    { items: array }
 * @returns 200 Brand (menu_locked=true) | 400 | 401 | 403 | 404 | 409 (already locked)
 */
async function submitMenu(req, res, next) {
  try {
    const brand = await menuService.submitMenu(
      req.user.id,
      req.params.id,
      req.body
    );
    return res.status(200).json(brand);
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   POST /api/menu-change-requests
 * @desc    Create a menu change request (status PENDING); writes a CREATE audit entry
 * @access  Private: BRAND_OWNER + scopeCheck(brandId)
 * @body    { brandId: string, items: array, reason?: string }
 * @returns 201 MenuChangeRequest (status PENDING) | 400 | 401 | 403
 */
async function createChangeRequest(req, res, next) {
  try {
    const request = await menuService.createChangeRequest(req.user.id, req.body);
    return res.status(201).json(request);
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   GET /api/menu-change-requests
 * @desc    List a brand's menu change requests
 * @access  Private: BRAND_OWNER + scopeCheck(brandId)
 * @query   ?brandId=<string>
 * @returns 200 MenuChangeRequest[] | 401 | 403
 */
async function listChangeRequests(req, res, next) {
  try {
    const requests = await menuService.listChangeRequests(req.query.brandId);
    return res.status(200).json(requests);
  } catch (err) {
    return next(err);
  }
}

module.exports = { submitMenu, createChangeRequest, listChangeRequests };
