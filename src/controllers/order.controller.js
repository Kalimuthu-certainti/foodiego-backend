"use strict";

/**
 * Order controller — THIN. Parses the request, delegates to the service,
 * sends the response, and forwards errors to next(). No business logic here.
 */

const orderService = require("../services/order.service");

/**
 * @route   GET /api/orders/summary
 * @desc    Count of orders per status for the caller's brand
 * @access  Private: BRAND_OWNER
 * @returns 200 { placed_count, confirmed_count, preparing_count, out_for_delivery_count, delivered_count, cancelled_count }
 */
async function getSummary(req, res, next) {
  try {
    const result = await orderService.summary(req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   GET /api/orders
 * @desc    Paginated list of orders for the caller's brand
 * @access  Private: BRAND_OWNER
 * @query   ?branch_id= &status= &from= &to= &search= &page= &limit=
 * @returns 200 { orders, total, page, limit }
 */
async function list(req, res, next) {
  try {
    const { branch_id, status, from, to, search, page, limit } = req.query;
    const result = await orderService.list(req.user.id, {
      branchId: branch_id || undefined,
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
 * @route   GET /api/orders/:id
 * @desc    Full order detail for a single order
 * @access  Private: BRAND_OWNER (must own the order's brand)
 * @returns 200 Order | 403 | 404
 */
async function getById(req, res, next) {
  try {
    const order = await orderService.getById(req.user.id, req.params.id);
    return res.status(200).json(order);
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancel an order (only placed/confirmed may be cancelled)
 * @access  Private: BRAND_OWNER (must own the order's brand)
 * @body    { reason: string } (required)
 * @returns 200 updated Order | 400 (bad status / missing reason) | 403 | 404
 */
async function cancelOrder(req, res, next) {
  try {
    const { reason } = req.body;
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ error: "Cancel reason is required" });
    }
    const order = await orderService.cancel(
      req.user.id,
      req.params.id,
      String(reason).trim()
    );
    return res.status(200).json(order);
  } catch (err) {
    return next(err);
  }
}

module.exports = { getSummary, list, getById, cancelOrder };
