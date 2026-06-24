"use strict";

/**
 * Report / payout routes (mounted under /api by routes/index.js).
 *
 * Layer chain per request: jwtVerify -> roleCheck -> scopeCheck -> controller.
 *   - jwtVerify  attaches req.user from the Bearer access token.
 *   - roleCheck  gates by role (payouts additionally allows ADMIN).
 *   - scopeCheck resolves the :id route param as a brandId and confirms the
 *     caller owns that brand (else SCOPE_DENIED audit + 403).
 *
 * Both endpoints are read-only, so there is no request body to validate.
 */

/**
 * ROUTE MAP (mounted under /api):
 *   GET /api/brands/:id/reports?from=&to=  — brand report rows — jwtVerify + roleCheck([BRAND_OWNER]) + scopeCheck(brandId)
 *   GET /api/brands/:id/payouts?format=csv — brand payouts (JSON or CSV) — jwtVerify + roleCheck([BRAND_OWNER, ADMIN]) + scopeCheck(brandId)
 */

const express = require("express");

const jwtVerify = require("../middlewares/jwtVerify");
const roleCheck = require("../middlewares/roleCheck");
const scopeCheck = require("../middlewares/scopeCheck");
const { ROLES } = require("../config/constants");
const reportController = require("../controllers/report.controller");

const router = express.Router();

// GET /api/brands/:id/reports?from=&to=
router.get(
  "/brands/:id/reports",
  jwtVerify,
  roleCheck([ROLES.BRAND_OWNER]),
  scopeCheck("brandId"),
  reportController.getReports
);

// GET /api/brands/:id/payouts?format=csv  (BRAND_OWNER or ADMIN)
router.get(
  "/brands/:id/payouts",
  jwtVerify,
  roleCheck([ROLES.BRAND_OWNER, ROLES.ADMIN]),
  scopeCheck("brandId"),
  reportController.getPayouts
);

module.exports = router;
