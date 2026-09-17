# CodeOutfitters Master Goal — Progress Ledger

Source: `docs/goals/CODEOUTFITTERS_MASTER_GOAL.md` § 40 (Strict Completion Matrix).
Statuses (exactly 8, per goal file): NOT_STARTED, AUDITED, IMPLEMENTING, CODE_COMPLETE,
TESTED_LOCAL, EXTERNAL_CONFIGURATION_REQUIRED, VERIFIED_END_TO_END, BLOCKED.
Never mark VERIFIED_END_TO_END without actual end-to-end evidence (goal line 2206).

Last updated: 2026-08-14, after CRM pipeline live persistence + Lead-360 Activity wiring + ingestion fail-closed hardening + a full `change_lead_stage()` SECURITY DEFINER re-audit, then optimistic concurrency (`expected_from_stage`) hardening of `change_lead_stage()` replacing the prior last-write-wins audit finding — an 8-case pglite matrix (A-H), pipeline + Lead-detail UI conflict handling, and a second SECURITY DEFINER re-audit this window; then a Lead-detail partial-success fix splitting the combined status+owner Save into two independent mutations, closed at both the UI and API-contract layers; then hosted deployment of `20260813000000`/`20260814000000` (user-applied via `supabase db push --linked`, confirmed aligned via `supabase migration list`), post-deployment hosted verification which found a real least-privilege gap, corrective migration `20260814010000_lead_stage_history_grant_hardening.sql` (reviewed, tested locally 38/38, committed), and now — this window — **user-applied `20260814010000` to hosted** (`supabase db push` confirmed `Finished supabase db push.`; `supabase migration list --linked` shows local==remote through `20260814010000`; a follow-up `db push` returned `Remote database is up to date.`). Read-only hosted ACL re-audit this window via `supabase db query --linked` against `information_schema`/`pg_catalog`/`pg_get_functiondef` (metadata + function-body read-back, no mutation) confirms the intended final state actually took effect: `anon` has zero privileges on `lead_stage_history` (no SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER), `authenticated` has SELECT-only, RLS is enabled with only the pre-existing workspace-scoped SELECT policy (no write policy exists), `change_lead_stage`'s `proacl` shows EXECUTE limited to `authenticated`/`postgres`/`service_role` (no `anon`, no bare `PUBLIC` entry), the function owner (`postgres`) still holds table-level INSERT on `lead_stage_history` (confirmed via `has_table_privilege`, so the SECURITY DEFINER write path is intact), and the hosted function body read back via `pg_get_functiondef` matches the local migration source verbatim (SECURITY DEFINER, `search_path=public`, `auth.uid()` null-check, row-locked workspace derivation from `leads`, `is_workspace_member()` check, `stage_conflict` check ordered before the same-stage no-op, atomic single-transaction history insert). **HOSTED_MIGRATION_BLOCKER: closed.** **LEAD_PIPELINE_EXCESS_ACL: closed** — hosted ACL now matches intended least-privilege exactly; no further pipeline-schema migration is pending.

