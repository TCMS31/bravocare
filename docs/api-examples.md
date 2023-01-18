# API examples

Real request/response pairs captured against a locally seeded database
(`npm run db:seed`), with the API on port 8601. Bodies are piped through
`python3 -m json.tool` for readability; nothing else has been edited.

## `GET /health`

```console
$ curl -s http://localhost:8601/health
{
    "status": "ok"
}
```

## `GET /api/v1/question_one_shifts` - question 1

The full roster. `meta` reports the page taken and the total available.

```console
$ curl -s 'http://localhost:8601/api/v1/question_one_shifts?limit=2'
{
    "status": "success",
    "meta": {
        "total": 8,
        "limit": 2,
        "offset": 0,
        "returned": 2
    },
    "data": {
        "question_one_shifts": [
            {
                "shift_id": 1,
                "facility_id": 1,
                "shift_date": "2023-02-06T00:00:00.000Z",
                "start_time": "1970-01-01T07:00:00.000Z",
                "end_time": "1970-01-01T15:00:00.000Z",
                "facility": {
                    "facility_name": "Harborview General"
                }
            },
            {
                "shift_id": 3,
                "facility_id": 2,
                "shift_date": "2023-02-06T00:00:00.000Z",
                "start_time": "1970-01-01T14:00:00.000Z",
                "end_time": "1970-01-01T22:00:00.000Z",
                "facility": {
                    "facility_name": "Riverside Care Center"
                }
            }
        ]
    }
}
```

## `POST /api/v1/overlap` - question 1

Two shifts at the same facility, 15 minutes apart. The handover allowance is
30 minutes, so this is not a conflict.

```console
$ curl -s -X POST http://localhost:8601/api/v1/overlap \
    -H 'Content-Type: application/json' -d '{"shift1": 1, "shift2": 2}'
{
    "status": "success",
    "data": {
        "overlap": 15,
        "max_threshold": 30,
        "exceeds_threshold": false,
        "policy": "handover"
    }
}
```

Two shifts at different facilities. No overlap at all is permitted there.

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

### Error responses

```console
$ curl -s -w '
HTTP %{http_code}
' -X POST http://localhost:8601/api/v1/overlap \
    -H 'Content-Type: application/json' -d '{"shift1": 1, "shift2": 999}'
{
    "status": "error",
    "message": "One or more shifts could not be found",
    "details": {
        "missing_shift_ids": [
            999
        ]
    }
}
HTTP 404
```

```console
$ curl -s -X POST http://localhost:8601/api/v1/overlap \
    -H 'Content-Type: application/json' -d '{"shift1": 1, "shift2": 1}'
{
    "status": "error",
    "message": "shift1 and shift2 must be different shifts"
}
HTTP 400
```

```console
$ curl -s -X POST http://localhost:8601/api/v1/overlap -H 'Content-Type: application/json' -d '{}'
{
    "status": "error",
    "message": "shift1 is required"
}
HTTP 400
```

## `GET /api/v1/q4` - question 4

How many nurses each job still needs.

```console
$ curl -s http://localhost:8601/api/v1/q4
{
    "meta": {
        "total": 6,
        "limit": 50,
        "offset": 0,
        "returned": 6
    },
    "result": [
        {
            "job_id": 1,
            "facility_id": 1,
            "facility_name": "Harborview General",
            "nurse_type_needed": "RN",
            "total_number_nurses_needed": 3,
            "remaining_spots": 1
        },
        {
            "job_id": 2,
            "facility_id": 1,
            "facility_name": "Harborview General",
            "nurse_type_needed": "CNA",
            "total_number_nurses_needed": 2,
            "remaining_spots": 1
        },
        {
            "job_id": 3,
            "facility_id": 2,
            "facility_name": "Riverside Care Center",
            "nurse_type_needed": "LPN",
            "total_number_nurses_needed": 2,
            "remaining_spots": 1
        },
        {
            "job_id": 4,
            "facility_id": 2,
            "facility_name": "Riverside Care Center",
            "nurse_type_needed": "RN",
            "total_number_nurses_needed": 1,
            "remaining_spots": 0
        },
        {
            "job_id": 5,
            "facility_id": 3,
            "facility_name": "Lakeview Clinic",
            "nurse_type_needed": "CNA",
            "total_number_nurses_needed": 2,
            "remaining_spots": 1
        },
        {
            "job_id": 6,
            "facility_id": 3,
            "facility_name": "Lakeview Clinic",
            "nurse_type_needed": "RN",
            "total_number_nurses_needed": 2,
            "remaining_spots": 2
        }
    ]
}
```

## `GET /api/v1/q5` - question 5

Jobs each nurse is still eligible for. Priya is absent because the only LPN
job is the one she already holds.

```console
$ curl -s http://localhost:8601/api/v1/q5
{
    "meta": {
        "total": 7,
        "limit": 50,
        "offset": 0,
        "returned": 6
    },
    "result": [
        {
            "nurse_id": 1,
            "nurse_name": "Anne",
            "nurse_type": "RN",
            "total_remaining_jobs": 2,
            "remaining_spots": 2
        },
        {
            "nurse_id": 2,
            "nurse_name": "Marcus",
            "nurse_type": "CNA",
            "total_remaining_jobs": 1,
            "remaining_spots": 1
        },
        {
            "nurse_id": 4,
            "nurse_name": "Tomas",
            "nurse_type": "RN",
            "total_remaining_jobs": 2,
            "remaining_spots": 2
        },
        {
            "nurse_id": 5,
            "nurse_name": "Grace",
            "nurse_type": "CNA",
            "total_remaining_jobs": 1,
            "remaining_spots": 1
        },
        {
            "nurse_id": 6,
            "nurse_name": "Elena",
            "nurse_type": "LPN",
            "total_remaining_jobs": 1,
            "remaining_spots": 1
        },
        {
            "nurse_id": 7,
            "nurse_name": "Samuel",
            "nurse_type": "RN",
            "total_remaining_jobs": 2,
            "remaining_spots": 3
        }
    ]
}
```

## `GET /api/v1/q6` - question 6

Nurses working at a facility Anne also works at.

```console
$ curl -s http://localhost:8601/api/v1/q6
{
    "nurse": "Anne",
    "result": [
        {
            "nurse_id": 2,
            "nurse_name": "Marcus",
            "nurse_type": "CNA"
        },
        {
            "nurse_id": 4,
            "nurse_name": "Tomas",
            "nurse_type": "RN"
        }
    ]
}
```

The nurse is a parameter rather than a literal in the SQL:

```console
$ curl -s 'http://localhost:8601/api/v1/q6?nurse=Priya'
{
    "nurse": "Priya",
    "result": [
        {
            "nurse_id": 7,
            "nurse_name": "Samuel",
            "nurse_type": "RN"
        }
    ]
}
```
