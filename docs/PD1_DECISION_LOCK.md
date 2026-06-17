# PD1 DECISION LOCK

> **Status:** Decision-lock package for ChatGPT Control Room and the owner. No code, no installs, no MCP setup, no lockfile edits, no README edits, no security or booking fixes, no D0 / A0 / UIX0 / MOTION0 / IMPL work started. PD1 takes the 13 PM1 recommendations (D-015..D-027) and the 9 open follow-up questions (Q-13..Q-21) and converts them into a clear default-or-approve ballot so the owner can lock the product / technical / design posture before D0 begins.
>
> **Phase:** PD1 — Decision Lock.
> **Source materials:** `docs/PM1_PLAN.md`, `repo-research/PM1_DECISION_MATRIX.md`, `repo-research/PM1_PHASE_SEQUENCE.md`, `repo-research/RISK_REGISTER.md`, `repo-research/SECURITY_HARDENING_BRIEF.md`, `repo-research/BOOKING_CORRECTNESS_BRIEF.md`, `repo-research/TOOLING_APPROVAL_BRIEF.md`, `repo-research/UIX0_MOTION0_BRIEF.md`, `repo-research/OPEN_QUESTIONS.md`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`, `docs/51_AGENT_HANDOFF_LOG.md`, all `memory/`, all `ai/`.
> **Hard rules respected:** no code, no installs, no MCP setup, no lockfile deletes, no `package.json` edits, no README edits, no security fixes, no booking fixes. Documentation-only.

## Table of Contents

1. Purpose and scope
2. Lock-status legend
3. Decision policy
4. Locked decisions (table)
5. Decisions still requiring owner approval (table)
6. Additional follow-up items bundled from PM1 (Q-13..Q-21)
   6.1 Ponytail — tooling candidate (NOT APPROVED)
7. D0 readiness assessment
8. Gates that remain blocked
9. Safety confirmation
10. Recommended next step

---

## 1. Purpose and scope

PM1 surfaced 13 owner decisions (D-015..D-027) and 9 open follow-up questions (Q-13..Q-21) that, taken together, define the product, technical, and design posture the rest of the work must follow. PD1 is the **decision-lock** phase: it does not start D0, A0, UIX0 / MOTION0, or TS0 / RDG0. It produces a ballot so the owner and ChatGPT Control Room can:

- accept the recommended default for each decision, or
- override the default with a different option, or
- defer the decision to a later named phase.

PD1 is a writing phase. It is allowed to create or modify files only inside the allowed change zones: `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, and (only if integration notes changed) `INTEGRATION_NOTES.md`. PD1 does not change integration notes in this batch — no integration contract changed.

## 2. Lock-status legend

Each decision in §4 and §5 carries one of these status tags:

- **LOCKED DEFAULT** — the recommended default is binding for the project unless the owner overrides it. Architectural work in D0 and A0 may proceed against the default.
- **NEEDS OWNER APPROVAL** — the decision requires an explicit owner sign-off before downstream architectural work depends on it. The recommended default is documented but not yet binding.
- **DEFERRED** — the decision is explicitly parked to a later, named phase. It is not a current blocker.
- **BLOCKS D0** — the decision shapes the architecture D0 must choose, so D0 cannot start until the decision is locked or the default is explicitly accepted.
- **BLOCKS IMPLEMENTATION ONLY** — the decision affects downstream implementation (security, booking, observability, UIX0 / MOTION0, tooling installs) but does not block D0's planning output.

A single decision can carry more than one tag. The "Required before" column names the phase that depends on the lock.

## 3. Decision policy

- **D0 may proceed** only if the decisions that shape architecture (D-015 package manager, D-016 launch identity, D-017 admin scope, D-018 security timing, D-019 booking timing, D-020 RLS timing, D-019-anthropic protection path, D-020-admin auth path, D-026 observability vendor) are either **LOCKED DEFAULT** or carry an explicit owner override. PD1 already records a recommended default for each, so D0 may proceed against those defaults.
- **Implementation remains blocked** even if D0 can proceed. IMPL phases depend on A0.
- **Tooling installation remains blocked** until TS0 / RDG0 approval.
- **UIX0 / MOTION0 implementation remains blocked** until the relevant gates clear (PM1, D0, A0, and the tool + design-skill approvals).

## 4. Locked decisions (table)

