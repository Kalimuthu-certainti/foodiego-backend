"use strict";

/**
 * Integration tests for the auth domain (Jest + Supertest).
 *
 * Each case starts from a freshly reset + re-seeded in-memory store via
 * helpers.resetStore() in beforeEach. The app under test is assembled locally
 * from the auth router + central error handler so these tests do not depend on
 * sibling domain routers that are built by other agents.
 */

const express = require("express");
const request = require("supertest");

const { resetStore, fixtures } = require("./helpers");
const authRoutes = require("../../src/routes/auth.routes");
const { errorHandler } = require("../../src/middlewares/errorHandler");

// Minimal app mirroring src/app.js wiring for just the auth surface.
const app = express();
app.use(express.json());
app.use("/api", authRoutes);
app.use(errorHandler);

beforeEach(() => {
  resetStore();
});

describe("POST /api/auth/login", () => {
  it("returns 200 with tokens and the user for seeded OWNER1 credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: fixtures.OWNER1.email, password: fixtures.PASSWORD });

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe("string");
    expect(res.body.accessToken.length).toBeGreaterThan(0);
    expect(typeof res.body.refreshToken).toBe("string");
    expect(res.body.refreshToken.length).toBeGreaterThan(0);
    expect(res.body.user).toEqual({
      id: fixtures.OWNER1.id,
      email: fixtures.OWNER1.email,
      role: fixtures.OWNER1.role,
    });
    // Never leak the password hash.
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it("returns 401 for a wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: fixtures.OWNER1.email, password: "WrongPassword!" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.accessToken).toBeUndefined();
  });

  it("returns 401 for an unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@foodiego.test", password: fixtures.PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 when the body fails validation", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.details)).toBe(true);
  });
});

describe("POST /api/auth/refresh", () => {
  it("mints a fresh access token from a valid refresh token", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: fixtures.OWNER1.email, password: fixtures.PASSWORD });

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: loginRes.body.refreshToken });

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe("string");
    expect(res.body.accessToken.length).toBeGreaterThan(0);
  });

  it("returns 401 for a garbage refresh token", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "not.a.real.token" });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout + GET /api/auth/me", () => {
  it("me returns the authenticated caller's identity", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: fixtures.OWNER1.email, password: fixtures.PASSWORD });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(fixtures.OWNER1.id);
    expect(res.body.user.role).toBe(fixtures.OWNER1.role);
  });

  it("me without a token returns 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("logout returns 204 and revokes the refresh token", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: fixtures.OWNER1.email, password: fixtures.PASSWORD });

    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

    expect(logoutRes.status).toBe(204);

    // The previously-issued refresh token is now revoked.
    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: loginRes.body.refreshToken });

    expect(refreshRes.status).toBe(401);
  });
});
