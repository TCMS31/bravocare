"use strict";

/**
 * The staffing questions are raw SQL, so the in-memory stubs in tests/http
 * cannot tell a wrong query from a right one. These tests run the real
 * repositories against Postgres loaded with the demo seed.
 *
 * They need TEST_DATABASE_URL pointing at a disposable, migrated database
 * (`npm run test:db` migrates it first). The seed deletes every row, so this
 * is never DATABASE_URL. Without it the tests are skipped.
 */

const test = require("node:test");
const assert = require("node:assert/strict");

const { seed } = require("../../prisma/seed");
const { createPrismaClient } = require("../../src/db/prisma");
const { ShiftRepository } = require("../../src/repositories/shiftRepository");
const { StaffingRepository } = require("../../src/repositories/staffingRepository");
const { ShiftService } = require("../../src/services/shiftService");

const url = process.env.TEST_DATABASE_URL;
const skip = url ? false : "TEST_DATABASE_URL is not set";
const PAGE = { limit: 50, offset: 0 };

let prisma;
let staffing;
let shifts;

test.before(async () => {
  if (skip) return;
  prisma = createPrismaClient(url);
  await seed(prisma);
  staffing = new StaffingRepository(prisma);
  shifts = new ShiftService({ shiftRepository: new ShiftRepository(prisma) });
});

test.after(async () => {
  if (prisma) await prisma.$disconnect();
});

test("q4 counts remaining spots per job, including full ones", { skip }, async () => {
  const rows = await staffing.findOpenPositions(PAGE);
  const remaining = Object.fromEntries(rows.map((row) => [row.job_id, row.remaining_spots]));
  assert.deepEqual(remaining, { 1: 1, 2: 1, 3: 1, 4: 0, 5: 1, 6: 2 });
  assert.equal(await staffing.countJobs(), 6);
});

test("q5 offers only jobs with a free spot that the nurse does not hold", { skip }, async () => {
  const rows = await staffing.findNurseOpportunities(PAGE);
  const byName = Object.fromEntries(
    rows.map((row) => [row.nurse_name, [row.total_remaining_jobs, row.remaining_spots]])
  );
  assert.deepEqual(byName, {
    // RN job 4 is full, so Anne and Tomas are offered job 6 only.
    Anne: [1, 2],
    Marcus: [1, 1],
    // Priya holds the only LPN job. She stays in the list with zero
    // opportunities rather than disappearing from it.
    Priya: [0, 0],
    Tomas: [1, 2],
    Grace: [1, 1],
    Elena: [1, 1],
    Samuel: [2, 3],
  });
});

test("q5 pages nurses inside the query", { skip }, async () => {
  const rows = await staffing.findNurseOpportunities({ limit: 2, offset: 2 });
  assert.deepEqual(
    rows.map((row) => row.nurse_id),
    [3, 4]
  );
});

test("q6 lists Anne's colleagues and excludes Anne", { skip }, async () => {
  const rows = await staffing.findColleaguesOf("Anne");
  assert.deepEqual(
    rows.map((row) => row.nurse_name),
    ["Marcus", "Tomas"]
  );
});

test("q6 returns nothing for an unknown nurse", { skip }, async () => {
  assert.deepEqual(await staffing.findColleaguesOf("Nobody"), []);
});

test("overlap reads TIME columns as wall-clock times", { skip }, async () => {
  assert.deepEqual(await shifts.compareShifts(1, 2), {
    overlap: 15,
    max_threshold: 30,
    exceeds_threshold: false,
    policy: "handover",
  });
  const crossFacility = await shifts.compareShifts(2, 3);
  assert.equal(crossFacility.overlap, 435);
  assert.equal(crossFacility.exceeds_threshold, true);
});

test("the shift list joins the facility name", { skip }, async () => {
  const { shifts: page, total } = await shifts.listShifts({ limit: 2, offset: 0 });
  assert.equal(total, 8);
  assert.deepEqual(
    page.map((row) => [row.shift_id, row.facility.facility_name]),
    [
      [1, "Harborview General"],
      [3, "Riverside Care Center"],
    ]
  );
});
