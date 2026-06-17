# D0 IMPLEMENTATION BOUNDARIES

> **Status:** D0 design / architecture implementation-boundary package for ChatGPT Control Room. **Plan-only.** No code, no installs, no MCP setup, no lockfile edits, no `package.json` edits, no README edits, no security / booking fixes, no A0 / UIX0 / MOTION0 / TS0 / RDG0 / IMPL work started.
>
> **Phase:** D0 — Design / Architecture.
>
> **Source materials:** `docs/PM1_PLAN.md`, `docs/PD1_DECISION_LOCK.md`, `repo-research/PD1_OWNER_DECISION_BALLOT.md`, `repo-research/PM1_PHASE_SEQUENCE.md`, `repo-research/RISK_REGISTER.md`, `repo-research/SECURITY_HARDENING_BRIEF.md`, `repo-research/BOOKING_CORRECTNESS_BRIEF.md`, `repo-research/TOOLING_APPROVAL_BRIEF.md`, `repo-research/UIX0_MOTION0_BRIEF.md`, `repo-research/QA_STRATEGY_BRIEF.md`, `repo-research/FEATURE_TRACEABILITY_MATRIX.md`, `repo-research/AGENT_BOUNDARY_MAP.md`, `repo-research/OPEN_QUESTIONS.md`, `docs/D0_ARCHITECTURE_DECISIONS.md`, `docs/D0_SYSTEM_DESIGN.md`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`, all `docs/`, all `memory/`, all `ai/`.
>
> **Hard rules respected:** no code, no installs, no MCP setup, no lockfile edits, no `package.json` edits, no README edits, no security fixes, no booking fixes, no git init, no CI config, no test file, no D0 implementation kickoff, no A0 kickoff, no UIX0 / MOTION0 implementation, no TS0 / RDG0 tooling install (including **Ponytail** and **ECC / affaan-m/ecc**).
>
> **Companion files in this D0 batch:**
> - `docs/D0_ARCHITECTURE_DECISIONS.md` — the area-by-area decision table.
> - `docs/D0_SYSTEM_DESIGN.md` — target architecture, security, booking, observability, admin, QA / CI, tooling, UIX0 / MOTION0 design diagrams and contracts.

## Table of Contents

1. Purpose and scope
2. Hard rules (universal)
3. Allowed change zones (universal)
4. Off-limits (universal)
5. Phase-by-phase implementation boundaries
6. Integration contract register
7. Risk-to-phase mapping
8. Rollback posture per phase
9. Owner-confirmation checkpoints
10. Safety confirmation
11. Appendix A — Cross-references
12. Appendix B — Files created in this batch
13. Appendix C — Files modified in this batch

---

## 1. Purpose and scope

D0 — Implementation Boundaries defines **what each future phase may and may not touch**. It is the contract between D0 and the future A0, IMPL, and gated phases. The boundary is the **allowed change zones per phase** (carry-forward from `repo-research/AGENT_BOUNDARY_MAP.md` and `repo-research/PM1_PHASE_SEQUENCE.md`, refined by D0).

This file is the **file-zone / phase-boundary** companion to `docs/D0_ARCHITECTURE_DECISIONS.md` (the **decision table**) and `docs/D0_SYSTEM_DESIGN.md` (the **target architecture**).

The boundaries in this file are **plan-only**. They are the contract A0 will plan against, and the contract the future IMPL phases will execute against. No file in `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, or any config file is touched in D0.

## 2. Hard rules (universal)

These rules apply to **every** future phase, including D0 itself. D0 reflects them; D0 does not relax them.

- **No D0 before PM1 and PD1 pass.** D0 depends on PM1 review and PD1 review.
- **No A0 before D0.** A0 depends on D0.
- **No feature agents before A0.** IMPL phases depend on A0.
- **No package installs before TS0 / RDG0 approval.** TS0 setup is its own gated phase.
- **No UIX0 / MOTION0 implementation before PM1, D0, A0, and tooling decisions.** UIX0 / MOTION0 depends on PM1, D0, A0, and TS0 setup.
- **No lockfile deletion before Cleanup B.** Cleanup B is its own gated phase.
- **No README edits before Cleanup A.** Cleanup A is its own gated phase.
- **No security or booking fix before their respective gated phases.** Each is a separate phase with its own gate.
- **No D-011 / D-012 implementation outside an approved UIX0 / MOTION0 phase.** D-011 and D-012 are capture-only decisions until the UIX0 / MOTION0 first slice.
- **No copy / scrape / clone of `befluence.pro` or any reference site.** Reference only.
- **No install, clone, or evaluation of Ponytail before TS0 / RDG0 approval.** Ponytail is a candidate only; not approved; gated to TS0 / RDG0.
- **No install, clone, copy configs from, configure, or evaluation of ECC / affaan-m/ecc before TS0 / RDG0 approval.** ECC is a candidate only; not approved; gated to TS0 / RDG0.
- **No git init or git-changing command in D0, A0, or any pre-Setup phase.** Setup is its own gated phase; only Setup runs `git init`, and only after the owner confirms the repo root.
- **A phase does not start the next phase.** It stops and waits for ChatGPT Control Room.

## 3. Allowed change zones (universal)

These zones are always allowed for **plan-only** agents (PM1, PD1, D0, A0, planning support) and any agent whose phase explicitly names the zone:

- `docs/*.md` — every phase that has a docs update.
- `memory/*.md` — every phase that records state.
- `ai/*.md` — every phase that records agent context.
- `repo-research/*.md` — every phase; planning scratchpad.
- `PROJECT_CONTROL_LOG.md` — every phase (append-only).
- `INTEGRATION_NOTES.md` — every phase (append / update prose only when integration notes change).

## 4. Off-limits (universal)

These zones are off-limits to **any** non-IMPL agent, including D0, A0, and any planning support agent:

