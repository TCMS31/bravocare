# Shift overlap and staffing API

An Express + Prisma API on PostgreSQL with a small React client, written for a
nurse-staffing exercise. Its main job is to say whether two shifts overlap by
more than a roster allows. It also answers three staffing questions: how many
nurses each job still needs, which jobs each nurse could still take, and who
works alongside a given nurse.

The overlap rule: two shifts at the same facility may overlap by up to 30
minutes (an in-person handover), and two shifts at different facilities may
not overlap at all. Both limits are environment variables.

![Overlap check on desktop](docs/screenshots/01-overlap-within-policy.png)

## Running it

The quickest path is Docker Compose:

```sh
cp .env.example .env    # optional; Compose has working defaults
docker compose up --build
```

This starts Postgres, then a one-off `migrate` service that applies the
migrations and loads the demo seed, then the API on http://localhost:8601 and
the client on http://localhost:8600. Postgres is published on port 8605.

To run without Docker you need Node 22.12+ (see `.nvmrc`) and PostgreSQL:

```sh
cp .env.example .env    # set DATABASE_URL
npm install
npm run db:migrate
npm run db:seed
npm start               # API on http://localhost:3000
```

In another terminal:

```sh
cd client
cp .env.example .env.local
npm install
npm run dev             # http://localhost:3001
```

## How it fits together

```mermaid
flowchart LR
  UI["React client<br/>(Vite)"] -->|JSON over HTTP| R["Express routes<br/>src/http"]
  R --> V["validation +<br/>controllers"]
  V --> S["ShiftService<br/>StaffingService"]
  S --> D["domain/overlap<br/>domain/overlapPolicy"]
  S --> Repo["repositories"]
  Repo -->|"Prisma 7 + adapter-pg<br/>(raw SQL for q4-q6)"| PG[(PostgreSQL)]
```

Controllers only parse requests and shape responses. Services hold the rules
and receive their repositories through the constructor (`src/container.js`
wires the real ones), so the HTTP tests swap in in-memory repositories and
need no database.

## Endpoints

The staffing routes keep the question numbers from the exercise brief.

| Method and path                   | What it returns                                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| `GET /health`                     | `{ "status": "ok" }`                                                                               |
| `GET /api/v1/question_one_shifts` | Shifts with facility names, paged by `limit` and `offset`                                          |
| `POST /api/v1/overlap`            | Overlap in minutes for `{ "shift1": id, "shift2": id }`, the allowance, and whether it is exceeded |
| `GET /api/v1/q4`                  | Remaining spots per job                                                                            |
| `GET /api/v1/q5`                  | For each nurse, the open jobs of their type they do not already hold                               |
| `GET /api/v1/q6?nurse=Anne`       | Nurses who work at any facility the named nurse works at                                           |

List endpoints return `meta: { total, limit, offset, returned }`. `limit` is
capped at `MAX_PAGE_SIZE`. Errors come back as
`{ "status": "error", "message": ... }` with a 400, 404 or 500 status, and a
500 never includes database internals.

```console
$ curl -s -X POST http://localhost:8601/api/v1/overlap \
    -H 'Content-Type: application/json' -d '{"shift1": 1, "shift2": 3}'
{
    "status": "success",
    "data": {
        "overlap": 60,
        "max_threshold": 0,
        "exceeds_threshold": true,
        "policy": "handover"
    }
}
```

Every endpoint, with responses captured from the Compose stack, is in
[docs/api-examples.md](docs/api-examples.md).

## Design notes

- **Night shifts.** A shift whose end time is at or before its start ends the
  next day. Each shift's times are placed on its own `shift_date` before
  comparing, so a 22:00-06:00 shift correctly collides with a 05:00 start the
  next morning.
- **Time zones.** Prisma returns a Postgres `TIME` as a date on 1970-01-01 UTC.
  Both the API and the client read the UTC fields, so a shift shows the same
  wall-clock time wherever the server or browser runs.
- **Pluggable policy.** The allowance lives in `src/domain/overlapPolicy.js`.
  `handover` is the default and `strict` allows no overlap; another policy can
  be registered and passed to `ShiftService` without touching the service.
- **Question 5.** A job counts only if it has a free spot and the nurse does
  not hold it already. A nurse with nothing left is listed with zero rather
  than dropped. The nurse page is taken inside the SQL, before the join; on a
  50,000-nurse synthetic dataset that took the query from about 93 s to 0.3 s
  (see [docs/benchmarks.md](docs/benchmarks.md)).
- **Indexes and keys.** The second migration adds the missing foreign keys and
  indexes the join columns the staffing queries use.

## Screenshots

| Desktop                                                                 | Mobile                                                            |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| ![Conflict across facilities](docs/screenshots/02-overlap-conflict.png) | ![Mobile overlap check](docs/screenshots/05-mobile-overlap.png)   |
| ![Open positions](docs/screenshots/03-open-positions.png)               | ![Mobile staffing table](docs/screenshots/06-mobile-staffing.png) |

![Nurse opportunities](docs/screenshots/04-nurse-opportunities.png)

All names in the seed and the screenshots are made up.

## Configuration

Settings are read from the environment (see `.env.example`):

| Variable                                   | Default      | Purpose                            |
| ------------------------------------------ | ------------ | ---------------------------------- |
| `DATABASE_URL`                             | none         | Postgres connection string         |
| `PORT`                                     | `3000`       | API port                           |
| `CORS_ORIGIN`                              | `*`          | Allowed browser origin             |
| `LOG_FORMAT`                               | `dev`        | morgan format                      |
| `SAME_FACILITY_OVERLAP_ALLOWANCE_MINUTES`  | `30`         | Handover allowance at one facility |
| `CROSS_FACILITY_OVERLAP_ALLOWANCE_MINUTES` | `0`          | Allowance across facilities        |
| `DEFAULT_PAGE_SIZE` / `MAX_PAGE_SIZE`      | `50` / `200` | Pagination bounds                  |

The client reads `VITE_API_BASE_URL` at build time (`client/.env.example`).

## Tests

```sh
npm test              # domain, service and HTTP tests (node:test + supertest)
npm run test:client   # React tests (Vitest + React Testing Library)
npm run lint          # ESLint for the API and the client
npm run format:check  # Prettier
```

`npm test` needs no database. The raw SQL behind q4-q6 is covered separately
against a real Postgres loaded with the demo seed. Point `TEST_DATABASE_URL`
at a throwaway database (the tests delete every row):

```sh
TEST_DATABASE_URL=postgresql://bravocare:bravocare@localhost:8605/bravocare_test \
  npm run test:db
```

`test:db` applies the migrations first, creating the database if needed. The
example uses the Compose Postgres.

## Limitations

- No authentication, and no endpoints for creating or editing shifts.
- Overlap is checked between two shifts at a time, not across a whole roster.
- The client loads the first page of shifts (50 by default) and says so when
  there are more.

## License

MIT, see [LICENSE](LICENSE).
