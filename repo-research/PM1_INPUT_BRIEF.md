# PM1 INPUT BRIEF

> PM1 has not been started. This document is input material for PM1. The PM1 phase requires explicit ChatGPT Control Room approval.

## 1. Recommended PM1 Objective

Produce a written plan that resolves the foundation blockers and decides on the security / booking / lockfile / tooling / motion direction, sequenced, with acceptance criteria for each workstream, and a clear list of decisions that still need the owner.

PM1 should be plan-only: it does not write code, does not install packages, does not configure MCP, does not delete lockfiles, does not edit `app/` or `components/` source files. It produces a `docs/PM1_PLAN.md` (or equivalent) that the next phase (PM1 review) will approve.

## 2. Required PM1 Workstreams

### A. README repair

- Source of truth for changes: `repo-research/README_REPAIR_SPEC.md`.
- Out of band: cannot delete `DEPLOY.md` in PM1 (source/config); defer to a follow-up cleanup phase.

### B. Lockfile decision

- Source of truth: `repo-research/LOCKFILE_DECISION_BRIEF.md`.
- Decision required from owner: keep npm, keep pnpm, or pick one and delete the other.

### C. Security hardening plan

- Source of truth: `repo-research/SECURITY_HARDENING_BRIEF.md`.
- Pick an architecture path: keep static export and accept risks for internal-only demo, add a Cloudflare Worker proxy, drop static export for a server route, or move admin auth to Supabase Auth / magic link.
- Decide which risks ship first.

### D. Booking correctness plan

- Source of truth: `repo-research/BOOKING_CORRECTNESS_BRIEF.md`.
- Pick the MVP fix and the future robust fix.

### E. Supabase / RLS plan

- Source of truth: `docs/SECURITY.md` R-003, `docs/DATABASE.md` RLS gap, `repo-research/RISK_REGISTER.md` R-006.
- Define the new SQL: enable RLS, deny all to anon, allow insert via an RPC or via a server endpoint.

### F. QA / test strategy

- Source of truth: `repo-research/QA_STRATEGY_BRIEF.md`.
- Define the first manual + automated QA slice.
- Decide which tooling (Playwright MCP, Chrome DevTools MCP, lint, typecheck) is in and which is out.

### G. Tooling approval strategy

- Source of truth: `repo-research/TOOLING_APPROVAL_BRIEF.md`.
- Submit a TS0 / RDG0 request for the recommended tools in the recommended order.
- Confirm the no-paid-tool default and the free / open-source-first rule.

### H. UIX0 / MOTION0 strategy

- Source of truth: `repo-research/UIX0_MOTION0_BRIEF.md`.
- Pick the first motion slice.
- Define the performance budget (LCP, CLS, INP, bundle size).
- Define the taste acceptance rubric.
- Do not implement.

### I. Admin proposal / dashboard roadmap

- Decide whether the "Recent Proposals" tile becomes MVP or stays deferred.
- Decide whether proposals persist to Supabase or stay `localStorage`-only.
- Outline admin motion discipline (lighter and faster than public site).

### J. Observability / monitoring plan

- Pick free options (Sentry or GlitchTip; UptimeRobot or Better Stack; webhook delivery monitor in n8n).
- Define the first alert thresholds.

## 3. Dependencies Between Workstreams

```
A. README repair          — independent, ship first
B. Lockfile decision      — independent, ship early; unblocks any local setup work
C. Security hardening     — depends on architecture decision; may require lockfile + worker setup
D. Booking correctness    — depends on Supabase plan (E) if RLS is added; otherwise independent
E. Supabase / RLS         — independent of A and B; needed by D if RLS-first
F. QA / test strategy     — depends on G (tooling) for any automated smoke
G. Tooling approval       — independent; gates Playwright/Chrome DevTools MCP
H. UIX0 / MOTION0         — depends on G (browser QA tooling) and on a taste rubric
I. Admin roadmap          — depends on C (auth model)
J. Observability          — independent; benefits from C and D being decided
```

## 4. Suggested Sequencing