- `app/**`
- `components/**`
- `hooks/**`
- `lib/**`
- `public/**` (including `_headers`, `_redirects`)
- `styles/**` (currently none in repo, but if added)
- `next-env.d.ts`
- `package.json` (any field)
- `package-lock.json`, `pnpm-lock.yaml`
- `tsconfig.json`
- `next.config.mjs`
- `postcss.config.mjs`
- `components.json`
- eslint configs
- tailwind configs
- `.env*`
- `public/_headers`
- `public/_redirects`
- `.gitignore` (Setup, Cleanup A, Cleanup B, IMPL rare; gated)
- `README.md` (Cleanup A only; gated)
- `DEPLOY.md` (root) (Cleanup A or B; gated)
- `.github/**` (QA Slice 0+; gated)

D0 modifies nothing in the off-limits zones. D0 only writes inside the allowed change zones listed in §3.

## 5. Phase-by-phase implementation boundaries

The table below lists the future phases in PM1 phase-sequence order, with their purpose, allowed file zones, what they may **not** touch, and the gate that blocks them. A phase that does not appear below is out of scope for D0 (e.g., a phase that does not exist in the PM1 sequence). A0 is included because A0 is the immediate successor of D0.

### 5.1 Setup phase

- **Purpose:** confirm the real repo root (Q-21 / D-027). If confirmed, `git init`; review `.gitignore`; first commit with the current state. If not, find the real root and re-run PM1 there.
- **Allowed file zones:** `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`, `.gitignore` (review), `docs/`, `memory/`, `ai/`, `repo-research/`. The first commit is a snapshot of the current state; it does not modify source files.
- **Off-limits in this phase:** `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, all config files except `.gitignore` (review).
- **Blocked until:** Q-21 / D-027 owner confirmation.
- **Rollback:** the first commit can be reverted with `git reset` if needed (gated).
- **Integration contract impact:** none. The first commit is a snapshot.

### 5.2 Cleanup A

- **Purpose:** surgical README repair (per `repo-research/README_REPAIR_SPEC.md`); delete legacy `DEPLOY.md` (root) (Q-13); portfolio copy fix (R-019); add `source: "contact"` to contact form (Q-14); add `tsconfig.tsbuildinfo` to `.gitignore` (R-025); add minimal `eslint.config.mjs` (R-026).
- **Allowed file zones:**
  - `README.md` (surgical repair only)
  - `DEPLOY.md` (root) (delete only; not edit)
  - `app/(public)/portfolio/page.tsx` (copy only)
  - `components/contact.tsx` (one field: `source: "contact"`)
  - `.gitignore` (R-025 entry)
  - `eslint.config.mjs` (new file; config-only)
  - `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`
- **Off-limits in this phase:** `lib/`, `hooks/`, `public/`, `next.config.mjs`, `postcss.config.mjs`, `tsconfig.json`, `package.json`, either lockfile, `.env*`, every other file under `app/`, `components/`. The contact form change is a single field.
- **Blocked until:** Setup completes; Q-13, Q-14 owner responses (Cleanup A can run in parallel with TS0 / RDG0 and Cleanup B after Q-13, Q-14 are answered).
- **Rollback:** revert the commit. README / DEPLOY.md / contact form are recoverable.
- **Integration contract impact:** none. The contact form adds a `source` field; n8n is unaffected (n8n already discriminates on `source` for quote, newsletter; adding `source: "contact"` is symmetric and reduces the shape-discrimination risk in R-027).
- **Risk closes:** R-001 (doc), R-019, R-025, R-026, R-027, R-023, R-034.

### 5.3 Cleanup B

- **Purpose:** drop the chosen lockfile (D-015 default: `pnpm-lock.yaml`); add to `.gitignore`; add CI guard (TS0 / RDG0 gated); update `docs/SETUP.md`, `docs/DEPLOYMENT.md`, `README.md` (the repaired README from Cleanup A).
- **Allowed file zones:**
  - The dropped lockfile (delete only)
  - `.gitignore` (add the dropped lockfile)
  - `docs/SETUP.md`, `docs/DEPLOYMENT.md` (prose only; no code)
  - `README.md` (already repaired in Cleanup A; this phase only updates the package manager reference if needed)
  - If pnpm: `package.json` (add `"packageManager": "pnpm@<version>"` field; gated)
  - `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`
- **Off-limits in this phase:** `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, `next.config.mjs`, `postcss.config.mjs`, `tsconfig.json`, `.env*`. The CI guard is a future TS0 / RDG0 step; Cleanup B does not add CI itself.
- **Blocked until:** Cleanup A completes; D-015 owner response. `git status` must be clean before deletion.
- **Rollback:** re-create the dropped lockfile (`npm install` or `pnpm install`); remove the `.gitignore` entry; remove the CI guard. Reversible, but multiple PRs.
- **Integration contract impact:** none. The package manager change does not affect any external integration.
- **Risk closes:** R-002 (config).

### 5.4 TS0 / RDG0

- **Purpose:** submit the 9-tool list (per `repo-research/TOOLING_APPROVAL_BRIEF.md` §3 and PM1 §7.2) plus the **Ponytail candidate** (per PD1 §6.1) plus the **ECC / affaan-m/ecc candidate** (per D0 ECC addendum) for owner / Control Room approval. Submission is documentation-only.
- **Allowed file zones:** `repo-research/TS0_RDG0_REQUEST.md` (new; or split into 9 PRs); `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`.
- **Off-limits in this phase:** `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, all config files, `package.json`, both lockfiles, `.env*`. No install. No MCP config. No `.mcp.json` write. No `devDependencies` change.
- **Blocked until:** Cleanup A; PD1 + D0 + A0 pass.
- **Rollback:** n/a (documentation only).
- **Integration contract impact:** none. The submission is documentation.

### 5.5 TS0 setup

- **Purpose:** install each approved tool in its own small PR per `repo-research/TOOLING_APPROVAL_BRIEF.md` §7.6 acceptance criteria. Each PR updates `package.json` `devDependencies` (or the equivalent MCP / skill config) with a pinned version, adds a smoke test or documented manual verification step, and updates `INTEGRATION_NOTES.md` (if integration), `ai/AI_CONTEXT_RULES.md` (if behavior change), and the relevant `docs/`.
- **Allowed file zones:** `package.json` (devDependencies only; not `dependencies`); new MCP / skill config files (if any); `docs/`, `memory/`, `ai/`, `INTEGRATION_NOTES.md`, `repo-research/`, `PROJECT_CONTROL_LOG.md`.
- **Off-limits in this phase:** `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, `next.config.mjs`, `postcss.config.mjs`, `tsconfig.json`, either lockfile (lockfile is regenerated by the package manager; the lockfile change is allowed only to reflect the new devDependency), `.env*`, `public/_headers`, `public/_redirects`, `.gitignore` (rare).
- **Blocked until:** TS0 / RDG0 approval per tool. The Ponytail candidate is included in the submission but is **not approved**; do not install Ponytail even after TS0 / RDG0 if the owner has not provided the exact official GitHub repo URL, pinned version, and scope. The ECC / affaan-m/ecc candidate is included in the submission but is **not approved**; do not install, clone, copy, configure, or evaluate ECC even after TS0 / RDG0 if the owner has not provided the exact official GitHub repo URL, pinned version, and scope, and the ten evaluation questions have been answered.
- **Rollback:** remove the devDependency; regenerate the lockfile; remove the MCP / skill config; revert the docs update. One PR per tool, so rollback is one revert.
- **Integration contract impact:** none in the public sense. Internal tooling only.
- **Risk closes:** R-011 (partial, per tool).

