"use strict";

/**
 * MENU service — business logic for menu submission + change requests.
 *
 * Layer rules: this is the ONLY place the menu/brand business logic lives, and
 * every mutation writes an audit entry. Data access is delegated to the
 * repositories; we never touch the store directly here.
 */

const brandRepo = require("../repositories/brand.repository");
const menuRepo = require("../repositories/menu.repository");
const audit = require("../utils/audit");
const { AUDIT_ACTION, ENTITY, MENU_REQUEST_STATUS } = require("../config/constants");
const { NotFoundError, ConflictError } = require("../utils/errors");

/**
 * Submit (lock) a brand's menu. One-shot: once a menu is submitted the brand is
 * locked and any further submission must go through a change request.
 *
 * @param {string} actorId  the calling brand owner (for audit)
 * @param {string} brandId
 * @param {{items: (object|Array)}} payload
 * @returns {Promise<object>} the updated brand row
 * @throws {NotFoundError} if the brand does not exist
 * @throws {ConflictError} if the menu is already locked
 */
async function submitMenu(actorId, brandId, { items }) {
  const brand = await brandRepo.findById(brandId);
  if (!brand) {
    throw new NotFoundError("Brand not found");
  }
  if (brand.menu_locked) {
    throw new ConflictError(
      "Menu is already locked; submit a change request instead"
    );
  }

  const updated = await brandRepo.update(brandId, { menu_locked: true });
  audit.log(actorId, AUDIT_ACTION.UPDATE, ENTITY.BRAND, brandId, { items });
  return updated;
}

/**
 * Create a PENDING menu change request for a brand.
 *
 * @param {string} actorId
 * @param {{brandId: string, items: (object|Array), reason?: string}} payload
 * @returns {Promise<object>} the created change request (status PENDING)
 * @throws {NotFoundError} if the brand does not exist
 */
async function createChangeRequest(actorId, { brandId, items, reason }) {
  const brand = await brandRepo.findById(brandId);
  if (!brand) {
    throw new NotFoundError("Brand not found");
  }

  const request = await menuRepo.createChangeRequest({
    brand_id: brandId,
    items,
    reason: reason ?? null,
    status: MENU_REQUEST_STATUS.PENDING,
  });
  audit.log(
    actorId,
    AUDIT_ACTION.CREATE,
    ENTITY.MENU_CHANGE_REQUEST,
    request.id,
    { brand_id: brandId, items, reason: reason ?? null }
  );
  return request;
}

/**
 * List a brand's menu change requests.
 *
 * @param {string} brandId
 * @returns {Promise<object[]>}
 */
async function listChangeRequests(brandId) {
  return menuRepo.findChangeRequestsByBrand(brandId);
}

module.exports = { submitMenu, createChangeRequest, listChangeRequests };
