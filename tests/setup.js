"use strict";

/**
 * Global Jest setup (loaded via setupFilesAfterEach -> setupFilesAfterEnv).
 * Forces the test environment and quiet logging so test output stays readable.
 * No DB to connect/teardown — persistence is the in-memory store.
 */
process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.LOG_LEVEL = process.env.LOG_LEVEL || "silent";
// Keep auto-approve on for the test phase unless a test overrides it.
process.env.REQUIRE_ADMIN_APPROVAL = process.env.REQUIRE_ADMIN_APPROVAL || "false";
// Tests seed explicitly via helpers.resetStore(); never auto-seed on import.
process.env.SEED_ON_BOOT = "false";

jest.setTimeout(15000);
