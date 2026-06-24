"use strict";

/**
 * Typed application errors. Anything with status < 500 is "expose"-able, meaning
 * the errorHandler may surface its message to the client; 500s are masked.
 */

class AppError extends Error {
  constructor(message, status = 500, details = undefined) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
    this.expose = status < 500;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = "Validation failed", details = undefined) {
    super(message, 400, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details = undefined) {
    super(message, 401, details);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details = undefined) {
    super(message, 403, details);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Not found", details = undefined) {
    super(message, 404, details);
  }
}

class ConflictError extends AppError {
  constructor(message = "Conflict", details = undefined) {
    super(message, 409, details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};
