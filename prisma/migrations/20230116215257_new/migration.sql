-- CreateTable
CREATE TABLE "facilities" (
    "facility_id" INTEGER NOT NULL,
    "facility_name" VARCHAR(255),

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("facility_id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "job_id" INTEGER NOT NULL,
    "facility_id" INTEGER,
    "nurse_type_needed" VARCHAR(255),
    "total_number_nurses_needed" INTEGER,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("job_id")
);

-- CreateTable
CREATE TABLE "nurse_hired_jobs" (
    "job_id" INTEGER NOT NULL,
    "nurse_id" INTEGER NOT NULL,

    CONSTRAINT "nurse_hired_jobs_pkey" PRIMARY KEY ("job_id","nurse_id")
);

-- CreateTable
CREATE TABLE "nurses" (
    "nurse_id" INTEGER NOT NULL,
    "nurse_name" VARCHAR(255),
    "nurse_type" VARCHAR(255),

    CONSTRAINT "nurses_pkey" PRIMARY KEY ("nurse_id")
);

-- CreateTable
CREATE TABLE "question_one_shifts" (
    "shift_id" INTEGER NOT NULL,
    "facility_id" INTEGER,
    "shift_date" DATE,
    "start_time" TIME(6),
    "end_time" TIME(6),

    CONSTRAINT "question_one_shifts_pkey" PRIMARY KEY ("shift_id")
);

-- AddForeignKey
ALTER TABLE "question_one_shifts" ADD CONSTRAINT "question_one_shifts_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("facility_id") ON DELETE SET NULL ON UPDATE CASCADE;
