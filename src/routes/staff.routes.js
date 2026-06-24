"use strict";

/**
 * Staff (restaurant_user_mapping) routes, mounted under /api by routes/index.
 *
 * Middleware order per the API contract:
 *   jwtVerify -> roleCheck([BRAND_OWNER]) -> scopeCheck(<key>) -> validate -> controller
 *
 * Scope keys:
 *   POST   /restaurant-users      -> scopeCheck("brandId")    (from body)
 *   DELETE /restaurant-users/:id  -> scopeCheck("mappingId")  (from :id)
 *   GET    /restaurant-users      -> scopeCheck("brandId")    (from query)
 */

const express = require("express");

const jwtVerify = require("../middlewares/jwtVerify");
const roleCheck = require("../middlewares/roleCheck");
const scopeCheck = require("../middlewares/scopeCheck");
const validate = require("../middlewares/validate");
const { ROLES } = require("../config/constants");
const { inviteSchema } = require("../validators/staff.validator");
const staffController = require("../controllers/staff.controller");

const router = express.Router();

/**
 * ROUTE MAP — restaurant_user_mapping (mounted under /api)
 *   POST   /api/restaurant-users      — invite user to brand scope (201 Mapping) — jwtVerify, roleCheck([BRAND_OWNER]), scopeCheck(brandId), validate(inviteSchema)
 *   DELETE /api/restaurant-users/:id   — remove staff mapping (204)             — jwtVerify, roleCheck([BRAND_OWNER]), scopeCheck(mappingId)
 *   GET    /api/restaurant-users       — list mappings for brand (200 Mapping[]) — jwtVerify, roleCheck([BRAND_OWNER]), scopeCheck(brandId)
 */

router.post(
  "/restaurant-users",
  jwtVerify,
  roleCheck([ROLES.BRAND_OWNER]),
  scopeCheck("brandId"),
  validate(inviteSchema),
  staffController.invite
);

router.delete(
  "/restaurant-users/:id",
  jwtVerify,
  roleCheck([ROLES.BRAND_OWNER]),
  scopeCheck("mappingId"),
  staffController.remove
);

router.get(
  "/restaurant-users",
  jwtVerify,
  roleCheck([ROLES.BRAND_OWNER]),
  scopeCheck("brandId"),
  staffController.list
);

module.exports = router;
