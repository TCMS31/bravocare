"use strict";

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const { config } = require("./config/env");
const { createApiRouter } = require("./http/routes");
const { notFoundHandler, errorHandler } = require("./http/middleware/errorHandler");

/**
 * Build the Express application.
 *
 * Dependencies are passed in rather than imported here, so the HTTP tests can
 * hand in stub repositories and run without a database.
 *
 * @param {object} deps
 * @param {import("./services/shiftService").ShiftService} deps.shiftService
 * @param {import("./services/staffingService").StaffingService} deps.staffingService
 * @returns {import("express").Express}
 */
function createApp(deps) {
  const app = express();

  if (config.nodeEnv !== "test") {
    app.use(morgan(config.logFormat));
  }
  app.use(express.json({ limit: "100kb" }));
  app.use(cors({ origin: config.corsOrigin }));

  app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
  app.use("/api/v1", createApiRouter(deps));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
