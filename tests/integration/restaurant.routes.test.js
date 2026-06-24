"use strict";

/**
 * Integration tests for the restaurant routes (Jest + Supertest, no DB).
 *
 * The seed inserts only users, so each test seeds an owned brand directly via
 * the brand repository (data-access layer) so scopeCheck("brandId") resolves to
 * the logged-in owner. This keeps the suite independent of sibling route agents.
 */

const request = require("supertest");
const { app, resetStore, login, fixtures } = require("./helpers");
const brandRepo = require("../../src/repositories/brand.repository");
const audit = require("../../src/utils/audit");
const { AUDIT_ACTION, ENTITY } = require("../../src/config/constants");

const VALID_GST = "22AAAAA0000A1Z5"; // 15 chars
const SHORT_GST = "22AAAAA0000A1Z"; // 14 chars

async function authHeaderFor(email) {
  const res = await login(request, email, fixtures.PASSWORD);
  return `Bearer ${res.body.accessToken}`;
}

/**
 * Seed an approved brand owned by ownerId and return it.
 */
function seedBrand(ownerId, name = "Owner One Brand") {
  return brandRepo.create({ owner_id: ownerId, name });
}

describe("restaurant.routes", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("POST /api/restaurants", () => {
    it("rejects a 14-char gstNo with 400", async () => {
      const brand = await seedBrand(fixtures.OWNER1.id);
      const auth = await authHeaderFor(fixtures.OWNER1.email);

      const res = await request(app)
        .post("/api/restaurants")
        .set("Authorization", auth)
        .send({
          brandId: brand.id,
          name: "Downtown Diner",
          gstNo: SHORT_GST,
          email: "diner@foodiego.test",
          phone: "9876543210",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details.join(" ")).toMatch(/gstNo/i);
    });

    it("creates a restaurant under an owned brand with valid payload (201) and audits CREATE", async () => {
      const brand = await seedBrand(fixtures.OWNER1.id);
      const auth = await authHeaderFor(fixtures.OWNER1.email);

      const res = await request(app)
        .post("/api/restaurants")
        .set("Authorization", auth)
        .send({
          brandId: brand.id,
          name: "Downtown Diner",
          gstNo: VALID_GST,
          email: "diner@foodiego.test",
          phone: "9876543210",
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        brand_id: brand.id,
        name: "Downtown Diner",
        gst_no: VALID_GST,
        email: "diner@foodiego.test",
        phone: "9876543210",
      });
      expect(res.body.id).toEqual(expect.any(String));

      const entries = audit.find({
        action: AUDIT_ACTION.CREATE,
        entity: ENTITY.RESTAURANT,
        entity_id: res.body.id,
      });
      expect(entries).toHaveLength(1);
      expect(entries[0].actor_id).toBe(fixtures.OWNER1.id);
    });

    it("rejects creating under a brand the caller does not own (403)", async () => {
      const othersBrand = await seedBrand(fixtures.OWNER2.id, "Owner Two Brand");
      const auth = await authHeaderFor(fixtures.OWNER1.email);

      const res = await request(app)
        .post("/api/restaurants")
        .set("Authorization", auth)
        .send({
          brandId: othersBrand.id,
          name: "Sneaky Diner",
          gstNo: VALID_GST,
          email: "diner@foodiego.test",
          phone: "9876543210",
        });

      expect(res.status).toBe(403);
    });

    it("requires authentication (401)", async () => {
      const brand = await seedBrand(fixtures.OWNER1.id);
      const res = await request(app)
        .post("/api/restaurants")
        .send({
          brandId: brand.id,
          name: "Downtown Diner",
          gstNo: VALID_GST,
          email: "diner@foodiego.test",
          phone: "9876543210",
        });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/restaurants?brandId=", () => {
    it("lists restaurants by brandId for the owning brand", async () => {
      const brand = await seedBrand(fixtures.OWNER1.id);
      const auth = await authHeaderFor(fixtures.OWNER1.email);

      await request(app)
        .post("/api/restaurants")
        .set("Authorization", auth)
        .send({
          brandId: brand.id,
          name: "Downtown Diner",
          gstNo: VALID_GST,
          email: "diner@foodiego.test",
          phone: "9876543210",
        });

      const res = await request(app)
        .get("/api/restaurants")
        .query({ brandId: brand.id })
        .set("Authorization", auth);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        brand_id: brand.id,
        name: "Downtown Diner",
      });
    });

    it("rejects listing a brand the caller does not own (403)", async () => {
      const othersBrand = await seedBrand(fixtures.OWNER2.id, "Owner Two Brand");
      const auth = await authHeaderFor(fixtures.OWNER1.email);

      const res = await request(app)
        .get("/api/restaurants")
        .query({ brandId: othersBrand.id })
        .set("Authorization", auth);

      expect(res.status).toBe(403);
    });
  });
});
