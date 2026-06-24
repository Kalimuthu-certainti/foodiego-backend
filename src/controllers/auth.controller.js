"use strict";

/**
 * Auth controllers — THIN. Parse the request, call the service, shape the
 * response, and forward errors to the central error handler via next().
 * No business logic lives here.
 */

const authService = require("../services/auth.service");

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate a user with email + password and issue tokens.
 * @access  Public
 * @body    { email: string, password: string }
 * @returns 200 { accessToken, refreshToken, user: { id, email, role } } | 400 | 401
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   POST /api/auth/refresh
 * @desc    Exchange a valid refresh token for a new access token.
 * @access  Public
 * @body    { refreshToken: string }
 * @returns 200 { accessToken } | 400 | 401
 */
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   POST /api/auth/logout
 * @desc    Revoke the caller's refresh tokens (logout).
 * @access  Private: any authenticated user (jwtVerify)
 * @returns 204 No Content | 401
 */
async function logout(req, res, next) {
  try {
    await authService.logout(req.user.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

/**
 * @route   GET /api/auth/me
 * @desc    Return the authenticated caller's identity from the verified token.
 * @access  Private: any authenticated user (jwtVerify)
 * @returns 200 { user: { id, role, scopes } } | 401
 */
async function me(req, res, next) {
  try {
    return res.status(200).json({ user: req.user });
  } catch (err) {
    return next(err);
  }
}

module.exports = { login, refresh, logout, me };
