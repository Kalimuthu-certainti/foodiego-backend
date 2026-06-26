"use strict";

/**
 * Shared integration-test utilities.
 *
 * Exposes the Express app, a store reset+seed helper, a login helper, and the
 * seeded fixture identities so each test file can set up a clean, known state.
 */
const app = require("../../src/app");
const { store, reset } = require("../../src/config/database");
const { seedStore } = require("../../src/db/seeds/seed");

/**
 * Wipe the in-memory store and re-seed the demo fixtures. Call in beforeEach so
 * every test starts from an identical baseline.
 */
function resetStore() {
  reset();
  seedStore(store);
}

/**
 * Perform a login round-trip via the real auth route.
 * @param {import('supertest').SuperTest} request a supertest instance bound to `app`
 * @returns the supertest response (body has accessToken, refreshToken, user)
 */
function login(request, email, password) {
  return request(app).post("/api/auth/login").send({ email, password });
}

const PASSWORD = "Password123!";

const fixtures = {
  OWNER1: {
    id: "7a3f9b2e-1c4d-4e8f-a5b6-2d7c8e9f0a1b",
    email: "owner1@foodiego.test",
    role: "BRAND_OWNER",
  },
  OWNER2: {
    id: "8b4e0c3f-2d5e-5f9a-b6c7-3e8d9f0a1b2c",
    email: "owner2@foodiego.test",
    role: "BRAND_OWNER",
  },
  STAFF1: {
    id: "9c5f1d4a-3e6f-6a0b-c7d8-4f9e0a1b2c3d",
    email: "staff1@foodiego.test",
    role: "RESTAURANT_MANAGER",
    phone: "9999999999",
  },
  PASSWORD,
};

module.exports = { app, resetStore, login, fixtures };
