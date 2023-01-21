"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { ShiftService } = require("../../src/services/shiftService");
const { createOverlapPolicy } = require("../../src/domain/overlapPolicy");
const { shift, time, day, stubShiftRepository } = require("../helpers/fixtures");

const SHIFTS = [
  // Same facility, 15 minutes of overlap.
  shift({ shift_id: 1, facility_id: 1, start_time: time("07:00"), end_time: time("15:00") }),
  shift({ shift_id: 2, facility_id: 1, start_time: time("14:45"), end_time: time("22:45") }),
  // Different facility, 60 minutes of overlap.
  shift({ shift_id: 3, facility_id: 2, start_time: time("14:00"), end_time: time("22:00") }),
  // Same times as shift 1 but on the next day.
  shift({
    shift_id: 4,
    facility_id: 2,
    shift_date: day("2023-02-07"),
    start_time: time("07:00"),
    end_time: time("15:00"),
  }),
  // Same facility, one hour of overlap - past the 30 minute handover window.
  shift({ shift_id: 5, facility_id: 1, start_time: time("14:00"), end_time: time("22:00") }),
];

const buildService = (shifts = SHIFTS) =>
  new ShiftService({ shiftRepository: stubShiftRepository(shifts) });

test("a short same-facility overlap stays within the handover allowance", async () => {
  const result = await buildService().compareShifts(1, 2);
  assert.deepEqual(result, {
    overlap: 15,
    max_threshold: 30,
    exceeds_threshold: false,
    policy: "handover",
  });
});

test("a long same-facility overlap breaches the handover allowance", async () => {
  const result = await buildService().compareShifts(1, 5);
  assert.equal(result.overlap, 60);
  assert.equal(result.max_threshold, 30);
  assert.equal(result.exceeds_threshold, true);
});

test("any overlap across facilities is a conflict", async () => {
  const result = await buildService().compareShifts(1, 3);
  assert.equal(result.overlap, 60);
  assert.equal(result.max_threshold, 0);
  assert.equal(result.exceeds_threshold, true);
});

test("shifts on different dates never overlap", async () => {
  const result = await buildService().compareShifts(1, 4);
  assert.equal(result.overlap, 0);
  assert.equal(result.exceeds_threshold, false);
});

test("comparing a shift with itself is a 400, not a full-length overlap", async () => {
  // The original endpoint answered 480 minutes here and flagged a conflict.
  await assert.rejects(
    () => buildService().compareShifts(1, 1),
    (err) => err.status === 400
  );
});

test("an unknown shift id is a 404 naming the missing ids", async () => {
  // The original endpoint dereferenced null and returned a 500 carrying a
  // JavaScript TypeError message.
  await assert.rejects(
    () => buildService().compareShifts(1, 999),
    (err) => err.status === 404 && err.details.missing_shift_ids.includes(999)
  );
});

test("both shifts are fetched in a single query", async () => {
  const repository = stubShiftRepository(SHIFTS);
  await new ShiftService({ shiftRepository: repository }).compareShifts(1, 2);
  const findCalls = repository.calls.filter(([name]) => name === "findByIds");
  assert.equal(findCalls.length, 1);
  assert.deepEqual(findCalls[0][1], [1, 2]);
});

test("an injected policy replaces the default rules", async () => {
  const service = new ShiftService({
    shiftRepository: stubShiftRepository(SHIFTS),
    overlapPolicy: createOverlapPolicy("strict"),
  });
  const result = await service.compareShifts(1, 2);
  assert.equal(result.policy, "strict");
  assert.equal(result.max_threshold, 0);
  assert.equal(result.exceeds_threshold, true);
});

test("listShifts returns a page plus the total row count", async () => {
  const result = await buildService().listShifts({ limit: 2, offset: 1 });
  assert.equal(result.total, SHIFTS.length);
  assert.equal(result.shifts.length, 2);
  assert.deepEqual(
    result.shifts.map((row) => row.shift_id),
    [2, 3]
  );
});