The following decisions are presented as **LOCKED DEFAULT** in this PD1 package. The owner can override any of them in the response. None of them are currently blocked on missing evidence; each has a rationale in `docs/PM1_PLAN.md` and `repo-research/PM1_DECISION_MATRIX.md`.

| Decision ID | Topic | Recommended Default | Owner Approval Needed? | Blocks D0? | Blocks Implementation? | Notes |
|---|---|---|---|---|---|---|
| D-015 | Package manager | **npm** | yes (can override to pnpm) | yes (Cleanup B depends on it; D0 architecture must name the canonical manager) | yes (Cleanup B is the only phase that may drop a lockfile) | `package-lock.json` is present and current. `package.json` scripts and `docs/DEPLOYMENT.md` assume `npm`. `docs/SETUP.md` already recommends `npm` until the owner decides. Lowest contributor friction. Cloudflare Pages default `npm run build` works unchanged. See `docs/PM1_PLAN.md` §3.4; `repo-research/LOCKFILE_DECISION_BRIEF.md` §5. Symmetric plan if pnpm is chosen. |
| D-016 | Product launch identity | **Real business site first**, with portfolio-safe language until real case studies exist | yes (can override to portfolio demo first) | yes (security / booking / RLS launch gates depend on this) | yes (LG-1..LG-10 are required under "real business") | Site is built for it. Branding, copy, delivery commitments, and the discovery-call flow are written for a real business. No published prices fits a discovery-call / quote-request funnel. "Real business" here means "collecting leads and doing engagements," not "publicly handling regulated data." See `docs/PM1_PLAN.md` §1; `repo-research/OPEN_QUESTIONS.md` Q-02. |
| D-017 | Admin scope | **Internal-only admin** for the foreseeable future; client-facing is a future scope expansion only | yes (can override to client-facing later or now) | yes (admin auth path and admin persistence depend on this) | yes (security phases and admin roadmap depend on this) | Admin tool is built for a single operator (Tayyab). Current `localStorage` persistence is appropriate for one operator. A client-facing view would require server-side persistence, a real auth model, and a separate route group, plus a new scope expansion. See `docs/PM1_PLAN.md` §9; `repo-research/OPEN_QUESTIONS.md` Q-03. |
| D-018 | Security before any non-internal launch | **Required** before any serious public / client use | yes (can override to defer for internal-only demo) | yes (D0 must name the auth + proxy + RLS path) | yes (closes LG-1, LG-2, LG-3) | R-002 (Anthropic key in bundle) is a billing risk. R-001 (admin password in bundle) is a public admin auth. R-006 (Supabase RLS off) exposes every booking. Shipping to a non-internal audience without fixes is not safe. See `docs/PM1_PLAN.md` §4; `repo-research/SECURITY_HARDENING_BRIEF.md` §3. |
| D-019 | Booking correctness before any non-internal launch | **Required** before launch | yes (can override to manual-only) | yes (D0 must name the reservation path) | yes (closes LG-4) | R-005 is a data-integrity bug. The MVP fix (A + C: read `available_slots`; n8n-mediated write) is small. The robust fix (B + D: transactional RPC behind a Worker) is gated on the Worker from §4 Stage 1. Without the fix, two visitors can book the same slot. See `docs/PM1_PLAN.md` §5; `repo-research/BOOKING_CORRECTNESS_BRIEF.md` §7–§10. |
| D-020 | Supabase RLS before any non-internal launch | **Required** if Supabase remains writable from client | yes (can override to defer) | yes (D0 must name the RLS policy) | yes (closes LG-3) | R-006 is the most severe unfixed risk. Anon key has full read/write on `bookings` and `available_slots`. The anon key is shipped in the static bundle. See `docs/PM1_PLAN.md` §4 Stage 3; `repo-research/RISK_REGISTER.md` R-006. |
| D-021 | Tooling order (TS0 / RDG0) | **Repomix → Graphify → Context7 MCP → Playwright MCP → Chrome DevTools MCP → Impeccable → Emil Kowalski → Tree-sitter / codebase-memory** | yes (can override list or order) | no (D0 plan can name this order without installing) | yes (TS0 / RDG0 must clear before any install) | Cheapest, broadest, most-generally-useful tools first. Browser-based QA split (Playwright before Chrome DevTools). Design skills come after the tools to test the output. Tree-sitter and codebase-memory are nice-to-have, reserved for later if at all. See `docs/PM1_PLAN.md` §7.2; `repo-research/TOOLING_APPROVAL_BRIEF.md` §3. |
| D-022 | UIX0 / MOTION0 priority | **High priority after** security, booking, RLS, observability baseline, and tooling approvals | yes (can override to later polish or minimal motion only) | no (D0 plans architecture, not motion budget) | yes (UIX0 / MOTION0 phase is gated) | D-011 direction is heavy motion. D-012 taste standard is non-AI-slop. The §8.7 performance budget keeps both honest (LCP unchanged, CLS = 0, INP in "good" range, +0 KB JS net for the first slice). See `docs/PM1_PLAN.md` §8.7; `memory/IMPORTANT_DECISIONS.md` D-011, D-012. |
| D-023 | BeFluence usage | **Reference only.** No copying layouts / assets / code. No scraping. No cloning. | yes (can override to ignore) | no | yes (any UIX0 / MOTION0 work must respect this) | D-011 already states this. PM1 §8.12 reaffirms it. BeFluence is motion / interaction inspiration only. See `docs/PM1_PLAN.md` §8.12; `memory/IMPORTANT_DECISIONS.md` D-011. |
| D-024 | Impeccable / Emil Kowalski adoption scope | **Use later, after TS0 / RDG0 approval.** Do not install now. Per-project install scope when approved (per D-012). | yes (can override to global or reference only) | no | yes (UIX0 / MOTION0 phase and any TS0 / RDG0 install depend on this) | Per-project install is the smallest scope that still allows the skills to work. Global install pollutes other projects. Reference-only means the skills are not installed at all. See `memory/IMPORTANT_DECISIONS.md` D-012, D-024; `docs/PM1_PLAN.md` §7.2. |
| D-025 | Recent proposals scope | **Later admin phase**, after auth and proposal-persistence decisions | yes (can override to MVP stabilization or remove from roadmap) | no | yes (admin feature phase depends on this) | Option A (surface `localStorage.co_last_proposal` in the existing tile) is the smallest honest improvement. Option B (persist proposals to Supabase or Worker + KV, list with click-through) is a post-Worker item. PM1 recommends A now, B later. Either is allowed; "Later admin phase" is the conservative default. See `docs/PM1_PLAN.md` §9.4 (R-4.1); `repo-research/OPEN_QUESTIONS.md` Q-12. |
| D-026 | Observability vendor / channel | **Sentry (errors, free tier) + UptimeRobot (uptime, free) + email alerts to `hello@codeoutfitters.com`** | yes (can override to GlitchTip / Better Stack / Discord / Slack / Telegram) | no (D0 plans architecture; vendor choice can be confirmed in A0) | yes (observability phase depends on this) | Sentry free tier covers a single-operator app. UptimeRobot is the simplest uptime monitor. Email is the default owner channel (no extra service). D-009 prefers free / open-source. Discord webhook is a good fallback if email is too noisy. See `docs/PM1_PLAN.md` §10; `repo-research/QA_STRATEGY_BRIEF.md` §3. |
| D-027 | Git / repo root status | **`git init` at `F:\CodeOutfitters`** in the future Setup phase, **only if** the owner confirms `F:\CodeOutfitters` is the real repo root. If not, find the real root and re-run PM1 there. | yes (can override to defer or pick a different root) | no (D0 is documentation-only) | yes (Setup phase depends on this) | No `.git` directory at the root. `git status` failed in the overnight batch. The lockfile decision (§3) explicitly relies on `git status` being clean before deletion. Future PR-style review is also impossible without git. See `docs/PM1_PLAN.md` §11; `repo-research/OPEN_QUESTIONS.md` Q-21. |

