"use strict";

/**
 * Domain model factory for `reviews`.
 * brand_id is denormalised from branch → restaurant → brand for fast in-memory
 * filtering; when the real DB is wired, the query joins instead.
 * Mirrors db/migrations/11_reviews.sql.
 */

const { randomUUID } = require("crypto");

/**
 * @param {object} input
 * @returns {object} a shaped review row
 */
function makeReview({
  id,
  order_id,
  branch_id,
  brand_id,
  customer_name,
  customer_phone,
  rating,
  review_text,
  status,
  owner_reply,
  replied_at,
  created_at,
  updated_at,
} = {}) {
  const now = new Date().toISOString();
  return {
    id: id || randomUUID(),
    order_id: order_id || null,
    branch_id: branch_id || null,
    brand_id: brand_id || null,
    customer_name: customer_name || null,
    customer_phone: customer_phone || null,
    rating: Number(rating) || 1,
    review_text: review_text || null,
    status: status || "approved",
    owner_reply: owner_reply || null,
    replied_at: replied_at || null,
    created_at: created_at || now,
    updated_at: updated_at || now,
  };
}

module.exports = { makeReview };
