const { randomBytes } = require('crypto');
const { Op } = require('sequelize');
const DinerRefreshToken = require('../models/DinerRefreshToken');
const DinerAuthLog = require('../models/DinerAuthLog');
const { signAccessToken, verifyAccessToken, REFRESH_EXPIRY } = require('../../../config/jwt');
const { hashSHA256 } = require('../utils/hashUtils');

function parseExpiryMs(expiry) {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * (multipliers[unit] ?? 86_400_000);
}

async function issueTokens(dinerId, ip, userAgent) {
  const accessToken = signAccessToken({ sub: dinerId, role: 'diner' });

  const rawRefreshToken = randomBytes(40).toString('hex');
  const tokenHash = hashSHA256(rawRefreshToken);
  const expiresAt = new Date(Date.now() + parseExpiryMs(REFRESH_EXPIRY));

  await DinerRefreshToken.create({
    diner_id: dinerId,
    token_hash: tokenHash,
    device_info: userAgent?.slice(0, 500) ?? null,
    ip_address: ip ?? null,
    expires_at: expiresAt,
  });

  return { accessToken, refreshToken: rawRefreshToken };
}

async function refreshTokens(rawRefreshToken, ip, userAgent) {
  const tokenHash = hashSHA256(rawRefreshToken);

  const record = await DinerRefreshToken.findOne({
    where: {
      token_hash: tokenHash,
      revoked_at: null,
      expires_at: { [Op.gt]: new Date() },
    },
  });

  if (!record) {
    // Detect token reuse (token exists but already revoked)
    const reused = await DinerRefreshToken.findOne({ where: { token_hash: tokenHash } });
    if (reused) {
      // Revoke all tokens for this diner — potential compromise
      await DinerRefreshToken.update(
        { revoked_at: new Date() },
        { where: { diner_id: reused.diner_id, revoked_at: null } }
      );
      await DinerAuthLog.create({
        diner_id: reused.diner_id,
        event_type: 'TOKEN_REUSE_DETECTED',
        ip_address: ip,
        user_agent: userAgent,
      });
    }
    const err = new Error('Invalid or expired session. Please log in again.');
    err.status = 401;
    err.code = 'REFRESH_TOKEN_INVALID';
    throw err;
  }

  // Rotate: revoke old, issue new
  await record.update({ revoked_at: new Date() });
  const tokens = await issueTokens(record.diner_id, ip, userAgent);

  await DinerAuthLog.create({
    diner_id: record.diner_id,
    event_type: 'TOKEN_REFRESH',
    ip_address: ip,
    user_agent: userAgent,
  });

  return tokens;
}

module.exports = { issueTokens, refreshTokens };