### Cross-link to the original PM1 decision register

| PD1 tag | Maps to PM1 row | Status |
|---|---|---|
| D-015 | PM1 §13 D-15 (lockfile) | LOCKED DEFAULT |
| D-016 | PM1 §13 D-16 (real business vs portfolio demo) | LOCKED DEFAULT |
| D-017 | PM1 §13 D-17 (admin audience) | LOCKED DEFAULT |
| D-018 | PM1 §13 D-18 (security timing) | LOCKED DEFAULT |
| D-019 | PM1 §13 D-19 (booking timing) | LOCKED DEFAULT |
| D-020 | PM1 §13 D-20 (RLS timing) | LOCKED DEFAULT |
| D-021 | PM1 §13 D-23 (tooling order) | LOCKED DEFAULT |
| D-022 | PM1 §13 D-21 (motion priority) | LOCKED DEFAULT |
| D-023 | PM1 §13 D-22 (BeFluence reference-only) | LOCKED DEFAULT |
| D-024 | PM1 §13 D-24 (Impeccable / Emil scope) | LOCKED DEFAULT |
| D-025 | PM1 §13 D-25 (Recent Proposals scope) | LOCKED DEFAULT |
| D-026 | PM1 §13 D-26 (observability vendor) | LOCKED DEFAULT |
| D-027 | PM1 §13 D-27 (git / repo root) | LOCKED DEFAULT |

