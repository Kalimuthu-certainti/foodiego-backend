"use strict";

/**
 * Order business logic. Thin — resolves brand scope from the caller's userId,
 * validates state transitions, and delegates data access to the repository.
 */

const brandRepository = require("../repositories/brand.repository");
const branchRepository = require("../repositories/branch.repository");
const orderRepository = require("../repositories/order.repository");
const { NotFoundError, ForbiddenError, ValidationError } = require("../utils/errors");
const { ORDER_STATUS } = require("../config/constants");

/** Resolve the first brand the caller owns (BRAND_OWNER has exactly one). */
async function resolveUserBrand(userId) {
  const brands = await brandRepository.findByOwner(userId);
  return brands[0] || null;
}

/** Attach branch_name to an order object. */
async function withBranchName(order) {
  if (!order || !order.branch_id) return { ...order, branch_name: null };
  const branch = await branchRepository.findById(order.branch_id);
  return { ...order, branch_name: branch ? branch.name : null };
}

/**
 * List orders for the caller's brand with optional filters + pagination.
 * @param {string} userId
 * @param {object} filters
 * @returns {Promise<{ orders: object[], total, page, limit }>}
 */
async function list(userId, filters) {
  const brand = await resolveUserBrand(userId);
  if (!brand) {
    return { orders: [], total: 0, page: filters.page || 1, limit: filters.limit || 10 };
  }

  const result = await orderRepository.findAll({ ...filters, brandId: brand.id });
  const orders = await Promise.all(result.orders.map(withBranchName));
  return { ...result, orders };
}

/**
 * Fetch a single order by id (caller must own the order's brand).
 * @param {string} userId
 * @param {string} id
 * @returns {Promise<object>}
 */
async function getById(userId, id) {
  const brand = await resolveUserBrand(userId);
  const order = await orderRepository.findById(id);
  if (!order) throw new NotFoundError("Order not found");
  if (brand && order.brand_id !== brand.id) {
    throw new ForbiddenError("You can only manage your own brand");
  }
  return withBranchName(order);
}

/**
 * Cancel an order. Only allowed for `placed` and `confirmed` statuses.
 * @param {string} userId
 * @param {string} id
 * @param {string} reason
 * @returns {Promise<object>} the updated order
 */
async function cancel(userId, id, reason) {
  const brand = await resolveUserBrand(userId);
  const order = await orderRepository.findById(id);
  if (!order) throw new NotFoundError("Order not found");
  if (brand && order.brand_id !== brand.id) {
    throw new ForbiddenError("You can only manage your own brand");
  }

  const cancellable = [ORDER_STATUS.PLACED, ORDER_STATUS.CONFIRMED];
  if (!cancellable.includes(order.status)) {
    throw new ValidationError(
      `Cannot cancel an order with status "${order.status}". Only placed or confirmed orders can be cancelled.`
    );
  }

  const updated = await orderRepository.update(id, {
    status: ORDER_STATUS.CANCELLED,
    cancel_reason: reason,
    cancelled_by: "brand_owner",
    cancelled_at: new Date().toISOString(),
  });

  return withBranchName(updated);
}

/**
 * Status summary (count per status) for the caller's brand.
 * @param {string} userId
 * @returns {Promise<object>}
 */
async function summary(userId) {
  const brand = await resolveUserBrand(userId);
  if (!brand) {
    return {
      placed_count: 0,
      confirmed_count: 0,
      preparing_count: 0,
      out_for_delivery_count: 0,
      delivered_count: 0,
      cancelled_count: 0,
    };
  }
  return orderRepository.summarize(brand.id);
}

module.exports = { list, getById, cancel, summary };
