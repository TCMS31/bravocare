"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createOverlapPolicy,
  registerOverlapPolicy,
  listOverlapPolicies,
} = require("../../src/domain/overlapPolicy");
const { shift } = require("../helpers/fixtures");

test("the handover policy allows overlap only within one facility", () => {
  const policy = createOverlapPolicy("handover", {
    sameFacilityAllowanceMinutes: 30,
    crossFacilityAllowanceMinutes: 0,
  });
  assert.equal(policy.allowanceMinutes(shift({ facility_id: 1 }), shift({ facility_id: 1 })), 30);
  assert.equal(policy.allowanceMinutes(shift({ facility_id: 1 }), shift({ facility_id: 2 })), 0);
});

test("two shifts with no facility are not treated as the same facility", () => {
  const policy = createOverlapPolicy("handover", { sameFacilityAllowanceMinutes: 30 });
  assert.equal(
    policy.allowanceMinutes(shift({ facility_id: null }), shift({ facility_id: null })),
    0
  );
});

test("the allowance is configurable", () => {
  const policy = createOverlapPolicy("handover", {
    sameFacilityAllowanceMinutes: 15,
    crossFacilityAllowanceMinutes: 5,
  });
  assert.equal(policy.allowanceMinutes(shift({ facility_id: 3 }), shift({ facility_id: 3 })), 15);
  assert.equal(policy.allowanceMinutes(shift({ facility_id: 3 }), shift({ facility_id: 4 })), 5);
});

test("the strict policy never allows overlap", () => {
  const policy = createOverlapPolicy("strict");
  assert.equal(policy.allowanceMinutes(shift({ facility_id: 1 }), shift({ facility_id: 1 })), 0);
});

test("an unknown policy name fails loudly and lists what is registered", () => {
  assert.throws(() => createOverlapPolicy("does-not-exist"), /Unknown overlap policy/);
});

test("a new policy can be registered without touching the service", () => {
  registerOverlapPolicy("generous", () => ({
    name: "generous",
    allowanceMinutes: () => 120,
  }));
  assert.ok(listOverlapPolicies().includes("generous"));
  assert.equal(createOverlapPolicy("generous").allowanceMinutes(shift(), shift()), 120);
});

test("registering a non-function factory is rejected", () => {
  assert.throws(() => registerOverlapPolicy("broken", 42), TypeError);
});
