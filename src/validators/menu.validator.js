"use strict";

/**
 * Joi schemas for the MENU domain.
 *
 *   submission   -> POST /api/brands/:id/menu-submission  body { items }
 *   changeRequest-> POST /api/menu-change-requests         body { brandId, items, reason? }
 *
 * `items` is free-form JSONB in the data model (object or array of menu items),
 * so we only assert presence + that it is a non-empty array/object. Validators
 * stay declarative; all business rules (menu_locked etc.) live in the service.
 */

const Joi = require("joi");

const itemsSchema = Joi.alternatives()
  .try(Joi.array().min(1), Joi.object().min(1))
  .required()
  .messages({
    "alternatives.types": "items must be a non-empty array or object",
    "any.required": "items is required",
  });

/** POST /api/brands/:id/menu-submission */
const submission = Joi.object({
  items: itemsSchema,
});

/** POST /api/menu-change-requests */
const changeRequest = Joi.object({
  brandId: Joi.string().required(),
  items: itemsSchema,
  reason: Joi.string().allow("", null).optional(),
});

module.exports = { submission, changeRequest };
