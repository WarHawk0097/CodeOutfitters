# Working Memory

Live scratchpad for the current session and the next session that resumes this work. Update before stopping.

## Current Task

**Booking A/B live cleanup and state record (2026-06-18).** Booking A live availability was verified on `https://codeoutfitters.pages.dev/book` — July 2026 slots load and render. Booking B live browser booking was verified — a live booking by Tayyab Sana Ullah (2026-06-18 3:00 PM) succeeded end-to-end. Worker 204 OPTIONS repair was deployed and verified. Temporary diagnostic surfaces removed. Booking success copy updated. Project state docs updated. Next recommended phase: Observability, then UIX0/MOTION0.

**Previous: Booking B runtime state record (2026-06-16; documentation-only state sync).** The owner has confirmed Booking B is **applied and verified at runtime** (2026-06-16). The owner applied the SQL migration at `supabase/migrations/20260616_booking_b_reserve_slot.sql` (629 lines; the function signature is `public.reserve_slot(p_date date, p_time text, p_booking jsonb) returns uuid`; `SECURITY DEFINER`, `VOLATILE`, `SET search_path = pg_catalog, public`; row lock + `UNIQUE (preferred_date, preferred_time)` constraint; `service_role` EXECUTE only; anon and authenticated do **not** have EXECUTE; the migration was authored post-Repair 1 so no repair was required for this round). The owner deployed the Booking Worker on 2026-06-16 via the Cloudflare dashboard paste of `workers/booking-reservation-worker.dashboard.js` (the dashboard editor rejected the `.ts` source with a strict-mode syntax error; the JS dashboard copy is the dashboard-paste form — Booking B Repair 1, 2026-06-16). The Worker's required env vars (`ALLOWED_ORIGIN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) were configured; n8n vars were intentionally left for later. The Worker smoke test passed: the owner called the Worker and received `bookingId = 69e071f0-8954-4da1-bcb4-75f272bd2b87` with `notification = "skipped"`. Supabase verification confirmed the booking row exists; `available_slots.is_booked = true` was flipped; a duplicate booking test returned `slot_already_booked` (`P0001`). The repo previously said Booking B was "code-shipped at the write path level" and "deferred at the runtime level" — that is no longer true. This task updates documentation/state files to reflect the runtime state. **No source code change. No SQL applied by OpenCode. No Worker deployed by OpenCode.** The on-disk SQL migration is unchanged. The Worker source files are unchanged. The frontend is unchanged. `.env.local.example` is unchanged. No `git add`, no `git commit`, no `git push`, no `git remote add`, no `git fetch`, no `git pull`, no `wrangler deploy`, no `npm install`, no `pnpm install`, no `yarn install`, no `npx`, no `psql`, no `supabase` CLI command, no database command of any kind. No source edits in this task — only documentation/state file updates. No Observability, no QA, no TS0 / RDG0 install, no UIX0 / MOTION0, no Admin future, no Final QA / delivery work started, no Ponytail / ECC install / clone / copy / configure / evaluation. **Known non-blocking issue:** the `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`). Recorded as a future minor repair / Booking-B-adjacent cleanup; do not start that repair unless explicitly approved. **Remaining deployment gap (informational, not a Booking B defect):** the Cloudflare Pages project is connected to GitHub; the current Pages deployment is still old GitHub code (pre-Booking-B frontend). The Worker is end-to-end functional at the Worker level (smoke test passed; Supabase verification passed); the browser-driven end-to-end flow cannot be live-tested through Pages until the updated local code is pushed/deployed. **Git push / remote remains blocked** until the owner explicitly approves final delivery deploy (per the 2026-06-16 Control Room correction on git push / commit policy).

## Phase Gate

- DOC-DISCOVERY: completed
- DOC-MEMORY-REPAIR: completed
- OVERNIGHT-SAFE-PRE8-AND-PM1-PREP: completed
- PM1: written; pending ChatGPT Control Room review
- PD1: written; pending ChatGPT Control Room review
- D0: written; pending ChatGPT Control Room review
- D0 ECC addendum: written; pending ChatGPT Control Room review
- A0: **APPROVED by ChatGPT Control Room as of 2026-06-16**
- Setup: run; first commit OPTIONAL (not a substitute for A0 review; not a precondition for Cleanup A)
- Cleanup A: run (2026-06-16); README repaired; `DEPLOY.md` deleted; portfolio copy truth fixed; contact form `source: "contact"` added; `.gitignore` confirmed clean; ESLint config deferred
- Cleanup B: run (2026-06-16); `pnpm-lock.yaml` deleted; `package-lock.json` canonical; `pnpm-lock.yaml` listed in `.gitignore`; `package.json` untouched; R-002 closed; CI re-entry guard gated to TS0 / RDG0
- Security 1: run (2026-06-16); Worker source `workers/anthropic-proposal-proxy.ts`; frontend `lib/proposal-generator.ts` calls Worker; `NEXT_PUBLIC_ANTHROPIC_API_KEY` deprecated; `NEXT_PUBLIC_PROPOSAL_WORKER_URL` added; `ANTHROPIC_API_KEY` server-side; CSP updated; R-002 closed at runtime level; F-001 implemented; CORS is not auth (Security 2 is the next gate)
- Security 2: run (2026-06-16); Cloudflare Access is the real admin boundary (D-020a LOCKED DEFAULT); `app/admin/layout.tsx` convenience gate explicitly labeled; `NEXT_PUBLIC_ADMIN_PASSWORD` deprecated as security; R-001 addressed at deployment level; F-002 implemented for the deployed path; no Cloudflare Access app was created in this phase (owner creates it in the Cloudflare Zero Trust dashboard); Worker-level JWT verification is a follow-up
- Security 3: run (2026-06-16); **SQL applied and verified at runtime by owner (2026-06-16)**; R-003 closed at SQL level and the runtime level; F-003 implemented at SQL level and verified at the runtime level; R-003 closed end-to-end
- Security 4: run (2026-06-16); forms Worker source `workers/n8n-form-proxy.ts`; four forms (contact, quote, newsletter, booking) now POST to `NEXT_PUBLIC_FORMS_WORKER_URL`; `NEXT_PUBLIC_N8N_WEBHOOK_URL` deprecated; per-form secrets server-side in the Worker; `X-CodeOutfitters-Form-Secret` header added server-side; CSP `connect-src` updated; R-005 / R-017 addressed at deployment level; F-006 implemented at deployment level; deferred at runtime level until the owner deploys the forms Worker and configures the n8n workflow
- **Booking A: run (2026-06-16); SQL applied and verified at runtime by owner (2026-06-16) after Booking A Repair 1; Booking A live grant repair applied and verified; R-005 partially closed at the read path level and verified at the runtime level; F-004 implemented for the read path and verified at the runtime level; `createBooking` was intentionally unchanged and was replaced wholesale in Booking B**
- **Booking B: run (2026-06-16); SQL applied and verified at runtime by owner (2026-06-16); Booking Worker deployed by owner via Cloudflare dashboard paste of `workers/booking-reservation-worker.dashboard.js`; R-005 fully closed at the runtime level; F-004 fully closed at the runtime level; Worker smoke test passed (`bookingId = 69e071f0-8954-4da1-bcb4-75f272bd2b87` with `notification = "skipped"`); Supabase verification confirmed; duplicate booking test returned `slot_already_booked` (`P0001`)**
- **Observability: next eligible implementation phase, but NOT started. Blocked until ChatGPT Control Room issues the exact Observability prompt.**
- Cleanup B: blocked
- Security 1..5: blocked
- QA Slice 0..3: blocked
- UIX0 / MOTION0 Planning: blocked
- UIX0 / MOTION0 first slice + later slices: blocked
- Admin future: blocked
- Final QA / delivery: blocked
- Coding: blocked

