"use strict";

/**
 * Joi schemas for the branch endpoints.
 *
 * - lat/lng are REQUIRED numbers within geographic ranges (lat -90..90,
 *   lng -180..180).
 * - workingHours is an OPTIONAL object mapping a day key -> array of
 *   { open, close } time strings, matching the JSONB shape in section 4.3 of
 *   the spec. Defaults to {} so the model factory persists an empty object.
 */

const Joi = require("joi");

const timeSlot = Joi.object({
  open: Joi.string().required(),
  close: Joi.string().required(),
});

/**
 * day -> [{ open, close }]. Unknown day keys are allowed (pattern), values must
 * be arrays of time slots. An empty array (closed all day) is valid.
 */
const workingHours = Joi.object()
  .pattern(Joi.string(), Joi.array().items(timeSlot))
  .default({});

const createBranch = Joi.object({
  restaurantId: Joi.string().required(),
  name: Joi.string().trim().min(1).required(),
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  workingHours,
});

const listBranchesQuery = Joi.object({
  restaurantId: Joi.string().required(),
});

const updateBranch = Joi.object({
  name: Joi.string().trim().min(1),
  lat: Joi.number().min(-90).max(90),
  lng: Joi.number().min(-180).max(180),
  workingHours,
}).min(1);

module.exports = { createBranch, listBranchesQuery, updateBranch };
