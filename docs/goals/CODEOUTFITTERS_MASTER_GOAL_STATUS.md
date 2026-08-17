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

**Tests**: 32 new, all local-only (no real Google API calls — Section 11's mocked-provider
constraint) — `crypto.test.ts` (4: round-trip, tamper detection, fails closed with no/malformed
key), `providers/local-test.test.ts` (7: exchange, refresh producing a distinct credential,
refresh-failure yields a safe token-free error under 200 chars, revoke never throws, inspect
health states), `registry.test.ts` (3: adapter caching, `google_calendar`/`gmail` fail closed,
test override seam), `store.test.ts` (10, source-surface convention matching
`lib/tasks/server-provider.test.ts`: `credential_ciphertext` never in `SAFE_COLUMNS`, never read
outside `loadForServiceOp`, every service-role query workspace-scoped, every Postgres error mapped
not rethrown raw, disconnect always clears the credential independent of provider-revoke outcome,
reconnect never rewrites `workspace_id`/`provider`/`provider_account_id`/`connected_at`, no bare
`select("*")`), and `integration-connections.pglite.test.ts` (8, real embedded Postgres running
the unmodified migration SQL, migration chain `20260723_inquiry_backend.sql` →
`20260727_command_center_workspaces.sql` → `20260818000000_integration_connections.sql`: cross-
workspace read denial, cross-workspace write denial (0 rows affected), authorized create/read,
`credential_ciphertext` unselectable by `authenticated` — `permission denied`, duplicate
`(workspace_id, provider, provider_account_id)` rejected by the unique constraint, the disconnect
check-constraint pairing enforced (status alone rejected, status+ciphertext-null+timestamp
accepted), anon has zero access to either table, and an event's `workspace_id` is
trigger-overwritten not caller-supplied with cross-workspace event inserts denied). Quality gate
this window: targeted suite 32/32, `tsc --noEmit` clean (0 errors), `eslint` clean on all touched
files (0 errors, 2 pre-existing-pattern warnings — an unused `beforeEach` import removed, an
intentionally-unused `_credentials` interface-conformance parameter left as-is), full Vitest
2129/2129 (up from 2097, +32, 0 regressions), `next build` clean — all four new routes
(`/api/dashboard/integrations/connections`, `.../[id]`, `.../connect`, `.../callback`) registered
as dynamic (`ƒ`) in the route manifest.

**Not done, deliberately, this window**: the migration was NOT applied to hosted (`rsxdhwtprmuhzuocycxu`)
— `MIGRATION_READY_NOT_DEPLOYED`, consistent with every other new-schema window in this ledger,
and this window's instruction did not authorize a hosted push the way some prior Leads windows
did. No real Google OAuth client was registered or wired. No Calendar/Email consumer code exists
yet — this is purely the shared connection substrate. No browser click-through was performed (no
UI surface was built or requested for this phase — API + store + schema only, per the
instruction's explicit scope). This entry does not change the status of any of rows 1-21 above,
and does not touch or reinterpret the Pipeline 409 / `HOSTED_PLATFORM_TRANSIENT` investigation
recorded earlier in this file.

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
