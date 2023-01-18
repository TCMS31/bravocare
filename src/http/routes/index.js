"use strict";

const { Router } = require("express");

const { createShiftController } = require("../controllers/shiftController");
const { createStaffingController } = require("../controllers/staffingController");

/**
 * The v1 API.
 *
 * The paths are named after the questions in the original brief rather than
 * after REST resources. That is deliberate: the brief numbers its questions,
 * and a reviewer should be able to map a question to a route at a glance.
 *
 *   GET  /question_one_shifts  question 1 - the shifts to compare
 *   POST /overlap              question 1 - do two shifts overlap too much?
 *   GET  /q4                   question 4 - open positions per job
 *   GET  /q5                   question 5 - jobs each nurse could still take
 *   GET  /q6                   question 6 - nurses sharing a facility with Anne
 *
 * @param {object} deps
 */
function createApiRouter(deps) {
  const router = Router();
  const shifts = createShiftController(deps);
  const staffing = createStaffingController(deps);

  router.get("/question_one_shifts", shifts.list);
  router.post("/overlap", shifts.compare);
  router.get("/q4", staffing.openPositions);
  router.get("/q5", staffing.nurseOpportunities);
  router.get("/q6", staffing.colleagues);

  return router;
}

module.exports = { createApiRouter };
