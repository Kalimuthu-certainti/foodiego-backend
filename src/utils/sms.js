"use strict";

const logger = require("./logger");
const { config } = require("../config");

/**
 * MSG91 SMS client. When no API key is configured the client is a no-op stub
 * that just logs — keeps invites working end-to-end in dev/test without
 * hitting a real gateway.
 */

async function send(phone, message) {
  if (!config.msg91.apiKey) {
    logger.info({ phone, message, sender: config.msg91.sender }, "SMS (stubbed) — no MSG91_API_KEY");
    return { stubbed: true, phone, message };
  }
  // Real MSG91 HTTP call wired here later. Stubbed for this phase.
  logger.info({ phone, sender: config.msg91.sender }, "SMS dispatched via MSG91");
  return { stubbed: false, phone, message };
}

async function sendInvite(phone, { brandName, role }) {
  const message = `You have been invited to ${brandName} on FoodieGo as ${role}.`;
  return send(phone, message);
}

module.exports = { send, sendInvite };
