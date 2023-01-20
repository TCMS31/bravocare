"use strict";

const { prisma } = require("../db/prisma");

/**
 * Data access for shifts. The service layer talks to this, never to Prisma
 * directly, so swapping the store or stubbing it in a test touches one file.
 */
class ShiftRepository {
  /** @param {import("@prisma/client").PrismaClient} [client] */
  constructor(client = prisma) {
    this.client = client;
  }

  /**
   * A page of shifts, newest first, with the facility name joined in.
   *
   * @param {{limit: number, offset: number}} page
   * @returns {Promise<object[]>}
   */
  listShifts({ limit, offset }) {
    return this.client.question_one_shifts.findMany({
      take: limit,
      skip: offset,
      orderBy: [{ shift_date: "asc" }, { start_time: "asc" }, { shift_id: "asc" }],
      include: { facility: { select: { facility_name: true } } },
    });
  }

  /** Total number of shifts, for pagination metadata. */
  countShifts() {
    return this.client.question_one_shifts.count();
  }

  /**
   * Fetch several shifts at once.
   *
   * One `IN (...)` query rather than one query per id - the original code issued
   * a separate findUnique per shift, which is the same N+1 shape that hurts once
   * a caller wants to compare more than two.
   *
   * @param {number[]} shiftIds
   * @returns {Promise<object[]>}
   */
  findByIds(shiftIds) {
    return this.client.question_one_shifts.findMany({
      where: { shift_id: { in: shiftIds } },
    });
  }
}

module.exports = { ShiftRepository };
