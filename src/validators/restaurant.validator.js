"use strict";

/**
 * Joi schemas for the restaurant domain.
 *
 * Field rules (mirror the data model / future Postgres CHECK constraints):
 *   gstNo  - optional; when given, exactly 15 chars
 *   email  - optional; when given, an RFC email
 *   phone  - exactly 10 digits
 *   brandId - the owned brand the restaurant belongs to (scopeCheck enforces ownership)
 */

const Joi = require("joi");

const createRestaurant = Joi.object({
  brandId: Joi.string().required(),
  name: Joi.string().trim().min(1).required(),
  gstNo: Joi.string()
    .length(15)
    .allow("", null)
    .optional()
    .messages({
      "string.length": "gstNo must be exactly 15 characters",
    }),
  email: Joi.string().email({ tlds: { allow: false } }).allow("", null).optional(),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "phone must be exactly 10 digits",
    }),
});

const listByBrand = Joi.object({
  brandId: Joi.string().required(),
});

module.exports = { createRestaurant, listByBrand };
