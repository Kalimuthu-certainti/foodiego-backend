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
const { makeRestaurant } = require("../../models/restaurant.model");
const { makeBranch } = require("../../models/branch.model");
const { makeOrder } = require("../../models/order.model");
const { makeReview } = require("../../models/review.model");
const { ROLES, BRAND_STATUS, PAYOUT_STATUS } = require("../../config/constants");

const DEMO_PASSWORD = "Password123!";

const SPICE_GARDEN_ID = "2f8a4b6c-7d9e-4f1a-8b2c-3d5e6f7a8b9c"; // owner1's brand

const FIXTURE_USERS = [
  {
    id: "7a3f9b2e-1c4d-4e8f-a5b6-2d7c8e9f0a1b",
    email: "owner1@foodiego.test",
    name: "Owner One",
    role: ROLES.BRAND_OWNER,
    phone: null,
  },
  {
    id: "8b4e0c3f-2d5e-5f9a-b6c7-3e8d9f0a1b2c",
    email: "owner2@foodiego.test",
    name: "Owner Two",
    role: ROLES.BRAND_OWNER,
    phone: null,
  },
  {
    id: "9c5f1d4a-3e6f-6a0b-c7d8-4f9e0a1b2c3d",
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
    id: "2f8a4b6c-7d9e-4f1a-8b2c-3d5e6f7a8b9c",
    owner_id: "7a3f9b2e-1c4d-4e8f-a5b6-2d7c8e9f0a1b", // owner1
    name: "Spice Garden",
  },
  {
    id: "3a9b5c7d-8e0f-4b2c-9d3e-4f6a7b8c9d0e",
    owner_id: "8b4e0c3f-2d5e-5f9a-b6c7-3e8d9f0a1b2c", // owner2
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

// ─── Fixture IDs for Spice Garden restaurants / branches / orders ─────────────

const SPICE_GARDEN_RESTAURANT_ID = "4b0c6d8e-9f1a-4c3d-0e4f-5a6b7c8d9e0f";
const BRANCH_MG_ROAD_ID = "5c1d7e9f-0a2b-4d4e-1f5a-6b7c8d9e0f1a";
const BRANCH_KORAMANGALA_ID = "6d2e8f0a-1b3c-4e5f-2a6b-7c8d9e0f1a2b";

const FIXTURE_RESTAURANTS = [
  {
    id: SPICE_GARDEN_RESTAURANT_ID,
    brand_id: SPICE_GARDEN_ID,
    name: "Spice Garden",
    gst_no: "29AABCU9603R1ZX",
    email: "info@spicegarden.in",
    phone: "9876543210",
  },
];

const MG_HOURS = {
  mon: [{ open: "10:00", close: "22:00" }],
  tue: [{ open: "10:00", close: "22:00" }],
  wed: [{ open: "10:00", close: "22:00" }],
  thu: [{ open: "10:00", close: "22:00" }],
  fri: [{ open: "10:00", close: "23:00" }],
  sat: [{ open: "09:00", close: "23:00" }],
  sun: [{ open: "09:00", close: "22:00" }],
};
const KOR_HOURS = {
  mon: [{ open: "11:00", close: "22:00" }],
  tue: [{ open: "11:00", close: "22:00" }],
  wed: [{ open: "11:00", close: "22:00" }],
  thu: [{ open: "11:00", close: "22:00" }],
  fri: [{ open: "11:00", close: "23:00" }],
  sat: [{ open: "10:00", close: "23:00" }],
  sun: [{ open: "10:00", close: "22:00" }],
};

const FIXTURE_BRANCHES = [
  {
    id: BRANCH_MG_ROAD_ID,
    restaurant_id: SPICE_GARDEN_RESTAURANT_ID,
    name: "Spice Garden - MG Road",
    lat: 12.9716,
    lng: 77.5946,
    working_hours: MG_HOURS,
    is_open: true,
  },
  {
    id: BRANCH_KORAMANGALA_ID,
    restaurant_id: SPICE_GARDEN_RESTAURANT_ID,
    name: "Spice Garden - Koramangala",
    lat: 12.9352,
    lng: 77.6245,
    working_hours: KOR_HOURS,
    is_open: true,
  },
];

const FIXTURE_ORDERS = [
  // ── PLACED (can cancel) ───────────────────────────────────────────────────
  {
    id: "c9d0e1f2-a3b4-5678-cdef-789123456781",
    order_number: "ORD-20260626-0001",
    brand_id: SPICE_GARDEN_ID, branch_id: BRANCH_MG_ROAD_ID,
    customer_name: "Arjun Sharma", customer_phone: "9845012345",
    customer_address: "12, 5th Cross, Indiranagar, Bengaluru - 560038",
    items: [
      { name: "Butter Chicken", qty: 2, unit_price: 280, subtotal: 560 },
      { name: "Garlic Naan", qty: 4, unit_price: 60, subtotal: 240 },
      { name: "Raita", qty: 1, unit_price: 60, subtotal: 60 },
    ],
    total_amount: 920, platform_fee: 46, delivery_fee: 50, net_amount: 874,
    payment_method: "UPI", payment_status: "paid", status: "placed",
    placed_at: "2026-06-26T10:15:00.000Z",
  },
  {
    id: "d0e1f2a3-b4c5-6789-defa-891234567892",
    order_number: "ORD-20260626-0002",
    brand_id: SPICE_GARDEN_ID, branch_id: BRANCH_KORAMANGALA_ID,
    customer_name: "Priya Nair", customer_phone: "9900123456",
    customer_address: "45, 3rd Block, Koramangala, Bengaluru - 560034",
    items: [
      { name: "Paneer Tikka Masala", qty: 1, unit_price: 260, subtotal: 260 },
      { name: "Dal Makhani", qty: 1, unit_price: 220, subtotal: 220 },
      { name: "Butter Naan", qty: 3, unit_price: 55, subtotal: 165 },
    ],
    total_amount: 695, platform_fee: 35, delivery_fee: 40, net_amount: 660,
    payment_method: "Cash on Delivery", payment_status: "pending", status: "placed",
    placed_at: "2026-06-26T09:45:00.000Z",
  },
  {
    id: "e1f2a3b4-c5d6-7890-efab-912345678903",
    order_number: "ORD-20260626-0003",
    brand_id: SPICE_GARDEN_ID, branch_id: BRANCH_MG_ROAD_ID,
    customer_name: "Rahul Verma", customer_phone: "9712345678",
    customer_address: "7, MG Road, Richmond Circle, Bengaluru - 560001",
    items: [
      { name: "Chicken Biryani", qty: 2, unit_price: 320, subtotal: 640 },
      { name: "Mirchi Ka Salan", qty: 1, unit_price: 80, subtotal: 80 },
      { name: "Cold Drink", qty: 2, unit_price: 60, subtotal: 120 },
    ],
    total_amount: 890, platform_fee: 45, delivery_fee: 60, net_amount: 845,
    payment_method: "Credit Card", payment_status: "paid", status: "placed",
    placed_at: "2026-06-26T08:30:00.000Z",
  },
  // ── CONFIRMED (can cancel) ────────────────────────────────────────────────
  {
    id: "f2a3b4c5-d6e7-8901-fabc-023456789014",
    order_number: "ORD-20260626-0004",
    brand_id: SPICE_GARDEN_ID, branch_id: BRANCH_MG_ROAD_ID,
    customer_name: "Sunita Reddy", customer_phone: "9823456789",
    customer_address: "23, Residency Road, Shivajinagar, Bengaluru - 560025",
    items: [
      { name: "Veg Biryani", qty: 2, unit_price: 260, subtotal: 520 },
      { name: "Onion Raita", qty: 1, unit_price: 60, subtotal: 60 },
      { name: "Gulab Jamun", qty: 2, unit_price: 80, subtotal: 160 },
    ],
    total_amount: 790, platform_fee: 40, delivery_fee: 50, net_amount: 750,
    payment_method: "UPI", payment_status: "paid", status: "confirmed",
    placed_at: "2026-06-26T07:00:00.000Z", confirmed_at: "2026-06-26T07:05:00.000Z",
  },
  {
    id: "a3b4c5d6-e7f8-9012-abcd-134567890125",
    order_number: "ORD-20260625-0005",
    brand_id: SPICE_GARDEN_ID, branch_id: BRANCH_KORAMANGALA_ID,
    customer_name: "Kiran Patil", customer_phone: "9934567890",
    customer_address: "88, 1st Main, JP Nagar, Bengaluru - 560078",
    items: [
      { name: "Mutton Rogan Josh", qty: 1, unit_price: 380, subtotal: 380 },
      { name: "Tandoori Roti", qty: 4, unit_price: 40, subtotal: 160 },
      { name: "Mango Lassi", qty: 2, unit_price: 80, subtotal: 160 },
    ],
    total_amount: 750, platform_fee: 38, delivery_fee: 60, net_amount: 712,
    payment_method: "Debit Card", payment_status: "paid", status: "confirmed",
    placed_at: "2026-06-25T19:30:00.000Z", confirmed_at: "2026-06-25T19:34:00.000Z",
  },
  // ── PREPARING (cannot cancel) ─────────────────────────────────────────────
  {
    id: "b4c5d6e7-f8a9-0123-bcde-245678901236",
    order_number: "ORD-20260626-0006",
    brand_id: SPICE_GARDEN_ID, branch_id: BRANCH_MG_ROAD_ID,
    customer_name: "Deepa Krishnan", customer_phone: "9845678901",
    customer_address: "15, 8th Cross, HSR Layout, Bengaluru - 560102",
    items: [
      { name: "Chole Bhature", qty: 2, unit_price: 180, subtotal: 360 },
      { name: "Mango Lassi", qty: 2, unit_price: 100, subtotal: 200 },
    ],
    total_amount: 610, platform_fee: 31, delivery_fee: 50, net_amount: 579,
    payment_method: "UPI", payment_status: "paid", status: "preparing",
    placed_at: "2026-06-26T06:15:00.000Z", confirmed_at: "2026-06-26T06:18:00.000Z",
    preparing_at: "2026-06-26T06:25:00.000Z",
  },
  {
    id: "c5d6e7f8-a9b0-1234-cdef-356789012347",
    order_number: "ORD-20260625-0007",
    brand_id: SPICE_GARDEN_ID, branch_id: BRANCH_KORAMANGALA_ID,
    customer_name: "Amit Singh", customer_phone: "9967890123",
    customer_address: "32, 12th Main, Bannerghatta Road, Bengaluru - 560076",
    items: [
      { name: "Chicken Tikka", qty: 1, unit_price: 340, subtotal: 340 },
      { name: "Tandoori Naan", qty: 3, unit_price: 55, subtotal: 165 },
      { name: "Jeera Rice", qty: 1, unit_price: 120, subtotal: 120 },
    ],
    total_amount: 675, platform_fee: 34, delivery_fee: 50, net_amount: 641,
    payment_method: "UPI", payment_status: "paid", status: "preparing",
    placed_at: "2026-06-25T13:20:00.000Z", confirmed_at: "2026-06-25T13:24:00.000Z",
    preparing_at: "2026-06-25T13:30:00.000Z",
  },
  // ── OUT FOR DELIVERY ──────────────────────────────────────────────────────
  {
    id: "d6e7f8a9-b0c1-2345-defa-467890123458",
    order_number: "ORD-20260626-0008",
    brand_id: SPICE_GARDEN_ID, branch_id: BRANCH_MG_ROAD_ID,
    customer_name: "Sneha Joshi", customer_phone: "9878901234",
    customer_address: "5, 2nd Stage, Rajajinagar, Bengaluru - 560010",
    items: [
      { name: "Fish Curry", qty: 1, unit_price: 320, subtotal: 320 },
      { name: "Steamed Rice", qty: 2, unit_price: 80, subtotal: 160 },
      { name: "Papad", qty: 2, unit_price: 30, subtotal: 60 },
    ],
    total_amount: 590, platform_fee: 30, delivery_fee: 60, net_amount: 560,
    payment_method: "UPI", payment_status: "paid", status: "out_for_delivery",
    placed_at: "2026-06-26T05:00:00.000Z", confirmed_at: "2026-06-26T05:05:00.000Z",
    preparing_at: "2026-06-26T05:15:00.000Z", out_for_delivery_at: "2026-06-26T05:45:00.000Z",
  },
  {
    id: "e7f8a9b0-c1d2-3456-efab-578901234569",
    order_number: "ORD-20260625-0009",
    brand_id: SPICE_GARDEN_ID, branch_id: BRANCH_KORAMANGALA_ID,
    customer_name: "Vijay Kumar", customer_phone: "9812345678",
    customer_address: "20, 4th Block, Jayanagar, Bengaluru - 560041",
    items: [
      { name: "Special Thali", qty: 2, unit_price: 350, subtotal: 700 },
      { name: "Chaas", qty: 2, unit_price: 60, subtotal: 120 },
    ],
    total_amount: 870, platform_fee: 44, delivery_fee: 50, net_amount: 826,
    payment_method: "Credit Card", payment_status: "paid", status: "out_for_delivery",
    placed_at: "2026-06-25T12:00:00.000Z", confirmed_at: "2026-06-25T12:04:00.000Z",
    preparing_at: "2026-06-25T12:15:00.000Z", out_for_delivery_at: "2026-06-25T12:50:00.000Z",
  },
  // ── DELIVERED ─────────────────────────────────────────────────────────────
  {
    id: "f8a9b0c1-d2e3-4567-fabc-689012345670",
    order_number: "ORD-20260625-0010",
    brand_id: SPICE_GARDEN_ID, branch_id: BRANCH_MG_ROAD_ID,
    customer_name: "Meera Pillai", customer_phone: "9923456789",
    customer_address: "11, Church Street, Brigade Road, Bengaluru - 560001",
    items: [
      { name: "Lamb Biryani", qty: 2, unit_price: 380, subtotal: 760 },
      { name: "Mirchi Salan", qty: 1, unit_price: 80, subtotal: 80 },
      { name: "Kheer", qty: 2, unit_price: 90, subtotal: 180 },
    ],
    total_amount: 1070, platform_fee: 54, delivery_fee: 60, net_amount: 1016,
    payment_method: "UPI", payment_status: "paid", status: "delivered",
    placed_at: "2026-06-25T11:00:00.000Z", confirmed_at: "2026-06-25T11:04:00.000Z",
    preparing_at: "2026-06-25T11:12:00.000Z", out_for_delivery_at: "2026-06-25T11:45:00.000Z",
    delivered_at: "2026-06-25T12:15:00.000Z",
  },
  {
    id: "a9b0c1d2-e3f4-5678-abcd-790123456781",
    order_number: "ORD-20260625-0011",
    brand_id: SPICE_GARDEN_ID, branch_id: BRANCH_KORAMANGALA_ID,
    customer_name: "Arun Nath", customer_phone: "9834567890",
    customer_address: "16, 7th Cross, Malleshwaram, Bengaluru - 560003",
    items: [
      { name: "Palak Paneer", qty: 1, unit_price: 240, subtotal: 240 },
      { name: "Butter Naan", qty: 3, unit_price: 55, subtotal: 165 },
      { name: "Mango Kulfi", qty: 2, unit_price: 90, subtotal: 180 },
    ],
    total_amount: 635, platform_fee: 32, delivery_fee: 50, net_amount: 603,
    payment_method: "Debit Card", payment_status: "paid", status: "delivered",
    placed_at: "2026-06-25T09:30:00.000Z", confirmed_at: "2026-06-25T09:35:00.000Z",
    preparing_at: "2026-06-25T09:45:00.000Z", out_for_delivery_at: "2026-06-25T10:20:00.000Z",
    delivered_at: "2026-06-25T10:55:00.000Z",
  },
  {
    id: "b0c1d2e3-f4a5-6789-bcde-801234567892",
    order_number: "ORD-20260624-0012",
    brand_id: SPICE_GARDEN_ID, branch_id: BRANCH_MG_ROAD_ID,
    customer_name: "Divya Iyer", customer_phone: "9956789012",
    customer_address: "3, Lake View Road, Ulsoor, Bengaluru - 560008",
    items: [
      { name: "Chicken 65", qty: 1, unit_price: 300, subtotal: 300 },
      { name: "Chapati", qty: 4, unit_price: 30, subtotal: 120 },
      { name: "Dal Tadka", qty: 1, unit_price: 160, subtotal: 160 },
    ],
    total_amount: 630, platform_fee: 32, delivery_fee: 50, net_amount: 598,
    payment_method: "UPI", payment_status: "paid", status: "delivered",
    placed_at: "2026-06-24T18:00:00.000Z", confirmed_at: "2026-06-24T18:05:00.000Z",
    preparing_at: "2026-06-24T18:15:00.000Z", out_for_delivery_at: "2026-06-24T18:50:00.000Z",
    delivered_at: "2026-06-24T19:25:00.000Z",
  },
  {
    id: "c1d2e3f4-a5b6-7890-cdef-912345678903",
    order_number: "ORD-20260624-0013",
    brand_id: SPICE_GARDEN_ID, branch_id: BRANCH_KORAMANGALA_ID,
    customer_name: "Rohit Gupta", customer_phone: "9890123456",
    customer_address: "27, 1st Cross, BTM Layout, Bengaluru - 560076",
    items: [
      { name: "Chicken Burger", qty: 2, unit_price: 180, subtotal: 360 },
      { name: "French Fries", qty: 2, unit_price: 120, subtotal: 240 },
      { name: "Cold Coffee", qty: 2, unit_price: 120, subtotal: 240 },
    ],
    total_amount: 890, platform_fee: 45, delivery_fee: 40, net_amount: 845,
    payment_method: "UPI", payment_status: "paid", status: "delivered",
    placed_at: "2026-06-24T14:00:00.000Z", confirmed_at: "2026-06-24T14:05:00.000Z",
    preparing_at: "2026-06-24T14:15:00.000Z", out_for_delivery_at: "2026-06-24T14:50:00.000Z",
    delivered_at: "2026-06-24T15:25:00.000Z",
  },
  // ── CANCELLED ─────────────────────────────────────────────────────────────
  {
    id: "d2e3f4a5-b6c7-8901-defa-023456789014",
    order_number: "ORD-20260624-0014",
    brand_id: SPICE_GARDEN_ID, branch_id: BRANCH_MG_ROAD_ID,
    customer_name: "Lakshmi Nair", customer_phone: "9867890123",
    customer_address: "8, Frazer Town, Bengaluru - 560005",
    items: [
      { name: "Chicken Biryani", qty: 3, unit_price: 320, subtotal: 960 },
      { name: "Raita", qty: 2, unit_price: 60, subtotal: 120 },
    ],
    total_amount: 1130, platform_fee: 57, delivery_fee: 60, net_amount: 1073,
    payment_method: "UPI", payment_status: "paid", status: "cancelled",
    cancel_reason: "Item out of stock", cancelled_by: "brand_owner",
    placed_at: "2026-06-24T11:00:00.000Z", confirmed_at: "2026-06-24T11:03:00.000Z",
    cancelled_at: "2026-06-24T11:10:00.000Z",
  },
  {
    id: "e3f4a5b6-c7d8-9012-efab-134567890125",
    order_number: "ORD-20260623-0015",
    brand_id: SPICE_GARDEN_ID, branch_id: BRANCH_KORAMANGALA_ID,
    customer_name: "Sanjay Menon", customer_phone: "9901234567",
    customer_address: "42, 6th Main, Sadashivanagar, Bengaluru - 560080",
    items: [
      { name: "Prawn Masala", qty: 1, unit_price: 420, subtotal: 420 },
      { name: "Chapati", qty: 3, unit_price: 30, subtotal: 90 },
    ],
    total_amount: 560, platform_fee: 28, delivery_fee: 50, net_amount: 532,
    payment_method: "Cash on Delivery", payment_status: "pending", status: "cancelled",
    cancel_reason: "Customer requested cancellation", cancelled_by: "brand_owner",
    placed_at: "2026-06-23T16:00:00.000Z", confirmed_at: "2026-06-23T16:04:00.000Z",
    cancelled_at: "2026-06-23T16:15:00.000Z",
  },
];

/**
 * Seed the demo restaurant, branches, and orders for Spice Garden.
 * Kept SEPARATE from seedStore/seedBrands so integration tests are unaffected.
 * @param {{ restaurants: Map, branches: Map, orders: Map }} store
 */
function seedRestaurantsAndBranchesAndOrders(store) {
  for (const r of FIXTURE_RESTAURANTS) {
    store.restaurants.set(r.id, makeRestaurant(r));
  }
  for (const b of FIXTURE_BRANCHES) {
    store.branches.set(b.id, makeBranch(b));
  }
  for (const o of FIXTURE_ORDERS) {
    store.orders.set(o.id, makeOrder(o));
  }
}

/** Demo reviews for Spice Garden — varied ratings, statuses, some with replies. */
const FIXTURE_REVIEWS = [
  {
    id: "rev1a2b3c-d4e5-6789-abc1-234567890001",
    branch_id: BRANCH_MG_ROAD_ID,
    brand_id: SPICE_GARDEN_ID,
    customer_name: "Meera Pillai",
    customer_phone: "9923456789",
    rating: 5,
    review_text: "Absolutely amazing food! The Lamb Biryani was perfectly cooked and full of flavour. Delivery was on time and everything was hot. Will definitely order again!",
    status: "approved",
    owner_reply: "Thank you so much, Meera! We are thrilled you loved the Lamb Biryani. Looking forward to serving you again soon!",
    replied_at: "2026-06-25T14:00:00.000Z",
    created_at: "2026-06-25T13:00:00.000Z",
  },
  {
    id: "rev2b3c4d-e5f6-7890-bcd2-345678901002",
    branch_id: BRANCH_KORAMANGALA_ID,
    brand_id: SPICE_GARDEN_ID,
    customer_name: "Arun Nath",
    customer_phone: "9834567890",
    rating: 4,
    review_text: "Great food overall! The Palak Paneer was really good. Delivery was a bit late but the food quality made up for it. The Mango Kulfi was a perfect dessert.",
    status: "approved",
    owner_reply: null,
    replied_at: null,
    created_at: "2026-06-25T11:30:00.000Z",
  },
  {
    id: "rev3c4d5e-f6a7-8901-cde3-456789012003",
    branch_id: BRANCH_MG_ROAD_ID,
    brand_id: SPICE_GARDEN_ID,
    customer_name: "Divya Iyer",
    customer_phone: "9956789012",
    rating: 5,
    review_text: "The Chicken 65 was phenomenal! Crispy, spicy, and perfectly seasoned. The Dal Tadka paired beautifully with the chapatis. Outstanding experience from start to finish.",
    status: "approved",
    owner_reply: null,
    replied_at: null,
    created_at: "2026-06-24T19:00:00.000Z",
  },
  {
    id: "rev4d5e6f-a7b8-9012-def4-567890123004",
    branch_id: BRANCH_KORAMANGALA_ID,
    brand_id: SPICE_GARDEN_ID,
    customer_name: "Rohit Gupta",
    customer_phone: "9890123456",
    rating: 3,
    review_text: "The burgers were decent but the fries were a bit soggy. Cold coffee was good though. Expected better quality for the price. Packaging could be improved.",
    status: "flagged",
    owner_reply: null,
    replied_at: null,
    created_at: "2026-06-24T15:30:00.000Z",
  },
  {
    id: "rev5e6f7a-b8c9-0123-ef05-678901234005",
    branch_id: BRANCH_MG_ROAD_ID,
    brand_id: SPICE_GARDEN_ID,
    customer_name: "Preethi Chandran",
    customer_phone: "9811234567",
    rating: 2,
    review_text: "Very disappointed. The food arrived cold and the Biryani was not properly cooked. The rice was mushy. I've had better from this restaurant before. Not ordering again.",
    status: "hidden",
    owner_reply: null,
    replied_at: null,
    created_at: "2026-06-23T20:00:00.000Z",
  },
  {
    id: "rev6f7a8b-c9d0-1234-f067-789012345006",
    branch_id: BRANCH_KORAMANGALA_ID,
    brand_id: SPICE_GARDEN_ID,
    customer_name: "Sanjay Menon",
    customer_phone: "9901234567",
    rating: 1,
    review_text: "Terrible experience. The food was completely different from what was pictured. Raised a complaint with the platform. Highly disappointed.",
    status: "flagged",
    owner_reply: null,
    replied_at: null,
    created_at: "2026-06-23T17:00:00.000Z",
  },
  {
    id: "rev7a1b2c-d3e4-5678-abc7-890123456007",
    branch_id: BRANCH_MG_ROAD_ID,
    brand_id: SPICE_GARDEN_ID,
    customer_name: "Kavya Reddy",
    customer_phone: "9876543211",
    rating: 5,
    review_text: "Ordered the Butter Chicken and Garlic Naan combo — absolutely divine! The sauce was rich and creamy, naan was soft and fresh. Super fast delivery too. 5 stars!",
    status: "approved",
    owner_reply: "Thank you Kavya! We're so glad you enjoyed the Butter Chicken combo. That's our chef's pride! Hope to see you again soon.",
    replied_at: "2026-06-22T16:00:00.000Z",
    created_at: "2026-06-22T15:00:00.000Z",
  },
  {
    id: "rev8b2c3d-e4f5-6789-bcd8-901234567008",
    branch_id: BRANCH_KORAMANGALA_ID,
    brand_id: SPICE_GARDEN_ID,
    customer_name: "Vikram Nair",
    customer_phone: "9845123456",
    rating: 4,
    review_text: "Really enjoyed the Special Thali. Great value for money with so many items. The quality was consistent throughout. Would love if you added more dessert options.",
    status: "approved",
    owner_reply: null,
    replied_at: null,
    created_at: "2026-06-22T10:00:00.000Z",
  },
  {
    id: "rev9c3d4e-f5a6-7890-cde9-012345678009",
    branch_id: BRANCH_MG_ROAD_ID,
    brand_id: SPICE_GARDEN_ID,
    customer_name: "Nisha Patel",
    customer_phone: "9867891234",
    rating: 4,
    review_text: "Good food but the delivery took longer than expected. The Fish Curry was fresh and tasty. Packaging was neat and secure. Overall a satisfying meal.",
    status: "approved",
    owner_reply: "Hi Nisha, we apologize for the delay. We're working on faster delivery. Thank you for the kind words about the Fish Curry!",
    replied_at: "2026-06-21T14:00:00.000Z",
    created_at: "2026-06-21T12:00:00.000Z",
  },
  {
    id: "rev10d4e5-f6a7-8901-def0-123456789010",
    branch_id: BRANCH_KORAMANGALA_ID,
    brand_id: SPICE_GARDEN_ID,
    customer_name: "Suresh Kumar",
    customer_phone: "9912345678",
    rating: 5,
    review_text: "Best Indian food delivery in Bangalore! The Mutton Rogan Josh was absolutely perfect. Tender meat, authentic spices. The Mango Lassi complemented it beautifully. 10/10!",
    status: "approved",
    owner_reply: null,
    replied_at: null,
    created_at: "2026-06-20T18:00:00.000Z",
  },
  {
    id: "rev11e5f6-a7b8-9012-ef01-234567890011",
    branch_id: BRANCH_MG_ROAD_ID,
    brand_id: SPICE_GARDEN_ID,
    customer_name: "Deepa Krishnan",
    customer_phone: "9845678901",
    rating: 3,
    review_text: "The Chole Bhature was okay but not as good as I expected. The bhature were a bit oily. Mango Lassi was refreshing. Decent meal overall but room for improvement.",
    status: "approved",
    owner_reply: "Thank you for the honest feedback, Deepa! We've noted your concerns and our team will work on improving the recipe. Hope you give us another chance!",
    replied_at: "2026-06-20T12:00:00.000Z",
    created_at: "2026-06-20T10:00:00.000Z",
  },
  {
    id: "rev12f6a7-b8c9-0123-f012-345678901012",
    branch_id: BRANCH_KORAMANGALA_ID,
    brand_id: SPICE_GARDEN_ID,
    customer_name: "Ananya Singh",
    customer_phone: "9934561234",
    rating: 5,
    review_text: "I order from Spice Garden almost every week and the quality never disappoints! The Chicken Tikka is always perfectly marinated. Love it!",
    status: "approved",
    owner_reply: null,
    replied_at: null,
    created_at: "2026-06-19T14:00:00.000Z",
  },
];

/**
 * Seed demo reviews for Spice Garden.
 * Kept SEPARATE so integration tests are unaffected — boot-only.
 * @param {{ reviews: Map }} store
 */
function seedReviews(store) {
  store.reviews.clear();
  for (const r of FIXTURE_REVIEWS) {
    store.reviews.set(r.id, makeReview(r));
  }
}

module.exports = {
  seedStore,
  seedBrands,
  seedReportsAndPayouts,
  seedRestaurantsAndBranchesAndOrders,
  seedReviews,
  DEMO_PASSWORD,
  FIXTURE_USERS,
  FIXTURE_BRANDS,
};
