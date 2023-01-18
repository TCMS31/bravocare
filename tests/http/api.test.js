"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createApp } = require("../../src/app");
const { ShiftService } = require("../../src/services/shiftService");
const { StaffingService } = require("../../src/services/staffingService");
const { shift, time, stubShiftRepository, stubStaffingRepository } = require("../helpers/fixtures");

const SHIFTS = [
  shift({ shift_id: 1, facility_id: 1, start_time: time("07:00"), end_time: time("15:00") }),
  shift({ shift_id: 2, facility_id: 1, start_time: time("14:45"), end_time: time("22:45") }),
  shift({ shift_id: 3, facility_id: 2, start_time: time("14:00"), end_time: time("22:00") }),
];

const STAFFING_ROWS = {
  openPositions: [
    {
      job_id: 1,
      facility_id: 1,
      facility_name: "Harborview General",
      nurse_type_needed: "RN",
      total_number_nurses_needed: 3,
      remaining_spots: 1,
    },
  ],
  nurseOpportunities: [
    {
      nurse_id: 1,
      nurse_name: "Anne",
      nurse_type: "RN",
      total_remaining_jobs: 2,
      remaining_spots: 2,
    },
  ],
  colleagues: [{ nurse_id: 2, nurse_name: "Marcus", nurse_type: "CNA" }],
};

/**
 * Build the app over in-memory repositories.
 *
 * Nothing here touches Postgres or the network, so the suite runs on a bare
 * clone with no services started.
 */
function buildApp({ shifts = SHIFTS, staffingRows = STAFFING_ROWS, staffingRepository } = {}) {
  const repository = staffingRepository || stubStaffingRepository(staffingRows);
  return {
    app: createApp({
      shiftService: new ShiftService({ shiftRepository: stubShiftRepository(shifts) }),
      staffingService: new StaffingService({ staffingRepository: repository }),
    }),
    staffingRepository: repository,
  };
}

test("GET /health reports ok", async () => {
  const { app } = buildApp();
  const res = await request(app).get("/health").expect(200);
  assert.deepEqual(res.body, { status: "ok" });
});

test("GET /api/v1/question_one_shifts returns shifts with pagination metadata", async () => {
  const { app } = buildApp();
  const res = await request(app).get("/api/v1/question_one_shifts").expect(200);
  assert.equal(res.body.status, "success");
  assert.equal(res.body.meta.total, 3);
  assert.equal(res.body.meta.returned, 3);
  assert.equal(res.body.data.question_one_shifts.length, 3);
});

test("GET /api/v1/question_one_shifts honours limit and offset", async () => {
  const { app } = buildApp();
  const res = await request(app)
    .get("/api/v1/question_one_shifts")
    .query({ limit: 1, offset: 2 })
    .expect(200);
  assert.equal(res.body.meta.returned, 1);
  assert.equal(res.body.data.question_one_shifts[0].shift_id, 3);
});

test("GET /api/v1/question_one_shifts rejects a bad limit with 400", async () => {
  const { app } = buildApp();
  const res = await request(app)
    .get("/api/v1/question_one_shifts")
    .query({ limit: "abc" })
    .expect(400);
  assert.match(res.body.message, /limit/);
});

test("POST /api/v1/overlap reports a same-facility overlap inside the allowance", async () => {
  const { app } = buildApp();
  const res = await request(app).post("/api/v1/overlap").send({ shift1: 1, shift2: 2 }).expect(200);
  assert.deepEqual(res.body.data, {
    overlap: 15,
    max_threshold: 30,
    exceeds_threshold: false,
    policy: "handover",
  });
});

test("POST /api/v1/overlap flags a cross-facility overlap", async () => {
  const { app } = buildApp();
  const res = await request(app).post("/api/v1/overlap").send({ shift1: 1, shift2: 3 }).expect(200);
  assert.equal(res.body.data.exceeds_threshold, true);
});

test("POST /api/v1/overlap answers 400 for a missing body", async () => {
  const { app } = buildApp();
  const res = await request(app).post("/api/v1/overlap").send({}).expect(400);
  assert.match(res.body.message, /shift1 is required/);
});

