"use strict";

/**
 * Unit tests for mappingRepo.ownsScope() — the scope resolver behind the
 * scopeCheck middleware. No HTTP: we seed the in-memory store via the
 * repositories directly and assert ownership resolves up the hierarchy to
 * brands.owner_id for every key (brandId / restaurantId / branchId / mappingId).
 *
 * reset() runs between tests so each case starts from an empty store.
 */

const { reset } = require("../../src/config/database");
const brandRepo = require("../../src/repositories/brand.repository");
const restaurantRepo = require("../../src/repositories/restaurant.repository");
const branchRepo = require("../../src/repositories/branch.repository");
const mappingRepo = require("../../src/repositories/mapping.repository");
const { ROLES, MAPPING_STATUS } = require("../../src/config/constants");

const OWNER = "owner-1";
const OTHER = "owner-2";

/**
 * Seed a full brand -> restaurant -> branch chain owned by OWNER, plus three
 * mappings (one scoped at each level). Returns the created ids.
 */
async function seedHierarchy() {
  const brand = await brandRepo.create({ owner_id: OWNER, name: "Brand A" });
  const restaurant = await restaurantRepo.create({
    brand_id: brand.id,
    name: "Resto A",
    gst_no: "22AAAAA0000A1Z5",
    email: "resto@a.test",
    phone: "9999999999",
  });
  const branch = await branchRepo.create({
    restaurant_id: restaurant.id,
    name: "Branch A",
    lat: 12.9,
    lng: 77.6,
  });

  const brandMapping = await mappingRepo.create({
    user_id: "staff-1",
    role: ROLES.RESTAURANT_MANAGER,
    brand_id: brand.id,
    status: MAPPING_STATUS.ACTIVE,
  });
  const restaurantMapping = await mappingRepo.create({
    user_id: "staff-2",
    role: ROLES.RESTAURANT_OPERATOR,
    restaurant_id: restaurant.id,
    status: MAPPING_STATUS.ACTIVE,
  });
  const branchMapping = await mappingRepo.create({
    user_id: "staff-3",
    role: ROLES.RESTAURANT_SUPPORT_STAFF,
    branch_id: branch.id,
    status: MAPPING_STATUS.ACTIVE,
  });

  return {
    brandId: brand.id,
    restaurantId: restaurant.id,
    branchId: branch.id,
    brandMappingId: brandMapping.id,
    restaurantMappingId: restaurantMapping.id,
    branchMappingId: branchMapping.id,
  };
}

describe("mappingRepo.ownsScope", () => {
  beforeEach(() => {
    reset();
  });

  describe("key: brandId", () => {
    it("resolves true for the brand owner", async () => {
      const { brandId } = await seedHierarchy();
      await expect(mappingRepo.ownsScope(OWNER, "brandId", brandId)).resolves.toBe(true);
    });

    it("resolves false for a different owner", async () => {
      const { brandId } = await seedHierarchy();
      await expect(mappingRepo.ownsScope(OTHER, "brandId", brandId)).resolves.toBe(false);
    });

    it("resolves false for an unknown brand id", async () => {
      await seedHierarchy();
      await expect(mappingRepo.ownsScope(OWNER, "brandId", "no-such-brand")).resolves.toBe(false);
    });
  });

  describe("key: restaurantId", () => {
    it("resolves true via restaurant -> brand -> owner", async () => {
      const { restaurantId } = await seedHierarchy();
      await expect(mappingRepo.ownsScope(OWNER, "restaurantId", restaurantId)).resolves.toBe(true);
    });

    it("resolves false for a non-owner", async () => {
      const { restaurantId } = await seedHierarchy();
      await expect(mappingRepo.ownsScope(OTHER, "restaurantId", restaurantId)).resolves.toBe(false);
    });

    it("resolves false for an unknown restaurant id", async () => {
      await seedHierarchy();
      await expect(mappingRepo.ownsScope(OWNER, "restaurantId", "no-such-resto")).resolves.toBe(false);
    });
  });

  describe("key: branchId", () => {
    it("resolves true via branch -> restaurant -> brand -> owner", async () => {
      const { branchId } = await seedHierarchy();
      await expect(mappingRepo.ownsScope(OWNER, "branchId", branchId)).resolves.toBe(true);
    });

    it("resolves false for a non-owner", async () => {
      const { branchId } = await seedHierarchy();
      await expect(mappingRepo.ownsScope(OTHER, "branchId", branchId)).resolves.toBe(false);
    });

    it("resolves false for an unknown branch id", async () => {
      await seedHierarchy();
      await expect(mappingRepo.ownsScope(OWNER, "branchId", "no-such-branch")).resolves.toBe(false);
    });
  });

  describe("key: mappingId", () => {
    it("resolves true for a brand-scoped mapping owned by the caller", async () => {
      const { brandMappingId } = await seedHierarchy();
      await expect(mappingRepo.ownsScope(OWNER, "mappingId", brandMappingId)).resolves.toBe(true);
    });

    it("resolves true for a restaurant-scoped mapping owned by the caller", async () => {
      const { restaurantMappingId } = await seedHierarchy();
      await expect(mappingRepo.ownsScope(OWNER, "mappingId", restaurantMappingId)).resolves.toBe(true);
    });

    it("resolves true for a branch-scoped mapping owned by the caller", async () => {
      const { branchMappingId } = await seedHierarchy();
      await expect(mappingRepo.ownsScope(OWNER, "mappingId", branchMappingId)).resolves.toBe(true);
    });

    it("resolves false for a mapping under a brand the caller does not own", async () => {
      const { brandMappingId } = await seedHierarchy();
      await expect(mappingRepo.ownsScope(OTHER, "mappingId", brandMappingId)).resolves.toBe(false);
    });

    it("resolves false for an unknown mapping id", async () => {
      await seedHierarchy();
      await expect(mappingRepo.ownsScope(OWNER, "mappingId", "no-such-mapping")).resolves.toBe(false);
    });
  });

  describe("edge cases", () => {
    it("resolves false for a falsy id regardless of key", async () => {
      await seedHierarchy();
      await expect(mappingRepo.ownsScope(OWNER, "brandId", undefined)).resolves.toBe(false);
      await expect(mappingRepo.ownsScope(OWNER, "restaurantId", null)).resolves.toBe(false);
      await expect(mappingRepo.ownsScope(OWNER, "branchId", "")).resolves.toBe(false);
      await expect(mappingRepo.ownsScope(OWNER, "mappingId", 0)).resolves.toBe(false);
    });

    it("resolves false for an unrecognized key", async () => {
      const { brandId } = await seedHierarchy();
      await expect(mappingRepo.ownsScope(OWNER, "bogusKey", brandId)).resolves.toBe(false);
    });

    it("isolates state between tests (store was reset)", async () => {
      // No seeding here — a stale brand id from a prior test must not resolve.
      await expect(mappingRepo.ownsScope(OWNER, "brandId", "anything")).resolves.toBe(false);
    });
  });
});
