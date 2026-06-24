"use strict";

/**
 * Unit tests for brandService.create — exercises the service over the real
 * repository + in-memory store (no HTTP). Verifies the auto-approve gate
 * (config.requireAdminApproval === false) yields status "approved" /
 * is_active true and that a CREATE audit entry is written.
 *
 * reset() runs between tests so the store and audit log start empty.
 */

const { reset, store } = require("../../src/config/database");
const brandService = require("../../src/services/brand.service");
const brandRepo = require("../../src/repositories/brand.repository");
const audit = require("../../src/utils/audit");
const { config } = require("../../src/config");
const { BRAND_STATUS, AUDIT_ACTION, ENTITY } = require("../../src/config/constants");

const OWNER = "11111111-1111-1111-1111-111111111111";

describe("brandService.create (auto-approve phase)", () => {
  beforeEach(() => {
    reset();
  });

  it("operates with auto-approve enabled in this test phase", () => {
    // Guards the assumptions below; setup.js keeps REQUIRE_ADMIN_APPROVAL=false.
    expect(config.requireAdminApproval).toBe(false);
  });

  it("creates a brand that is approved and active", async () => {
    const brand = await brandService.create(OWNER, { name: "Burger Barn" });

    expect(brand).toMatchObject({
      owner_id: OWNER,
      name: "Burger Barn",
      status: BRAND_STATUS.APPROVED,
      is_active: true,
    });
    expect(brand.id).toEqual(expect.any(String));
  });

  it("persists the created brand in the store via the repository", async () => {
    const brand = await brandService.create(OWNER, { name: "Pizza Palace" });

    expect(store.brands.has(brand.id)).toBe(true);

    const fromRepo = await brandRepo.findById(brand.id);
    expect(fromRepo).not.toBeNull();
    expect(fromRepo.status).toBe(BRAND_STATUS.APPROVED);
    expect(fromRepo.is_active).toBe(true);
  });

  it("writes exactly one CREATE audit entry for the new brand", async () => {
    const brand = await brandService.create(OWNER, { name: "Taco Town" });

    const entries = audit.find({
      action: AUDIT_ACTION.CREATE,
      entity_id: brand.id,
    });

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      actor_id: OWNER,
      action: AUDIT_ACTION.CREATE,
      entity: ENTITY.BRAND,
      entity_id: brand.id,
      payload: { name: "Taco Town" },
    });
    expect(entries[0].created_at).toEqual(expect.any(String));
  });

  it("does not leak audit entries across tests after reset", async () => {
    // Store was reset in beforeEach, so the log starts empty this test.
    expect(audit.find()).toHaveLength(0);

    await brandService.create(OWNER, { name: "Solo" });
    expect(audit.find({ action: AUDIT_ACTION.CREATE })).toHaveLength(1);
  });
});
