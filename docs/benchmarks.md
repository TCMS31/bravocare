# Benchmarks

Measured, not estimated. Every number below came from `EXPLAIN (ANALYZE, TIMING
OFF, FORMAT JSON)` run three times against a local PostgreSQL 16.15 instance on
an Apple Silicon machine. The figure quoted is the range across the three runs.

## Dataset

The demo seed (`npm run db:seed`) is deliberately tiny, so the benchmark uses a
separate synthetic load generated with `generate_series`:

| Table              | Rows    |
| ------------------ | ------- |
| `facilities`       | 5,000   |
| `jobs`             | 20,000  |
| `nurses`           | 50,000  |
| `nurse_hired_jobs` | 100,000 |

The generated rows over-subscribe some jobs, so the `remaining_spots` values
this dataset produces are not realistic. Only the timings are meaningful.

## 1. Missing indexes on the join columns

PostgreSQL indexes primary keys automatically but not foreign key columns. The
original schema therefore had no index on `jobs.facility_id`,
`nurse_hired_jobs.nurse_id`, `nurses.nurse_type`, `nurses.nurse_name` or
`jobs.nurse_type_needed` - every column the staffing queries join or filter on.

Question 6 (`GET /api/v1/q6`, "nurses who share a facility with Anne"):

| Indexes                                             | Execution time |
| --------------------------------------------------- | -------------- |
| None beyond the primary keys (as committed)         | 8.8 - 9.0 ms   |
| After `20230120000000_add_indexes_and_foreign_keys` | 0.2 - 0.3 ms   |

Roughly a 30x improvement, and the gap widens with table size because the
unindexed plan sequentially scans `nurses` to find the named nurse and
`nurse_hired_jobs` for every candidate.

## 2. The real bottleneck: question 5 is a cross product

Question 5 pairs **every nurse with every job of their type**. At 50,000 nurses
and ~6,667 jobs per nurse type that is on the order of 333 million candidate
pairs before the anti-join removes the ones the nurse already holds. Indexes
barely touch it, because the work is not lookup, it is the join itself:

| Variant                                  | Execution time       |
| ---------------------------------------- | -------------------- |
| Unpaginated, no indexes                  | 92,664 - 94,413 ms   |
| Unpaginated, with the new indexes        | 79,451 - 80,743 ms   |
| **50-nurse page taken inside the query** | **312.2 - 315.1 ms** |

Indexes bought about 14%. Paging the nurses **inside** the query - a `nurse_page`
CTE with `LIMIT`/`OFFSET` applied before the join, not a `.slice()` on the
result - brought 93 seconds down to 0.3 seconds, roughly 297x.

This is why `findNurseOpportunities` takes `{ limit, offset }` and why
`MAX_PAGE_SIZE` exists: a caller cannot ask for the unpaginated form at all.

Paging after the join would have measured the same 80 seconds, which is the
point worth making: the pagination has to reach the query planner to matter.

## Reproducing

```sh
createdb bravobench
# load the synthetic tables (see the generate_series statements above),
# then run the query under EXPLAIN (ANALYZE, TIMING OFF, FORMAT JSON).
```

The seeded demo database answers all five endpoints in single-digit
milliseconds; it is far too small to show any of this.