## Active Restrictions

- Do not edit files under `app/`, `components/`, `lib/`, `hooks/`, `public/`, `*.config.*`, `package.json`, `tsconfig.json`, or either lockfile.
- Do not run any package manager.
- Do not install any tooling.
- Do not start Cleanup A, Cleanup B, Security 1..5, Booking A / Booking B, Observability, QA Slice 0..3, UIX0 / MOTION0 Planning, UIX0 / MOTION0 first slice, UIX0 / MOTION0 later slices, Admin future, Final QA / delivery, or any IMPL work.
- Do not edit `README.md` or delete `DEPLOY.md`.
- Do not re-initialize git. Git is already initialized with `git init -b main` at `F:\CodeOutfitters`. Do not run `git init` again. Do not run `git init` in any sub-directory.
- Do not run `git add`, `git commit`, `git push`, `git remote add`, `git fetch`, or `git pull` until the owner runs the first commit manually (per `repo-research/SETUP_FIRST_COMMIT_PLAN.md` §8) or the next Setup-AGENT invocation is explicitly told to commit.
- Do not run `git push`, `git remote add`, create a GitHub repo, or publish the code. Default to no remote until final delivery approval.
- Local commits are OPTIONAL. The first commit is not a precondition for Cleanup A. The owner may commit locally for rollback safety or defer all commits to final delivery. The agent does not commit on the owner's behalf.
- Do not install, clone, copy, configure, or evaluate **Ponytail** (candidate only; not approved; gated to TS0 / RDG0).
- Do not install, clone, copy configs from, configure, or evaluate **ECC / affaan-m/ecc** (candidate only; not approved; gated to TS0 / RDG0).

## A0 plan summary (carried forward from `docs/A0_ACTION_PLAN.md` §5 and the three companion tables)

The future phase sequence (20 phases) is:

1. **Setup** — confirm `F:\CodeOutfitters` is the real repo root; `git init` (gated); review `.gitignore`; first commit.
2. **Cleanup A** — README repair; `DEPLOY.md` delete (Q-13); portfolio copy fix (R-019); `source: "contact"` (Q-14); `tsconfig.tsbuildinfo` to `.gitignore` (R-025); ESLint config (R-026).
3. **Cleanup B** — drop one lockfile (D-015 default: `pnpm-lock.yaml`); update `.gitignore`; update docs; if pnpm, add `packageManager` to `package.json`.
4. **Security Phase 1** — Cloudflare Worker proxy for Anthropic. Closes R-002, R-004, LG-1.
5. **Security Phase 2** — Real admin auth (Cloudflare Access for fast internal protection; Supabase Auth / magic link if admin becomes productized). Closes R-001, R-003, R-029, LG-2.
6. **Security Phase 3** — Supabase RLS. Closes R-006, LG-3.
7. **Security Phase 4** — n8n per-form secret + header. Closes R-017.
8. **Booking Phase A** — UI reads slots + wire to `createBooking` (or successor) + n8n path + graceful degradation + seed lifecycle. Closes R-005, R-007, R-031, LG-4.
9. **Booking Phase B** — `reserve_slot` RPC + Worker + `UNIQUE (preferred_date, preferred_time)` constraint. Closes R-005 (full).
10. **Observability** — Sentry (errors) + UptimeRobot (uptime) + n8n delivery monitor + booking failure wrap + email channel. Closes R-010, R-035.
11. **QA Slice 0** — `tsc --noEmit` + `eslint.config.mjs` (already in Cleanup A) + GitHub Actions. Closes R-008 (partial), R-009.
12. **TS0 / RDG0 Tooling Approval Phase** — submit 9 tools + Ponytail candidate + ECC candidate for per-tool owner / Control Room approval. Documentation-only.
13. **QA Slice 1** — Real Playwright test runner + smoke spec. Closes R-008 (full).
14. **QA Slice 2** — Lighthouse CI + visual regression + Chrome DevTools MCP integration. Closes R-013, R-014 (enforced budget), R-012 (taste review evidence).
15. **QA Slice 3** — Form / booking / admin / a11y tests + bundle size guard.
16. **UIX0 / MOTION0 Planning Phase** — convert D-011 and D-012 into a motion plan; performance budget; reduced motion; mobile rules; admin lighter motion.
17. **UIX0 / MOTION0 Implementation Phase (first slice)** — hero + headline + scroll reveals + ROI micro-interactions + reduced-motion coverage (one PR). Closes R-012, R-013 (partial), R-014, R-015, R-021.
18. **UIX0 / MOTION0 Implementation Phase (later slices)** — parallax, magnetic buttons, portfolio motion depth, process timeline animation, contact / booking form transitions, marquee polish, stat counters (each slice a separate PR).
19. **Admin Future Phase** — Recent Proposals viewer (A first, B later). Closes R-018 (partial).
20. **Final QA / Delivery Phase** — full manual checklist + automated smoke + deploy checklist + Cloudflare post-deploy checks.

