"use strict";

/**
 * Optional Postgres pool used to PERSIST the main entities (restaurants, users,
 * staff). It's intentionally OPT-IN:
 *
 *   - No DATABASE_URL  -> null  (local dev / CI without a DB)
 *   - NODE_ENV=test    -> null  (the 84 integration tests stay pure in-memory)
 *   - Otherwise        -> a real pool (production on Render)
 *
 * Repositories keep the in-memory store as the source of truth and, when this
 * pool exists, ALSO write through to Postgres + load from it on boot. So nothing
 * changes for tests, and production gains persistence across restarts.
 */
const { Pool } = require("pg");
const { config } = require("./index");

let pool = null;

if (process.env.DATABASE_URL && config.env !== "test") {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  pool.on("error", (err) => {
    // Never crash the app on a transient pool error — persistence is best-effort.
    console.error("[pgPool] Postgres pool error:", err.message);
  });
}

module.exports = pool;
