# PM1 Phase Sequence

> Supporting file for `docs/PM1_PLAN.md` §12. One row per future phase. Each row expands the recommended sequence with: gate, depends-on, workstream, file ownership, exit criteria, and the lockfile / source-file / install rules.
> **Status:** Draft for ChatGPT Control Room review. No implementation.

## How to use this file

- Read the table in order. The order is opinionated; parallelism is allowed where the rows say so.
- Each row is its own gated phase. Phases do not start the next phase. They stop and wait for ChatGPT Control Room review.
- The `Hard rules` row at the bottom restates the absolute gates enforced across all phases.
- All file ownership is governed by `ai/AI_FILE_OWNERSHIP.md` and `repo-research/AGENT_BOUNDARY_MAP.md`.

## Phase table

| # | Phase | Status | Depends on | Workstream | Allowed file zones | Hard rules | Exit criteria |
|---|---|---|---|---|---|---|---|
| 1 | PM1 — Plan | written; pending review | — | Synthesize PRE8, briefs, risk register, state files | `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md` | No code, no installs, no config, no lockfile edits, no README edit | `docs/PM1_PLAN.md` exists and all state files updated; PM1 stops and waits for review |
| 2 | PM1 review by ChatGPT Control Room | gated | #1 | Approve / repair / reject | n/a (review only) | n/a | Owner / Control Room returns approve / repair / reject |
| 3 | PD1 — Product / design decisions (if needed) | blocked | #2 | Deeper product frame for any undecided owner decision | `docs/`, `memory/`, `ai/`, `repo-research/` | No code, no installs, no config | PD1 plan written; stops and waits |
| 4 | Setup phase (git init, .gitignore review) | blocked | #2 | Resolve Q-21 git / repo root status; review `.gitignore`; `git init` if confirmed; first commit | `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`, `.gitignore` (config change, gated), `docs/`, `memory/`, `ai/`, `repo-research/` | No `npm install`, no source edits beyond the commit snapshot | Repo initialized at confirmed root; first commit exists; `.gitignore` reviewed |
| 5 | Cleanup A — low-risk, no architecture | blocked | #4 | README repair, `DEPLOY.md` delete (Q-13), portfolio copy fix (R-019), `source: "contact"` symmetry (Q-14), `tsconfig.tsbuildinfo` to `.gitignore` (R-025), `ESLint config` addition (R-026) | `README.md`, `app/(public)/portfolio/page.tsx` (copy only), `components/contact.tsx` (one field), `.gitignore`, `eslint.config.mjs` (new, config-only), `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md` | No new deps; no lockfile edits; no security / booking fix; no new animations | All Cleanup A items merged; R-001 (doc), R-019, R-025, R-026 (config-only) closed |
| 6 | Cleanup B — lockfile resolution | blocked | #5 + D-15 | Drop one lockfile; update `.gitignore`; update `docs/SETUP.md`, `docs/DEPLOYMENT.md`, README; (if pnpm) add `packageManager` to `package.json` | `package.json` (config field only if pnpm), the dropped lockfile, `.gitignore`, `docs/`, `README.md`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md` | `git status` clean before deletion; exactly one lockfile after | Exactly one lockfile at the repo root; R-002 (config) closed |
| 7 | TS0 / RDG0 — tooling approval request | blocked | #5 (parallel with #6) | Submit 9-tool list per §7.2 in 9 small PRs (or one submission with 9 sections) | `repo-research/TS0_RDG0_REQUEST.md` (or split into 9 PRs) | No installs; documentation only | Owner / Control Room returns approve / repair / reject per tool |
| 8 | TS0 setup — install approved tools | blocked | #7 (per-tool approval) | Install each approved tool in its own small PR per §7.6 | `package.json` (devDependencies only), new MCP / skill config files (if any), `docs/`, `memory/`, `ai/`, `INTEGRATION_NOTES.md`, `repo-research/`, `PROJECT_CONTROL_LOG.md` | No new runtime deps; no production config changes unless required + documented; free / open-source only | All approved tools installed; `INTEGRATION_NOTES.md` updated; each PR has a smoke test |
| 9 | QA slice 0 — config-only | blocked | #5 (parallel with #6, #7) | Add `typecheck` script, add `eslint.config.mjs` (already in Cleanup A), add `.github/workflows/ci.yml` | `package.json` (script field only), `eslint.config.mjs`, `.github/workflows/ci.yml` (new), `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md` | No new deps; config-only | CI runs `typecheck` + `lint` on every PR; R-008 (partial) and R-009 closed |
| 10 | D0 — Design / architecture | blocked | #2 (and #3 if needed) | Architecture decisions for security, booking, RLS, Worker, observability, UIX0 / MOTION0; updated `docs/ARCHITECTURE.md` | `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DATABASE.md`, `docs/ROADMAP.md`, `memory/IMPORTANT_DECISIONS.md`, `memory/WORKING_MEMORY.md`, `memory/EPISODIC_MEMORY.md`, `repo-research/`, `ai/`, `PROJECT_CONTROL_LOG.md` | No code, no installs, no config | D0 plan written; stops and waits |
| 11 | A0 — Action / build plan | blocked | #10 | Concrete plan for the security, booking, observability, and UIX0 / MOTION0 phases | `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md` | No code, no installs, no config | A0 plan written; stops and waits |
| 12 | Security 1 — Worker proxy for Anthropic | blocked | #11 + #4 | Stand up Cloudflare Worker; move Anthropic call behind Worker; remove `NEXT_PUBLIC_ANTHROPIC_API_KEY` from build output | `lib/proposal-generator.ts`, `app/admin/proposal/page.tsx`, new Worker source, `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md` (move R-002 / R-004 to "Closed"), `memory/`, `ai/`, `PROJECT_CONTROL_LOG.md` | No new runtime deps; no lockfile edits; CSP must include the Worker origin | R-002, R-004 closed; smoke test verifies Worker path |
| 13 | Security 2 — Supabase Auth / magic link | blocked | #12 | Replace client-side admin gate with Supabase Auth / magic link; remove `NEXT_PUBLIC_ADMIN_PASSWORD` from build output | `app/admin/layout.tsx`, `app/admin/page.tsx`, `lib/supabase.ts` (Auth), `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `ai/`, `PROJECT_CONTROL_LOG.md` | No paid tools; no new lockfile changes | R-001, R-003, R-029 closed; smoke test verifies session |
| 14 | Security 3 — Supabase RLS | blocked | #12 or #13 | Enable RLS; deny all to anon; controlled insert path | `lib/booking-schema.sql`, `lib/booking-actions.ts` (RPC or restricted), `docs/DATABASE.md`, `docs/SECURITY.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md` | SQL change gated; RLS must be tested before shipping | R-006 closed; anon read denied |
| 15 | Booking A — MVP | blocked | #11 (#12 if Worker is the chosen path) | UI reads `available_slots`; wire to `createBooking` (or successor); n8n path; graceful degradation | `components/booking-calendar-custom.tsx`, `lib/booking-actions.ts`, `docs/DATABASE.md`, `docs/ARCHITECTURE.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md` | No new animation; no new deps; seed lifecycle also addressed | R-005 closed; concurrent-submit test passes |
| 16 | Booking B — robust | blocked | #15 + #12 | `reserve_slot` RPC; put behind Worker; signed event to n8n | `lib/booking-schema.sql` (RPC), `lib/booking-actions.ts`, Worker source, `docs/DATABASE.md`, `docs/ARCHITECTURE.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md` | Defense-in-depth: `UNIQUE (preferred_date, preferred_time)` on `bookings` | Concurrent-submit test still passes under load; anon cannot write |
| 17 | Security 4 — n8n signing | blocked | #12 or #13 | Per-form secret; header on POST; verify in n8n | `components/quote-form.tsx`, `components/contact.tsx`, `components/booking-calendar-custom.tsx`, `components/newsletter.tsx`, n8n workflow, `INTEGRATION_NOTES.md`, `docs/SECURITY.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md` | No new deps; signed event format documented | R-017 closed; unsigned request rejected |
| 18 | Security 5 — CSP CI guard | blocked | #8 (CI), #12 | CI fails if `public/_headers` is missing a new external endpoint | `.github/workflows/ci.yml` (or new file), `public/_headers`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md` | No new runtime deps | R-020 closed; CI test fails when endpoint drift |
| 19 | Admin auth + persistence (R-4.5, R-4.6) | blocked | #13 + #15 | Persist proposals to Supabase; list on `/admin`; better admin auth (already in #13) | `app/admin/page.tsx`, `app/admin/proposal/page.tsx`, `components/admin/`, `lib/proposal-generator.ts` (if persistence changes the flow), `lib/supabase.ts`, `docs/ARCHITECTURE.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md` | No new animations on admin; R-018 partially closed | R-018 (partial) closed; proposal list works |
| 20 | Observability phase | blocked | #5 (parallel with #6..#18) | Sentry error tracking; UptimeRobot; n8n delivery monitor; booking failure wrap; owner channel | `components/error-boundary.tsx`, `lib/booking-actions.ts`, new monitor scripts, n8n workflow, `docs/SECURITY.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md` | Free / open-source only; no paid tools | R-010 closed; forced error reported within 5 min |
| 21 | QA slice 1 — Playwright (test runner) | blocked | #8 + #9 | Install Playwright as a real test runner; add `tests/smoke.spec.ts`; CI runs it | `package.json` (devDep), `playwright.config.*`, `tests/`, `.github/workflows/ci.yml`, `docs/QA_CHECKLIST.md`, `memory/`, `PROJECT_CONTROL_LOG.md` | No mutating tests; smoke only | Smoke passes on every PR; R-008 closed |
| 22 | QA slice 2 — Lighthouse + visual regression | blocked | #21 + #8 | Lighthouse CI budgets; Playwright visual regression; Chrome DevTools MCP integration | `package.json` (devDeps), `tests/`, `.github/workflows/ci.yml`, `.lighthouserc.*`, `repo-research/`, `memory/`, `PROJECT_CONTROL_LOG.md` | 1% pixel-delta gate; Lighthouse budget in `lighthouserc` | Budget enforced; visual diff blocked on > 1% delta |
| 23 | QA slice 3 — form / booking / admin / a11y | blocked | #21 + #15, #19, #20 | Form contract tests; booking flow tests; admin proposal flow tests; axe-core scan; bundle size guard | `tests/`, `package.json` (devDeps), `.github/workflows/ci.yml`, `repo-research/`, `memory/`, `PROJECT_CONTROL_LOG.md` | No flaky tests; mocks for Anthropic | All slice 3 tests pass on every PR |
| 24 | UIX0 / MOTION0 — first slice | blocked | #22 + #8 | Hero + headline + scroll reveals + ROI micro-interactions + reduced-motion coverage | `components/hero.tsx`, `components/aos-provider.tsx`, `hooks/useScrollReveal.ts`, `components/roi-calculator.tsx`, `docs/FEATURES.md`, `docs/ARCHITECTURE.md`, `docs/QA_CHECKLIST.md`, `repo-research/MOTION_QA_LOG.md` (new), `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md` | No new animation libs; no `package.json` deps; AOS opt-out; GSAP opt-out; Framer opt-out; LCP / CLS / INP within budget | R-012, R-013 (partial), R-014, R-015 closed; taste review captured |
| 25 | UIX0 / MOTION0 — later slices | blocked | #24 | Parallax, magnetic buttons, portfolio motion depth, process timeline animation, contact / booking form transitions, marquee polish, stat counters | `components/`, `hooks/`, `lib/animations/`, `docs/`, `memory/`, `PROJECT_CONTROL_LOG.md` | Each slice is a separate PR; no new deps without TS0 / RDG0; benchmarks per slice | Each slice merges with budget met; taste review per slice |
| 26 | Admin motion discipline + testimonials | blocked | #24 | Admin lighter motion; testimonials carousel wiring (R-4.3); R-4.4 portfolio copy (if not done in #5) | `components/testimonials.tsx`, `app/(public)/page.tsx` (wire), `components/admin/**` (motion discipline), `docs/FEATURES.md`, `docs/ARCHITECTURE.md`, `memory/`, `PROJECT_CONTROL_LOG.md` | Admin motion ≤ 200ms; testimonials copy reconciled with portfolio | R-4.2, R-4.3 closed; admin motion budget met |
| 27 | Final QA + delivery | blocked | All above | Full manual checklist; full automated smoke; Cloudflare post-deploy checks per `docs/DEPLOYMENT.md` | `docs/QA_CHECKLIST.md`, `docs/DEPLOYMENT.md`, `memory/EPISODIC_MEMORY.md`, `PROJECT_CONTROL_LOG.md` | No new work in this phase; verification only | All checks pass; release tagged |

