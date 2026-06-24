const { randomInt } = require('crypto');
const { Op } = require('sequelize');
const OtpVerification = require('../models/OtpVerification');
const { hashSHA256 } = require('../utils/hashUtils');
const { sendSms } = require('../utils/twilioUtils');

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function generateOtp() {
  return String(randomInt(100000, 1000000)).padStart(6, '0');
}

async function sendOtp(phone, purpose) {
  // Invalidate any active OTPs for this phone+purpose before issuing a new one
  await OtpVerification.update(
    { used_at: new Date() },
    {
      where: {
        phone,
        purpose,
        used_at: null,
        expires_at: { [Op.gt]: new Date() },
      },
    }
  );

  const otp = generateOtp();
  const otp_hash = hashSHA256(otp);
  const expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await OtpVerification.create({ phone, otp_hash, purpose, expires_at });

  const message = `Your FoodieGo OTP is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share it with anyone.`;

  const twilioConfigured = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER;
  if (twilioConfigured) {
    await sendSms(phone, message);
    return { message: `OTP sent to +91${phone}`, expiresIn: OTP_EXPIRY_MINUTES * 60 };
  } else {
    console.log(`\n[DEV MODE] OTP for +91${phone} (${purpose}): ${otp}\n`);
    return { message: `OTP sent to +91${phone}`, expiresIn: OTP_EXPIRY_MINUTES * 60, devOtp: otp };
  }
}

async function verifyOtp(phone, otp, purpose) {
  const record = await OtpVerification.findOne({
    where: {
      phone,
      purpose,
      used_at: null,
      expires_at: { [Op.gt]: new Date() },
    },
    order: [['created_at', 'DESC']],
  });

  if (!record) {
    const err = new Error('OTP expired or not found. Please request a new one.');
    err.status = 400;
    err.code = 'OTP_NOT_FOUND';
    throw err;
  }

  if (record.attempt_count >= MAX_ATTEMPTS) {
    const err = new Error('Too many failed attempts. Please request a new OTP.');
    err.status = 429;
    err.code = 'OTP_MAX_ATTEMPTS';
    throw err;
  }

  const inputHash = hashSHA256(otp);
  if (inputHash !== record.otp_hash) {
    await record.increment('attempt_count');
    const remaining = MAX_ATTEMPTS - record.attempt_count - 1;
    const err = new Error(
      `Incorrect OTP. ${remaining > 0 ? `${remaining} attempt${remaining === 1 ? '' : 's'} remaining attemps.` : 'No attempts remaining. Please request a new OTP.'}`
    );
    err.status = 400;
    err.code = 'OTP_INVALID';
    throw err;
  }

  await record.update({ used_at: new Date() });
}

module.exports = { sendOtp, verifyOtp };
