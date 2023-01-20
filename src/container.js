"use strict";

const { ShiftRepository } = require("./repositories/shiftRepository");
const { StaffingRepository } = require("./repositories/staffingRepository");
const { ShiftService } = require("./services/shiftService");
const { StaffingService } = require("./services/staffingService");

/**
 * Wire the real, database-backed object graph.
 *
 * This is the only place that knows every layer at once; everything else
 * receives its collaborators through its constructor.
 */
function createContainer() {
  const shiftRepository = new ShiftRepository();
  const staffingRepository = new StaffingRepository();
  return {
    shiftService: new ShiftService({ shiftRepository }),
    staffingService: new StaffingService({ staffingRepository }),
  };
}

module.exports = { createContainer };
