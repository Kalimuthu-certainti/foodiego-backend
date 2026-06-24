"use strict";

const crypto = require("crypto");
const { store } = require("../config/database");

/**
 * Append-only audit trail. Every mutating endpoint records an entry here.
 * Backed by the in-memory store now; maps 1:1 to the audit_log table later.
 */

function log(actorId, action, entity, entityId = null, payload = null) {
  const entry = {
    id: crypto.randomUUID(),
    actor_id: actorId,
    action,
    entity,
    entity_id: entityId,
    payload,
    created_at: new Date().toISOString(),
  };
  store.auditLogs.push(entry);
  return entry;
}

/**
 * Return audit entries matching every key in `filter` (used by tests).
 * An empty/omitted filter returns the full log.
 */
function find(filter = {}) {
  const keys = Object.keys(filter);
  if (keys.length === 0) return store.auditLogs.slice();
  return store.auditLogs.filter((entry) =>
    keys.every((k) => entry[k] === filter[k])
  );
}

module.exports = { log, find };
