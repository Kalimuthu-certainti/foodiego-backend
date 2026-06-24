"use strict";

const logger = require("./logger");

/**
 * Admin approval queue — FUTURE INTEGRATION SEAM.
 *
 * While REQUIRE_ADMIN_APPROVAL=false this is a no-op stub. When approval is
 * turned on later, `notify` will publish to the real Admin service so it can
 * approve/reject brands. The signature stays the same so no caller changes.
 */

async function notify(topic, entityId, payload = null) {
  logger.info({ topic, entityId, payload }, "adminQueue.notify (stub) — no-op this phase");
  return { stub: true };
}

module.exports = { notify };
