# PHASED IMPLEMENTATION PLAN — CodeOutfitters Command Center
Source of truth for scope/authority: work/CANONICAL-HANDOFF-INTAKE.md, work/CANONICAL-DC-DIRECT-INSPECTION.md, work/REPO-AUDIT.md, work/ADR-COMMAND-CENTER-LOCATION.md, work/RISK-REGISTER.md, work/PROVIDER-ADAPTER-PLAN.md, work/PHASE0-DECISION-CLOSURE.md, work/LEGACY-STUB-DISPOSITION.md, work/PUBLIC-FRONTEND-PROTECTION-MAP.md, work/DEPENDENCY-PLAN.md, work/DATA-AND-MIGRATION-PLAN.md.
No code has been written. This is a plan only. Every phase requires its own approval gate before work begins; none are pre-approved by this document.

---
## PHASE 0 — Scope decision & environment confirmation
- Objective: resolve the location ADR and the 3 remaining open questions before any file is created.
- Status: **APPROVED_DECISIONS_RECORDED** (TASK_ID CODEOUTFITTERS_PHASE0_DECISION_CLOSURE0). All four decisions closed: (1) separate isolated workspace at `F:\CodeOutfitters\command-center`, not an extension of `app/admin/`; (2) NestJS + Fastify + PostgreSQL 16+ + Drizzle + separate worker, production DB vendor deferred; (3) no providers contracted, mock-first across all 8 adapter categories; (4) existing `app/admin/*` stubs classified LEGACY_NON_AUTHORITATIVE_STUBS, preserved untouched, reuse gated by written audit.
- Evidence: work/PHASE0-DECISION-CLOSURE.md, work/ADR-COMMAND-CENTER-LOCATION.md (status ACCEPTED), work/LEGACY-STUB-DISPOSITION.md.
- Verdict: CLOSED. Phase 1 is **NOT_AUTHORIZED** — a separate, explicit go-ahead is required before any scaffolding begins.

