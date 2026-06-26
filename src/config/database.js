"use strict";

/**
 * IN-MEMORY STORE — DATABASE DEFERRED.
 *
 * Persistence for this phase lives entirely in process memory. Repositories are
 * the ONLY consumers of `store`, which means a real Postgres pool can be dropped
 * in here later with zero changes to services/controllers.
 *
 * SWAP-TO-PG SEAM:
 *   When the DB is wired up, this file becomes the `pg.Pool` singleton:
 *     const { Pool } = require("pg");
 *     const pool = new Pool({ connectionString: config.databaseUrl });
 *     module.exports = { pool };
 *   ...and each repository swaps its Map operations for `pool.query(...)`.
 *   The DDL for the real tables already lives in src/db/migrations/*.sql.
 */

const store = {
  users: new Map(),
  brands: new Map(),
  restaurants: new Map(),
  branches: new Map(),
  mappings: new Map(),
  menuChangeRequests: new Map(),
  payouts: new Map(),
  orders: new Map(),
  reports: [],
  auditLogs: [],
};

/**
 * Empty every collection. Used by tests between cases and by the seeder.
 */
function reset() {
  store.users.clear();
  store.brands.clear();
  store.restaurants.clear();
  store.branches.clear();
  store.mappings.clear();
  store.menuChangeRequests.clear();
  store.payouts.clear();
  store.orders.clear();
  store.reports.length = 0;
  store.auditLogs.length = 0;
}

module.exports = { store, reset };
