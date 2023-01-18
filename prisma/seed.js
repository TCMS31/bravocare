/**
 * Development seed data.
 *
 * Every row here is synthetic. No real facility, nurse or patient information
 * is present in this repository.
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/** Build a Postgres `time` value from a wall-clock string such as "07:00". */
const time = (hhmm) => new Date(`1970-01-01T${hhmm}:00.000Z`);
/** Build a Postgres `date` value from an ISO day such as "2023-02-06". */
const day = (iso) => new Date(`${iso}T00:00:00.000Z`);

const facilities = [
  { facility_id: 1, facility_name: "Harborview General" },
  { facility_id: 2, facility_name: "Riverside Care Center" },
  { facility_id: 3, facility_name: "Lakeview Clinic" },
];

const shifts = [
  // Same facility, 15 minutes of overlap - inside the 30 minute handover allowance.
  {
    shift_id: 1,
    facility_id: 1,
    shift_date: day("2023-02-06"),
    start_time: time("07:00"),
    end_time: time("15:00"),
  },
  {
    shift_id: 2,
    facility_id: 1,
    shift_date: day("2023-02-06"),
    start_time: time("14:45"),
    end_time: time("22:45"),
  },
  // Different facility, 60 minutes of overlap - not allowed at all.
  {
    shift_id: 3,
    facility_id: 2,
    shift_date: day("2023-02-06"),
    start_time: time("14:00"),
    end_time: time("22:00"),
  },
  {
    shift_id: 4,
    facility_id: 2,
    shift_date: day("2023-02-06"),
    start_time: time("22:00"),
    end_time: time("23:30"),
  },
  // Back to back at the same facility, no overlap at all.
  {
    shift_id: 5,
    facility_id: 1,
    shift_date: day("2023-02-06"),
    start_time: time("16:00"),
    end_time: time("20:00"),
  },
  // A different day entirely - never overlaps with the rows above.
  {
    shift_id: 6,
    facility_id: 3,
    shift_date: day("2023-02-07"),
    start_time: time("08:00"),
    end_time: time("16:00"),
  },
  {
    shift_id: 7,
    facility_id: 3,
    shift_date: day("2023-02-07"),
    start_time: time("12:00"),
    end_time: time("20:00"),
  },
  {
    shift_id: 8,
    facility_id: 2,
    shift_date: day("2023-02-07"),
    start_time: time("06:30"),
    end_time: time("14:30"),
  },
];

const nurses = [
  { nurse_id: 1, nurse_name: "Anne", nurse_type: "RN" },
  { nurse_id: 2, nurse_name: "Marcus", nurse_type: "CNA" },
  { nurse_id: 3, nurse_name: "Priya", nurse_type: "LPN" },
  { nurse_id: 4, nurse_name: "Tomas", nurse_type: "RN" },
  { nurse_id: 5, nurse_name: "Grace", nurse_type: "CNA" },
  { nurse_id: 6, nurse_name: "Elena", nurse_type: "LPN" },
  { nurse_id: 7, nurse_name: "Samuel", nurse_type: "RN" },
];

const jobs = [
  { job_id: 1, facility_id: 1, nurse_type_needed: "RN", total_number_nurses_needed: 3 },
  { job_id: 2, facility_id: 1, nurse_type_needed: "CNA", total_number_nurses_needed: 2 },
  { job_id: 3, facility_id: 2, nurse_type_needed: "LPN", total_number_nurses_needed: 2 },
  { job_id: 4, facility_id: 2, nurse_type_needed: "RN", total_number_nurses_needed: 1 },
  { job_id: 5, facility_id: 3, nurse_type_needed: "CNA", total_number_nurses_needed: 2 },
  { job_id: 6, facility_id: 3, nurse_type_needed: "RN", total_number_nurses_needed: 2 },
];

const hires = [
  { job_id: 1, nurse_id: 1 }, // Anne, RN at Harborview
  { job_id: 1, nurse_id: 4 }, // Tomas, RN at Harborview
  { job_id: 2, nurse_id: 2 }, // Marcus, CNA at Harborview
  { job_id: 3, nurse_id: 3 }, // Priya, LPN at Riverside
  { job_id: 4, nurse_id: 7 }, // Samuel, RN at Riverside
  { job_id: 5, nurse_id: 5 }, // Grace, CNA at Lakeview
];

async function main() {
  // Children first so repeated runs do not trip foreign keys.
  await prisma.nurse_hired_jobs.deleteMany();
  await prisma.question_one_shifts.deleteMany();
  await prisma.jobs.deleteMany();
  await prisma.nurses.deleteMany();
  await prisma.facilities.deleteMany();

  await prisma.facilities.createMany({ data: facilities });
  await prisma.question_one_shifts.createMany({ data: shifts });
  await prisma.nurses.createMany({ data: nurses });
  await prisma.jobs.createMany({ data: jobs });
  await prisma.nurse_hired_jobs.createMany({ data: hires });

  console.log(
    `Seeded ${facilities.length} facilities, ${shifts.length} shifts, ` +
      `${nurses.length} nurses, ${jobs.length} jobs, ${hires.length} hires.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
