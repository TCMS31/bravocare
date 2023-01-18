"use strict";

// Prisma 7 no longer reads .env on its own.
require("dotenv").config({ quiet: true });

const { defineConfig } = require("prisma/config");

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  // Read directly rather than through env(): `prisma generate` runs during the
  // Docker build, where no database URL exists, and does not need one.
  datasource: { url: process.env.DATABASE_URL },
});