The future agents (16 named in `repo-research/A0_AGENT_ASSIGNMENT_MATRIX.md`):

- SETUP-AGENT
- CLEANUP-A-AGENT
- CLEANUP-B-AGENT
- SECURITY-1-WORKER-AGENT
- SECURITY-2-AUTH-AGENT
- SECURITY-3-RLS-AGENT
- SECURITY-4-N8N-AGENT
- BOOKING-A-AGENT
- BOOKING-B-AGENT
- OBSERVABILITY-AGENT
- QA0-AGENT
- TS0-RDG0-TOOLING-AGENT
- QA1-AGENT
- QA2-AGENT
- QA3-AGENT
- UIX0-MOTION-PLAN-AGENT
- UIX0-MOTION-IMPL-AGENT
- ADMIN-FUTURE-AGENT
- FINAL-QA-AGENT

The file-zone classification (per `repo-research/A0_CHANGE_ZONE_MAP.md`):

- Always allowed (planning / state): `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md` (prose only).
- Cleanup A: `README.md` (surgical), `DEPLOY.md` (delete), `app/(public)/portfolio/page.tsx` (copy), `components/contact.tsx` (one field), `.gitignore`, `eslint.config.mjs` (new).
- Cleanup B: the dropped lockfile (delete), `.gitignore`, `docs/SETUP.md`, `docs/DEPLOYMENT.md`, `README.md` (already repaired), if pnpm `package.json` (gated `packageManager` field only).
- Security 1: `lib/proposal-generator.ts`, `app/admin/proposal/page.tsx`, new Worker source, `public/_headers` (CSP update; gated), docs.
- Security 2: `app/admin/layout.tsx`, `app/admin/page.tsx`, `lib/supabase.ts` (Auth), docs. Cloudflare Access policy is set at the Cloudflare dashboard.
- Security 3: `lib/booking-schema.sql` (RLS policies, RPCs), `lib/booking-actions.ts` (RPC call shape, if changed), docs.
- Security 4: `components/quote-form.tsx`, `components/contact.tsx`, `components/booking-calendar-custom.tsx`, `components/newsletter.tsx` (header), n8n workflow (out-of-repo), `INTEGRATION_NOTES.md`, docs.
- Booking A: `components/booking-calendar-custom.tsx`, `lib/booking-actions.ts`, `lib/booking-schema.sql` (re-seed script), docs.
- Booking B: `lib/booking-schema.sql` (RPC, unique constraint), `lib/booking-actions.ts`, Worker source, docs.
- Observability: `components/error-boundary.tsx` (Sentry wire), `lib/booking-actions.ts` (Sentry wrap), new monitor scripts, n8n workflow, `INTEGRATION_NOTES.md`, docs.
- QA Slice 0: `package.json` (script field only), `eslint.config.mjs`, `.github/workflows/ci.yml` (new), docs.
- TS0 / RDG0: `repo-research/TS0_RDG0_REQUEST.md` (new), docs.
- QA Slice 1: `package.json` (devDep; Playwright), `playwright.config.*` (new), `tests/` (new; smoke spec only), `.github/workflows/ci.yml`, docs.
- QA Slice 2: `package.json` (devDeps; Lighthouse, Playwright plugins), `tests/` (visual regression specs), `.github/workflows/ci.yml` (Lighthouse job), `.lighthouserc.*` (new), docs.
- QA Slice 3: `tests/` (new specs), `package.json` (devDeps; axe-core, size-limit, etc.), `.github/workflows/ci.yml` (new jobs), docs.
- UIX0 / MOTION0 Planning: `docs/`, `repo-research/`, `memory/`, `ai/`, `PROJECT_CONTROL_LOG.md`.
- UIX0 / MOTION0 first slice: `components/hero.tsx` (animation), `components/aos-provider.tsx` (reduced-motion opt-out), `hooks/useScrollReveal.ts` (collapse duplicates; respect reduced-motion), `components/roi-calculator.tsx` (micro-interactions), `lib/animations/` (collapse to one canonical setup; respect reduced-motion), docs.
- UIX0 / MOTION0 later slices: `components/`, `hooks/`, `lib/animations/`, `docs/`, `memory/`, `PROJECT_CONTROL_LOG.md`. Each slice is a separate PR.
- Admin future: `app/admin/page.tsx` (list view), `app/admin/proposal/page.tsx` (persistence on generate), `components/admin/`, `lib/proposal-generator.ts` (if persistence changes the flow), `lib/supabase.ts` (proposals table), docs.
- Final QA / delivery: `docs/QA_CHECKLIST.md`, `docs/DEPLOYMENT.md`, `memory/EPISODIC_MEMORY.md`, `PROJECT_CONTROL_LOG.md`. Verification only.

## A0 reflection of PD1 LOCKED DEFAULTS (carried forward)

| D-ID | Topic | PD1 lock status | A0 reflection |
|---|---|---|---|
| D-015 | Package manager = `npm` | LOCKED DEFAULT | A0 reflects `npm` canonical; Cleanup B drops `pnpm-lock.yaml`. |
| D-016 | Real business launch | LOCKED DEFAULT | A0 reflects real business first; launch gates (LG-1..LG-10) gate any non-internal launch. |
| D-017 | Admin internal-only | LOCKED DEFAULT | A0 reflects internal-only admin; Admin future phase stays internal-only. |
| D-018 | Security as launch gate | LOCKED DEFAULT | A0 reflects security as a launch gate; Security 1..5 all block launch. |
| D-019 | Booking correctness as launch gate | LOCKED DEFAULT | A0 reflects booking correctness as a launch gate; Booking A and Booking B block launch. |
| D-020 | Supabase RLS as launch gate | LOCKED DEFAULT | A0 reflects RLS as a launch gate; Security 3 closes LG-3. |
| D-021 | Motion priority (balanced with §8.7 budget) | LOCKED DEFAULT | A0 reflects balanced motion priority; UIX0 / MOTION0 first slice honors the budget. |
| D-022 | BeFluence reference only | LOCKED DEFAULT | A0 reflects reference only; no copy / scrape / clone. |
| D-023 | Tooling order per §7.2 | LOCKED DEFAULT | A0 reflects the §7.2 order; TS0 / RDG0 submission in the §7.2 order. |
| D-024 | Impeccable / Emil install scope = per-project, gated | LOCKED DEFAULT | A0 reflects per-project + gated; UIX0 / MOTION0 first slice. |
| D-025 | Recent Proposals viewer: A now, B later | LOCKED DEFAULT | A0 reflects A first, B later; Admin future phase. |
| D-026 | Observability vendor = Sentry + UptimeRobot + email | LOCKED DEFAULT | A0 reflects Sentry + UptimeRobot + email; Observability phase. |
| D-027 | Git / repo root status = `git init` at `F:\CodeOutfitters` in Setup phase (only if confirmed) | LOCKED DEFAULT | A0 reflects confirm-root + `git init` in Setup. |