### 5.6 QA Slice 0

- **Purpose:** add `typecheck` script (`tsc --noEmit`); add `eslint.config.mjs` (already in Cleanup A); add GitHub Actions CI (`.github/workflows/ci.yml`).
- **Allowed file zones:**
  - `package.json` (script field only; no new dep)
  - `eslint.config.mjs` (already added in Cleanup A; QA Slice 0 confirms it is wired into CI)
  - `.github/workflows/ci.yml` (new; CI config)
  - `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`
- **Off-limits in this phase:** `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, `next.config.mjs`, `postcss.config.mjs`, `tsconfig.json`, either lockfile, `.env*`, `public/_headers`, `public/_redirects`, `.gitignore`. The CI workflow must not run any command that modifies the lockfile.
- **Blocked until:** Cleanup A (parallel with Cleanup B / TS0 / RDG0).
- **Rollback:** delete the workflow file; remove the `typecheck` script. One PR.
- **Integration contract impact:** none.
- **Risk closes:** R-008 (partial), R-009, R-026, R-030 (build-size report if added).

### 5.7 D0 (this phase)

- **Purpose:** produce the design / architecture decisions and the target system design for security, booking, observability, admin, QA / CI, tooling, UIX0 / MOTION0. D0 is plan-only.
- **Allowed file zones:** `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`. `INTEGRATION_NOTES.md` only if integration architecture was clarified (in this batch: not modified; D0 only plans integration architecture).
- **Off-limits in this phase:** every file in §4.
- **Blocked until:** PM1 + PD1 pass.
- **Rollback:** n/a (documentation only).
- **Integration contract impact:** none in this batch. D0 plans future integration changes; it does not change current contracts.

### 5.8 A0

- **Purpose:** write the concrete PR-by-PR, file-by-file plan for Security 1, Security 2, Security 3, Security 4, Security 5, Booking A, Booking B, Observability, QA Slice 1/2/3, UIX0 / MOTION0 first slice, Admin features, and Final QA. A0 is plan-only.
- **Allowed file zones:** `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`. `INTEGRATION_NOTES.md` may be updated in A0 to record the planned integration contracts (still prose only).
- **Off-limits in this phase:** every file in §4.
- **Blocked until:** D0 pass.
- **Rollback:** n/a (documentation only).
- **Integration contract impact:** none in this batch. A0 plans future integration changes; it does not change current contracts.

### 5.9 Security 1 — Cloudflare Worker proxy for Anthropic

- **Purpose:** stand up a Cloudflare Worker; move the Anthropic call behind the Worker; remove `NEXT_PUBLIC_ANTHROPIC_API_KEY` from the build output. CSP updated to include the Worker origin.
- **Allowed file zones:**
  - `lib/proposal-generator.ts` (call the Worker, not Anthropic directly)
  - `app/admin/proposal/page.tsx` (only if the fetch URL changes here)
  - new Worker source (e.g. `workers/anthropic-proxy/src/index.ts` or a separate repo linked from this one — D0 does not decide; A0 decides)
  - `public/_headers` (CSP update; gated)
  - `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md` (move R-002, R-004 to "Closed")
  - `memory/`, `ai/`, `PROJECT_CONTROL_LOG.md`
- **Off-limits in this phase:** every other file in `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, all config files except `public/_headers`. No new runtime deps. No lockfile changes.
- **Blocked until:** A0 pass; Setup.
- **Rollback:** revert the Worker route; revert `lib/proposal-generator.ts` to call Anthropic directly; restore `NEXT_PUBLIC_ANTHROPIC_API_KEY` (or rotate the key if the rollback is post-rotate). Rollback is one PR.
- **Integration contract impact:** the Anthropic API call changes from browser → Anthropic to browser → Worker → Anthropic. `INTEGRATION_NOTES.md` §3 is updated to reflect the new contract.
- **Risk closes:** R-002, R-004, LG-1.

### 5.10 Security 2 — Real admin auth (Cloudflare Access or Supabase Auth)

- **Purpose:** replace the client-side `localStorage` password gate with a real auth flow. Fast path: Cloudflare Access. Productized path: Supabase Auth / magic link.
- **Allowed file zones:**
  - `app/admin/layout.tsx` (remove the password gate; read the Access JWT or Supabase session)
  - `app/admin/page.tsx` (only if the dashboard depends on the auth shape)
  - `lib/supabase.ts` (Auth; if Supabase Auth path is used)
  - `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md` (move R-001, R-003, R-029 to "Closed")
  - `memory/`, `ai/`, `PROJECT_CONTROL_LOG.md`
  - Cloudflare Access policy is set at the Cloudflare dashboard, not in the repo. D0 plans the policy; A0 documents it.
