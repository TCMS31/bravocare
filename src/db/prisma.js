"use strict";

const { PrismaClient } = require("@prisma/client");

/**
 * One PrismaClient for the whole process.
 *
 * Each client owns its own connection pool, so constructing one per request or
 * per module would exhaust Postgres connections under any real load.
 */
const prisma = new PrismaClient();

module.exports = { prisma };