## A0 reflection of PD1-shadowed architectural-path options (NEEDS OWNER APPROVAL)

| ID | Question | A0 default reflection |
|---|---|---|
| D-019a | Anthropic protection path | Cloudflare Worker proxy (Security 1). |
| D-020a | Admin auth path | Cloudflare Access for fast internal protection; Supabase Auth / magic link if admin becomes productized (Security 2). |
| D-019b | Booking MVP write path | A first (UI reads `available_slots`), then C (n8n handles booking validation) (Booking A). |
| D-022a | Performance budget | Accept PM1 §8.7. |
| D-021a | Test runner form | Both: real Playwright runner + Playwright MCP / Chrome DevTools MCP for the visual QA loop. |
| D-021b | Observability vendor choice | Sentry + UptimeRobot. GlitchTip / Better Stack as fallback. |

## A0 reflection of PD1 bundled follow-up items (Q-13..Q-21) and the D0 ECC addendum (Q-22)

- Q-13: delete `DEPLOY.md` in Cleanup A.
- Q-14: add `source: "contact"` in Cleanup A.
- Q-15: see D-020a.
- Q-16: see D-022a.
- Q-17: D-012 avoid / prefer list + Impeccable + Emil review (taste rubric LOCKED DEFAULT).
- Q-18: see D-021a.
- Q-19: see D-021b.
- Q-20: keep static "All systems operational" badge in MVP; document as known limitation (R-035); replace in Observability phase.
- Q-21: see D-027.
- **Q-22 (D0 ECC addendum):** ECC / affaan-m/ecc candidate only. **NOT APPROVED.** Gated to TS0 / RDG0. Recommended default: research during future TS0 / RDG0 only; do not install now.

## D0 Tooling Candidate — Ponytail (NOT APPROVED, carried forward)

- **Status:** candidate only. NOT APPROVED. Gated to TS0 / RDG0. Owner must provide the exact official GitHub repo URL, pinned version, and scope (default: reference-only) before TS0 / RDG0 evaluation. The future TS0 / RDG0 submission must answer the seven evaluation questions in `docs/PD1_DECISION_LOCK.md` §6.1.
- **Hard rules:** no install, no clone, no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install, in this batch or any pre-approval phase.

## D0 ECC addendum — Open Question (NOT APPROVED, carried forward)

