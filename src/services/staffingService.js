"use strict";

/** Business rules for the staffing questions. */
class StaffingService {
  /**
   * @param {object} deps
   * @param {import("../repositories/staffingRepository").StaffingRepository} deps.staffingRepository
   */
  constructor({ staffingRepository }) {
    this.staffingRepository = staffingRepository;
  }

  /**
   * Open jobs and the number of nurses each still needs.
   *
   * @param {{limit: number, offset: number}} page
   */
  async listOpenPositions({ limit, offset }) {
    const [rows, total] = await Promise.all([
      this.staffingRepository.findOpenPositions({ limit, offset }),
      this.staffingRepository.countJobs(),
    ]);
    return { rows, total, limit, offset };
  }

  /**
   * Each nurse and the jobs of their type that they are not yet hired to.
   *
   * @param {{limit: number, offset: number}} page
   */
  async listNurseOpportunities({ limit, offset }) {
    const [rows, total] = await Promise.all([
      this.staffingRepository.findNurseOpportunities({ limit, offset }),
      this.staffingRepository.countNurses(),
    ]);
    return { rows, total, limit, offset };
  }

  /**
   * Nurses sharing a facility with the named nurse.
   *
   * Bounded by the size of that nurse's facilities rather than by the whole
   * table, so this one is not paginated.
   *
   * @param {string} nurseName
   */
  listColleaguesOf(nurseName) {
    return this.staffingRepository.findColleaguesOf(nurseName);
  }
}

module.exports = { StaffingService };
