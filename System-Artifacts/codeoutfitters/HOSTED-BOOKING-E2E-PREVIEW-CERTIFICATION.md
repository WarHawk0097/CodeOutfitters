# Hosted Booking E2E — Preview Certification

**Run ID:** `QA-BOOKING-20260806T190814Z`
**Commit:** `88d106eada23ee82d1017ae9dd284ca183805d3f`
**Preview deployment ID:** `dpl_9YLXkHfe8BtBUfZbLR6CdRXrtT6n` (target: `preview`, status: Ready)
**Preview origin:** `https://codeoutfitters-lbd84rggq-warhawk0097s-projects.vercel.app`
**Worker hostname:** `booking-reservation-worker.tsamuel.workers.dev`
**Supabase project reference:** `rsxdhwtprmuhzuocycxu`
**Executed from:** detached QA worktree `F:\Temp\qa-wt-88d106e` (clean at start)
**Manifest:** `F:\Backups\CodeOutfitters\HostedBookingQA\QA-BOOKING-20260806T190814Z\created-ids.json`

---

## Phase 1 — Safety gates

| Gate | Result |
|---|---|
| Repository commit is `88d106eada23ee82d1017ae9dd284ca183805d3f` | **PASS** |
| Working directory is the detached QA worktree, tree clean | **PASS** |
| PostgreSQL read-only connectivity | **PASS** — `select 'CONN_OK'` → PostgreSQL 17.6 |
| Database identity bound to project `rsxdhwtprmuhzuocycxu` | **PASS** — connection role is scoped to the project reference; `current_database()` = `postgres` |
| `vercel curl /book --deployment <preview> -i` | **PASS** — `HTTP/1.1 200 OK`, `X-Matched-Path: /book`, `<title>Book a Discovery Call — CodeOutfitters</title>`, no Vercel SSO page |
| Worker CORS preflight with Preview `Origin` | **PASS** — `HTTP/1.1 204 No Content`, `Access-Control-Allow-Origin` exactly matches the Preview origin, `Vary: Origin`, `Access-Control-Allow-Methods: POST, OPTIONS` |
| Compiled browser configuration | **PASS** — see below |

Compiled browser bundle audit (17 chunks fetched from the Preview deployment through authenticated
`vercel curl`):

- Worker endpoint compiled into the bundle: `https://booking-reservation-worker.tsamuel.workers.dev`
- Supabase endpoint compiled into the bundle: `https://rsxdhwtprmuhzuocycxu.supabase.co`
- Browser key is a publishable key (`sb_publishable_…` prefix; value not recorded)
- No match for `service_role`, `SERVICE_ROLE`, the base64 `service_role` JWT role marker,
  `SUPABASE_SERVICE*`, `RESEND_API_KEY`, `sk_live`, or `VERCEL_AUTOMATION_BYPASS*` in any chunk

Anonymous (unauthenticated) fetch of the Preview `/book` redirects to Vercel SSO, confirming
deployment protection is active; all Preview HTTP evidence was collected through `vercel curl`.

## Phase 2 — Hosted database contract

Baseline counts (pre-QA):

| Table | Count |
|---|---|
| `public.available_slots` | 840 |
| `public.bookings` | 2 |
| `public.activity_events` | 0 |
| `public.ai_conversations` | 0 |
| `public.ai_messages` | 0 |
| `public.email_events` | 0 |
| `public.inquiry_attachments` | 0 |
| `public.lead_form_submissions` | 0 |
| `public.lead_timeline_events` | 0 |
| `public.leads` | 0 |
| `public.profiles` | 0 |
| `public.proposal_access_links` | 0 |
| `public.proposal_client_responses` | 0 |
| `public.proposal_publications` | 0 |
| `public.saved_views` | 0 |
| `public.tasks` | 0 |
| `public.workspace_memberships` | 0 |
| `public.workspace_owner_bootstrap` | 1 |
| `public.workspaces` | 1 |
| `storage.objects` | 0 |

`available_slots` baseline shape: 840 rows, `date` range `2026-06-15` → `2026-09-04`, 2 booked,
14 distinct `time` values (`9:00 AM` … `4:30 PM`, 60 rows each).

Function contract:

