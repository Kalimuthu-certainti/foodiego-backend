"use strict";

/**
 * Shared enums / string constants used across layers.
 * Status string values mirror the future Postgres CHECK constraints.
 */

const ROLES = Object.freeze({
  BRAND_OWNER: "BRAND_OWNER",
  RESTAURANT_MANAGER: "RESTAURANT_MANAGER",
  RESTAURANT_OPERATOR: "RESTAURANT_OPERATOR",
  RESTAURANT_SUPPORT_STAFF: "RESTAURANT_SUPPORT_STAFF",
  ADMIN: "ADMIN",
});

const BRAND_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});

const MAPPING_STATUS = Object.freeze({
  INVITED: "invited",
  ACTIVE: "active",
  REMOVED: "removed",
});

const MENU_REQUEST_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});

const PAYOUT_STATUS = Object.freeze({
  PENDING: "pending",
  PAID: "paid",
});

const AUDIT_ACTION = Object.freeze({
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  INVITE: "INVITE",
  REMOVE: "REMOVE",
  SCOPE_DENIED: "SCOPE_DENIED",
});

const ORDER_STATUS = Object.freeze({
  PLACED: "placed",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
});

const PAYMENT_STATUS = Object.freeze({
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
});

const ENTITY = Object.freeze({
  BRAND: "brands",
  RESTAURANT: "restaurants",
  BRANCH: "branches",
  MAPPING: "restaurant_user_mapping",
  MENU_CHANGE_REQUEST: "menu_change_requests",
  PAYOUT: "payouts",
  ORDER: "orders",
});

module.exports = {
  ROLES,
  BRAND_STATUS,
  MAPPING_STATUS,
  MENU_REQUEST_STATUS,
  PAYOUT_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  AUDIT_ACTION,
  ENTITY,
};
