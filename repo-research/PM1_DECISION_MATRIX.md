# PM1 Decision Matrix

> Supporting file for `docs/PM1_PLAN.md` §13. One row per owner decision. Each row expands the recommended default with: rationale, evidence, dependencies, and the question the owner must answer to close it.
> **Status:** Draft for ChatGPT Control Room review. No implementation.

## How to use this file

- Read each row in order.
- For each decision, choose one of the listed options (or use a different one if the brief allows).
- Once a decision is closed, move it to a "Closed" section at the bottom of this file. Do not delete history.
- All decisions are recommendations by OpenCode. The owner confirms.

## Decision matrix

### D-15 — Package manager

- **Options:** `npm` | `pnpm`
- **Recommended:** `npm`
- **Rationale:** `package-lock.json` is present and current. `package.json` scripts and `docs/DEPLOYMENT.md` already assume `npm`. `docs/SETUP.md` already recommends `npm` until the owner decides. Lowest contributor friction. No `package.json` change required. Cloudflare Pages default `npm run build` works unchanged.
- **Evidence:** `package-lock.json` (present), `pnpm-lock.yaml` (present), `package.json:5-10` (scripts), `docs/SETUP.md:8,17-21`, `docs/DEPLOYMENT.md:17`.
- **If pnpm is chosen instead:** delete `package-lock.json`, add `"packageManager": "pnpm@<version>"` to `package.json`, regenerate, update docs, add `package-lock.json` to `.gitignore`, add CI guard. Symmetric cost.
- **Required before:** Cleanup phase B (lockfile resolution).
- **Closes risk:** R-002 (config).
- **Owner's question:** "Confirm the canonical package manager is `npm`. OK to drop `pnpm-lock.yaml` in Cleanup B? (Y / N / pick pnpm instead)"

### D-16 — Real business launch vs portfolio demo first

- **Options:** real business | portfolio demo
- **Recommended:** real business
- **Rationale:** The site is built for it. Branding, copy, delivery commitments, and discovery-call flow are all written for a real business. No pricing is published, which fits a discovery-call / quote-request funnel. "Real business" here means "collecting leads and doing engagements," not "publicly handling regulated data."
- **Evidence:** `docs/FEATURES.md`, `memory/SEMANTIC_MEMORY.md` (business model), `app/(public)/pricing/page.tsx` (quote form, no prices), `docs/SECURITY.md` (threat model says "US small businesses" and "single operator").
- **If portfolio demo is chosen instead:** the launch gates (LG-1..LG-10) become optional, not required. The MVP fix for booking is still worth doing for honesty.
- **Required before:** Phase 1 of any security or observability work.
- **Closes risk:** none directly; affects priority of LG-1..LG-10.
- **Owner's question:** "Is CodeOutfitters launching as a real US small-business AI automation agency, or as a portfolio demo first?"

### D-17 — Admin audience

- **Options:** internal-only | client-facing later
- **Recommended:** internal-only
- **Rationale:** The admin tool is built for a single operator (Tayyab). Client proposals are sent via the operator's email, not via a client login. The current persistence (localStorage) is appropriate for one operator. A client-facing view would require server-side persistence, a real auth model, and a separate route group.
- **Evidence:** `app/admin/layout.tsx` (client-side password gate), `components/admin/onboarding-form.tsx` (5 sections), `components/admin/proposal-output.tsx` (11 sections), `docs/FEATURES.md` (admin section), `docs/ROADMAP.md` (admin roadmap R-4.x).
- **If client-facing is chosen later:** scope expansion, server-side persistence, real auth, separate route group, owner approval.
- **Required before:** Security phase 2 (admin auth).
- **Closes risk:** none directly; affects scope of §4 Stages 2 / 7.
- **Owner's question:** "Confirm admin is internal-only for the foreseeable future. (Y / N — client-facing later)"

### D-18 — Security before any non-internal launch

- **Options:** yes | no
- **Recommended:** yes
- **Rationale:** R-002 (Anthropic key in bundle) is a billing risk. R-001 (admin password in bundle) is a public admin auth. R-006 (Supabase RLS off) exposes every booking. These are launch gates (LG-1, LG-2, LG-3). Shipping to a non-internal audience without fixing them is not safe.
- **Evidence:** `repo-research/RISK_REGISTER.md` R-001..R-006, `docs/SECURITY.md` R-001..R-005, `repo-research/SECURITY_HARDENING_BRIEF.md` §3 (Options A..E).
- **Required before:** Any phase that targets a non-internal audience.
- **Closes risk:** gates LG-1, LG-2, LG-3 indirectly.
- **Owner's question:** "Confirm security (Worker proxy + admin auth + Supabase RLS) must be in place before any non-internal launch. (Y / N)"

### D-19 — Booking fix before any non-internal launch

