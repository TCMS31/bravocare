"use strict";

const { asyncHandler } = require("../middleware/asyncHandler");
const { parseId, parsePagination } = require("../validation");

/**
 * Controllers only translate between HTTP and the service layer: parse the
 * request, call one service method, shape the response. No business rules and
 * no database access live here.
 *
 * @param {{shiftService: import("../../services/shiftService").ShiftService}} deps
 */
function createShiftController({ shiftService }) {
  return {
    list: asyncHandler(async (req, res) => {
      const { limit, offset } = parsePagination(req.query);
      const { shifts, total } = await shiftService.listShifts({ limit, offset });
      res.status(200).json({
        status: "success",
        meta: { total, limit, offset, returned: shifts.length },
        data: { question_one_shifts: shifts },
      });
    }),

    compare: asyncHandler(async (req, res) => {
      const body = req.body || {};
      const shift1 = parseId(body.shift1, "shift1");
      const shift2 = parseId(body.shift2, "shift2");
      const result = await shiftService.compareShifts(shift1, shift2);
      res.status(200).json({ status: "success", data: result });
    }),
  };
}

module.exports = { createShiftController };