## Parallelism

- #6 (Cleanup B) and #7 (TS0 / RDG0) and #9 (QA slice 0) can run in parallel after #5.
- #20 (Observability) can start as soon as #5 is in and the owner channel is picked (D-26).
- #11 (A0) gates the security / booking / UIX0 / MOTION0 implementation phases.
- #12 (Security 1 — Worker) is the foundation for #13 (Auth) and #16 (Booking B).
- #15 (Booking A) can run ahead of #13 (Auth) if the owner chooses the anon-key write path; otherwise it depends on the Worker.

## Hard rules (enforced across all phases)

- **No D0 before PM1 and PD1 (if required).** D0 depends on PM1 review.
- **No A0 before D0.** A0 depends on D0.
- **No feature agents before A0.** IMPL phases depend on A0.
- **No package installs before TS0 / RDG0 approval.** TS0 setup is its own gated phase.
- **No UIX0 / MOTION0 implementation before PM1, D0, A0, and tooling decisions.** UIX0 / MOTION0 depends on PM1, D0, A0, and TS0 setup.
- **No lockfile deletion before Cleanup B.** Cleanup B is its own gated phase.
- **No README edits before Cleanup A.** Cleanup A is its own gated phase.
- **No security or booking fix before their respective gated phases.** Each is a separate phase with its own gate.
- **No D-011 / D-012 implementation outside an approved UIX0 / MOTION0 phase.** D-011 and D-012 are capture-only decisions until #24.
- **No copy / scrape / clone of `befluence.pro` or any reference site.** Reference only.

