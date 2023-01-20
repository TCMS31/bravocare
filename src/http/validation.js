"use strict";

const { badRequest } = require("./errors");
const { config } = require("../config/env");

/**
 * Parse a value that must be a positive integer id.
 *
 * Accepts a number or a numeric string: a JSON body sends `1`, a query string
 * sends `"1"`, and both should work. Anything else is a 400, not a crash deep
 * inside Prisma.
 *
 * @param {unknown} value
 * @param {string} field
 * @returns {number}
 */
function parseId(value, field) {
  if (value === undefined || value === null || value === "") {
    throw badRequest(`${field} is required`);
  }
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw badRequest(`${field} must be a positive integer`);
  }
  return parsed;
}

/**
 * Parse `limit` and `offset` from a query string, clamped so one request cannot
 * ask for the entire table.
 *
 * @param {Record<string, unknown>} query
 * @returns {{limit: number, offset: number}}
 */
function parsePagination(query = {}) {
  const limit =
    query.limit === undefined || query.limit === "" ? config.defaultPageSize : Number(query.limit);
  const offset = query.offset === undefined || query.offset === "" ? 0 : Number(query.offset);

  if (!Number.isInteger(limit) || limit < 1) {
    throw badRequest("limit must be a positive integer");
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw badRequest("offset must be a non-negative integer");
  }

  return { limit: Math.min(limit, config.maxPageSize), offset };
}

/**
 * Parse a nurse name from a query string.
 *
 * @param {unknown} value
 * @param {string} fallback
 * @returns {string}
 */
function parseNurseName(value, fallback) {
  if (value === undefined || value === "") return fallback;
  if (typeof value !== "string") {
    throw badRequest("nurse must be a string");
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 255) {
    throw badRequest("nurse must be between 1 and 255 characters");
  }
  return trimmed;
}

module.exports = { parseId, parsePagination, parseNurseName };