- **Q-22 (new, D0 ECC addendum):** Should ECC / affaan-m/ecc (https://github.com/affaan-m/ecc) be evaluated for adoption as a developer / AI agent harness tool, and if so, in what scope (global / per-project / reference-only; default: reference-only)?
- **Owner input required:** exact official GitHub repo URL (canonical upstream), pinned version or commit SHA, scope preference, and the ten evaluation questions (see `docs/D0_ARCHITECTURE_DECISIONS.md` §11 and `docs/D0_SYSTEM_DESIGN.md` §7.10).
- **Status:** **NOT APPROVED.** Candidate only. Gated to **TS0 / RDG0**.
- **Recommended default:** research during future TS0 / RDG0 only; do not install now.
- **Why it may be relevant:** the owner uses Codex, OpenCode, Claude Code, and multiple agents. ECC may provide an agent-harness layer that overlaps with or complements existing candidates.
- **Overlap risk:** ECC may overlap with Graphify, Repomix, Context7 MCP, Playwright MCP, Chrome DevTools MCP, Impeccable, Emil Kowalski, Ponytail, Tree-sitter, and codebase-memory. ECC must be evaluated before adoption. ECC should not be blindly stacked with other agent harness tools.
- **Hard rules:** no install, no clone, no `git clone`, no copy of config folders, no copy of `.opencode/`, `.codex/`, `.claude/`, `.mcp.json`, or any MCP configs; no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install, in this batch or any pre-approval phase.

## A0 integration sequencing clarifications (appended to `INTEGRATION_NOTES.md` §8, additive only)

- **Anthropic Worker path (Security 1):** the browser calls the Worker; the Worker holds the Anthropic key as a server-side env var. CSP updated to include the Worker origin. `NEXT_PUBLIC_ANTHROPIC_API_KEY` is removed from the build output.
- **n8n per-form secret (Security 4):** each form POSTs with a header containing the per-form secret. n8n verifies the header against a workflow-level env var. Unsigned requests are dropped.
- **Supabase RLS (Security 3):** `ENABLE ROW LEVEL SECURITY` on `bookings` and `available_slots`; anon role `USING (false)`; explicit narrow grants for the `get_available_slots` and (post-Worker) `reserve_slot` RPCs; `service_role` retains full access (used by the Worker).
- **Observability alert channel (Observability):** email to `hello@codeoutfitters.com` is the default owner channel. Discord webhook is the free fallback. UptimeRobot watches `/`, `/contact`, `/book`.
- **Git / repo root setup contract (Setup):** Q-21 / D-027 owner confirmation. If confirmed, `git init` at the confirmed root. The first commit is a snapshot of the current state. No source edits.
- **Ponytail / ECC candidate status (TS0 / RDG0):** both are candidates only. Both are NOT APPROVED. Both are gated to TS0 / RDG0. Both require exact official GitHub repo URL + pinned version + scope (default: reference-only) before any evaluation.
- **Admin persistence contract (Admin future):** Option A: surface `localStorage.co_last_proposal` in the existing tile; no new persistence. Option B: persist proposals to Supabase / Worker + KV; list on the dashboard with click-through.
- **UIX0 / MOTION0 first-slice contract:** hero + headline + scroll reveals + ROI micro-interactions + reduced-motion coverage in one PR. AOS opt-out; GSAP opt-out; Framer Motion opt-out. LCP / CLS / INP within the §8.7 budget.

## Next Concrete Action (gated)

After ChatGPT Control Room approves A0:

- The IMPL phases may proceed in the order named in §5 of `docs/A0_ACTION_PLAN.md` and `repo-research/A0_PHASE_EXECUTION_QUEUE.md`. Parallelism is allowed where the rows say so.
- The next agent (the SETUP-AGENT) may begin Setup, gated to Q-21 / D-027 owner confirmation. The SETUP-AGENT confirms the repo root, may run `git init` (gated), reviews `.gitignore`, and creates the first commit. The SETUP-AGENT does not start any subsequent phase.
- A0 may proceed against the accepted A0 plan and the PD1 LOCKED DEFAULTS if the owner returns Accept on the A0 plan. The owner can also override individual rows; overrides are recorded in the response and the next agent reads them first.

## Booking A phase outputs (2026-06-16)

- SQL migration written at `supabase/migrations/20260616_booking_a_get_available_slots.sql`. Heavily commented. Idempotent. Reversible. Creates only the `get_available_slots` function. No `reserve_slot`. No `bookings` changes. No table shape changes. No env var changes.
- The RPC: `public.get_available_slots(p_month int, p_year int) returns TABLE(id uuid, date date, time text)`. `SECURITY DEFINER`, `STABLE`, `SET search_path = pg_catalog, public`, `LANGUAGE plpgsql`. Filters `is_booked = false` server-side. Returns rows ordered by date then time. Anon is granted `EXECUTE`. Service_role is granted `EXECUTE`. No anon `SELECT` on `available_slots`.
- `lib/booking-actions.ts:35` `getAvailableSlots(month, year)` rewritten to call `supabase.rpc('get_available_slots', { p_month, p_year })`. Same input shape, same return shape, same error shape. Input validation: `p_month` 1..12, `p_year` 1970..2100. `createBooking` (line 107) is **intentionally unchanged**; the function's docstring records the gate to Booking B.
- `components/booking-calendar-custom.tsx` calls `getAvailableSlots(month, year)` for the displayed month via `useEffect`. Loading and error states added. Date picker disables days with zero available slots. Time picker renders only the times actually available for the selected date. Submit handler unchanged (still posts to `NEXT_PUBLIC_FORMS_WORKER_URL` with `type: "booking"`). UI design, step indicator, form fields, placeholder text (`+1 (555) 123-4567`), validation, honeypot, and type field all unchanged.
- `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md` written. Primary deliverable. Covers current problem, SQL file created, RPC contract, frontend files changed, owner-side application steps, verification queries, known remaining risks, Booking B dependency, rollback plan, testing checklist, sign-off.
- `docs/DATABASE.md` updated (Booking A status banner; "How the app reads and writes" section; "Known issue" section).
- `docs/SECURITY.md` updated (Booking A status banner; explicit "SQL NOT applied" language; `createBooking` documented as blocked until Booking B).
- `docs/DEPLOYMENT.md` updated (new "Booking A — Available slots RPC" section; post-deploy checklist extended).
- `INTEGRATION_NOTES.md` §2 and §8.3 updated additively.
- `PROJECT_CONTROL_LOG.md` updated (Booking A batch overlay; phase history row; gate status row; "Exact next gate after Booking A" section).
- `memory/CURRENT_STATE.md` updated (Booking A entry in "What is done" / "What is blocked" / "Exact next gate" sections).
- `memory/ACTIVE_TASK_CONTEXT.md` replaced with Booking A task; in-scope and out-of-scope lists; definition of done.
- `memory/EPISODIC_MEMORY.md` (Booking A event appended).
- `memory/IMPORTANT_DECISIONS.md` (Booking A reflection note appended; D-019b reaffirmed; no new D-IDs).
- `ai/AI_TASK_CAPSULE.md` (phase line updated; never-do list extended).
- `ai/AI_CONTEXT_RULES.md` (Booking A hard rule added; future-phase boundary rule reaffirmed).
- `docs/51_AGENT_HANDOFF_LOG.md` (Booking A entry appended).
- `**NOT APPLIED**. The owner pastes the SQL into the Supabase SQL editor and runs it. The calendar will continue to surface "could not load availability" until the migration is in the database. The write path is unchanged. R-005 is partially closed at the read path level; R-005 is fully closed only when Booking B ships.
- D-019b reaffirmed. No new D-IDs. The D-IDs in `memory/IMPORTANT_DECISIONS.md` remain canonical.

## Booking A runtime state record (2026-06-16)

- **Security 3 runtime = applied and verified (confirmed by owner 2026-06-16).** `public.bookings` and `public.available_slots` have `relrowsecurity = true` and `relforcerowsecurity = true`. Four RLS policies exist: `anon_deny_all_available_slots`, `service_role_full_access_available_slots`, `anon_deny_all_bookings`, `service_role_full_access_bookings`. Base schema in place; `public.available_slots` was seeded with 840 slots. **R-003 closed end-to-end.** F-003 verified at the runtime level.
- **Booking A runtime = applied and verified (confirmed by owner 2026-06-16).** `public.get_available_slots(p_month int, p_year int)` was applied manually by the owner after Booking A Repair 1. Function verification (read from `pg_proc`): `function_name = get_available_slots`, `arguments = p_month integer, p_year integer`, `returns = TABLE(id uuid, date date, "time" text)`, `security_definer = true`, `provolatile = 's'`, `proconfig = ['search_path=pg_catalog, public']`. Smoke test passed: `SELECT date, "time" FROM public.get_available_slots(6, 2026) ORDER BY date, "time" LIMIT 20` returned available slots from seeded dates.
- **Booking A Repair 1 = passed and applied to the on-disk migration.** Supabase rejected the original SQL with `ERROR: 42601: syntax error at or near "time"` at LINE 195. The on-disk migration was repaired to quote `"time"` in `RETURNS TABLE` (`"time" text`), in the inner `SELECT` (`s."time" AS "time"`), and in `ORDER BY` (`ORDER BY s.date ASC, s."time" ASC`). The repaired SQL is the source of truth. The on-disk migration file is unchanged in this overlay (already in its post-Repair 1 form from the prior turn).
- **Booking A live grant repair = applied and verified.** The owner revoked any broad direct table privileges from `anon` and `authenticated` on `public.available_slots` and `public.bookings` (defense in depth on top of the Security 3 deny policies). The owner revoked `authenticated` `EXECUTE` on `public.get_available_slots` (the project has no authenticated user flow today; the role is denied by default and should not appear in the RPC grants). The owner restored the intended grants: `anon` `EXECUTE`; `service_role` `EXECUTE`. Final verification: `anon` has `EXECUTE` on `get_available_slots`; `service_role` has `EXECUTE` on `get_available_slots`; `authenticated` does **not** appear in the RPC grants; `anon` has no direct privileges on `available_slots`; `anon` has no direct privileges on `bookings`.
- **No source code change in this overlay.** No `package.json`, no lockfile, no `tsconfig.json`, no `next.config.*`, no `postcss.config.*`, no eslint / tailwind config, no real `.env*`, no `public/_headers`, no `workers/**`, no `app/**`, no `components/**` (other than none — none were touched in this overlay), no `hooks/**`, no `styles/`, no `lib/**` (other than none — none were touched in this overlay), no `supabase/migrations/**` (the on-disk migrations are unchanged; runtime changes were applied by the owner in Supabase).
- **No `git add`, no `git commit`, no `git push`, no `git remote add`, no `git fetch`, no `git pull`.** The first commit is OPTIONAL. The agent does not push, does not add a remote, and does not create a GitHub repo.
- **No `npm install`, no `pnpm install`, no `yarn install`, no `npx`, no `npm run`, no `pnpm run`, no `yarn run`, no `wrangler deploy`, no `psql`, no `supabase` CLI command, no database command of any kind, no package-manager command of any kind.**
- **No `service_role` key in any `NEXT_PUBLIC_*` env var, in the static bundle, in the repo, or in any client-reachable file.**
- **No new env var of any kind. No `NEXT_PUBLIC_*_SECRET` env var.**
- **No `reserve_slot` SQL written. No `reserve_slot` RPC created. No `bookings` table changes. No new column / index / constraint on `available_slots`. No table shape changes.**
- **No Auth.js. No Supabase Auth. No server route. No middleware. No Next.js API route. No new npm dependency.**
- **No application of the Security 3 SQL migration by OpenCode.** Security 3 is applied and verified at runtime (confirmed by owner 2026-06-16). OpenCode did not apply it; OpenCode is only updating documentation/state files in this overlay.
- **No application of the Booking A SQL migration by OpenCode.** Booking A is applied and verified at runtime (confirmed by owner 2026-06-16 after Booking A Repair 1). OpenCode did not apply it; OpenCode is only updating documentation/state files in this overlay.
- **No MCP setup. No `.mcp.json` write. No `.opencode/`, `.codex/`, `.claude/` change. No Ponytail. No ECC / affaan-m/ecc. No Impeccable. No Emil Kowalski. No Playwright. No Chrome DevTools MCP. No Graphify. No Repomix. No Context7 MCP. No Tree-sitter. No codebase-memory MCP.**
- **No Worker deployment.** The Security 1 Worker (`workers/anthropic-proposal-proxy.ts`) and the Security 4 Worker (`workers/n8n-form-proxy.ts`) are unchanged. Deployment is owner-driven and not done in this overlay.
- **No Cloudflare Access app creation.** Owner-driven and not done in this overlay.
- **No n8n workflow configuration.** Owner-driven and not done in this overlay.
- **No new decisions in `memory/IMPORTANT_DECISIONS.md`.** This overlay only records runtime state and a Booking A Repair 1 reflection note. The D-IDs in `memory/IMPORTANT_DECISIONS.md` remain canonical.
- **No starting of Booking B.** No `reserve_slot` SQL written. No Worker changes. No transactional reservation code. **Booking B is the next eligible implementation phase** but is **not started** — it is blocked until ChatGPT Control Room issues the exact Booking B prompt.
- **Known non-blocking issue:** the `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`). Recorded as a future minor repair or Booking B-adjacent cleanup. Do not start that repair unless explicitly approved.

## Booking B phase outputs (2026-06-16)

- SQL migration on disk at `supabase/migrations/20260616_booking_b_reserve_slot.sql` (629 lines; pre-existing in the repo from a prior session; unchanged in this batch). Creates `public.reserve_slot(p_date date, p_time text, p_booking jsonb) returns uuid`. `SECURITY DEFINER`, `VOLATILE`, `SET search_path = pg_catalog, public`, `LANGUAGE plpgsql`. Validates inputs. Holds a `SELECT ... FOR UPDATE` row lock on the matching `available_slots` row. Raises `'slot_already_booked'` / `'slot_not_found'` (`P0001`) on conflict. Inserts the booking and flips the slot — all in a single transaction. Adds a `UNIQUE (preferred_date, preferred_time)` constraint on `bookings` as a last-line defense. Quotes `s."date"` and `s."time"` everywhere. Idempotent. Reversible. Grants: `service_role` `EXECUTE` only. **Anon is NEVER granted EXECUTE on `reserve_slot`.** The owner applied the SQL on 2026-06-16; the RPC is in the database; the booking flow is end-to-end functional at the Worker level.
- Booking Worker source at `workers/booking-reservation-worker.ts` (~440 lines). CORS gate (`ALLOWED_ORIGIN`). Payload validation (date ISO, time non-empty, name 100, email regex, company 100, phone 20, message 2000). Calls `POST ${SUPABASE_URL}/rest/v1/rpc/reserve_slot` with `apikey` and `Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}`. Returns `200 { bookingId, notification }` on success; `400 invalid_input` on RPC 22023; `409 slot_already_booked` / `slot_not_found` / `slot_taken` on conflict; `500` on upstream / config errors. Optional n8n forward with `X-CodeOutfitters-Form-Secret` header and `type: 'booking'` body field. No npm dependencies. No `service_role` key in the static bundle.
- Dashboard JS copy at `workers/booking-reservation-worker.dashboard.js` (~400 lines; Booking B Repair 1, 2026-06-16). 1:1 runtime port of the TypeScript Worker with all TypeScript-only syntax removed. Used for the Cloudflare dashboard paste (the dashboard editor rejected the `.ts` source with a strict-mode syntax error).
- `lib/booking-actions.ts:createBooking` replaced wholesale per its own Booking A docstring. The new body is a thin client-side wrapper that posts to `${NEXT_PUBLIC_BOOKING_WORKER_URL}/` with `credentials: 'omit'` and `Content-Type: application/json`. The function preserves the `ActionResult<null>` contract: `200` → success; `409` → "this slot is no longer available"; `400` → validation error surfaced; other → generic message.
- `components/booking-calendar-custom.tsx:handleSubmit` updated to call `createBooking(formData)`. Imports updated to include `createBooking` and `BookingFormData`. **UI design unchanged**: step indicator, form fields, placeholder text, validation, honeypot, type field, success state, error state, the "No spam, ever." footer, the booking summary card, the back buttons.
- `.env.local.example` updated: added `NEXT_PUBLIC_BOOKING_WORKER_URL` with a comment block explaining the security model.
- `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md` written. Primary deliverable. 12-section structure: status line, current problem, SQL file created, RPC contract, Worker contract, frontend files changed, owner-side SQL application steps, owner-side Worker deployment steps, verification queries, frontend integration summary, known remaining risks, rollback plan, testing checklist, sign-off. Plus a §14 "Booking B Repair 1 — dashboard JS copy" section.
- `docs/DATABASE.md` updated (Booking B status banner; "How the app reads and writes" section; "Known issue" section).
- `docs/SECURITY.md` updated (Booking B status banner; explicit "SQL NOT applied" language; F-004 closed; `createBooking` documented as replaced; reservation path documented).
- `docs/DEPLOYMENT.md` updated (new "Booking B — Reserve Slot RPC + Worker" section; post-deploy checklist extended; "What is not part of the deploy" section extended).
- `INTEGRATION_NOTES.md` §2 and §8.3 updated additively (§2: `createBooking` replaced; §8.3: Booking B delivery entry appended; "Impact on the current booking flow" updated; the §8.3 `p_time time` typo corrected to `p_time text`).
- `PROJECT_CONTROL_LOG.md` updated (Booking B batch overlay; Booking B Repair 1 overlay; phase history row; gate status row; "Exact next gate after Booking B" section).
- `memory/CURRENT_STATE.md` updated (Booking B entry in "What is done" / "What is blocked" / "Exact next gate" sections).
- `memory/ACTIVE_TASK_CONTEXT.md` replaced with Booking B task; in-scope and out-of-scope lists; definition of done.
- `memory/EPISODIC_MEMORY.md` (Booking B event appended; Booking B Repair 1 event appended).
- `memory/IMPORTANT_DECISIONS.md` (Booking B reflection note appended; Booking B Repair 1 reflection note appended; no new D-IDs).
- `ai/AI_TASK_CAPSULE.md` (phase line updated; never-do list extended with Booking B-specific rules; "Things to be skeptical of" updated).
- `ai/AI_CONTEXT_RULES.md` (Booking B hard rule added; future-phase boundary rule reaffirmed; tooling-candidate rules reaffirmed).
- `docs/51_AGENT_HANDOFF_LOG.md` (Booking B entry appended; Booking B Repair 1 entry appended).
- **NOT applied by OpenCode.** The owner applied the Booking B SQL manually on 2026-06-16.
- **NOT deployed by OpenCode.** The owner deployed the Booking Worker manually on 2026-06-16 (via the Cloudflare dashboard paste of `.dashboard.js`).
- D-019b reaffirmed. No new D-IDs. The D-IDs in `memory/IMPORTANT_DECISIONS.md` remain canonical.

## Booking B runtime state record (2026-06-16)

- **Booking B SQL = applied and verified at runtime (confirmed by owner 2026-06-16).** `public.reserve_slot(p_date date, p_time text, p_booking jsonb)` exists with the documented signature. `bookings_preferred_date_time_unique` exists. The grant repair was applied: `anon` and `authenticated` do **not** have EXECUTE on `reserve_slot`; `service_role` has EXECUTE on `reserve_slot`. **R-005 is fully closed at the runtime level**; **F-004 is fully closed at the runtime level**.
- **Booking Worker = deployed and verified at runtime (confirmed by owner 2026-06-16).** The owner pasted `workers/booking-reservation-worker.dashboard.js` into the Cloudflare dashboard Worker editor and saved the deploy. Required Worker env vars were configured: `ALLOWED_ORIGIN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. n8n vars were intentionally left for later. Worker smoke test passed: the owner called the Worker and received `bookingId = 69e071f0-8954-4da1-bcb4-75f272bd2b87` with `notification = "skipped"`. Supabase verification confirmed the booking row was created in `public.bookings` for `preferred_date = 2026-06-17` / `preferred_time = '10:00 AM'`. Supabase verification confirmed `available_slots.is_booked = true` for `2026-06-17` / `10:00 AM`. A duplicate booking test returned `slot_already_booked` (`P0001`), which confirms the row lock + UNIQUE constraint defense in depth is working as designed.
- **No source code change in this overlay.** No `package.json`, no lockfile, no `tsconfig.json`, no `next.config.*`, no `postcss.config.*`, no eslint / tailwind config, no real `.env*`, no `public/_headers`, no `workers/**` (the Worker source files are unchanged; the runtime state of the Worker is what changed, not the source), no `app/**`, no `components/**` (the frontend is unchanged; the runtime state of the frontend's call to the RPC is what changed, not the source), no `hooks/**`, no `styles/`, no `lib/**` (the frontend is unchanged; the runtime state of the frontend's call to the RPC is what changed, not the source), no `supabase/migrations/**` (the on-disk migrations are unchanged; runtime changes were applied by the owner in Supabase).
- **No `git add`, no `git commit`, no `git push`, no `git remote add`, no `git fetch`, no `git pull`.** The first commit is OPTIONAL. The agent does not push, does not add a remote, and does not create a GitHub repo.
- **No `npm install`, no `pnpm install`, no `yarn install`, no `npx`, no `npm run`, no `pnpm run`, no `yarn run`, no `wrangler deploy`, no `psql`, no `supabase` CLI command, no database command of any kind, no package-manager command of any kind.**
- **No `service_role` key in any `NEXT_PUBLIC_*` env var, in the static bundle, in the repo, or in any client-reachable file.**
- **No new env var of any kind. No `NEXT_PUBLIC_*_SECRET` env var.**
- **No application of the Booking B SQL migration by OpenCode.** OpenCode did not apply it; OpenCode is only updating documentation/state files in this overlay. The owner applied it manually.
- **No deployment of the Booking Worker by OpenCode.** The Worker source is shipped; the owner deployed the Worker via the Cloudflare dashboard paste of the `.dashboard.js` file. OpenCode did not deploy.
- **No MCP setup. No `.mcp.json` write. No `.opencode/`, `.codex/`, `.claude/` change. No Ponytail. No ECC / affaan-m/ecc. No Impeccable. No Emil Kowalski. No Playwright. No Chrome DevTools MCP. No Graphify. No Repomix. No Context7 MCP. No Tree-sitter. No codebase-memory MCP.**
- **No new decisions in `memory/IMPORTANT_DECISIONS.md`.** This overlay only records runtime state and a Booking B runtime state record reflection note. The D-IDs in `memory/IMPORTANT_DECISIONS.md` remain canonical.
- **No starting of Observability.** **Observability is the next eligible implementation phase** but is **not started** — it is blocked until ChatGPT Control Room issues the exact Observability prompt. The agent does not start Observability, QA, TS0 / RDG0, UIX0 / MOTION0, Admin future, or Final QA / delivery.
- **Remaining deployment gap (informational, not a Booking B defect):** the Cloudflare Pages project is connected to GitHub; the current Pages deployment is still old GitHub code (pre-Booking-B frontend). The Worker is end-to-end functional at the Worker level (smoke test passed; Supabase verification passed); the browser-driven end-to-end flow cannot be live-tested through Pages until the updated local code is pushed/deployed. **Git push / remote remains blocked** until the owner explicitly approves final delivery deploy (per the 2026-06-16 Control Room correction on git push / commit policy). The Final QA / delivery phase (A0 future phase #20) is the future home for the Git push / Pages final delivery.
- **Known non-blocking issue:** the `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`). The frontend sorts the times for the selected date using a hard-coded `TIME_SLOTS` array, so the order is correct in the UI even when the RPC's order is not. Recorded for a future minor repair or Booking-B-adjacent cleanup. Do not start that repair unless explicitly approved.

## Setup phase outputs (2026-06-16)

- Root confirmed: `F:\CodeOutfitters`. `pwd` returned `F:\CodeOutfitters` before any action.
- `git init -b main` run at the confirmed root. No commits created. No remote added. No push.
- `.gitignore` repaired and extended:
  - Corruption on line 15 (`.DS_Storenode_modules`) fixed — split into `.DS_Store` and `node_modules/`.
  - Missing safe entries added: `dist/`, `build/`, `tsconfig.tsbuildinfo`, `*.log`, `logs/`.
  - `node_modules/` normalized to trailing-slash form.
  - No broad patterns added; no source-file hides; no lockfile pre-emption; no `pnpm-lock.yaml` pre-ignore.
- `repo-research/SETUP_FIRST_COMMIT_PLAN.md` written. First commit message drafted. Manual owner commands listed. Reversibility, gates-still-blocked, and safety confirmation included.
- D-027 confirmation: `F:\CodeOutfitters` is the real repo root. `git init` was run for the Setup phase only, on the strength of the Setup phase prompt. The first commit is not in this batch.
- The first commit itself is performed only when:
  - The owner runs the manual commands in `repo-research/SETUP_FIRST_COMMIT_PLAN.md` §8 (recommended), or
  - The next Setup-AGENT invocation is explicitly told to commit (and instructed on shape and message).
- After the first commit lands, the next gate is ChatGPT Control Room approval to start Cleanup A (per A0 plan §5.2 and the A0 phase execution queue #2).

## Git push / commit policy (2026-06-16) — Control Room correction

- Default to no remote push until final delivery approval.
- Default to no remote setup until final delivery approval.
- `git push` is NOT approved. `git remote add` is NOT approved. No GitHub repo. No publishing.
- First baseline commit is OPTIONAL, not required before Cleanup A.
- Cleanup A may proceed after ChatGPT Control Room approval without a baseline commit, if the owner wants one final commit only.
- Local commits are owner-driven. The agent does not run `git add`, `git commit`, `git push`, `git remote add`, `git fetch`, or `git pull` from this batch onward without explicit owner approval per occurrence.
- The full policy is in `PROJECT_CONTROL_LOG.md` under "Git push / commit policy update (2026-06-16) — Control Room correction."

## Notes for Resuming Agent

- Trust the repo, not chat memory. If a state file conflicts with a source file, the source file wins and the state file must be updated.
- Read `docs/51_AGENT_HANDOFF_LOG.md` and `PROJECT_CONTROL_LOG.md` first.
- Read `docs/PM1_PLAN.md` for the official PM1 plan.
- Read `docs/PD1_DECISION_LOCK.md` for the official PD1 decision-lock package.
- Read `docs/D0_ARCHITECTURE_DECISIONS.md` for the D0 area-by-area decision table.
- Read `docs/D0_SYSTEM_DESIGN.md` for the D0 target architecture, security, booking, observability, admin, QA / CI, tooling, UIX0 / MOTION0 design diagrams and contracts.
- Read `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` for the file-zone per phase, integration contract register, and rollback posture per phase.
- Read `docs/A0_ACTION_PLAN.md` for the official A0 action / build plan.
- Read `repo-research/A0_PHASE_EXECUTION_QUEUE.md` for the future phase queue table.
- Read `repo-research/A0_AGENT_ASSIGNMENT_MATRIX.md` for the future agent assignment table.
- Read `repo-research/A0_CHANGE_ZONE_MAP.md` for the file-zone classification table.
- Read `repo-research/PM1_DECISION_MATRIX.md` for the per-decision rationale.
- Read `repo-research/PM1_PHASE_SEQUENCE.md` for the 27-phase table with gates and file-ownership rules.
- Read `repo-research/PD1_OWNER_DECISION_BALLOT.md` for the one-row-per-decision ballot.
- The `docs/`, `memory/`, `ai/`, and `repo-research/` trees were created in DOC-MEMORY-REPAIR. Anything missing in those trees is by design, not an oversight.
- **Ponytail** and **ECC / affaan-m/ecc** are candidates only. NOT APPROVED. Gated to TS0 / RDG0. No install, no clone, no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install in any pre-approval phase.
