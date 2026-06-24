"use strict";

/**
 * Branch routes. Mounted under /api by routes/index.js.
 *
 * Every endpoint requires a valid access token (jwtVerify) and the BRAND_OWNER
 * role (roleCheck). Ownership is enforced by scopeCheck("restaurantId"), which
 * resolves restaurant -> brand -> owner before the controller runs. Bodies and
 * query strings are validated by Joi schemas via the validate middleware.
 *
 *   POST /api/branches                 scopeCheck(restaurantId), validate body
 *   GET  /api/branches?restaurantId=   scopeCheck(restaurantId from query), validate query
 */

const express = require("express");

const branchController = require("../controllers/branch.controller");
const jwtVerify = require("../middlewares/jwtVerify");
const roleCheck = require("../middlewares/roleCheck");
const scopeCheck = require("../middlewares/scopeCheck");
const validate = require("../middlewares/validate");
const { createBranch, listBranchesQuery } = require("../validators/branch.validator");
const { ROLES } = require("../config/constants");

const router = express.Router();

/**
 * ROUTE MAP — branch router (mounted under /api)
 *   POST /api/branches                 — Create a branch — jwtVerify, roleCheck(BRAND_OWNER), validate(body), scopeCheck(restaurantId)
 *   GET  /api/branches?restaurantId=   — List branches by restaurant — jwtVerify, roleCheck(BRAND_OWNER), validate(query), scopeCheck(restaurantId)
 */

router.post(
  "/branches",
  jwtVerify,
  roleCheck([ROLES.BRAND_OWNER]),
  validate(createBranch),
  scopeCheck("restaurantId"),
  branchController.create
);

router.get(
  "/branches",
  jwtVerify,
  roleCheck([ROLES.BRAND_OWNER]),
  validate(listBranchesQuery, "query"),
  scopeCheck("restaurantId"),
  branchController.list
);

module.exports = router;
