"use strict";

/**
 * Auth domain service. Holds all business logic; controllers stay thin.
 *
 * Data access goes exclusively through repositories (never the store directly),
 * so the in-memory phase swaps to Postgres with no change here. Token minting
 * and revocation live in utils/tokens (in-memory jti registry for this phase).
 */

const bcrypt = require("bcryptjs");
const userRepo = require("../repositories/user.repository");
const brandRepo = require("../repositories/brand.repository");
const mappingRepo = require("../repositories/mapping.repository");
const tokens = require("../utils/tokens");
const { MAPPING_STATUS } = require("../config/constants");
const { UnauthorizedError } = require("../utils/errors");

/**
 * Compute the access-token scopes for a user: the brand ids they own plus the
 * brand ids of any mapping where they are an active/invited member.
 *
 * Scopes are advisory metadata carried in the token; the authoritative ownership
 * check still runs server-side via mappingRepo.ownsScope in scopeCheck.
 *
 * @param {object} user
 * @returns {Promise<string[]>} de-duplicated brand ids
 */
async function computeScopes(user) {
  const scopeSet = new Set();

  // Brands the user owns directly.
  const owned = await brandRepo.findByOwner(user.id);
  for (const brand of owned) {
    if (brand.id) scopeSet.add(brand.id);
  }

  // Brands the user is mapped into (active or invited). The mapping repo exposes
  // findByBrand (not findByUser), so we scan each owned brand's mappings for rows
  // belonging to this user. Owners are the only callers with scoped brands in
  // this phase, so this covers the brand-owner login flow the contract targets.
  for (const brand of owned) {
    const mappings = await mappingRepo.findByBrand(brand.id);
    for (const mapping of mappings) {
      if (
        mapping.user_id === user.id &&
        (mapping.status === MAPPING_STATUS.ACTIVE ||
          mapping.status === MAPPING_STATUS.INVITED) &&
        mapping.brand_id
      ) {
        scopeSet.add(mapping.brand_id);
      }
    }
  }

  return Array.from(scopeSet);
}

/**
 * Verify credentials and mint a token pair.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{accessToken:string,refreshToken:string,user:{id:string,email:string,role:string}}>}
 * @throws {UnauthorizedError} on unknown email or bad password
 */
async function login(email, password) {
  // Emails are stored lower-cased; normalize the input so a stray capital or
  // surrounding whitespace (common from autofill/keyboards) doesn't 401.
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = await userRepo.findByEmail(normalizedEmail);
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const scopes = await computeScopes(user);
  const tokenUser = { id: user.id, role: user.role, scopes };

  const accessToken = tokens.issueAccessToken(tokenUser);
  const refreshToken = tokens.issueRefreshToken(tokenUser);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role },
  };
}

/**
 * Exchange a valid (non-revoked) refresh token for a fresh access token.
 * Re-loads the user so role/scopes in the new access token are current.
 * @param {string} token
 * @returns {Promise<{accessToken:string}>}
 * @throws {UnauthorizedError} on invalid/expired/revoked token or missing user
 */
async function refresh(token) {
  const { id } = tokens.verifyRefreshToken(token);

  const user = await userRepo.findById(id);
  if (!user) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const scopes = await computeScopes(user);
  const accessToken = tokens.issueAccessToken({
    id: user.id,
    role: user.role,
    scopes,
  });

  return { accessToken };
}

/**
 * Revoke every refresh token for the caller (logout-everywhere semantics for
 * this phase). Idempotent.
 * @param {string} userId
 * @returns {Promise<void>}
 */
async function logout(userId) {
  tokens.revokeRefreshTokensForUser(userId);
}

module.exports = { login, refresh, logout, computeScopes };