PD1 does not capture new decisions; it normalizes the PM1 register into a single ballot. The original D-IDs in `memory/IMPORTANT_DECISIONS.md` remain canonical.

## 5. Decisions still requiring owner approval (table)

The following decisions are **architectural-path** decisions that PM1 identified but did not lock because the right answer depends on the owner's deployment and product posture. Each is presented as a small set of options with a recommended default. PD1 marks these as **NEEDS OWNER APPROVAL**; they are not blocking D0's *plan* output, but they block IMPL phases that depend on them.

| Decision ID | Question | Options | Recommended Default | Required Before |
|---|---|---|---|---|
| D-019a — Anthropic protection path | How should the Anthropic proposal call be protected once Cloudflare Pages / static export remains the deployment target? | (A) Keep static client-side key temporarily; (B) **Cloudflare Worker proxy**; (C) Drop static export, use a Next.js server route; (D) Other | **(B) Cloudflare Worker proxy** if Cloudflare Pages / static export remains the deployment target. Cost: $0 (Cloudflare free tier). Removes R-002 / R-004. The admin UI calls the Worker; the Worker holds the key as a server-side secret. See `repo-research/SECURITY_HARDENING_BRIEF.md` §3, §4. | Security phase 1 (Worker proxy) |
| D-020a — Admin auth path | How should the admin gate be replaced? | (A) Keep current `localStorage` password gate temporarily; (B) **Cloudflare Access**; (C) **Supabase Auth / magic link**; (D) Other | **Cloudflare Access for fast internal protection; Supabase Auth / magic link if admin becomes productized.** Cloudflare Access is the lowest-effort edge protection for a single operator on a Cloudflare Pages deploy. Supabase Auth pairs naturally with the future Supabase RLS work and the booking correctness work. D-009: no paid vendor. See `repo-research/SECURITY_HARDENING_BRIEF.md` §3, §4; `repo-research/OPEN_QUESTIONS.md` Q-15. | Security phase 2 (admin auth) |
| D-019b — Booking MVP write path | Which fix ships first? | (A) Client reads `available_slots` and visually blocks booked slots; (C) n8n handles booking validation; (E) Manual review only | **(A) first, then (C).** A is the smallest honest UI change. C removes the anon-key write path and is consistent with the Worker from Security 1. E is not acceptable for a paid funnel. See `docs/PM1_PLAN.md` §5.5; `repo-research/BOOKING_CORRECTNESS_BRIEF.md` §7, §8. | Booking A (MVP) phase |
| D-022a — Performance budget specifics | Confirm or revise the §8.7 numbers | LCP unchanged / CLS = 0 / INP in "good" range on Moto G Power class / +0 KB JS net for first slice | **Accept §8.7 as written.** Owner may tighten (perf first) or relax (motion first). See `docs/PM1_PLAN.md` §8.7. | UIX0 / MOTION0 first slice |
| D-021a — Test runner form | Real Playwright test runner in CI, or Playwright MCP only, or both? | Real runner / MCP-only / **Both** | **Both.** Real Playwright test runner for CI; Playwright MCP + Chrome DevTools MCP for the browser visual-QA loop. See `docs/PM1_PLAN.md` §6.4; `repo-research/OPEN_QUESTIONS.md` Q-18. | QA slices 1 & 2 |
| D-021b — Q-19 vendor choice | GlitchTip vs Sentry; Better Stack vs UptimeRobot | Sentry / GlitchTip / UptimeRobot / Better Stack | **Sentry + UptimeRobot.** Free / open-source per D-009. GlitchTip is the fallback if Sentry's free tier is not enough; Better Stack is the fallback if UptimeRobot is too noisy. See `docs/PM1_PLAN.md` §10.3. | Observability phase |

