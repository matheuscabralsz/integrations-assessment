# Technical Assignment: Talent Sync

Build a small **React + Node + TypeScript** app that pulls talent records from **three** different mock recruiting APIs, normalises them into a single shape, and pushes the result to a sync endpoint.

**Time budget: about 2 hours.** Don't try to "finish everything", make sensible calls about what to skip.

---

## What you'll receive separately

- A **base URL** (e.g. `https://technical-assignment-ten.vercel.app/api`)
- An **API key** (a JWT), pass it in the `X-API-KEY` header on every request - You can request one by entering your email on the homepage - https://technical-assignment-ten.vercel.app/

The same key authenticates against all three integrations and the sync endpoint.

All paths in this brief are relative to that base URL (for example: `GET <baseUrl>/avionte/talents`).

Sanity check (optional): try a single request with your key to confirm you can reach the API:
```bash
curl -H "X-API-KEY: <your-key>" "<baseUrl>/avionte/talents?limit=1"
```

---

## The task

We have three third-party recruiting integrations connected. Each exposes its own list endpoint with its own conventions. You need to:

1. **Pull the list** from each of the three integrations (Avionte, Bullhorn, Lever).
2. **Normalise** the records into a single internal shape so you can present them in one unified list.
3. **Sync** the merged list to `POST /sync` and show the per-record result.

The interesting part of this exercise is the normalisation layer: the three APIs disagree on field names, status formats, skill formats, date formats, address structure, contact info structure, ID formats, pagination, most of what you'd hope they'd agree on. How you structure adapters across these is the thing we'll be looking at.

**Stretch (only if time allows):** edit a record in the UI and `PUT` the changes back to the source integration. Re-syncing after an edit should resolve any prior conflict on that record. Each integration's `PUT` accepts that integration's native shape.

That's the task. Anything beyond it is up to you.

---

## Styling

This isn't a backend-only exercise, the UI is part of the deliverable. We're not expecting senior designer-level polish, but the layout and presentation should feel intentional and the kind of thing you'd be willing to put in front of a real user. Someone scanning the unified talent list or the result of a sync should be able to understand what they're looking at without effort.

You're free to use **Tailwind CSS**, a component library (Mantine, shadcn/ui, Chakra, MUI, etc.), or plain CSS, whatever lets you spend your time on the result rather than the setup.

---

## Common rules

- All endpoints require `X-API-KEY: <your-key>` in headers.
- All responses are JSON.
- Errors share one shape: `{ "error": { "code": "...", "message": "...", "details": [...] } }`.
- Common error codes: `401 missing_api_key` / `invalid_api_key`, `404 not_found`, `405 method_not_allowed`, `422 validation_failed`.

The 25 underlying talents are partitioned across the three integrations (each integration "owns" a different subset). Together they form the full population you're syncing.

---

## Integration 1: Avionte

Modern-ish REST. camelCase, flat structure, cursor pagination.

### `GET /avionte/talents`

Query params:
- `limit` (optional, default `5`, max `50`)
- `cursor` (optional), pass `nextCursor` from the previous response

Response:
```json
{
  "data": [
    {
      "id": "tal_001",
      "firstName": "Amelia",
      "lastName": "Hart",
      "emailAddress": "amelia.hart@example.com",
      "mobilePhone": "+1-415-555-0142",
      "status": "Active",
      "skills": ["React", "TypeScript", "Node.js"],
      "city": "San Francisco",
      "state": "CA",
      "lastUpdatedDate": "2026-04-12T10:15:00.000Z",
      "createdDate": "2026-01-10T09:30:00.000Z"
    }
  ],
  "nextCursor": "eyJvIjo1"
}
```

`nextCursor: null` means you've reached the end.

### `GET /avionte/talents/:id`

Returns one talent. `404` if not found.

### `PUT /avionte/talents/:id`

Update one or more fields. Body is a partial talent in the same shape as above.
Editable: `firstName`, `lastName`, `emailAddress`, `mobilePhone`, `status`, `skills`, `city`, `state`. The server sets `lastUpdatedDate`.

### `GET /avionte/jobs`

Same shape and pagination as `/avionte/talents`. Provided as a bonus entity if you want to do anything with it; not required.

---

## Integration 2: Bullhorn

Older REST conventions. snake_case, nested address, skills as a comma-separated string, dates as **epoch milliseconds**, offset/limit pagination, **numeric IDs**.

### `GET /bullhorn/candidates`

Query params:
- `start` (optional, default `0`), offset
- `count` (optional, default `5`, max `50`), page size

Response:
```json
{
  "data": [
    {
      "candidate_id": 1010,
      "first_name": "Rafael",
      "last_name": "Cruz",
      "email": "rafael.cruz@example.com",
      "phone": "+1-602-555-0148",
      "employment_status": "active",
      "skills": "Terraform, AWS, Python",
      "address": {
        "city": "Phoenix",
        "state": "AZ",
        "country_code": "US"
      },
      "date_last_modified": 1744566600000,
      "date_added": 1736505000000
    }
  ],
  "total": 8,
  "start": 0,
  "count": 5
}
```

