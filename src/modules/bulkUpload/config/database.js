"use strict";

// Postgres pool for the bulk-upload module ONLY. The rest of the backend is the
// in-memory store; this is the one piece that needs a real DB (DATABASE_URL).
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.BULK_UPLOAD_DB_URL || process.env.DATABASE_URL,
});

pool.on("connect", () => {
  console.log("[bulkUpload] PostgreSQL connected");
});

// Log pool errors but do NOT process.exit — a transient bulk-upload DB error must
// not take down the rest of the (in-memory) backend.
pool.on("error", (err) => {
  console.error("[bulkUpload] Unexpected Postgres pool error:", err.message);
});

module.exports = pool;
