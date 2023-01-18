"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { parseId, parsePagination, parseNurseName } = require("../../src/http/validation");
const { config } = require("../../src/config/env");

test("parseId accepts numbers and numeric strings", () => {
  assert.equal(parseId(7, "shift1"), 7);
  assert.equal(parseId("7", "shift1"), 7);
});

test("parseId rejects anything that is not a positive integer", () => {
  for (const bad of [undefined, null, "", "abc", 0, -1, 1.5, {}, []]) {
    assert.throws(
      () => parseId(bad, "shift1"),
      (err) => err.status === 400,
      `expected ${JSON.stringify(bad)} to be rejected`
    );
  }
});

test("parsePagination falls back to the configured defaults", () => {
  assert.deepEqual(parsePagination({}), { limit: config.defaultPageSize, offset: 0 });
});

test("parsePagination clamps limit to the configured maximum", () => {
  const { limit } = parsePagination({ limit: String(config.maxPageSize + 5000) });
  assert.equal(limit, config.maxPageSize);
});

test("parsePagination rejects nonsense", () => {
  assert.throws(
    () => parsePagination({ limit: "0" }),
    (err) => err.status === 400
  );
  assert.throws(
    () => parsePagination({ limit: "abc" }),
    (err) => err.status === 400
  );
  assert.throws(
    () => parsePagination({ offset: "-1" }),
    (err) => err.status === 400
  );
});

test("parseNurseName trims, falls back and rejects bad input", () => {
  assert.equal(parseNurseName(undefined, "Anne"), "Anne");
  assert.equal(parseNurseName("  Priya  ", "Anne"), "Priya");
  assert.throws(
    () => parseNurseName(42, "Anne"),
    (err) => err.status === 400
  );
  assert.throws(
    () => parseNurseName("x".repeat(256), "Anne"),
    (err) => err.status === 400
  );
});
