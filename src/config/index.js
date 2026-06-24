"use strict";

/**
 * Central config loader. Reads .env via dotenv and exposes a single frozen
 * `config` object. No other module should read process.env directly.
 */
require("dotenv").config();

const env = process.env.NODE_ENV || "development";

const config = Object.freeze({
  env,
  port: Number(process.env.PORT || 4000),
  jwt: Object.freeze({
    accessSecret: process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_me",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me",
    accessTtl: process.env.ACCESS_TOKEN_TTL || "15m",
    refreshTtl: process.env.REFRESH_TOKEN_TTL || "7d",
  }),
  // Auto-approve gate. Kept behind a flag so flipping it later needs no rewrite.
  requireAdminApproval: process.env.REQUIRE_ADMIN_APPROVAL === "true",
  msg91: Object.freeze({
    apiKey: process.env.MSG91_API_KEY || "",
    sender: process.env.MSG91_SENDER || "FOODGO",
  }),
  logLevel: process.env.LOG_LEVEL || "info",
  seedOnBoot: process.env.SEED_ON_BOOT !== "false",
  // Allowed browser origins for CORS. In the two-repo setup the frontend is
  // served from a different origin (e.g. GitHub Pages) than this API, so the
  // browser blocks calls unless we explicitly allow that origin. Comma-separate
  // FRONTEND_URL to allow several (e.g. localhost + the deployed site).
  frontendUrls: (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
});

module.exports = { config };