- **Off-limits in this phase:** every other file in `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, all config files. No paid tools. No lockfile changes.
- **Blocked until:** Security 1.
- **Rollback:** re-enable the password gate (revert `app/admin/layout.tsx`); restore `NEXT_PUBLIC_ADMIN_PASSWORD`. One PR.
- **Integration contract impact:** the admin gate changes from client-side `localStorage` to Cloudflare Access (or Supabase Auth). `INTEGRATION_NOTES.md` §5 is updated to remove the `NEXT_PUBLIC_ADMIN_PASSWORD` row (post-rollforward).
- **Risk closes:** R-001, R-003, R-029, LG-2.

### 5.11 Security 3 — Supabase RLS

- **Purpose:** enable RLS on `bookings` and `available_slots`; deny all to anon; add controlled insert path (RPC or Worker-mediated).
- **Allowed file zones:**
  - `lib/booking-schema.sql` (RLS policies, RPCs)
  - `lib/booking-actions.ts` (RPC call shape, if changed)
  - `docs/DATABASE.md`, `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, `repo-research/RISK_REGISTER.md` (move R-006 to "Closed")
  - `memory/`, `PROJECT_CONTROL_LOG.md`
  - Supabase dashboard settings (RLS is enabled in the SQL; the SQL is the source of truth)
- **Off-limits in this phase:** every other file in `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, all config files. No paid tools. No lockfile changes.
- **Blocked until:** Security 1 or 2.
- **Rollback:** drop the policies; drop the RPCs. One SQL migration. Reversible.
- **Integration contract impact:** the anon Supabase key loses direct write access. The browser can only read (or call the narrow RPC). `INTEGRATION_NOTES.md` §2 is updated.
- **Risk closes:** R-006, LG-3.

### 5.12 Security 4 — n8n per-form secret + header

- **Purpose:** add a per-form secret; POST each form with a header containing the secret; verify in n8n.
- **Allowed file zones:**
  - `components/quote-form.tsx`, `components/contact.tsx`, `components/booking-calendar-custom.tsx`, `components/newsletter.tsx` (add the header)
  - n8n workflow (out-of-repo; documented in `INTEGRATION_NOTES.md`)
  - `INTEGRATION_NOTES.md`, `docs/SECURITY.md`, `repo-research/RISK_REGISTER.md` (move R-017 to "Closed")
  - `memory/`, `PROJECT_CONTROL_LOG.md`
- **Off-limits in this phase:** every other file in `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, all config files. No new runtime deps. No lockfile changes.
- **Blocked until:** Security 1 or 2.
- **Rollback:** remove the header from each form; n8n stops accepting. One PR + one n8n workflow change.
- **Integration contract impact:** the n8n webhook contract gains a per-form secret header. `INTEGRATION_NOTES.md` §1 is updated.
- **Risk closes:** R-017.

### 5.13 Security 5 — CSP CI guard

- **Purpose:** add a CI step that fails the build if `public/_headers` is missing a new external endpoint the app calls.
- **Allowed file zones:**
  - `.github/workflows/ci.yml` (or a new file)
  - `public/_headers` (CSP update; gated)
  - `repo-research/RISK_REGISTER.md` (move R-020 to "Closed")
  - `memory/`, `PROJECT_CONTROL_LOG.md`
- **Off-limits in this phase:** every other file in `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, all config files. No new runtime deps. No lockfile changes.
- **Blocked until:** TS0 setup (CI must exist); Security 1.
- **Rollback:** delete the workflow step. One PR.
- **Integration contract impact:** none.
- **Risk closes:** R-020.

### 5.14 Booking A — MVP fix

- **Purpose:** UI reads `available_slots` (R-005 UI honesty); wire to `createBooking` (or a successor) so the submission persists; n8n path; graceful degradation; seed lifecycle.
- **Allowed file zones:**
  - `components/booking-calendar-custom.tsx` (call `getAvailableSlots`; wire to the write path)
  - `lib/booking-actions.ts` (RPC or guarded insert/update; do not change the anon-key write path in a way that breaks the Worker plan)
  - `lib/booking-schema.sql` (re-seed script, if scheduled-function path is chosen)
  - `docs/DATABASE.md`, `docs/ARCHITECTURE.md`, `repo-research/RISK_REGISTER.md` (move R-005, R-007, R-031 to "Closed")
  - `memory/`, `PROJECT_CONTROL_LOG.md`
- **Off-limits in this phase:** every other file in `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, all config files. No new animation. No new deps. No lockfile changes.
- **Blocked until:** A0; D0.
- **Rollback:** revert the calendar component to its current shape; the UI returns to the broken-but-shipped state. One PR.
- **Integration contract impact:** the booking submission path gains a controlled write (Worker-mediated or RPC). `INTEGRATION_NOTES.md` §2 is updated.
- **Risk closes:** R-005, R-007, R-031, LG-4.

### 5.15 Booking B — Robust fix

- **Purpose:** `reserve_slot` RPC; put behind the Worker; signed event to n8n. `UNIQUE (preferred_date, preferred_time)` constraint on `bookings`.
- **Allowed file zones:**
  - `lib/booking-schema.sql` (RPC, unique constraint)
  - `lib/booking-actions.ts` (RPC call shape)
  - Worker source (or a follow-up to the Worker from Security 1)
  - `docs/DATABASE.md`, `docs/ARCHITECTURE.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md` (R-005 fully closed)
  - `memory/`, `PROJECT_CONTROL_LOG.md`
