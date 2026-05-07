# Talent Sync

Pulls candidates from Avionté, Bullhorn, and Lever, normalizes them into a single shape, and posts the merged list to `/sync`.

## Running locally
1. Copy `.env.example` to `.env` and set `BASE_URL` and `X_API_KEY`.
   You can request an API key at https://technical-assignment-ten.vercel.app/.
2. `npm install`
3. `npm run dev` (runs server + web concurrently)

## Trade-offs

- No persistence layer: every request to `/api/talents` re-fetches all three integrations
- In a larger codebase I'd split route handling from business logic into a service layer, but for three integrations and two routes the extra indirection wasn't worth it.
- No in-memory cache with TTL
- No retry/backoff or request timeout
- No client-side validation on the sync endpoint

## With a full day

- Persist the normalized shape in Postgres so `/api/talents` reads from the DB instead of re-fetching all three sources on every request.
- A cron job to automatically keep data up to date downstream and upstream
- Add pagination on the `/api/talents` route.
- Add retry-with-backoff plus a fetch timeout via `AbortController` so transient upstream failures self-heal.
- Cache `/api/talents` results with a short TTL: currently the same data is re-pulled on every page load.
- Opening the edit modal, ideally, it should fetch the individual candidate (`/api/talents/{source}/{id}`) on opening the component
- A button to open a read-only modal allowing the user to see all the candidate information
- Allow users to edit what columns are visible in the table; this preference can be persisted.
- Add sort by column in the UI

## Anything that surprised you

- The mock API replaces four real services: three CRMs and the sync destination. In a real world application we'd have four sets of credentials. Four error budgets. Four different rate limits, each with its own quirks.
- Each CRM/ATS shapes the data differently. A couple stood out:
    - Bullhorn's `skills` field is a comma-separated string, not an array
    - Bullhorn returns `country_code`, Lever returns `country: "United States"`, and the unified shape has nowhere to put either
- The approach to sync data upstream and downstream surprised me; it's clever and works well, my initial thoughts were creating webhooks, reconciliation cron jobs, etc.

## How I structured the integration and why

- The adapter layer is where most of the work lives, since the brief flags normalization as the focus.
- Each integration implements a `TalentAdapter` interface with three methods: `fetchPage` (pagination), `normalize(raw)` (source-specific shape → unified `Talent`), and `update(id, patch)` (write a partial change back in the source's native shape).
- A shared `paginate()` async generator consumes any adapter and yields records until the source's end condition is hit. That keeps pagination logic in one place rather than re-implemented in every adapter.
- A single `adapters: Record<Source, TalentAdapter>` registry in `server/src/index.ts` is shared by both routes (the GET fan-out and the per-source PUT), so adding a fourth integration is one entry rather than touching multiple call sites.
