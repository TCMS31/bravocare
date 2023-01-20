"use strict";

/**
 * Wrap an async route handler so a rejected promise reaches the error
 * middleware instead of hanging the request.
 *
 * Express 4 does not await handlers, which is why the original code needed a
 * try/catch in every route.
 *
 * @param {(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<unknown>} handler
 */
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

module.exports = { asyncHandler };
