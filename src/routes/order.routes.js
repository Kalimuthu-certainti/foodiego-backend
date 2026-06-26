"use strict";

/**
 * Order routes (mounted under /api by routes/index.js).
 *
 * Layer chain per request: jwtVerify -> roleCheck([BRAND_OWNER]) -> controller.
 *
 * ROUTE MAP (mounted under /api):
 *   GET /api/orders/summary       — order counts by status  — jwt + role
 *   GET /api/orders               — paginated order list    — jwt + role
 *   GET /api/orders/:id           — single order detail     — jwt + role
 *   PUT /api/orders/:id/cancel    — cancel placed/confirmed — jwt + role
 *
 * Note: /orders/summary MUST be declared before /orders/:id so Express does
 * not interpret "summary" as a dynamic :id segment.
 */

const express = require("express");
const jwtVerify = require("../middlewares/jwtVerify");
const roleCheck = require("../middlewares/roleCheck");
const { ROLES } = require("../config/constants");
const orderController = require("../controllers/order.controller");

const router = express.Router();
const auth = [jwtVerify, roleCheck([ROLES.BRAND_OWNER])];

// GET /api/orders/summary
router.get("/orders/summary", ...auth, orderController.getSummary);

// GET /api/orders
router.get("/orders", ...auth, orderController.list);

// GET /api/orders/:id
router.get("/orders/:id", ...auth, orderController.getById);

// PUT /api/orders/:id/cancel
router.put("/orders/:id/cancel", ...auth, orderController.cancelOrder);

module.exports = router;
