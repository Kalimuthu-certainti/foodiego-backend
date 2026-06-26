"use strict";

/**
 * Review data-access over the in-memory store ONLY (no business logic).
 * All methods are async for the future pg swap.
 */

const { store } = require("../config/database");
const { makeReview } = require("../models/review.model");

/**
 * @param {object} data
 * @returns {Promise<object>}
 */
async function create(data) {
  const review = makeReview(data);
  store.reviews.set(review.id, review);
  return review;
}

/**
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  return store.reviews.get(id) || null;
}

/**
 * List reviews with optional filters + pagination.
 *
 * @param {object} opts
 * @param {string}  [opts.brandId]
 * @param {string}  [opts.branchId]
 * @param {number}  [opts.rating]     exact star count 1-5
 * @param {string}  [opts.status]     approved / hidden / flagged
 * @param {string}  [opts.from]       YYYY-MM-DD created_at lower bound (inclusive)
 * @param {string}  [opts.to]         YYYY-MM-DD created_at upper bound (inclusive, end of day)
 * @param {string}  [opts.search]     matches customer_name or review_text (case-insensitive)
 * @param {number}  [opts.page=1]
 * @param {number}  [opts.limit=10]
 * @returns {Promise<{ reviews: object[], total: number, page: number, limit: number }>}
 */
async function findAll({
  brandId,
  branchId,
  rating,
  status,
  from,
  to,
  search,
  page = 1,
  limit = 10,
} = {}) {
  const toEnd = to ? `${to}T23:59:59.999Z` : null;

  const filtered = [];
  for (const review of store.reviews.values()) {
    if (brandId && review.brand_id !== brandId) continue;
    if (branchId && review.branch_id !== branchId) continue;
    if (rating && review.rating !== Number(rating)) continue;
    if (status && review.status !== status) continue;
    if (from && review.created_at < from) continue;
    if (toEnd && review.created_at > toEnd) continue;
    if (search) {
      const q = search.toLowerCase();
      const matchName = (review.customer_name || "").toLowerCase().includes(q);
      const matchText = (review.review_text || "").toLowerCase().includes(q);
      if (!matchName && !matchText) continue;
    }
    filtered.push(review);
  }

  // Most recent first
  filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const reviews = filtered.slice(offset, offset + limit);

  return { reviews, total, page, limit };
}

/**
 * Rating summary for a brand.
 * @param {string} brandId
 * @returns {Promise<object>}
 */
async function summarize(brandId) {
  let total = 0;
  let ratingSum = 0;
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  for (const review of store.reviews.values()) {
    if (review.brand_id !== brandId) continue;
    total++;
    ratingSum += review.rating;
    if (Object.prototype.hasOwnProperty.call(breakdown, review.rating)) {
      breakdown[review.rating]++;
    }
  }

  const avg_rating = total > 0 ? Math.round((ratingSum / total) * 10) / 10 : 0;

  return {
    total_reviews: total,
    avg_rating,
    rating_breakdown: {
      "5_star": breakdown[5],
      "4_star": breakdown[4],
      "3_star": breakdown[3],
      "2_star": breakdown[2],
      "1_star": breakdown[1],
    },
  };
}

/**
 * Patch an existing review; bumps updated_at. Returns null if not found.
 * @param {string} id
 * @param {object} patch
 * @returns {Promise<object|null>}
 */
async function update(id, patch) {
  const review = store.reviews.get(id);
  if (!review) return null;
  const updated = {
    ...review,
    ...patch,
    id: review.id,
    updated_at: new Date().toISOString(),
  };
  store.reviews.set(id, updated);
  return updated;
}

module.exports = { create, findById, findAll, summarize, update };
