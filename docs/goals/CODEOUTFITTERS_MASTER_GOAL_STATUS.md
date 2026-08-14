# CodeOutfitters Master Goal — Progress Ledger

Source: `docs/goals/CODEOUTFITTERS_MASTER_GOAL.md` § 40 (Strict Completion Matrix).
Statuses (exactly 8, per goal file): NOT_STARTED, AUDITED, IMPLEMENTING, CODE_COMPLETE,
TESTED_LOCAL, EXTERNAL_CONFIGURATION_REQUIRED, VERIFIED_END_TO_END, BLOCKED.
Never mark VERIFIED_END_TO_END without actual end-to-end evidence (goal line 2206).

Last updated: 2026-08-14, after CRM pipeline live persistence + Lead-360 Activity wiring + ingestion fail-closed hardening, then a full `change_lead_stage()` SECURITY DEFINER re-audit + 6 added pglite security tests + 1 added UI source-surface test this window.

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1 | Lead ingestion | TESTED_LOCAL | CRITICAL bug found + fixed: `submit_inquiry` never set `leads.workspace_id`, and `leads_select_members` RLS gates all visibility on it — every lead ingested since `20260727_command_center_workspaces.sql` would have been permanently invisible in the dashboard. Fix `20260812020000_leads_workspace_ingestion_fix.sql`: sets `workspace_id` to the single seeded `'codeoutfitters'` workspace on insert; backfills only-if-null on the merge branch; no bulk historical mutation. Local proof: 6/6 pglite (insert path + merge-backfill path) + 219/219 total (198 unit/pglite + 21 RLS/dashboard/saved-views integration against local Docker stack) — no regressions. Hosted: applied to `rsxdhwtprmuhzuocycxu` via `supabase db push --linked` (confirmed recorded, function source/grants/SECURITY DEFINER/search_path verified via `supabase db query --linked`, EXECUTE grant unchanged at service_role-only). Advisors: 30 pre-existing findings, none new, none mention `submit_inquiry`. Read-only hosted audit: 0 total leads, 0 NULL-workspace leads in production today — no historical backfill is currently needed (table is empty), so goal step 9 is moot until real leads exist, not merely deferred by policy. NOT VERIFIED_END_TO_END: no authenticated browser click-through of the public inquiry form against hosted production performed (would create real data with no safe disposable-test workflow available) — per explicit instruction, no fabricated end-to-end claim. Full source-by-source ingestion audit (booking/manual/email/webhook) per goal step 6 still not re-run this window beyond the inquiry-form path — do not read this as fully verified for ingestion sources other than the public inquiry form. **Manual Add Lead — was fully MISSING, now implemented and TESTED_LOCAL** (prior window): migration `20260812030000_leads_insert.sql` (column-restricted `insert` grant + `leads_insert_members` RLS policy on `public.leads`, applied to local Docker via `supabase db push --local`), `createLead()` in `lib/leads/server-provider.ts`, `POST /api/leads` (`app/api/leads/route.ts`), `LeadsCreateRequestSchema` (`lib/command-center/contracts/leads.ts`), and inline `AddLeadForm` UI (`app/dashboard/leads/add-lead-form.tsx`). Proof: `tsc --noEmit` clean; 1894/1894 non-pglite unit/contract tests pass + all pglite suites pass, no regressions; 8/8 real-Docker RLS integration tests pass. NOT VERIFIED_END_TO_END: no authenticated browser click-through of the new Add Lead UI performed, and the migration has NOT been applied to the hosted project — local Docker only. **Fail-closed hardening — implemented and TESTED_LOCAL this window**: `submit_inquiry`'s workspace lookup previously had no guard — if the seeded `'codeoutfitters'` workspace were ever missing, it would silently re-create the original NULL-workspace bug one layer up. New local (NOT hosted) migration `20260814000000_leads_ingestion_workspace_fail_closed.sql` makes the lookup fail closed: raises `inquiry_workspace_missing` (mapped to a 503 `notConfigured()` response, distinct from the generic 500) before any row is written, unless the call is a pure idempotency replay. Proof: 8/8 `lib/inquiry/server/inquiry-backend.pglite.test.ts` (2 new cases: fails closed with 0 leads/0 submissions when the workspace is missing; still replays an already-persisted submission if the workspace slug is later renamed), `tsc`/`eslint` clean, no regressions in the full suite (2016 tests as of this window's re-audit, up from 2009 — 7 added: 6 pipeline-stage security cases + 1 pipeline-board grouping case). Closes backlog item `LEAD_INGESTION_WORKSPACE_MISSING_FAIL_CLOSED` locally — **not yet on hosted, pending explicit push approval** (see § New migrations pending approval). Dedup re-audit (goal step 20): `leads_work_email_key` (DB uniqueness) and `submit_inquiry`'s merge lookup (`where work_email = v_email for update`) are both **global**, not `(workspace_id, work_email)`-scoped — confirmed by reading `20260723_inquiry_backend.sql` and `20260812020000_leads_workspace_ingestion_fix.sql` directly. Not a live bug today (exactly one workspace exists in both local and hosted), but a latent multi-tenant defect: a second workspace could never hold a lead with an email already used by the first, and the merge lookup would silently attach a new inquiry to a different workspace's existing lead. Documented as a new backlog item below rather than changed — scoping the constraint is a bigger schema decision outside this window's remit and the standing STOP CONDITION against starting multi-tenant/Integration Foundation work. |
| 2 | CRM pipeline | TESTED_LOCAL | Was demo-only (no live DB mutation surface for stage changes) at the start of this window — now has real, tested persistence. **Model decision**: `Lead.status` is canonical (Option A); no separate `PipelineStage` domain object introduced. **Schema**: migration `20260813000000_leads_pipeline_stage.sql` (NOT yet on hosted — pending approval) adds `change_lead_stage(lead_id, to_stage, reason, source)` (SECURITY DEFINER RPC: rejects unauthenticated callers, invalid stages, missing reason on gated stages `Won`/`Lost`/`FUL`, non-members of the lead's workspace; row-locks the lead; no-ops with no history write when `from_stage == to_stage`) and immutable `lead_stage_history` (`id, workspace_id, lead_id, from_stage, to_stage, actor_user_id, change_source, reason, occurred_at`; `select`-only RLS for `authenticated`, no client insert/update/delete — only the RPC can write it). **API/provider**: pipeline mutation goes through this one RPC, never a direct table write, never a client-supplied `workspace_id`. **UI**: `app/dashboard/pipeline/pipeline-board-live.tsx` — no optimistic stage change before the PATCH resolves, a stale PATCH response from a superseded move is dropped (token-guarded), reason-gated stages route through a gate dialog before any mutation, in-flight/own-stage moves are disabled in the move menu. Source-surface tests: 4/4 (`pipeline-board-live.test.ts`). **History/Activity**: exactly one `lead_stage_changed` Activity event emitted on success, safe metadata only. **Security/RLS proof**: 19/19 `lib/leads/pipeline-stage.pglite.test.ts` (13 pre-existing + 6 added this window: `workspace_id`/`occurred_at` are DB-derived not client-supplied, a forged `change_source` outside the 3-value check constraint is rejected with no partial write, direct `UPDATE`/`DELETE` of a history row by `authenticated` is rejected, and `invalid_stage`/`lead_not_found` failures leave zero history rows) against a real embedded Postgres (PGlite) running the unmodified migration SQL — covers unauthenticated rejection, cross-workspace lead-move rejection, cross-workspace history-read rejection, gated-stage reason enforcement, invalid-stage rejection, no-op detection, actor stamped from session not client input, and that `authenticated` cannot write `lead_stage_history` directly. A fresh-session/refresh read after a move sees the new stage (proven at the query level, not same-process memory). Source-surface tests: 5/5 `pipeline-board-live.test.ts` (4 pre-existing + 1 added: cards group by `lead.status`, never `moveOpportunity()`/`lib/demo/store`). **Concurrency — audited, not changed**: `change_lead_stage()` has no `expected_from_stage` parameter; a stale client move is applied against whatever the DB currently holds (row-locked, so concurrent moves serialize rather than corrupt, but the second mover's `from_stage` silently differs from what its UI last showed) — proven by a new test (`concurrent/stale transition policy`) rather than fixed, since changing the RPC signature is a design decision outside this audit's remit; flagged for explicit decision, not silently left undocumented. **change_source provenance**: `LeadsPatchRequestSchema.source` accepts only `"lead_detail" | "pipeline"` (Zod enum) and the DB check constraint accepts only `'pipeline' | 'lead_detail' | 'api'` — a browser can mislabel which UI surface it called from but cannot claim a privileged/automated provenance (`system`, `admin`, `ai_recommendation_accepted`, etc. are not in either allowed set and are rejected, now proven by test). **Mutation architecture**: already unified before this window — `updateLead()` (`lib/leads/server-provider.ts`) is the one code path both `PATCH /api/leads/[id]` (Lead detail) and the pipeline board's PATCH call route through; a status change always goes through `change_lead_stage()`, an owner-only patch never touches it — proven by the existing `server-provider.test.ts` case "routes every status change through the atomic change_lead_stage RPC, never a raw status update". **Substitution note**: no Docker in this environment, so this is PGlite (embedded real Postgres running the actual migration file, including the full local migration chain from `20260723_inquiry_backend.sql` through `20260814000000_leads_ingestion_workspace_fail_closed.sql`), not a literal `supabase db reset --local` — see § Environment limitations. NOT VERIFIED_END_TO_END: no authenticated browser click-through (no `.env.local`/Supabase credentials configured in this environment — see § Environment limitations), and the migration is not on hosted. Leads **list** (separate from pipeline) was already confirmed live/RLS-gated with no fixture fallback in a prior window; unchanged this window. |
| 3 | Lead context (lead detail update) | TESTED_LOCAL | Status/owner PATCH: Zod contract tests (`lib/command-center/contracts/leads-patch.test.ts`), RLS/grant integration tests A/B/E/F/H (`lib/leads/leads-update-rls.integration.test.ts`), provider source-surface tests (`lib/leads/server-provider.test.ts`) all pass locally. Migration `20260812000000_leads_update.sql` applied to hosted project `rsxdhwtprmuhzuocycxu` and confirmed recorded. **Lead-360 Activity — fixed and live-wired this window**: `lead-activity.tsx` previously called `useDemoState()` unconditionally regardless of the `live` prop, so the Lead detail Activity panel always showed demo/fixture data in live mode — a genuine fixture-leakage bug (the second of this kind found this session; see `pipeline-header.tsx` from a prior window). Fixed by routing through `resolveActivityPlane(live)` + `useLiveActivity(..., {kind:"lead", id})`, reusing the real `activity_events` table and `serverActivityProvider.list()`'s existing `record` roll-up (own events + events whose parent is this lead) — no second Activity system, no schema change needed. `GET /api/dashboard/activity` and the `useLiveActivity` hook gained an optional `kind`/`id` filter (additive, backward compatible). `ActivityPanel` gained an additive `connected` prop so Leads can opt into live rendering without changing Proposals' still-placeholder Activity behavior (`proposal-activity-view.tsx` untouched, out of scope). Regression test `app/dashboard/activity-surfaces.test.ts` updated for the new guard condition. **Lead-360 Tasks**: confirmed already live-wired from prior work (`NextActionCard` → `NextActionCardLive` → `useLiveTasks()`, generic across all record kinds including `"lead"`) — no changes needed. Full suite (2016 tests as of this window's re-audit) passes with these changes. NOT VERIFIED_END_TO_END: no authenticated browser click-through performed (see § Environment limitations), and full Lead-360 section audit (goal step 12) beyond Activity/Tasks not re-run this window. Do not read this row as covering CRM pipeline or Lead ingestion. |
| 4 | Transcript → CRM | NOT_STARTED | No transcript ingestion/route found. |
| 5 | AI pipeline recommendations | NOT_STARTED | Explicitly deferred per dependency order (goal step 17); only `/api/ai/copilot` (unrelated chat feature) exists. |
| 6 | Real calendar availability | NOT_STARTED | No calendar route/adapter found. |
| 7 | Calendar integration | NOT_STARTED | Same. |
| 8 | Meeting links | NOT_STARTED | Same. |
| 9 | Meeting reminders | NOT_STARTED | Same. |
| 10 | SMS/Twilio | NOT_STARTED | No Twilio integration found. |
| 11 | Email integration | NOT_STARTED | No provider adapter found; explicitly deferred (goal step 6/17: audit ingestion only, do not implement yet). |
| 12 | Intake wording | AUDITED | Copy referencing custom-software positioning found in `app/(public)/process/page.tsx`, `app/(public)/about/about-page-client.tsx` (pre-existing, not from this window). Not functionally re-verified this session. |
| 13 | Business/problem intake | AUDITED | Same evidence as row 12 — presence confirmed via grep only, not a full functional re-audit this window. |
| 14 | Custom-software positioning | AUDITED | Same as row 12/13. |
| 15 | Proposal ↔ lead | IMPLEMENTING | `app/dashboard/proposals/**` UI exists (templates, create, edit, preview views) but no `/api/proposals` route exists — demo/UI-only, not wired to a live lead record. |
| 16 | Transcript/context → proposal | NOT_STARTED | Depends on row 4 and row 15 backend, neither live. |
| 17 | Requirements extraction | NOT_STARTED | No AI extraction code found; depends on AI infra (row 5), deferred. |
| 18 | Proposal review/send | IMPLEMENTING | UI-only (`preview-view.tsx`, `builder-view.tsx`), no send/live-persistence backend. |
| 19 | Proposal web/PDF | IMPLEMENTING | Preview UI exists; no PDF export or public web-render route found. |
| 20 | Market pricing | NOT_STARTED | No pricing-data integration found. |
| 21 | Internal quote recommendation | NOT_STARTED | No quote-recommendation code found. |

## Backlog

- `LEAD_INGESTION_WORKSPACE_MISSING_FAIL_CLOSED` — **RESOLVED locally, not yet on hosted.** Fixed by
  `20260814000000_leads_ingestion_workspace_fail_closed.sql`: `submit_inquiry` now raises
  `inquiry_workspace_missing` (mapped to a 503, not a 500) instead of silently writing a NULL-workspace
  lead when the seeded `'codeoutfitters'` workspace can't be resolved. Proven by 8/8
  `lib/inquiry/server/inquiry-backend.pglite.test.ts` against the real migration SQL in embedded Postgres.
  Not pushed to hosted — awaiting explicit approval (see § New migrations pending approval).
- `LEADS_WORK_EMAIL_UNIQUENESS_NOT_WORKSPACE_SCOPED` (new, found during this window's dedup re-audit,
  goal step 20): `leads_work_email_key` is a plain `unique index on public.leads (work_email)`
  (`20260723_inquiry_backend.sql`), and `submit_inquiry`'s merge lookup (`select ... from public.leads
  where work_email = v_email for update`) is likewise global, not `(workspace_id, work_email)`-scoped.
  Not a live bug today — exactly one workspace exists in both local and hosted, so no cross-tenant
  collision can occur. Latent defect if a second workspace is ever created: workspace B could never
  ingest a lead with an email already used by workspace A, and a same-email inquiry would silently
  merge into workspace A's existing lead regardless of which workspace it was meant for. Left unfixed
  by deliberate choice — scoping the constraint is a schema decision bigger than this window's remit
  and is explicitly out of scope while the standing STOP CONDITION blocks starting Integration
  Foundation / multi-tenant work. Revisit before a second workspace is ever provisioned.

## New migrations pending approval (not pushed to hosted)

Per the standing instruction, neither migration below has been applied to hosted — both require
explicit approval before `supabase db push`:

- `supabase/migrations/20260813000000_leads_pipeline_stage.sql` — adds `change_lead_stage()` RPC +
  immutable `lead_stage_history` table (workspace-scoped RLS, select-only for `authenticated`). Local
  proof: 19/19 `lib/leads/pipeline-stage.pglite.test.ts` against the unmodified SQL in embedded Postgres
  (13 original + 6 added in this window's security re-audit: DB-derived `workspace_id`/`occurred_at`,
  forged `change_source` rejection, direct `UPDATE`/`DELETE` of history rejected, failure paths leave
  zero history rows, and a documented-not-fixed concurrency/stale-write test).
  No destructive DDL (new table + new function only, no column/type changes to existing tables). Grants
  audited: `EXECUTE` on `change_lead_stage` is `authenticated`-only (`revoke all ... from public` then a
  single `grant ... to authenticated`) — no `anon`, no bare `PUBLIC` exposure. `SELECT` on
  `lead_stage_history` is `authenticated`-only; no `INSERT`/`UPDATE`/`DELETE` grant exists for any
  non-superuser role, so the table is reachable for writes only through the `SECURITY DEFINER` function.
  `search_path` is explicitly `set search_path = public` on the function — no caller-controlled object
  resolution. The function bypasses RLS on `leads`/`lead_stage_history` (function-owner privilege, as
  every `SECURITY DEFINER` function does) but re-derives `workspace_id` from the locked `leads` row (never
  a parameter) and calls `is_workspace_member()` itself before any write — the RLS bypass reaches exactly
  the one row already authorized, nothing wider.
- `supabase/migrations/20260814000000_leads_ingestion_workspace_fail_closed.sql` — replaces
  `submit_inquiry()` to fail closed (raise, not silently write) when the seeded workspace can't be
  resolved. Local proof: 8/8 `lib/inquiry/server/inquiry-backend.pglite.test.ts`. `create or replace
  function`, same signature/grants/SECURITY DEFINER/search_path as the version already on hosted — no
  destructive DDL.

Both were verified via PGlite (embedded real Postgres running the literal migration file), not
`supabase db reset --local`, because Docker is not installed in this environment (see below). Both
migrations, in file order, apply cleanly as one chain from `20260723_inquiry_backend.sql` through
`20260814000000_leads_ingestion_workspace_fail_closed.sql` inside the pglite suites — the closest
available proxy for "reset from zero" without Docker. Hosted Advisor impact is unknown until pushed —
cannot be checked without pushing.

## Explicit non-inflation notes

- Row 1's Manual Add Lead sub-item is TESTED_LOCAL, not VERIFIED_END_TO_END or CODE_COMPLETE-only: real
  unit/contract/tsc checks passed AND real RLS/grant behavior was proven against the local Docker stack
  (not just source-surface assertions) — but no browser click-through was performed and the migration is
  not on the hosted project, so it stops short of VERIFIED_END_TO_END.
- Row 3 (Lead context) is TESTED_LOCAL, not VERIFIED_END_TO_END, solely because the DB/RLS/contract
  layer is proven — the browser-click-through and full 360 audit are still open.
- Rows 1 and 2 are NOT marked TESTED_LOCAL/VERIFIED_END_TO_END from row 3's work — per explicit user
  instruction, Lead detail PATCH passing tests does not imply ingestion or pipeline are proven.
- Rows 12-14 are AUDITED (existence confirmed) rather than CODE_COMPLETE/TESTED_LOCAL/VERIFIED_END_TO_END
  because this window did not run a functional re-audit against them — only a keyword grep.
- Row 1 is TESTED_LOCAL, not VERIFIED_END_TO_END, even though the fix is applied to hosted production and
  its source/grants/security posture verified live — because no authenticated browser click-through of the
  public inquiry form against hosted production was performed. Do not read this row as clearing the
  remainder of the Leads foundation (list re-audit, pipeline persistence, Lead-360, browser click-through)
  — those remain separately pending.
- Row 2 (CRM pipeline) is TESTED_LOCAL, not VERIFIED_END_TO_END, despite 13/13 RLS integration tests and
  a fully wired live UI — no authenticated browser click-through was performed and its migration is not
  on hosted. Do not read TESTED_LOCAL here as equivalent to production-proven.
- Three distinct environment limitations blocked VERIFIED_END_TO_END for every row this window, and none
  were worked around: (1) Docker is not installed, so `supabase db reset --local` could not literally run
  — PGlite (embedded real Postgres executing the unmodified migration SQL) was used as the closest
  available substitute, and is named as a substitute everywhere it was used, never conflated with the
  real command. (2) `GITHUB_PAT_TOKEN` returns 403 permission-denied, so the Leads branch could not be
  pushed or a PR opened. (3) No `.env.local` exists in the worktree (only `.env.example`), so no live
  Supabase backend (hosted or local) is reachable — a real headless Chromium browser was installed and
  confirmed working via Playwright this window, ruling out "no browser tooling" as the cause, but there
  is nothing live to point it at. None of these are fixed; the repository was not altered to work around
  them (no fabricated credentials, no skipped-then-claimed-passing steps).
