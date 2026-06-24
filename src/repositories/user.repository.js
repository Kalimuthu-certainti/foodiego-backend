"use strict";

/**
 * User data-access over the in-memory store ONLY (no business logic).
 *
 * DB-deferred seam: every method is async (returns a Promise) so that swapping
 * the Map for a real `pg` Pool later requires no change to callers (services).
 */

const { store } = require("../config/database");
const { makeUser } = require("../models/user.model");

/**
 * Insert a user. Runs the model factory to apply defaults + shape.
 * @param {object} data
 * @returns {Promise<object>} the stored user
 */
async function create(data) {
  const user = makeUser(data);
  store.users.set(user.id, user);
  return user;
}

/**
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  return store.users.get(id) || null;
}

/**
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function findByEmail(email) {
  for (const user of store.users.values()) {
    if (user.email === email) return user;
  }
  return null;
}

module.exports = { create, findById, findByEmail };