## 6. Additional follow-up items bundled from PM1 (Q-13..Q-21)

PM1 also surfaced nine smaller follow-up questions. PD1 packages them here as **bundled ballot items**. They are not blocking D0, but several are blocking Cleanup A and the Setup phase.

| ID | Question | Recommended Default | Required Before | Status |
|---|---|---|---|---|
| Q-13 (README/DEPLOY cleanup) | Should the legacy `DEPLOY.md` at the repo root be deleted in Cleanup A, or kept and reconciled with `docs/DEPLOYMENT.md`? | **Delete in Cleanup A** together with the README repair. Owner may override to "keep and reconcile." See `docs/PM1_PLAN.md` §2.4. | Cleanup A | DEFERRED to Cleanup A |
| Q-14 (Contact form source field) | Should the contact form add `source: "contact"` for symmetry with the other forms? | **Yes, in Cleanup A.** Owner may override to defer. See `repo-research/RISK_REGISTER.md` R-027; `docs/PM1_PLAN.md` §6.9. | Cleanup A | DEFERRED to Cleanup A |
| Q-15 (Auth model) | Cloudflare Access, Auth.js, Supabase Auth / magic link, or basic-auth-style proxy? | **Cloudflare Access for fast internal protection; Supabase Auth / magic link if admin becomes productized.** See §5 D-020a. | Security phase 2 | NEEDS OWNER APPROVAL |
| Q-16 (Performance budget) | What is the agreed performance budget for the UIX0 / MOTION0 first slice? | **LCP unchanged, CLS = 0, INP in "good" range, +0 KB JS net, no new CSS framework, no new external assets.** See §5 D-022a; `docs/PM1_PLAN.md` §8.7. | UIX0 / MOTION0 first slice | NEEDS OWNER APPROVAL |
| Q-17 (Taste acceptance rubric) | What is the minimum "premium agency feel" bar? | **Use the D-012 avoid / prefer list verbatim, plus Impeccable + Emil Kowalski review at the end of the first slice.** See `docs/PM1_PLAN.md` §8.10. | UIX0 / MOTION0 first slice | LOCKED DEFAULT (rubric exists) |
| Q-18 (Test runner form) | Real Playwright runner, MCP-only, or both? | **Both.** See §5 D-021a. | QA slices 1 & 2 | NEEDS OWNER APPROVAL |
| Q-19 (Observability vendor) | Sentry vs GlitchTip; UptimeRobot vs Better Stack? | **Sentry + UptimeRobot + email.** See §5 D-021b. | Observability phase | NEEDS OWNER APPROVAL |
| Q-20 (Brand status footer) | Live status source for the "All systems operational" badge, or keep static and document? | **Keep static in MVP. Document as a known limitation in `docs/SECURITY.md` (R-035). Replace with a live badge when the observability phase ships.** See `repo-research/RISK_REGISTER.md` R-035. | Observability phase | DEFERRED to observability phase |
| Q-21 (Repo root) | Confirm `F:\CodeOutfitters` is the real repo root. | **If confirmed, `git init` in the future Setup phase.** See D-027. | Setup phase | NEEDS OWNER APPROVAL |

### 6.1 Ponytail — tooling candidate (NOT APPROVED)

The owner has asked whether **Ponytail** (a third-party dev / AI tool, referenced by the owner; exact official GitHub repo URL not yet provided) can be installed. **It is not approved, not installed, not cloned, not configured, and not added to `package.json` in this batch or any pre-approval phase.** This sub-section records the candidate for the future TS0 / RDG0 submission only.

- **Approval status:** **NOT APPROVED.** Candidate only.
- **Type:** developer / AI tooling candidate. Not a runtime dependency by default. Per `ai/AI_CONTEXT_RULES.md`, developer tooling is not a runtime dependency.
- **Required gate:** **TS0 / RDG0.** Cannot be installed, cloned, or configured until TS0 / RDG0 approval is granted by ChatGPT Control Room after PD1.
- **Required owner input (must be answered before TS0 / RDG0 evaluation):**
  - **Exact official GitHub repo URL.** The owner must provide the canonical upstream URL. If the URL is unofficial, the candidate is rejected by default.
  - **Pinned version (or commit SHA).** No floating versions.
  - **Scope:** global / per-project / reference-only. Default if unspecified: **reference-only** (read the docs, do not install).
