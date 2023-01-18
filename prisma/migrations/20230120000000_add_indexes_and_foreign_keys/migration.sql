-- Foreign keys were missing on jobs and nurse_hired_jobs, so the database
-- happily accepted a hire that referenced a nurse or a job that did not exist.
-- Rows that already violate the constraint are removed first so the migration
-- can apply to an existing database.
DELETE FROM "nurse_hired_jobs"
WHERE "job_id" NOT IN (SELECT "job_id" FROM "jobs")
   OR "nurse_id" NOT IN (SELECT "nurse_id" FROM "nurses");

UPDATE "jobs"
SET "facility_id" = NULL
WHERE "facility_id" IS NOT NULL
  AND "facility_id" NOT IN (SELECT "facility_id" FROM "facilities");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_facility_id_fkey"
  FOREIGN KEY ("facility_id") REFERENCES "facilities"("facility_id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurse_hired_jobs" ADD CONSTRAINT "nurse_hired_jobs_job_id_fkey"
  FOREIGN KEY ("job_id") REFERENCES "jobs"("job_id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurse_hired_jobs" ADD CONSTRAINT "nurse_hired_jobs_nurse_id_fkey"
  FOREIGN KEY ("nurse_id") REFERENCES "nurses"("nurse_id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
-- Postgres indexes primary keys but not foreign key columns, and every staffing
-- query joins or filters on the columns below.
CREATE INDEX "jobs_facility_id_idx" ON "jobs"("facility_id");
CREATE INDEX "jobs_nurse_type_needed_idx" ON "jobs"("nurse_type_needed");
CREATE INDEX "nurse_hired_jobs_nurse_id_idx" ON "nurse_hired_jobs"("nurse_id");
CREATE INDEX "nurses_nurse_type_idx" ON "nurses"("nurse_type");
CREATE INDEX "nurses_nurse_name_idx" ON "nurses"("nurse_name");
CREATE INDEX "question_one_shifts_facility_id_idx" ON "question_one_shifts"("facility_id");
CREATE INDEX "question_one_shifts_shift_date_idx" ON "question_one_shifts"("shift_date");
