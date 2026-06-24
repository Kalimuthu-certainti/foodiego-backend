"use strict";

/**
 * Restaurant routes (mounted under /api by routes/index.js).
 *
 * Layering: route -> middleware -> controller -> service -> repository -> store.
 * All endpoints require a Brand Owner; scopeCheck ensures they only touch their
 * own brand. validate runs the Joi schema before the controller.
 *
 * ROUTE MAP
 *   POST /api/restaurants          — create a restaurant for an owned brand
 *                                    guards: jwtVerify, roleCheck([BRAND_OWNER]), validate(createRestaurant body), scopeCheck(brandId)
 *   GET  /api/restaurants?brandId= — list restaurants for an owned brand
 *                                    guards: jwtVerify, roleCheck([BRAND_OWNER]), validate(listByBrand query), scopeCheck(brandId)
 */

const express = require("express");

const jwtVerify = require("../middlewares/jwtVerify");
const roleCheck = require("../middlewares/roleCheck");
const scopeCheck = require("../middlewares/scopeCheck");
const validate = require("../middlewares/validate");
const { ROLES } = require("../config/constants");
const restaurantController = require("../controllers/restaurant.controller");
const {
  createRestaurant,
  listByBrand,
} = require("../validators/restaurant.validator");

const router = express.Router();

router.post(
  "/restaurants",
  jwtVerify,
  roleCheck([ROLES.BRAND_OWNER]),
  validate(createRestaurant),
  scopeCheck("brandId"),
  restaurantController.create
);

router.get(
  "/restaurants",
  jwtVerify,
  roleCheck([ROLES.BRAND_OWNER]),
  validate(listByBrand, "query"),
  scopeCheck("brandId"),
  restaurantController.list
);

module.exports = router;
