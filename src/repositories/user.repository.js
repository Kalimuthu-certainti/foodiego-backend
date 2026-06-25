"use strict";

/**
 * User data-access. In-memory store is the source of truth; when a Postgres pool
 * is configured, newly created users (e.g. invited staff) are also written to
 * Postgres and loaded back on boot. Seeded demo users are NOT persisted — they're
 * re-seeded in-memory on every boot. In tests / no-DB the pool is null (no-op).
 */

const { store } = require("../config/database");
const pool = require("../config/pgPool");
const { makeUser } = require("../models/user.model");

/**
 * Insert a user. Runs the model factory to apply defaults + shape.
 * @param {object} data
 * @returns {Promise<object>} the stored user
 */
async function create(data) {
  const user = makeUser(data);
  store.users.set(user.id, user);

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO users (id, email, password_hash, name, role, phone, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (id) DO NOTHING`,
        [user.id, user.email, user.password_hash, user.name, user.role, user.phone],
      );
    } catch (err) {
      console.error("[user.repository] persist failed:", err.message);
    }
  }

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

/**
 * Boot loader: hydrate the in-memory store with persisted users, without
 * overwriting the seeded demo fixtures (which keep their fixed ids).
 * @returns {Promise<number>} how many rows were loaded
 */
async function loadAll() {
  if (!pool) return 0;
  const { rows } = await pool.query(
    `SELECT id, email, password_hash, name, role, phone, created_at FROM users`,
  );
  let loaded = 0;
  for (const u of rows) {
    if (store.users.has(u.id)) continue; // don't clobber seeded fixtures
    store.users.set(u.id, {
      id: u.id,
      email: u.email,
      password_hash: u.password_hash,
      name: u.name,
      role: u.role,
      phone: u.phone,
      created_at: u.created_at ? new Date(u.created_at).toISOString() : new Date().toISOString(),
    });
    loaded += 1;
  }
  return loaded;
}

module.exports = { create, findById, findByEmail, loadAll };
