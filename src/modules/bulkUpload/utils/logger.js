"use strict";

// Lightweight console logger for the bulk-upload module — same interface the
// module used before (info/warn/error/debug) but without winston or log-file
// writes (those need a logs/ dir and fail on Render's ephemeral filesystem).
const ts = () => new Date().toISOString();

const logger = {
  info: (...args) => console.log(`${ts()} [info] [bulkUpload]`, ...args),
  warn: (...args) => console.warn(`${ts()} [warn] [bulkUpload]`, ...args),
  error: (...args) => console.error(`${ts()} [error] [bulkUpload]`, ...args),
  debug: (...args) => console.debug(`${ts()} [debug] [bulkUpload]`, ...args),
};

module.exports = logger;
