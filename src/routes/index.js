"use strict";

const express = require("express");

/**
 * Root API router — mounted under "/api" by app.js. Each per-domain router
 * declares its own subpaths.
 *
 * API MAP (all paths are relative to /api; see each routes file for per-endpoint docs):
 *
 *   AUTH        (public except logout/me)
 *     POST   /auth/login                      issue access + refresh tokens
 *     POST   /auth/refresh                    exchange refresh -> new access
 *     POST   /auth/logout                     revoke caller refresh tokens   [jwt]
 *     GET    /auth/me                          current token identity         [jwt]
 *
 *   The routes below all require [jwt] + role BRAND_OWNER (payouts also ADMIN):
 *     BRAND
 *       POST   /brands                         create brand (auto-approved)
 *       GET    /brands                         list caller-owned brands
 *       GET    /brands/:id                     get brand                    [scope:brandId]
 *       PATCH  /brands/:id                     update own brand             [scope:brandId]
 *       DELETE /brands/:id                     delete own brand             [scope:brandId]
 *     RESTAURANT
 *       POST   /restaurants                    add restaurant               [scope:brandId]
 *       GET    /restaurants?brandId=           list by brand                [scope:brandId]
 *     BRANCH
 *       POST   /branches                       add branch                   [scope:restaurantId]
 *       GET    /branches?restaurantId=         list by restaurant           [scope:restaurantId]
 *     STAFF
 *       POST   /restaurant-users               invite staff (+SMS)          [scope:brandId]
 *       DELETE /restaurant-users/:id           remove staff (+revoke)       [scope:mappingId]
 *       GET    /restaurant-users?brandId=      list by brand                [scope:brandId]
 *     MENU
 *       POST   /brands/:id/menu-submission     submit + lock menu           [scope:brandId]
 *       POST   /menu-change-requests           request post-lock change     [scope:brandId]
 *       GET    /menu-change-requests?brandId=  list change requests         [scope:brandId]
 *     REPORT
 *       GET    /brands/:id/reports?from=&to=   brand report rows            [scope:brandId]
 *       GET    /brands/:id/payouts?format=csv  payouts (JSON or CSV)        [scope:brandId, +ADMIN]
 */
const authRoutes = require("./auth.routes");
const brandRoutes = require("./brand.routes");
const restaurantRoutes = require("./restaurant.routes");
const branchRoutes = require("./branch.routes");
const staffRoutes = require("./staff.routes");
const menuRoutes = require("./menu.routes");
const reportRoutes = require("./report.routes");

const router = express.Router();

router.use(authRoutes);
router.use(brandRoutes);
router.use(restaurantRoutes);
router.use(branchRoutes);
router.use(staffRoutes);
router.use(menuRoutes);
router.use(reportRoutes);

module.exports = router;
