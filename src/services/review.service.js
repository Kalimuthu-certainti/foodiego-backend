"use strict";

/**
 * Review business logic. Resolves brand scope from the caller's userId,
 * enforces reply rules, and delegates data access to the repository.
 */

const brandRepository = require("../repositories/brand.repository");
const branchRepository = require("../repositories/branch.repository");
const reviewRepository = require("../repositories/review.repository");
const { NotFoundError, ForbiddenError, ValidationError } = require("../utils/errors");
const { REVIEW_STATUS } = require("../config/constants");

/** Resolve the first brand the caller owns (BRAND_OWNER has exactly one). */
async function resolveUserBrand(userId) {
  const brands = await brandRepository.findByOwner(userId);
  return brands[0] || null;
}

/** Attach branch_name to a review object. */
async function withBranchName(review) {
  if (!review || !review.branch_id) return { ...review, branch_name: null };
  const branch = await branchRepository.findById(review.branch_id);
  return { ...review, branch_name: branch ? branch.name : null };
}

/**
 * List reviews for the caller's brand with optional filters + pagination.
 * @param {string} userId
 * @param {object} filters
 * @returns {Promise<{ reviews: object[], total, page, limit }>}
 */
async function list(userId, filters) {
  const brand = await resolveUserBrand(userId);
  if (!brand) {
    return { reviews: [], total: 0, page: filters.page || 1, limit: filters.limit || 10 };
  }

  const result = await reviewRepository.findAll({ ...filters, brandId: brand.id });
  const reviews = await Promise.all(result.reviews.map(withBranchName));
  return { ...result, reviews };
}

/**
 * Rating summary for the caller's brand.
 * @param {string} userId
 * @returns {Promise<object>}
 */
async function summary(userId) {
  const brand = await resolveUserBrand(userId);
  if (!brand) {
    return {
      total_reviews: 0,
      avg_rating: 0,
      rating_breakdown: { "5_star": 0, "4_star": 0, "3_star": 0, "2_star": 0, "1_star": 0 },
    };
  }
  return reviewRepository.summarize(brand.id);
}

/**
 * Post a reply to a review (first time only).
 * Cannot reply to hidden or flagged reviews.
 * @param {string} userId
 * @param {string} reviewId
 * @param {string} replyText
 * @returns {Promise<object>} updated review
 */
async function postReply(userId, reviewId, replyText) {
  const brand = await resolveUserBrand(userId);
  const review = await reviewRepository.findById(reviewId);
  if (!review) throw new NotFoundError("Review not found");
  if (brand && review.brand_id !== brand.id) {
    throw new ForbiddenError("You can only manage your own brand");
  }
  if (review.status === REVIEW_STATUS.HIDDEN || review.status === REVIEW_STATUS.FLAGGED) {
    throw new ValidationError("Cannot reply to hidden or flagged reviews");
  }
  if (review.owner_reply) {
    throw new ValidationError("A reply has already been posted. Use PUT to edit it.");
  }

  const updated = await reviewRepository.update(reviewId, {
    owner_reply: replyText,
    replied_at: new Date().toISOString(),
  });

  return withBranchName(updated);
}

/**
 * Edit an existing reply.
 * @param {string} userId
 * @param {string} reviewId
 * @param {string} replyText
 * @returns {Promise<object>} updated review
 */
async function updateReply(userId, reviewId, replyText) {
  const brand = await resolveUserBrand(userId);
  const review = await reviewRepository.findById(reviewId);
  if (!review) throw new NotFoundError("Review not found");
  if (brand && review.brand_id !== brand.id) {
    throw new ForbiddenError("You can only manage your own brand");
  }
  if (!review.owner_reply) {
    throw new ValidationError("No reply to update. Use POST to create one.");
  }

  const updated = await reviewRepository.update(reviewId, {
    owner_reply: replyText,
    replied_at: new Date().toISOString(),
  });

  return withBranchName(updated);
}

module.exports = { list, summary, postReply, updateReply };