You've reached the end when `start + count >= total`.

`employment_status` is one of `"active"`, `"inactive"`, `"do_not_contact"`.

### `GET /bullhorn/candidates/:id`

Path id is the numeric `candidate_id`. `404` if not found.

### `PUT /bullhorn/candidates/:id`

Body is a partial candidate in the same shape. Editable top-level fields: `first_name`, `last_name`, `email`, `phone`, `employment_status`, `skills`. Editable nested: `address.city`, `address.state`. The server sets `date_last_modified`.

---

## Integration 3: Lever

Modern REST, but heavily nested. Names are split, contact info is typed arrays, status is split across two booleans, skills are called `tags`, dates are ISO without milliseconds, page-number pagination, **prefixed string IDs**.

### `GET /lever/people`

Query params:
- `page` (optional, default `1`)
- `perPage` (optional, default `5`, max `50`)

Response:
```json
{
  "items": [
    {
      "id": "lev_p_018",
      "name": { "first": "Cassius", "last": "Reyes" },
      "emails": [
        { "value": "cassius.reyes@example.com", "type": "personal" }
      ],
      "phones": [
        { "value": "+1-505-555-0179", "type": "mobile" }
      ],
      "tags": ["PHP", "Laravel", "MySQL"],
      "isActive": false,
      "doNotContact": false,
      "location": {
        "locality": "Albuquerque",
        "region": "NM",
        "country": "United States"
      },
      "updatedAt": "2026-03-22T16:00:00Z",
      "createdAt": "2026-01-10T09:30:00Z"
    }
  ],
  "page": 1,
  "perPage": 5,
  "totalPages": 2,
  "total": 8
}
```

You've reached the end when `page >= totalPages`.

The two booleans together encode the canonical status:
- `doNotContact: true` → `"DoNotContact"` (regardless of `isActive`)
- otherwise `isActive: true` → "Active", `false` → "Inactive"

### `GET /lever/people/:id`

Path id is the prefixed string id (e.g. `lev_p_018`). `404` if not found.

### `PUT /lever/people/:id`

Body is a partial person in the same nested shape. Editable: `name.first`, `name.last`, `emails`, `phones`, `tags`, `isActive`, `doNotContact`, `location.locality`, `location.region`. The server sets `updatedAt`.

---

## `POST /sync`

The sync endpoint accepts **one** unified shape. You're expected to normalise records from all three integrations into this shape before sending.

Request body:
```json
{
  "talents": [
    {
      "id": "tal_001",
      "firstName": "Amelia",
      "lastName": "Hart",
      "emailAddress": "amelia.hart@example.com",
      "mobilePhone": "+1-415-555-0142",
      "status": "Active",
      "skills": ["React", "TypeScript", "Node.js"],
      "city": "San Francisco",
      "state": "CA",
      "lastUpdatedDate": "2026-04-12T10:15:00.000Z"
    }
  ]
}
```

Each entry must be a complete record (all fields, including `lastUpdatedDate`).

`id` should be the source integration's id, stringified. Bullhorn's numeric `1010` becomes `"1010"`; Lever's `"lev_p_018"` stays as-is; Avionte's `"tal_001"` stays as-is. The sync endpoint treats all three id formats as opaque keys.

`status` must be one of `"Active"`, `"Inactive"`, `"DoNotContact"`. `lastUpdatedDate` must be ISO-8601 with milliseconds (e.g. `"2026-04-12T10:15:00.000Z"`).

Response:
```json
{
  "summary": {
    "total": 25,
    "created": 14,
    "updated": 0,
    "unchanged": 0,
    "conflicts": 8,
    "errors": 3
  },
  "details": [
    { "id": "tal_001", "status": "created" },
    { "id": "1010", "status": "conflict",
      "message": "Server has a newer version of this record.",
      "serverVersion": { "lastUpdatedDate": "2026-04-12T11:15:00.000Z" } },
    { "id": "lev_p_018", "status": "error",
      "message": "emailAddress: Invalid email" }
  ]
}
```

Per-record statuses:

| status      | meaning                                                                       |
|-------------|-------------------------------------------------------------------------------|
| `created`   | First time we've seen this record for your account.                           |
| `updated`   | Already synced; your `lastUpdatedDate` is newer, so we accepted it.           |
| `unchanged` | Already synced at this exact `lastUpdatedDate`. No-op.                        |
| `conflict`  | Server has a newer version. Server's `lastUpdatedDate` is in `serverVersion`. |
| `error`     | Record failed validation; details in `message`.                               |

---

## Deliverables

A GitHub repo (public, or invite `https://github.com/steven-noble`) with:

- The code.
- A `README.md` with instructions to run it locally.
- A short note (a few sentences each):
  - How you structured the integration and why.
  - Trade-offs you made for time.
  - What you'd do differently with a full day.
  - Anything that surprised you.

---

## Logistics

- Use whatever editor, AI tools, libraries, and references you'd use on a real workday.
- If something in this brief is ambiguous, make a call and explain it in your README. Reasonable judgment is part of the exercise.
- If our API misbehaves or your key doesn't work, email us, that's on us.

Good luck.