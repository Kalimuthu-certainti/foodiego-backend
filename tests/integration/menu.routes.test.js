"use strict";

/**
 * Integration tests for the MENU domain (Jest + Supertest).
 *
 * Flow under test:
 *   - First menu submission -> 200, brand becomes menu_locked: true.
 *   - Second submission of the same brand -> 409 (already locked).
 *   - Creating a menu change request -> 201, status PENDING.
 *
 * The store is reset+seeded before each test. The seed only inserts users, so
 * we create a brand owned by OWNER1 directly through the brand repository
 * (no dependency on sibling brand routes).
 */

const request = require("supertest");
const { app, resetStore, login, fixtures } = require("./helpers");
const brandRepo = require("../../src/repositories/brand.repository");
const audit = require("../../src/utils/audit");
const { AUDIT_ACTION, ENTITY } = require("../../src/config/constants");

/** Create an APPROVED brand owned by the given user. */
async function seedBrand(ownerId, name = "Owner1 Brand") {
  return brandRepo.create({ owner_id: ownerId, name });
}

/** Log in as a fixture and return the bearer access token. */
async function tokenFor(email) {
  const res = await login(request, email, fixtures.PASSWORD);
  return res.body.accessToken;
}

describe("MENU routes", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("POST /api/brands/:id/menu-submission", () => {
    it("first submission returns 200 and locks the menu (menu_locked true)", async () => {
      const token = await tokenFor(fixtures.OWNER1.email);
      const brand = await seedBrand(fixtures.OWNER1.id);

      const res = await request(app)
        .post(`/api/brands/${brand.id}/menu-submission`)
        .set("Authorization", `Bearer ${token}`)
        .send({ items: [{ name: "Pizza", price: 9.99 }] });

      expect(res.status).toBe(200);
      expect(res.body.menu_locked).toBe(true);
      expect(res.body.id).toBe(brand.id);

      // The persisted brand row is locked too.
      const stored = await brandRepo.findById(brand.id);
      expect(stored.menu_locked).toBe(true);

      // A single UPDATE audit row was written for the brand.
      const entries = audit.find({
        action: AUDIT_ACTION.UPDATE,
        entity: ENTITY.BRAND,
        entity_id: brand.id,
      });
      expect(entries).toHaveLength(1);
      expect(entries[0].actor_id).toBe(fixtures.OWNER1.id);
    });

    it("second submission of an already-locked menu returns 409", async () => {
      const token = await tokenFor(fixtures.OWNER1.email);
      const brand = await seedBrand(fixtures.OWNER1.id);

      const first = await request(app)
        .post(`/api/brands/${brand.id}/menu-submission`)
        .set("Authorization", `Bearer ${token}`)
        .send({ items: [{ name: "Pizza" }] });
      expect(first.status).toBe(200);

      const second = await request(app)
        .post(`/api/brands/${brand.id}/menu-submission`)
        .set("Authorization", `Bearer ${token}`)
        .send({ items: [{ name: "Burger" }] });

      expect(second.status).toBe(409);
      expect(second.body.error).toBeDefined();
    });

    it("rejects a submission with no items (400)", async () => {
      const token = await tokenFor(fixtures.OWNER1.email);
      const brand = await seedBrand(fixtures.OWNER1.id);

      const res = await request(app)
        .post(`/api/brands/${brand.id}/menu-submission`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("forbids submitting to a brand the caller does not own (403)", async () => {
      const token = await tokenFor(fixtures.OWNER2.email);
      const brand = await seedBrand(fixtures.OWNER1.id);

      const res = await request(app)
        .post(`/api/brands/${brand.id}/menu-submission`)
        .set("Authorization", `Bearer ${token}`)
        .send({ items: [{ name: "Pizza" }] });

      expect(res.status).toBe(403);
    });

    it("requires authentication (401)", async () => {
      const brand = await seedBrand(fixtures.OWNER1.id);

      const res = await request(app)
        .post(`/api/brands/${brand.id}/menu-submission`)
        .send({ items: [{ name: "Pizza" }] });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/menu-change-requests", () => {
    it("creates a PENDING change request and returns 201", async () => {
      const token = await tokenFor(fixtures.OWNER1.email);
      const brand = await seedBrand(fixtures.OWNER1.id);

      const res = await request(app)
        .post("/api/menu-change-requests")
        .set("Authorization", `Bearer ${token}`)
        .send({
          brandId: brand.id,
          items: [{ name: "Salad", price: 5 }],
          reason: "Adding a seasonal item",
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.brand_id).toBe(brand.id);
      expect(res.body.status).toBe("pending");
      expect(res.body.reason).toBe("Adding a seasonal item");

      // A CREATE audit row was written for the change request.
      const entries = audit.find({
        action: AUDIT_ACTION.CREATE,
        entity: ENTITY.MENU_CHANGE_REQUEST,
        entity_id: res.body.id,
      });
      expect(entries).toHaveLength(1);
      expect(entries[0].actor_id).toBe(fixtures.OWNER1.id);
    });

    it("creates a change request without a reason (201)", async () => {
      const token = await tokenFor(fixtures.OWNER1.email);
      const brand = await seedBrand(fixtures.OWNER1.id);

      const res = await request(app)
        .post("/api/menu-change-requests")
        .set("Authorization", `Bearer ${token}`)
        .send({ brandId: brand.id, items: [{ name: "Soup" }] });

      expect(res.status).toBe(201);
      expect(res.body.reason).toBeNull();
    });

    it("forbids a change request against another owner's brand (403)", async () => {
      const token = await tokenFor(fixtures.OWNER2.email);
      const brand = await seedBrand(fixtures.OWNER1.id);

      const res = await request(app)
        .post("/api/menu-change-requests")
        .set("Authorization", `Bearer ${token}`)
        .send({ brandId: brand.id, items: [{ name: "Soup" }] });

      expect(res.status).toBe(403);
    });

    it("rejects a change request missing items (400)", async () => {
      const token = await tokenFor(fixtures.OWNER1.email);
      const brand = await seedBrand(fixtures.OWNER1.id);

      const res = await request(app)
        .post("/api/menu-change-requests")
        .set("Authorization", `Bearer ${token}`)
        .send({ brandId: brand.id });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/menu-change-requests", () => {
    it("lists the brand's change requests", async () => {
      const token = await tokenFor(fixtures.OWNER1.email);
      const brand = await seedBrand(fixtures.OWNER1.id);

      await request(app)
        .post("/api/menu-change-requests")
        .set("Authorization", `Bearer ${token}`)
        .send({ brandId: brand.id, items: [{ name: "Soup" }] });

      const res = await request(app)
        .get("/api/menu-change-requests")
        .query({ brandId: brand.id })
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].brand_id).toBe(brand.id);
    });
  });
});