| Property | `reserve_slot` | `get_available_slots` |
|---|---|---|
| Signature | `(p_date date, p_time text, p_booking jsonb) → uuid` | `(p_month integer, p_year integer) → TABLE(id, date, time)` |
| Owner | `postgres` | `postgres` |
| `SECURITY DEFINER` | yes | yes |
| Volatility | `volatile` | `stable` |
| Pinned `search_path` | `pg_catalog, public` | `pg_catalog, public` |
| EXECUTE grants | `postgres`, `service_role` **only** | `postgres`, `anon`, `service_role` |

Auxiliary reachability: `reserve_slot` touches only `public.available_slots` and `public.bookings`.
There are **0** user triggers on either table and **0** foreign keys referencing either table, so no
audit / event / queue / outbox / notification table is written by the reservation path.

Table security:

| Table | RLS | FORCE RLS | Table ACL |
|---|---|---|---|
| `public.available_slots` | enabled | enabled | `postgres`, `service_role` only |
| `public.bookings` | enabled | enabled | `postgres`, `service_role` only |

Policies: `anon_deny_all_available_slots` / `anon_deny_all_bookings` (`{anon}`, `ALL`,
`USING false`, `WITH CHECK false`); `service_role_full_access_available_slots` /
`service_role_full_access_bookings` (`{service_role}`, `ALL`, `USING true`, `WITH CHECK true`).

Constraints and indexes:

- `available_slots_pkey` PRIMARY KEY (id); `available_slots_date_time_key` UNIQUE (date, "time")
- `bookings_pkey` PRIMARY KEY (id); `bookings_preferred_date_time_unique` UNIQUE (preferred_date, preferred_time)
- `bookings_status_check` CHECK (status IN ('pending','confirmed','cancelled'))
- 4 unique indexes backing the above; no additional indexes on either table

**Certified contract matched. No anonymous or authenticated direct table-write path exists.**

## Phase 3 — Run manifest

`created-ids.json` created before mutation and flushed after every create, reset and delete.
It records only the run ID, project reference, Preview deployment ID and origin, Worker hostname,
commit, timestamps, the exact created slot ID, the exact booking IDs, and reset/cleanup state.
No credentials, headers, request bodies or full synthetic contact values are stored.

## Phase 4 — Isolated synthetic slot

Pre-create verification: `2026-09-25` (Friday) had 0 existing slots and 0 existing bookings at any
time, and lies 21 days beyond the last real availability date (`2026-09-04`).

| Field | Value |
|---|---|
| Slot ID | `adce63ac-4112-4a45-83e5-df6696aa9a91` |
| Date | `2026-09-25` |
| Time | `3:30 PM` (a UI-supported value) |
| `is_booked` at creation | `false` |

One row inserted; `available_slots` 840 → 841; no existing row modified; `bookings` unchanged at 2.

## Phase 5 — Public availability (publishable role only)

| Check | Result |
|---|---|
| `get_available_slots(p_month=9, p_year=2026)` | **200**, 57 rows |
| Synthetic slot present | **yes** — `{"id":"adce63ac-4112-4a45-83e5-df6696aa9a91","date":"2026-09-25","time":"3:30 PM"}` |
| Returned fields | exactly `id, date, time` — no contact, status or internal columns |
| `p_month=13` | **400** `22023` — `p_month must be between 1 and 12 (got 13)` |
| `p_month=0` | **400** `22023` — `p_month must be between 1 and 12 (got 0)` |
| `p_year=1000` | **400** `22023` — `p_year must be between 1970 and 2100 (got 1000)` |
| `p_year=2200` | **400** `22023` — `p_year must be between 1970 and 2100 (got 2200)` |
| `p_month=null, p_year=null` | **400** `22023` — `p_month must be between 1 and 12 (got <NULL>)` |
| non-numeric month/year | **400** `22P02` — `invalid input syntax for type integer` |
| Anonymous `GET /rest/v1/available_slots` | **401** `42501` — permission denied for table |
| Anonymous `GET /rest/v1/bookings` | **401** `42501` — permission denied for table |
| Anonymous `POST /rest/v1/bookings` | **401** `42501` — permission denied for table |
| Anonymous `POST /rest/v1/available_slots` | **401** `42501` — permission denied for table |
| Anonymous `POST /rest/v1/rpc/reserve_slot` | **401** `42501` — permission denied for function `reserve_slot` |

