"use strict";

/**
 * Integration coverage for the report / payout routes.
 *
 * State setup: the seed only creates the fixture users, so each test inserts a
 * brand owned by OWNER1 (plus a payout row) straight through the repositories —
 * this keeps the report layer's tests independent of the brand-creation route.
 */

const request = require("supertest");

const { app, resetStore, login, fixtures } = require("./helpers");
const brandRepository = require("../../src/repositories/brand.repository");
const payoutRepository = require("../../src/repositories/payout.repository");

const BRAND_ID = "2f8a4b6c-7d9e-4f1a-8b2c-3d5e6f7a8b9c";

/** Seed a brand owned by OWNER1 + one payout for it. */
async function seedBrandWithPayout() {
  await brandRepository.create({
    id: BRAND_ID,
    owner_id: fixtures.OWNER1.id,
    name: "Owner One Brand",
  });
  await payoutRepository.create({
    brand_id: BRAND_ID,
    period: "2026-06",
    gross: 1000,
    fee: 100,
    net: 900,
  });
}

async function tokenFor(email) {
  const res = await login(request, email, fixtures.PASSWORD);
  return res.body.accessToken;
}

describe("report routes", () => {
  beforeEach(async () => {
    resetStore();
    await seedBrandWithPayout();
  });

  describe("GET /api/brands/:id/reports", () => {
    test("returns 200 with an (empty) array for the owning brand owner", async () => {
      const token = await tokenFor(fixtures.OWNER1.email);

      const res = await request(app)
        .get(`/api/brands/${BRAND_ID}/reports`)
        .query({ from: "2026-06-01", to: "2026-06-30" })
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });
  });

  describe("GET /api/brands/:id/payouts", () => {
    test("OWNER1 gets the brand payouts as JSON", async () => {
      const token = await tokenFor(fixtures.OWNER1.email);

      const res = await request(app)
        .get(`/api/brands/${BRAND_ID}/payouts`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        brand_id: BRAND_ID,
        period: "2026-06",
        net: 900,
      });
    });

    test("OWNER2 cannot read OWNER1's payouts -> 403", async () => {
      const token = await tokenFor(fixtures.OWNER2.email);

      const res = await request(app)
        .get(`/api/brands/${BRAND_ID}/payouts`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
    });

    test("format=csv returns text/csv with a header row", async () => {
      const token = await tokenFor(fixtures.OWNER1.email);

      const res = await request(app)
        .get(`/api/brands/${BRAND_ID}/payouts`)
        .query({ format: "csv" })
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/csv/);
      expect(typeof res.text).toBe("string");

      const lines = res.text.split("\n");
      expect(lines[0]).toBe("id,brand_id,period,gross,fee,net,status");
      // header + one payout row
      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain(BRAND_ID);
      expect(lines[1]).toContain("2026-06");
    });
  });
});
