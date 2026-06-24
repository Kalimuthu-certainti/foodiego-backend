"use strict";

const { ValidationError } = require("../utils/errors");

/**
 * validate(schema, property="body") -> middleware that runs a Joi schema
 * against req[property]. On failure -> 400 with the list of messages.
 * On success the sanitized (stripped/coerced) value replaces req[property].
 */
function validate(schema, property = "body") {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return next(
        new ValidationError(
          "Validation failed",
          error.details.map((d) => d.message)
        )
      );
    }
    req[property] = value;
    return next();
  };
}

module.exports = validate;
