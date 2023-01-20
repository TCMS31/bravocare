"use strict";

const { AppError } = require("../errors");
const { config } = require("../../config/env");

/** 404 handler for unmatched routes. */
function notFoundHandler(req, res) {
  res.status(404).json({
    status: "error",
    message: `No route matches ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Single place that turns an error into a response.
 *
 * Known errors keep their status and message. Anything else becomes a 500 with
 * a generic message: the original code returned `err.message` for every
 * failure, which leaked Prisma and Node internals (and, with them, column names
 * and query shapes) to any caller who could trigger a crash.
 */
// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity.
function errorHandler(err, req, res, next) {
  // express.json() rejects malformed or oversized bodies before any handler runs.
  if (err && (err.type === "entity.parse.failed" || err.type === "entity.too.large")) {
    return res.status(400).json({ status: "error", message: "Request body could not be parsed" });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      status: "error",
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // eslint-disable-next-line no-console -- the process log is the only sink here.
  console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
    ...(config.nodeEnv === "development" ? { debug: String(err && err.message) } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler };
