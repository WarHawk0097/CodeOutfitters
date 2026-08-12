# CodeOutfitters Master Goal — Progress Ledger

Source: `docs/goals/CODEOUTFITTERS_MASTER_GOAL.md` § 40 (Strict Completion Matrix).
Statuses (exactly 8, per goal file): NOT_STARTED, AUDITED, IMPLEMENTING, CODE_COMPLETE,
TESTED_LOCAL, EXTERNAL_CONFIGURATION_REQUIRED, VERIFIED_END_TO_END, BLOCKED.
Never mark VERIFIED_END_TO_END without actual end-to-end evidence (goal line 2206).

Last updated: 2026-08-12, after Manual Add Lead implementation + local verification.

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1 | Lead ingestion | TESTED_LOCAL | CRITICAL bug found + fixed: `submit_inquiry` never set `leads.workspace_id`, and `leads_select_members` RLS gates all visibility on it — every lead ingested since `20260727_command_center_workspaces.sql` would have been permanently invisible in the dashboard. Fix `20260812020000_leads_workspace_ingestion_fix.sql`: sets `workspace_id` to the single seeded `'codeoutfitters'` workspace on insert; backfills only-if-null on the merge branch; no bulk historical mutation. Local proof: 6/6 pglite (insert path + merge-backfill path) + 219/219 total (198 unit/pglite + 21 RLS/dashboard/saved-views integration against local Docker stack) — no regressions. Hosted: applied to `rsxdhwtprmuhzuocycxu` via `supabase db push --linked` (confirmed recorded, function source/grants/SECURITY DEFINER/search_path verified via `supabase db query --linked`, EXECUTE grant unchanged at service_role-only). Advisors: 30 pre-existing findings, none new, none mention `submit_inquiry`. Read-only hosted audit: 0 total leads, 0 NULL-workspace leads in production today — no historical backfill is currently needed (table is empty), so goal step 9 is moot until real leads exist, not merely deferred by policy. NOT VERIFIED_END_TO_END: no authenticated browser click-through of the public inquiry form against hosted production performed (would create real data with no safe disposable-test workflow available) — per explicit instruction, no fabricated end-to-end claim. Full source-by-source ingestion audit (booking/manual/email/webhook) per goal step 6 still not re-run this window beyond the inquiry-form path — do not read this as fully verified for ingestion sources other than the public inquiry form. `submit_inquiry`'s `workspace_id` assignment is a hardcoded single-workspace fallback with no fail-closed guard if a second workspace is ever created — see backlog item `LEAD_INGESTION_WORKSPACE_MISSING_FAIL_CLOSED` below; fix deliberately deferred, not forgotten. **Manual Add Lead — was fully MISSING, now implemented and TESTED_LOCAL this window**: migration `20260812030000_leads_insert.sql` (column-restricted `insert` grant + `leads_insert_members` RLS policy on `public.leads`, applied to local Docker via `supabase db push --local`), `createLead()` in `lib/leads/server-provider.ts`, `POST /api/leads` (`app/api/leads/route.ts`), `LeadsCreateRequestSchema` (`lib/command-center/contracts/leads.ts`), and inline `AddLeadForm` UI (`app/dashboard/leads/add-lead-form.tsx`, wired into `leads-data.tsx` outside `RouteToolbar` to avoid disturbing the canonical toolbar order asserted by `app/dashboard/visual-system.test.ts`). Proof: `tsc --noEmit` clean; 1894/1894 non-pglite unit/contract tests pass + all pglite suites pass, no regressions; 8/8 real-Docker RLS integration tests pass, including 3 new ones in `lib/leads/leads-insert-rls.integration.test.ts` (workspace member insert succeeds with correct `status`/`appointment_status` DB defaults; cross-workspace insert blocked `42501`; `status` column outside the grant blocked `42501`). NOT VERIFIED_END_TO_END: no authenticated browser click-through of the new Add Lead UI performed, and the migration has NOT been applied to the hosted project — local Docker only. |
| 2 | CRM pipeline | IMPLEMENTING | 11-stage pipeline board exists in UI but confirmed **demo-only**: no live DB mutation surface exists for stage changes today — the board's drag/drop does not persist against Supabase in live mode. Stage-change → DB persist → fresh-session refetch → history NOT yet verified this window (goal steps 10-11 pending) because there is nothing live to verify yet; this is an implementation gap, not an unverified feature. Leads **list** (not pipeline) checked by source this window: `fetchLeads()` (`lib/data/leads.ts`) always calls `/api/leads`, real mode hits the live route (`app/api/leads/route.ts`, workspace-scoped, RLS-gated, demo-mode 404, no fixture fallback in the route itself), mock mode is answered by MSW at the network boundary instead — no in-app fallback mixing. `leads-table.tsx` has a real skeleton loading state, an explicit "No leads match the current search and filters." empty state, and a real per-row detail link `/dashboard/leads/${lead.id}`. This is a source-level check, not a browser click-through (blocked this window — see below). |
| 3 | Lead context (lead detail update) | TESTED_LOCAL | Status/owner PATCH: Zod contract tests (`lib/command-center/contracts/leads-patch.test.ts`), RLS/grant integration tests A/B/E/F/H (`lib/leads/leads-update-rls.integration.test.ts`), provider source-surface tests (`lib/leads/server-provider.test.ts`) all pass locally. Migration `20260812000000_leads_update.sql` applied to hosted project `rsxdhwtprmuhzuocycxu` and confirmed recorded. NOT VERIFIED_END_TO_END: no authenticated browser click-through performed yet (goal step 13), and full Lead-360 section audit (goal step 12) not yet done. Do not read this row as covering CRM pipeline or Lead ingestion. |
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

- `LEAD_INGESTION_WORKSPACE_MISSING_FAIL_CLOSED`: `submit_inquiry` (fix in `20260812020000_leads_workspace_ingestion_fix.sql`)
  assigns every new lead to the single seeded `'codeoutfitters'` workspace by hardcoded lookup, with no
  fail-closed guard for the (currently impossible, but not structurally prevented) case of a second
  workspace existing — it does not resolve workspace by inquiry source or reject when the lookup is
  ambiguous. Not a live risk today (exactly one workspace exists in both local and hosted), so left
  unfixed by deliberate choice, not oversight. Revisit if/when a second workspace is ever provisioned,
  before the next dependent phase reads on this ledger relies on multi-workspace ingestion correctness.

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
