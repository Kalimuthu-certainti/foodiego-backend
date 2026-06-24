"use strict";

/**
 * Staff (restaurant_user_mapping) business logic.
 *
 * Owns the rules for inviting and removing staff on a brand; controllers stay
 * thin and only translate HTTP <-> service calls. Data access goes through the
 * repositories (no direct store access here), and every mutation writes an
 * audit entry.
 */

const mappingRepo = require("../repositories/mapping.repository");
const brandRepo = require("../repositories/brand.repository");
const userRepo = require("../repositories/user.repository");
const sms = require("../utils/sms");
const tokens = require("../utils/tokens");
const audit = require("../utils/audit");
const { MAPPING_STATUS, AUDIT_ACTION, ENTITY } = require("../config/constants");
const { NotFoundError } = require("../utils/errors");

/**
 * Derive a placeholder login email for a provisioned staff member from their
 * name + phone, e.g. "asha.rao.9876543210@staff.foodiego.test". Unique enough
 * for the in-memory phase; the real onboarding flow would collect a real email.
 */
function staffEmail(name, phone) {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
  return `${slug || "staff"}.${phone}@staff.foodiego.test`;
}

/**
 * Invite a staff member onto a brand's scope BY NAME (not a pre-existing id).
 *
 * The owner knows their teammate by name + phone, so we provision the user here:
 * reuse an existing account if one already has the derived email, otherwise
 * create one with the given name/role/phone. We then create the mapping (ACTIVE
 * so it shows in the invitee's next-login scope), fire a (stubbed) SMS invite,
 * and audit INVITE.
 *
 * @param {string} actorId  the calling brand owner's user id
 * @param {object} input    { name, role, brandId, restaurantId?, branchId?, phone }
 * @returns {Promise<object>} the created mapping, enriched with user_name + phone
 */
async function invite(actorId, input) {
  const { name, role, brandId, restaurantId, branchId, phone } = input;

  const email = staffEmail(name, phone);
  let user = await userRepo.findByEmail(email);
  if (!user) {
    user = await userRepo.create({
      email,
      password_hash: "", // set when the invitee completes onboarding
      name,
      role,
      phone,
    });
  }

  const mapping = await mappingRepo.create({
    user_id: user.id,
    role,
    brand_id: brandId,
    restaurant_id: restaurantId ?? null,
    branch_id: branchId ?? null,
    status: MAPPING_STATUS.ACTIVE,
  });

  const brand = await brandRepo.findById(brandId);
  await sms.sendInvite(phone, {
    brandName: brand ? brand.name : "FoodieGo",
    role,
  });

  audit.log(actorId, AUDIT_ACTION.INVITE, ENTITY.MAPPING, mapping.id, {
    user_id: user.id,
    name,
    role,
    brand_id: brandId,
    restaurant_id: mapping.restaurant_id,
    branch_id: mapping.branch_id,
  });

  return { ...mapping, user_name: user.name, phone: user.phone };
}

/**
 * Remove a staff mapping: set status REMOVED, revoke the affected user's
 * refresh tokens (so their session can no longer be renewed), and audit REMOVE.
 *
 * @param {string} actorId    the calling brand owner's user id
 * @param {string} mappingId  the mapping to remove
 * @returns {Promise<object>} the updated (removed) mapping
 */
async function remove(actorId, mappingId) {
  const existing = await mappingRepo.findById(mappingId);
  if (!existing) {
    throw new NotFoundError("Mapping not found");
  }

  const mapping = await mappingRepo.update(mappingId, {
    status: MAPPING_STATUS.REMOVED,
  });

  tokens.revokeRefreshTokensForUser(mapping.user_id);

  audit.log(actorId, AUDIT_ACTION.REMOVE, ENTITY.MAPPING, mapping.id, {
    user_id: mapping.user_id,
    brand_id: mapping.brand_id,
  });

  return mapping;
}

/**
 * List all mappings for a brand, each enriched with the staff member's name and
 * phone (resolved from the user record) so the UI can show people, not ids.
 * @param {string} brandId
 * @returns {Promise<object[]>}
 */
async function listByBrand(brandId) {
  const mappings = await mappingRepo.findByBrand(brandId);
  return Promise.all(
    mappings.map(async (mapping) => {
      const user = await userRepo.findById(mapping.user_id);
      return {
        ...mapping,
        user_name: user ? user.name : null,
        phone: user ? user.phone : null,
      };
    })
  );
}

module.exports = { invite, remove, listByBrand };