- **Required evaluation (answered in the future TS0 / RDG0 submission, not in PD1):**
  1. **What does Ponytail do?** — capability, intended use case, scope (per-project, monorepo, single-doc, etc.).
  2. **Is it safe and maintained?** — last commit date, open-issue volume, license, supply-chain history (typosquats, prior CVEs), review process.
  3. **Install footprint** — does it require `npm install` / `pnpm install` / `yarn install` (a `devDependency`), a `git clone`, an MCP server config, a global tool install, or a repo dependency? Each path requires a different gate and a different config-file write.
  4. **Overlap with existing candidates** — does it overlap with Graphify, Repomix, Context7, Impeccable, or Emil Kowalski skills? If yes, the team must justify adopting it instead of (or alongside) the existing candidate.
  5. **Scope** — should it be global tooling (pollutes other projects), external workspace tooling (separate from this repo), or a project dev dependency (adds to `package.json` `devDependencies`)? Default: external workspace or reference-only. Never a runtime dep.
  6. **Cost / license** — is it free and open-source? If it requires a paid plan, surface the cost to the owner before installing. **D-009** requires free / open-source by default.
  7. **Production / runtime impact** — does it touch production or runtime code? It must not. Default: no.
- **Ponytail cannot be installed** until:
  1. The owner provides the exact official GitHub repo URL.
  2. PD1 is approved.
  3. A TS0 / RDG0 submission explicitly evaluates the seven questions above.
  4. ChatGPT Control Room approves the TS0 / RDG0 submission.
- **Hard rules reaffirmed in this batch:** no install, no clone, no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install. PD1 only records the candidate.

Cross-link: this candidate joins the future TS0 / RDG0 list in §5 (D-021) and the open questions list (Q-13..Q-21) for owner response.

## 7. D0 readiness assessment

D0 is the next planning phase after PM1 and (optionally) PD1. D0 produces design / architecture decisions for security, booking, RLS, Worker, observability, and UIX0 / MOTION0, and updates `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DATABASE.md`, and `docs/ROADMAP.md`.

**D0 may proceed** after this PD1 because:

- All architecture-shaping decisions (D-015, D-016, D-017, D-018, D-019, D-020, D-019a, D-020a, D-026) carry a recommended default. D0 can plan against those defaults.
- The recommended defaults have evidence and rationale in PM1 and the strategy briefs.
- The owner can override any default in the response to PD1; the response is the lock.

**D0 may not proceed** if the owner rejects any of the defaults and no alternative is given. In that case PD1 must return a repair.

**D0 must not** do any of the following, regardless of approval:

- Start A0.
- Start any IMPL phase.
- Install any package or tool.
- Configure any MCP server.
- Edit any functional source file.
- Edit `README.md`, `DEPLOY.md`, `package.json`, either lockfile, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `components.json`, `.env*`, or `public/_headers`.
- Delete or move any existing source file.

## 8. Gates that remain blocked

After PD1, the following gates remain blocked:

- **D0** — blocked until ChatGPT Control Room approves PD1 (or returns a repair / reject).
- **A0** — blocked until D0 passes.
- **UIX0 / MOTION0 implementation** — blocked until PM1, D0, A0, and TS0 / RDG0 approval. D-011 / D-012 remain capture-only.
- **TS0 / RDG0 tooling** — blocked. No install of Repomix, Graphify, Context7 MCP, Playwright MCP, Chrome DevTools MCP, Impeccable, Emil Kowalski, Tree-sitter, codebase-memory MCP, or **Ponytail (candidate; not approved; gated to TS0 / RDG0)**.
- **Coding / IMPL** — blocked. No edits to `app/`, `components/`, `hooks/`, `lib/`, `public/`, `*.config.*`, `package.json`, either lockfile, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `components.json`, `.env*`, or `public/_headers` / `public/_redirects`.
- **Cleanup A and Cleanup B** — blocked until D0 passes (and Q-13 / Q-14 are answered for Cleanup A; D-015 is answered for Cleanup B).
- **Setup phase (git init)** — blocked until D-027 / Q-21 is answered.