## File ownership summary (allowed zones per phase)

| Zone | Owner phases |
|---|---|
| `docs/` | most phases; PM1, D0, A0, IMPL, all cleanup, security, booking, observability, UIX0 / MOTION0, QA |
| `memory/` | most phases; append-only for `EPISODIC_MEMORY.md`, `IMPORTANT_DECISIONS.md`, `WORKING_MEMORY.md`; rewrite OK for `CURRENT_STATE.md`, `ACTIVE_TASK_CONTEXT.md` (most-recent-writer-wins) |
| `ai/` | PM1 (read-only on rules; can update `AI_TASK_CAPSULE.md`, `AI_CONTEXT_RULES.md`); IMPL (can update `AI_REPO_MAP.md`, `AI_FILE_OWNERSHIP.md`); DOC-MEMORY-REPAIR (initial creation) |
| `repo-research/` | any phase; planning scratchpad |
| `PROJECT_CONTROL_LOG.md` | any phase (append-only) |
| `INTEGRATION_NOTES.md` | any phase (append / update prose) |
| `package.json` | IMPL phases only; `packageManager` field gated to Cleanup B (if pnpm) |
| Both lockfiles | Cleanup B only (drop one) + TS0 setup (regenerate if needed) |
| `tsconfig.json` | IMPL phases only; gated |
| `next.config.mjs`, `postcss.config.mjs`, `components.json` | IMPL phases only; gated |
| `.env*` | IMPL phases only; gated |
| `public/_headers` | IMPL phases only; gated; CSP changes require #18 (CI guard) |
| `public/_redirects` | IMPL phases only; gated |
| `app/**`, `components/**`, `hooks/**`, `lib/**` | IMPL phases only; gated per workstream |
| `README.md` | Cleanup A only; gated |
| `DEPLOY.md` (root) | Cleanup A or B; gated |
| `.gitignore` | Cleanup A, Cleanup B, Setup, IMPL (rare); gated |

## Safety confirmation (this file)

- This file is documentation only. No code, no installs, no config.
- No source / runtime / config files were modified to produce this file.
- This file lives in the allowed change zone (`repo-research/`).
