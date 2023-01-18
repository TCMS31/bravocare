"use strict";

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const { config } = require("../config/env");

/**
 * Build a client that talks to Postgres through the `pg` driver adapter, which
 * Prisma 7 requires in place of its old bundled query engine.
 *
 * @param {string|undefined} connectionString
 */
function createPrismaClient(connectionString) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

/**
 * One PrismaClient for the whole process.
 *
 * Each client owns its own connection pool, so constructing one per request or
 * per module would exhaust Postgres connections under any real load.
 */
const prisma = createPrismaClient(config.databaseUrl);

module.exports = { prisma, createPrismaClient };
