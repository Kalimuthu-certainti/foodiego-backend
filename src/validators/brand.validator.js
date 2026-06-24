"use strict";

/**
 * Joi schemas for the brand endpoints. Used by the `validate` middleware, which
 * runs them with { abortEarly:false, stripUnknown:true, convert:true } and
 * replaces req[property] with the sanitized value on success.
 */

const Joi = require("joi");

/**
 * POST /api/brands body. `name` is the only client-supplied field; owner,
 * status and is_active are derived server-side in the service layer.
 */
const createBrandSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
});

/**
 * PATCH /api/brands/:id body. `name` is optional but at least one updatable
 * field must be present so an empty patch is rejected.
 */
const updateBrandSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120),
}).min(1);

module.exports = { createBrandSchema, updateBrandSchema };
