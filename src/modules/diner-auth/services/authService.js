const Diner = require('../models/Diner');
const DinerRefreshToken = require('../models/DinerRefreshToken');
const DinerAuthLog = require('../models/DinerAuthLog');
const { sendOtp, verifyOtp } = require('./otpService');
const { issueTokens } = require('./tokenService');
const { hashSHA256 } = require('../utils/hashUtils');

async function registerSendOtp(phone, ip, userAgent) {
  const existing = await Diner.findOne({ where: { phone } });
  if (existing) {
    const err = new Error('This phone number is already registered. Please log in instead.');
    err.status = 409;
    err.code = 'PHONE_TAKEN';
    throw err;
  }

  const result = await sendOtp(phone, 'REGISTER');

  await DinerAuthLog.create({
    phone,
    event_type: 'OTP_SENT',
    ip_address: ip,
    user_agent: userAgent,
    metadata: { purpose: 'REGISTER' },
  });

  return result;
}

async function loginSendOtp(phone, ip, userAgent) {
  const diner = await Diner.findOne({ where: { phone } });
  if (!diner) {
    const err = new Error('No account found with this phone number. Please register first.');
    err.status = 404;
    err.code = 'DINER_NOT_FOUND';
    throw err;
  }
  if (diner.status !== 'ACTIVE') {
    const err = new Error('Your account has been suspended. Please contact support.');
    err.status = 403;
    err.code = 'ACCOUNT_SUSPENDED';
    throw err;
  }

  const result = await sendOtp(phone, 'LOGIN');

  await DinerAuthLog.create({
    diner_id: diner.id,
    phone,
    event_type: 'OTP_SENT',
    ip_address: ip,
    user_agent: userAgent,
    metadata: { purpose: 'LOGIN' },
  });

  return result;
}

async function registerVerifyOtp(phone, otp, username, email, ip, userAgent) {
  await verifyOtp(phone, otp, 'REGISTER');

  // Re-check in case of race between OTP send and verify
  const existing = await Diner.findOne({ where: { phone } });
  if (existing) {
    const err = new Error('This phone number was just registered. Please log in.');
    err.status = 409;
    err.code = 'PHONE_TAKEN';
    throw err;
  }

  const diner = await Diner.create({ phone, username, email: email || null });
  const tokens = await issueTokens(diner.id, ip, userAgent);

  await DinerAuthLog.create({
    diner_id: diner.id,
    phone,
    event_type: 'REGISTER_SUCCESS',
    ip_address: ip,
    user_agent: userAgent,
  });

  return {
    diner: { id: diner.id, username: diner.username, phone: diner.phone, email: diner.email },
    ...tokens,
  };
}

async function loginVerifyOtp(phone, otp, ip, userAgent) {
  await verifyOtp(phone, otp, 'LOGIN');

  const diner = await Diner.findOne({ where: { phone, status: 'ACTIVE' } });
  if (!diner) {
    const err = new Error('Account not found or suspended. Please contact support.');
    err.status = 403;
    err.code = 'ACCOUNT_UNAVAILABLE';
    throw err;
  }

  const tokens = await issueTokens(diner.id, ip, userAgent);

  await DinerAuthLog.create({
    diner_id: diner.id,
    phone,
    event_type: 'LOGIN_SUCCESS',
    ip_address: ip,
    user_agent: userAgent,
  });

  return {
    diner: { id: diner.id, username: diner.username, phone: diner.phone, email: diner.email },
    ...tokens,
  };
}

async function logout(rawRefreshToken, dinerId, ip, userAgent) {
  if (rawRefreshToken) {
    const tokenHash = hashSHA256(rawRefreshToken);
    await DinerRefreshToken.update(
      { revoked_at: new Date() },
      { where: { token_hash: tokenHash, revoked_at: null } }
    );
  }

  if (dinerId) {
    await DinerAuthLog.create({
      diner_id: dinerId,
      event_type: 'LOGOUT',
      ip_address: ip,
      user_agent: userAgent,
    });
  }
}

async function updateEmail(dinerId, email) {
  const diner = await Diner.findByPk(dinerId);
  if (!diner) {
    const err = new Error('Diner not found.');
    err.status = 404;
    throw err;
  }
  await diner.update({ email: email || null });
  return { id: diner.id, username: diner.username, phone: diner.phone, email: diner.email };
}

async function checkUsername(username) {
  const existing = await Diner.findOne({ where: { username } });
  return { available: !existing };
}

module.exports = { registerSendOtp, loginSendOtp, registerVerifyOtp, loginVerifyOtp, logout, updateEmail, checkUsername };