- **Options:** yes | no
- **Recommended:** yes
- **Rationale:** R-005 (booking double-book) is a data-integrity bug. The MVP fix (A + C in §5.4) is small. The robust fix (B + D) is gated on the Worker from §4 Stage 1. Without the fix, two visitors can book the same slot, which is unacceptable for a paid funnel.
- **Evidence:** `repo-research/BOOKING_CORRECTNESS_BRIEF.md` §1–§3, `docs/DATABASE.md` (Known issue), `components/booking-calendar-custom.tsx:26-30` (no call to `getAvailableSlots`).
- **Required before:** Any phase that targets a non-internal audience.
- **Closes risk:** LG-4.
- **Owner's question:** "Confirm booking correctness must be in place before any non-internal launch. (Y / N — accept manual review only)"

### D-20 — Supabase RLS before any non-internal launch

- **Options:** yes | no
- **Recommended:** yes
- **Rationale:** R-006 is the most severe of the unfixed risks. Anon key has full read/write on `bookings` and `available_slots`. The anon key is shipped in the static bundle. Without RLS, anyone who reads the anon key from the bundle can read every booking and write arbitrary rows.
- **Evidence:** `lib/booking-schema.sql` (no `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`), `docs/DATABASE.md` (RLS section), `repo-research/RISK_REGISTER.md` R-006.
- **Required before:** Any phase that targets a non-internal audience.
- **Closes risk:** LG-3.
- **Owner's question:** "Confirm Supabase RLS must be in place before any non-internal launch. (Y / N)"

### D-21 — Motion priority vs performance budget

- **Options:** motion first | perf first | balanced
- **Recommended:** balanced
- **Rationale:** D-011 direction is heavy motion. D-012 taste standard is non-AI-slop. Performance rules already exist: GPU-friendly transforms, no layout shift, mobile-friendly, `prefers-reduced-motion` honored. PM1 proposes a strict performance budget (§8.7) that holds even when motion is added. LCP, CLS, INP are the primary metrics.
- **Evidence:** `memory/IMPORTANT_DECISIONS.md` D-011, D-012, `docs/FEATURES.md` (design + motion target section), `docs/ARCHITECTURE.md` (animation system + future motion constraints), `docs/QA_CHECKLIST.md` (motion + taste QA).
- **If motion first:** LCP / INP budgets are looser. Risk: jank on mid-tier mobile (R-014).
- **If perf first:** motion is dialed back. Risk: site feels generic, contradicts D-011 / D-012.
- **Required before:** UIX0 / MOTION0 first slice.
- **Closes risk:** R-012, R-013, R-014, R-015 indirectly.
- **Owner's question:** "Confirm the performance budget in §8.7 (LCP unchanged, CLS = 0, INP in 'good' range, +0 KB JS net for the first slice). (Y / N — relax or tighten)"

### D-22 — BeFluence reference-only confirmation

- **Options:** yes | no
- **Recommended:** yes (reference only)
- **Rationale:** D-011 already states this. The site must not copy `befluence.pro` assets, must not scrape, must not clone. BeFluence is motion / interaction inspiration only. This is reaffirmed in PM1 §8.12 and the lockfile / security / booking / UIX0 / MOTION0 / QA plans.
- **Evidence:** `memory/IMPORTANT_DECISIONS.md` D-011, `repo-research/UIX0_MOTION0_BRIEF.md` §1.
- **Required before:** UIX0 / MOTION0 first slice.
- **Closes risk:** none directly; reaffirms D-011.
- **Owner's question:** "Confirm BeFluence is reference only. (Y / N — allow any other use)"

### D-23 — Tooling order

- **Options:** any order; the recommended order is in §7.2 of `docs/PM1_PLAN.md`.
- **Recommended:** Repomix → Graphify → Context7 → Playwright MCP → Chrome DevTools MCP → Impeccable → Emil Kowalski → Tree-sitter / codebase-memory.
- **Rationale:** Cheapest, broadest, most-generally-useful tools first. Browser-based QA is split (Playwright before Chrome DevTools). Design skills come after the tools to test the output. Tree-sitter and codebase-memory are nice-to-have; reserved for later if at all.
- **Evidence:** `repo-research/TOOLING_APPROVAL_BRIEF.md` §3.
- **Required before:** TS0 / RDG0 submission.
- **Closes risk:** R-011 indirectly.
- **Owner's question:** "Approve the tool list and the order? (Y / N — modify list or order)"

### D-24 — Impeccable / Emil install scope

