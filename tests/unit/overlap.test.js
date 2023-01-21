"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  minutesSinceMidnight,
  overlapInMinutes,
  scheduledOverlapInMinutes,
  dateOffsetMinutes,
  toInterval,
} = require("../../src/domain/overlap");
const { shift, time, day } = require("../helpers/fixtures");

test("minutesSinceMidnight reads the UTC wall clock, not the local one", () => {
  // Prisma pins a TIME column to 1970-01-01 UTC. Reading it with local
  // accessors would shift the answer by the machine's timezone offset.
  assert.equal(minutesSinceMidnight(time("00:00")), 0);
  assert.equal(minutesSinceMidnight(time("07:30")), 450);
  assert.equal(minutesSinceMidnight(time("23:59")), 1439);
});

test("minutesSinceMidnight returns null for missing or unparseable values", () => {
  assert.equal(minutesSinceMidnight(null), null);
  assert.equal(minutesSinceMidnight(undefined), null);
  assert.equal(minutesSinceMidnight("not a time"), null);
});

test("toInterval pushes an overnight end time into the next day", () => {
  const night = shift({ start_time: time("22:00"), end_time: time("06:00") });
  assert.deepEqual(toInterval(night), { start: 1320, end: 1800 });
});

test("partially overlapping shifts report the shared minutes", () => {
  const a = shift({ shift_id: 1, start_time: time("07:00"), end_time: time("15:00") });
  const b = shift({ shift_id: 2, start_time: time("14:45"), end_time: time("22:45") });
  assert.equal(overlapInMinutes(a, b), 15);
  // Overlap is symmetric.
  assert.equal(overlapInMinutes(b, a), 15);
});

test("back to back shifts do not overlap", () => {
  const a = shift({ start_time: time("07:00"), end_time: time("15:00") });
  const b = shift({ start_time: time("15:00"), end_time: time("23:00") });
  assert.equal(overlapInMinutes(a, b), 0);
});

test("disjoint shifts do not overlap", () => {
  const a = shift({ start_time: time("07:00"), end_time: time("11:00") });
  const b = shift({ start_time: time("13:00"), end_time: time("17:00") });
  assert.equal(overlapInMinutes(a, b), 0);
});

test("a shift fully inside another overlaps for its whole duration", () => {
  const outer = shift({ start_time: time("06:00"), end_time: time("18:00") });
  const inner = shift({ start_time: time("09:00"), end_time: time("12:00") });
  assert.equal(overlapInMinutes(outer, inner), 180);
});

test("overnight shifts overlap correctly", () => {
  // Without the next-day adjustment both intervals look like end < start and
  // every night shift would report zero overlap.
  const a = shift({ start_time: time("22:00"), end_time: time("06:00") });
  const b = shift({ start_time: time("23:00"), end_time: time("07:00") });
  assert.equal(overlapInMinutes(a, b), 420);
});

test("an overnight shift overlaps the next morning's shift", () => {
  // The night shift ends at 06:00 on 2023-02-07, so it collides with a shift
  // that starts at 05:00 that morning. Comparing only shifts whose shift_date
  // matches - as the original code did - reports no overlap here at all.
  const night = shift({
    shift_date: day("2023-02-06"),
    start_time: time("22:00"),
    end_time: time("06:00"),
  });
  const early = shift({
    shift_date: day("2023-02-07"),
    start_time: time("05:00"),
    end_time: time("13:00"),
  });
  assert.equal(scheduledOverlapInMinutes(night, early), 60);
  assert.equal(scheduledOverlapInMinutes(early, night), 60);
});

test("scheduledOverlapInMinutes matches the time-only result on a shared date", () => {
  const a = shift({ shift_id: 1, start_time: time("07:00"), end_time: time("15:00") });
  const b = shift({ shift_id: 2, start_time: time("14:45"), end_time: time("22:45") });
  assert.equal(scheduledOverlapInMinutes(a, b), overlapInMinutes(a, b));
  assert.equal(scheduledOverlapInMinutes(a, b), 15);
});

test("identical times on different days do not overlap", () => {
  const a = shift({ shift_date: day("2023-02-06") });
  const b = shift({ shift_date: day("2023-02-07") });
  assert.equal(scheduledOverlapInMinutes(a, b), 0);
});

test("shifts a week apart do not overlap", () => {
  const a = shift({ shift_date: day("2023-02-06") });
  const b = shift({ shift_date: day("2023-02-13") });
  assert.equal(scheduledOverlapInMinutes(a, b), 0);
});

test("a missing shift_date yields no overlap rather than a wrong one", () => {
  assert.equal(scheduledOverlapInMinutes(shift({ shift_date: null }), shift()), 0);
});

test("missing times yield no overlap rather than NaN", () => {
  const a = shift({ start_time: null, end_time: null });
  const b = shift();
  assert.equal(overlapInMinutes(a, b), 0);
  assert.equal(toInterval(a), null);
});

test("dateOffsetMinutes measures whole days between shift dates", () => {
  assert.equal(dateOffsetMinutes(day("2023-02-06"), day("2023-02-06")), 0);
  assert.equal(dateOffsetMinutes(day("2023-02-06"), day("2023-02-07")), 1440);
  assert.equal(dateOffsetMinutes(day("2023-02-07"), day("2023-02-06")), -1440);
  assert.equal(dateOffsetMinutes(null, day("2023-02-06")), null);
});
