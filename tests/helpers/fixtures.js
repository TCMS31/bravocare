"use strict";

/** Build a Postgres-shaped `time` value from "HH:MM". */
const time = (hhmm) => new Date(`1970-01-01T${hhmm}:00.000Z`);
/** Build a Postgres-shaped `date` value from "YYYY-MM-DD". */
const day = (iso) => new Date(`${iso}T00:00:00.000Z`);

/**
 * Build a shift row shaped exactly as Prisma returns it.
 *
 * @param {object} overrides
 */
function shift(overrides = {}) {
  return {
    shift_id: 1,
    facility_id: 1,
    shift_date: day("2023-02-06"),
    start_time: time("07:00"),
    end_time: time("15:00"),
    ...overrides,
  };
}

/**
 * An in-memory stand-in for ShiftRepository.
 *
 * @param {object[]} shifts
 */
function stubShiftRepository(shifts = []) {
  return {
    calls: [],
    async listShifts(page) {
      this.calls.push(["listShifts", page]);
      return shifts.slice(page.offset, page.offset + page.limit);
    },
    async countShifts() {
      this.calls.push(["countShifts"]);
      return shifts.length;
    },
    async findByIds(ids) {
      this.calls.push(["findByIds", ids]);
      return shifts.filter((row) => ids.includes(row.shift_id));
    },
  };
}

/**
 * An in-memory stand-in for StaffingRepository.
 *
 * @param {object} rows
 */
function stubStaffingRepository(rows = {}) {
  return {
    calls: [],
    async findOpenPositions(page) {
      this.calls.push(["findOpenPositions", page]);
      return (rows.openPositions ?? []).slice(page.offset, page.offset + page.limit);
    },
    async countJobs() {
      this.calls.push(["countJobs"]);
      return (rows.openPositions ?? []).length;
    },
    async findNurseOpportunities(page) {
      this.calls.push(["findNurseOpportunities", page]);
      return (rows.nurseOpportunities ?? []).slice(page.offset, page.offset + page.limit);
    },
    async countNurses() {
      this.calls.push(["countNurses"]);
      return (rows.nurseOpportunities ?? []).length;
    },
    async findColleaguesOf(nurseName) {
      this.calls.push(["findColleaguesOf", nurseName]);
      return rows.colleagues ?? [];
    },
  };
}

module.exports = { time, day, shift, stubShiftRepository, stubStaffingRepository };
