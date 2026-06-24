"use strict";

const logger = require("../utils/logger");
const { NotFoundError } = require("../utils/errors");

/**
 * 404 handler — any request that fell through all routes.
 */
function notFound(req, res, next) {
  next(new NotFoundError("Route not found"));
}

/**
 * Central error -> JSON translator. Client errors (<500) surface their message;
 * server errors are masked and logged.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const body = {
    error: status < 500 ? err.message : "Internal Server Error",
  };
  if (err.details) body.details = err.details;
  if (status >= 500) logger.error({ err }, "Unhandled error");
  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