- **Off-limits in this phase:** every other file in `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, all config files. No new runtime deps. No lockfile changes.
- **Blocked until:** Booking A; Security 1.
- **Rollback:** drop the RPC; drop the unique constraint; restore the anon-key path. One PR + one SQL migration. Reversible.
- **Integration contract impact:** the booking path becomes Worker-mediated. `INTEGRATION_NOTES.md` §2 is updated again.
- **Risk closes:** R-005 (full).

### 5.16 Admin auth + persistence (R-4.5, R-4.6)

- **Purpose:** persist proposals to Supabase (or Worker + KV); list on `/admin`; better admin auth (already in Security 2).
- **Allowed file zones:**
  - `app/admin/page.tsx` (list view)
  - `app/admin/proposal/page.tsx` (persistence on generate)
  - `components/admin/` (list component, if new)
  - `lib/proposal-generator.ts` (if persistence changes the flow)
  - `lib/supabase.ts` (proposals table; if Supabase path is chosen)
  - `docs/ARCHITECTURE.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md` (move R-018 to "Closed" or partial)
  - `memory/`, `PROJECT_CONTROL_LOG.md`
- **Off-limits in this phase:** every other file in `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, all config files. No new animations on admin. No new runtime deps. No lockfile changes.
- **Blocked until:** Security 2; Booking A.
- **Rollback:** revert the list view; revert the persistence write; proposals return to `localStorage`-only. One PR per change.
- **Integration contract impact:** the admin surface gains a new Supabase table (or KV namespace). `INTEGRATION_NOTES.md` §2 is updated (or a new section is added for the admin persistence contract).
- **Risk closes:** R-018 (partial).

### 5.17 Observability

- **Purpose:** Sentry error tracking; UptimeRobot; n8n delivery monitor; booking failure wrap; owner channel.
- **Allowed file zones:**
  - `components/error-boundary.tsx` (Sentry wire)
  - `lib/booking-actions.ts` (Sentry wrap)
  - new monitor scripts (e.g. a `scripts/seed-check.mjs` for the booking seed lifecycle)
  - n8n workflow (out-of-repo; documented in `INTEGRATION_NOTES.md`)
  - `docs/SECURITY.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md` (move R-010 to "Closed")
  - `memory/`, `PROJECT_CONTROL_LOG.md`
- **Off-limits in this phase:** every other file in `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, all config files. No paid tools. No new runtime deps. No lockfile changes.
- **Blocked until:** Cleanup A; D-026 / D-021b owner response.
- **Rollback:** remove the Sentry wire; remove the UptimeRobot checks; remove the n8n monitor workflow. One PR per wire.
- **Integration contract impact:** the operator's email (or Discord webhook) gains an alert channel. `INTEGRATION_NOTES.md` is updated with a new "Observability" section.
- **Risk closes:** R-010, R-035 (live badge — Q-20).

### 5.18 QA Slice 1 — Real Playwright test runner

- **Purpose:** install Playwright as a real test runner; add `tests/smoke.spec.ts`; CI runs it.
- **Allowed file zones:**
  - `package.json` (devDep; Playwright)
  - `playwright.config.*` (new)
  - `tests/` (new; smoke spec only)
  - `.github/workflows/ci.yml` (add the Playwright job)
  - `docs/QA_CHECKLIST.md`, `memory/`, `PROJECT_CONTROL_LOG.md`
- **Off-limits in this phase:** every other file in `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, all config files. No mutating tests; smoke only.
- **Blocked until:** TS0 setup; QA Slice 0.
- **Rollback:** remove the devDep; delete `tests/`; remove the CI job. One PR.
- **Integration contract impact:** none.
- **Risk closes:** R-008 (full).

### 5.19 QA Slice 2 — Lighthouse + visual regression

- **Purpose:** Lighthouse CI budgets; Playwright visual regression (1% pixel-delta gate); Chrome DevTools MCP integration.
- **Allowed file zones:**
  - `package.json` (devDeps; Lighthouse, Playwright plugins)
  - `tests/` (visual regression specs)
  - `.github/workflows/ci.yml` (Lighthouse job)
  - `.lighthouserc.*` (new; budget config)
  - `repo-research/`, `memory/`, `PROJECT_CONTROL_LOG.md`
- **Off-limits in this phase:** every other file in `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, all config files. The pixel-delta gate is enforced in CI; manual runs are allowed.
- **Blocked until:** QA Slice 1; TS0 setup.
- **Rollback:** remove the devDeps; delete the spec files; remove the CI job. One PR.
- **Integration contract impact:** none.
- **Risk closes:** R-013, R-014 (enforced budget), R-012 (taste review evidence).

### 5.20 QA Slice 3 — Form / booking / admin / a11y tests + bundle size guard

- **Purpose:** form contract tests; booking flow tests; admin proposal flow tests; axe-core scan; bundle size guard.
- **Allowed file zones:**
  - `tests/` (new specs; mocks for Anthropic, n8n, Supabase)
  - `package.json` (devDeps; axe-core, size-limit, etc.)
  - `.github/workflows/ci.yml` (new jobs)
  - `repo-research/`, `memory/`, `PROJECT_CONTROL_LOG.md`
- **Off-limits in this phase:** every other file in `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, all config files. No flaky tests.
- **Blocked until:** QA Slice 1; the feature phases (form / booking / admin).
- **Rollback:** remove the devDeps; delete the spec files; remove the CI jobs. One PR.
- **Integration contract impact:** none.
- **Risk closes:** R-008 (full), R-015 (a11y), R-013 / R-014 (bundle size).

### 5.21 UIX0 / MOTION0 first slice

- **Purpose:** hero entrance + animated headline reveal + scroll-triggered section reveals + ROI micro-interactions + reduced-motion coverage. Ships in one PR.
- **Allowed file zones:**
  - `components/hero.tsx` (animation)
  - `components/aos-provider.tsx` (reduced-motion opt-out)
  - `hooks/useScrollReveal.ts` (collapse duplicates; respect reduced-motion)
  - `components/roi-calculator.tsx` (micro-interactions)
  - `lib/animations/` (collapse to one canonical setup; respect reduced-motion)
  - `docs/FEATURES.md`, `docs/ARCHITECTURE.md`, `docs/QA_CHECKLIST.md`, `repo-research/MOTION_QA_LOG.md` (new), `repo-research/RISK_REGISTER.md`
  - `memory/`, `PROJECT_CONTROL_LOG.md`
