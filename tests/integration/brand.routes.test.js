"use strict";

/**
 * Integration tests for the brand domain layer (Jest + Supertest).
 *
 * Runs against the real Express app and the in-memory store. Each test starts
 * from a freshly seeded baseline via resetStore() in beforeEach.
 *
 * Access tokens are minted directly via utils/tokens so the brand suite does
 * not depend on the auth route sibling being present. The seeded fixtures
 * (OWNER1, OWNER2) are both BRAND_OWNER and satisfy roleCheck.
 */

const request = require("supertest");
const { app, resetStore, fixtures } = require("./helpers");
const { issueAccessToken } = require("../../src/utils/tokens");
const audit = require("../../src/utils/audit");
const { AUDIT_ACTION } = require("../../src/config/constants");

function tokenFor(fixture) {
  return issueAccessToken({
    id: fixture.id,
    role: fixture.role,
    scopes: [],
  });
}

function authHeader(fixture) {
  return `Bearer ${tokenFor(fixture)}`;
}

describe("Brand routes", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("POST /api/brands", () => {
    it("creates an auto-approved, active brand and returns 201", async () => {
      const res = await request(app)
        .post("/api/brands")
        .set("Authorization", authHeader(fixtures.OWNER1))
        .send({ name: "Burger Barn" });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        owner_id: fixtures.OWNER1.id,
        name: "Burger Barn",
        status: "approved",
        is_active: true,
      });
      expect(res.body.id).toEqual(expect.any(String));

      // Mutations write an audit entry.
      const created = audit.find({
        action: AUDIT_ACTION.CREATE,
        entity_id: res.body.id,
      });
      expect(created).toHaveLength(1);
      expect(created[0].actor_id).toBe(fixtures.OWNER1.id);
    });

    it("rejects an empty body with 400", async () => {
      const res = await request(app)
        .post("/api/brands")
        .set("Authorization", authHeader(fixtures.OWNER1))
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    it("requires authentication", async () => {
      const res = await request(app).post("/api/brands").send({ name: "Nope" });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/brands", () => {
    it("lists only the caller's own brands", async () => {
      await request(app)
        .post("/api/brands")
        .set("Authorization", authHeader(fixtures.OWNER1))
        .send({ name: "Owner1 Brand" });

      await request(app)
        .post("/api/brands")
        .set("Authorization", authHeader(fixtures.OWNER2))
        .send({ name: "Owner2 Brand" });

      const res = await request(app)
        .get("/api/brands")
        .set("Authorization", authHeader(fixtures.OWNER1));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Owner1 Brand");
      expect(res.body[0].owner_id).toBe(fixtures.OWNER1.id);
    });
  });

  describe("GET /api/brands/:id", () => {
    it("returns an owned brand", async () => {
      const created = await request(app)
        .post("/api/brands")
        .set("Authorization", authHeader(fixtures.OWNER1))
        .send({ name: "Readable" });

      const res = await request(app)
        .get(`/api/brands/${created.body.id}`)
        .set("Authorization", authHeader(fixtures.OWNER1));

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
    });
  });

  describe("PATCH /api/brands/:id", () => {
    it("updates an owned brand and writes an UPDATE audit entry", async () => {
      const created = await request(app)
        .post("/api/brands")
        .set("Authorization", authHeader(fixtures.OWNER1))
        .send({ name: "Before" });

      const res = await request(app)
        .patch(`/api/brands/${created.body.id}`)
        .set("Authorization", authHeader(fixtures.OWNER1))
        .send({ name: "After" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("After");

      const updates = audit.find({
        action: AUDIT_ACTION.UPDATE,
        entity_id: created.body.id,
      });
      expect(updates).toHaveLength(1);
    });
  });

  describe("DELETE /api/brands/:id", () => {
    it("deletes an owned brand and writes a DELETE audit entry", async () => {
      const created = await request(app)
        .post("/api/brands")
        .set("Authorization", authHeader(fixtures.OWNER1))
        .send({ name: "Doomed" });

      const res = await request(app)
        .delete(`/api/brands/${created.body.id}`)
        .set("Authorization", authHeader(fixtures.OWNER1));

      expect(res.status).toBe(204);

      const deletes = audit.find({
        action: AUDIT_ACTION.DELETE,
        entity_id: created.body.id,
      });
      expect(deletes).toHaveLength(1);

      // It is really gone.
      const after = await request(app)
        .get(`/api/brands/${created.body.id}`)
        .set("Authorization", authHeader(fixtures.OWNER1));
      expect(after.status).toBe(404);
    });
  });

  describe("KEY TEST: cross-owner scope enforcement", () => {
    it("OWNER2 cannot PATCH OWNER1's brand -> 403 + SCOPE_DENIED audit entry", async () => {
      // OWNER1 creates a brand.
      const created = await request(app)
        .post("/api/brands")
        .set("Authorization", authHeader(fixtures.OWNER1))
        .send({ name: "Owner1 Only" });

      expect(created.status).toBe(201);
      const brandId = created.body.id;

      // OWNER2 (logged in as a different brand owner) attempts to PATCH it.
      const res = await request(app)
        .patch(`/api/brands/${brandId}`)
        .set("Authorization", authHeader(fixtures.OWNER2))
        .send({ name: "Hijacked" });

      expect(res.status).toBe(403);

      // The scopeCheck middleware must have recorded a SCOPE_DENIED audit row
      // attributed to OWNER2 for this brand id.
      const denied = audit.find({
        actor_id: fixtures.OWNER2.id,
        action: AUDIT_ACTION.SCOPE_DENIED,
        entity_id: brandId,
      });
      expect(denied).toHaveLength(1);
      expect(denied[0].entity).toBe("brandId");

      // And OWNER1's brand was not modified.
      const check = await request(app)
        .get(`/api/brands/${brandId}`)
        .set("Authorization", authHeader(fixtures.OWNER1));
      expect(check.body.name).toBe("Owner1 Only");
    });
  });
});
