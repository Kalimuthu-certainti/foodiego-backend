"use strict";

/**
 * Integration tests for the branch routes (Jest + Supertest).
 *
 * The seed only creates users, so each test provisions an owned
 * brand -> restaurant directly via the repositories (their contract is stable
 * and independent of sibling route modules). OWNER1 owns the restaurant;
 * scopeCheck("restaurantId") resolves restaurant -> brand -> owner.
 */

const request = require("supertest");
const { app, resetStore, login, fixtures } = require("./helpers");

const brandRepo = require("../../src/repositories/brand.repository");
const restaurantRepo = require("../../src/repositories/restaurant.repository");
const audit = require("../../src/utils/audit");
const { AUDIT_ACTION, ENTITY } = require("../../src/config/constants");

/**
 * Provision an approved brand + restaurant owned by the given owner.
 * @returns {Promise<{brand: object, restaurant: object}>}
 */
async function seedOwnedRestaurant(ownerId) {
  const brand = await brandRepo.create({ owner_id: ownerId, name: "Test Brand" });
  const restaurant = await restaurantRepo.create({
    brand_id: brand.id,
    name: "Test Restaurant",
    gst_no: "22AAAAA0000A1Z5",
    email: "rest@foodiego.test",
    phone: "9876543210",
  });
  return { brand, restaurant };
}

async function ownerToken() {
  const res = await login(request, fixtures.OWNER1.email, fixtures.PASSWORD);
  return res.body.accessToken;
}

const WORKING_HOURS = {
  mon: [{ open: "10:00", close: "22:00" }],
  sat: [{ open: "10:00", close: "23:30" }],
  sun: [],
};

describe("Branch routes", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("POST /api/branches", () => {
    test("400 when lat/lng are missing", async () => {
      const token = await ownerToken();
      const { restaurant } = await seedOwnedRestaurant(fixtures.OWNER1.id);

      const res = await request(app)
        .post("/api/branches")
        .set("Authorization", `Bearer ${token}`)
        .send({
          restaurantId: restaurant.id,
          name: "Downtown",
          workingHours: WORKING_HOURS,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
      expect(Array.isArray(res.body.details)).toBe(true);
      const joined = res.body.details.join(" ");
      expect(joined).toMatch(/lat/);
      expect(joined).toMatch(/lng/);
    });

    test("400 when lat is out of range", async () => {
      const token = await ownerToken();
      const { restaurant } = await seedOwnedRestaurant(fixtures.OWNER1.id);

      const res = await request(app)
        .post("/api/branches")
        .set("Authorization", `Bearer ${token}`)
        .send({
          restaurantId: restaurant.id,
          name: "Bad Geo",
          lat: 200,
          lng: 10,
          workingHours: WORKING_HOURS,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    test("201 with working_hours persisted on valid payload", async () => {
      const token = await ownerToken();
      const { restaurant } = await seedOwnedRestaurant(fixtures.OWNER1.id);

      const res = await request(app)
        .post("/api/branches")
        .set("Authorization", `Bearer ${token}`)
        .send({
          restaurantId: restaurant.id,
          name: "Downtown",
          lat: 12.9716,
          lng: 77.5946,
          workingHours: WORKING_HOURS,
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.restaurant_id).toBe(restaurant.id);
      expect(res.body.name).toBe("Downtown");
      expect(res.body.lat).toBe(12.9716);
      expect(res.body.lng).toBe(77.5946);
      expect(res.body.working_hours).toEqual(WORKING_HOURS);
      expect(res.body.is_open).toBe(false);

      // audit CREATE recorded for the branch
      const entries = audit.find({
        action: AUDIT_ACTION.CREATE,
        entity: ENTITY.BRANCH,
        entity_id: res.body.id,
      });
      expect(entries).toHaveLength(1);
      expect(entries[0].actor_id).toBe(fixtures.OWNER1.id);
    });

    test("403 when the restaurant belongs to another owner", async () => {
      const token = await ownerToken();
      // restaurant owned by OWNER2, not the caller (OWNER1)
      const { restaurant } = await seedOwnedRestaurant(fixtures.OWNER2.id);

      const res = await request(app)
        .post("/api/branches")
        .set("Authorization", `Bearer ${token}`)
        .send({
          restaurantId: restaurant.id,
          name: "Sneaky",
          lat: 12.9,
          lng: 77.5,
          workingHours: WORKING_HOURS,
        });

      expect(res.status).toBe(403);
    });

    test("401 without a token", async () => {
      const { restaurant } = await seedOwnedRestaurant(fixtures.OWNER1.id);

      const res = await request(app).post("/api/branches").send({
        restaurantId: restaurant.id,
        name: "NoAuth",
        lat: 12.9,
        lng: 77.5,
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/branches", () => {
    test("lists branches by restaurantId", async () => {
      const token = await ownerToken();
      const { restaurant } = await seedOwnedRestaurant(fixtures.OWNER1.id);

      await request(app)
        .post("/api/branches")
        .set("Authorization", `Bearer ${token}`)
        .send({
          restaurantId: restaurant.id,
          name: "Branch A",
          lat: 12.9,
          lng: 77.5,
          workingHours: WORKING_HOURS,
        });
      await request(app)
        .post("/api/branches")
        .set("Authorization", `Bearer ${token}`)
        .send({
          restaurantId: restaurant.id,
          name: "Branch B",
          lat: 13.0,
          lng: 77.6,
        });

      const res = await request(app)
        .get("/api/branches")
        .query({ restaurantId: restaurant.id })
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      const names = res.body.map((b) => b.name).sort();
      expect(names).toEqual(["Branch A", "Branch B"]);
      res.body.forEach((b) => expect(b.restaurant_id).toBe(restaurant.id));
    });

    test("403 listing branches for another owner's restaurant", async () => {
      const token = await ownerToken();
      const { restaurant } = await seedOwnedRestaurant(fixtures.OWNER2.id);

      const res = await request(app)
        .get("/api/branches")
        .query({ restaurantId: restaurant.id })
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
