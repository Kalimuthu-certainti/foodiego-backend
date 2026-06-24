"use strict";

/**
 * Auth routes. These are the ONLY endpoints that do NOT require roleCheck (and
 * login/refresh require no auth at all). Layering: route -> middleware ->
 * controller -> service.
 *
 *   POST /api/auth/login    (validate)            -> { accessToken, refreshToken, user }
 *   POST /api/auth/refresh  (validate)            -> { accessToken }
 *   POST /api/auth/logout   (jwtVerify)           -> 204
 *   GET  /api/auth/me       (jwtVerify)           -> { user }
 */

const express = require("express");
const jwtVerify = require("../middlewares/jwtVerify");
const validate = require("../middlewares/validate");
const authValidator = require("../validators/auth.validator");
const authController = require("../controllers/auth.controller");

const router = express.Router();

/**
 * ROUTE MAP — auth router (mounted under /api)
 *   POST /api/auth/login    — authenticate, issue tokens   — validate (Public)
 *   POST /api/auth/refresh  — refresh access token         — validate (Public)
 *   POST /api/auth/logout   — revoke caller refresh tokens — jwtVerify (Private)
 *   GET  /api/auth/me       — current authenticated user   — jwtVerify (Private)
 */

router.post("/auth/login", validate(authValidator.login), authController.login);
router.post(
  "/auth/refresh",
  validate(authValidator.refresh),
  authController.refresh
);
router.post("/auth/logout", jwtVerify, authController.logout);
router.get("/auth/me", jwtVerify, authController.me);

module.exports = router;
