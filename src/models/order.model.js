"use strict";

/**
 * Domain model factory for `orders`.
 * items is a JSONB array: [{ name, qty, unit_price, subtotal }, ...].
 * Timestamps track each lifecycle stage; null means not yet reached.
 * Mirrors db/migrations/10_orders.sql.
 */

const { randomUUID } = require("crypto");

/**
 * Generate a human-readable order number: ORD-YYYYMMDD-XXXX
 */
function generateOrderNumber() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000 + 1000); // 1000–9999
  return `ORD-${datePart}-${rand}`;
}

/**
 * @param {object} input
 * @returns {object} a shaped order row
 */
function makeOrder({
  id,
  order_number,
  brand_id,
  branch_id,
  customer_name,
  customer_phone,
  customer_address,
  items,
  total_amount,
  platform_fee,
  delivery_fee,
  net_amount,
  payment_method,
  payment_status,
  status,
  cancel_reason,
  cancelled_by,
  placed_at,
  confirmed_at,
  preparing_at,
  out_for_delivery_at,
  delivered_at,
  cancelled_at,
  created_at,
  updated_at,
} = {}) {
  const now = new Date().toISOString();
  return {
    id: id || randomUUID(),
    order_number: order_number || generateOrderNumber(),
    brand_id: brand_id || null,
    branch_id: branch_id || null,
    customer_name: customer_name || null,
    customer_phone: customer_phone || null,
    customer_address: customer_address || null,
    items: items || [],
    total_amount: Number(total_amount) || 0,
    platform_fee: Number(platform_fee) || 0,
    delivery_fee: Number(delivery_fee) || 0,
    net_amount: Number(net_amount) || 0,
    payment_method: payment_method || null,
    payment_status: payment_status || "pending",
    status: status || "placed",
    cancel_reason: cancel_reason || null,
    cancelled_by: cancelled_by || null,
    placed_at: placed_at || now,
    confirmed_at: confirmed_at || null,
    preparing_at: preparing_at || null,
    out_for_delivery_at: out_for_delivery_at || null,
    delivered_at: delivered_at || null,
    cancelled_at: cancelled_at || null,
    created_at: created_at || now,
    updated_at: updated_at || now,
  };
}

module.exports = { makeOrder, generateOrderNumber };