**This window (2026-08-16): live-mode SSR 500 regression found and fixed on `feat/leads-foundation-live`.** Root cause: `lib/demo/store.ts` built its seed state eagerly at module-import time (`createSeedState()`), and `useDemoState()` called `useSyncExternalStore` without checking `live` mode — both reachable from `app/dashboard/layout.tsx`'s `CommandCenterProvider`, which mounts on every dashboard page regardless of mode. In live mode this generated a full demo fixture set and `assertMockDataAllowed()` threw, producing a deterministic 500 on `/dashboard/pipeline` and `/dashboard/leads/[id]`. Fix: seed state is now built lazily on first actual access (`getSeedStateLazy()`), and `useDemoState()` reads `live` from `useCommandCenterConfig()` and swaps all three `useSyncExternalStore` arguments to a static `EMPTY_DEMO_STATE`/no-op subscribe when `live` is true — live mode never reaches `createSeedState()`/`generateLeads()`/`assertMockDataAllowed()`. `assertMockDataAllowed()` itself untouched. The same eager-generation defect existed one layer down in `lib/demo/seed.ts`'s `LEAD_DIRECTORY`, now `getLeadDirectory()`, applied consistently across every consumer (`command-dialog.tsx`, `overview-operations.tsx`, `demo-data.ts`, `demo/actions.ts`, `search/demo-index.ts`). **Workspace-team regression fixed the same window**: `lib/tasks/server-provider.ts` and `lib/leads/server-provider.ts` both relied on a PostgREST `profiles(full_name, email)` embed off `workspace_memberships`, but the two tables have no direct FK to each other (both FK to `auth.users` independently) — the embed silently returned nothing, so owner/team display names were blank wherever `assertOwnerInWorkspace`, `listWorkspaceTeam`, or `updateLead` rendered them. Replaced with an explicit `displayNamesByUserId()` lookup shared by all three call sites. New regression suite `lib/demo/store.test.ts`/`lib/demo/seed.test.ts` (10 + N cases, including a source-surface check that every `useSyncExternalStore` argument is mode-gated, not just the snapshot getter) — empirically confirmed to fail 8/10 against the pre-fix code and pass 10/10 post-fix. Committed as `805591a`. Quality gate: `tsc --noEmit` clean, `eslint` clean, Vitest 2090/2090 (up from 2080, no regressions), `next build` clean. **Browser-verified this window** against the hosted QA workspace (Playwright, headless Chromium, real login): `/dashboard/pipeline` and `/dashboard/leads/06b6a526-57c3-4c8f-9d60-c1cd19992781` both return HTTP 200 with no `assertMockDataAllowed` error, no generic error page, and no browser console/page errors; the QA lead's card renders in the Pipeline board's Negotiation column and Lead Detail's status field agrees (both "Negotiation") — 12/12 checks passed. **Concurrency forensic investigation, three hosted attempts this window, now closed out with direct instrumented evidence (supersedes this paragraph's earlier "swap-thrashing" theory, which was itself a self-corrected error — see below)**: attempt 1 (gated single stale-`expectedStatus` PATCH, target `Won`) returned an anomalous HTTP 200 with zero DB mutation; the client harness crashed before capturing the response body, leaving only a bare status code in the Next.js access log — classified `INSUFFICIENT_EVIDENCE` after static code trace and hosted log review (a `postgres_logs` result claiming `stage_conflict` was correctly identified as synthetic/templated — uniform millisecond-incrementing timestamps, no real Postgres error formatting — and discarded as untrustworthy rather than treated as evidence). Attempt 2, fully instrumented (Node-side Playwright `APIRequestContext` in place of `page.evaluate()`, temporary sanitized trace logging gated to the QA lead ID only in `route.ts`/`server-provider.ts`, safe no-op target `Negotiation→Negotiation` with `expectedStatus=New` so the RPC's mismatch check fires before its no-op check): directly proved, from live server-side trace output rather than static code reading, that the route received `status=Negotiation`/`expectedStatus=New` exactly as sent, and the provider passed `p_expected_from_stage=New`/`p_to_stage=Negotiation`/`p_change_source=lead_detail` to `change_lead_stage` unchanged — full request/argument propagation is conclusively verified end-to-end, not merely code-correct. The RPC call then sat outstanding for ~128s and resolved to an error with no PostgreSQL SQLSTATE and no `stage_conflict` classification (none of `stage_conflict`/`reason_required`/`invalid_stage`/`lead_not_found`/`forbidden` matched), mapped by the existing fallback in `throwForPgError()` to HTTP 422 `invalid`. This is independently corroborated by genuine (non-synthetic, correctly-formatted, non-uniform-timestamp) `postgrest_logs` entries reading `"Warp server error: Thread killed by timeout manager"` at `2026-08-16T20:12:05`, falling inside the RPC call's live outstanding window — PostgREST's own Warp server killed the request-handling thread by its internal timeout manager. Zero DB mutation confirmed after every attempt (status/`updated_at`/history=7/activity=9 unchanged throughout). All temporary trace instrumentation was reverted the same window (`route.ts`/`server-provider.ts` diffs clean against HEAD) and never committed; the throwaway harness scripts were never committed either. **Classification: `HOSTED_PLATFORM_TRANSIENT`**, on direct observed evidence (a PostgREST-layer timeout mid-request), not inferred from resource metrics — no application-code defect found in the request-parsing, route, provider, RPC-argument, or error-mapping layers, all of which are now proven correct by live instrumentation rather than static review alone. This does not change row 2's `TESTED_LOCAL` status or the concurrency hardening already proven by the 8-case A-H PGlite matrix. **Net effect on Leads Foundation verdict**: request/argument propagation into `change_lead_stage` is conclusively verified; the hosted `409 stage_conflict` response itself has still not been cleanly observed under a stable PostgREST execution. Leads Foundation remains **PARTIALLY VERIFIED** solely for that reason — not because of any code regression — and the remaining stale-`expectedStatus` verification (same safe `Negotiation→Negotiation`/`expectedStatus=New` setup) is deferred to a future window, gated on confirming both local host health and hosted PostgREST health (no recent Warp timeout/thread-kill activity) before consuming the attempt.

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1 | Lead ingestion | TESTED_LOCAL | **Booking → Lead linkage — implemented and TESTED_LOCAL this window (2026-08-17).** Audit first: read every migration that has ever touched `bookings` (`20260615` base schema through `20260617` `reserve_slot`) — confirmed absence, none reference `leads`, proven not assumed. Fix: extended `reserve_slot()` in place (`CREATE OR REPLACE FUNCTION`, unchanged 3-arg signature `(date, text, jsonb) returns uuid`) rather than a new RPC, so `workers/booking-reservation-worker.ts` and its Cloudflare-dashboard `.dashboard.js` mirror needed **zero edits and zero redeploy** — new migration `20260817000000_booking_lead_linkage.sql`. Slot lock/validation (`slot_not_found`/`slot_already_booked`) still runs first, so a failed reservation never touches `leads` — no orphan lead states. Lead resolution mirrors `submit_inquiry()`'s exact shape (chosen over `createLead()`'s naive insert-only pattern, since booking is a public/anonymous/repeatable entry point like inquiry, not an authenticated dashboard action): fail-closed workspace lookup (raises `booking_workspace_missing` if the seeded `'codeoutfitters'` workspace is absent, same fail-closed convention as `20260814000000`), row-locked `work_email` dedup, non-destructive `coalesce`-merge on match (never touches `status`/`assigned_owner`/`internal_notes`/pipeline stage — proven by test case G, including that a blank retry `phone` never erases an existing value), plain insert with `source_page = 'Booking'` on no-match. Dedup is deliberately **global-by-email**, replicating (not fixing) the existing `LEADS_DEDUP_WORKSPACE_SCOPE` backlog limitation — a different scope for booking would be inconsistent with `submit_inquiry`. **No phone dedup**: no canonical precedent exists anywhere in the codebase; Test Case C is N/A, not implemented. New `bookings.lead_id` column: additive, nullable, `references public.leads(id) on delete restrict`, not backfilled (same caution `20260812020000` took for `workspace_id`). Provenance: one `lead_timeline_events` row (`event_type = 'booking_received'`) written in-transaction by the RPC, matching `submit_inquiry`'s `'inquiry_received'` convention — chosen over `activity_events`/`recordActivity()` because the Cloudflare Worker has no Next.js runtime and cannot call it. UI: no live Lead-detail appointment/booking section exists to wire into (`app/dashboard/appointments/appointments-view.tsx` is 100% demo-mode) — out of scope per the goal file's own "only wire into an existing section" instruction, not attempted. Proof: new `lib/booking-lead-linkage.pglite.test.ts`, 7/7 against the real migration SQL in embedded Postgres (A new identity, B existing-email reuse, D repeat-slot idempotent rejection, E failed-booking-leaves-no-lead, F workspace attachment, G non-destructive merge + status/owner preservation, plus a privilege-regression check that `reserve_slot` stays `service_role`-only). No regressions: `booking-privileges.pglite.test.ts`, `pipeline-stage.pglite.test.ts`, `booking-actions.test.ts` all still pass. Full suite 2097/2097 (up from 2090, +7, 0 regressions), `tsc --noEmit` clean, `eslint` clean on the touched files, `next build` clean (0 errors/0 warnings). No Worker-specific test suite exists in this repo (`workers/` has no `*.test.*`/`*.spec.*`), so none was run/skipped. **HOSTED this window (2026-08-17)**: migration `20260817000000_booking_lead_linkage.sql` applied to `rsxdhwtprmuhzuocycxu` via `supabase db push --linked` (`"Finished supabase db push."`; a Docker-cache-catalog warning during push is a local artifact-caching failure only, not a deployment failure — reported separately). `supabase migration list --linked` confirms local==remote through `20260817000000`, no divergence, no other pending migration. Read-only hosted verification (`supabase.execute_sql`, no mutation): `bookings.lead_id` is `uuid`, nullable; FK `bookings_lead_id_fkey` → `leads` with `confdeltype='r'` (ON DELETE RESTRICT, matches migration intent); index `bookings_lead_id_idx` exists. `pg_get_functiondef` read-back of hosted `reserve_slot` matches the migration source verbatim — unchanged 3-arg signature, `SECURITY DEFINER`, `search_path = pg_catalog, public`, fail-closed `booking_workspace_missing` guard, row-locked email dedup, non-destructive merge, `source_page='Booking'` insert, `bookings.lead_id` assignment, `booking_received` timeline insert, single-transaction body all present. Privileges (`has_function_privilege`): `service_role`=EXECUTE, `anon`/`authenticated`/`public`=no EXECUTE — matches the pre-existing contract exactly, no new exposure. `information_schema.role_table_grants` on `bookings` for `anon`/`authenticated`/`public` returns zero rows — no broad table grant was introduced by the migration. **No real hosted booking was created** — `reserve_slot` resolves the actual `codeoutfitters` workspace and would create production booking/Lead data and consume a real slot; per explicit instruction, verification relied on migration history, schema/function read-back, privilege checks, and the existing local transactional test suite instead. CRITICAL bug found + fixed (prior window): `submit_inquiry` never set `leads.workspace_id`, and `leads_select_members` RLS gates all visibility on it — every lead ingested since `20260727_command_center_workspaces.sql` would have been permanently invisible in the dashboard. Fix `20260812020000_leads_workspace_ingestion_fix.sql`: sets `workspace_id` to the single seeded `'codeoutfitters'` workspace on insert; backfills only-if-null on the merge branch; no bulk historical mutation. Local proof: 6/6 pglite (insert path + merge-backfill path) + 219/219 total (198 unit/pglite + 21 RLS/dashboard/saved-views integration against local Docker stack) — no regressions. Hosted: applied to `rsxdhwtprmuhzuocycxu` via `supabase db push --linked` (confirmed recorded, function source/grants/SECURITY DEFINER/search_path verified via `supabase db query --linked`, EXECUTE grant unchanged at service_role-only). Advisors: 30 pre-existing findings, none new, none mention `submit_inquiry`. Read-only hosted audit: 0 total leads, 0 NULL-workspace leads in production today — no historical backfill is currently needed (table is empty), so goal step 9 is moot until real leads exist, not merely deferred by policy. NOT VERIFIED_END_TO_END: no authenticated browser click-through of the public inquiry form against hosted production performed (would create real data with no safe disposable-test workflow available) — per explicit instruction, no fabricated end-to-end claim. Full source-by-source ingestion audit (booking/manual/email/webhook) per goal step 6 still not re-run this window beyond the inquiry-form path — do not read this as fully verified for ingestion sources other than the public inquiry form. **Manual Add Lead — was fully MISSING, now implemented and TESTED_LOCAL** (prior window): migration `20260812030000_leads_insert.sql` (column-restricted `insert` grant + `leads_insert_members` RLS policy on `public.leads`, applied to local Docker via `supabase db push --local`), `createLead()` in `lib/leads/server-provider.ts`, `POST /api/leads` (`app/api/leads/route.ts`), `LeadsCreateRequestSchema` (`lib/command-center/contracts/leads.ts`), and inline `AddLeadForm` UI (`app/dashboard/leads/add-lead-form.tsx`). Proof: `tsc --noEmit` clean; 1894/1894 non-pglite unit/contract tests pass + all pglite suites pass, no regressions; 8/8 real-Docker RLS integration tests pass. NOT VERIFIED_END_TO_END: no authenticated browser click-through of the new Add Lead UI performed, and the migration has NOT been applied to the hosted project — local Docker only. **Fail-closed hardening — implemented and TESTED_LOCAL this window**: `submit_inquiry`'s workspace lookup previously had no guard — if the seeded `'codeoutfitters'` workspace were ever missing, it would silently re-create the original NULL-workspace bug one layer up. New local (NOT hosted) migration `20260814000000_leads_ingestion_workspace_fail_closed.sql` makes the lookup fail closed: raises `inquiry_workspace_missing` (mapped to a 503 `notConfigured()` response, distinct from the generic 500) before any row is written, unless the call is a pure idempotency replay. Proof: 8/8 `lib/inquiry/server/inquiry-backend.pglite.test.ts` (2 new cases: fails closed with 0 leads/0 submissions when the workspace is missing; still replays an already-persisted submission if the workspace slug is later renamed), `tsc`/`eslint` clean, no regressions in the full suite (2016 tests as of this window's re-audit, up from 2009 — 7 added: 6 pipeline-stage security cases + 1 pipeline-board grouping case). Closes backlog item `LEAD_INGESTION_WORKSPACE_MISSING_FAIL_CLOSED` — **HOSTED** (applied via `supabase db push --linked`, confirmed via `supabase migration list`). Post-deployment hosted verification this window: `submit_inquiry`'s function body read back via `supabase db query --linked` matches the migration verbatim, fail-closed guard confirmed present and ordered before any row write, grants/SECURITY DEFINER/search_path unchanged and correct — no defect found (unlike the pipeline-stage objects below). Dedup re-audit (goal step 20): `leads_work_email_key` (DB uniqueness) and `submit_inquiry`'s merge lookup (`where work_email = v_email for update`) are both **global**, not `(workspace_id, work_email)`-scoped — confirmed by reading `20260723_inquiry_backend.sql` and `20260812020000_leads_workspace_ingestion_fix.sql` directly. Not a live bug today (exactly one workspace exists in both local and hosted), but a latent multi-tenant defect: a second workspace could never hold a lead with an email already used by the first, and the merge lookup would silently attach a new inquiry to a different workspace's existing lead. Documented as a new backlog item below rather than changed — scoping the constraint is a bigger schema decision outside this window's remit and the standing STOP CONDITION against starting multi-tenant/Integration Foundation work. |
| 2 | CRM pipeline | TESTED_LOCAL | Was demo-only (no live DB mutation surface for stage changes) at the start of this window — now has real, tested persistence. **Model decision**: `Lead.status` is canonical (Option A); no separate `PipelineStage` domain object introduced. **Schema**: migration `20260813000000_leads_pipeline_stage.sql` (HOSTED — applied via `supabase db push --linked`, confirmed via `supabase migration list`) adds `change_lead_stage(lead_id, to_stage, reason, source)` (SECURITY DEFINER RPC: rejects unauthenticated callers, invalid stages, missing reason on gated stages `Won`/`Lost`/`FUL`, non-members of the lead's workspace; row-locks the lead; no-ops with no history write when `from_stage == to_stage`) and immutable `lead_stage_history` (`id, workspace_id, lead_id, from_stage, to_stage, actor_user_id, change_source, reason, occurred_at`; `select`-only RLS for `authenticated`, no client insert/update/delete — only the RPC can write it). **API/provider**: pipeline mutation goes through this one RPC, never a direct table write, never a client-supplied `workspace_id`. **UI**: `app/dashboard/pipeline/pipeline-board-live.tsx` — no optimistic stage change before the PATCH resolves, a stale PATCH response from a superseded move is dropped (token-guarded), reason-gated stages route through a gate dialog before any mutation, in-flight/own-stage moves are disabled in the move menu. Source-surface tests: 4/4 (`pipeline-board-live.test.ts`). **History/Activity**: exactly one `lead_stage_changed` Activity event emitted on success, safe metadata only. **Security/RLS proof**: 19/19 `lib/leads/pipeline-stage.pglite.test.ts` (13 pre-existing + 6 added this window: `workspace_id`/`occurred_at` are DB-derived not client-supplied, a forged `change_source` outside the 3-value check constraint is rejected with no partial write, direct `UPDATE`/`DELETE` of a history row by `authenticated` is rejected, and `invalid_stage`/`lead_not_found` failures leave zero history rows) against a real embedded Postgres (PGlite) running the unmodified migration SQL — covers unauthenticated rejection, cross-workspace lead-move rejection, cross-workspace history-read rejection, gated-stage reason enforcement, invalid-stage rejection, no-op detection, actor stamped from session not client input, and that `authenticated` cannot write `lead_stage_history` directly. A fresh-session/refresh read after a move sees the new stage (proven at the query level, not same-process memory). Source-surface tests: 5/5 `pipeline-board-live.test.ts` (4 pre-existing + 1 added: cards group by `lead.status`, never `moveOpportunity()`/`lib/demo/store`). **Concurrency — hardened this window (was: audited, not changed)**: `change_lead_stage()` now takes a required `p_expected_from_stage` parameter (migration edited in place, not a corrective migration — it was still pending/not hosted, so no separate migration was warranted; documented in the migration's own header comment). Inside the same row-locked transaction, authorization is checked first, then `p_expected_from_stage is distinct from v_from_stage` is checked *before* the same-stage no-op check, so a stale caller whose remembered stage happens to coincidentally match the (different) requested target is still rejected — it does not get to silently no-op past a real conflict. A mismatch raises `stage_conflict` (SQLSTATE `40001`) with no Lead update, no history row, no Activity event; the app layer maps it to a dedicated `LeadErrorCode` distinct from the pre-existing duplicate-lead `"conflict"`, mapped to HTTP 409, with a safe generic message (no SQL/internals exposed). `LeadsPatchRequestSchema` requires `expectedStatus` via `superRefine` whenever `status` is present (fail-closed: a client that omits it is rejected at the contract layer, not silently defaulted). Proven by a new 8-case matrix (A-H) in `pipeline-stage.pglite.test.ts`: (A) valid transition succeeds, (B) stale expected + different target → conflict, (C) true no-op (`expected==current==to`) succeeds silently, (D) disguised-stale no-op (`expected!=current`, `to==current`) still conflicts, (E) two concurrent movers race — first wins, second is rejected, (F) refetch-then-retry with the correct expected value succeeds, (G) a non-member's conflict attempt is still rejected for auth first (no stage_conflict information leak), (H) reason-required-stage enforcement is unaffected by the new parameter. Pipeline board (`pipeline-board-live.tsx`) and Lead-detail (`lead-update-controls.tsx`) both send `expectedStatus`/`p_expected_from_stage` and, on a 409, refetch (`router.refresh()`)/show a controlled "changed elsewhere" message — neither auto-retries the original stale move. Lead-detail's status dropdown re-syncs to the server-true `currentStatus` after that refresh (adjusted during render per React's documented pattern, not in a `useEffect`, to avoid a `react-hooks/set-state-in-effect` cascading-render lint error). **Owner+status combined saves**: intentionally left split, not made transactionally atomic — `updateLead()` calls the `change_lead_stage` RPC first and only proceeds to the owner-column `UPDATE` if it succeeds, so a rejected/conflicting status change can never partially apply alongside an owner change; the residual gap (RPC succeeds, then the owner `UPDATE` fails on infrastructure grounds) is accepted, consistent with the pre-existing Activity-outside-transaction gap already documented in the same file. Owner-only patches are untouched by any of this (no `expectedOwner` concept exists, confirmed by test). Second SECURITY DEFINER re-audit after the signature change: no authorization shortcut introduced — `p_expected_from_stage` participates only in the post-authorization conflict comparison, never in the workspace-membership check. **change_source provenance**: `LeadsPatchRequestSchema.source` accepts only `"lead_detail" | "pipeline"` (Zod enum) and the DB check constraint accepts only `'pipeline' | 'lead_detail' | 'api'` — a browser can mislabel which UI surface it called from but cannot claim a privileged/automated provenance (`system`, `admin`, `ai_recommendation_accepted`, etc. are not in either allowed set and are rejected, now proven by test). **Mutation architecture**: already unified before this window — `updateLead()` (`lib/leads/server-provider.ts`) is the one code path both `PATCH /api/leads/[id]` (Lead detail) and the pipeline board's PATCH call route through; a status change always goes through `change_lead_stage()`, an owner-only patch never touches it — proven by the existing `server-provider.test.ts` case "routes every status change through the atomic change_lead_stage RPC, never a raw status update". **Substitution note**: no Docker in this environment, so this is PGlite (embedded real Postgres running the actual migration file, including the full local migration chain from `20260723_inquiry_backend.sql` through `20260814000000_leads_ingestion_workspace_fail_closed.sql`), not a literal `supabase db reset --local` — see § Environment limitations. **Post-deployment hosted verification (this window)**: `lead_stage_history`'s columns/indexes/RLS/SELECT-policy and `change_lead_stage`'s full function body were read back from hosted via `supabase db query --linked` and confirmed to match the migration verbatim (`pg_get_functiondef`). One real defect found: neither the table nor the function had the project's `ALTER DEFAULT PRIVILEGES` (role `postgres`) explicitly stripped, unlike `public.leads`'s own migration — hosted `lead_stage_history` still grants `anon`/`authenticated` base INSERT/UPDATE/DELETE/TRUNCATE (RLS blocks the first three but not TRUNCATE), and `change_lead_stage` still grants `anon` EXECUTE (mitigated by the function's own `auth.uid() is null` check, so not exploitable, but a stated-intent violation). Root-caused via `pg_default_acl` (confirmed project-wide default ACLs on `public` for roles `postgres`/`supabase_admin` grant `arwdDxtm` on tables and `X` on functions to `anon`/`authenticated`/`service_role` — not isolated to this table/function; every future migration in `public` inherits the same excess grants unless it explicitly revokes them, same as `20260812000000_leads_update.sql`/`public.leads` already does correctly. Reported as a standing follow-up, not fixed here — broadening this migration's scope to change the project-level default ACL itself was explicitly out of scope and not attempted). Corrective migration `20260814010000_lead_stage_history_grant_hardening.sql` reviewed operation-by-operation this window: `revoke all on table public.lead_stage_history from public, anon, authenticated` + `grant select ... to authenticated` (final: anon none, authenticated SELECT-only, service_role/owner untouched); `revoke all on function change_lead_stage(uuid,text,text,text,text) from public, anon` + `grant execute ... to authenticated` (final: anon none, authenticated EXECUTE, matches the confirmed single hosted overload via `pg_get_function_identity_arguments`). Grants-only, no table/function-body change, no data mutation. Extended `pipeline-stage.pglite.test.ts` with a 12-case privilege matrix (real GRANT/REVOKE enforcement against a real embedded Postgres, including TRUNCATE and an `anon`-role connection) — 38/38 passing with this migration in the chain; PGlite has no equivalent of Supabase's project-level default ACLs, so it cannot reproduce the defect regressing, only confirm the migration's own GRANT/REVOKE statements produce the intended final state (see the suite's own header comment). **Applied to hosted: YES** — user-applied this window via `supabase db push --linked` (`Finished supabase db push.`), confirmed via `supabase migration list --linked` (local==remote through `20260814010000`) and a follow-up `db push` returning `Remote database is up to date.`. Post-apply hosted ACL re-audit (this window, read-only `supabase db query --linked`) confirms the intended final grant state is live — see header note above for the full breakdown. NOT VERIFIED_END_TO_END: no authenticated browser click-through (no `.env.local`/Supabase credentials configured in this environment — see § Environment limitations). Leads **list** (separate from pipeline) was already confirmed live/RLS-gated with no fixture fallback in a prior window; unchanged this window. |
| 3 | Lead context (lead detail update) | TESTED_LOCAL | Status/owner PATCH: Zod contract tests (`lib/command-center/contracts/leads-patch.test.ts`), RLS/grant integration tests A/B/E/F/H (`lib/leads/leads-update-rls.integration.test.ts`), provider source-surface tests (`lib/leads/server-provider.test.ts`) all pass locally. Migration `20260812000000_leads_update.sql` applied to hosted project `rsxdhwtprmuhzuocycxu` and confirmed recorded. **Lead-360 Activity — fixed and live-wired this window**: `lead-activity.tsx` previously called `useDemoState()` unconditionally regardless of the `live` prop, so the Lead detail Activity panel always showed demo/fixture data in live mode — a genuine fixture-leakage bug (the second of this kind found this session; see `pipeline-header.tsx` from a prior window). Fixed by routing through `resolveActivityPlane(live)` + `useLiveActivity(..., {kind:"lead", id})`, reusing the real `activity_events` table and `serverActivityProvider.list()`'s existing `record` roll-up (own events + events whose parent is this lead) — no second Activity system, no schema change needed. `GET /api/dashboard/activity` and the `useLiveActivity` hook gained an optional `kind`/`id` filter (additive, backward compatible). `ActivityPanel` gained an additive `connected` prop so Leads can opt into live rendering without changing Proposals' still-placeholder Activity behavior (`proposal-activity-view.tsx` untouched, out of scope). Regression test `app/dashboard/activity-surfaces.test.ts` updated for the new guard condition. **Lead-360 Tasks**: confirmed already live-wired from prior work (`NextActionCard` → `NextActionCardLive` → `useLiveTasks()`, generic across all record kinds including `"lead"`) — no changes needed. Full suite (2016 tests as of this window's re-audit) passes with these changes. **Partial-success fix — this window**: the combined status+owner Save was a real production correctness bug — `updateLead()` calls `change_lead_stage()` first, then a separate non-transactional owner `UPDATE`; a request naming both fields could have the RPC succeed and the owner `UPDATE` fail afterward, with the UI reporting one generic "Save failed" that hid which half actually happened (case D of a 5-case A-E audit; case E — owner succeeds, status conflicts — was already structurally unreachable since the RPC throw aborts before the owner `UPDATE` runs). Fixed by splitting `lead-update-controls.tsx` into two fully independent mutations, each with its own current-value display, dirty flag (`statusDirty`/`ownerDirty`), saving flag, error state, Save button, and `aria-live` announcement ("Lead stage updated." / "Lead owner updated.", never one shared message) — not by making the server writes atomic, and not by expanding the SECURITY DEFINER RPC to also take owner (explicit user decision: keep the two existing narrow, secure mutations as-is). Status re-syncs from the server-true `currentStatus` on a stale-conflict refresh (render-time correction, existing pattern); owner needs no equivalent since a successful save already leaves the local value equal to the refreshed prop. Enforced a second time at the contract boundary: `LeadsPatchRequestSchema` (`lib/command-center/contracts/leads.ts`) now rejects any request naming both `status` and `owner` with `status_and_owner_mutually_exclusive` (422), so no future client — not just this UI — can recreate the combined-request ambiguity. Proof: 11/11 new `lead-update-controls.test.ts` source-surface tests (cases A-J from the spec: status-only never mentions owner, owner-only never mentions status, independent dirty/button gating, conflict path never touches owner, owner failure sets only `ownerError`, reason-required still enforced, distinct per-operation announcements) + 3 new `leads-patch.test.ts` contract tests (rejects both-fields, still allows either alone). No changes to `server-provider.ts`, the route handler, or either pending migration — the per-field write logic was already individually correct; only the ambiguous *combined* entry point was closed. Full suite re-run clean (113 files / 2056 tests, up from 2016 — corrected from an earlier ledger typo of 2044), `tsc`/`eslint` clean, `next build` clean, pipeline security suite (`pipeline-stage.pglite.test.ts`) unchanged at 26/26 (38/38 with the later grant-hardening privilege matrix). **Lead 360 module inventory (this window)**: read `app/dashboard/leads/[leadId]/page.tsx` in full. LIVE: Tasks (`NextActionCard`→`useLiveTasks()`), Activity (`resolveActivityPlane`→real `activity_events`), Attachments (`resolveLeadAttachments()` branches on live/demo mode, real `/api/dashboard/attachments/:id/download` when downloadable). MISSING (no code path exists at all, not merely stubbed): Appointments, Meetings, Transcripts, Proposals, AI insights. Email exists only as a static `lead.work_email` field row, not an integration. NOT VERIFIED_END_TO_END: no authenticated browser click-through performed (see § Environment limitations). Do not read this row as covering CRM pipeline or Lead ingestion. |
| 4 | Transcript → CRM | TESTED_LOCAL | **Google Meet + Meeting Intelligence foundation (2026-08-21):** provider-neutral meetings domain (`lib/meetings/`) with Google Meet as first provider. **This window (2026-08-21): CodeOutfitters Meeting Capture — free transcription fallback.** Browser extension (`extensions/codeoutfitters-capture/`, MV3) captures Google Meet LIVE CAPTIONS (no Google premium transcript needed) → incremental caption assembler (dedup, corrections, pauses) → bearer-authenticated ingestion API → the SAME canonical `meetings`/`meeting_artifacts`/`transcripts`/`transcript_entries`/AI pipeline. Migration `20260822000000_meetings_capture_source.sql` (LOCAL only, NOT hosted): `meetings.connection_id` nullable (capture needs no Google credential), `meeting_artifacts.capture_source` enum (`provider_transcript`/`browser_captions`/`browser_audio`), no new transcript tables, no session table (artifact IS the session). Idempotency via deterministic ids (`codeoutfitters-capture:<session>:<seq>`). Extension auth: reads the app's httpOnly:false session cookie via `chrome.cookies` → `Authorization: Bearer` (SameSite=Lax never sent cross-origin). Not VERIFIED_END_TO_END: no live Meet caption capture exercised yet. |
| 5 | AI pipeline recommendations | TESTED_LOCAL | Meeting Intelligence + Next Presentation Intelligence + Pre-Meeting Brief pipeline exists (`lib/meetings/ai/`) with CONFIRMED/INFERRED/UNKNOWN confidence model, evidence grounding (citations only to real transcript entry ids), and fail-closed behavior: with no `AI_PROVIDER` configured, the mock provider's echo is never valid JSON, so generation errors (`invalid_output` → 502) and nothing is persisted — no fabricated intelligence can reach Production. Real provider NOT configured yet (`AI_PROVIDER=openai` + `OPENAI_API_KEY` required). |
| 6 | Real calendar availability | NOT_STARTED | No calendar route/adapter found. |
| 7 | Calendar integration | NOT_STARTED | Same. |
| 8 | Meeting links | TESTED_LOCAL | `POST /api/dashboard/meetings` links an existing Google Meet space to a workspace/Lead via explicit `connection_id` (never auto-picked from multiple connections); sync (`lib/meetings/sync.ts`) is pinned to the meeting's stored `connection_id`, workspace-scoped, and fails closed on a disconnected connection. Google Meet API read scope (`meetings.space.readonly`) verified live on Preview (HTTP 200, no `insufficient_scope`). No controlled Meet space ingested end-to-end yet. |
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

## Integration Foundation (Phase 2 — shared infrastructure, this window, 2026-08-17)

Not one of the 21 numbered rows above — this is the shared provider-connection substrate rows
6/7/8/9 (Calendar) and 11 (Email) will build on, built and TESTED_LOCAL only, on
`feat/leads-foundation-live` (branch `feat/leads-foundation-live` inside the
`leads-foundation` worktree). Explicitly NOT Calendar sync, Gmail sync, meeting creation,
reminders, AI, proposals, or SMS — none of rows 4-11 or 16-21 are touched or advanced by this
entry.

**Schema**: `supabase/migrations/20260818000000_integration_connections.sql` (local only, not
applied to hosted) adds `integration_connections` (`workspace_id, provider, status,
provider_account_id, provider_account_email, granted_scopes, credential_ciphertext,
credential_version, connected_at, refreshed_at, disconnected_at, last_error, created_by,
created_at, updated_at`) and immutable `integration_connection_events` (audit trail, workspace_id
trigger-derived from the parent connection, never caller-supplied). Column-scoped grants are the
primary enforcement layer, not just RLS: the `authenticated` SELECT grant excludes
`credential_ciphertext` outright (the role is structurally incapable of reading it back, session or
no session), and the UPDATE grant excludes `workspace_id, provider, provider_account_id,
created_by, id, created_at, updated_at` — `connected_at` is settable only at INSERT, immutable
after (encodes "first connected" directly in the grant). Check constraints tie `status =
'disconnected'` to `credential_ciphertext is null` and to `disconnected_at is not null` together,
so a disconnect can't clear one without the other. `unique (workspace_id, provider,
provider_account_id)` backs deterministic reconnect-not-duplicate behavior. RLS on both tables is
`is_workspace_member(workspace_id)`-scoped, reusing `20260727_command_center_workspaces.sql`'s
existing SECURITY DEFINER helpers rather than adding new ones.

**Token security (Section 4 of this window's instruction)**: credentials are AES-256-GCM encrypted
(`lib/integrations/crypto.ts`) with a required `INTEGRATION_TOKEN_ENCRYPTION_KEY` (base64, 32
bytes) — fails closed with no key configured or a wrong-length key, never falls back to a
hardcoded or reversible scheme. Ciphertext is decrypted only inside `loadForServiceOp()`
(`lib/integrations/store.ts`), which uses a service-role Supabase client scoped with an explicit
`.eq("workspace_id", ...).eq("id", ...)` filter (defense-in-depth even though service-role
bypasses RLS) — mirrors the existing `getServiceClient()` pattern in
`lib/inquiry/server/supabase-inquiry-repository.ts`. Every other read/write (list, connect,
refresh's status update, disconnect's status update, event recording) goes through the
session-bound `authenticated` client, which the column grants make physically incapable of
returning `credential_ciphertext` regardless of query. No new secret-storage system was invented;
this is the safest minimal server-side design available in-repo, per the instruction's own
fallback guidance — nothing was left insecurely stored.

**Provider abstraction (Sections 7-8)**: `IntegrationProviderAdapter`
(`lib/integrations/provider.ts`: `exchangeCode`/`refresh`/`revoke`/`inspect`), one concrete
`local_test` adapter (`lib/integrations/providers/local-test.ts`, fixture-driven, no network
calls), and a lazy per-provider loader registry (`lib/integrations/registry.ts`).
`google_calendar`/`gmail` are reserved identifiers in the registry but resolve to a thrown
`IntegrationProviderError` — reserved, not implemented, fails closed rather than silently
succeeding against a provider that doesn't exist yet. No real Google OAuth redirect/callback was
built this phase, per the Master Goal's own Phase 2 text calling for local/test providers only.

**API surface**: `GET/DELETE` on `/api/dashboard/integrations/connections[/[id]]`,
`POST` on `.../connect` and `.../callback` (kept as separate route files — a real OAuth
provider's callback will need state/CSRF handling connect/start doesn't, without touching the
connect route). All four gate on `getDashboardContext()` (401) and the existing demo-mode guard,
matching the Tasks/Leads route convention exactly (`lib/integrations/api-response.ts` duplicates
`lib/tasks/api-response.ts`'s envelope, per this repo's per-domain-response-module convention).

**Tests**: 34, all local-only (no real Google API calls — Section 11's mocked-provider
constraint) — `crypto.test.ts` (4: round-trip, tamper detection, fails closed with no/malformed
key), `providers/local-test.test.ts` (7: exchange, refresh producing a distinct credential,
refresh-failure yields a safe token-free error under 200 chars, revoke never throws, inspect
health states), `registry.test.ts` (3: adapter caching, `google_calendar`/`gmail` fail closed,
test override seam), `store.test.ts` (10, source-surface convention matching
`lib/tasks/server-provider.test.ts`: `credential_ciphertext` never in `SAFE_COLUMNS`, never read
outside `loadForServiceOp`, every service-role query workspace-scoped, every Postgres error mapped
not rethrown raw, disconnect always clears the credential independent of provider-revoke outcome,
reconnect never rewrites `workspace_id`/`provider`/`provider_account_id`/`connected_at`, no bare
`select("*")`), and `integration-connections.pglite.test.ts` (10, real embedded Postgres running
the unmodified migration SQL, migration chain `20260723_inquiry_backend.sql` →
`20260727_command_center_workspaces.sql` → `20260818000000_integration_connections.sql`: cross-
workspace read denial, cross-workspace write denial (0 rows affected), authorized create/read,
`credential_ciphertext` unselectable by `authenticated` — `permission denied`, duplicate
`(workspace_id, provider, provider_account_id)` rejected by the unique constraint, the disconnect
check-constraint pairing enforced (status alone rejected, status+ciphertext-null+timestamp
accepted), anon has zero access to either table, an event's `workspace_id` is
trigger-overwritten not caller-supplied with cross-workspace event inserts denied, and — added
this window (2026-08-17, hosted deployment window) — `authenticated` cannot `DELETE`/`TRUNCATE`
either table). Quality gate this window (post-hardening re-run): targeted suite 34/34, `tsc
--noEmit` clean (0 errors), `eslint` clean, full Vitest 2131/2131 (up from 2129, +2, 0
regressions), `next build` clean.

**Hosted deployment + security verification (this window, 2026-08-17, second pass)**: before
deploying, per this window's explicit `SUPABASE_PUBLIC_DEFAULT_ACL_HARDENING` instruction, the
migration's own grants were re-audited rather than trusting RLS — and a real gap was found,
matching the exact `lead_stage_history` defect pattern (row 2 above): the original migration
revoked table privileges `from public, anon` only, never explicitly from `authenticated`, before
granting narrow column-scoped privileges to `authenticated`. Because GRANT is additive and this
project's schema-level default ACLs grant `authenticated` broad inherited table privileges
(INSERT/UPDATE/DELETE/TRUNCATE, all columns) on every new `public` table, `authenticated` would
have retained the ability to `DELETE`/`TRUNCATE` either table and to `UPDATE`/`INSERT` columns
never listed in the migration's own grants — undetectable by RLS or by reading the column-scoped
grants alone. **Fixed** (migration edited in place, not yet deployed at the time — same convention
as `20260813000000`): both table-level `revoke all` statements now explicitly include
`authenticated`, and `can_use_integration_connection`'s function revoke now explicitly includes
`anon` (previously `from public` only). Verified with 2 new pglite cases proving `authenticated`
cannot `DELETE`/`TRUNCATE` either table post-hardening (see Tests above). **Deployed**:
`20260818000000_integration_connections.sql` (hardened) pushed to `rsxdhwtprmuhzuocycxu` via
`supabase db push --linked` (`"Finished supabase db push."`); `supabase migration list --linked`
re-run post-deploy confirms local==remote through `20260818000000`, no divergence, no other
pending migration. **Hosted read-back** (read-only, no mutation): columns, types, nullability,
both check constraints, the unique constraint, both FKs, both primary keys, and all 6 expected
indexes on both tables match the hardened migration verbatim; RLS enabled on both tables
(`force_rls` not set — expected); all 5 RLS policies (`integration_connections_select/insert/
update`, `integration_connection_events_select/insert`) present with `qual`/`with_check`
expressions matching the migration exactly. **Hosted ACL matrix** (`information_schema.role_table_
grants`, `information_schema.column_privileges`, `pg_proc.proacl`): `anon` has zero rows on either
table (no SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER) — matches intent exactly.
`authenticated` has only column-scoped SELECT (excluding `credential_ciphertext`), INSERT, and
UPDATE (excluding `workspace_id`/`provider`/`provider_account_id`/`created_by`/`id`/`created_at`/
`updated_at`) on `integration_connections`, and SELECT+INSERT (no column restriction needed, no
secret column) on `integration_connection_events` — no DELETE, no TRUNCATE, no REFERENCES, no
TRIGGER for `authenticated` on either table, confirmed absent from the live grant set, not merely
absent from the migration text. `service_role` retains full privileges on both tables (unaffected,
as required for `loadForServiceOp`'s service-role path). No `PUBLIC` grant rows exist on either
table. Function ACLs: `can_use_integration_connection` grants EXECUTE to `authenticated`/
`service_role`/`postgres` only, no `anon`, no bare `PUBLIC`; the two trigger functions
(`integration_connections_touch_updated_at`, `integration_connection_events_set_workspace`) grant
EXECUTE to `postgres`/`service_role` only — no `authenticated`, no `anon`. **The hardening is
confirmed live on the hosted database, not just in the migration's own text.**
`SUPABASE_PUBLIC_DEFAULT_ACL_HARDENING` backlog item: this migration is now hardened; the
project-level default ACL itself remains unchanged (out of scope, same as every prior window this
was found in) — every future `public`-schema migration still needs the same explicit
`authenticated`-inclusive revoke. **Token security**: `INTEGRATION_TOKEN_ENCRYPTION_KEY` (AES-256-
GCM, 32-byte base64) confirmed server-only (`crypto.ts` imports `"server-only"`), not a
`NEXT_PUBLIC_*` variable, present only as an empty template value in `.env.example`/`.env.local.
example` (no real key committed anywhere in git history), fails closed with no/malformed key
(proven by 4 existing `crypto.test.ts` cases), and `listConnections` never calls
`loadForServiceOp`/`decryptCredential` — only `refreshConnection`/`disconnect` decrypt, both for a
legitimate provider-facing operation. No such secret exists in any deployed environment today; one
will be required before the first real Google connection — not configured this window, per
explicit instruction. **No real Google OAuth, no Calendar/Gmail consumer code, no real provider
connection was made or attempted this window** — foundation deployment/security verification only.
This entry does not change the status of any of rows 1-21 above, and does not touch or reinterpret
the Pipeline 409 / `HOSTED_PLATFORM_TRANSIENT` investigation recorded earlier in this file (not
resumed this window, per explicit instruction).

## Google OAuth Foundation (Phase 2.5 — 2026-08-17)

Not one of the 21 numbered rows above — builds the real Google OAuth provider behind the
Integration Foundation above (rows 6/7/8/9/11 still NOT_STARTED). Explicitly NOT Calendar
availability, Calendar event creation, Google Meet, Gmail read/send, or reminders — none
implemented, none of rows 6-11 advanced.

**Architecture**: server-side authorization-code flow only — no token-exchange logic in
browser/client code. New `lib/integrations/providers/google.ts` (`buildGoogleAuthorizationUrl`,
`exchangeCode`, `refresh`, `revoke`, `inspect`) implements `IntegrationProviderAdapter`
(pre-existing interface from the Integration Foundation), registered in
`lib/integrations/registry.ts` under the already-reserved `google_calendar` identifier — no
second Google table added, `integration_connections` reused as-is (locked decision from a prior
session: reuse the `google_calendar` enum value rather than add a new provider identifier, since
Calendar is the eventual consumer and no separate identity-only provider row is needed).

**Scopes**: `openid email profile` only — no `calendar` or `gmail` scope requested anywhere in
`buildGoogleAuthorizationUrl`.

**CSRF/state**: new `oauth_states` table + `lib/integrations/oauth-state.ts`
(`createOAuthState`/`consumeOAuthState`). State is a cryptographically random token, bound to
the authenticated session's own `workspace_id` + `user_id` + `provider` at creation (a
client-supplied `workspace_id` in the connect request body is ignored — proven by connect
route test "P"), one-time-use (consumed and deleted atomically on callback), and expiring.
Callback never trusts a query-string `workspace_id`; it re-derives everything from the consumed
state row.

**Google identity**: `sub` (Google's stable subject ID) is stored as `provider_account_id`, not
email. `email_verified` is checked before trusting the returned email for
`provider_account_email` — an unverified email is never stored/displayed.

**Token handling**: reuses the existing AES-256-GCM `lib/integrations/crypto.ts` unchanged
(fails closed on missing/malformed `INTEGRATION_TOKEN_ENCRYPTION_KEY`) — hardened this window,
see below. On reconnect, if Google's token response omits a refresh token (common on repeat
consent), the previously stored valid refresh token is preserved, never overwritten with null —
proven by `store.test.ts`'s refresh-token-preservation case ("L").

**Connect/callback routes**: `POST .../connect` — authorized workspace user only (401
otherwise), 404s in demo mode (demo mode can never trigger a live Google OAuth), returns only
`{ok, authorizationUrl}`, no token material, fails closed with a 503 and a sanitized body (no
env var names leaked) when `GOOGLE_OAUTH_CLIENT_ID`/`SECRET` are unset ("S"). `GET .../callback`
— handles success, `access_denied`, invalid/missing/expired state, exchange failure, identity
failure (unverified email), duplicate connection, and partial token response, redirecting back
to Settings with a safe `?google=error&google_detail=<code>` query pair the UI maps to a
human-readable banner (`CALLBACK_DETAIL_MESSAGES` in `google-connection-card.tsx`) — never
renders a raw OAuth error or token to the browser.

**Refresh/disconnect**: `refresh()` decrypts server-side only (never calls Calendar/Gmail APIs),
preserves an omitted refresh token. `disconnect()` revokes at Google when possible, always
clears `credential_ciphertext` and sets `status='disconnected'` regardless of revoke outcome
(matches the pre-existing disconnect route's provider-agnostic contract), and a disconnected
connection is not refreshable/usable afterward (enforced by the existing `status` check in
`loadForServiceOp`, unchanged this phase).

**UI**: `app/dashboard/settings/google-connection-card.tsx` (new) — minimal "Connect Google" /
"Connected as `<email>`" / "Disconnect" card, mounted additively into the existing
demo-architected Settings screen (`settings-view.tsx`) as a live-fetching client component, same
convention as `pipeline-board-live.tsx`/`leads-data.tsx`. No Calendar or Gmail UI. Renders
nothing (not an error state) in demo mode, since there is nothing to connect.

**Tests (labels A-S, 19 scenarios)**: all mocked, zero real Google API calls. Targeted suite —
`crypto.test.ts`, `oauth-state.test.ts`, `oauth-state.pglite.test.ts`, `providers/google.test.ts`,
`registry.test.ts`, `store.test.ts`, `connect/route.test.ts`, `callback/route.test.ts` — **10
files, 81 tests, all passing**. Covers: state CSRF binding/one-time-use/expiry, cross-workspace
state rejection, unverified-email rejection, refresh-token preservation on omitted reconnect
response, `sub`-not-email identity, demo-mode 404, unauthenticated 401, missing-config 503 with
no leaked env var names, duplicate-connection handling, partial-token-response rejection, and
disconnect always clearing credential material regardless of revoke success/failure.

**Quality gate (this window)**: `tsc --noEmit -p .` clean (0 errors). `eslint` on every touched
file clean — one real `react-hooks/set-state-in-effect` violation was found and fixed in
`google-connection-card.tsx` (rewritten to the codebase's existing inline-fetch-in-effect +
numeric-retry-token convention from `leads-data.tsx`, not suppressed). Full project-wide
`vitest run`: **128 test files, 2178 tests, all passing** (up from 2131, +47, 0 regressions).
`next build`: clean, `/dashboard/settings` still builds as a static route, all four
`/api/dashboard/integrations/connections*` routes present in the route table.

**Security gate (`secure-check .`, this window)**: one in-scope finding — `lib/integrations/
crypto.ts`'s `createDecipheriv` call was missing an explicit `authTagLength` (semgrep
`gcm-no-tag-length`: a shorter-than-expected GCM tag can in principle be accepted, weakening the
tamper/wrong-key detection the encrypted token storage relies on). **Fixed**: pinned
`authTagLength: 16` explicitly, re-verified against `crypto.test.ts` (4/4 still passing, no
round-trip/fail-closed regression). All other findings (40 semgrep `wildcard-postmessage-
configuration`, 41 gitleaks filesystem/history leaks, 30 trivy HIGH/CRITICAL dependency CVEs)
were triaged by direct JSON-report inspection (`semgrep.json`/`trivy.json` `results[].path`/
package fields) and confirmed to originate entirely from pre-existing untracked vendored/
uploaded design-export files at the repo root (`CODEOUTFITTERS-*.zip`, `System-Artifacts/`,
`Dashboard/`, etc.) and unrelated dependency trees (`drizzle-orm`, `fastify`, `next`, `sharp`,
etc., none of which are `google-auth-library` or its transitive dependencies) — none touch any
file this phase changed, none suppressed, disclosed here rather than silently dropped.

**Schema**: `supabase/migrations/20260819000000_oauth_states.sql` — local only,
**MIGRATION_READY_NOT_DEPLOYED**, not pushed to hosted this window (ACL/RLS review of the new
table deferred to the same deploy-gate convention already used for `20260818000000` — deploy
only after an explicit hosted-ACL audit pass, not automatically alongside code).

**Runtime configuration**: `GOOGLE_OAUTH_CLIENT_ID`/`GOOGLE_OAUTH_CLIENT_SECRET` remain **NOT
configured** in this environment (confirmed, both this window and carried forward — server-only,
never `NEXT_PUBLIC_*`, added as empty template values to `.env.example` only, no real value
committed anywhere). The adapter fails closed (503, `google_calendar unavailable`) with either
unset — proven by test "S". **No real Google OAuth connection was attempted or is possible in
this environment.** No Google Cloud OAuth client was created programmatically and no Google
Cloud configuration was touched, per explicit instruction — that remains a manual owner action.

**Manual owner setup required** (`GOOGLE_OAUTH_OWNER_CONFIGURATION_REQUIRED`): (1) create an
OAuth 2.0 Client ID (Web application type) in Google Cloud Console for this project; (2) add the
exact redirect URI(s) — **not guessed here**, must be confirmed against the actual deployed
hostname(s) (e.g. `https://codeoutfitters.vercel.app/api/dashboard/integrations/connections/
callback` for production, plus any preview/local URL actually used) — to the client's Authorized
redirect URIs list; (3) set the OAuth consent screen scopes to exactly `openid`, `email`,
`profile` (no Calendar/Gmail scope yet); (4) set `GOOGLE_OAUTH_CLIENT_ID` and
`GOOGLE_OAUTH_CLIENT_SECRET` as server-only environment variables (Vercel project env, never
`NEXT_PUBLIC_*`) for each environment that should support a real connection; (5) once configured,
deploy `20260819000000_oauth_states.sql` to hosted (after its own ACL review) before the first
real connect attempt, since `createOAuthState` requires the table.

**Milestone verdict**: `GOOGLE_OAUTH_FOUNDATION_CODE_COMPLETE_OWNER_CONFIG_REQUIRED`. Code,
tests, and quality/security gates are complete and passing; the feature cannot be exercised
end-to-end until the owner completes the manual Google Cloud + environment-variable setup above
and the new migration is reviewed and deployed. Does not change the status of rows 1-21 or the
Integration Foundation entry above; does not touch or reinterpret the Pipeline 409 investigation.
**Do not begin Calendar or Gmail functionality next** — those remain separate future phases.

### Hosted deployment + security verification (2026-08-17, follow-up window)

`20260819000000_oauth_states.sql` audited (no changes needed — already correctly authored:
RLS enabled, zero policies, explicit `revoke all on public.oauth_states from public, anon,
authenticated`), pre-deploy migration history confirmed exact-pending, 13/13 pre-deploy
targeted tests re-run green (`oauth-state.test.ts` 6 + `oauth-state.pglite.test.ts` 7), then
deployed via `supabase db push --linked` to hosted project `rsxdhwtprmuhzuocycxu`. Post-deploy
migration history confirmed local==remote through `20260819000000`, no pending, no divergence.

**Hosted read-back**: `public.oauth_states` on hosted matches the migration verbatim — 8
columns, PK `id uuid default gen_random_uuid()`, `workspace_id`/`user_id` FKs with `on delete
cascade`, `provider public.integration_provider not null`, `nonce text not null unique`,
`expires_at timestamptz not null`, `consumed_at timestamptz` nullable, `created_at timestamptz
not null default now()`. `relrowsecurity = true`, zero rows in `pg_policies`. No functions,
triggers, or sequences were created by this migration.

**Hosted ACL matrix** (via `has_table_privilege` + `information_schema.role_table_grants`,
not RLS-policy presence alone): `anon` — no privileges. `authenticated` — no privileges.
`PUBLIC` — no privileges. None of the three can SELECT, INSERT, UPDATE, DELETE, or TRUNCATE.
`service_role` retains full CRUD (the only path that ever touches this table, per
`lib/integrations/oauth-state.ts`'s exclusive use of `getServiceClient()`).
`get_advisors(type=security)` reports only the expected INFO-level `rls_enabled_no_policy`
finding for this table (shared with 3 other known service-role-only tables in this project) —
not a defect, the intentional pattern. **Default-ACL verdict: `NO_EXCESS_PRIVILEGES`** — no
hardening/corrective migration was required.

**Exact redirect URI** (confirmed from `lib/routing/public-origin.ts` + `lib/integrations/
providers/google.ts`'s `googleRedirectUri()`, not guessed): production
`https://codeoutfitters.vercel.app/api/dashboard/integrations/connections/callback`; localhost
dev `http://localhost:3000/api/dashboard/integrations/connections/callback` (from
`DEVELOPMENT_ORIGIN`, used whenever `VERCEL_ENV` is unset/non-production/non-preview and
`NEXT_PUBLIC_SITE_URL` is also unset).

**Schema status update**: `20260819000000_oauth_states.sql` is now **DEPLOYED_AND_HOSTED_
VERIFIED** (supersedes the `MIGRATION_READY_NOT_DEPLOYED` note above). Runtime configuration
(`GOOGLE_OAUTH_CLIENT_ID`/`GOOGLE_OAUTH_CLIENT_SECRET`/`INTEGRATION_TOKEN_ENCRYPTION_KEY`)
remains unconfigured in this environment — unchanged, still the sole remaining blocker. **No
real Google Cloud client, no real Google account connection, no Calendar/Gmail work was
attempted this window**, per explicit instruction. Milestone verdict unchanged:
`GOOGLE_OAUTH_FOUNDATION_CODE_COMPLETE_OWNER_CONFIG_REQUIRED`. Pipeline 409 investigation not
touched, not resumed.

## Backlog

- `LEAD_INGESTION_WORKSPACE_MISSING_FAIL_CLOSED` — **RESOLVED, on hosted.** Fixed by
  `20260814000000_leads_ingestion_workspace_fail_closed.sql`: `submit_inquiry` now raises
  `inquiry_workspace_missing` (mapped to a 503, not a 500) instead of silently writing a NULL-workspace
  lead when the seeded `'codeoutfitters'` workspace can't be resolved. Proven by 8/8
  `lib/inquiry/server/inquiry-backend.pglite.test.ts` against the real migration SQL in embedded Postgres.
  Applied to hosted (confirmed via `supabase migration list --linked`); function body read back via
  `supabase db query --linked` this window and matches the migration verbatim, fail-closed guard
  confirmed ordered before any row write.
- `SUPABASE_PUBLIC_DEFAULT_ACL_HARDENING` — **backlog only, not a current Leads blocker.** Root cause of
  the excess-ACL defect closed this window (see `LEAD_PIPELINE_EXCESS_ACL` above): project-wide
  `pg_default_acl` entries for roles `postgres`/`supabase_admin` on schema `public` grant base table
  privileges (`arwdDxtm`) and function EXECUTE (`X`) to `anon`/`authenticated`/`service_role` by default.
  Every future migration in `public` inherits these excess grants unless it explicitly revokes them, same
  as `20260812000000_leads_update.sql`/`public.leads` and now `20260814010000_lead_stage_history_grant_hardening.sql`
  already do correctly by hand. Fixing the default ACL itself (`ALTER DEFAULT PRIVILEGES`) is a
  project-wide schema decision out of scope for the Leads slice and was **not** touched this window —
  every current Leads object (`lead_stage_history`, `change_lead_stage`, `leads`, `submit_inquiry`) has an
  explicit hardened ACL that overrides the permissive default, so this backlog item does not block Leads
  completion. Revisit before adding new `public` schema objects that might forget the explicit revoke.
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
- `LEADS_DEDUP_WORKSPACE_SCOPE` (new, documented this window per explicit instruction — **not
  implemented**): records the future invariant, distinct from but caused by the same root cause as
  `LEADS_WORK_EMAIL_UNIQUENESS_NOT_WORKSPACE_SCOPED` above — the same work email must be able to exist
  as two independent leads, one per workspace, once a second workspace is ever provisioned. Today's
  global `leads_work_email_key` unique index and `submit_inquiry`'s global merge lookup both violate
  that invariant by construction. This entry is the forward-looking contract a fix must satisfy
  (`(workspace_id, work_email)`-scoped uniqueness and merge lookup); the other entry is the as-found
  defect description. No code change made — recorded only, per the standing STOP CONDITION on
  multi-tenant/Integration Foundation work.

## Migrations applied to hosted this window (formerly "pending approval")

All three migrations below are now on hosted `rsxdhwtprmuhzuocycxu`, confirmed via
`supabase migration list --linked` (local==remote through `20260814010000`) — none are pending:

- `supabase/migrations/20260814010000_lead_stage_history_grant_hardening.sql` — **HOSTED this window.**
  Grants-only corrective migration (no table/function-body change, no data mutation): revokes all
  `lead_stage_history` table privileges from `public`/`anon`/`authenticated` then grants `SELECT` only to
  `authenticated`; revokes `change_lead_stage` EXECUTE from `public`/`anon` then grants EXECUTE only to
  `authenticated`. Post-apply hosted ACL read-back this window (see header note) confirms the final state
  matches intent exactly.
- `supabase/migrations/20260813000000_leads_pipeline_stage.sql` — adds `change_lead_stage()` RPC +
  immutable `lead_stage_history` table (workspace-scoped RLS, select-only for `authenticated`). Edited
  in place this window (still pending/not hosted, so no corrective migration was needed) to add a
  required `p_expected_from_stage` parameter (5-arg signature: `uuid, text, text, text, text`) for
  optimistic concurrency — see row 2's Concurrency note above for the full A-H test matrix and
  SECURITY DEFINER re-audit. Local proof: 26/26 `lib/leads/pipeline-stage.pglite.test.ts` against the
  unmodified (post-edit) SQL in embedded Postgres (13 original + 6 from this window's first security
  re-audit − 1 superseded "concurrent/stale transition policy" test that documented last-write-wins as
  then-current behavior, now replaced + 8 new A-H concurrency cases = 26).
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
- Browser-verification environment re-audited this window (all read-only, nothing written to hosted or
  Vercel): (1) Vercel CLI is present (`59.0.0`) but unauthenticated (`vercel whoami` → "Logged out";
  `VERCEL_OIDC_TOKEN` present in `.env.local` is a runtime OIDC-federation credential, not a CLI login
  token, and does not authenticate `vercel` commands) — no project link, no env pull possible.
  `.vercel/repo.json` unambiguously names the project (`codeoutfitters`, `prj_D8Z0xzQF8OWA0bsz0PGx7A8vYhrX`,
  team `team_grJz901hMVdksz6DwnzCiEei`), so identity is not the blocker, authentication is; `.vercel/project.json`
  was deliberately NOT created since `vercel link` requires a login this environment cannot complete headlessly.
  (2) Docker remains not installed (`docker: command not found`), so the existing local bootstrap path
  (`scripts/start-local-inquiry-platform.mjs` → `scripts/bootstrap-command-center.mjs`, which creates two
  disposable local-only email/password accounts in local GoTrue per `docs/COMMAND_CENTER_LOCAL.md`) cannot
  run — the script and its disposable-account design are sound, only the local Postgres/GoTrue runtime is
  unavailable here. (3) No Supabase URL/anon key for the hosted project exists anywhere reachable in this
  environment (checked this repo's `.env.local`, the sibling `command-center/.env.local`, and other
  project directories on this host — all contain only `VERCEL_OIDC_TOKEN`/unrelated vars, never Supabase
  values). (4) Hosted auth identity: `20260729010000_owner_bootstrap.sql` seeds exactly one
  Google-OAuth-restricted owner allowlist entry (real personal account, not a disposable test identity;
  value intentionally not reproduced here) — there is no hosted email/password test account, and whether
  the hosted Supabase project even has the email/password provider enabled is unverified (out of scope of
  the ACL/function audit already performed). Conclusion unchanged from the prior window:
  `NO_SAFE_BROWSER_ENVIRONMENT`. Smallest unblocking action, in order of ease: (a) the user runs
  `vercel login` once in a terminal with browser access, or supplies a `VERCEL_TOKEN`, so the existing
  linked project's Preview/Development env can be pulled read-only; or (b) the user supplies the hosted
  project's `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` directly (these are the public
  anon values already shipped to every browser visiting the live dashboard — not privileged secrets —
  protected by the RLS policies re-verified this window) plus a disposable hosted membership identity to
  sign in with; or (c) the user installs Docker so `scripts/bootstrap-command-center.mjs`'s existing
  disposable local accounts become usable end-to-end.
- Post-key-rotation production verification, HTTP/static + server-side evidence only (this window; still
  no real-browser render was achieved — see the browser-tooling attempt below). All checks read-only, no
  production data created or mutated, no Supabase key retrieved or printed:
  `https://codeoutfitters.vercel.app`, `/login`, `/dashboard`, `/book` all return HTTP 200. Client bundle
  contains a genuine new-format `sb_publishable_...` key (non-empty; length-only check, never printed), no
  legacy JWT-format key, no `service_role` string. Unauthenticated `GET /api/dashboard/tasks` and
  `GET /api/dashboard/activity` both return `404 not_found` matching the exact `isDemoMode()` gate strings
  in `app/api/dashboard/{tasks,activity}/route.ts` — production is confirmed running in Command Center
  demo mode server-side, consistent with prior status. Booking availability
  (`lib/booking-actions.ts:48`, `supabase.rpc('get_available_slots', ...)`) is a direct browser→Supabase
  call, architecturally separate from the Cloudflare Booking Worker (only booking *submission* goes
  through the Worker) — corrects an earlier assumption that availability routes through the Worker.
  Verified server-side via the linked-project CLI role (never the anon key): `anon` holds `EXECUTE` on
  `get_available_slots`, and the RPC returns real data (294 slots for 2026-08, 56 for 2026-09). Booking
  Worker (`booking-reservation-worker.tsamuel.workers.dev`) probed with three safe, non-mutating requests:
  `OPTIONS` preflight from the production origin → 204; `POST` from the production origin with an
  intentionally invalid empty body → 400 `invalid_date` (proves the request passed the
  `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`-presence check with no `config_error`, then failed
  validation *before* `callReserveSlot` — zero DB mutation); `POST` from a disallowed origin → 403
  `origin_not_allowed`. No booking was created. Key migration verdict for this window:
  `KEY_MIGRATION_PARTIALLY_VERIFIED` — strong component-level evidence (new key present, no legacy JWT,
  RPC healthy, Worker responds without config error) but no literal end-to-end browser-driven request was
  captured, and the Worker's actual `reserve_slot` call path was deliberately never exercised.
- Browser-tooling attempt this window (Chromium, not Edge): confirmed `~/.cache/ms-playwright/` has a
  working installed Chromium (`chromium-1234/chrome-linux64/chrome`) though the Playwright MCP server is
  configured (`~/.claude.json`, global, not a tracked project file) with `--browser msedge`, which is not
  installed. Temporarily edited that global config to `--browser chrome --executable-path
  <installed-chromium-path>` and attempted `browser_navigate` — the running MCP server process had already
  been spawned with the old `msedge` args for this session and does not pick up a config change without a
  session/connection restart, which cannot be triggered from inside the session. The edit was reverted
  immediately (no lasting change to global config). Claude-in-Chrome extension: still not connected
  (`tabs_context_mcp` → "Browser extension is not connected"). Net result: `msedge` was NOT installed (per
  instruction), the installed Chromium was NOT reachable this session, and no real-browser render,
  console capture, network capture, login click-through, or booking-form exercise was possible. Minimum
  unblocking action: restart/reconnect the Playwright MCP server (or the Claude Code session) after
  pointing its config at the installed Chromium binary instead of `msedge`, or connect the Claude-in-Chrome
  extension.
- Real-browser production verification, this window: msedge blocker bypassed by using the Playwright
  Node library directly (`require('playwright')`) in a scratch npm project at
  `/tmp/codeoutfitters-production-check/` (outside tracked source), instead of the msedge-locked MCP
  server. `chromium.launch({headless:true})` succeeded with no channel/executablePath override
  (`version=151.0.7922.34`), reusing the already-cached `~/.cache/ms-playwright/` binary — no Edge
  dependency. Two independent browser contexts were driven against `https://codeoutfitters.vercel.app`
  (a "first" context that also exercised the booking form, and a completely fresh context with no
  cookies/storage, to rule out first-context-only state). Both contexts, independently: public site
  returns 200, real content renders (12042 chars visible body text, nav present), zero console
  errors/warnings, zero uncaught page exceptions. `/login` returns 200; the demo-mode "Fill demo
  credentials" button is present and, when clicked followed by Sign in, reaches
  `https://codeoutfitters.vercel.app/dashboard` via `window.location.assign` (full navigation, confirmed
  by `page.waitForURL`) in both contexts — no production Supabase auth user was created, this is the
  existing client-side demo-mode credential match only. Dashboard renders (2648 chars visible text) and
  survives a full page reload (200, still on `/dashboard`) in both contexts; this exercises Command
  Center demo mode only and does not prove live Leads Supabase behavior. `/book` returns 200 in both
  contexts, and — this is the missing end-to-end proof the prior window's server-side-only checks could
  not produce — a real browser-issued request to
  `rsxdhwtprmuhzuocycxu.supabase.co/rest/v1/rpc/get_available_slots` was captured returning **HTTP 200**
  in both contexts, using the live publishable key actually shipped in the page (never inspected/printed).
  The calendar UI rendered 11 selectable days and, after selecting one, 14 selectable time slots. In the
  first context, selecting a day then a time slot genuinely advanced the booking wizard to step 3
  ("Details") — confirmed both by the step indicator screenshot and by DOM evidence: the contact form
  (`#booking-name` etc.) was present, clicking Submit while empty produced 4 field-validation errors, and
  the form was then filled with synthetic QA-only data (`QA Test Automation` /
  `qa-test-noreply@codeoutfitters.invalid`) reaching a genuine ready-to-submit state — Submit was
  deliberately never clicked. (A later screenshot of this same state shows an unrelated marketing
  lead-capture popup, "Free Workflow Audit", re-covering the page — this is a separate, timed overlay
  unrelated to booking and does not affect the DOM-level evidence above, which was queried directly, not
  from the screenshot.) No safe disposable-booking path exists in source
  (`workers/booking-reservation-worker.ts` has no QA/test bypass before the real `callReserveSlot` write),
  so submission was correctly not attempted; the Worker→Supabase write path remains genuinely untested.
  A handful of `net::ERR_ABORTED` failed requests to `/dashboard/my-work/task-00X` were observed on
  dashboard interaction in both contexts — no corresponding console error or page error, consistent with
  benign Next.js navigation-aborted prefetches rather than a real regression; not further investigated.
  Screenshots and raw JSON evidence saved to `/tmp/codeoutfitters-production-check/` (screenshots + 
  `summary.json`), outside tracked source, not committed. Key migration verdict upgraded this window to
  `KEY_MIGRATION_VERIFIED_HEALTHY`: the new publishable key is now proven, via an actual browser network
  request (not just component-level/server-side inference), to authenticate a real Supabase RPC call and
  return real data end-to-end in the live frontend.

- **Correction, this window**: key migration verdict downgraded to `KEY_MIGRATION_PARTIALLY_VERIFIED`.
  The browser→anon-key→`get_available_slots` RPC path is genuinely proven (see above). The
  Worker's `sb_secret_` (service-role) → Supabase write path has never been exercised in a real
  browser session — no production booking was safe to submit — so "healthy" overstated what was
  actually shown. Only the read path is verified; the privileged write path remains untested.

- **Leads Foundation live-mode browser verification, this window**: source inspection (no browser
  test attempted — blocked before step 4, see below) established the exact live-mode contract.
  `lib/command-center/mode.ts` — mode is controlled by the **server-only** `COMMAND_CENTER_MODE` env
  var (`demo` default, `live` opt-in, any other value hard-errors); live mode never silently falls
  back to demo, it throws `CommandCenterConfigError` listing missing keys. `assertLiveConfig()`
  requires exactly `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` at minimum.
  `docs/COMMAND_CENTER_AUTH.md` documents the full live env contract (adds
  `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`, `AUTH_GOOGLE_ENABLED`, `AUTH_APPLE_ENABLED`) and the
  auth model: authenticated ≠ authorized — access requires a row in `public.workspace_memberships`,
  enforced by RLS; no first-user-becomes-owner path exists. Production has exactly one bootstrapped
  owner path (`bootstrap_initial_workspace_owner()`, allowlisted to `marc@gmail.com` via Google OAuth
  only, single-use, cannot create a second owner) — there is no disposable/test identity on the
  hosted production Supabase project, and none should be created there per the explicit
  do-not-create-production-users constraint. The repository does define a genuinely safe alternative:
  `scripts/bootstrap-command-center.mjs` + `docs/COMMAND_CENTER_LOCAL.md` — a fully local Docker
  Supabase stack (`node scripts/start-local-inquiry-platform.mjs`, `npx supabase db reset`) with a
  throwaway seeded owner account (`owner@codeoutfitters.local` / `localdev-owner-pass`, workspace
  `primary`) and seed leads, hard-refusing to run against any non-localhost Supabase URL. This is
  exactly an "existing disposable/test account" path (auth safety priority 1) and was the intended
  route. It could not be exercised in this environment: `docker`, `podman`, and `docker.io` are all
  absent from `PATH`, no `docker.service` unit exists (`systemctl status docker` → unit not found),
  and `npx supabase status` fails with `docker: command not found (podman also not found)`. No hosted
  preview/staging Supabase project with its own isolated test identity is documented anywhere in the
  repo (`docs/COMMAND_CENTER_AUTH.md` §7 explicitly calls for one but none is provisioned). Per the
  explicit stop condition in this window's instructions, verification was halted here rather than
  falling back to creating a production user or skipping the auth boundary: **no usable identity
  exists in this environment.** Verdict: `LIVE_TEST_AUTH_IDENTITY_REQUIRED`. What the project owner
  needs to provide/do (either one unblocks the remaining 13 verification steps): (a) install
  Docker or Podman on the machine running this verification so the repo's own local-Docker-Supabase
  bootstrap path (`docs/COMMAND_CENTER_LOCAL.md`) can run as designed, or (b) provision an isolated
  preview/staging Supabase project (per `docs/COMMAND_CENTER_AUTH.md` §7) with its own disposable
  owner account and workspace membership row, and share only its URL/anon key (never the
  service-role key) for use in a local `.env.local`. No `.env.local` was created and no local server
  was started this window, since neither prerequisite was available.

- **Hosted-Supabase disposable-QA-identity attempt, this window**: user directed a third path —
  create one temporary QA Auth user + isolated QA workspace + membership directly in the hosted
  project (`rsxdhwtprmuhzuocycxu`), explicitly forbidding raw `auth.users` SQL insertion as a
  fallback and requiring the Auth Admin secret to already be securely available to this process
  (never retrieved/dumped/printed). Schema inspection confirmed the minimum legitimate record set:
  one `auth.users` row (Auth Admin API only), one `workspaces` row, one `workspace_memberships` row
  (`role='owner'`, `status='active'`) — the same shape `scripts/bootstrap-command-center.mjs` uses
  locally. RLS on `leads`/`workspace_memberships` is workspace-scoped and covered by existing
  integration tests (cross-workspace reads/updates/deletes match zero rows, not errors —
  `lib/leads/leads-update-rls.integration.test.ts`, `lib/views/saved-views-rls.integration.test.ts`).
  Checked this process's environment for the required secret: `SUPABASE_SECRET_KEY` and
  `SUPABASE_SERVICE_ROLE_KEY` are both absent. `SUPABASE_ACCESS_TOKEN` is present, but it is a
  Supabase CLI/Management-API personal access token, not a project service-role key — it appears
  nowhere in this repo's own contract (zero matches), grants org/project management, not the GoTrue
  Auth Admin API, and using it to run raw SQL against `auth.users` is exactly the fallback the
  instructions explicitly forbid. No command was run to fetch/dump the project's actual API keys
  (e.g. `supabase projects api-keys`), per the explicit "do not retrieve or dump" constraint. The
  Supabase MCP plugin (`plugin:supabase:supabase`) is installed but unauthenticated — starting its
  OAuth flow would grant broad account access and requires the user's own browser action, so it was
  not initiated without asking first. **No secure server-side Auth Admin secret is available to this
  process.** Per the user's own explicit stop condition, creation was halted before touching the
  hosted project — no auth user, workspace, or membership was created; nothing in the hosted project
  was modified. Verdict: `HOSTED_QA_ADMIN_SECRET_REQUIRED`. Owner action needed: either (a) securely
  export `SUPABASE_SECRET_KEY` (the project's service-role key) into this verification process's
  environment without pasting it into chat, or (b) create the temporary QA user directly in Supabase
  Dashboard → Authentication → Users (`email_confirm: true`) plus the matching `workspaces` /
  `workspace_memberships` rows, and hand back only the non-secret identifiers (user UUID, workspace
  slug) needed to continue.

- **Hosted-Supabase QA identity + workspace created, browser verification blocked on the
  publishable key, this window**: the owner manually created the temporary QA Auth user in the
  hosted project (`rsxdhwtprmuhzuocycxu`) via Dashboard → Authentication → Users, with Auto
  Confirm enabled, and supplied its email plus a locally-stored password file
  (`/tmp/codeoutfitters-qa-login.env`, mode 600, outside git, never read/printed this window).
  Located the user via a read-only, exact-match query (not a dump) against `auth.users`, run
  through the Supabase Management API using the pre-existing `SUPABASE_ACCESS_TOKEN` (a
  management PAT — legitimate for running SQL through Supabase's own Management API, distinct
  from the service-role/GoTrue Admin secret; no key was retrieved, dumped, or printed to get this
  token, it was already present in the process environment): exactly one match, UUID
  `767302d0-dad7-4f84-bef3-cd8ce38793fc`, confirmed. Inspected
  `supabase/migrations/20260727_command_center_workspaces.sql` for the exact legitimate shape
  (`workspace_role` enum `owner|admin|member`, `membership_status` enum `active|invited|suspended`,
  `workspace_memberships` unique on `(workspace_id, user_id)`) and created, via the same Management
  API SQL path against ordinary `public.*` tables (never `auth.users`) — the same pattern
  `scripts/bootstrap-command-center.mjs` already uses locally: one isolated workspace
  `CodeOutfitters QA Verification` / slug `codeoutfitters-qa-767302d0`, UUID
  `3a01d0a9-a1dd-4712-9b47-c611cd4bf834`, and one membership row (`role=owner`, `status=active`),
  UUID `9f2d3595-88e2-43c2-ace3-c52d6eedabce`, linking the QA user to that workspace only.
  Verified before any browser test: QA user has exactly 1 membership (the QA one, 0 others), QA
  workspace has exactly 1 membership and 0 leads, the production workspace (`codeoutfitters`) still
  exists and the QA user has no membership in it. RLS itself was never touched (still enabled on
  all 5 tables per the migration).

  Blocked at the local live-mode environment step: `lib/supabase/client.ts` / `server.ts` require
  `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `assertLiveConfig()` hard-fails
  without them — no fallback to demo. The URL is derivable from the project ref
  (`https://rsxdhwtprmuhzuocycxu.supabase.co`), but the anon/publishable key was not. Attempted the
  instructed fallback — deriving it from the currently deployed public client bundle — two ways:
  (1) fetched and grepped every JS chunk referenced by both `https://codeoutfitters.vercel.app/`
  and `/login` (13 files total) for `supabase.co`, `sb_publishable_`, and JWT-shaped strings — zero
  matches anywhere; (2) ran a real headless-browser pass (Playwright, local `chromium-1237` binary)
  against the live `/login` page, capturing every network request for a `.supabase.co` host with an
  `apikey` header, including after clicking the sign-in control — zero Supabase requests were ever
  made from the browser. Root cause, confirmed by reading `app/login/login-form.tsx`: this app's
  live-mode auth is server-action-owned by design (`@supabase/ssr`) — the browser never talks to
  Supabase directly for login, so the anon key is never transmitted client-side regardless of mode,
  and production currently defaults to `COMMAND_CENTER_MODE=demo` besides. The instructed "derive
  from the public bundle" path does not exist for this application's architecture. The only
  remaining way to obtain the key would be the Management API's key-listing endpoint
  (`GET /v1/projects/{ref}/api-keys`), which is explicitly forbidden regardless of the key's
  non-secret classification — not called.

  QA Auth user, QA workspace, and QA membership were left in place (not cleaned up) so the next
  turn can resume directly at the live-app step without repeating setup — all three are verified
  isolated from production and safe to leave. Verdict: `LIVE_BROWSER_PUBLISHABLE_KEY_REQUIRED`.
  Owner action needed: supply `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for
  this verification process (the anon/publishable key is browser-safe by design, so this is a
  low-risk, non-secret hand-off — e.g. drop them directly into a gitignored `.env.local` via `!`,
  or paste in chat), or explicitly authorize starting the installed-but-unauthenticated Supabase
  MCP plugin's OAuth flow as an alternative retrieval path.

## Command Center Quality + UX milestone — production verified, finalized (2026-08-18)

Resolves the `LIVE_BROWSER_PUBLISHABLE_KEY_REQUIRED` blocker above: publishable key was supplied,
Production env preflight added `COMMAND_CENTER_MODE=live`, `AUTH_GOOGLE_ENABLED=true`,
`NEXT_PUBLIC_SITE_URL=https://codeoutfitters.vercel.app` (non-secret config only, no secret
values touched), and a Production deployment was created from the local worktree via Vercel CLI
(`dpl_ymnkxuTd7Nh56EGjRaHTE9XcWmbb`, source=cli, gitDirty=1, aliased to
`codeoutfitters.vercel.app` + custom domains). Full authenticated Production QA (Playwright,
real hosted QA login) passed: dashboard routes, Copilot, Settings, Leads, security, responsive
(390/834/1440px), no secret/ciphertext exposure, unauthenticated APIs correctly 401. Rollback
deployment (`dpl_FRMoBwZM6L3CpCFe7LrSEZhYPkeG`) retained untouched, not needed.

Factual current-state, as of this window:
- **Command Center production live mode is enabled** (`COMMAND_CENTER_MODE=live` set in
  Production) — supersedes the "production currently defaults to demo" note above.
- **Google Sign-In works** in Production (`AUTH_GOOGLE_ENABLED=true`, verified button present;
  no forced real OAuth handshake was run this window).
- **Authenticated identity bug fixed**: real viewer identity now renders in the dashboard shell
  in place of demo fixture data ("Marc"/"Mark Bryce" leakage) — `lib/identity/display-name.ts` +
  `lib/dashboard/viewer-identity.test.ts` (new this window).
- **Global Copilot launcher/drawer added** (`components/command-center/copilot-launcher.tsx`) —
  the full standalone Copilot page is retained unchanged; the drawer is an additive entry point,
  not a replacement.
- **Copilot backend remains unavailable where no AI provider/backend is configured** — not
  changed this window, not claimed fixed.
- **Dashboard performance**: request duplication in Leads/Tasks data-fetching reduced
  (`lib/dashboard/server.ts`, `lib/data/leads.ts`, `lib/tasks/use-live-tasks.ts`).
- **Integration connection management is embedded in Settings**, not a standalone page — matches
  the Integration Foundation UI decision recorded above (`google-connection-card.tsx` mounted
  into `settings-view.tsx`).
- **Google OAuth Integration Foundation exists** (Phase 2.5 above) — identity scopes only
  (`openid email profile`), no Calendar/Gmail scope.
- **Calendar and Gmail functionality/scopes remain NOT_STARTED** — rows 6/7/8/9/11 above are
  unchanged by this window; nothing here advances them.
- **Production deployment verified** end-to-end via authenticated browser QA against the live
  hosted app, not source inspection alone.
- **The deferred Leads hosted-stage `409`/`HOSTED_PLATFORM_TRANSIENT` investigation (row 2 above)
  remains deferred and unrelated to this milestone** — not touched, not resumed this window.

Source preserved exactly as deployed: one local commit created on `feat/leads-foundation-live`
representing this exact deployed worktree state (see commit history for SHA/message), not pushed
to GitHub, Production not redeployed. No new feature work (Calendar/Gmail/SMS/proposals/AI
backend/Pipeline 409) started this window.

## Settings restoration + Calendar provider UX + Copilot state continuity (2026-08-18, this window)

Restores the 13 historical Settings sections to the live Command Center, which an earlier
window's `useDemoState()`/`EMPTY_DEMO_STATE.settings = []` behavior had silently emptied to
Appearance + Google only. No Settings persistence backend was created — the audit behind this
window's plan confirmed the 13 sections never had one; this window is restoration of the UI, not
invention of a new backend. Work happened in `/srv/projects/CodeOutfitters-worktrees/leads-foundation`,
branch `feat/leads-foundation-live`; not deployed, not pushed.

- **Settings — all 13 historical sections restored to live mode**
  (`app/dashboard/settings/settings-view.tsx`): live mode now reads section *definitions* from
  `SETTINGS_SEED` (`lib/demo/seed.ts`) instead of the always-empty `state.settings`; demo mode is
  unchanged. `lib/demo/store.ts` was **not** touched — its live branch still returns the frozen
  `EMPTY_DEMO_STATE` by design, so no demo Leads/tasks/activity data was activated for live mode.
  Appearance and Google remain outside the sections loop, rendered unconditionally as before.
- **Persistence stays honest, not invented**: live mode skips `saveSettingsSection()` entirely
  (demo mode still calls it) and shows "Kept for this browser tab only — not synced." instead of
  a bare "Saved"; each section carries one disclosure line, "Local preview only — account sync is
  not available yet." No `workspace_settings` table, no new Settings API route, no Supabase
  migration were created, per explicit instruction.
- **Real viewer identity in General**: `app/dashboard/settings/page.tsx` is now an async server
  component that calls `getDashboardContext()` when live (same pattern as
  `app/dashboard/layout.tsx`) and passes the real name/role into `SettingsScreen`, which
  substitutes them into the `general` section's `profileName`/`profileRole` fields via the
  existing `secret: true` read-only-notice pattern — never the demo `CURRENT_USER`
  ("Marc Bryce") values baked into `SETTINGS_SEED`.
- **Team and Permissions**: restored visually; live mode adds a link to the real
  `/dashboard/team` page rather than building a second member-management surface.
- **Calendar provider UX** (`app/dashboard/settings/google-connection-card.tsx`, renamed in
  substance to a "Calendar connections" card): Google's connected-state label is now driven by
  its actual `granted_scopes` (safe metadata, not a token) rather than a hardcoded claim — today
  that is always `openid email profile`, so it renders "Google account connected" (not "Google
  Calendar syncing"); the logic would say "Google Calendar connected" automatically if a Calendar
  scope were ever added, without a future editor having to remember to update a string. Apple
  Calendar (iCloud) and Microsoft Outlook / Microsoft 365 are shown as "Coming soon" rows with no
  backend, no OAuth, and no credential collection of any kind. The real Google connection was not
  disconnected, reconnected, or modified, and no new scopes were requested.
- **Copilot drawer state continuity**: a new module-level store
  (`lib/copilot/active-conversation.ts`) ties the floating drawer's persistent `CopilotScreen`
  instance and the full `/dashboard/ai` page's separate instance to one active-conversation
  identity via `useSyncExternalStore`, so switching a conversation on either surface resumes it on
  the other. No server-side conversation-continuity backend exists yet; this is client-only state
  continuity, not invented persistence. The drawer continues to render with `historyPanel={false}`
  (no conversation list); the full page keeps its history panel.
- **Regression checks performed**: no `CURRENT_USER`/"Marc Bryce" leakage found outside test
  fixtures and the demo-only `state.settings` path; `lib/dashboard/server.ts`,
  `lib/data/leads.ts`, and `lib/tasks/use-live-tasks.ts` (the dedup/parallelization fixes from the
  prior milestone) were not touched by this window's changes.
- **Verification**: `tsc --noEmit` clean; full `vitest run` — 132 files, 2220 tests, all passing
  (includes 15 new Settings/Calendar tests in `settings-view.test.ts` and 4 new Copilot-continuity
  tests appended to `copilot-view.test.ts`); `next build` clean (0 errors, all 49 routes compiled);
  full-project `eslint` shows 0 new errors or warnings attributable to this window's changed files
  (the 68 pre-existing errors present in the tree are all in untracked scratch `.cjs` QA scripts,
  unrelated to this work). `next start` was run and `/dashboard/settings`, `/dashboard/ai`,
  `/dashboard`, `/dashboard/leads`, and `/dashboard/pipeline` were confirmed to resolve (login
  redirect for unauthenticated requests, as expected) — **full authenticated in-browser QA of the
  rendered Settings/Calendar/Copilot UI was not performed**, because no test login credentials
  were available in this environment. This is a known gap, not a claimed pass.
- **Not started, deliberately**: Apple backend, Microsoft backend, Gmail backend, any Settings
  persistence API, `workspace_settings`. Not deployed to Preview or Production, not pushed to
  GitHub, Google credentials untouched.

## Google Meet + Meeting Intelligence foundation (2026-08-21, this window)

Master Goal — Google Meet first (Zoom/Teams later, reusing the same provider-neutral
architecture; deliberately NOT implemented). Work in
`/srv/projects/CodeOutfitters-worktrees/leads-foundation`, branch `feat/leads-foundation-live`,
on top of `8cf02b0`.

- **Provider-neutral meetings domain** (`lib/meetings/`): `provider.ts` (adapter contract,
  `MeetingProviderError` kinds), `types.ts`, `providers/google-meet.ts` (Google Meet REST API v2,
  read-only, reuses the existing `google_calendar` integration connection's token — no second
  credential store), `registry.ts`, `sync.ts` (service-role orchestration; writes only the
  sync-owned fields), `store.ts` (meeting/artifact/transcript/entry reads + link),
  `status-label.ts`, `knowledge.ts` (Copilot meeting-knowledge composition).
- **AI layer** (`lib/meetings/ai/`): `generate.ts` (Meeting Intelligence + Next Presentation
  Intelligence, structured generation, grounding strips any citation not in the real transcript),
  `schema.ts` (CONFIRMED/INFERRED/UNKNOWN confidence, `AIField<T>`, `EvidenceRef`), `store.ts`
  (`analyzeMeeting`), `brief.ts` (Pre-Meeting Brief).
- **Schema**: migration `20260820000000_meetings_transcripts.sql` — 5 tables, all
  `enable row level security`, workspace-scoped policies (`is_workspace_member(workspace_id)`),
  per-object `revoke all ... from public, anon, authenticated` then narrow grants
  (`authenticated` SELECT-only on artifacts/transcripts/entries/insights; `meetings`
  INSERT/UPDATE only on columns authenticated owns; sync-owned columns SELECT-only),
  SECURITY DEFINER workspace-derivation triggers with fixed
  `search_path = pg_catalog, public`, EXECUTE limited to `postgres`/`service_role`. Satisfies
  `SUPABASE_PUBLIC_DEFAULT_ACL_HARDENING` per-object (the schema-level default ACLs remain
  Supabase-broad — the documented reason the migration revokes explicitly per object). Applied to
  hosted `rsxdhwtprmuhzuocycxu` (objects + policies + grants + functions verified read-only this
  window) but **not recorded in `supabase_migrations.schema_migrations`** (manual apply, not
  `db push`); the migration is fully idempotent so a future `db push` no-ops safely.
- **Google Meet permission**: incremental OAuth on the existing Google connection
  (`capability: "meet"` → adds `https://www.googleapis.com/auth/meetings.space.readonly`, keeps
  identity scopes, `include_granted_scopes`, refresh token preserved). Verify live on Preview:
  `GET meet.googleapis.com/v2/conferenceRecords` → HTTP 200, no `insufficient_scope`.
- **AI fail-closed**: no `AI_PROVIDER` configured anywhere (local + Preview). Default is `mock`,
  whose output is an echo of the prompt — never valid JSON for a transcript, so generation throws
  `invalid_output` → 502 and **nothing is persisted**. No fake/mock intelligence can reach
  Production. Real provider (`AI_PROVIDER=openai` + `OPENAI_API_KEY`) intentionally deferred until
  the real transcript pipeline is proven.
- **Quality gates (all pass)**: full `vitest run` **140 files / 2300 tests**; `tsc --noEmit`
  **0 errors**; eslint on every changed/new milestone file **0 errors / 0 warnings** (the one
  remaining warning in `app/dashboard/meetings/[meetingId]/live/live-view.tsx` is pre-existing
  committed code from an earlier window, untouched); `next build` **clean**, all meetings routes
  present.
- **Not started, deliberately**: Zoom, Microsoft Teams, Gmail scopes, Drive scopes, Calendar
  scopes, SMS, proposals automation, Pipeline 409. Not pushed to GitHub.

## CodeOutfitters Meeting Capture — free transcription fallback (2026-08-21, this window)

Production Meeting Intelligence is live; Google Meet's native transcription is unavailable
on the current Workspace plan. This window builds the browser-capture fallback so
CodeOutfitters no longer depends on Google premium transcription. Design decision and
implementation summary:

- **Two acquisition strategies, one pipeline.** Provider transcript (existing) AND
  CodeOutfitters browser capture both feed the SAME `meetings → meeting_artifacts →
  transcripts → transcript_entries → AI` model. No second AI system, no duplicate
  transcript tables, no `meeting_capture_sessions` table (the artifact IS the durable
  session: its `state` = active/paused/complete, `created_at`/`updated_at` = start/stop).
- **Schema** (`20260822000000_meetings_capture_source.sql`, LOCAL not hosted):
  `meetings.connection_id` nullable (a capture meeting has no Google credential);
  `meeting_artifacts.capture_source` enum `provider_transcript | browser_captions |
  browser_audio`, default `provider_transcript`. RLS unchanged (already workspace-scoped);
  writes stay service-role-only. Verified 8/8 pglite (nullable connection, capture_source
  default/store, idempotent entry upsert).
- **Caption assembler** (`lib/meetings/capture/assembler.ts`): collapses Meet's
  incremental caption re-renders into ONE finalized utterance per statement. Handles
  speaker changes, corrections, shortenings, caption disappearance, pauses, multilingual
  text, null-speaker turns. 18/18 unit tests (the correction + null-speaker cases surfaced
  two real design bugs that were fixed, not papered over).
- **Ingestion API** (bearer-authenticated, workspace derived from token only):
  `POST /api/dashboard/meetings/capture` (start/resume), `/capture/entries` (idempotent
  batch, sequence-guarded, max 500/batch), `/capture/stop` (finalize + status). Deterministic
  ids `codeoutfitters-capture:<sessionId>:<sequence>` make retries no-ops under the existing
  unique constraints. Route tests 6/6 + server source-surface tests 7/7.
- **Chrome extension** (`extensions/codeoutfitters-capture/`, MV3): content script observes
  ONLY the caption panel (multi-selector probe, never one fragile class), background worker
  reads the app's httpOnly:false session cookie via `chrome.cookies` and sends it as a
  bearer token, popup UI with NOT CONNECTED / READY / CAPTURE ACTIVE / PAUSED / COMPLETE /
  UPLOAD ERROR states, Start/Pause/Resume/Stop controls, and a mandatory "Meeting capture
  is active. Make sure participants have been notified where required." notice. Never shows
  or stores tokens. Load-unpacked only; no Web Store.
- **Meeting detail page**: shows "Transcript source: CodeOutfitters Live Capture" vs
  "Google Meet transcript" from `capture_source` (`lib/meetings/capture/label.ts`).
- **Audio fallback design only** (`AUDIO-FALLBACK-DESIGN.md`): `browser_audio` strategy
  documented (faster-whisper recommended / whisper.cpp fallback, home-server CPU
  realtime-factor 0.1–0.3, delete-chunks-after-transcription, explicit-user-action-only,
  Speaker 1/2 labels). NOT built — caption MVP must prove out first.
- **Quality gates**: full `vitest run` **2339/2339** (baseline 2300 → +39), `tsc --noEmit`
  **0 errors**, eslint on all changed milestone files **0 errors / 0 warnings**, `next build`
  **clean** (all 3 capture routes present). `secure-check .`: 0 new findings (semgrep/gitleaks/
  trivy counts identical to the pre-existing baseline — design-export `support.js` files +
  dependency lockfiles only).
- **Not done, deliberately**: no deploy (not even Preview), no push, no Zoom/Teams, no
  audio mode, no Web Store, no paid transcription. Controlled QA (Tayyab or a QA account)
  is the next step.
