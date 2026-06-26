"use strict";

/**
 * Integration tests for the staff (restaurant_user_mapping) routes.
 *
 * Flow under test (per the acceptance criteria):
 *   - invite seeded STAFF1 onto OWNER1's brand -> 201, mapping status "active"
 *   - remove that mapping -> 204, mapping status "removed"
 *
 * Brands are not part of the boot seed, so each test seeds a brand owned by
 * OWNER1 directly through the brand repository (the same data-access layer the
 * app uses) to satisfy the scopeCheck("brandId") guard.
 */

const request = require("supertest");
const { app, resetStore, login, fixtures } = require("./helpers");
const brandRepo = require("../../src/repositories/brand.repository");
const audit = require("../../src/utils/audit");
const { MAPPING_STATUS, AUDIT_ACTION, ENTITY } = require("../../src/config/constants");

const OWNER1_BRAND_ID = "2f8a4b6c-7d9e-4f1a-8b2c-3d5e6f7a8b9c";

async function asOwner1() {
  const res = await login(request, fixtures.OWNER1.email, fixtures.PASSWORD);
  return res.body.accessToken;
}

async function seedOwner1Brand() {
  return brandRepo.create({
    id: OWNER1_BRAND_ID,
    owner_id: fixtures.OWNER1.id,
    name: "Owner One Brand",
  });
}

beforeEach(async () => {
  resetStore();
  await seedOwner1Brand();
});

describe("POST /api/restaurant-users (invite)", () => {
  test("invites seeded STAFF1 -> 201 with mapping status active + INVITE audit", async () => {
    const token = await asOwner1();

    const res = await request(app)
      .post("/api/restaurant-users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Asha Rao",
        role: fixtures.STAFF1.role,
        brandId: OWNER1_BRAND_ID,
        phone: fixtures.STAFF1.phone,
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe(MAPPING_STATUS.ACTIVE);
    expect(res.body.user_id).toBeDefined();
    expect(res.body.user_name).toBe("Asha Rao");
    expect(res.body.brand_id).toBe(OWNER1_BRAND_ID);
    expect(res.body.id).toBeDefined();

    const invites = audit.find({ action: AUDIT_ACTION.INVITE, entity: ENTITY.MAPPING });
    expect(invites).toHaveLength(1);
    expect(invites[0].actor_id).toBe(fixtures.OWNER1.id);
    expect(invites[0].entity_id).toBe(res.body.id);
  });

  test("rejects an invite missing required fields -> 400", async () => {
    const token = await asOwner1();

    const res = await request(app)
      .post("/api/restaurant-users")
      .set("Authorization", `Bearer ${token}`)
      .send({ brandId: OWNER1_BRAND_ID });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  test("rejects a phone that is not exactly 10 digits -> 400", async () => {
    const token = await asOwner1();

    const res = await request(app)
      .post("/api/restaurant-users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Asha Rao",
        role: fixtures.STAFF1.role,
        brandId: OWNER1_BRAND_ID,
        phone: "12345",
      });

    expect(res.status).toBe(400);
  });

  test("denies inviting onto a brand the caller does not own -> 403 + SCOPE_DENIED audit", async () => {
    const res = await login(request, fixtures.OWNER2.email, fixtures.PASSWORD);
    const owner2Token = res.body.accessToken;

    const denied = await request(app)
      .post("/api/restaurant-users")
      .set("Authorization", `Bearer ${owner2Token}`)
      .send({
        name: "Asha Rao",
        role: fixtures.STAFF1.role,
        brandId: OWNER1_BRAND_ID,
        phone: fixtures.STAFF1.phone,
      });

    expect(denied.status).toBe(403);
    const scopeDenied = audit.find({ action: AUDIT_ACTION.SCOPE_DENIED });
    expect(scopeDenied.length).toBeGreaterThanOrEqual(1);
  });

  test("requires authentication -> 401", async () => {
    const res = await request(app)
      .post("/api/restaurant-users")
      .send({
        name: "Asha Rao",
        role: fixtures.STAFF1.role,
        brandId: OWNER1_BRAND_ID,
        phone: fixtures.STAFF1.phone,
      });

    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/restaurant-users/:id (remove)", () => {
  test("removes a mapping -> 204 with status removed + REMOVE audit", async () => {
    const token = await asOwner1();

    const created = await request(app)
      .post("/api/restaurant-users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Asha Rao",
        role: fixtures.STAFF1.role,
        brandId: OWNER1_BRAND_ID,
        phone: fixtures.STAFF1.phone,
      });
    expect(created.status).toBe(201);
    const mappingId = created.body.id;

    const removed = await request(app)
      .delete(`/api/restaurant-users/${mappingId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(removed.status).toBe(204);

    // Confirm the underlying mapping is now in REMOVED state via the list route.
    const listed = await request(app)
      .get("/api/restaurant-users")
      .query({ brandId: OWNER1_BRAND_ID })
      .set("Authorization", `Bearer ${token}`);

    expect(listed.status).toBe(200);
    const found = listed.body.find((m) => m.id === mappingId);
    expect(found).toBeDefined();
    expect(found.status).toBe(MAPPING_STATUS.REMOVED);

    const removes = audit.find({ action: AUDIT_ACTION.REMOVE, entity: ENTITY.MAPPING });
    expect(removes).toHaveLength(1);
    expect(removes[0].entity_id).toBe(mappingId);
  });
});

describe("GET /api/restaurant-users (list by brand)", () => {
  test("lists mappings for the caller's brand -> 200", async () => {
    const token = await asOwner1();

    await request(app)
      .post("/api/restaurant-users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Asha Rao",
        role: fixtures.STAFF1.role,
        brandId: OWNER1_BRAND_ID,
        phone: fixtures.STAFF1.phone,
      });

    const listed = await request(app)
      .get("/api/restaurant-users")
      .query({ brandId: OWNER1_BRAND_ID })
      .set("Authorization", `Bearer ${token}`);

    expect(listed.status).toBe(200);
    expect(Array.isArray(listed.body)).toBe(true);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].brand_id).toBe(OWNER1_BRAND_ID);
  });
});
