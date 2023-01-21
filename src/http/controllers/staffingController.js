"use strict";

const { asyncHandler } = require("../middleware/asyncHandler");
const { parseNurseName, parsePagination } = require("../validation");

/** The nurse the brief's question six asks about, when the caller names nobody. */
const DEFAULT_NURSE_NAME = "Anne";

/**
 * @param {{staffingService: import("../../services/staffingService").StaffingService}} deps
 */
function createStaffingController({ staffingService }) {
  return {
    openPositions: asyncHandler(async (req, res) => {
      const page = parsePagination(req.query);
      const { rows, total, limit, offset } = await staffingService.listOpenPositions(page);
      res.status(200).json({
        meta: { total, limit, offset, returned: rows.length },
        result: rows,
      });
    }),

    nurseOpportunities: asyncHandler(async (req, res) => {
      const page = parsePagination(req.query);
      const { rows, total, limit, offset } = await staffingService.listNurseOpportunities(page);
      res.status(200).json({
        meta: { total, limit, offset, returned: rows.length },
        result: rows,
      });
    }),

    colleagues: asyncHandler(async (req, res) => {
      const nurseName = parseNurseName(req.query.nurse, DEFAULT_NURSE_NAME);
      const result = await staffingService.listColleaguesOf(nurseName);
      res.status(200).json({ nurse: nurseName, result });
    }),
  };
}

module.exports = { createStaffingController, DEFAULT_NURSE_NAME };