1. A — README repair (small, unblocks onboarding)
2. B — Lockfile decision (unblocks clean local dev)
3. E — Supabase / RLS plan (blocks D's RLS-dependent path)
4. D — Booking correctness (fixes R-005 and R-006 together)
5. C — Security hardening plan (broader; depends on the architecture choice)
6. I — Admin roadmap (light; depends on C)
7. G — Tooling approval submission (TS0 / RDG0)
8. F — QA / test strategy (after tooling approved)
9. H — UIX0 / MOTION0 plan (after F is in place and tooling is approved)
10. J — Observability plan (continuous; can run in parallel with G / F / H)

## 5. Decisions Required From Owner

1. npm or pnpm as the canonical package manager? (`repo-research/LOCKFILE_DECISION_BRIEF.md`)
2. Is the admin tool internal-only for now, or will it become client-facing later?
3. Should the Anthropic proposal call be protected (Worker proxy) before any non-internal launch?
4. Should admin auth be hardened before any non-internal launch?
5. Should booking double-book prevention ship before any non-internal launch?
6. Should Supabase RLS be mandatory before any non-internal launch?
7. Is heavy motion a higher priority than strict first-load speed, or vice versa? What is the performance budget?
8. Should `befluence.pro` be treated only as inspiration, with no layout cloning? (Default: yes.)
9. Should Impeccable and Emil Kowalski be installed globally, per-project, or used only as reference? (Default: per-project, only after TS0 / RDG0 approval.)
10. Which tooling should be approved first?
11. Should the "Recent Proposals" viewer be part of MVP stabilization, or deferred?
12. Acceptable to keep the legacy `DEPLOY.md` until the cleanup phase, or delete it now?

## 6. Decisions OpenCode Can Recommend But Not Make

- Recommended package manager: `npm` (matches `package.json` scripts and `README.md`). Brief in `repo-research/LOCKFILE_DECISION_BRIEF.md`. Owner must confirm.
- Recommended security path: **Cloudflare Worker proxy** (B in `repo-research/SECURITY_HARDENING_BRIEF.md`) — minimal change, keeps static export, isolates the Anthropic key. Owner must confirm.
- Recommended booking MVP fix: client reads `available_slots` and blocks already-booked slots; later move to a Supabase RPC. Brief in `repo-research/BOOKING_CORRECTNESS_BRIEF.md`. Owner must confirm.
- Recommended tooling order: Repomix → Graphify → Context7 → Playwright MCP → Chrome DevTools MCP → Impeccable → Emil Kowalski → Tree-sitter / codebase-memory. Brief in `repo-research/TOOLING_APPROVAL_BRIEF.md`. Owner must approve each.
- Recommended UIX0 / MOTION0 first slice: hero entrance + animated headline + scroll-triggered section reveals + reduced-motion coverage. Brief in `repo-research/UIX0_MOTION0_BRIEF.md`. Owner must confirm.

## 7. Files Likely To Be Touched Later (post-approval, NOT in PM1)

- `README.md` — repair (per spec).
- `DEPLOY.md` — delete or repair.
- `package.json` — possibly add `packageManager` field; do not change deps in PM1.
- `package-lock.json` and/or `pnpm-lock.yaml` — one to be deleted after owner decision.
- `lib/proposal-generator.ts` — moved behind a Worker proxy.
- `app/admin/layout.tsx` — auth hardened.
- `components/booking-calendar-custom.tsx` — calls `getAvailableSlots`.
- `lib/booking-schema.sql` — add RLS, add seed-rotation helper.
- `public/_headers` — CSP updates if any new endpoint is added.
- `app/(public)/portfolio/page.tsx` — metadata copy reconciled with the "Sample Project" badge.
- `components/aos-provider.tsx` — `disable` flag for reduced motion.
- `hooks/useScrollReveal.ts` — delete after verification.
- `lib/gsap.ts`, `lib/animations/gsap-setup.ts`, `lib/animations/gsap-config.ts` — collapse to one canonical client setup.

## 8. Risk If Skipped

- README stays wrong → onboarding confusion.
- Lockfile stays dual → install-time drift; CI parity risk.
- Security stays as is → R-001 to R-005 ship to production, R-002 becomes a billing risk.
- Booking stays as is → double-book on first busy day.
- Supabase RLS stays off → any anon-key reader has full DB access.
- QA stays manual → no safety net for future changes.
- Tooling stays unapproved → UIX0 / MOTION0 cannot run its review loop.
- Motion stays un-planned → either shipped without performance budget, or never shipped.
- Observability stays off → silent failures.

## 9. PM1 Acceptance Criteria

PM1 is considered complete when, in a single phase and without code:

1. `docs/PM1_PLAN.md` (or equivalent) exists and is committed to the foundation tree.
2. Each workstream A–J has: scope, owner decision needed, dependencies, recommended path, acceptance criteria.
3. Sequencing is explicit, with phases numbered and dependencies drawn.
4. All open questions are written into `repo-research/OPEN_QUESTIONS.md` and `memory/WORKING_MEMORY.md`.
5. The risk register is up to date (`repo-research/RISK_REGISTER.md`).
6. PM1 stops and waits for ChatGPT Control Room review.

PM1 does **not** start D0, A0, UIX0 / MOTION0, or any implementation. PM1 does **not** install anything. PM1 does **not** delete either lockfile.
