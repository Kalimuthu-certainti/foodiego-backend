"use strict";

/**
 * Brand business logic. Controllers stay thin and delegate here; all data
 * access goes through brand.repository (never the store directly), and every
 * mutation records an audit entry.
 *
 * Auto-approve gate: while config.requireAdminApproval === false a new brand is
 * created APPROVED + is_active. Flip REQUIRE_ADMIN_APPROVAL=true later and new
 * brands land PENDING/inactive and an admin-queue notification is emitted — no
 * other code change required, the gate is already here.
 */

const brandRepo = require("../repositories/brand.repository");
const audit = require("../utils/audit");
const adminQueue = require("../utils/adminQueue");
const { config } = require("../config");
const { BRAND_STATUS, AUDIT_ACTION, ENTITY } = require("../config/constants");
const { NotFoundError } = require("../utils/errors");

/**
 * Create a brand owned by `ownerId`.
 * @param {string} ownerId
 * @param {{ name: string }} input
 * @returns {Promise<object>} the created brand
 */
async function create(ownerId, { name }) {
  const autoApprove = !config.requireAdminApproval;

  const brand = await brandRepo.create({
    owner_id: ownerId,
    name,
    status: autoApprove ? BRAND_STATUS.APPROVED : BRAND_STATUS.PENDING,
    is_active: autoApprove,
  });

  audit.log(ownerId, AUDIT_ACTION.CREATE, ENTITY.BRAND, brand.id, { name });

  // Approval phase: route new brands to the admin queue for review.
  if (!autoApprove) {
    await adminQueue.notify("brand.created", brand.id, { owner_id: ownerId, name });
  }

  return brand;
}

/**
 * List brands owned by the caller.
 * @param {string} ownerId
 * @returns {Promise<object[]>}
 */
async function list(ownerId) {
  return brandRepo.findByOwner(ownerId);
}

/**
 * Fetch a single brand by id. Ownership is enforced upstream by scopeCheck.
 * @param {string} id
 * @returns {Promise<object>}
 */
async function get(id) {
  const brand = await brandRepo.findById(id);
  if (!brand) throw new NotFoundError("Brand not found");
  return brand;
}

/**
 * Patch a brand. Ownership is enforced upstream by scopeCheck.
 * @param {string} actorId  the calling user (for the audit trail)
 * @param {string} id
 * @param {object} patch     sanitized updatable fields (e.g. { name })
 * @returns {Promise<object>}
 */
async function update(actorId, id, patch) {
  const updated = await brandRepo.update(id, patch);
  if (!updated) throw new NotFoundError("Brand not found");
  audit.log(actorId, AUDIT_ACTION.UPDATE, ENTITY.BRAND, id, patch);
  return updated;
}

/**
 * Delete a brand. Ownership is enforced upstream by scopeCheck.
 * @param {string} actorId
 * @param {string} id
 * @returns {Promise<void>}
 */
async function remove(actorId, id) {
  const existed = await brandRepo.findById(id);
  if (!existed) throw new NotFoundError("Brand not found");
  await brandRepo.remove(id);
  audit.log(actorId, AUDIT_ACTION.DELETE, ENTITY.BRAND, id, null);
}

module.exports = { create, list, get, update, remove };
