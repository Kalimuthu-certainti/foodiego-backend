"use strict";

const app = require("./app");
const { config } = require("./config");
const logger = require("./utils/logger");
const { store } = require("./config/database");
const { seedStore, seedBrands, seedReportsAndPayouts } = require("./db/seeds/seed");

/**
 * HTTP bootstrap. No DB connect — persistence is the in-memory store this phase.
 * Optionally seed demo data on boot (controlled by SEED_ON_BOOT): the demo users,
 * a pre-approved brand per owner (mirrors the admin having approved them), and
 * brand-level reports + payouts (no create UI, so seeded for the dashboard).
 */
if (config.seedOnBoot) {
  seedStore(store);
  seedBrands(store);
  seedReportsAndPayouts(store);
  logger.info("In-memory store seeded with demo fixtures");
}

app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.env }, "FoodieGo backend listening");
});
