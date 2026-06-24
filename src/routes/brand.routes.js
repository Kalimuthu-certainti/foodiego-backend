"use strict";

/**
 * Brand routes (mounted under /api by routes/index.js).
 *
 * Pipeline per the API contract: jwtVerify -> roleCheck([BRAND_OWNER]) on every
 * brand endpoint; scopeCheck("brandId") on the single-resource routes so a
 * Brand Owner can only touch their own brand; validate(...) on the write bodies.
 * Controllers stay thin and the service owns logic + audit.
 */

const express = require("express");

const jwtVerify = require("../middlewares/jwtVerify");
const roleCheck = require("../middlewares/roleCheck");
const scopeCheck = require("../middlewares/scopeCheck");
const validate = require("../middlewares/validate");

const brandController = require("../controllers/brand.controller");
const {
  createBrandSchema,
  updateBrandSchema,
} = require("../validators/brand.validator");
const { ROLES } = require("../config/constants");

const router = express.Router();

/**
 * ROUTE MAP (all under /api; all guarded by jwtVerify + roleCheck([BRAND_OWNER]))
 *   POST   /api/brands       — create a caller-owned brand     — validate(createBrandSchema)
 *   GET    /api/brands       — list caller-owned brands        — (router-level guards only)
 *   GET    /api/brands/:id   — get one brand                   — scopeCheck("brandId")
 *   PATCH  /api/brands/:id   — update one brand                — scopeCheck("brandId"), validate(updateBrandSchema)
 *   DELETE /api/brands/:id   — delete one brand                — scopeCheck("brandId")
 */

// All brand endpoints require an authenticated BRAND_OWNER.
router.use("/brands", jwtVerify, roleCheck([ROLES.BRAND_OWNER]));

router.post(
  "/brands",
  validate(createBrandSchema),
  brandController.create
);

router.get("/brands", brandController.list);

router.get("/brands/:id", scopeCheck("brandId"), brandController.get);

router.patch(
  "/brands/:id",
  scopeCheck("brandId"),
  validate(updateBrandSchema),
  brandController.update
);

router.delete("/brands/:id", scopeCheck("brandId"), brandController.remove);

module.exports = router;
