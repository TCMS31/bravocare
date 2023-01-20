"use strict";

/** An error carrying the HTTP status the client should see. */
class AppError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   * @param {object} [details]
   */
  constructor(status, message, details) {
    super(message);
    this.name = "AppError";
    this.status = status;
    if (details) this.details = details;
  }
}

/** 400 - the request itself is malformed. */
const badRequest = (message, details) => new AppError(400, message, details);
/** 404 - the request is well formed but names something that does not exist. */
const notFound = (message, details) => new AppError(404, message, details);

module.exports = { AppError, badRequest, notFound };
