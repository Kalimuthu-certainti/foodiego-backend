"use strict";

/**
 * MENU routes. All endpoints require a valid access token and the BRAND_OWNER
 * role, then a scope check (caller must own the targeted brand), then Joi
 * validation. Layering: route -> middleware -> controller -> service -> repo.
 *
 *   POST /api/brands/:id/menu-submission   (scopeCheck brandId via :id)
 *   POST /api/menu-change-requests         (scopeCheck brandId from body)
 *   GET  /api/menu-change-requests?brandId=(scopeCheck brandId from query)
 */

const express = require("express");

const jwtVerify = require("../middlewares/jwtVerify");
const roleCheck = require("../middlewares/roleCheck");
const scopeCheck = require("../middlewares/scopeCheck");
const validate = require("../middlewares/validate");
const { ROLES } = require("../config/constants");
const menuValidator = require("../validators/menu.validator");
const menuController = require("../controllers/menu.controller");

const router = express.Router();

/**
 * ROUTE MAP (mounted at /api)
 *   POST /api/brands/:id/menu-submission  — lock brand menu (menu_locked=true) — jwtVerify, roleCheck([BRAND_OWNER]), scopeCheck(brandId via :id), validate(submission)
 *   POST /api/menu-change-requests        — create PENDING change request       — jwtVerify, roleCheck([BRAND_OWNER]), scopeCheck(brandId via body), validate(changeRequest)
 *   GET  /api/menu-change-requests        — list a brand's change requests       — jwtVerify, roleCheck([BRAND_OWNER]), scopeCheck(brandId via query)
 */

// Menu submission locks the brand's menu. scopeCheck("brandId") resolves the id
// from the :id route param.
router.post(
  "/brands/:id/menu-submission",
  jwtVerify,
  roleCheck([ROLES.BRAND_OWNER]),
  scopeCheck("brandId"),
  validate(menuValidator.submission),
  menuController.submitMenu
);

// Create a PENDING menu change request.
router.post(
  "/menu-change-requests",
  jwtVerify,
  roleCheck([ROLES.BRAND_OWNER]),
  scopeCheck("brandId"),
  validate(menuValidator.changeRequest),
  menuController.createChangeRequest
);

// List a brand's change requests.
router.get(
  "/menu-change-requests",
  jwtVerify,
  roleCheck([ROLES.BRAND_OWNER]),
  scopeCheck("brandId"),
  menuController.listChangeRequests
);

module.exports = router;