## 9. Safety confirmation

This PD1 batch:

- Did not modify any source file under `app/`, `components/`, `hooks/`, `lib/`, `public/`.
- Did not modify `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `components.json`.
- Did not modify either lockfile (`package-lock.json`, `pnpm-lock.yaml`).
- Did not modify `.env*`, `.gitignore`, `README.md`, or `DEPLOY.md` (root).
- Did not run `npm install`, `pnpm install`, `yarn install`, or `npx` of any kind.
- Did not configure any MCP server.
- Did not install any tooling or skill (`npx skills add`, `npx impeccable install`, etc.).
- Did not install, clone, configure, or evaluate **Ponytail** (candidate only; not approved; recorded for future TS0 / RDG0).
- Did not initialize git or run any git-changing command.
- Did not create a CI config file.
- Did not create any test file.
- Did not start D0, A0, UIX0 / MOTION0, TS0 / RDG0, IMPL, or any implementation.
- Did not edit `INTEGRATION_NOTES.md` (no integration contract changed in this batch).
- Only created or modified files inside the allowed change zones: `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`.

## 10. Recommended next step

ChatGPT Control Room should:

1. **Approve the recommended defaults** in §4 and §5 by returning the list of accepted decision IDs and any overrides.
2. **Answer the bundled follow-up items** in §6 (Q-13..Q-21).
3. **Authorize D0 to start** with the accepted defaults, or request PD1 repair.

If the owner chooses to override any default, the override must name:

- the decision ID,
- the new choice,
- the rationale (one line is enough),
- any downstream decisions that the override frees or imposes.

PD1 does not start D0. PD1 does not code. PD1 does not install. PD1 does not configure tooling. PD1 stops and waits for ChatGPT Control Room.

---

## Appendix A — Cross-references

- `docs/PM1_PLAN.md` — PM1 plan (14 workstreams).
- `repo-research/PM1_DECISION_MATRIX.md` — D-15..D-27 detail with rationale, evidence, owner question.
- `repo-research/PM1_PHASE_SEQUENCE.md` — 27 phases with gates, depends-on, file-ownership rules.
- `repo-research/RISK_REGISTER.md` — R-001..R-035.
- `repo-research/SECURITY_HARDENING_BRIEF.md` — security options A..E.
- `repo-research/BOOKING_CORRECTNESS_BRIEF.md` — booking options A..E.
- `repo-research/TOOLING_APPROVAL_BRIEF.md` — 9-tool matrix.
- `repo-research/UIX0_MOTION0_BRIEF.md` — first slice and budget.
- `repo-research/OPEN_QUESTIONS.md` — Q-01..Q-21.
- `memory/IMPORTANT_DECISIONS.md` — D-001..D-027 (PD1 does not add new decisions).
- `ai/AI_CONTEXT_RULES.md` — never-do list and phase discipline.
- `docs/51_AGENT_HANDOFF_LOG.md` — phase ledger.
- `PROJECT_CONTROL_LOG.md` — phase ledger and gate status.

## Appendix B — Files created in this batch

- `docs/PD1_DECISION_LOCK.md` (this file; primary deliverable).
- `repo-research/PD1_OWNER_DECISION_BALLOT.md` (optional support file; one-line ballot per decision for fast owner response).

## Appendix C — Files modified in this batch

- `PROJECT_CONTROL_LOG.md` (PD1 batch overlay).
- `memory/CURRENT_STATE.md` (snapshot updated to PD1 written; pending review).
- `memory/ACTIVE_TASK_CONTEXT.md` (task replaced with PD1 — Decision Lock).
- `memory/WORKING_MEMORY.md` (PD1 ballot; gates; open follow-up items).
- `memory/EPISODIC_MEMORY.md` (PD1 event appended).
- `memory/IMPORTANT_DECISIONS.md` (PD1 lock-tags appended to D-015..D-027; no new decisions).
- `ai/AI_TASK_CAPSULE.md` (phase line updated; never-do list reaffirmed).
- `ai/AI_CONTEXT_RULES.md` (PD1 hard rule added; ballot handling note).
- `docs/51_AGENT_HANDOFF_LOG.md` (PD1 entry appended).
- `INTEGRATION_NOTES.md` — **not modified** (no integration contract changed in PD1).
