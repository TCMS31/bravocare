"use strict";

const { prisma } = require("../db/prisma");

/**
 * Data access for the staffing questions (open positions, nurse opportunities,
 * colleagues at a shared facility).
 *
 * These stay as raw SQL: they are aggregate queries that Prisma's query builder
 * cannot express, and the brief is explicitly about the SQL. Every parameter is
 * interpolated through Prisma's tagged template, which binds rather than
 * concatenates, so none of it is injectable.
 *
 * Counts and sums are cast to `int` in SQL rather than converted in JavaScript.
 * Postgres returns `count()` and `sum()` as `bigint`, which reaches JSON as a
 * string and silently changes the type of the field.
 */
class StaffingRepository {
  /** @param {import("@prisma/client").PrismaClient} [client] */
  constructor(client = prisma) {
    this.client = client;
  }

  /**
   * Every open job and how many nurses it still needs.
   *
   * Grouped by `job_id`. Grouping by (facility, nurse type, headcount) instead -
   * as the original did - silently merges two distinct jobs that happen to want
   * the same number of the same nurse type at the same facility, and reports
   * their combined hires against a single job's headcount.
   */
  findOpenPositions({ limit, offset }) {
    return this.client.$queryRaw`
      SELECT
        jobs.job_id,
        facilities.facility_id,
        facilities.facility_name,
        jobs.nurse_type_needed,
        jobs.total_number_nurses_needed,
        (jobs.total_number_nurses_needed
          - COUNT(DISTINCT nurse_hired_jobs.nurse_id))::int AS remaining_spots
      FROM facilities
      JOIN jobs ON facilities.facility_id = jobs.facility_id
      LEFT JOIN nurse_hired_jobs ON jobs.job_id = nurse_hired_jobs.job_id
      GROUP BY jobs.job_id, facilities.facility_id, facilities.facility_name,
               jobs.nurse_type_needed, jobs.total_number_nurses_needed
      ORDER BY facilities.facility_id, jobs.job_id
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  /** Total number of jobs, for pagination metadata. */
  countJobs() {
    return this.client.jobs.count();
  }

  /**
   * For each nurse, the jobs matching their type that they are not already on.
   *
   * The original grouped by the computed `remaining_spots` as well, which split
   * one nurse across several rows - one per distinct spot count - and made
   * `total_remaining_jobs` count within a group instead of across the nurse.
   *
   * The nurse page is taken before the join, not after. This query pairs every
   * nurse with every job of their type, so its cost is nurses x jobs-of-type;
   * on a 50k nurse / 20k job dataset the unpaginated form took roughly 93
   * seconds and a 50 nurse page takes roughly 0.3 seconds. See
   * docs/benchmarks.md.
   */
  findNurseOpportunities({ limit, offset }) {
    return this.client.$queryRaw`
      WITH open_jobs AS (
        SELECT
          jobs.job_id,
          jobs.nurse_type_needed,
          (jobs.total_number_nurses_needed
            - COUNT(DISTINCT nurse_hired_jobs.nurse_id)) AS remaining_spots
        FROM jobs
        LEFT JOIN nurse_hired_jobs ON jobs.job_id = nurse_hired_jobs.job_id
        GROUP BY jobs.job_id, jobs.nurse_type_needed, jobs.total_number_nurses_needed
      ), nurse_page AS (
        SELECT nurse_id, nurse_name, nurse_type
        FROM nurses
        ORDER BY nurse_id
        LIMIT ${limit} OFFSET ${offset}
      )
      SELECT
        nurse_page.nurse_id,
        nurse_page.nurse_name,
        nurse_page.nurse_type,
        COUNT(open_jobs.job_id)::int AS total_remaining_jobs,
        COALESCE(SUM(open_jobs.remaining_spots), 0)::int AS remaining_spots
      FROM nurse_page
      LEFT JOIN open_jobs ON nurse_page.nurse_type = open_jobs.nurse_type_needed
      LEFT JOIN nurse_hired_jobs already_hired
        ON already_hired.nurse_id = nurse_page.nurse_id
       AND already_hired.job_id = open_jobs.job_id
      WHERE already_hired.nurse_id IS NULL
      GROUP BY nurse_page.nurse_id, nurse_page.nurse_name, nurse_page.nurse_type
      ORDER BY nurse_page.nurse_id
    `;
  }

  /** Total number of nurses, for pagination metadata. */
  countNurses() {
    return this.client.nurses.count();
  }

  /**
   * Nurses who work at any facility the named nurse works at.
   *
   * Excludes the nurse by id rather than by name, so a second nurse who happens
   * to share the name is not dropped from the result.
   *
   * @param {string} nurseName
   */
  findColleaguesOf(nurseName) {
    return this.client.$queryRaw`
      SELECT DISTINCT colleague.nurse_id, colleague.nurse_name, colleague.nurse_type
      FROM nurses target
      JOIN nurse_hired_jobs target_hire ON target_hire.nurse_id = target.nurse_id
      JOIN jobs target_job ON target_job.job_id = target_hire.job_id
      JOIN jobs shared_job ON shared_job.facility_id = target_job.facility_id
      JOIN nurse_hired_jobs colleague_hire ON colleague_hire.job_id = shared_job.job_id
      JOIN nurses colleague ON colleague.nurse_id = colleague_hire.nurse_id
      WHERE target.nurse_name = ${nurseName}
        AND colleague.nurse_id <> target.nurse_id
      ORDER BY colleague.nurse_name
    `;
  }
}

module.exports = { StaffingRepository };
