"use strict";

require("dotenv").config();

/** Read an integer env var, falling back to `fallback` when unset or unparseable. */
function intFromEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be an integer, got "${raw}"`);
  }
  return parsed;
}

const config = {
  port: intFromEnv("PORT", 3000),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  corsOrigin: process.env.CORS_ORIGIN || "*",
  logFormat: process.env.LOG_FORMAT || "dev",

  /**
   * How many minutes two shifts are allowed to overlap.
   *
   * Two shifts at the same facility may overlap by a short handover window;
   * two shifts at different facilities may not overlap at all, because a nurse
   * cannot be in two buildings at once.
   */
  sameFacilityOverlapAllowanceMinutes: intFromEnv("SAME_FACILITY_OVERLAP_ALLOWANCE_MINUTES", 30),
  crossFacilityOverlapAllowanceMinutes: intFromEnv("CROSS_FACILITY_OVERLAP_ALLOWANCE_MINUTES", 0),

  /** Upper bound on `limit` for list endpoints, so one request cannot read the whole table. */
  maxPageSize: intFromEnv("MAX_PAGE_SIZE", 200),
  defaultPageSize: intFromEnv("DEFAULT_PAGE_SIZE", 50),
};

module.exports = { config, intFromEnv };