The publishable key was read from the compiled bundle and used only as `apikey` / bearer; its value
is not recorded here.

## Phase 6 — Normal Worker reservation

Synthetic payload: QA-only name derived from the run ID, address under `example.invalid`, synthetic
company, **no phone**, short QA-only message, `date=2026-09-25`, `time=3:30 PM`,
`timezone=America/New_York`. No database or service-role credential was sent.

| Check | Result |
|---|---|
| HTTP status | **200 OK** |
| Booking IDs returned | exactly one — `448bebe5-d16b-4c7f-96a7-cb565757ea5f` |
| `notification` | **`skipped`** |
| New booking rows | exactly one (`bookings` 2 → 3) |
| Date/time linkage | `preferred_date=2026-09-25`, `preferred_time=3:30 PM`, `status=pending`, `timezone=America/New_York` |
| Slot state | `adce63ac-…` `is_booked = true` |
| Unrelated row counts | unchanged (all other tables still at baseline, `storage.objects` = 0) |
| Pre-existing bookings | both untouched |

`Access-Control-Allow-Origin` on the response exactly matched the Preview origin.

No external email, SMS, calendar, webhook or n8n delivery occurred (`notification: "skipped"`).

## Phase 7 — Duplicate rejection

Identical Worker request replayed against the now-booked slot:

| Check | Result |
|---|---|
| HTTP status | **409 Conflict** |
| Response body | `{"error":"slot_already_booked","message":"slot_already_booked"}` (deterministic) |
| Second booking created | none — `bookings` still 3 |
| Auxiliary residue | none — all auxiliary tables still 0, `storage.objects` = 0 |
| Original booking and slot | unchanged and consistent |

## Phase 8 — Approved controlled reset

| Step | Result |
|---|---|
| Dependent child rows on the first booking | **0** (0 foreign keys reference `public.bookings`) |
| Deleted by exact ID | `448bebe5-d16b-4c7f-96a7-cb565757ea5f` — `DELETE 1` |
| Slot reset by exact ID | `adce63ac-4112-4a45-83e5-df6696aa9a91` → `is_booked = false` — `UPDATE 1` |
| Slot still present | yes |
| Booking gone | yes (`first_booking_remaining = 0`) |
| Availability RPC returns the slot again | yes — **200**, 57 rows, synthetic slot present |
| Counts | `available_slots` 841, `bookings` 2 — no unrelated change |

Both operations ran in a single transaction, scoped by exact primary key.

## Phase 9 — Controlled two-request concurrency test

Two near-simultaneous `POST` requests issued in one `curl --parallel --parallel-immediate`
invocation, with distinct synthetic QA identifiers (Racer1 / Racer2).

| Check | Result |
|---|---|
| HTTP 200 responses | exactly one (Racer1) |
| HTTP 409 responses | exactly one (Racer2 — `slot_already_booked`) |
| Winner booking ID | `539b860b-3ad9-4692-a795-42c5d326598e` |
| Winner `notification` | **`skipped`** |
| Booking rows for the synthetic slot | exactly one |
| Partial or duplicate rows | none (`bookings` = 3, all IDs distinct) |
| Slot state | `is_booked = true` |

## Phase 10 — Integrity verification

