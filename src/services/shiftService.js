"use strict";

const { scheduledOverlapInMinutes } = require("../domain/overlap");
const { createOverlapPolicy } = require("../domain/overlapPolicy");
const { config } = require("../config/env");
const { notFound, badRequest } = require("../http/errors");

/** Business rules for shifts. Knows nothing about Express or about Prisma. */
class ShiftService {
  /**
   * @param {object} deps
   * @param {import("../repositories/shiftRepository").ShiftRepository} deps.shiftRepository
   * @param {import("../domain/overlapPolicy").OverlapPolicy} [deps.overlapPolicy]
   */
  constructor({ shiftRepository, overlapPolicy }) {
    this.shiftRepository = shiftRepository;
    this.overlapPolicy =
      overlapPolicy ||
      createOverlapPolicy("handover", {
        sameFacilityAllowanceMinutes: config.sameFacilityOverlapAllowanceMinutes,
        crossFacilityAllowanceMinutes: config.crossFacilityOverlapAllowanceMinutes,
      });
  }

  /**
   * A page of shifts plus the total, so a caller can tell there is more to read.
   *
   * @param {{limit: number, offset: number}} page
   */
  async listShifts({ limit, offset }) {
    const [shifts, total] = await Promise.all([
      this.shiftRepository.listShifts({ limit, offset }),
      this.shiftRepository.countShifts(),
    ]);
    return { shifts, total, limit, offset };
  }

  /**
   * Compare two shifts and report whether their overlap breaches the policy.
   *
   * @param {number} shiftIdA
   * @param {number} shiftIdB
   */
  async compareShifts(shiftIdA, shiftIdB) {
    if (shiftIdA === shiftIdB) {
      throw badRequest("shift1 and shift2 must be different shifts");
    }

    const rows = await this.shiftRepository.findByIds([shiftIdA, shiftIdB]);
    const byId = new Map(rows.map((row) => [row.shift_id, row]));
    const missing = [shiftIdA, shiftIdB].filter((id) => !byId.has(id));
    if (missing.length > 0) {
      throw notFound("One or more shifts could not be found", { missing_shift_ids: missing });
    }

    const shiftA = byId.get(shiftIdA);
    const shiftB = byId.get(shiftIdB);

    const overlap = scheduledOverlapInMinutes(shiftA, shiftB);
    const maxThreshold = this.overlapPolicy.allowanceMinutes(shiftA, shiftB);

    return {
      overlap,
      max_threshold: maxThreshold,
      exceeds_threshold: overlap > maxThreshold,
      policy: this.overlapPolicy.name,
    };
  }
}

module.exports = { ShiftService };
