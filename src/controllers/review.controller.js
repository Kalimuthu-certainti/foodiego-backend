"use strict";

/**
 * Review controller — THIN. Parses the request, delegates to the service,
 * sends the response, and forwards errors to next(). No business logic here.
 */

const reviewService = require("../services/review.service");

/**
 * @route   GET /api/reviews/summary
 * @desc    Rating summary (avg, total, breakdown) for the caller's brand
 * @access  Private: BRAND_OWNER
 * @returns 200 { total_reviews, avg_rating, rating_breakdown }
 */
async function getSummary(req, res, next) {
  try {
    const result = await reviewService.summary(req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   GET /api/reviews
 * @desc    Paginated list of reviews for the caller's brand
 * @access  Private: BRAND_OWNER
 * @query   ?branch_id= &rating= &status= &from= &to= &search= &page= &limit=
 * @returns 200 { reviews, total, page, limit }
 */
async function list(req, res, next) {
  try {
    const { branch_id, rating, status, from, to, search, page, limit } = req.query;
    const result = await reviewService.list(req.user.id, {
      branchId: branch_id || undefined,
      rating: rating || undefined,
      status: status || undefined,
      from: from || undefined,
      to: to || undefined,
      search: search || undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   POST /api/reviews/:id/reply
 * @desc    Post a reply to a review (first time only)
 * @access  Private: BRAND_OWNER
 * @body    { reply_text } (required, 10-500 chars)
 * @returns 200 updated review | 400 | 403 | 404
 */
async function createReply(req, res, next) {
  try {
    const { reply_text } = req.body;
    if (!reply_text || !String(reply_text).trim()) {
      return res.status(400).json({ error: "reply_text is required" });
    }
    const replyText = String(reply_text).trim();
    if (replyText.length < 10) {
      return res.status(400).json({ error: "Reply must be at least 10 characters" });
    }
    if (replyText.length > 500) {
      return res.status(400).json({ error: "Reply must not exceed 500 characters" });
    }
    const review = await reviewService.postReply(req.user.id, req.params.id, replyText);
    return res.status(200).json(review);
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   PUT /api/reviews/:id/reply
 * @desc    Edit an existing reply
 * @access  Private: BRAND_OWNER
 * @body    { reply_text } (required, 10-500 chars)
 * @returns 200 updated review | 400 | 403 | 404
 */
async function editReply(req, res, next) {
  try {
    const { reply_text } = req.body;
    if (!reply_text || !String(reply_text).trim()) {
      return res.status(400).json({ error: "reply_text is required" });
    }
    const replyText = String(reply_text).trim();
    if (replyText.length < 10) {
      return res.status(400).json({ error: "Reply must be at least 10 characters" });
    }
    if (replyText.length > 500) {
      return res.status(400).json({ error: "Reply must not exceed 500 characters" });
    }
    const review = await reviewService.updateReply(req.user.id, req.params.id, replyText);
    return res.status(200).json(review);
  } catch (err) {
    return next(err);
  }
}

module.exports = { getSummary, list, createReply, editReply };