- **Options:** global | per-project | reference only
- **Recommended:** per-project, only after TS0 / RDG0 approval (D-012)
- **Rationale:** D-012 already states per-project + gated. Global install is harder to undo and pollutes other projects. Reference-only means the skills are not installed at all; the team reads them on paper.
- **Evidence:** `memory/IMPORTANT_DECISIONS.md` D-012, `repo-research/TOOLING_APPROVAL_BRIEF.md` §3 (Impeccable + Emil rows).
- **Required before:** UIX0 / MOTION0 first slice.
- **Closes risk:** none directly; reaffirms D-012.
- **Owner's question:** "Confirm Impeccable + Emil install scope = per-project, only after TS0 / RDG0 approval. (Y / N — change to global / reference only)"

### D-25 — Recent Proposals viewer scope

- **Options:** MVP now (Option A) | deferred (Option B) | both
- **Recommended:** Option A now; Option B later
- **Rationale:** Option A is the smallest honest improvement (surface `localStorage.co_last_proposal` in the existing tile, remove the "Coming soon" tag). Option B requires Supabase persistence (or Worker + KV) and is a post-Worker item.
- **Evidence:** `app/admin/page.tsx` (Coming soon tile), `docs/ROADMAP.md` R-4.1, `docs/FEATURES.md` (admin section).
- **Required before:** Cleanup A or Admin features phase.
- **Closes risk:** R-018 partially (only after Option B).
- **Owner's question:** "Option A now, Option B later, or both now? (A / B / both / defer)"

### D-26 — Observability vendor

- **Options:** Sentry vs GlitchTip (errors) | UptimeRobot vs Better Stack (uptime) | email vs Discord vs Slack vs Telegram (alerts)
- **Recommended:** Sentry (errors) + UptimeRobot (uptime) + email (alerts)
- **Rationale:** Sentry's free tier covers a single-operator app. UptimeRobot is the simplest uptime monitor. Email is the default owner channel (no extra service). D-009 prefers free / open-source. Discord webhook is a good fallback if email is too noisy.
- **Evidence:** `repo-research/QA_STRATEGY_BRIEF.md` §3 (Sentry / GlitchTip / UptimeRobot / Better Stack), `repo-research/RISK_REGISTER.md` R-010, `memory/IMPORTANT_DECISIONS.md` D-009.
- **Required before:** Observability phase.
- **Closes risk:** R-010.
- **Owner's question:** "Approve Sentry + UptimeRobot + email as the default observability stack? (Y / N — pick different vendor / channel)"

### D-27 — Git / repo root status

- **Options:** initialize git at `F:\CodeOutfitters` | find a different root | defer
- **Recommended:** initialize at `F:\CodeOutfitters` if confirmed as the real root; otherwise find the real root
- **Rationale:** No `.git` directory at the root. `git status` failed in the overnight batch. The lockfile decision (§3) explicitly relies on `git status` being clean before deletion. Future PR-style review is also impossible without git. The owner must confirm the real root.
- **Evidence:** `OVERNIGHT-SAFE-PRE8-AND-PM1-PREP` batch log (overnight batch reported `git status` failure), `repo-research/PRE8_CHECKPOINT.md` §11 (file timestamps confirm no source-file modification; no git change tracking exists).
- **Required before:** Setup phase.
- **Closes risk:** none directly; addresses an environment gap.
- **Owner's question:** "Confirm `F:\CodeOutfitters` is the real repo root, and OK to `git init` in a future Setup phase. (Y / N — different root)"

## Decision cross-reference

| D-ID | Closes risk | Required before | Default |
|---|---|---|---|
| D-15 | R-002 (config) | Cleanup B | npm |
| D-16 | (priority) | Phase 1 of any security / observability | real business |
| D-17 | (scope) | Security phase 2 | internal-only |
| D-18 | LG-1, LG-2 | Any non-internal launch | yes |
| D-19 | LG-4 | Any non-internal launch | yes |
| D-20 | LG-3 | Any non-internal launch | yes |
| D-21 | R-012..R-015 | UIX0 / MOTION0 | balanced |
| D-22 | (D-011 reaffirm) | UIX0 / MOTION0 | yes |
| D-23 | R-011 | TS0 / RDG0 | per §7.2 |
| D-24 | (D-012 reaffirm) | UIX0 / MOTION0 | per-project, gated |
| D-25 | R-018 partial | Cleanup A or admin phase | A now, B later |
| D-26 | R-010 | Observability phase | Sentry + UptimeRobot + email |
| D-27 | (env gap) | Setup phase | init at `F:\CodeOutfitters` |

## Closed decisions (to be filled in)

> Once the owner confirms a decision, move it here. Do not delete history.

| D-ID | Closed at | Closed by | Final choice | Notes |
|---|---|---|---|---|
| _none yet_ |  |  |  |  |

## Safety confirmation (this file)

- This file is documentation only. No code, no installs, no config.
- No source / runtime / config files were modified to produce this file.
- This file lives in the allowed change zone (`repo-research/`).