---
## PHASE 1 — Scaffolding and tooling setup
- Objective: create the `command-center/` workspace skeleton per the approved structure, with tokens/fonts wired but no screens built yet.
- In scope: `command-center/` pnpm workspace (`apps/web`, `apps/api`, `apps/worker`, `packages/{contracts,database,ui,config,provider-adapters}`, `infrastructure/{docker,local}`, `tests/`); Next.js App Router scaffold in `apps/web` with Tailwind extended to canonical tokens (design-tokens.json `canonical` block: #EDF0F2 canvas, #14130E sidebar, #2F7D4F primary, radius.card 8), fonts via `next/font` (Geist/Geist Mono, IBM Plex Sans/Mono); NestJS + Fastify skeleton in `apps/api` with health-check route only; worker skeleton in `apps/worker` with no job handlers yet; Docker Compose file authored (not run) for local Postgres 16+/Redis per DATA-AND-MIGRATION-PLAN.md.
- Excluded: no screen content, no data, no state machines wired, no database container started, no dependency beyond what DEPENDENCY-PLAN.md's Phase 1 section lists.
- Prerequisites: PHASE 0 closed (APPROVED_DECISIONS_RECORDED).
- Directories touched: `command-center/**` only (new). Root public app untouched (per PUBLIC-FRONTEND-PROTECTION-MAP.md).
- Dependencies added: per DEPENDENCY-PLAN.md workspace-tooling and apps/web/apps/api/apps/worker sections — own `pnpm-lock.yaml`, never touches root `package-lock.json`.
- Entities/data touched: none.
- Migrations: none.
- Provider work: none.
- Security considerations: `command-center/` has no auth boundary yet — must not be deployed or exposed publicly during this phase; confirm no accidental Vercel auto-deploy picks up the new directory.
- Tests: one smoke test per app — web route renders with tokens applied, api health-check responds, worker boots without error.
- Acceptance frames: none yet (no screens built).
- Rollback: delete `command-center/` directory; zero risk to root app or Dashboard given no cross-imports (per PUBLIC-FRONTEND-PROTECTION-MAP.md isolation mechanism).
- Approval gate: confirm tokens render correctly against work/CANONICAL-DC-DIRECT-INSPECTION.md sampled colors; confirm root app's `git status` shows no unexpected diff before continuing.
- Evidence required: screenshot/DOM snapshot showing canvas/sidebar colors match hex values; `git status --porcelain` scoped to root app showing clean.
- Verdict: NOT STARTED. NOT_AUTHORIZED to begin.

---
## PHASE 2 — Contract-first mock layer
- Objective: stand up msw (or fixture) handlers matching api-contracts.json shapes in `apps/web`, and equivalent fixture responses in `apps/api`, so UI and backend phases can build against realistic data before any real database or providers exist.
- In scope: mock handlers for all 22 routes' data needs; fixture data respecting AI-SAFETY-AND-REVIEW-SPEC.md constraints (no invented pricing/case studies/sentiment in fixtures, so the team never gets used to forbidden patterns); mock implementations of all 8 provider adapters per PROVIDER-ADAPTER-PLAN.md, each exposing explicit `NOT_CONFIGURED`/`CONFIGURED_UNVERIFIED` states and failure simulations.
- Excluded: real backend logic beyond fixture-serving, real DB, real providers.
- Prerequisites: PHASE 1.
- Directories touched: `command-center/apps/web/**` (mocks/fixtures), `command-center/packages/provider-adapters/**` (mock adapter implementations), `command-center/packages/contracts/**` (shared Zod schemas).
- Dependencies added: msw (dev-only), zod.
- Entities/data touched: none real; synthetic fixture data only (no real client names/companies).
- Migrations: none.
- Provider work: mock versions of all 8 adapters (Email, Calendar, MeetingPlatform, Transcription, LanguageModel, ObjectStorage, PdfRendering, ProposalAcceptance).
- Security considerations: fixtures must contain no real client data.
- Tests: contract tests asserting fixture shapes match api-contracts.json/shared Zod schemas.
- Acceptance frames: none (infra phase).
- Rollback: delete mocks/fixtures; no data risk.
- Approval gate: fixture data reviewed for AI-safety-constraint compliance before UI phases consume it.
- Evidence required: contract test pass output.
- Verdict: NOT STARTED.

---
## PHASE 3 — Overview, Leads, navigation shell (C-D01, C-D05, sidebar/nav)
- Objective: build the sidebar shell (SIDEBAR_SHELL component), Overview (C-D01), Leads (C-D05) screens in `apps/web`.
- In scope: C-D01 Overview, C-D05 Leads, LEADS_DATA_TABLE (TanStack Table), DATE_RANGE_FILTER, KPI_CARD, CHART_CONTAINER (Lead Flow chart — must NOT be grouped-bar, confirmed rejected in direct inspection).
- Excluded: Pipeline board (Phase 4), Meeting Intelligence, Proposals.
- Prerequisites: PHASE 1, PHASE 2.
- Directories touched: `command-center/apps/web/**` route and component dirs.
- Dependencies added: @tanstack/react-table.
- Entities/data touched: mock leads data only (Phase 2 fixtures).
- Migrations: none.
- Provider work: none live; mock only.
- Security considerations: none new.
- Tests: component tests for KPI_CARD/CHART_CONTAINER; table sort/filter behavior.
- Acceptance frames: C-D01, C-D05, MO-01, MO-02, T-01, T-02.
- Rollback: feature-branch revert; no data risk.
- Approval gate: visual comparison against C-D01/C-D05 canonical frames.
- Evidence required: side-by-side screenshots.
- Verdict: NOT STARTED.

---
## PHASE 4 — Pipeline board (highest-risk component)
- Objective: implement PIPELINE_BOARD using the Row 6 override (Hayden Bleasel Kanban pattern via dnd-kit), native build, keyboard sensor required.
- In scope: C-D06 Pipeline, C-D07/C-D08 card states and drag, 4-column paginated grid ("STAGES 2-5 OF 11" pattern confirmed in direct inspection), reason-required gate on terminal stage moves (STATE_PIPELINE_MOVE), 409/422 rollback-with-toast behavior.
- Excluded: Lead drawer detail (Phase 5).
- Prerequisites: PHASE 3 (shares nav shell).
- Directories touched: `command-center/apps/web/**` pipeline component dir.
- Dependencies added: dnd-kit/core, dnd-kit/sortable, keyboard sensor plugin.
- Entities/data touched: mock pipeline cards/stages.
- Migrations: none.
- Provider work: none.
- Security considerations: none new.
- Tests: drag-drop unit tests, keyboard-only operation test, reason-required validation on terminal stage.
- Acceptance frames: C-D06, C-D07, C-D08, T-03, MO-03.
- Rollback: isolate as its own branch/spike; revert if dnd-kit integration proves too costly, re-scope.
- Approval gate: keyboard-only operation demoed and accepted; reason-gate on Won/Lost/FUL confirmed functional.
- Evidence required: recorded demo or test output showing keyboard drag-drop and gated stage transition.
- Verdict: NOT STARTED.

---
## PHASE 5 — Lead drawer and detail
- Objective: LEAD_DRAWER, LEAD_DETAIL_SECTIONS (C-D09/C-D10).
- In scope: drawer open/close, detail sections (contact info, appointment, next step, owner).
- Excluded: CRM mutation logic beyond opening/reading (mutations gated to Phase 8).
- Prerequisites: PHASE 3.
- Directories touched: `command-center/apps/web/**` lead-detail component dir.
- Dependencies added: none beyond Phase 3's.
- Entities/data touched: mock lead detail data.
- Migrations: none.
- Provider work: none.
- Security considerations: none new.
- Tests: drawer open/close, keyboard focus trap.
- Acceptance frames: C-D09, C-D10, T-05, MO-06.
- Rollback: standard branch revert.
- Approval gate: visual and interaction comparison to canonical frame.
- Evidence required: screenshot/demo.
- Verdict: NOT STARTED.

---
## PHASE 6 — Appointments, Follow-ups, Email Activity, Team
- Objective: C-D11/C-D12 (Appointments/Follow-ups), C-D13/C-D14 (Email/Team).
- In scope: EVENT_CALENDAR, DATETIME_PICKER (react-aria), SIMPLE_TABLE-based Follow-ups/Email/Team lists.
- Excluded: real calendar provider (mock only).
- Prerequisites: PHASE 3.
- Directories touched: `command-center/apps/web/**` respective feature dirs.
- Dependencies added: react-aria DateRangePicker/calendar primitives, date-fns.
- Entities/data touched: mock appointments/follow-ups/email/team data.
- Migrations: none.
- Provider work: mock CalendarProvider only.
- Security considerations: none new.
- Tests: calendar interaction tests, table rendering tests.
- Acceptance frames: C-D11, C-D12, C-D13, C-D14, T-06, MO-07.
- Rollback: standard branch revert.
- Approval gate: visual comparison to canonical frames.
- Evidence required: screenshot/demo.
- Verdict: NOT STARTED.

---
## PHASE 7 — Meeting Intelligence: directory, prepare, live workspace
- Objective: M-D01/M-D02 (directory/prepare), M-D03 (live meeting workspace — consent-gated).
- In scope: consent gate before transcription (STATE_MEETING_SESSION), "CONSENT ALWAYS VISIBLE" UI requirement (M-D03 frame annotation, direct inspection line 480).
- Excluded: Copilot tabs (Phase 8), post-call review (Phase 8).
- Prerequisites: PHASE 3, PHASE 2 (mock TranscriptionProvider, mock MeetingPlatformProvider).
- Directories touched: `command-center/apps/web/**` meeting-intelligence feature dir.
- Dependencies added: none beyond existing.
- Entities/data touched: mock meeting/transcript data.
- Migrations: none.
- Provider work: mock TranscriptionProvider and MeetingPlatformProvider (consent-gated regardless of mock/real).
- Security considerations: consent must be recorded and enforced before any transcript rendering, even mock — product safety rule, not just a provider integration detail.
- Tests: consent-decline path routes to manual notes; consent-accept path enables transcript.
- Acceptance frames: M-D01, M-D02, M-D03, T-07, MO-08, MO-09.
- Rollback: standard branch revert.
- Approval gate: consent gate demoed both accept and decline paths.
- Evidence required: test output and screenshot of consent UI matching "CONSENT ALWAYS VISIBLE" requirement.
- Verdict: NOT STARTED.

---
## PHASE 8 — Meeting Copilot tabs, post-call review, CRM approval
- Objective: M-D04 through M-D11, M-D17, M-D18 (Copilot tabs); M-D12/M-D13 (post-call review, CRM approval); M-D14/M-D15 (transcript detail, meeting history).
- In scope: Live Pitch "client-safe" mode (confirmed present at direct-inspection line 541), CRM_RECOMMENDATION_REVIEW mandatory batch confirm with per-item rollback, AI-provider-unavailable graceful degradation (M-D18, confirmed present in markup).
- Excluded: real LanguageModelProvider (mock only).
- Prerequisites: PHASE 7.
- Directories touched: `command-center/apps/web/**` copilot/post-call feature dirs.
- Dependencies added: none beyond existing.
- Entities/data touched: mock AI insight/CRM recommendation data.
- Migrations: none.
- Provider work: mock LanguageModelProvider, must bake in AI-safety constraints (no invented pricing/case studies/sentiment %) from the fixture level up.
- Security considerations: client-facing surfaces (Live Pitch) must never show AI labels or unapproved assumptions.
- Tests: CRM approval batch-confirm and per-item rollback; AI-provider-unavailable degraded state renders correctly.
- Acceptance frames: M-D04 through M-D11, M-D12, M-D13, M-D14, M-D15, M-D17, M-D18, T-08.
- Rollback: standard branch revert.
- Approval gate: AI-safety constraint test suite passes.
- Evidence required: test output.
- Verdict: NOT STARTED.

---
## PHASE 9 — Proposals: directory, builder, pricing, validation
- Objective: P-D01-P-D09 (directory, create, builder, navigator, AI assist, validation, pricing, milestones, internal review).
- In scope: PROPOSAL_INTERNAL_REVIEW (approver != owner enforced), pricing/milestone entry with validation workspace.
- Excluded: client-facing preview/PDF (Phase 10), send/delivery (Phase 10).
- Prerequisites: PHASE 3, PHASE 2.
- Directories touched: `command-center/apps/web/**` proposals feature dir. Per LEGACY-STUB-DISPOSITION.md, the existing `app/admin/proposal` stub in the root app is not imported, moved, or reused here without a separate written reuse audit — this phase builds independently in the new workspace.
- Dependencies added: react-hook-form, Zod resolver.
- Entities/data touched: mock proposal data only. No data migration from the legacy stub occurs (it's localStorage-only, dev-local, not production data).
- Migrations: none (no DB yet).
- Provider work: none live.
- Security considerations: approver != owner enforcement is a business rule, tested explicitly.
- Tests: internal review approver/owner distinct-person validation; pricing/milestone sum-to-100% validation.
- Acceptance frames: P-D01 through P-D09, T-09.
- Rollback: standard branch revert.
- Approval gate: approver/owner distinct-person rule test passes; visual comparison to canonical frames.
- Evidence required: test output and screenshots.
- Verdict: NOT STARTED.

---
## PHASE 10 — Proposal delivery, client view, acceptance, PDF
- Objective: P-D10 (Send), P-D11 (Activity), P-D12 (Client view), P-D13 (Acceptance), P-D14/15/16/17 (Settings/PDF states), PDF-01..15 (Executive Solution Proposal PDF).
- In scope: STATE_PROPOSAL_DELIVERY (explicit confirm and send; preconditions = approved + validation READY + PDF fresh; idempotency required) — no automatic proposal sending, ever.
- Excluded: real e-signature provider wiring (mock ProposalAcceptanceProvider only; internal acceptance record used first per PROVIDER-ADAPTER-PLAN.md).
- Prerequisites: PHASE 9.
- Directories touched: `command-center/apps/web/**` proposal-delivery, pdf feature dirs.
- Dependencies added: PDF generation library, chosen at this phase (server-side Chromium/Playwright vs dedicated PDF service — evaluated here, not pre-selected).
- Entities/data touched: mock proposal delivery/acceptance data.
- Migrations: none.
- Provider work: mock ProposalAcceptanceProvider, mock PdfRenderingProvider.
- Security considerations: idempotency required on send (no duplicate sends on retry/network blip); client view (P-D12) must never leak AI provenance or unapproved assumptions.
- Tests: idempotent send test; precondition gate test (can't send if validation not READY or PDF stale).
- Acceptance frames: P-D10 through P-D17, PDF-01..15, T-10.
- Rollback: standard branch revert.
- Approval gate: idempotency and precondition tests pass; explicit confirm-before-send UI reviewed (never optimistic-success).
- Evidence required: test output.
- Verdict: NOT STARTED.

---
## PHASE 11 — Settings, AI settings, Command Palette, Dialogs, Auth
- Objective: C-D15 (Settings), M-D16 (AI settings), C-D16 (Palette), C-D17 (Dialogs), C-D18 (Auth), T-11, MO-18.
- In scope: COMMAND_PALETTE, STICKY_DIALOG, AUTH_SCREENS components.
- Excluded: real auth provider wiring. Since Command Center is a fully separate workspace (per ADR-COMMAND-CENTER-LOCATION.md), it has its own auth boundary from the start — C-D18 Auth screens are the real intended auth UI for `command-center/apps/web`, entirely independent of the root app's convenience-only password gate. No disposition decision about the root app's gate is implied or made here.
- Prerequisites: PHASE 3.
- Directories touched: `command-center/apps/web/**` settings, palette, dialogs, auth feature dirs.
- Dependencies added: cmdk or equivalent (confirm at Phase 1 dependency audit).
- Entities/data touched: mock settings data.
- Migrations: none.
- Provider work: none live.
- Security considerations: real auth mechanism (sessions, credential storage) for `command-center/apps/api` is a security-sensitive build even against mocks — must not be stubbed as "always logged in" past this phase; explicit auth-approach confirmation with the user before implementing beyond UI shell.
- Tests: command palette keyboard shortcuts, dialog focus trap, auth form validation.
- Acceptance frames: C-D15, C-D16, C-D17, C-D18, M-D16, T-11, MO-18.
- Rollback: standard branch revert.
- Approval gate: auth approach (session strategy, credential storage even in mock form) confirmed with user before implementation goes beyond static UI.
- Evidence required: screenshots and user sign-off note on auth approach.
- Verdict: NOT STARTED.

---
## PHASE 12 — Tablet responsive pass (T-01..T-11 full parity)
- Objective: verify/complete tablet (820x1180) parity across all screens built in Phases 3-11.
- In scope: layout adjustments confirmed already present in canonical markup (e.g. T-04 "Navigation expanded tablet" position:relative overlay pattern).
- Excluded: new screens.
- Prerequisites: PHASES 3-11 substantially complete.
- Directories touched: `command-center/apps/web/**` shared layout/responsive utility files only.
- Dependencies added: none expected.
- Entities/data touched: none new.
- Migrations: none.
- Provider work: none.
- Security considerations: none new.
- Tests: responsive snapshot tests at 820px width for all 11 tablet frames.
- Acceptance frames: T-01 through T-11 (all).
- Rollback: standard branch revert.
- Approval gate: all 11 tablet frames visually match canonical.
- Evidence required: screenshot set.
- Verdict: NOT STARTED.

---
## PHASE 13 — Mobile responsive pass (MO-01..MO-18 full parity)
- Objective: verify/complete mobile (390x844) parity across all screens.
- In scope: mobile nav open/closed states (MO-04/MO-05), all 18 mobile frames.
- Excluded: new screens.
- Prerequisites: PHASES 3-11 substantially complete; can run parallel to PHASE 12.
- Directories touched: `command-center/apps/web/**` shared layout/responsive utility files only.
- Dependencies added: none expected.
- Entities/data touched: none new.
- Migrations: none.
- Provider work: none.
- Security considerations: none new.
- Tests: responsive snapshot tests at 390px width for all 18 mobile frames.
- Acceptance frames: MO-01 through MO-18 (all).
- Rollback: standard branch revert.
- Approval gate: all 18 mobile frames visually match canonical.
- Evidence required: screenshot set.
- Verdict: NOT STARTED.

---
## PHASE 14 — Accessibility and motion passes
- Objective: axe pass, full keyboard navigation pass, prefers-reduced-motion support, per PRODUCTION-READINESS-CHECKLIST.md's unchecked items.
- In scope: axe automated scan across all built screens; manual keyboard-only walkthrough of all 22 routes; reduced-motion variant of any animation.
- Excluded: new features.
- Prerequisites: PHASES 3-13 complete.
- Directories touched: none new; fixes applied in-place across existing `command-center/apps/web/**` feature dirs.
- Dependencies added: axe-core / @axe-core/playwright (dev only).
- Entities/data touched: none.
- Migrations: none.
- Provider work: none.
- Security considerations: none new.
- Tests: automated axe scan (zero critical/serious violations gate), manual keyboard walkthrough checklist.
- Acceptance frames: all 49 canonical frames, accessibility-annotated pass.
- Rollback: standard branch revert.
- Approval gate: axe scan clean, keyboard walkthrough signed off.
- Evidence required: axe report and keyboard walkthrough notes.
- Verdict: NOT STARTED.

---
## PHASE 15 — Real backend and provider wiring
- Objective: stand up the real NestJS + Fastify API and PostgreSQL/Drizzle database in `apps/api`/`packages/database`, replace Phase 2's mock layer with real persistence, and swap provider adapters from mock to real one at a time, per PROVIDER-ADAPTER-PLAN.md, each behind its own approval gate.
- In scope: `apps/api` NestJS routes replacing mock handlers; `packages/database` first real Drizzle schema/migrations (leads, proposals, meetings, workspace/tenant tables) per DATA-AND-MIGRATION-PLAN.md governance rules; `apps/worker` BullMQ job handlers for async work (transcription processing, email delivery, PDF generation) once Redis/BullMQ are approved for this phase; provider adapters swapped from mock to real, one at a time, starting with whichever category the user contracts first (email is the only category with named candidates today — Resend vs Postmark).
- Excluded: nothing deferred further — this is the last functional phase before analytics/pen test.
- Prerequisites: PHASES 2-14 complete or substantially so; explicit separate user authorization for this phase given its real-cost/real-data implications; production DB vendor decision (still DEFERRED as of Phase 0) must be made before production (not local dev) database work.
- Directories touched: `command-center/apps/api/**`, `command-center/apps/worker/**`, `command-center/packages/database/**`, `command-center/packages/provider-adapters/**` (real implementations added alongside existing mocks, not replacing them — mocks remain for tests/CI).
- Dependencies added: per DEPENDENCY-PLAN.md — Drizzle, Postgres driver, BullMQ/Redis client, and only the provider SDK(s) for whichever vendor is contracted at that point.
- Entities/data touched: first real data — leads, proposals, meetings. First phase with real data-loss risk; requires backup/rollback plan per DATA-AND-MIGRATION-PLAN.md before any destructive migration.
- Migrations: first real DB migrations. Every migration's SQL is exposed for human review before running; no destructive migration without explicit approval, backup, and rollback plan; tenant isolation (RLS) tested with the real application role, not the migration/owner role, per PHASE0-DECISION-CLOSURE.md §9-10.
- Provider work: full real-provider wiring, replacing mock adapters one category at a time, gated per state-machines.json approval rules (never auto-apply). No SDK installed, no account created, no API key entered until that specific vendor is confirmed contracted by the user.
- Security considerations: secrets management for provider API keys and DB credentials (never committed; `.env.local`-style pattern, files excluded from git); production Postgres role must be non-owning/non-superuser so RLS is enforced (`FORCE ROW LEVEL SECURITY` where required); cross-workspace read/write blocking proven by integration tests before this phase closes.
- Tests: integration tests against real provider sandboxes/test modes where available; full state-machine approval-gate re-test with real (not mock) data paths; RLS cross-tenant isolation integration tests using the real application role.
- Acceptance frames: n/a (backend phase, not visual).
- Rollback: per-provider rollback plan; DB migrations must be reversible; this phase requires explicit user approval before any real provider credential is used or any production database is provisioned.
- Approval gate: user confirms each provider's production credentials/contract before that provider's adapter goes live; user confirms production DB vendor before production (not local dev) database provisioning; explicit user check-in before this phase starts at all.
- Evidence required: per-provider integration test output, secrets-handling confirmation (no keys in git history), RLS integration test output.
- Verdict: NOT STARTED — first phase requiring a live confirmation checkpoint beyond written approval, given real cost/data implications.

---
## PHASE 16 — Analytics, pen test, production launch
- Objective: final PRODUCTION-READINESS-CHECKLIST.md items — analytics wiring, penetration test, production promotion.
- In scope: analytics event wiring (tool TBD), third-party pen test engagement, final production deploy decision (including where `command-center`'s three services are hosted — deferred topology decision from ADR-COMMAND-CENTER-LOCATION.md, resolved here at the latest).
- Excluded: nothing — this is the closing phase.
- Prerequisites: PHASE 15 complete and signed off.
- Directories touched: analytics config only, plus deployment config for the new services (not the root public app).
- Dependencies added: analytics SDK (TBD).
- Entities/data touched: none new beyond what Phase 15 established.
- Migrations: none new.
- Provider work: none new.
- Security considerations: pen test is explicitly a PRODUCTION-READINESS-CHECKLIST.md requirement — do not skip; findings must be remediated before production promotion, not after.
- Tests: pen test report review; final smoke test across all 22 routes in production-like environment; RLS/tenant-isolation re-check in the production environment specifically, not just staging.
- Acceptance frames: n/a.
- Rollback: standard deploy rollback for whichever hosting is chosen for `command-center`'s services; root public app's existing Vercel rollback is unaffected since it remains a separate deploy target.
- Approval gate: pen test findings remediated; explicit user go-ahead for production promotion (irreversible-in-effect action — real users, real data).
- Evidence required: pen test report, remediation confirmation, user go-ahead recorded.
- Verdict: NOT STARTED.

---
## Cross-phase notes
- Every phase's "Approval gate" is a hard stop, not a formality — especially PHASE 1 (workspace creation, currently NOT_AUTHORIZED), PHASE 4 (highest technical risk), PHASE 11 (auth approach), PHASE 15 (real data/cost), PHASE 16 (production/irreversible).
- No phase before PHASE 15 touches real user data, real credentials, a real database, or a production deploy.
- `command-center/` is fully isolated from the root public app per PUBLIC-FRONTEND-PROTECTION-MAP.md — no phase should ever need to modify root `app/`, `components/`, `lib/`, or `package.json`/`package-lock.json`. Any phase that appears to require this is a signal to stop and re-check the ADR, not proceed.
- Frame-level re-verification: any phase implementing a specific frame should re-grep that frame's exact block from Command Center Final.dc.html before writing code — this document's samples are not exhaustive line-by-line coverage of all 49 frames.
- Phase 0 is closed. Phase 1 requires its own separate explicit authorization before any scaffolding begins.