| Check | Result |
|---|---|
| Count deltas vs baseline | `available_slots` +1 (synthetic slot), `bookings` +1 (winner) — expected exactly |
| Bookings for the synthetic slot | 1 |
| Primary-key uniqueness (`bookings`) | 3 rows / 3 distinct IDs |
| Primary-key uniqueness (`available_slots`) | 841 rows / 841 distinct IDs |
| Duplicate `(preferred_date, preferred_time)` | 0 |
| Duplicate `(date, "time")` | 0 |
| Bookings without a matching slot | 0 |
| Booked slots without a booking | 0 |
| Booking↔slot relationship | slot `adce63ac-…` ↔ booking `539b860b-…`, `status=pending`, `timezone=America/New_York`, `created_at = updated_at = 2026-08-06T19:12:25.749647Z` |
| `reserve_slot` / `get_available_slots` definitions | unchanged (`pg_get_functiondef` MD5 identical to the Phase 2 capture) |
| Function owners, `SECURITY DEFINER`, volatility, pinned `search_path` | unchanged |
| EXECUTE grants | unchanged (`reserve_slot`: `postgres`, `service_role`; `get_available_slots`: `postgres`, `anon`, `service_role`) |
| RLS and FORCE RLS | unchanged (both enabled on both tables) |
| Policies | unchanged (4 policies, same roles / qual / with_check) |
| Constraints, triggers, indexes | unchanged (5 constraints, 4 indexes, 0 user triggers) |
| `anon` / `authenticated` / `PUBLIC` grants on either table | **0 rows** — no unauthorized anonymous write path |
| Full Phase 2 contract replay diff | only the two expected count rows differed; no schema, grant, policy or ACL drift |

## Phase 11 — Exact-ID cleanup

Dependency order derived from the hosted schema: 0 foreign keys reference `public.bookings` or
`public.available_slots`, therefore there are no child rows to remove.

| # | Action | Result |
|---|---|---|
| 1 | Child rows | none exist |
| 2 | `DELETE FROM public.bookings WHERE id = '539b860b-3ad9-4692-a795-42c5d326598e'` | `DELETE 1` |
| 3 | `DELETE FROM public.available_slots WHERE id = 'adce63ac-4112-4a45-83e5-df6696aa9a91'` | `DELETE 1` |

The first booking (`448bebe5-…`) had already been removed during the Phase 8 controlled reset.

Every deletion targeted an exact primary key. No deletion used a date, time, email, name, prefix,
wildcard, status, range or any other broad filter. The manifest was flushed after the deletions.

Post-cleanup exact-ID check: `first_booking_remaining = 0`, `winner_booking_remaining = 0`,
`synthetic_slot_remaining = 0`, `any_slot_2026_09_25 = 0`, `any_booking_2026_09_25 = 0`.

## Phase 12 — Baseline restoration

Final counts, compared against the pre-QA baseline:

| Table | Baseline | Final | Equal |
|---|---|---|---|
| `public.available_slots` | 840 | 840 | ✔ |
| `public.bookings` | 2 | 2 | ✔ |
| all 17 other `public` tables | as listed in Phase 2 | identical | ✔ |
| `storage.objects` | 0 | 0 | ✔ |

- `available_slots` date range restored to `2026-06-15` → `2026-09-04`, 840 rows, 2 booked.
- Both pre-existing bookings intact and unmodified (`69e071f0-…` 2026-06-17 10:00 AM;
  `ce410e1c-…` 2026-06-18 3:00 PM).
- No synthetic slot remains; neither `448bebe5-…` nor `539b860b-…` remains.
- No child, audit, event, queue, outbox, notification or storage residue remains
  (`activity_events`, `email_events`, `lead_timeline_events`, `storage.objects` all still 0).
- Full Phase 2 contract replay produced **NO_DIFFERENCES** against the pre-QA capture: grants, RLS,
  FORCE RLS, policies, function definitions, owners, constraints, triggers and indexes are unchanged.
- Preview reachable: `vercel curl /book` → `HTTP/1.1 200 OK`, `X-Matched-Path: /book`.
- Worker reachable: preflight → `HTTP/1.1 204 No Content` with the exact Preview
  `Access-Control-Allow-Origin`.
- Production was not changed. The exercised deployment `dpl_9YLXkHfe8BtBUfZbLR6CdRXrtT6n` has
  `target: preview`. No deployment, promotion, push, merge, environment change, Worker configuration
  change, schema change or migration was performed during this run.

## Scope statement

This certification covers the **Preview** deployment
`dpl_9YLXkHfe8BtBUfZbLR6CdRXrtT6n` at commit `88d106eada23ee82d1017ae9dd284ca183805d3f` only.
**Production remains separately uncertified** — no production surface was exercised, observed or
changed by this run.

## Redaction

This document intentionally excludes passwords, database URIs, JWTs, API keys, bypass tokens,
authorization headers, full synthetic email addresses and complete request bodies.
