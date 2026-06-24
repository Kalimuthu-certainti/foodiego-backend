const authService = require('../services/authService');
const { refreshTokens } = require('../services/tokenService');

// GET /api/diner/auth/check-username?username=xxx
async function checkUsername(req, res, next) {
  try {
    const { username } = req.query;
    if (!username || username.length < 3 || username.length > 30 || !/^[a-zA-Z0-9]+$/.test(username)) {
      return res.status(400).json({ available: false });
    }
    const result = await authService.checkUsername(username);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
}

// POST /api/diner/auth/send-otp
async function sendOtp(req, res, next) {
  try {
    const { phone, purpose } = req.body;
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];

    let result;
    if (purpose === 'REGISTER') {
      result = await authService.registerSendOtp(phone, ip, userAgent);
    } else {
      result = await authService.loginSendOtp(phone, ip, userAgent);
    }

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// POST /api/diner/auth/verify-otp
async function verifyOtp(req, res, next) {
  try {
    const { phone, otp, purpose, username, email } = req.body;
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];

    let result;
    if (purpose === 'REGISTER') {
      result = await authService.registerVerifyOtp(phone, otp, username, email, ip, userAgent);
      return res.status(201).json(result);
    } else {
      result = await authService.loginVerifyOtp(phone, otp, ip, userAgent);
      return res.status(200).json(result);
    }
  } catch (err) {
    next(err);
  }
}

// POST /api/diner/auth/refresh
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];

    const tokens = await refreshTokens(refreshToken, ip, userAgent);
    res.status(200).json(tokens);
  } catch (err) {
    next(err);
  }
}

// POST /api/diner/auth/logout
async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];

    await authService.logout(refreshToken, req.dinerId, ip, userAgent);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

// PUT /api/diner/profile/email
async function updateEmail(req, res, next) {
  try {
    const { email } = req.body;
    const diner = await authService.updateEmail(req.dinerId, email);
    res.status(200).json({ diner });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendOtp, verifyOtp, refresh, logout, updateEmail, checkUsername };
