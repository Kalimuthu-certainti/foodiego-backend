"use strict";

/**
 * Review routes (mounted under /api by routes/index.js).
 *
 * Layer chain per request: jwtVerify -> roleCheck([BRAND_OWNER]) -> controller.
 *
 * ROUTE MAP (mounted under /api):
 *   GET  /api/reviews/summary      — rating summary (avg, breakdown) — jwt + role
 *   GET  /api/reviews              — paginated review list            — jwt + role
 *   POST /api/reviews/:id/reply    — post first reply to review       — jwt + role
 *   PUT  /api/reviews/:id/reply    — edit existing reply              — jwt + role
 *
 * Note: /reviews/summary MUST be declared before /reviews/:id/... so Express
 * does not interpret "summary" as a dynamic :id segment.
 */

const express = require("express");
const jwtVerify = require("../middlewares/jwtVerify");
const roleCheck = require("../middlewares/roleCheck");
const { ROLES } = require("../config/constants");
const reviewController = require("../controllers/review.controller");

const router = express.Router();
const auth = [jwtVerify, roleCheck([ROLES.BRAND_OWNER])];

// GET /api/reviews/summary
router.get("/reviews/summary", ...auth, reviewController.getSummary);

// GET /api/reviews
router.get("/reviews", ...auth, reviewController.list);

// POST /api/reviews/:id/reply
router.post("/reviews/:id/reply", ...auth, reviewController.createReply);

// PUT /api/reviews/:id/reply
router.put("/reviews/:id/reply", ...auth, reviewController.editReply);

module.exports = router;
