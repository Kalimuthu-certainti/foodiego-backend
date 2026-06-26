"use strict";

const app = require("./app");
const { config } = require("./config");
const logger = require("./utils/logger");
const { store } = require("./config/database");
const { seedStore, seedBrands, seedReportsAndPayouts, seedRestaurantsAndBranchesAndOrders } = require("./db/seeds/seed");
const restaurantRepo = require("./repositories/restaurant.repository");
const userRepo = require("./repositories/user.repository");
const mappingRepo = require("./repositories/mapping.repository");

/**
 * HTTP bootstrap. Seeds demo users + a pre-approved brand per owner in-memory
 * (controlled by SEED_ON_BOOT). When a Postgres DATABASE_URL is set, it then
 * hydrates the store with PERSISTED restaurants/users/staff so they survive
 * restarts (Part B persistence). Reports/payouts are not seeded.
 */
if (config.seedOnBoot) {
  seedStore(store);
  seedBrands(store);
  seedReportsAndPayouts(store);
  seedRestaurantsAndBranchesAndOrders(store);
  logger.info("In-memory store seeded with demo fixtures");
}

// Load persisted data from Postgres (no-op when DATABASE_URL is unset / tests).
// Users first so staff mappings can resolve their member names.
async function hydrateFromDb() {
  try {
    const users = await userRepo.loadAll();
    const restaurants = await restaurantRepo.loadAll();
    const mappings = await mappingRepo.loadAll();
    if (users + restaurants + mappings > 0) {
      logger.info({ users, restaurants, mappings }, "Hydrated persisted data from Postgres");
    }
  } catch (err) {
    logger.error({ err }, "Failed to hydrate persisted data from Postgres");
  }
}

hydrateFromDb();

app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.env }, "FoodieGo backend listening");
});