test("POST /api/v1/overlap answers 400 for a non-numeric id", async () => {
  const { app } = buildApp();
  await request(app).post("/api/v1/overlap").send({ shift1: "abc", shift2: 2 }).expect(400);
});

test("POST /api/v1/overlap answers 404 for an unknown shift", async () => {
  const { app } = buildApp();
  const res = await request(app)
    .post("/api/v1/overlap")
    .send({ shift1: 1, shift2: 999 })
    .expect(404);
  assert.deepEqual(res.body.details.missing_shift_ids, [999]);
});

test("POST /api/v1/overlap answers 400 for malformed JSON", async () => {
  const { app } = buildApp();
  await request(app)
    .post("/api/v1/overlap")
    .set("Content-Type", "application/json")
    .send("{not json")
    .expect(400);
});

test("GET /api/v1/q4 returns open positions with numeric counts", async () => {
  const { app } = buildApp();
  const res = await request(app).get("/api/v1/q4").expect(200);
  assert.equal(typeof res.body.result[0].remaining_spots, "number");
  assert.equal(res.body.meta.total, 1);
});

test("GET /api/v1/q4 pushes the page bounds down into the query", async () => {
  const { app, staffingRepository } = buildApp();
  await request(app).get("/api/v1/q4").query({ limit: 10, offset: 5 }).expect(200);
  const call = staffingRepository.calls.find(([name]) => name === "findOpenPositions");
  assert.deepEqual(call[1], { limit: 10, offset: 5 });
});

test("GET /api/v1/q5 returns nurse opportunities with numeric counts", async () => {
  const { app } = buildApp();
  const res = await request(app).get("/api/v1/q5").expect(200);
  // Postgres returns count()/sum() as bigint; both are cast to int in SQL so
  // they do not reach the client as strings.
  assert.equal(typeof res.body.result[0].total_remaining_jobs, "number");
  assert.equal(typeof res.body.result[0].remaining_spots, "number");
});

test("GET /api/v1/q5 pages the nurses inside the query, not afterwards", async () => {
  // The join pairs every nurse with every job of their type, so the page has
  // to bound the query itself. See docs/benchmarks.md.
  const { app, staffingRepository } = buildApp();
  await request(app).get("/api/v1/q5").query({ limit: 25, offset: 50 }).expect(200);
  const call = staffingRepository.calls.find(([name]) => name === "findNurseOpportunities");
  assert.deepEqual(call[1], { limit: 25, offset: 50 });
});

test("GET /api/v1/q5 clamps an oversized limit rather than honouring it", async () => {
  const { app, staffingRepository } = buildApp();
  await request(app).get("/api/v1/q5").query({ limit: 100000 }).expect(200);
  const call = staffingRepository.calls.find(([name]) => name === "findNurseOpportunities");
  assert.equal(call[1].limit, 200);
});

test("GET /api/v1/q6 defaults to Anne", async () => {
  const { app, staffingRepository } = buildApp();
  const res = await request(app).get("/api/v1/q6").expect(200);
  assert.equal(res.body.nurse, "Anne");
  assert.deepEqual(staffingRepository.calls.at(-1), ["findColleaguesOf", "Anne"]);
});

test("GET /api/v1/q6 accepts a nurse name", async () => {
  const { app, staffingRepository } = buildApp();
  const res = await request(app).get("/api/v1/q6").query({ nurse: " Priya " }).expect(200);
  assert.equal(res.body.nurse, "Priya");
  assert.deepEqual(staffingRepository.calls.at(-1), ["findColleaguesOf", "Priya"]);
});

test("an unmatched route answers 404 rather than hanging", async () => {
  const { app } = buildApp();
  const res = await request(app).get("/api/v1/nope").expect(404);
  assert.match(res.body.message, /No route matches/);
});

test("an unexpected repository failure becomes a 500 without leaking internals", async () => {
  const exploding = stubStaffingRepository();
  exploding.findOpenPositions = async () => {
    throw new Error('relation "jobs" does not exist at character 219');
  };
  const { app } = buildApp({ staffingRepository: exploding });
  const res = await request(app).get("/api/v1/q4").expect(500);
  assert.equal(res.body.message, "Internal server error");
  assert.equal(JSON.stringify(res.body).includes("character 219"), false);
});
