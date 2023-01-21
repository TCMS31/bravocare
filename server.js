"use strict";

const { config } = require("./src/config/env");
const { createApp } = require("./src/app");
const { createContainer } = require("./src/container");
const { prisma } = require("./src/db/prisma");

const app = createApp(createContainer());

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console -- startup banner.
  console.log(`bravocare API listening on port ${config.port}`);
});

/** Close the HTTP server and the database pool before exiting. */
function shutdown(signal) {
  // eslint-disable-next-line no-console -- shutdown banner.
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    prisma.$disconnect().finally(() => process.exit(0));
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
