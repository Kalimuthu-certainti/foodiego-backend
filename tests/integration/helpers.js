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
    id: "11111111-1111-1111-1111-111111111111",
    email: "owner1@foodiego.test",
    role: "BRAND_OWNER",
  },
  OWNER2: {
    id: "22222222-2222-2222-2222-222222222222",
    email: "owner2@foodiego.test",
    role: "BRAND_OWNER",
  },
  STAFF1: {
    id: "33333333-3333-3333-3333-333333333333",
    email: "staff1@foodiego.test",
    role: "RESTAURANT_MANAGER",
    phone: "9999999999",
  },
  PASSWORD,
};

module.exports = { app, resetStore, login, fixtures };