- **Off-limits in this phase:** every other file in `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, all config files. No new animation libraries. No `package.json` deps. AOS opt-out; GSAP opt-out; Framer Motion opt-out. LCP / CLS / INP within budget.
- **Blocked until:** QA Slice 2; TS0 setup.
- **Rollback:** revert the PR. The site returns to the pre-slice state. One PR.
- **Integration contract impact:** none.
- **Risk closes:** R-012, R-013 (partial), R-014, R-015, R-021.

### 5.22 UIX0 / MOTION0 later slices

- **Purpose:** parallax, magnetic buttons, portfolio motion depth, process timeline animation, contact / booking form transitions, marquee polish, animated statistics counters.
- **Allowed file zones:**
  - `components/`, `hooks/`, `lib/animations/`, `docs/`, `memory/`, `PROJECT_CONTROL_LOG.md`
  - Each slice is a separate PR. Each PR may target a subset of these files.
- **Off-limits in this phase:** all config files. No new deps without TS0 / RDG0 approval. Benchmarks per slice.
- **Blocked until:** first slice ships.
- **Rollback:** revert the PR for that slice. One PR per slice.
- **Integration contract impact:** none.

### 5.23 Admin motion + testimonials

- **Purpose:** admin lighter motion; testimonials carousel wiring (R-4.3); R-4.4 portfolio copy if not done in Cleanup A.
- **Allowed file zones:**
  - `components/testimonials.tsx` (wire)
  - `app/(public)/page.tsx` (render the carousel)
  - `components/admin/**` (motion discipline)
  - `docs/FEATURES.md`, `docs/ARCHITECTURE.md`, `memory/`, `PROJECT_CONTROL_LOG.md`
- **Off-limits in this phase:** every other file in `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`, all config files. Admin motion ≤ 200ms. Testimonials copy reconciled with portfolio.
- **Blocked until:** first UIX0 / MOTION0 slice.
- **Rollback:** revert the wiring; revert the admin motion changes. One PR.
- **Integration contract impact:** none.

### 5.24 Final QA + delivery

- **Purpose:** full manual checklist; full automated smoke; Cloudflare post-deploy checks.
- **Allowed file zones:** `docs/QA_CHECKLIST.md`, `docs/DEPLOYMENT.md`, `memory/EPISODIC_MEMORY.md`, `PROJECT_CONTROL_LOG.md`. Verification only — no new work.
- **Off-limits in this phase:** every other file. No new work in this phase.
- **Blocked until:** all above.
- **Rollback:** n/a (verification only).
- **Integration contract impact:** none.

## 6. Integration contract register

D0 does not change any current integration contract. D0 only plans future contracts. The register below records the **current** contracts and the **planned** future contracts.

| Service | Current contract | Source of truth | Future change | Phase |
|---|---|---|---|---|
| n8n webhook | `POST` to `NEXT_PUBLIC_N8N_WEBHOOK_URL`; payload shape discriminates form type; no signing. | `INTEGRATION_NOTES.md` §1; `components/quote-form.tsx`, `components/contact.tsx`, `components/booking-calendar-custom.tsx`, `components/newsletter.tsx`. | Add per-form secret in `X-CO-Form-Secret` header; verify in n8n. | Security 4 |
| Supabase `bookings` | Anon-key INSERT + UPDATE; no RLS. | `INTEGRATION_NOTES.md` §2; `lib/booking-actions.ts`; `lib/booking-schema.sql`. | Anon key loses direct write; `reserve_slot` RPC; `UNIQUE (preferred_date, preferred_time)`; Worker-mediated writes with service-role key. | Security 3, Booking A, Booking B |
| Supabase `available_slots` | Anon-key SELECT (intended) + UPDATE; no RLS. | `INTEGRATION_NOTES.md` §2. | Anon key: `USING (false)`; reads via narrow RPC. Writes via Worker. | Security 3, Booking A, Booking B |
| Anthropic API | Direct browser call to `https://api.anthropic.com/v1/messages` using `NEXT_PUBLIC_ANTHROPIC_API_KEY` (in bundle). | `INTEGRATION_NOTES.md` §3; `lib/proposal-generator.ts`. | Browser calls Worker; Worker calls Anthropic with server-side env var. CSP updated. | Security 1 |
| Tawk.to | Consent-gated embed; placeholder env var; no embed when placeholder. | `INTEGRATION_NOTES.md` §4; `components/live-chat.tsx`. | No change. | n/a |
| Owner email alerts | None. | n/a | Sentry + UptimeRobot + n8n delivery monitor all email `hello@codeoutfitters.com`. Discord webhook fallback. | Observability |
| Cloudflare Pages | Static host of `out/`. | `docs/DEPLOYMENT.md`; `public/_redirects`; `public/_headers`. | Worker route(s) added. CSP updated. | Security 1 (and following) |
| Cloudflare Access | None. | n/a | Optional protection in front of `/admin/*`. Policy at the Cloudflare dashboard. | Security 2 (fast path) |
| Supabase Auth | None. | n/a | Optional magic-link sign-in for `/admin`. | Security 2 (productized path) |
| Recent Proposals persistence | `localStorage.co_last_proposal`. | `INTEGRATION_NOTES.md` §3. | Surface in tile (A); persist to Supabase / KV (B). | Admin features (post-Security 2) |
| Git / repo root | None (not initialized). | `repo-research/PM1_PLAN.md` §11. | `git init` at confirmed root. | Setup |

## 7. Risk-to-phase mapping

The risk register (`repo-research/RISK_REGISTER.md`) maps each risk to the future phase that closes it. D0 does not close any risks. The mapping is the contract the future phases will execute against.

| Risk | Future phase that closes it | D0 plan |
|---|---|---|
| R-001 (README) | Cleanup A | Surgical repair |
| R-002 (lockfile) | Cleanup B | Drop `pnpm-lock.yaml`; keep `npm` |
| R-003, R-029 (admin password) | Security 2 | Cloudflare Access; Supabase Auth if productized |
| R-002, R-004 (Anthropic key) | Security 1 | Worker proxy |
| R-005 (booking double-book) | Booking A, then Booking B | UI honesty → RPC + Worker |
| R-006 (no RLS) | Security 3 | Enable RLS; deny anon; controlled path |
| R-007, R-031 (seed exhaustion) | Cleanup A or Booking A | Re-seed script |
| R-008 (no tests) | QA Slice 1 | Real Playwright runner |
| R-009 (no CI) | QA Slice 0 | GitHub Actions |
| R-010 (no monitoring) | Observability | Sentry + UptimeRobot + n8n monitor |
| R-011 (dev tooling not approved) | TS0 / RDG0 | Submit 9 tools + Ponytail candidate + ECC / affaan-m/ecc candidate |
| R-012 (motion not planned) | UIX0 / MOTION0 first slice | First slice ships |
| R-013 (animation stack risk) | UIX0 / MOTION0 first slice | Audit + budget; collapse duplicates; AOS opt-out |
| R-014 (mobile perf) | UIX0 / MOTION0 first slice | Performance budget; benchmark |
| R-015 (reduced-motion) | UIX0 / MOTION0 first slice | AOS opt-out; verify all motion |
| R-016 (static export limits) | n/a (architecture) | D0 reflects "keep static + Worker" |
| R-017 (n8n single webhook) | Security 4 | Per-form secret + header |
| R-018 (admin localStorage) | Admin features (post-Security 2) | A first; B later |
| R-019 (portfolio copy gap) | Cleanup A | Copy fix |
| R-020 (CSP endpoint drift) | Security 5 | CI guard |
| R-021 (GSAP / useScrollReveal duplicates) | UIX0 / MOTION0 first slice | Collapse to one canonical setup |
| R-022 (AOS double-init) | n/a | Document; not urgent |
| R-023 (contact page stray spaces) | Cleanup A | Repair |
| R-024 (no `components/ui/`) | n/a | Document; do not generate yet |
| R-025 (tsconfig.tsbuildinfo) | Cleanup A | Add to `.gitignore` |
| R-026 (no ESLint config) | Cleanup A | Add minimal flat config |
| R-027 (contact form no source) | Cleanup A | Add `source: "contact"` |
| R-028 (CDN tools strip) | n/a | Accept; future self-host |
| R-030 (build size untracked) | QA Slice 0 / 2 | Build-size report |
| R-032 (Anthropic model not pinned) | Security 1 | Env override |
| R-033 (contact honeypot UX) | n/a | Document; not urgent |
| R-034 (contact page stray spaces 2) | Cleanup A | Repair |
| R-035 (static "All systems operational") | Observability | Live badge |

## 8. Rollback posture per phase

Every IMPL phase ships with a one-PR rollback. The rollback plan is part of the phase's acceptance criteria.

| Phase | Rollback |
|---|---|
| Setup | Revert the first commit (gated). |
| Cleanup A | Revert the commit. README / DEPLOY.md / contact form / `.gitignore` / `eslint.config.mjs` are recoverable. |
| Cleanup B | Re-create the dropped lockfile; remove the `.gitignore` entry; remove the CI guard. Multiple PRs but reversible. |
| TS0 / RDG0 | n/a (documentation only). |
| TS0 setup | Remove the devDependency; regenerate the lockfile; remove the MCP / skill config; revert the docs update. One PR per tool. |
| QA Slice 0 | Delete the workflow file; remove the `typecheck` script. One PR. |
| D0 | n/a (documentation only). |
| A0 | n/a (documentation only). |
| Security 1 | Revert the Worker route; revert `lib/proposal-generator.ts` to call Anthropic directly; restore `NEXT_PUBLIC_ANTHROPIC_API_KEY` (or rotate the key if post-rotate). One PR. |
| Security 2 | Re-enable the password gate; restore `NEXT_PUBLIC_ADMIN_PASSWORD`. One PR. |
| Security 3 | Drop the policies; drop the RPCs. One SQL migration. |
| Security 4 | Remove the header from each form; n8n stops accepting. One PR + one n8n workflow change. |
| Security 5 | Delete the workflow step. One PR. |
| Booking A | Revert the calendar component. One PR. |
| Booking B | Drop the RPC; drop the unique constraint; restore the anon-key path. One PR + one SQL migration. |
| Admin auth + persistence | Revert the list view; revert the persistence write. One PR per change. |
| Observability | Remove the Sentry wire; remove the UptimeRobot checks; remove the n8n monitor workflow. One PR per wire. |
| QA Slice 1 | Remove the devDep; delete `tests/`; remove the CI job. One PR. |
| QA Slice 2 | Remove the devDeps; delete the spec files; remove the CI job. One PR. |
| QA Slice 3 | Remove the devDeps; delete the spec files; remove the CI jobs. One PR. |
| UIX0 / MOTION0 first slice | Revert the PR. One PR. |
| UIX0 / MOTION0 later slices | Revert the PR for that slice. One PR per slice. |
| Admin motion + testimonials | Revert the wiring; revert the admin motion changes. One PR. |
| Final QA + delivery | n/a (verification only). |

## 9. Owner-confirmation checkpoints

D0 does not request owner approval; D0 reflects PD1. The owner-confirmation checkpoints for the future phases are:

| Phase | Owner-confirmation required? | What |
|---|---|---|
| Setup | yes | Q-21 / D-027 (confirm repo root). |
| Cleanup A | yes | Q-13 (DEPLOY.md delete), Q-14 (contact source field). |
| Cleanup B | yes | D-015 (npm vs pnpm). |
| TS0 / RDG0 | yes (per tool) | Each tool; Ponytail requires exact official GitHub repo URL + pinned version + scope; ECC / affaan-m/ecc requires exact official GitHub repo URL + pinned version + scope + the ten evaluation questions answered. |
| TS0 setup | no (auto if TS0 / RDG0 approved) | Per-tool approval is the gate. |
| QA Slice 0 | no (config-only) | None. |
| D0 | yes (this batch) | Approve, repair, or reject. |
| A0 | yes | Approve, repair, or reject. |
| Security 1 | yes (architectural-path) | D-019a (Worker proxy). |
| Security 2 | yes (architectural-path) | D-020a (auth path). |
| Security 3 | yes (launch-gate) | D-020 (RLS). |
| Security 4 | optional | n8n signing. |
| Security 5 | optional | CSP CI guard. |
| Booking A | yes (architectural-path) | D-019b (MVP write path). |
| Booking B | yes (post-Worker) | RPC + Worker. |
| Admin features | yes (architectural-path) | D-025 (Recent Proposals). |
| Observability | yes (architectural-path) | D-026, D-021b. |
| QA Slice 1/2/3 | yes (architectural-path) | D-021a (test runner form). |
| UIX0 / MOTION0 first slice | yes (architectural-path) | D-022, D-022a, D-022b, D-024, Q-17. |
| UIX0 / MOTION0 later slices | yes (per slice) | Performance budget, taste review. |
| Admin motion + testimonials | yes (R-4.3, R-4.4) | Wiring and copy reconciliation. |
| Final QA + delivery | yes (release) | All launch gates green. |

## 10. Safety confirmation

This D0 batch:

- Did not modify any source file under `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`.
- Did not modify `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `components.json`.
- Did not modify either lockfile (`package-lock.json`, `pnpm-lock.yaml`).
- Did not modify `.env*`, `.gitignore`, `README.md`, or `DEPLOY.md` (root).
- Did not run `npm install`, `pnpm install`, `yarn install`, or `npx` of any kind.
- Did not configure any MCP server.
- Did not install any tooling or skill (`npx skills add`, `npx impeccable install`, etc.).
- Did not install, clone, configure, or evaluate **Ponytail** (candidate only; not approved; recorded for future TS0 / RDG0).
- Did not install, clone, copy configs from, configure, or evaluate **ECC / affaan-m/ecc** (candidate only; not approved; recorded for future TS0 / RDG0).
- Did not initialize git or run any git-changing command.
- Did not create a CI config file.
- Did not create any test file.
- Did not start A0, UIX0 / MOTION0, TS0 / RDG0, IMPL, or any implementation.
- Only created or modified files inside the allowed change zones: `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`. `INTEGRATION_NOTES.md` was not modified in this batch because no integration contract changed in D0; D0 only plans integration architecture.

---

## Appendix A — Cross-references

- `docs/D0_ARCHITECTURE_DECISIONS.md` — D0 area-by-area decision table.
- `docs/D0_SYSTEM_DESIGN.md` — D0 target architecture, security, booking, observability, admin, QA / CI, tooling, UIX0 / MOTION0 design diagrams and contracts.
- `docs/PM1_PLAN.md` — PM1 plan (14 workstreams).
- `docs/PD1_DECISION_LOCK.md` — PD1 decision-lock package and D0 readiness assessment.
- `repo-research/PD1_OWNER_DECISION_BALLOT.md` — one-row-per-decision ballot.
- `repo-research/PM1_DECISION_MATRIX.md` — D-15..D-27 detail.
- `repo-research/PM1_PHASE_SEQUENCE.md` — 27 phases with gates, depends-on, file-ownership rules.
- `repo-research/RISK_REGISTER.md` — R-001..R-035.
- `repo-research/SECURITY_HARDENING_BRIEF.md` — security options A..E.
- `repo-research/BOOKING_CORRECTNESS_BRIEF.md` — booking options A..E.
- `repo-research/TOOLING_APPROVAL_BRIEF.md` — 9-tool matrix.
- `repo-research/UIX0_MOTION0_BRIEF.md` — first slice and budget.
- `repo-research/QA_STRATEGY_BRIEF.md` — QA strategy.
- `repo-research/FEATURE_TRACEABILITY_MATRIX.md` — feature-by-feature trace.
- `repo-research/AGENT_BOUNDARY_MAP.md` — file-zone ownership rules.
- `repo-research/OPEN_QUESTIONS.md` — Q-01..Q-20 (Q-13..Q-21 in PD1).
- `docs/ARCHITECTURE.md` — current architecture.
- `docs/SECURITY.md` — current security posture.
- `docs/DATABASE.md` — booking schema and RLS gap.
- `docs/FEATURES.md` — public + admin feature inventory.
- `docs/ROADMAP.md` — Phase 0..5 + 3.5.
- `docs/QA_CHECKLIST.md` — manual QA + future motion / taste QA.
- `docs/51_AGENT_HANDOFF_LOG.md` — phase ledger.
- `PROJECT_CONTROL_LOG.md` — phase ledger and gate status.
- `INTEGRATION_NOTES.md` — external service contracts.
- `memory/IMPORTANT_DECISIONS.md` — D-001..D-027 (D0 does not add new decisions).
- `memory/EPISODIC_MEMORY.md` — event log.
- `ai/AI_CONTEXT_RULES.md` — never-do list and phase discipline.
- `ai/AI_TASK_CAPSULE.md` — orientation.
- `ai/AI_FILE_OWNERSHIP.md` — file ownership rules.

## Appendix B — Files created in this batch

- `docs/D0_ARCHITECTURE_DECISIONS.md` (D0 area-by-area decision table; primary deliverable).
- `docs/D0_SYSTEM_DESIGN.md` (D0 target architecture, security, booking, observability, admin, QA / CI, tooling, UIX0 / MOTION0 design diagrams and contracts; primary deliverable).
- `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` (this file; D0 file-zone per phase; integration contract register; risk-to-phase mapping; rollback posture per phase; primary deliverable).

## Appendix C — Files modified in this batch

- `PROJECT_CONTROL_LOG.md` (D0 batch overlay).
- `memory/CURRENT_STATE.md` (snapshot updated to D0 written; pending review).
- `memory/ACTIVE_TASK_CONTEXT.md` (task replaced with D0 — Design / Architecture).
- `memory/WORKING_MEMORY.md` (D0 plan; architectural-path decisions; future-phase boundaries).
- `memory/EPISODIC_MEMORY.md` (D0 event appended).
- `memory/IMPORTANT_DECISIONS.md` (D0 reflection note appended; no new decisions).
- `ai/AI_TASK_CAPSULE.md` (phase line updated to D0; D0 reflection note).
- `ai/AI_CONTEXT_RULES.md` (D0 hard rule added; future-phase boundary note).
- `docs/51_AGENT_HANDOFF_LOG.md` (D0 entry appended).
- `INTEGRATION_NOTES.md` — **not modified** (no integration contract changed in D0; D0 only plans integration architecture).
