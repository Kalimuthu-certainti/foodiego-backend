"use strict";

/**
 * Dev seed for the IN-MEMORY store (DB deferred).
 *
 * Inserts 3 fixture users so the app/tests have known login credentials without
 * a database. Idempotent: it clears every user first, then re-inserts, so it is
 * safe to call on every boot (server.js calls it when config.seedOnBoot is true).
 *
 * Equivalent INSERTs for the future real Postgres DB live in seed.sql (not run now).
 *
 * Demo credentials (all share the same password):
 *   owner1@foodiego.test / Password123!  (BRAND_OWNER)
 *   owner2@foodiego.test / Password123!  (BRAND_OWNER)
 *   staff1@foodiego.test / Password123!  (RESTAURANT_MANAGER)
 */

const bcrypt = require("bcryptjs");
const { makeUser } = require("../../models/user.model");
const { makeBrand } = require("../../models/brand.model");
const { makePayout } = require("../../models/payout.model");
const { ROLES, BRAND_STATUS, PAYOUT_STATUS } = require("../../config/constants");

const DEMO_PASSWORD = "Password123!";

const SPICE_GARDEN_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"; // owner1's brand

const FIXTURE_USERS = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    email: "owner1@foodiego.test",
    name: "Owner One",
    role: ROLES.BRAND_OWNER,
    phone: null,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "owner2@foodiego.test",
    name: "Owner Two",
    role: ROLES.BRAND_OWNER,
    phone: null,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    email: "staff1@foodiego.test",
    name: "Staff One",
    role: ROLES.RESTAURANT_MANAGER,
    phone: "9999999999",
  },
];

/**
 * Demo brands, already APPROVED + active — i.e. the state after an admin has
 * provisioned and approved them. The brand owner is given login credentials and
 * manages restaurants/branches/staff/menu under this brand; owners do not create
 * brands themselves. One brand per owner so each lands straight into management.
 */
const FIXTURE_BRANDS = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    owner_id: "11111111-1111-1111-1111-111111111111", // owner1
    name: "Spice Garden",
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    owner_id: "22222222-2222-2222-2222-222222222222", // owner2
    name: "Urban Bites",
  },
];

/**
 * Seed the given in-memory store with fixture users.
 * @param {{users: Map}} store
 * @returns {{users: object[]}} the inserted fixture rows
 */
function seedStore(store) {
  // Idempotent: clear then insert.
  store.users.clear();

  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const inserted = [];

  for (const fixture of FIXTURE_USERS) {
    const user = makeUser({
      id: fixture.id,
      email: fixture.email,
      password_hash: passwordHash,
      name: fixture.name,
      role: fixture.role,
      phone: fixture.phone,
    });
    store.users.set(user.id, user);
    inserted.push(user);
  }

  return { users: inserted };
}

/**
 * Seed the store with the pre-approved demo brands (one per owner).
 *
 * Kept SEPARATE from seedStore so the integration tests (which call seedStore
 * via resetStore and assert on a clean brand list) are unaffected — only the
 * running server seeds brands, at boot.
 * @param {{brands: Map}} store
 * @returns {{brands: object[]}} the inserted fixture rows
 */
function seedBrands(store) {
  store.brands.clear();
  const inserted = [];

  for (const fixture of FIXTURE_BRANDS) {
    const brand = makeBrand({
      id: fixture.id,
      owner_id: fixture.owner_id,
      name: fixture.name,
      status: BRAND_STATUS.APPROVED,
      is_active: true,
    });
    store.brands.set(brand.id, brand);
    inserted.push(brand);
  }

  return { brands: inserted };
}

/** Daily report rows for Spice Garden (orders + revenue), most recent last. */
const FIXTURE_REPORTS = [
  { day: "2026-06-10", orders: 64, revenue: 28800 },
  { day: "2026-06-11", orders: 71, revenue: 32400 },
  { day: "2026-06-12", orders: 88, revenue: 41100 },
  { day: "2026-06-13", orders: 102, revenue: 49600 },
  { day: "2026-06-14", orders: 96, revenue: 45200 },
  { day: "2026-06-15", orders: 58, revenue: 26100 },
  { day: "2026-06-16", orders: 63, revenue: 29400 },
  { day: "2026-06-17", orders: 79, revenue: 36850 },
  { day: "2026-06-18", orders: 84, revenue: 39900 },
  { day: "2026-06-19", orders: 110, revenue: 53200 },
  { day: "2026-06-20", orders: 121, revenue: 58700 },
  { day: "2026-06-21", orders: 99, revenue: 47300 },
  { day: "2026-06-22", orders: 68, revenue: 31200 },
  { day: "2026-06-23", orders: 47, revenue: 21450 },
];

/** Monthly payouts for Spice Garden — two settled, the current period pending. */
const FIXTURE_PAYOUTS = [
  { period: "2026-04", gross: 185000, fee: 18500, net: 166500, status: PAYOUT_STATUS.PAID },
  { period: "2026-05", gross: 210000, fee: 21000, net: 189000, status: PAYOUT_STATUS.PAID },
  { period: "2026-06", gross: 142000, fee: 14200, net: 127800, status: PAYOUT_STATUS.PENDING },
];

/**
 * Seed brand-level reports + payouts for the demo brand. These have no create
 * UI (they derive from orders/settlement in later phases), so the dashboard only
 * has data to show if we seed it here. Kept SEPARATE from seedStore so the
 * integration tests (clean store via resetStore) are unaffected — boot-only.
 * @param {{reports: object[], payouts: Map}} store
 */
function seedReportsAndPayouts(store) {
  store.reports.length = 0;
  for (const row of FIXTURE_REPORTS) {
    store.reports.push({ brand_id: SPICE_GARDEN_ID, ...row });
  }

  for (const p of FIXTURE_PAYOUTS) {
    const payout = makePayout({ brand_id: SPICE_GARDEN_ID, ...p });
    store.payouts.set(payout.id, payout);
  }
}

module.exports = {
  seedStore,
  seedBrands,
  seedReportsAndPayouts,
  DEMO_PASSWORD,
  FIXTURE_USERS,
  FIXTURE_BRANDS,
};
