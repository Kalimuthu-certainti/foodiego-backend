"use strict";

/**
 * Joi schemas for the staff (restaurant_user_mapping) domain.
 *
 * Validation rules mirror the API contract:
 *   - name required (staff are invited by name; the user is provisioned server-side).
 *   - brandId required UUID; restaurantId / branchId optional UUIDs.
 *   - role must be one of the ROLES enum values.
 *   - phone exactly 10 digits (matches the SMS invite gateway expectation).
 */

const Joi = require("joi");
const { ROLES } = require("../config/constants");

const inviteSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  role: Joi.string()
    .valid(...Object.values(ROLES))
    .required(),
  brandId: Joi.string().uuid().required(),
  restaurantId: Joi.string().uuid().optional(),
  branchId: Joi.string().uuid().optional(),
  phone: Joi.string()
    .pattern(/^\d{10}$/)
    .required()
    .messages({ "string.pattern.base": "phone must be exactly 10 digits" }),
});

module.exports = { inviteSchema };
