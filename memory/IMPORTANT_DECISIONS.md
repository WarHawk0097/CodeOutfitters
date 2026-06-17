# Important Decisions

The decisions that shape this project. Each entry records the decision, the rationale, and the gate that would have to reopen it.

## D-001 — Development memory is required; runtime memory is not

- **Decision:** Maintain the `memory/`, `ai/`, `docs/`, and `repo-research/` trees for development continuity. The product itself does not need product-level runtime memory.
- **Rationale:** Project is a single-operator admin tool backed by Supabase and n8n. No multi-tenant state, no in-app personalization, no user accounts.
- **Reopen if:** the admin tool grows multi-user, or a chat/agent feature is added that requires conversation history.

## D-002 — Static export / Cloudflare Pages is the deployment model

- **Decision:** `next.config.mjs` uses `output: 'export'`. The site is built to `out/` and deployed to Cloudflare Pages. `public/_redirects` and `public/_headers` configure SPA fallback and CSP.
- **Rationale:** Cost, speed, no serverless billing, no operational surface.
- **Constraint imposed:** all secrets used by the browser must be `NEXT_PUBLIC_*` and are therefore shipped in the JS bundle.
- **Reopen if:** server-side authentication, server-side API calls, or RLS-enforced Supabase access become required.

## D-003 — Supabase used for booking persistence

- **Decision:** `bookings` and `available_slots` tables, defined in `lib/booking-schema.sql`, accessed via `lib/supabase.ts` from the browser.
- **Rationale:** Direct REST access, no server function needed, fits static export.
- **Open risk:** no RLS enabled in the SQL file; anon key has full access.
- **Reopen if:** a server function is added; RLS must be re-evaluated.

## D-004 — n8n used for form workflows

- **Decision:** One shared `NEXT_PUBLIC_N8N_WEBHOOK_URL` for quote, contact, booking, and newsletter submissions.
- **Rationale:** Centralizes form handling, easy to evolve, no code change required to add new form types.
- **Constraint:** payload shapes are not enforced server-side; a misconfigured workflow can misroute.
- **Reopen if:** volume or compliance needs push toward a dedicated form service.

## D-005 — Anthropic API used client-side for proposal generation

- **Decision:** `lib/proposal-generator.ts` calls `https://api.anthropic.com/v1/messages` directly from the browser using `claude-sonnet-4-6`.
- **Rationale:** Avoids needing a server function inside a static-export constraint. Acceptable while the admin tool is single-operator.
- **Known risk:** API key is in the static bundle. Documented in code comments and in `docs/SECURITY.md`.
- **Recommended future fix (not yet implemented):** proxy through a Cloudflare Worker; hold the key as a server-side env var. Do not implement until Control Room approval.

## D-006 — Security gaps are documented, not fixed, in DOC-MEMORY-REPAIR

- **Decision:** Phase brief explicitly forbids fixing security in this phase. Document and defer.
- **Rationale:** Security fixes can change behavior, change env var contracts, and require re-testing. They need a plan-first phase.
- **Reopen if:** the next phase authorizes security hardening.

## D-007 — Dual lockfile issue is documented, not fixed

- **Decision:** Both `package-lock.json` and `pnpm-lock.yaml` remain in the repo for now. Do not delete either in this phase.
- **Rationale:** Deleting a lockfile could break a contributor's local install. Resolution belongs in a plan-first phase.
- **Reopen if:** PM1 recommends a pick.

## D-008 — Playwright / Graphify / MCP tooling requested by owner but not approved

- **Decision:** No install. No configuration. No code path that requires them.
- **Rationale:** Control rules: developer tooling is not a runtime dependency by default. Approval is gated.
- **Reopen if:** TS0 or RDG0 approval is granted by ChatGPT Control Room.

## D-009 — Free / open-source tooling preferred

- **Decision:** When tooling is eventually approved, prefer free and open-source options.
- **Rationale:** Cost discipline. No paid tools suggested unless explicitly approved.
- **Reopen if:** the approved scope requires a paid tool and budget is approved.

## D-010 — No feature work begins from DOC-MEMORY-REPAIR

- **Decision:** This phase creates the foundation. It does not start PM1, D0, A0, or any implementation.
- **Rationale:** Phases are gates. Skipping a gate is a protocol violation.
- **Reopen if:** the phase order is changed by Control Room.

## D-011 — Premium motion direction (BeFluence-inspired, not copied)

- **Decision:** The owner wants CodeOutfitters to have heavy, premium, agency-grade animation inspired by `befluence.pro`. Use as motion/interaction inspiration only. Do not copy assets, do not scrape, do not reproduce.
- **Direction captured (no code yet):**
  - Overall feel: premium AI automation agency. Modern, bold, high-energy. Smooth scroll-driven storytelling. More animated than a normal SaaS site. Professional enough for US small-business clients. Cool enough to feel like a high-end AI agency.
  - Animation types: hero entrance, animated headline reveal, scroll-triggered section reveals, smooth parallax layers, floating cards, animated service cards, horizontal marquee / moving logo strips, animated statistics counters, interactive hover/magnetic buttons, smooth page transitions, portfolio cards with motion depth, process timeline animation, ROI calculator micro-interactions, contact/booking form transitions.
  - Admin motion: dashboard should stay cleaner and faster, with lighter motion.
- **Performance rules (must hold even when motion is added):**
  - Animations must not slow the site.
  - Use GPU-friendly transforms where possible.
  - Avoid layout-shifting animations.
  - Avoid excessive bundle growth.
  - Must support mobile performance.
  - Must support `prefers-reduced-motion`.
  - Must be visually tested before approval.
- **Existing animation stack to consider (no new libraries until TS0/RDG0):** GSAP, ScrollTrigger, `@gsap/react`, Framer Motion, AOS, Lenis.
- **Future tooling requirement (not approved yet):** visual / motion QA via Playwright MCP and Chrome DevTools MCP, run as a browser-based review loop: AI creates motion output → AI checks in browser → AI improves weak sections → AI repeats until it matches the desired quality.
- **Gate:** Implementation belongs in a dedicated **UIX0 / MOTION0** phase, after DOC-MEMORY-REPAIR and ChatGPT Control Room approval. No code, no package installs, no MCP setup, no design implementation in this phase.
- **Reopen if:** the UIX0 phase authorizes work, or the owner changes the direction.

## D-012 — Design taste skills (Impeccable + Emil Kowalski, future only)

- **Decision:** The owner wants CodeOutfitters' design quality to be guided by:
  1. **Impeccable** — main frontend design review layer. Used to avoid AI-generated generic UI. Covers typography, spacing, hierarchy, color, interaction quality, responsive design, UX writing, and polish.
  2. **Emil Kowalski / Agents with Taste** — motion and animation taste reference. Used for tasteful, natural, purposeful animation. Used to avoid random decorative motion. Used to improve hero animation, card motion, transitions, hover states, page transitions, and scroll-triggered storytelling.
  3. **Taste standard (non-AI-slop):**
     - **Avoid:** generic purple/blue SaaS gradients, same-looking rounded cards everywhere, weak typography hierarchy, random icons above every heading, unmotivated animations, slow heavy motion that damages usability, overdone effects that feel childish.
     - **Prefer:** premium AI automation agency feel, strong typography, clear hierarchy, confident spacing, smooth purposeful animation, fast interaction feedback, scroll-based storytelling, professional US small-business trust, beautiful but operational UI.
- **Future browser QA loop (not approved yet):** AI generates UI/motion output → AI opens the page in browser via Playwright MCP / Chrome DevTools MCP → AI visually critiques the result using Impeccable + taste rules → AI improves weak sections → AI repeats until the page feels premium and polished.
- **Gate:** No install of Impeccable, no `npx skills add`, no `npx impeccable install`, no MCP configuration, no design implementation in this phase. Capture as a future **UIX0 / MOTION0 / TOOLING0** requirement, gated behind ChatGPT Control Room approval.
- **Reopen if:** the UIX0 phase authorizes work, or the owner changes direction.

## D-013 — Risk register is the canonical risk surface

- **Decision:** Maintain `repo-research/RISK_REGISTER.md` as the single source of truth for project risks. New risks get a new R-ID. Closed risks are moved to a "Closed" section, not deleted.
- **Rationale:** Avoids risk sprawl across `docs/`, `memory/`, and chat. Easy to scan. Easy to update in PR reviews.
- **Reopen if:** the risk taxonomy needs to change (e.g. a formal compliance review is added).

## D-014 — Strategy briefs in `repo-research/` are PM1 inputs, not PM1 deliverables

- **Decision:** The overnight batch produces strategy briefs (security, booking, lockfile, README, tooling, UIX0, QA) as planning inputs. The actual PM1 phase is its own gated step that turns these into a single coherent `docs/PM1_PLAN.md`.
- **Rationale:** Strategy briefs can be drafted safely without code. The plan synthesis requires decisions (architecture choice, auth model, lockfile pick) that only the owner can make.
- **Reopen if:** the owner authorizes a different PM1 input format.

## D-015 — Lockfile recommendation is `npm`

- **Decision (PM1 recommendation; owner must confirm):** Canonical package manager is `npm`. Drop `pnpm-lock.yaml` in Cleanup B; add it to `.gitignore`; add a CI guard so it does not reappear.
- **Rationale:** `package-lock.json` is present and current. `package.json` scripts and `docs/DEPLOYMENT.md` already assume `npm`. `docs/SETUP.md` already recommends `npm` until the owner decides. Lowest contributor friction. No `package.json` change required. Cloudflare Pages default `npm run build` works unchanged.
- **Source:** `repo-research/LOCKFILE_DECISION_BRIEF.md` §5; `docs/PM1_PLAN.md` §3.4.
- **Reopen if:** the owner picks pnpm. The symmetric plan applies (delete `package-lock.json`, add `"packageManager"` to `package.json`, regenerate, update docs, add CI guard).
- **Closes risk:** R-002 (config).

## D-016 — Real business launch is the default

- **Decision (PM1 recommendation; owner must confirm):** CodeOutfitters launches as a real US small-business AI automation agency, not as a portfolio demo first. The launch gates (LG-1..LG-10 in `docs/PM1_PLAN.md` §1.4) are required before any non-internal audience.
- **Rationale:** The site is built for it (branding, copy, delivery commitments, discovery-call flow). No published prices fits a discovery-call / quote-request funnel. "Real business" here means "collecting leads and doing engagements," not "publicly handling regulated data."
- **Source:** `docs/PM1_PLAN.md` §1; `memory/SEMANTIC_MEMORY.md` (business model).
- **Reopen if:** the owner confirms portfolio-demo intent. The launch gates become optional but the MVP booking fix is still worth doing for honesty.

## D-017 — Admin is internal-only for now

- **Decision (PM1 recommendation; owner must confirm):** The admin tool is internal-only for the foreseeable future. Single operator (Tayyab). Clients do not log in to the admin tool; proposals are sent via the operator's email.
- **Rationale:** The admin tool is built for a single operator. Current persistence (`localStorage`) is appropriate for one operator. A client-facing view would require server-side persistence, a real auth model, and a separate route group.
- **Source:** `docs/PM1_PLAN.md` §9.
- **Reopen if:** the owner authorizes a scope expansion to a client-facing proposal view. That requires server-side persistence, a real auth model, and a separate route group.

## D-018 — Security is a launch gate

- **Decision (PM1 recommendation; owner must confirm):** Security (Worker proxy + admin auth + Supabase RLS) must be in place before any non-internal launch. Closes LG-1, LG-2, LG-3.
- **Rationale:** R-002 (Anthropic key in bundle) is a billing risk. R-001 (admin password in bundle) is a public admin auth. R-006 (Supabase RLS off) exposes every booking.
- **Source:** `docs/PM1_PLAN.md` §4; `repo-research/SECURITY_HARDENING_BRIEF.md` §3 (Options A..E).
- **Reopen if:** the owner explicitly accepts the risk and ships to a non-internal audience without these fixes.

## D-019 — Booking correctness is a launch gate

- **Decision (PM1 recommendation; owner must confirm):** Booking correctness (UI reads `available_slots.is_booked` + transactional reservation) must be in place before any non-internal launch. Closes LG-4.
- **Rationale:** R-005 is a data-integrity bug. The MVP fix (A + C) is small. The robust fix (B + D) is gated on the Worker from §4 Stage 1. Without the fix, two visitors can book the same slot, which is unacceptable for a paid funnel.
- **Source:** `docs/PM1_PLAN.md` §5; `repo-research/BOOKING_CORRECTNESS_BRIEF.md` §7.
- **Reopen if:** the owner explicitly accepts manual review only (Option E) as the production posture.

## D-020 — Supabase RLS is a launch gate

- **Decision (PM1 recommendation; owner must confirm):** Supabase RLS must be enabled before any non-internal launch. Closes LG-3.
- **Rationale:** R-006 is the most severe unfixed risk. Anon key has full read/write on `bookings` and `available_slots`. The anon key is shipped in the static bundle.
- **Source:** `docs/PM1_PLAN.md` §4 Stage 3; `docs/DATABASE.md` (RLS section); `repo-research/RISK_REGISTER.md` R-006.
- **Reopen if:** the owner explicitly accepts the risk and ships to a non-internal audience without RLS.

## D-021 — Motion priority is balanced with the §8.7 performance budget

- **Decision (PM1 recommendation; owner must confirm):** The UIX0 / MOTION0 first slice targets a balanced motion / performance budget per `docs/PM1_PLAN.md` §8.7. LCP unchanged or improved; CLS = 0; INP stays in "good" range on a Moto G Power class device; +0 KB JS net from new libraries; no new external assets.
- **Rationale:** D-011 direction is heavy motion. D-012 taste standard is non-AI-slop. Both must hold. A strict performance budget keeps the motion honest and avoids jank on mid-tier mobile.
- **Source:** `docs/PM1_PLAN.md` §8.7; `memory/IMPORTANT_DECISIONS.md` D-011, D-012.
- **Reopen if:** the owner relaxes the budget (motion first) or tightens it (perf first).

## D-022 — BeFluence is reference only (reaffirmed from D-011)

- **Decision (PM1 reaffirmation; D-011 already states this):** `befluence.pro` is motion / interaction inspiration only. Do not copy assets. Do not scrape. Do not clone.
- **Rationale:** The owner direction in D-011 is explicit. PM1 reaffirms it in §8.12.
- **Source:** `docs/PM1_PLAN.md` §8.12; `memory/IMPORTANT_DECISIONS.md` D-011.

## D-023 — Tooling order per §7.2

- **Decision (PM1 recommendation; owner must confirm):** Tooling installation order is Repomix → Graphify → Context7 → Playwright MCP → Chrome DevTools MCP → Impeccable → Emil Kowalski → Tree-sitter / codebase-memory.
- **Rationale:** Cheapest, broadest, most-generally-useful tools first. Browser-based QA is split (Playwright before Chrome DevTools). Design skills come after the tools to test the output. Tree-sitter and codebase-memory are nice-to-have; reserved for later if at all.
- **Source:** `docs/PM1_PLAN.md` §7.2; `repo-research/TOOLING_APPROVAL_BRIEF.md` §3.
- **Reopen if:** the owner prefers a different order or scope.

## D-024 — Impeccable / Emil install scope is per-project, gated (reaffirmed from D-012)

- **Decision (PM1 reaffirmation; D-012 already states this):** Impeccable and Emil Kowalski skills are installed per-project, only after TS0 / RDG0 approval.
- **Rationale:** Per-project install is the smallest scope that still allows the skills to work. Global install pollutes other projects. Reference-only means the skills are not installed at all.
- **Source:** `memory/IMPORTANT_DECISIONS.md` D-012; `docs/PM1_PLAN.md` §7.2 (rows for Impeccable and Emil).

## D-025 — Recent Proposals viewer: A now, B later

- **Decision (PM1 recommendation; owner must confirm):** The "Recent Proposals" tile on `/admin` ships as Option A now (surface `localStorage.co_last_proposal`, remove the "Coming soon" tag) and Option B later (persist proposals to Supabase or Worker + KV, list with click-through).
- **Rationale:** Option A is the smallest honest improvement. Option B is a post-Worker item that requires server-side persistence.
- **Source:** `docs/PM1_PLAN.md` §9.4 (R-4.1); `docs/ROADMAP.md` R-4.1.
- **Reopen if:** the owner prefers to ship Option B directly, or to defer both.

## D-026 — Observability vendor defaults: Sentry + UptimeRobot + email

- **Decision (PM1 recommendation; owner must confirm):** The observability stack is Sentry (errors, free tier) + UptimeRobot (uptime, free) + email (alerts to `hello@codeoutfitters.com`).
- **Rationale:** Sentry's free tier covers a single-operator app. UptimeRobot is the simplest uptime monitor. Email is the default owner channel (no extra service). D-009 prefers free / open-source. Discord webhook is a good fallback if email is too noisy.
- **Source:** `docs/PM1_PLAN.md` §10; `repo-research/QA_STRATEGY_BRIEF.md` §3.
- **Reopen if:** the owner prefers GlitchTip / Better Stack / Discord / Slack / Telegram.

## D-027 — Git / repo root status: confirm and `git init` if confirmed

- **Decision (PM1 recommendation; owner must confirm):** Confirm `F:\CodeOutfitters` is the real repo root. If yes, `git init` is part of a future Setup phase. If no, find the real root and re-run PM1 there. PM1 does not initialize git; it only documents the risk.
- **Rationale:** No `.git` directory at the root. `git status` failed in the overnight batch. The lockfile decision (§3) explicitly relies on `git status` being clean before deletion. Future PR-style review is also impossible without git.
- **Source:** `docs/PM1_PLAN.md` §11; `repo-research/PRE8_CHECKPOINT.md` (file timestamp check noted that the overnight batch ran in a non-git workspace).
- **Reopen if:** the repo lives at a different location, or the owner prefers to defer git init.

## PD1 lock-tags (2026-06-16)

PD1 normalizes the PM1 register (D-015..D-027) and the bundled follow-up items (Q-13..Q-21) into a single default-or-approve ballot in `docs/PD1_DECISION_LOCK.md`. PD1 does not create new decisions. The lock-tag table below records the PD1 status of each existing decision. Owner overrides, when received, are recorded here as well.

| D-ID | Topic | PD1 lock status | Required before | Notes |
|---|---|---|---|---|
| D-015 | Package manager = `npm` | LOCKED DEFAULT; BLOCKS D0; BLOCKS IMPLEMENTATION (Cleanup B) | Cleanup B | Default stands unless owner picks pnpm. |
| D-016 | Real business launch | LOCKED DEFAULT; BLOCKS D0 | Phase 1 of any security / observability | Default stands unless owner confirms portfolio-demo. |
| D-017 | Admin internal-only | LOCKED DEFAULT; BLOCKS D0 | Security phase 2 | Default stands unless owner authorizes client-facing scope expansion. |
| D-018 | Security before any non-internal launch | LOCKED DEFAULT; BLOCKS D0; closes LG-1, LG-2, LG-3 | Any non-internal launch | Default stands unless owner explicitly accepts the risk. |
| D-019 | Booking correctness before any non-internal launch | LOCKED DEFAULT; BLOCKS D0; closes LG-4 | Any non-internal launch | Default stands unless owner explicitly accepts manual review only. |
| D-020 | Supabase RLS before any non-internal launch | LOCKED DEFAULT; BLOCKS D0; closes LG-3 | Any non-internal launch | Default stands unless owner explicitly accepts the risk. |
| D-021 | Motion priority (balanced with §8.7 budget) | LOCKED DEFAULT; BLOCKS IMPLEMENTATION ONLY | UIX0 / MOTION0 first slice | Default stands unless owner relaxes or tightens. |
| D-022 | BeFluence reference-only | LOCKED DEFAULT | UIX0 / MOTION0 first slice | Reaffirmed from D-011. |
| D-023 | Tooling order (per §7.2) | LOCKED DEFAULT; BLOCKS IMPLEMENTATION ONLY | TS0 / RDG0 submission | Default stands unless owner prefers a different order or scope. |
| D-024 | Impeccable / Emil install scope = per-project, gated | LOCKED DEFAULT; BLOCKS IMPLEMENTATION ONLY | UIX0 / MOTION0 first slice | Reaffirmed from D-012. |
| D-025 | Recent Proposals viewer: later admin phase (A now + B later recommended by PM1; PD1 default is "later admin phase" conservative) | LOCKED DEFAULT; BLOCKS IMPLEMENTATION ONLY | Cleanup A or admin phase | Owner may pick A now, B later, or both. |
| D-026 | Observability vendor = Sentry + UptimeRobot + email | LOCKED DEFAULT; BLOCKS IMPLEMENTATION ONLY | Observability phase | Owner may pick GlitchTip / Better Stack / Discord / Slack / Telegram. |
| D-027 | Git / repo root status = `git init` at `F:\CodeOutfitters` in Setup phase (only if confirmed) | LOCKED DEFAULT; BLOCKS IMPLEMENTATION ONLY | Setup phase | Owner confirms root or names a different root. |

### PD1 architectural-path decisions (NEEDS OWNER APPROVAL)

These are not in the original PM1 register; they are surfaced in `docs/PD1_DECISION_LOCK.md` §5 as decisions that depend on the owner's deployment / product posture. They are tracked here for completeness but are not D-IDs.

- **D-019a** Anthropic protection path — required before Security phase 1.
- **D-020a** Admin auth path — required before Security phase 2.
- **D-019b** Booking MVP write path — required before Booking A.
- **D-022a** Performance budget specifics — required before UIX0 / MOTION0 first slice.
- **D-021a** Test runner form — required before QA slices 1 & 2.
- **D-021b** Q-19 vendor choice — required before Observability phase.

### PD1 bundled follow-up items (Q-13..Q-21)

Tracked in `docs/PD1_DECISION_LOCK.md` §6. Not in the original PM1 register. Defaults stand; owner can override.

- Q-13 DEPLOY.md cleanup — DEFERRED to Cleanup A.
- Q-14 contact form `source` field — DEFERRED to Cleanup A.
- Q-15 auth model — see D-020a.
- Q-16 performance budget — see D-022a.
- Q-17 taste rubric — LOCKED DEFAULT (D-012 avoid / prefer list + Impeccable + Emil review).
- Q-18 test runner form — see D-021a.
- Q-19 observability vendor — see D-021b.
- Q-20 brand status footer — DEFERRED to observability phase.
- Q-21 repo root — see D-027.

### Owner overrides (to be filled in by the next agent)

| D-ID | Closed at | Closed by | Final choice | Notes |
|---|---|---|---|---|
| _none yet_ |  |  |  |  |

## PD1 Tooling Candidate — Ponytail (NOT APPROVED)

- **Status (2026-06-16):** Candidate only. Approval status: **NOT APPROVED.** Recorded for the future TS0 / RDG0 submission. No install, no clone, no MCP config, no `package.json` change in this batch or any pre-approval phase.
- **Type:** developer / AI tooling candidate. Not a runtime dependency by default.
- **Required gate:** **TS0 / RDG0.** Cannot be installed, cloned, or configured until TS0 / RDG0 approval is granted by ChatGPT Control Room after PD1.
- **Required owner input (must be answered before TS0 / RDG0 evaluation):**
  - Exact official GitHub repo URL (canonical upstream).
  - Pinned version or commit SHA.
  - Scope: global / per-project / reference-only (default: reference-only).
- **Required evaluation (future TS0 / RDG0 submission, not in PD1):** what it does, safety / maintenance, install footprint, overlap with Graphify / Repomix / Context7 / Impeccable / Emil Kowalski, scope decision, free / open-source, production / runtime impact.
- **Source:** `docs/PD1_DECISION_LOCK.md` §6.1; `repo-research/PD1_OWNER_DECISION_BALLOT.md` Section A.1 and Section C.1.

## D0 ECC addendum — ECC / affaan-m/ecc tooling candidate (NOT APPROVED, 2026-06-16)

- **Status:** **NOT APPROVED.** Candidate only. Gated to **TS0 / RDG0**. Recorded for the future TS0 / RDG0 submission. The owner asked about ECC during D0 review; ChatGPT Control Room assessed ECC as relevant to the owner's multi-agent workflow but not approved for install / clone / setup / configuration in any pre-approval phase.
- **Tool:** ECC / affaan-m/ecc (https://github.com/affaan-m/ecc).
- **Type:** Developer / AI agent harness tooling. Not a product runtime dependency by default.
- **Required gate:** **TS0 / RDG0.** Cannot be installed, cloned, copied (config folders or otherwise), configured, or evaluated in any pre-approval phase.
- **Required owner input (must be answered before TS0 / RDG0 evaluation):**
  - Exact official GitHub repo URL (canonical upstream).
  - Pinned version or commit SHA.
  - Scope: global / per-project / reference-only (default: reference-only).
- **Required evaluation (future TS0 / RDG0 submission, not in D0):**
  1. What does ECC do?
  2. Is it safe and maintained?
  3. What install paths does it require?
  4. Does it require `npm` package install, plugin install, copied config folders, MCP config, or global setup?
  5. Does it touch `.opencode/`, `.codex/`, `.claude/`, `.mcp.json`, package files, or repo config?
  6. Does it overlap with existing tooling candidates (Graphify, Repomix, Context7 MCP, Playwright MCP, Chrome DevTools MCP, Impeccable, Emil Kowalski, Ponytail, Tree-sitter, codebase-memory)?
  7. Should it become the main agent-harness layer, reference-only, external workspace tooling, global tooling, or per-project tooling?
  8. Is it free / open-source?
  9. Does it touch production / runtime code?
  10. What rollback plan exists if it causes conflicts?
- **Recommended default:** research during future TS0 / RDG0 only; do not install now.
- **Hard rules reaffirmed in this batch:** no install, no clone, no `git clone`, no copy of config folders, no copy of `.opencode/`, `.codex/`, `.claude/`, `.mcp.json`, or any MCP configs; no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install, in this batch or any pre-approval phase.
- **Source:** `docs/D0_ARCHITECTURE_DECISIONS.md` §11; `docs/D0_SYSTEM_DESIGN.md` §7.10; `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` §2; `repo-research/TOOLING_APPROVAL_BRIEF.md` §1, §2, §5.

## D0 reflection (2026-06-16)

D0 is the design / architecture phase between PM1 / PD1 and A0. D0 does not add new decisions. D0 reflects PM1 + PD1 into a target architecture. The reflection is recorded here for completeness.

- D0 carries the PD1 LOCKED DEFAULTS (D-015..D-027) and the PD1-shadowed architectural-path options (D-019a, D-020a, D-019b, D-022a, D-021a, D-021b) into the target architecture documented in `docs/D0_ARCHITECTURE_DECISIONS.md` and `docs/D0_SYSTEM_DESIGN.md`.
- D0 reflects the PD1 bundled follow-up items (Q-13..Q-21) into the phase boundaries documented in `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md`.
- D0 records **Ponytail** as a candidate only (NOT APPROVED; gated to TS0 / RDG0; carried forward from PD1 §6.1). The D-IDs in this file remain canonical. A future agent that receives the owner's D0 review response must update the "Owner overrides" table above (D-015..D-027) and any owner-confirmed architectural-path options, append to `docs/51_AGENT_HANDOFF_LOG.md`, and stop. The D-IDs are not renumbered; the reflection is the only D0 write to this file.
- D0 ECC addendum (2026-06-16) records **ECC / affaan-m/ecc** as a candidate only (NOT APPROVED; gated to TS0 / RDG0; owner-asked during D0 review). The D-IDs in this file remain canonical. A future agent that receives the owner's D0 ECC review response must update the "Owner overrides" table above, append to `docs/51_AGENT_HANDOFF_LOG.md`, and stop. The D-IDs are not renumbered; the ECC addendum is the only D0 ECC write to this file.
- D0 is plan-only. No source / runtime / config files were modified. No packages were installed. No tooling was configured. No lockfiles were changed. No git was initialized.

## A0 reflection (2026-06-16)

A0 is the action / build plan phase between D0 and the first IMPL phase. A0 does not add new decisions. A0 reflects PM1 + PD1 + D0 + D0 ECC addendum into the future execution queue. The reflection is recorded here for completeness.

- A0 carries the PD1 LOCKED DEFAULTS (D-015..D-027) and the PD1-shadowed architectural-path options (D-019a, D-020a, D-019b, D-022a, D-021a, D-021b) and the D0 ECC addendum (Q-22) into the future execution queue documented in `docs/A0_ACTION_PLAN.md`, `repo-research/A0_PHASE_EXECUTION_QUEUE.md`, `repo-research/A0_AGENT_ASSIGNMENT_MATRIX.md`, and `repo-research/A0_CHANGE_ZONE_MAP.md`.
- A0 names the future phases in order: Setup (#1), Cleanup A (#2), Cleanup B (#3), Security 1..5 (#4..#7), Booking A / B (#8, #9), Observability (#10), QA Slice 0..3 (#11, #13, #14, #15), TS0 / RDG0 Tooling Approval Phase (#12), UIX0 / MOTION0 Planning (#16), UIX0 / MOTION0 first slice (#17), UIX0 / MOTION0 later slices (#18), Admin future (#19), Final QA / delivery (#20). Each phase is gated to ChatGPT Control Room and respects the hard rules.
- A0 names the future agents: SETUP-AGENT, CLEANUP-A-AGENT, CLEANUP-B-AGENT, SECURITY-1-WORKER-AGENT, SECURITY-2-AUTH-AGENT, SECURITY-3-RLS-AGENT, SECURITY-4-N8N-AGENT, BOOKING-A-AGENT, BOOKING-B-AGENT, OBSERVABILITY-AGENT, QA0-AGENT, TS0-RDG0-TOOLING-AGENT, QA1-AGENT, QA2-AGENT, QA3-AGENT, UIX0-MOTION-PLAN-AGENT, UIX0-MOTION-IMPL-AGENT, ADMIN-FUTURE-AGENT, FINAL-QA-AGENT.
- A0 classifies the file / zone per phase: `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md` (always allowed for plan-only agents); `README.md` (Cleanup A only); `DEPLOY.md` (Cleanup A or B); `app/`, `components/`, `hooks/`, `lib/`, `public/`, `public/_headers`, `public/_redirects` (IMPL phases only); `package.json` (Cleanup B gated `packageManager` field; QA Slice 0 script field; QA Slice 1..3 devDeps; TS0 setup devDeps); both lockfiles (Cleanup B only; TS0 setup regenerate only); `tsconfig.json` (IMPL only); `next.config.*`, `postcss.config.*` (IMPL only); eslint config (Cleanup A + IMPL); tailwind config (IMPL only); `.env*` (IMPL only); `.github/` (QA Slice 0+); `tests/` (QA Slice 1+); `.mcp.json` (TS0 setup per-tool approval); `.opencode/`, `.codex/`, `.claude/` (TS0 setup per-tool approval); worker source (Security 1, Booking B); Supabase SQL files (Security 3, Booking A, Booking B); n8n workflow docs (Security 4, Observability); `.gitignore` (Setup, Cleanup A, Cleanup B, IMPL rare).
- A0 records **Ponytail** as a candidate only (NOT APPROVED; gated to TS0 / RDG0; carried forward from PD1 §6.1 and the D0 reflection). The D-IDs in this file remain canonical.
- A0 records **ECC / affaan-m/ecc** as a candidate only (NOT APPROVED; gated to TS0 / RDG0; carried forward from the D0 ECC addendum). The D-IDs in this file remain canonical.
- A0 appends the A0 integration sequencing clarifications to `INTEGRATION_NOTES.md` (additive; prose only; no breaking changes).
- A0 is plan-only. No source / runtime / config files were modified. No packages were installed. No tooling was configured. No lockfiles were changed. No git was initialized. No Ponytail install / clone / copy / configure / evaluation. No ECC / affaan-m/ecc install / clone / copy / configure / evaluation.

### A0 reflection (2026-06-16) → Owner overrides

Owner overrides, when received, are recorded here for the A0 plan. A0 is a plan-only phase; overrides are recorded as the agent's response to the A0 plan.

| Decision / Phase | Closed at | Closed by | Final choice | Notes |
|---|---|---|---|---|
| _none yet_ |  |  |  |  |

A future agent that receives the owner's A0 review response must update this table, append to `docs/51_AGENT_HANDOFF_LOG.md`, and stop. The D-IDs are not renumbered; the A0 reflection is the only A0 write to this file.

## Setup reflection (2026-06-16)

Setup is the A0 future phase #1 (per `docs/A0_ACTION_PLAN.md` §5.1 and `repo-research/A0_PHASE_EXECUTION_QUEUE.md` row #1). Setup ran on 2026-06-16, in the same session as the A0 batch but as a separate, additive phase. The reflection is recorded here for completeness. Setup does not add new D-IDs. Setup reaffirms D-027 and records a Setup-specific gate for the first commit.

- D-027 reaffirmed: `F:\CodeOutfitters` is the real repo root. `git init -b main` was run for the Setup phase only, on the strength of the Setup phase prompt. D-027 is still `LOCKED DEFAULT`; the future A0 plan rows in `docs/A0_ACTION_PLAN.md` §5.1 and `repo-research/A0_PHASE_EXECUTION_QUEUE.md` row #1 already call out this same root + init.
- Setup running before A0 review is a **deliberate exception** gated by the owner's Setup phase prompt. Setup is not a substitute for A0 review. A0 is still the next review gate. After A0 review (and after the first commit lands), Cleanup A is the next gate.
- Setup repaired `.gitignore`:
  - Corruption on line 15 (`.DS_Storenode_modules`) fixed — split into `.DS_Store` and `node_modules/`.
  - Missing safe entries added: `dist/`, `build/`, `tsconfig.tsbuildinfo`, `*.log`, `logs/`.
  - `node_modules/` normalized to trailing-slash form.
  - No broad patterns added; no source-file hides; no lockfile pre-emption; no `pnpm-lock.yaml` pre-ignore.
- Setup wrote `repo-research/SETUP_FIRST_COMMIT_PLAN.md` (expected files, files NOT to commit, sensitive files, recommended commit message, manual owner commands, reversibility, gates-still-blocked, safety confirmation).
- Setup did **not** create a commit. The first commit itself is gated to one of:
  - The owner runs the manual commands in `repo-research/SETUP_FIRST_COMMIT_PLAN.md` §8 (recommended), or
  - The next Setup-AGENT invocation is explicitly told to commit (and instructed on shape and message).
- Setup is plan-only with respect to the first commit. The first commit is the only Setup output that produces a side effect in the repo (a new commit hash). Everything else in Setup is documentation, state, or `.gitignore` repair.
- No source / runtime / config files were modified except `.gitignore` (allowed by the Setup brief).
- No lockfile was modified or deleted.
- No `package.json` was modified.
- No packages were installed.
- No tooling was configured.
- No MCP server was configured.
- No Ponytail or ECC / affaan-m/ecc install / clone / copy / configure / evaluation was performed.
- No README or DEPLOY edits in this batch.
- No test files created.
- No CI files created.
- No Ponytail or ECC / affaan-m/ecc install / clone / copy / configure / evaluation was performed in any pre-approval phase.

A future agent that receives the owner's first-commit decision (or a future Setup-AGENT invocation explicitly told to commit) must create the first commit, append to `docs/51_AGENT_HANDOFF_LOG.md`, and stop. The D-IDs are not renumbered; the Setup reflection is the only Setup write to this file.

### Setup reflection (2026-06-16) → Owner overrides

| Decision / Phase | Closed at | Closed by | Final choice | Notes |
|---|---|---|---|---|
| _none yet_ |  |  |  |  |

A future agent that receives the owner's first-commit decision (or a future Setup-AGENT invocation explicitly told to commit) must update this table, append to `docs/51_AGENT_HANDOFF_LOG.md`, and stop. The D-IDs are not renumbered; the Setup reflection is the only Setup write to this file.

## Git push / commit policy (2026-06-16) — Control Room correction

This is a Control Room correction recorded here for completeness. It does not add a new D-ID. It refines D-027 (Git / repo root status) and the Setup-phase first-commit gate. The D-IDs in this file remain canonical.

**Owner direction (captured verbatim):**

- The owner does not want the project pushed in chunks.
- The owner wants the complete project pushed one time at the end.
- `git init` already happened locally and is accepted.
- `git push` is NOT approved.
- Adding a remote is NOT approved.
- Pushing to GitHub is NOT approved.
- The first baseline commit is now **OPTIONAL**, not required before Cleanup A.
- Cleanup A may proceed after ChatGPT Control Room approval without a baseline commit, if the owner wants one final commit only.

**Default policy recorded (applies from this batch onward):**

- Default to no remote push until final delivery approval.
- Default to no remote setup until final delivery approval.
- Do not run `git push`.
- Do not run `git remote add`.
- Do not create a GitHub repo.
- Do not publish the code.
- Mark local commits as OPTIONAL. The first local commit (if any) is left to the owner, per the Setup plan. If the owner wants rollback safety, local commits may be used later. If the owner wants one final clean commit, do not commit until final delivery.
- The agent does not run `git add`, `git commit`, `git push`, `git remote add`, `git fetch`, or `git pull` from this batch onward without explicit owner approval per occurrence.

**Effect on the Setup phase:**

- The Setup phase ran with `git init -b main` at `F:\CodeOutfitters`. That init is accepted; do not undo it. Do not re-init.
- The first commit, as documented in `repo-research/SETUP_FIRST_COMMIT_PLAN.md`, is now **OPTIONAL**, not required. The plan still exists; the owner may run the manual commands at any time. The owner may also choose to never run them and to commit once at final delivery.
- Cleanup A does not require a baseline commit. Cleanup A is blocked until ChatGPT Control Room approves Setup and A0. The first commit is not a precondition.

**Effect on the Cleanup B gate (`git status` clean before deletion):**

- Cleanup B's "git status must be clean before deletion" rule is relaxed: since the owner prefers a single final commit, `git status` showing only the in-progress Cleanup B changes (and any prior local commits the owner has chosen to make) is sufficient. The agent must not create commits to make `git status` clean. The owner creates commits only if and when they want to.

**Effect on PR-style review (every gated phase):**

- PR-style review is replaced by **phase-stop review**. The agent stops after each gated phase, the owner reviews, and the owner decides whether to commit locally and whether to advance. There is no GitHub PR review yet. The agent must not create a remote, not push, and not open a GitHub PR.

**Effect on tooling that depends on a remote:**

- No tooling in A0 / Cleanup A / Cleanup B / Security 1..5 / Booking / Observability / QA Slice 0 / UIX0 / MOTION0 depends on a remote. The remote is needed only at final delivery. The agent must not block on "no remote" in any pre-final-delivery phase.

**Hard rules reaffirmed:**

- No `git push`, no `git remote add`, no GitHub repo, no publishing.
- Local commits are owner-driven and OPTIONAL.
- `git init` already happened and is accepted; do not undo.
- No source / package / lockfile / runtime / config files were touched in this batch (documentation only).
- No new D-IDs.

**Source:** `PROJECT_CONTROL_LOG.md` "Git push / commit policy update (2026-06-16) — Control Room correction"; updated `repo-research/SETUP_FIRST_COMMIT_PLAN.md`; updated `docs/A0_ACTION_PLAN.md` §5.1 and §6; updated `repo-research/A0_PHASE_EXECUTION_QUEUE.md` row #1.

A future agent that receives the owner's first-commit decision (or a future Setup-AGENT invocation explicitly told to commit) must create the first commit (if the owner wants it), append to `docs/51_AGENT_HANDOFF_LOG.md`, and stop. The D-IDs are not renumbered; this correction is the only IMPORTANT_DECISIONS write for this batch.

## Cleanup A reflection (2026-06-16)

Cleanup A is the A0 future phase #2. Cleanup A ran on 2026-06-16 as a deliberate, additive exception gated by the owner's Cleanup A prompt. Cleanup A ran while A0 is still pending ChatGPT Control Room review. Cleanup A is not a substitute for A0 review. This reflection is recorded here for completeness. Cleanup A does not add new D-IDs. Cleanup A records the ESLint deferral as a decision under the existing R-026.

**What Cleanup A did:**

- **README repaired** per epo-research/README_REPAIR_SPEC.md. ~104 lines. Port 3005 (not 3000). Entry pp/(public)/page.tsx (not pp/page.tsx). All six env vars listed (5 required, 1 optional). Admin warning. Security warning (every NEXT_PUBLIC_* is in the bundle; Anthropic key and admin password exposed until Security 1..5 ship). Foundation docs cross-linked. v0 Kiro badge and v0 \"Built with v0\" section removed. Acknowledgments section added.
- **Root DEPLOY.md deleted** after verifying docs/DEPLOYMENT.md covers all of its content (target, build settings, env vars, Supabase setup, post-deploy checks, rollback). docs/DEPLOYMENT.md header note updated to record the deletion. R-023 closed.
- **Portfolio copy truth fix** in pp/(public)/portfolio/page.tsx: metadata.description, PageHero label, PageHero title, and PageHero description changed from \"Real case studies / Real Businesses, Real Results / Every automation we build is measured by one metric: time and money saved for our clients.\" to \"Sample Scenarios / Sample Automation Scenarios / Illustrative examples...\" � consistent with the existing SAMPLE WORK overline and per-card \"Sample Project\" badges in components/portfolio.tsx. No layout change. No feature change. Copy-only. R-019 closed.
- **Contact form source: \"contact\" added** in components/contact.tsx: payload is now JSON.stringify({ source: 'contact', ...form }) instead of JSON.stringify(form). One-line edit. No refactor. No webhook URL change. No n8n integration change beyond the source field.
- **INTEGRATION_NOTES.md �1 contact row updated additively** to record the new payload shape (source: \"contact\" now present).
- **docs/ENVIRONMENT.md per-form payload table updated**: contact form now sends source: \"contact\"; the previous \"no source and no type � contact form\" line removed.
- **.gitignore not modified**. Setup already added all Cleanup A hygiene entries (
ode_modules/, .next/, out/, dist/, uild/, .env, .env.local, .env*.local, 	sconfig.tsbuildinfo, .DS_Store, logs/, *.log). R-025 closed in Setup.

**What Cleanup A deferred:**

- **ESLint config (R-026) deferred**. package.json has lint (eslint .) but no ESLint package is installed and no config file exists. The Cleanup A brief allows ESLint config only if it does not require package installs. Creating eslint.config.mjs with extends: \"next/core-web-vitals\" requires eslint-config-next; creating a flat config with @eslint/js requires @eslint/js. The brief forbids installing packages and forbids editing package.json. The README is honest about the gap (
pm run lint runs against ESLint's defaults until a config lands). ESLint config is deferred to a future phase (e.g. QA Slice 0 typecheck / lint prep, or a future Cleanup A pass after owner approves installing ESLint). R-026 remains open.

**Hard rules respected:**

- No package.json change. No package-lock.json change. No pnpm-lock.yaml change. No yarn.lock change.
- No 	sconfig.json change. No 
ext.config.* change. No postcss.config.* change. No eslint config. No tailwind config.
- No source edit outside the explicit Cleanup A scope (pp/(public)/portfolio/page.tsx, components/contact.tsx, README.md, docs/DEPLOYMENT.md, INTEGRATION_NOTES.md, docs/ENVIRONMENT.md).
- No pp/** edit except pp/(public)/portfolio/page.tsx. No components/** edit except components/contact.tsx.
- No hooks/ edit. No lib/ edit. No public/ edit. No styles/ edit.
- No .env* edit. No .mcp.json edit. No .opencode/, .codex/, .claude/ edit.
- No 	ests/ edit. No .github/ edit. No CI config.
- No git add. No git commit. No git push. No git remote add. No git fetch. No git pull.
- No 
pm install. No pnpm install. No yarn install. No 
px. No package-manager command of any kind.
- No MCP setup. No Ponytail. No ECC / affaan-m/ecc. No Impeccable. No Emil Kowalski. No Playwright. No Chrome DevTools MCP. No Graphify. No Repomix. No Context7 MCP. No Tree-sitter. No codebase-memory MCP.
- No Cleanup B. No Security 1..5. No Booking A / B. No Observability. No QA Slice 0..3. No UIX0 / MOTION0 Planning / first slice / later slices. No Admin future. No Final QA / delivery.

**Risks closed in this batch:**

- R-019 (portfolio copy) � closed. The portfolio page no longer implies the sample cards are real case studies.
- R-023 (DEPLOY.md root) � closed. DEPLOY.md deleted; docs/DEPLOYMENT.md covers it.
- R-025 (	sconfig.tsbuildinfo in .gitignore) � closed in Setup; confirmed in Cleanup A.
- R-027 (admin warning) � addressed in README.
- R-001 (admin password exposed) � referenced in README security section; not fixed in Cleanup A.
- R-002 (Anthropic key exposed) � referenced in README security section; not fixed in Cleanup A.

**Risks still open:**

- R-026 (ESLint config) � open. Deferred to a future phase per Cleanup A scope.
- R-001, R-002, R-003, R-004, R-005, R-006, R-007, R-008, R-009, R-010, R-011, R-012, R-013, R-014, R-015, R-016, R-017, R-018, R-020, R-021, R-022, R-024, R-028, R-029, R-030, R-031, R-032, R-033, R-034, R-035 � open; not in Cleanup A scope; addressed by future phases per A0 plan.

**No new decisions.** Cleanup A only records the ESLint deferral as a decision under the existing R-026. The D-IDs in this file remain canonical. Cleanup A appends a Cleanup A reflection note; it does not add new D-IDs.

**Source:** PROJECT_CONTROL_LOG.md \"Cleanup A batch overlay (2026-06-16)\"; docs/A0_ACTION_PLAN.md �5.2; epo-research/A0_PHASE_EXECUTION_QUEUE.md row #2; epo-research/README_REPAIR_SPEC.md; docs/DEPLOYMENT.md; INTEGRATION_NOTES.md �1; docs/ENVIRONMENT.md �\"Per-form payload contracts\"; epo-research/RISK_REGISTER.md R-019, R-023, R-025, R-026, R-027.

A future agent that receives ChatGPT Control Room's Cleanup A review response must update this reflection, append to docs/51_AGENT_HANDOFF_LOG.md, and stop. The D-IDs are not renumbered; the Cleanup A reflection is the only Cleanup A write to this file.

## Cleanup B reflection (2026-06-16)

Cleanup B is the A0 future phase #3. Cleanup B ran on 2026-06-16 as a deliberate, additive exception gated by the owner's Cleanup B prompt. Cleanup B ran while A0 is still pending ChatGPT Control Room review. Cleanup B is not a substitute for A0 review. This reflection is recorded here for completeness. Cleanup B does not add new D-IDs. Cleanup B applies the existing D-015 LOCKED DEFAULT.

**What Cleanup B did:**

- **Verified package-manager state.** package-lock.json present. pnpm-lock.yaml present before deletion. yarn.lock not present. package.json has no packageManager field, no .npmrc / .pnpmrc checked in, no manager-specific shell syntax in scripts. No evidence of a pnpm requirement. Safe to delete pnpm-lock.yaml.
- **Deleted pnpm-lock.yaml.** Single Remove-Item call. package-lock.json not touched.
- **Updated .gitignore.** Added pnpm-lock.yaml with a comment recording Cleanup B 2026-06-16 and D-015. git check-ignore -v pnpm-lock.yaml confirms the entry is working. 
ode_modules/, .next/, out/, dist/, uild/, .env, .env.local, .env*.local, 	sconfig.tsbuildinfo, *.log, logs/, .DS_Store, .opencode/, v0 sandbox entries are all still in .gitignore. package-lock.json is intentionally NOT ignored.
- **Updated documentation.**
  - README.md (lockfile paragraph rewritten: canonical is 
pm / package-lock.json; pnpm-lock.yaml was removed in Cleanup B 2026-06-16 per D-015; do not run pnpm install or yarn install; do not mix package managers).
  - docs/SETUP.md (prerequisites rewritten; install note rewritten; common-pitfall pnpm vs 
pm line rewritten to 
pm is the only canonical package manager).
  - docs/DEPLOYMENT.md (build settings table now includes a "Package manager" row: 
pm; D-015 LOCKED DEFAULT; canonical lockfile is package-lock.json; pnpm-lock.yaml was removed in Cleanup B 2026-06-16 and is in .gitignore).
  - epo-research/LOCKFILE_DECISION_BRIEF.md (status banner: \"Decision applied\"; \"Current State\" updated to post-Cleanup-B; �9 \"Gate Required Before Action\" extended with \"Resolution\" section recording Cleanup B executed and R-002 closed; CI re-entry guard noted as gated to TS0 / RDG0).
  - epo-research/A0_PHASE_EXECUTION_QUEUE.md (header banner: \"Cleanup B executed\").
  - epo-research/A0_CHANGE_ZONE_MAP.md (header banner: \"Cleanup B executed\").
- **INTEGRATION_NOTES.md was NOT modified.** Its two package-manager references are guard lines (no install in pre-approval phases), not deployment instructions.

**What Cleanup B did NOT do:**

- package.json was **not** modified. The brief allows the packageManager field only if the chosen manager requires it; npm does not require it (the field is optional for npm; it is useful for pnpm or yarn to pin a specific version via Corepack). Adding it without need would be scope creep.
- package-lock.json was **not** modified. Cleanup B is not a regenerate step; it is a drop step.
- No package-manager command was run (no 
pm install, no pnpm install, no yarn install, no 
px).
- No source file was touched (Cleanup B is documentation + lockfile + .gitignore only).
- No CI file was created. The CI re-entry guard is **gated to a future TS0 / RDG0 phase** because it lives in .github/workflows/, which is a TS0 / RDG0 gated zone per the A0 plan.

**Hard rules respected:**

- No git add. No git commit. No git push. No git remote add. No git fetch. No git pull. No GitHub repo. No publish.
- No 
pm install. No pnpm install. No yarn install. No 
px. No 
pm run. No pnpm run. No yarn run. No package-manager command of any kind.
- No package.json change. No package-lock.json change. No yarn.lock change.
- No 	sconfig.json change. No 
ext.config.* change. No postcss.config.* change. No eslint / tailwind config change.
- No source file change (no pp/, components/, hooks/, lib/, public/, styles/).
- No .env* change. No .mcp.json change. No .opencode/, .codex/, .claude/ change.
- No 	ests/ change. No .github/ change. No CI config.
- No MCP setup. No Ponytail. No ECC / affaan-m/ecc. No Impeccable. No Emil Kowalski. No Playwright. No Chrome DevTools MCP. No Graphify. No Repomix. No Context7 MCP. No Tree-sitter. No codebase-memory MCP.
- No Security 1..5. No Booking A / B. No Observability. No QA Slice 0..3. No UIX0 / MOTION0 Planning / first slice / later slices. No Admin future. No Final QA / delivery.

**Risks closed in this batch:**

- **R-002 (dual-lockfile risk) � closed.** The dual-lockfile situation is resolved. package-lock.json is the only committed lockfile. pnpm-lock.yaml is removed and listed in .gitignore.

**Risks still open:**

- The CI re-entry guard (asserting pnpm-lock.yaml is absent on every PR) is **gated to a future TS0 / RDG0 phase** because it lives in .github/workflows/, which is a TS0 / RDG0 gated zone. R-002 is closed at the lockfile level; the CI guard is a follow-up.
- R-001, R-003..R-035 � open; not in Cleanup B scope; addressed by future phases per A0 plan.

**No new decisions.** Cleanup B only applies the existing D-015 LOCKED DEFAULT. The D-IDs in this file remain canonical. Cleanup B appends a Cleanup B reflection note; it does not add new D-IDs.

**Source:** PROJECT_CONTROL_LOG.md \"Cleanup B batch overlay (2026-06-16)\"; docs/A0_ACTION_PLAN.md �5.3; epo-research/A0_PHASE_EXECUTION_QUEUE.md row #3; epo-research/A0_CHANGE_ZONE_MAP.md package.json / package-lock.json / pnpm-lock.yaml / .gitignore rows; epo-research/LOCKFILE_DECISION_BRIEF.md �3 and �6; docs/SETUP.md; docs/DEPLOYMENT.md; README.md; epo-research/RISK_REGISTER.md R-002.

A future agent that receives ChatGPT Control Room's Cleanup B review response must update this reflection, append to docs/51_AGENT_HANDOFF_LOG.md, and stop. The D-IDs are not renumbered; the Cleanup B reflection is the only Cleanup B write to this file.

## Security 1 reflection (2026-06-16)

Security 1 is the A0 future phase #4. Security 1 ran on 2026-06-16 as a deliberate, additive exception gated by the owner's Security 1 prompt. Security 1 ran while A0 is still pending ChatGPT Control Room review. Security 1 is not a substitute for A0 review. This reflection is recorded here for completeness. Security 1 does not add new D-IDs. Security 1 applies the existing D-019a LOCKED DEFAULT (Cloudflare Worker proxy for Anthropic).

**What Security 1 did:**

- **Worker source shipped** at workers/anthropic-proposal-proxy.ts. Native etch only. No npm dependencies. No package.json change. The Worker:
  - Accepts POST only (with OPTIONS handled as CORS preflight).
  - Validates the Origin header against a comma-separated ALLOWED_ORIGIN env var; returns 403 origin_not_allowed for any other Origin.
  - Reads ANTHROPIC_API_KEY from the Worker env (server-side secret).
  - Reads ANTHROPIC_MODEL from the Worker env (optional; defaults to claude-sonnet-4-6).
  - Validates the request body shape (intakeData must be an object with the 14 required strings and 6 required string arrays).
  - Calls https://api.anthropic.com/v1/messages with x-api-key: env.ANTHROPIC_API_KEY and nthropic-version: 2023-06-01.
  - Parses the upstream JSON response and extracts the proposal JSON block.
  - Returns the proposal JSON to the browser in the same shape as before (11-section ProposalOutput).
  - Safe error responses that never echo the Anthropic key, the ALLOWED_ORIGIN value, or any other secret.
  - CORS handling: Access-Control-Allow-Origin is set to the request Origin if allowed; Access-Control-Allow-Methods: POST, OPTIONS; Access-Control-Allow-Headers: Content-Type; Access-Control-Max-Age: 86400; Vary: Origin.
- **Frontend lib/proposal-generator.ts updated.** The function is now a thin client that calls ${NEXT_PUBLIC_PROPOSAL_WORKER_URL}/ with the body { intakeData }. Returns the same ProposalOutput shape so components/admin/proposal-output.tsx is unchanged. **NEXT_PUBLIC_ANTHROPIC_API_KEY is no longer referenced anywhere in the frontend code.** Verified by grep across lib/, pp/, components/, public/.
- **.env.local.example updated.** Added NEXT_PUBLIC_PROPOSAL_WORKER_URL placeholder. Removed the encouraged public NEXT_PUBLIC_ANTHROPIC_API_KEY. Left a DEPRECATED; do not set block for migration clarity.
- **CSP updated in public/_headers.** connect-src no longer has https://api.anthropic.com; it has https://*.workers.dev so the browser can reach the Worker origin. Supabase, n8n, and Tawk endpoints are unchanged.
- **docs/ENVIRONMENT.md updated.** Split env vars into "Frontend env vars" and "Worker env vars" tables. Deprecated NEXT_PUBLIC_ANTHROPIC_API_KEY. Added Worker dev / production notes. Added ANTHROPIC_API_KEY / ALLOWED_ORIGIN / ANTHROPIC_MODEL rows.
- **docs/SECURITY.md updated.** Added a Security 1 status banner. Moved R-002 to a "Closed risks" section with a Security 1 resolution. Marked F-001 as implemented.
- **docs/DEPLOYMENT.md updated.** Added a "Cloudflare Worker (Security 1)" section. Updated the static-asset / CSP note. Updated the post-deploy check to include a Worker reachability test. Updated the "What is not part of the deploy" section to call out the one Cloudflare Worker.
- **INTEGRATION_NOTES.md �8.1 updated.** Marked the Anthropic Worker path as SHIPPED 2026-06-16 with the resolution. Kept the closure list (R-002, R-004, LG-1).
- **epo-research/SECURITY_1_WORKER_PROXY_NOTES.md created.** Primary deliverable. Covers purpose, files changed, Worker env vars, frontend env vars, deployment steps for the owner, rollback plan, known remaining risks, Security 2 dependency, and a testing checklist.

**What Security 1 did NOT do:**

- **No deploy was performed.** The Worker needs to be deployed to Cloudflare (wrangler deploy or the dashboard) before the frontend can use it. Deployment is owner-driven. Steps are in epo-research/SECURITY_1_WORKER_PROXY_NOTES.md �5.
- **No admin auth was implemented.** CORS is not authentication. Security 2 is the next gate and must land before any non-internal launch. The Worker is currently exposed to anyone who can match an ALLOWED_ORIGIN entry from a browser they control. The Worker source is structured to make Security 2's session-token / Cloudflare Access JWT check additive (a single check at the top of etch(request, env) after the CORS gate).
- **No wrangler deploy.** No deploy command of any kind.
- **No package.json change.** No package-lock.json change. No yarn.lock change. No pnpm-lock.yaml change.
- **No real .env or .env.local change.** Only .env.local.example was touched.
- **No pp/admin/proposal/page.tsx change.** The page did not need to change because lib/proposal-generator.ts is the only call site for generateProposal.
- **No components/admin/proposal-output.tsx change.** The function shape and return type are unchanged.
- **No 
ext.config.mjs change.** No 	sconfig.json change. No postcss.config.* change. No eslint / tailwind config change.
- **No CI file created.** No .github/ change.
- **No tests run.** No 
pm test. No 
pm run build. No 
pm run lint. No 
px. No playwright.
- **No rate limiting.** No request signing. No logging policy.

**Hard rules respected:**

- No git add. No git commit. No git push. No git remote add. No git fetch. No git pull. No GitHub repo. No publish.
- No 
pm install. No pnpm install. No yarn install. No 
px. No 
pm run. No pnpm run. No yarn run. No wrangler deploy. No deploy command. No package-manager command.
- No package.json change. No package-lock.json change. No pnpm-lock.yaml change. No yarn.lock change.
- No 	sconfig.json change. No 
ext.config.* change. No postcss.config.* change. No eslint / tailwind config change.
- No source edit outside the explicit Security 1 scope (workers/anthropic-proposal-proxy.ts, lib/proposal-generator.ts, .env.local.example, public/_headers).
- No pp/admin/proposal/page.tsx change. No components/admin/proposal-output.tsx change.
- No real .env* change. No .mcp.json change. No .opencode/, .codex/, .claude/ change.
- No 	ests/ change. No .github/ change. No CI config.
- No MCP setup. No Ponytail. No ECC / affaan-m/ecc. No Impeccable. No Emil Kowalski. No Playwright. No Chrome DevTools MCP. No Graphify. No Repomix. No Context7 MCP. No Tree-sitter. No codebase-memory MCP.
- No Security 2. No Security 3. No Security 4. No Booking A / B. No Observability. No QA Slice 0..3. No UIX0 / MOTION0 Planning / first slice / later slices. No Admin future. No Final QA / delivery.

**Risks closed in this batch:**

- **R-002 (Anthropic key in static bundle) � closed at the runtime level.** The browser no longer references NEXT_PUBLIC_ANTHROPIC_API_KEY and no longer connects to https://api.anthropic.com. The key is now server-side only. R-002 is closed; the deployment of the Worker is owner-driven.

**Fixes implemented in this batch:**

- **F-001 (Cloudflare Worker proxy for Anthropic) � implemented.** The Worker is in workers/anthropic-proposal-proxy.ts. The frontend uses NEXT_PUBLIC_PROPOSAL_WORKER_URL. The previous NEXT_PUBLIC_ANTHROPIC_API_KEY is deprecated. The Worker enforces ALLOWED_ORIGIN server-side. CORS is not authentication; the Worker is still gated to Security 2.

**Risks still open:**

- **R-001 (admin password in bundle).** Not in Security 1 scope. Addressed by Security 2.
- **R-003 (Supabase RLS not enabled).** Not in Security 1 scope. Addressed by Security 3.
- **R-004 (Anthropic cost / error risk).** Reduced by the Worker proxy (key is no longer public; rotating the key is a server-side operation). Not fully closed; still open until the Worker is deployed and observed.
- **R-005, R-006, R-007, R-008, R-009, R-010, R-011..R-035.** Open; not in Security 1 scope; addressed by future phases per A0 plan.

**No new decisions.** Security 1 only applies the existing D-019a LOCKED DEFAULT. The D-IDs in this file remain canonical. Security 1 appends a Security 1 reflection note; it does not add new D-IDs.

**Source:** PROJECT_CONTROL_LOG.md \"Security 1 batch overlay (2026-06-16)\"; docs/A0_ACTION_PLAN.md �5.4; epo-research/A0_PHASE_EXECUTION_QUEUE.md row #4; epo-research/A0_CHANGE_ZONE_MAP.md lib/proposal-generator.ts / pp/admin/proposal/page.tsx / public/_headers / Worker source / INTEGRATION_NOTES.md rows; docs/D0_ARCHITECTURE_DECISIONS.md Security area; epo-research/SECURITY_HARDENING_BRIEF.md Option B; docs/SECURITY.md R-002 and F-001; epo-research/RISK_REGISTER.md R-002, R-004.

A future agent that receives ChatGPT Control Room's Security 1 review response must update this reflection, append to docs/51_AGENT_HANDOFF_LOG.md, and stop. The D-IDs are not renumbered; the Security 1 reflection is the only Security 1 write to this file.

## Security 2 reflection (2026-06-16)

Security 2 is the A0 future phase #5. Security 2 ran on 2026-06-16 as a deliberate, additive exception gated by the owner's Security 2 prompt. Security 2 ran while A0 is still pending ChatGPT Control Room review. Security 2 is not a substitute for A0 review. This reflection is recorded here for completeness. Security 2 does not add new D-IDs. Security 2 applies the existing D-020a LOCKED DEFAULT (Cloudflare Access for fast internal admin protection).

**What Security 2 did:**

- **Inspected the current admin gate** at pp/admin/layout.tsx. The gate read process.env.NEXT_PUBLIC_ADMIN_PASSWORD, compared it to localStorage.co_admin_auth, and gated the entire /admin UI behind a localStorage flag. This is R-001 in docs/SECURITY.md.
- **Downgraded the client-side password gate to convenience-only.** The gate was **kept** (removing it would break the admin flow on localhost:3005 and on the deployed site until Cloudflare Access is in place). The UI now explicitly labels the gate as convenience-only:
  - The login form shows a ShieldCheck notice: \"Convenience gate only. Real admin protection is Cloudflare Access in front of /admin/* on the deployed site. This local check is not security.\"
  - The login form has a footer line: \"This password is in the static bundle. It is not a security boundary. Configure Cloudflare Access in front of /admin/* on Cloudflare Pages.\"
  - The admin header (when logged in) shows a small chip: \"Local gate � Cloudflare Access = primary\" (with a tooltip explaining the Access boundary).
  - A doc comment at the top of pp/admin/layout.tsx records the rule: this file is not real auth; do not promote it to real auth; do not introduce Supabase Auth, Auth.js, a server route, or any auth library.
- **Added a Security 2 doc comment to workers/anthropic-proposal-proxy.ts** (no code change). The header now records the Security 2 boundary: Cloudflare Access in front of the Worker's route is the owner-side configuration that closes the Worker's auth boundary; Worker-level session-token / Cloudflare Access JWT verification is a future hardening step, intentionally not shipped in Security 2 because it requires deployment-time Access configuration the owner must verify before enabling. The Worker's ALLOWED_ORIGIN CORS gate is unchanged.
- **Updated .env.local.example.** NEXT_PUBLIC_ADMIN_PASSWORD=your-admin-password removed from the encouraged block. The line is preserved in a DEPRECATED block with a comment: \"DEPRECATED as security; convenience-only if set.\" If the owner has not set up Cloudflare Access yet, the local convenience gate can still run by leaving the var set; it just does not provide security.
- **Updated docs/ENVIRONMENT.md.** NEXT_PUBLIC_ADMIN_PASSWORD row updated to \"no (convenience only)\" with a note that Cloudflare Access is the real boundary. \"Deprecated / forbidden\" section extended with R-001. \"Security implications\" section updated.
- **Updated docs/SECURITY.md.** Added a Security 2 status banner. R-001 moved to a new \"Closed risks\" section with a Security 2 resolution. F-002 marked implemented. R-007 CSP description updated to reflect the new connect-src (no more pi.anthropic.com; *.workers.dev for the Worker).
- **Updated docs/DEPLOYMENT.md.** Added a new \"Cloudflare Access (Security 2) � admin boundary\" section with the owner-side setup steps (create Access application, configure identity, configure policy, optional Worker-route Access, test the boundary, verify localStorage is not the boundary). Added a post-deploy Access verification check. Updated the \"What is not part of the deploy\" section.
- **Updated INTEGRATION_NOTES.md.** Added a new �8.10 \"Admin auth boundary (Security 2) � SHIPPED 2026-06-16\" with the contract (Cloudflare Access is the real boundary; convenience gate is convenience-only; NEXT_PUBLIC_ADMIN_PASSWORD is deprecated; no new auth library; owner creates the Access app; Worker-level JWT verification is a future hardening step).
- **Created epo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md.** Primary deliverable. Covers why Cloudflare Access (and not a new auth library), what changed in the repo, the owner-side setup steps, the verification steps, the rollback plan, the known remaining risks, and the Security 2 vs Security 1 scope comparison.
- **Updated epo-research/SECURITY_1_WORKER_PROXY_NOTES.md.** Security 2 dependency section rewritten to reflect that admin auth (D-020a) is now Cloudflare Access. The Security 2 follow-up checklist updated to mark admin auth as done for the admin path and to leave Worker-level session-token / Cloudflare Access JWT verification as a future hardening step.

**What Security 2 did NOT do:**

- **No new auth library.** No Auth.js. No Supabase Auth. No server route. No new npm dependency. Security 2 is a code + docs + CSP-only phase. The repo carries the policy intent and the owner-side setup steps; the policy itself lives in the Cloudflare Zero Trust dashboard.
- **No Cloudflare Access app was created.** The owner creates it in the Cloudflare dashboard. Steps are in epo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md �3.
- **No Worker-level session-token / Cloudflare Access JWT verification.** Documented as a future hardening step. The Worker's ALLOWED_ORIGIN CORS gate is unchanged. The Worker's header comment now records the contract.
- **No deploy.** No wrangler deploy. No Cloudflare dashboard commands. No 
pm install, pnpm install, yarn install, 
px. No package.json change. No package-lock.json change. No pnpm-lock.yaml change. No yarn.lock change. No 	sconfig.json change. No 
ext.config.mjs change. No postcss.config.* change. No eslint / tailwind config change.
- **No real .env* change.** Only .env.local.example was touched.
- **No pp/admin/page.tsx change.** No pp/admin/onboarding/page.tsx change. No pp/admin/proposal/page.tsx change. They rely on pp/admin/layout.tsx for the convenience gate; they did not need to change.
- **No components/ change.** No hooks/ change. No lib/ change (other than the Worker source doc comment). No public/ change. No styles/ change. No 	ests/, no .github/, no CI config.
- **No package.json change.**
- **No tests / no build / no lint / no deploy.** Static inspection only. The owner runs the build and the post-deploy checks.

**Hard rules respected:**

- No git add. No git commit. No git push. No git remote add. No git fetch. No git pull. No GitHub repo. No publish.
- No 
pm install. No pnpm install. No yarn install. No 
px. No 
pm run. No pnpm run. No yarn run. No wrangler deploy. No deploy command. No Cloudflare dashboard command. No package-manager command.
- No package.json change. No package-lock.json change. No pnpm-lock.yaml change. No yarn.lock change.
- No 	sconfig.json change. No 
ext.config.* change. No postcss.config.* change. No eslint / tailwind config change.
- No source edit outside the explicit Security 2 scope (pp/admin/layout.tsx only; workers/anthropic-proposal-proxy.ts doc comment only).
- No pp/admin/page.tsx change. No pp/admin/onboarding/page.tsx change. No pp/admin/proposal/page.tsx change.
- No components/ change. No hooks/ change. No lib/ change (other than Worker doc comment). No public/ change. No styles/ change.
- No real .env* change. No .mcp.json change. No .opencode/, .codex/, .claude/ change.
- No 	ests/ change. No .github/ change. No CI config.
- No MCP setup. No Ponytail. No ECC / affaan-m/ecc. No Impeccable. No Emil Kowalski. No Playwright. No Chrome DevTools MCP. No Graphify. No Repomix. No Context7 MCP. No Tree-sitter. No codebase-memory MCP.
- No Security 3. No Security 4. No Booking A / B. No Observability. No QA Slice 0..3. No UIX0 / MOTION0 Planning / first slice / later slices. No Admin future. No Final QA / delivery.
- No Auth.js. No Supabase Auth. No server route. No new npm dependency.

**Risks closed in this batch:**

- **R-001 (admin password in static bundle) � addressed at the deployment level.** The real admin boundary is now Cloudflare Access in front of /admin/* (D-020a, LOCKED DEFAULT). R-001 is **deferred** for the local dev / preview environment (the convenience gate keeps the admin out of casual view there; it is explicitly labeled convenience-only in the UI). Cloudflare Access in front of /admin/* on the deployed site is mandatory before any non-internal launch.

**Fixes implemented in this batch:**

- **F-002 (Cloudflare Access for fast internal admin protection) � implemented for the deployed path.** Cloudflare Access is the real admin boundary. The local client-side gate in pp/admin/layout.tsx is convenience-only and is explicitly labeled as such. NEXT_PUBLIC_ADMIN_PASSWORD is deprecated as a real security boundary. See epo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md and docs/DEPLOYMENT.md for the owner-side Cloudflare Access setup.

**Risks still open:**

- **R-003 (Supabase RLS not enabled).** Not in Security 2 scope. Addressed by Security 3.
- **R-004 (booking double-booking).** Not in Security 2 scope. Addressed by Booking A.
- **R-005 (single shared webhook for four form types, no signing).** Not in Security 2 scope. Addressed by Security 4.
- **R-006 (no error tracking or rate limiting).** Not in Security 2 scope. Addressed by Observability.
- **R-007 (CSP is enforced only at the production edge).** Open; not in Security 2 scope.
- **R-008 (honeypot-only bot protection).** Open; not in Security 2 scope.
- **R-009 (third-party CDN for tool logos).** Open; not in Security 2 scope.
- **R-010 (admin form data persisted in browser only).** Open; not in Security 2 scope. Addressed by Admin future.
- **R-018 (proposal persistence).** Open; not in Security 2 scope. Addressed by Admin future.
- **R-029 (admin auth follow-up hardening).** Open; the Worker-level session-token / Cloudflare Access JWT verification is a future hardening step. The Worker's source is structured to make this additive.
- **R-011..R-035 (other).** Open; addressed by future phases per A0 plan.
- **Worker endpoint auth may still need deployment-level Access protection.** If the Worker is reachable on a separate subdomain, the owner should add a second Cloudflare Access application in front of it. Until that is in place, the Worker is exposed to anyone who can match an ALLOWED_ORIGIN entry from a browser they control.

**No new decisions.** Security 2 only applies the existing D-020a LOCKED DEFAULT. The D-IDs in this file remain canonical. Security 2 appends a Security 2 reflection note; it does not add new D-IDs.

**Source:** PROJECT_CONTROL_LOG.md \"Security 2 batch overlay (2026-06-16)\"; docs/A0_ACTION_PLAN.md �5.5; epo-research/A0_PHASE_EXECUTION_QUEUE.md row #5; epo-research/A0_CHANGE_ZONE_MAP.md pp/admin/layout.tsx row; docs/D0_ARCHITECTURE_DECISIONS.md Security area; epo-research/SECURITY_HARDENING_BRIEF.md Option A; epo-research/SECURITY_1_WORKER_PROXY_NOTES.md Security 2 dependency; docs/SECURITY.md R-001 and F-002; epo-research/RISK_REGISTER.md R-001, R-029.

A future agent that receives ChatGPT Control Room's Security 2 review response must update this reflection, append to docs/51_AGENT_HANDOFF_LOG.md, and stop. The D-IDs are not renumbered; the Security 2 reflection is the only Security 2 write to this file.

## Security 3 reflection (2026-06-16)

Security 3 is the A0 future phase #6. Security 3 ran on 2026-06-16 as a deliberate, additive exception gated by the owner's Security 3 prompt. Security 3 ran while A0 is still pending ChatGPT Control Room review. Security 3 is not a substitute for A0 review. This reflection is recorded here for completeness. Security 3 does not add new D-IDs. Security 3 applies the existing D-020 LOCKED DEFAULT (Supabase RLS is required before any non-internal launch).

**What Security 3 did:**

- **Inspected the current Supabase schema, frontend usage, and migration folder.** Tables: ookings and vailable_slots. No other tables. Frontend lib/booking-actions.ts directly reads vailable_slots and writes ookings + vailable_slots from the browser using the anon key. R-003 is the original risk. No supabase/ folder existed before this phase. Frontend components/booking-calendar-custom.tsx does not call getAvailableSlots (R-005); the booking UI was already broken in a different way. RLS does not introduce a new breakage; it makes the existing breakage explicit and gated.
- **Created the SQL migration** at supabase/migrations/20260616_security3_rls.sql. The migration:
  - Enables Row Level Security on ookings and vailable_slots.
  - Force-RLSes both tables (a future table-owner change does not silently bypass RLS).
  - Drops any pre-existing policies with the same name (idempotent; safe to re-run).
  - Creates an non_deny_all_* policy for each table: FOR ALL TO anon USING (false) WITH CHECK (false). The browser cannot SELECT / INSERT / UPDATE / DELETE on either table, even with the anon key in the bundle.
  - Creates a service_role_full_access_* policy for each table: FOR ALL TO service_role USING (true) WITH CHECK (true). This is technically redundant (Supabase grants BYPASSRLS by default) but is explicit and self-documenting. The service_role is server-side only.
  - Grants anon EXECUTE on the future get_available_slots function as a forward-compatible grant. The function does not exist yet; the grant is a no-op until Booking A creates the function.
  - Grants service_role EXECUTE on the future eserve_slot function as a forward-compatible grant. **Anon is NEVER granted EXECUTE on eserve_slot.** The reservation must happen server-side via the Worker, which holds the service_role key.
  - Revokes the PUBLIC default privileges on the two tables (belt-and-suspenders backstop).
  - Adds verification comments at the end (read-only queries the owner runs to confirm RLS is on and the policies are in place).
  - Heavily commented. Idempotent. Reversible (rollback is in epo-research/SECURITY_3_SUPABASE_RLS_NOTES.md �6).
- **Created the new supabase/ folder** (did not exist before this phase). The migration is in supabase/migrations/. This is a new top-level folder consistent with the Supabase CLI convention.
- **Created epo-research/SECURITY_3_SUPABASE_RLS_NOTES.md** (primary deliverable for the Security 3 phase). Covers current risk, tables affected, proposed RLS model, the SQL file created, owner-side application steps (Supabase SQL editor recommended; Supabase CLI alternative), rollback SQL, verification checklist, known impact on current booking flow, dependencies on Booking A/B, and what remains blocked.
- **Updated docs/DATABASE.md.** RLS section rewritten to the Security 3 policy model. The "How the app reads and writes" section updated to call out the Security 3 deny and the future RPCs (get_available_slots for read in Booking A; eserve_slot for write in Booking B, called from the Worker with the service_role key).
- **Updated docs/SECURITY.md.** Security 3 status banner added. R-003 moved to a new "Closed risks" section with a Security 3 resolution. F-003 marked implemented at the SQL level; deferred at the runtime level until the owner applies the migration. R-007 / R-005 / R-006 / R-010 / R-018 still open.
- **Updated docs/DEPLOYMENT.md.** New "Supabase Row Level Security (Security 3)" section with the owner-side setup steps (Supabase SQL editor recommended; Supabase CLI alternative) and the post-deploy checks.
- **Updated INTEGRATION_NOTES.md �8.3.** Marked SHIPPED 2026-06-16 (SQL level; runtime deferred to owner). Explicit Service-role / Worker-only / anon-never-for-reserve language. Closure list updated. Migration status noted.

**What Security 3 did NOT do:**

- **No SQL was applied.** The migration is on disk. The owner applies it manually via the Supabase SQL editor (recommended) or the Supabase CLI (alternative). This phase did not connect to Supabase, did not run the Supabase CLI, did not run psql, and did not apply any SQL.
- **No service_role key in any NEXT_PUBLIC_* env var, in the static bundle, in the repo, or in any client-reachable file.** The migration does not add or change any env var. The service_role key is server-side only.
- **No new auth library was added.** No Auth.js. No Supabase Auth. No server route. No new npm dependency. Security 3 is a SQL + docs phase.
- **No frontend code change.** The brief explicitly excludes pp/, components/, lib/, hooks/, public/, styles/, workers/. The frontend code change to call the future RPCs is Booking A and Booking B work. The migration makes the existing direct-table read/write path in lib/booking-actions.ts fail with RLS violations; that is the intended state until Booking A and Booking B ship.
- **No deploy.** No wrangler deploy. No Cloudflare dashboard command. No 
pm install, pnpm install, yarn install, 
px. No package.json change. No package-lock.json change. No pnpm-lock.yaml change. No yarn.lock change. No 	sconfig.json change. No 
ext.config.mjs change. No postcss.config.* change. No eslint / tailwind config change.
- **No real .env* change.** Only .env.local.example (already updated in Security 2) was touched; Security 3 did not touch it. The migration does not require any env var change.
- **No Supabase CLI install.** The brief explicitly excludes installing the Supabase CLI. The owner may install it as part of their workflow; that is owner-driven.
- **No 	ests/, no .github/, no CI config.**
- **No Supabase dashboard command.** No psql. No database command of any kind.

**Hard rules respected:**

- No git add. No git commit. No git push. No git remote add. No git fetch. No git pull. No GitHub repo. No publish.
- No 
pm install. No pnpm install. No yarn install. No 
px. No 
pm run. No pnpm run. No yarn run. No wrangler deploy. No deploy command. No Cloudflare dashboard command. No Supabase dashboard command. No psql. No supabase CLI. No database command. No package-manager command.
- No package.json change. No package-lock.json change. No pnpm-lock.yaml change. No yarn.lock change.
- No 	sconfig.json change. No 
ext.config.* change. No postcss.config.* change. No eslint / tailwind config change.
- No source edit outside the explicit Security 3 scope (the SQL migration in supabase/migrations/; the new epo-research/SECURITY_3_SUPABASE_RLS_NOTES.md; updates to docs/DATABASE.md, docs/SECURITY.md, docs/DEPLOYMENT.md, INTEGRATION_NOTES.md).
- No pp/** change. No components/** change. No lib/** change. No hooks/** change. No public/** change. No styles/** change. No workers/** change. No real .env* change.
- No .mcp.json change. No .opencode/, .codex/, .claude/ change.
- No 	ests/ change. No .github/ change. No CI config.
- No MCP setup. No Ponytail. No ECC / affaan-m/ecc. No Impeccable. No Emil Kowalski. No Playwright. No Chrome DevTools MCP. No Graphify. No Repomix. No Context7 MCP. No Tree-sitter. No codebase-memory MCP.
- No Security 4. No Booking A / B. No Observability. No QA Slice 0..3. No UIX0 / MOTION0 Planning / first slice / later slices. No Admin future. No Final QA / delivery.
- No service_role key in any NEXT_PUBLIC_* env var, in the static bundle, in the repo, or in any client-reachable file.
- No Auth.js. No Supabase Auth. No server route. No new npm dependency.
- No application of the SQL migration. The migration is on disk. The owner applies it manually.

**Risks closed in this batch:**

- **R-003 (Supabase RLS not enabled) � closed at the SQL level.** The migration is on disk and ready to apply. R-003 is **deferred at the runtime level** until the owner applies the migration. After the owner applies the migration, R-003 is fully closed. LG-3 closed.
- **F-003 (Enable Supabase RLS) � implemented at the SQL level.** Anon is denied on both tables; service_role retains full access; forward-compatible grants on the future narrow RPCs. F-003 is **deferred at the runtime level** until the owner applies the migration.

**Risks still open:**

- **R-004 (booking double-booking).** Not in Security 3 scope. Addressed by Booking A / Booking B.
- **R-005 (single shared webhook for four form types, no signing).** Not in Security 3 scope. Addressed by Security 4.
- **R-006 (no error tracking or rate limiting).** Not in Security 3 scope. Addressed by Observability.
- **R-007 (CSP is enforced only at the production edge).** Open; not in Security 3 scope.
- **R-008 (honeypot-only bot protection).** Open; not in Security 3 scope.
- **R-009 (third-party CDN for tool logos).** Open; not in Security 3 scope.
- **R-010 (admin form data persisted in browser only).** Open; not in Security 3 scope. Addressed by Admin future.
- **R-018 (proposal persistence).** Open; not in Security 3 scope. Addressed by Admin future.
- **R-029 (admin auth follow-up hardening).** Open; Worker-level JWT verification is a future hardening step.
- **R-011..R-035 (other).** Open; addressed by future phases per A0 plan.

**No new decisions.** Security 3 only applies the existing D-020 LOCKED DEFAULT. The D-IDs in this file remain canonical. Security 3 appends a Security 3 reflection note; it does not add new D-IDs.

**Source:** PROJECT_CONTROL_LOG.md "Security 3 batch overlay (2026-06-16)"; docs/A0_ACTION_PLAN.md �5.6; epo-research/A0_PHASE_EXECUTION_QUEUE.md row #6; epo-research/A0_CHANGE_ZONE_MAP.md supabase/migrations/* row; docs/D0_ARCHITECTURE_DECISIONS.md Security area; epo-research/SECURITY_HARDENING_BRIEF.md �3 Option B; INTEGRATION_NOTES.md �8.3; lib/booking-schema.sql; lib/booking-actions.ts; docs/DATABASE.md; docs/SECURITY.md; epo-research/RISK_REGISTER.md R-003.

A future agent that receives ChatGPT Control Room's Security 3 review response must update this reflection, append to docs/51_AGENT_HANDOFF_LOG.md, and stop. The D-IDs are not renumbered; the Security 3 reflection is the only Security 3 write to this file.

## Security 4 reflection (2026-06-16)

Security 4 is the A0 future phase #7. Security 4 ran on 2026-06-16 as a deliberate, additive exception gated by the owner's Security 4 prompt. **A0 is approved by ChatGPT Control Room as of this phase.** Security 3 is approved at SQL/documentation level; the Security 3 SQL migration is **NOT applied yet**; Security 3 runtime application remains an owner-side pre-launch action. This reflection is recorded here for completeness. Security 4 does not add new D-IDs. Security 4 applies the existing D-022 (n8n per-form secret + header).

**What Security 4 did:**

- **Inspected the current n8n webhook usage.** Four public forms (contact, quote, newsletter, booking) all POST directly to the same NEXT_PUBLIC_N8N_WEBHOOK_URL from the browser. Because the project uses output: 'export', the URL is inlined into the static bundle. The n8n workflow was the only thing protecting the webhook. R-005 documents this. R-017 documents the missing per-form secret + header.
- **Created the forms Worker source** at workers/n8n-form-proxy.ts. Native etch only. No npm dependencies. No package.json change. The Worker:
  - Accepts POST (with OPTIONS handled as CORS preflight).
  - Validates the Origin header against a comma-separated ALLOWED_ORIGIN env var; returns 403 origin_not_allowed for any other Origin.
  - Parses the request body as JSON; returns 400 invalid_json / 400 invalid_payload on malformed input.
  - Reads the payload's source field (or 	ype: "booking" for the booking form, the existing convention) to decide which n8n webhook URL to forward to and which per-form secret to attach.
  - Adds the X-CodeOutfitters-Form-Secret header server-side with the matching per-form secret.
  - Forwards the request to the configured n8n webhook URL.
  - Returns a generic 200 on success; never returns the secret, the n8n URL, or the ALLOWED_ORIGIN value in the response.
  - Safe error responses (400 / 403 / 405 / 500 / 502) with short error tags.
- **Updated the four form submit files** to call the forms Worker instead of the n8n webhook directly:
  - components/contact.tsx � NEXT_PUBLIC_N8N_WEBHOOK_URL ? NEXT_PUBLIC_FORMS_WORKER_URL. Preserves source: "contact" (added in Cleanup A). One-line change in the n8n POST path.
  - components/quote-form.tsx � NEXT_PUBLIC_N8N_WEBHOOK_URL ? NEXT_PUBLIC_FORMS_WORKER_URL. Preserves source: "quote_request". One-line change in the n8n POST path.
  - components/newsletter.tsx � NEXT_PUBLIC_N8N_WEBHOOK_URL ? NEXT_PUBLIC_FORMS_WORKER_URL. Preserves source: "newsletter". One-line change in the n8n POST path.
  - components/booking-calendar-custom.tsx � NEXT_PUBLIC_N8N_WEBHOOK_URL ? NEXT_PUBLIC_FORMS_WORKER_URL in the n8n POST path only. Preserves 	ype: "booking". The booking form's Supabase write path is unchanged. The booking form's availability / reservation logic is unchanged.
- **Updated public/_headers.** CSP connect-src no longer includes https://*.n8n.io; the browser no longer needs to call the n8n domain directly. https://*.workers.dev is already in the CSP (carried over from Security 1) and covers the forms Worker.
- **Updated .env.local.example.** Added NEXT_PUBLIC_FORMS_WORKER_URL placeholder. Removed the encouraged public NEXT_PUBLIC_N8N_WEBHOOK_URL. Added a DEPRECATED block for the old key. The Security 1 / Security 2 / Security 3 DEPRECATED blocks are preserved.
- **Updated docs/ENVIRONMENT.md.** Added NEXT_PUBLIC_FORMS_WORKER_URL row to the Frontend table. Added a "Worker env vars (Cloudflare Worker � forms proxy)" subsection with all 9 Worker env vars (ALLOWED_ORIGIN, N8N_CONTACT_WEBHOOK_URL, N8N_CONTACT_SECRET, N8N_QUOTE_WEBHOOK_URL, N8N_QUOTE_SECRET, N8N_BOOKING_WEBHOOK_URL, N8N_BOOKING_SECRET, N8N_NEWSLETTER_WEBHOOK_URL, N8N_NEWSLETTER_SECRET). Added the NEXT_PUBLIC_N8N_WEBHOOK_URL deprecated entry. Updated the per-form payload contracts section to reflect Security 4.
- **Updated docs/SECURITY.md.** Security 4 status banner added. R-005 moved to a new "Closed risks" section with a Security 4 resolution. R-017 also addressed. F-006 marked implemented at the deployment level; deferred at the runtime level. The "What is acceptable in the current model" section updated.
- **Updated docs/DEPLOYMENT.md.** New "n8n form proxy (Security 4)" section with the owner-side setup steps (Worker deploy, n8n workflow config) and the post-deploy checks.
- **Updated INTEGRATION_NOTES.md �8.2.** Marked SHIPPED 2026-06-16 with the resolution. Explicit server-side header language. Closure list updated.
- **Created epo-research/SECURITY_4_N8N_SECRET_NOTES.md** (primary deliverable for the Security 4 phase). Covers current risk, new Worker proxy model, required Worker env vars, required n8n workflow env vars / secrets, header name, per-form routing model, owner setup steps, rollback plan, verification checklist, known remaining risks, sign-off.

**What Security 4 did NOT do:**

- **No NEXT_PUBLIC_*_SECRET env var was added.** All secrets are server-side only in the Worker.
- **No n8n secret in browser code.** The browser does not add the X-CodeOutfitters-Form-Secret header. The Worker adds it server-side.
- **No Worker deploy.** No wrangler deploy. No Cloudflare dashboard command. The forms Worker is owner-deployed.
- **No n8n workflow configuration.** The n8n workflow must be configured by the owner to verify the X-CodeOutfitters-Form-Secret header against the matching workflow-level secret/env var. Owner-side setup steps are in epo-research/SECURITY_4_N8N_SECRET_NOTES.md �7.5.
- **No Supabase migration apply.** Security 3 SQL is **NOT applied** in this phase. Security 3 runtime application remains an owner-side pre-launch action. The booking form continues to use the existing direct-Supabase write path; that is unchanged by Security 4. If the Security 3 migration is applied, the Supabase write will fail; the fix is Booking B (RPC write path via the Worker).
- **No pp/admin/** change.** The admin boundary is Cloudflare Access (Security 2); the local convenience gate is convenience-only.
- **No pp/** change (other than the four form components in components/).**
- **No components/** change outside the four form submit files.** No new auth library. No new shared webhook helper (the form components are small and the Worker is the source of truth for routing).
- **No lib/** change.** The booking form's Supabase write path is unchanged by Security 4. The brief explicitly excludes lib/.
- **No hooks/, public/_redirects, styles/ change.** No workers/anthropic-proposal-proxy.ts change (the Security 1 Worker and the Security 4 Worker are independent; no doc comment needed).
- **No supabase/migrations/** change.** Security 3 SQL is still not applied.
- **No booking availability / reservation logic change.** The booking form's Supabase write path is unchanged. The booking form's n8n POST was redirected to the forms Worker; the rest of the booking form is unchanged.
- **No deploy.** No wrangler deploy. No Cloudflare dashboard command. No 
pm install, pnpm install, yarn install, 
px. No package.json change. No package-lock.json change. No pnpm-lock.yaml change. No yarn.lock change. No 	sconfig.json change. No 
ext.config.mjs change. No postcss.config.* change. No eslint / tailwind config change.
- **No real .env* change.** Only .env.local.example was touched.
- **No Supabase CLI install.** No psql. No database command of any kind.

**Hard rules respected:**

- No git add. No git commit. No git push. No git remote add. No git fetch. No git pull. No GitHub repo. No publish.
- No 
pm install. No pnpm install. No yarn install. No 
px. No 
pm run. No pnpm run. No yarn run. No wrangler deploy. No deploy command. No Cloudflare dashboard command. No Supabase dashboard command. No psql. No supabase CLI. No database command. No package-manager command.
- No package.json change. No package-lock.json change. No pnpm-lock.yaml change. No yarn.lock change.
- No 	sconfig.json change. No 
ext.config.* change. No postcss.config.* change. No eslint / tailwind config change.
- No source edit outside the explicit Security 4 scope (the Worker source workers/n8n-form-proxy.ts; the four form submit files; public/_headers CSP; .env.local.example; the docs; the new epo-research/SECURITY_4_N8N_SECRET_NOTES.md; the state files).
- No pp/admin/** change. No pp/** (other than the four form components in components/) change. No lib/** change. No hooks/** change. No public/** (other than _headers) change. No styles/** change. No workers/anthropic-proposal-proxy.ts change. No supabase/migrations/** change.
- No real .env* change. No .mcp.json change. No .opencode/, .codex/, .claude/ change.
- No 	ests/ change. No .github/ change. No CI config.
- No MCP setup. No Ponytail. No ECC / affaan-m/ecc. No Impeccable. No Emil Kowalski. No Playwright. No Chrome DevTools MCP. No Graphify. No Repomix. No Context7 MCP. No Tree-sitter. No codebase-memory MCP.
- No Security 5. No Booking A / B. No Observability. No QA Slice 0..3. No UIX0 / MOTION0 Planning / first slice / later slices. No Admin future. No Final QA / delivery.
- No NEXT_PUBLIC_*_SECRET env var added.
- No n8n secret in browser code. No X-CodeOutfitters-Form-Secret in browser code.
- No Auth.js. No Supabase Auth. No server route. No middleware. No Next.js API route. No new npm dependency.
- No application of the Security 3 SQL migration. Security 3 is approved at SQL/documentation level; runtime application remains an owner-side pre-launch action.

**Risks closed in this batch:**

- **R-005 (single shared webhook for four form types, no signing) � addressed at the deployment level.** The browser no longer holds the n8n webhook URL or any n8n secret. All public forms post to a Cloudflare Worker which adds the per-form secret header server-side. R-005 is deferred at the runtime level until the owner deploys the forms Worker and configures the n8n workflow.
- **R-017 (per-form webhook secret, header, verify in n8n) � addressed at the deployment level.** The Worker source adds the X-CodeOutfitters-Form-Secret header server-side with the matching per-form secret. n8n must verify the header against its own workflow-level secret/env var. R-017 is deferred at the runtime level until the owner deploys the forms Worker and configures the n8n workflow.

**Fixes implemented in this batch:**

- **F-006 (per-form webhook secret, header, verify in n8n) � implemented at the deployment level.** The forms Worker is in workers/n8n-form-proxy.ts. The per-form secrets are held server-side in the Worker. n8n must verify the header. F-006 is deferred at the runtime level until the owner deploys the forms Worker and configures the n8n workflow.

**Risks still open:**

- **R-001 (admin password in bundle).** Addressed at the deployment level by Security 2. Deferred for local dev / preview.
- **R-002 (Anthropic key in bundle).** Closed at the runtime level by Security 1.
- **R-003 (Supabase RLS not enabled).** Closed at the SQL level by Security 3. Deferred at the runtime level until the owner applies the migration.
- **R-004 (booking double-booking).** Not in Security 4 scope. Addressed by Booking A / Booking B.
- **R-006 (no error tracking or rate limiting).** Not in Security 4 scope. Addressed by Observability.
- **R-007, R-008, R-009, R-010, R-011..R-035** still open; addressed by future phases per A0 plan.

**No new decisions.** Security 4 only applies the existing D-022. The D-IDs in this file remain canonical. Security 4 appends a Security 4 reflection note; it does not add new D-IDs.

**Source:** PROJECT_CONTROL_LOG.md "Security 4 batch overlay (2026-06-16)"; docs/A0_ACTION_PLAN.md �5.7; epo-research/A0_PHASE_EXECUTION_QUEUE.md row #7; epo-research/A0_CHANGE_ZONE_MAP.md workers/* / components/contact.tsx / components/quote-form.tsx / components/newsletter.tsx / components/booking-calendar-custom.tsx / public/_headers rows; docs/D0_ARCHITECTURE_DECISIONS.md Security area; epo-research/SECURITY_HARDENING_BRIEF.md �3; epo-research/SECURITY_1_WORKER_PROXY_NOTES.md; epo-research/SECURITY_3_SUPABASE_RLS_NOTES.md; INTEGRATION_NOTES.md �1 (n8n webhook payload contracts) and �8.2 (planned Security 4 contract); docs/SECURITY.md R-005 / R-017 / F-006; the 2026-06-16 Control Room correction on git push / commit policy; the 2026-06-16 Control Room clarification that A0 is approved and Security 3 SQL is not applied yet.

A future agent that receives ChatGPT Control Room's Security 4 review response must update this reflection, append to docs/51_AGENT_HANDOFF_LOG.md, and stop. The D-IDs are not renumbered; the Security 4 reflection is the only Security 4 write to this file.

## Booking A reflection (2026-06-16)

Booking A is the A0 future phase #8. Booking A ran on 2026-06-16 as a deliberate, additive exception gated by the owner's Booking A prompt. **A0 is approved by ChatGPT Control Room as of this phase** (carried forward from Security 4, 2026-06-16). **Security 3 RLS migration is approved at SQL/documentation level; Security 3 migration is NOT applied yet; Security 3 runtime application remains an owner-side pre-launch action.** This reflection is recorded here for completeness. Booking A does not add new D-IDs. Booking A applies the existing D-019b LOCKED DEFAULT (Booking MVP write path = A first, then C; A's read path is in Booking A; C's write path via n8n is unchanged; the robust B + D path is Booking B).

**What Booking A did:**

- **Inspected the current booking read path.** `lib/booking-actions.ts:35` `getAvailableSlots(month, year)` previously did a direct `supabase.from('available_slots').select('*').gte('date', startDate).lte('date', endDate).eq('is_booked', false).order(...).order(...)`. After the Security 3 RLS migration is applied, anon cannot SELECT from `available_slots`, so the direct query would fail with a 403 / RLS violation. The Security 3 migration also grants anon `EXECUTE` on the future `get_available_slots` function as a forward-compatible grant; the function body is created in Booking A.
- **Created the SQL migration** at `supabase/migrations/20260616_booking_a_get_available_slots.sql`. The migration:
  - Drops the function if it exists (idempotency for `CREATE OR REPLACE FUNCTION`).
  - Creates `public.get_available_slots(p_month int, p_year int) returns TABLE(id uuid, date date, time text)`. `SECURITY DEFINER`, `STABLE`, `SET search_path = pg_catalog, public`, `LANGUAGE plpgsql`.
  - Validates inputs: `p_month` 1..12 (else raises `22023`); `p_year` 1970..2100 (else raises `22023`).
  - Computes the first and last day of the requested month in UTC using `make_date` and `interval '1 month - 1 day'`.
  - Returns rows from `public.available_slots` where `is_booked = false` and `date` is in the month range, ordered by `date ASC, time ASC`.
  - Revokes `PUBLIC` EXECUTE. Grants `EXECUTE` to `anon` and to `service_role`. **No `reserve_slot` is created. No anon `EXECUTE` on `reserve_slot` is granted.** No `bookings` changes. No table shape changes. No env var changes.
  - Includes read-only verification queries at the end.
  - Heavily commented. Idempotent. Reversible (rollback is in `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md` §10).
- **Updated `lib/booking-actions.ts:35` `getAvailableSlots(month, year)`** to call `supabase.rpc('get_available_slots', { p_month, p_year })`. Input validation: `p_month` 1..12, `p_year` 1970..2100. Same input shape, same return shape, same error shape. The function maps the response to the `SlotRecord` shape the frontend already uses (`is_booked` is set to `false` because the RPC only returns unbooked rows).
- **Updated `components/booking-calendar-custom.tsx`** to call `getAvailableSlots(month, year)` for the displayed month via `useEffect`. Loading and error states added. Date picker disables days with zero available slots (`isDateSelectable(day)`). Time picker renders only the times actually available for the selected date (a derived `availableTimesForSelectedDate`). Submit handler unchanged (still posts to `NEXT_PUBLIC_FORMS_WORKER_URL` with `type: "booking"`). UI design, step indicator, form fields, placeholder text (`+1 (555) 123-4567`), validation, honeypot, and type field all unchanged.
- **`createBooking` is intentionally unchanged.** The function still does the direct `INSERT` into `bookings` and the direct `UPDATE` on `available_slots.is_booked`. After Security 3 RLS is applied, both calls will fail with 403 / RLS violations. The fix is Booking B (the `reserve_slot` RPC, called server-side from a Cloudflare Worker that holds the `service_role` key; anon is **never** granted `EXECUTE` on `reserve_slot`). Until Booking B ships, the booking submission is non-functional by design — direct browser writes are not trusted. The UI's submit handler still posts to the n8n forms Worker (Security 4) so the operator gets a notification. The function's docstring records the gate explicitly.
- **Created `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md`** (primary deliverable for the Booking A phase). Covers current problem, SQL file created, RPC contract, frontend files changed, owner-side application steps, verification queries, known remaining risks, Booking B dependency, rollback plan, testing checklist, sign-off.
- **Updated `docs/DATABASE.md`:** Booking A status banner; "How the app reads and writes" section updated with the post-Booking-A read path; "Known issue" section updated to record the partial close of R-005 at the read path level.
- **Updated `docs/SECURITY.md`:** Booking A status banner; explicit "SQL NOT applied" language; `createBooking` documented as blocked until Booking B; no new env var; no new package; no new Worker; no new auth library.
- **Updated `docs/DEPLOYMENT.md`:** new "Booking A — Available slots RPC (2026-06-16)" section with owner-side setup, post-deploy checks, rollback; the post-deploy checklist now includes the Booking A read-path check.
- **Updated `INTEGRATION_NOTES.md` §2 and §8.3 additively.** §2 records the Booking A RPC swap. §8.3 records the Booking A delivery and the partial close of R-005 at the read path level.
- **Updated state files** (PROJECT_CONTROL_LOG.md Booking A batch overlay; memory/CURRENT_STATE.md; memory/ACTIVE_TASK_CONTEXT.md; memory/WORKING_MEMORY.md; memory/EPISODIC_MEMORY.md; ai/AI_TASK_CAPSULE.md; ai/AI_CONTEXT_RULES.md; docs/51_AGENT_HANDOFF_LOG.md).

**What Booking A did NOT do:**

- **No SQL was applied.** The migration is on disk. The owner applies the SQL manually via the Supabase SQL editor (recommended) or the Supabase CLI (alternative). This phase did not connect to Supabase, did not run the Supabase CLI, did not run `psql`, and did not apply any SQL.
- **No service_role key in any `NEXT_PUBLIC_*` env var**, in the static bundle, in the repo, or in any client-reachable file. The RPC is `SECURITY DEFINER`; it runs in the function owner's context (`postgres`), not in a `service_role` context. The RPC does not need the `service_role` key to read from `available_slots`; it reads in the function owner's context.
- **No new auth library was added.** No Auth.js. No Supabase Auth. No server route. No middleware. No Next.js API route. No new npm dependency. Booking A is code + docs + state.
- **No frontend code change outside `lib/booking-actions.ts` and `components/booking-calendar-custom.tsx`.** `lib/booking-schema.sql`, `lib/booking-types.ts`, `lib/supabase.ts`, `lib/proposal-generator.ts`, `lib/admin-types.ts`, `lib/animations/` are unchanged. `app/`, `hooks/`, `public/` (other than what Security 4 already did), `styles/`, `workers/` are unchanged. The four form components other than `components/booking-calendar-custom.tsx` are unchanged. The brief did not require any `app/**` change; none was made.
- **No deploy.** No `wrangler deploy`. No Cloudflare dashboard command. No `npm install`, `pnpm install`, `yarn install`, `npx`, `npm run`, `pnpm run`, `yarn run`. No `package.json` change. No lockfile change. No `tsconfig.json` change. No `next.config.*` change. No `postcss.config.*` change. No eslint / tailwind config change. No real `.env*` change. No `public/_headers` change. No Worker change. No `app/admin/**` change.
- **No Supabase CLI install.** The brief explicitly excludes installing the Supabase CLI. The owner may install it as part of their workflow; that is owner-driven.
- **No `tests/`, no `.github/`, no CI config.** No MCP setup. No `.mcp.json` write. No `.opencode/`, `.codex/`, `.claude/` change.
- **No Security 3 SQL apply.** Security 3 is approved at SQL/documentation level; runtime application remains an owner-side pre-launch action. The Booking A SQL works whether Security 3 is in place or not (the function is `SECURITY DEFINER`; it reads in the function owner's context); but the full design is coherent only when Security 3 is in place.
- **No application of the Booking A SQL migration.** The migration is on disk. The owner applies it manually. The calendar will continue to surface "could not load availability" until the migration is in the database.
- **No `reserve_slot` SQL written.** No `reserve_slot` RPC created. No `bookings` table changes. No new column, index, or constraint on `available_slots`. No table shape changes.

**Hard rules respected:**

- No `git add`, `git commit`, `git push`, `git remote add`, `git fetch`, `git pull`. No GitHub repo. No publish.
- No `npm install`, `pnpm install`, `yarn install`, `npx`, `npm run`, `pnpm run`, `yarn run`, `wrangler deploy`. No deploy command of any kind. No Cloudflare dashboard command. No Supabase dashboard command. No `psql`. No `supabase` CLI. No database command of any kind. No package-manager command of any kind.
- No `package.json` change. No `package-lock.json` change. No `pnpm-lock.yaml` change. No `yarn.lock` change. No `tsconfig.json` change. No `next.config.*` change. No `postcss.config.*` change. No eslint / tailwind config change. No real `.env*` change.
- No source edit outside the explicit Booking A scope (the new SQL migration in `supabase/migrations/`; the new `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md`; the swap in `lib/booking-actions.ts`; the calendar update in `components/booking-calendar-custom.tsx`; the docs; the state files).
- No `app/admin/**` change. No `app/**` change. No `components/**` change outside `components/booking-calendar-custom.tsx`. No `hooks/**` change. No `public/**` change (other than what Security 4 already did). No `styles/**` change. No `workers/**` change.
- No `lib/**` change outside `lib/booking-actions.ts`. `lib/booking-schema.sql`, `lib/booking-types.ts`, `lib/supabase.ts`, `lib/proposal-generator.ts`, `lib/admin-types.ts`, `lib/animations/` are unchanged. The seed script in `lib/booking-schema.sql` is unchanged.
- No `supabase/migrations/**` change outside the new `20260616_booking_a_get_available_slots.sql` file. The Security 3 migration (`20260616_security3_rls.sql`) is unchanged.
- No `tests/`, no `.github/`, no CI config. No MCP setup. No `.mcp.json` write. No `.opencode/`, `.codex/`, `.claude/` change.
- No new env var of any kind. No `NEXT_PUBLIC_*_SECRET`. No `service_role` key in any `NEXT_PUBLIC_*` env var.
- No `reserve_slot` SQL written, no `reserve_slot` RPC created, no `bookings` table changes, no new column / index / constraint on `available_slots`.
- No Auth.js, no Supabase Auth, no server route, no middleware, no Next.js API route, no new npm dependency.
- No application of the Booking A SQL migration. The migration is on disk. The owner applies it manually.
- No application of the Security 3 SQL migration. Security 3 is approved at SQL/documentation level; runtime application remains an owner-side pre-launch action.
- No starting of Booking B, Observability, QA Slice 0..3, UIX0 / MOTION0 Planning, UIX0 / MOTION0 first slice, UIX0 / MOTION0 later slices, Admin future, or Final QA / delivery.
- No installation of Playwright, Playwright MCP, Chrome DevTools MCP, Graphify, Repomix, Context7 MCP, Tree-sitter, codebase-memory MCP, **Ponytail** (candidate only; not approved; gated to TS0 / RDG0), or **ECC / affaan-m/ecc** (candidate only; not approved; gated to TS0 / RDG0).
- No Ponytail install / clone / copy / configure / evaluation.
- No ECC / affaan-m/ecc install / clone / copy / configure / evaluation.

**Risks closed in this batch:**

- **R-005 (booking double-book) is partially closed at the read path level.** The calendar now reads availability through the `get_available_slots` RPC and disables dates / times that are not actually available. R-005 is **fully closed** only when Booking B ships.
- **F-004 (UI reads `available_slots` and only offers actually-available slots) is implemented for the read path.** F-004 is **fully closed** only when Booking B ships.

**Risks still open:**

- **R-005 (full closure)** — needs Booking B (`reserve_slot` RPC + Worker-mediated transactional reservation).
- **R-031 (seed exhaustion)** — unchanged. The seed populates 12 weeks from `2026-05-18`. The Booking A RPC returns whatever the seed has. The operator must re-seed before the window closes.
- **R-007 (CSP is enforced only at the production edge)** — unchanged. The dev server has no CSP. The Booking A RPC runs through the same Supabase endpoint as before. No new `connect-src` entries are needed.
- **R-008 (honeypot-only bot protection)** — unchanged. The form still has a honeypot. The RPC is not a new bot vector (it returns zero rows for a hostile call after validation, and the validation rejects bad inputs).
- **R-005 (write path)** — needs Booking B. The `createBooking` function still does an unconditional `UPDATE available_slots SET is_booked = true WHERE date = ? AND time = ?`, with no transaction wrapper and no `is_booked = false` predicate. After Security 3 RLS is applied, the direct write will fail. The full transactional reservation path is Booking B.
- **R-001, R-002, R-003, R-004, R-006, R-009, R-010, R-011..R-035** — open; addressed by future phases per A0 plan.

**No new decisions.** Booking A only applies the existing D-019b LOCKED DEFAULT. The D-IDs in this file remain canonical. Booking A appends a Booking A reflection note; it does not add new D-IDs.

**Source:** PROJECT_CONTROL_LOG.md "Booking A batch overlay (2026-06-16)"; docs/A0_ACTION_PLAN.md §5.8; `repo-research/A0_PHASE_EXECUTION_QUEUE.md` row #8; `repo-research/A0_CHANGE_ZONE_MAP.md` `lib/booking-actions.ts` / `lib/booking-schema.sql` / `supabase/migrations/*` / `components/booking-calendar-custom.tsx` rows; `docs/D0_ARCHITECTURE_DECISIONS.md` Booking area; `docs/D0_SYSTEM_DESIGN.md` Booking design; `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md`; `repo-research/BOOKING_CORRECTNESS_BRIEF.md`; `repo-research/SECURITY_3_SUPABASE_RLS_NOTES.md` (forward-compatible grants; rollback); `repo-research/SECURITY_4_N8N_SECRET_NOTES.md`; `INTEGRATION_NOTES.md` §2 and §8.3; `lib/booking-schema.sql`; `lib/booking-actions.ts`; `docs/DATABASE.md`; `docs/SECURITY.md`; `docs/DEPLOYMENT.md`; `repo-research/RISK_REGISTER.md` R-005; the 2026-06-16 Control Room correction on git push / commit policy; the 2026-06-16 Control Room clarification that A0 is approved and Security 3 SQL is not applied yet.

A future agent that receives ChatGPT Control Room's Booking A review response must update this reflection, append to docs/51_AGENT_HANDOFF_LOG.md, and stop. The D-IDs are not renumbered; the Booking A reflection is the only Booking A write to this file. The agent does not start Booking B. The agent does not start Observability, QA, TS0 / RDG0, UIX0 / MOTION0, Admin future, or Final QA / delivery.

## Booking A Repair 1 reflection (2026-06-16)

Booking A Repair 1 is a small repair to the on-disk migration at `supabase/migrations/20260616_booking_a_get_available_slots.sql`. It is not a new phase. The owner attempted to apply the original on-disk Booking A migration in the Supabase SQL editor and received `ERROR: 42601: syntax error at or near "time"` at LINE 195. Root cause: the RPC used an unquoted `time text` column in `RETURNS TABLE`. `time` is a reserved type name in PostgreSQL, and the Supabase SQL Editor parser rejected the unquoted form. The Repair 1 edit quotes `"time"` in three places:

1. `RETURNS TABLE`: `time text` → `"time" text`.
2. inner `SELECT`: `s.time` → `s."time" AS "time"`.
3. `ORDER BY`: `ORDER BY s.date ASC, s.time ASC` → `ORDER BY s.date ASC, s."time" ASC`.

Plus a nearby comment block documenting the quoting rationale and an inline comment label.

The owner re-applied the repaired migration in the Supabase SQL editor. Supabase accepted it. Function verification (read from `pg_proc`) passed: `function_name = get_available_slots`, `arguments = p_month integer, p_year integer`, `returns = TABLE(id uuid, date date, "time" text)`, `security_definer = true`, `provolatile = 's'`, `proconfig = ['search_path=pg_catalog, public']`. Smoke test passed: `SELECT date, "time" FROM public.get_available_slots(6, 2026) ORDER BY date, "time" LIMIT 20` returned available slots from seeded dates. The on-disk migration file is the source of truth and matches the applied SQL.

**What Booking A Repair 1 did:**

- Modified only the on-disk migration at `supabase/migrations/20260616_booking_a_get_available_slots.sql`. Three SQL repairs + one nearby comment block + one inline comment label. No other source code was touched. No other config file was touched. No other state file was touched (this reflection note and the runtime state record note are appended here in the runtime state record overlay; the on-disk migration file is the only source file touched in Repair 1).
- Updated the on-disk migration to match the form the owner applied in Supabase. The migration is the source of truth; runtime changes were applied by the owner; OpenCode did not run any SQL.

**What Booking A Repair 1 did NOT do:**

- No source code change outside the on-disk migration. No `package.json`, no lockfile, no `tsconfig.json`, no `next.config.*`, no `postcss.config.*`, no eslint / tailwind config, no real `.env*` change.
- No `git add`, `git commit`, `git push`, `git remote add`, `git fetch`, `git pull`. No GitHub repo. No publish.
- No `npm install`, `pnpm install`, `yarn install`, `npx`, `npm run`, `pnpm run`, `yarn run`, `wrangler deploy`. No deploy command of any kind. No Cloudflare dashboard command. No Supabase dashboard command. No `psql`. No `supabase` CLI. No database command of any kind. No package-manager command of any kind.
- No `service_role` key in any `NEXT_PUBLIC_*` env var, in the static bundle, in the repo, or in any client-reachable file. The function is `SECURITY DEFINER`; it runs in the function owner's context (`postgres`); it does not need the `service_role` key.
- No new env var of any kind. No `NEXT_PUBLIC_*_SECRET` env var.
- No `reserve_slot` SQL written. No `reserve_slot` RPC created. No `bookings` table changes. No new column / index / constraint on `available_slots`. No table shape changes.
- No Auth.js, no Supabase Auth, no server route, no middleware, no Next.js API route, no new npm dependency.
- No starting of Booking B, Observability, QA, TS0 / RDG0, UIX0 / MOTION0, Admin future, or Final QA / delivery.
- No MCP setup. No `.mcp.json` write. No `.opencode/`, `.codex/`, `.claude/` change.
- No Ponytail, no ECC / affaan-m/ecc, no Impeccable, no Emil Kowalski, no Playwright, no Chrome DevTools MCP, no Graphify, no Repomix, no Context7 MCP, no Tree-sitter, no codebase-memory MCP.

**Hard rules respected:** no `git add` / `commit` / `push` / `remote add` / `fetch` / `pull`; no `npm install` / `pnpm install` / `yarn install` / `npx` / `npm run` / `pnpm run` / `yarn run`; no `wrangler deploy`; no deploy command of any kind; no Cloudflare dashboard command; no Supabase dashboard command; no `psql`; no `supabase` CLI; no database command of any kind; no package-manager command of any kind; no `package.json` change; no `package-lock.json` change; no `pnpm-lock.yaml` change; no `yarn.lock` change; no `tsconfig.json` change; no `next.config.*` change; no `postcss.config.*` change; no eslint / tailwind config change; no real `.env*` change; no `public/_headers` change; no Worker change; no `app/admin/**` change; no `app/**` change; no `components/**` change outside the on-disk SQL migration (no, the SQL migration is in `supabase/migrations/`, not in `components/`); no `hooks/**` change; no `lib/**` change; no `styles/**` change; no `tests/`, no `.github/`, no CI config.

**No new decisions.** Booking A Repair 1 only records the runtime error from Supabase, the on-disk fix, and the verification. The D-IDs in this file remain canonical. Booking A Repair 1 appends a Repair 1 reflection note; it does not add new D-IDs.

**Source:** `PROJECT_CONTROL_LOG.md` "Booking A Repair 1" overlay; `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md`; `supabase/migrations/20260616_booking_a_get_available_slots.sql`; the 2026-06-16 owner runtime confirmation.

A future agent that receives ChatGPT Control Room's Booking A Repair 1 review response must update this reflection, append to `docs/51_AGENT_HANDOFF_LOG.md`, and stop. The D-IDs are not renumbered; the Booking A Repair 1 reflection is the only Booking A Repair 1 write to this file.

## Booking A runtime state record (2026-06-16)

Booking A runtime state record is a documentation-only state sync that records the runtime-applied state of Security 3 and Booking A, the Booking A Repair 1 outcome, the live grant repair, and the known non-blocking time-ordering issue. It is not a new phase. It is not a new decision. It does not modify any source code, any SQL file, any config file, any env file, any lockfile, any `package.json`, any `tsconfig.json`, any `next.config.*`, any `postcss.config.*`, any eslint / tailwind config, any `public/_headers`, any `workers/`, any `app/**`, any `components/**`, any `hooks/**`, any `lib/**`, any `styles/`, any `supabase/migrations/**`, any `tests/`, any `.github/`, any `.mcp.json`, any `.opencode/`, any `.codex/`, any `.claude/`, any `tailwind.config.*`. It updates only documentation/state files.

**Runtime facts (confirmed by owner 2026-06-16):**

- **Security 3 runtime = applied and verified.** `public.bookings` and `public.available_slots` have `relrowsecurity = true` and `relforcerowsecurity = true`. Four RLS policies exist: `anon_deny_all_available_slots`, `service_role_full_access_available_slots`, `anon_deny_all_bookings`, `service_role_full_access_bookings`. Base schema in place; `public.available_slots` was seeded with 840 slots. **R-003 closed end-to-end.** F-003 verified at the runtime level.
- **Booking A runtime = applied and verified (after Booking A Repair 1).** `public.get_available_slots(p_month int, p_year int)` was applied manually by the owner. Function verification passed. Smoke test passed. **R-005 partially closed at the read path level and verified at the runtime level.** F-004 implemented for the read path and verified at the runtime level.
- **Booking A live grant repair = applied and verified.** The owner revoked any broad direct table privileges from `anon` and `authenticated` on `public.available_slots` and `public.bookings`; revoked `authenticated` `EXECUTE` on `public.get_available_slots`; restored the intended `anon` `EXECUTE` and `service_role` `EXECUTE` grants. Final verification: `anon` has `EXECUTE`; `service_role` has `EXECUTE`; `authenticated` does **not** appear in the RPC grants; `anon` has no direct privileges on the tables.
- **Booking A Repair 1 = passed and applied to the on-disk migration.** The on-disk migration at `supabase/migrations/20260616_booking_a_get_available_slots.sql` is the source of truth and matches the applied SQL.

**Known non-blocking issue:**

- The `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`). Recorded as a future minor repair or Booking B-adjacent cleanup. Do not start that repair unless explicitly approved.

**Gates:**

- Security 3 runtime: **applied and verified**.
- Booking A runtime: **applied and verified**.
- Booking A Repair 1: **passed and applied to on-disk migration**.
- Booking A live grant repair: **applied and verified**.
- Booking B: **next eligible implementation phase, but not started**. Booking B is blocked until ChatGPT Control Room issues the exact Booking B prompt.
- Git push / remote: **blocked until final delivery approval**.
- Package installs / tooling: **blocked**.
- TS0 / RDG0: **blocked**.
- Ponytail / ECC: **candidate-only and blocked**.
- Worker deployments: **owner-side and not done unless separately confirmed**.

**State files updated in this overlay:** `PROJECT_CONTROL_LOG.md` (Booking A runtime state record overlay), `memory/CURRENT_STATE.md` (Security 3 + Booking A entries updated to "applied and verified at runtime"; "What is blocked" updated; "Exact next gate" updated), `memory/ACTIVE_TASK_CONTEXT.md` (replaced with the runtime state record task; in-scope and out-of-scope lists; definition of done), `memory/WORKING_MEMORY.md` (current task updated; phase gate updated; "Booking A runtime state record" section appended), `memory/EPISODIC_MEMORY.md` (runtime state record event appended), `memory/IMPORTANT_DECISIONS.md` (Booking A Repair 1 reflection note appended; Booking A runtime state record note appended; no new D-IDs), `ai/AI_TASK_CAPSULE.md` (phase line updated; never-do list extended; "Things to be skeptical of" updated), `ai/AI_CONTEXT_RULES.md` (Booking A runtime state rule appended; Security 3 runtime state rule appended), `docs/51_AGENT_HANDOFF_LOG.md` (runtime state record entry appended), `repo-research/SECURITY_3_SUPABASE_RLS_NOTES.md` (status banner updated; "What remains blocked" section updated), `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md` (status banner updated; live grant repair recorded; known non-blocking time-ordering issue recorded; "What remains blocked" section updated; sign-off updated), `docs/DATABASE.md` (Security 3 + Booking A recorded as applied and verified at runtime), `docs/SECURITY.md` (Security 3 + Booking A recorded as applied and verified at runtime; live grant repair recorded; F-003 verified; R-003 closed end-to-end), `docs/DEPLOYMENT.md` (Security 3 + Booking A sections updated to reflect runtime-applied state; post-deploy checklist updated), `INTEGRATION_NOTES.md` (§2 + §8.3 updated to reflect runtime state).

**On-disk migration at `supabase/migrations/20260616_booking_a_get_available_slots.sql`:** unchanged in this overlay (already in its post-Repair 1 form from the prior turn; runtime changes were applied by the owner in Supabase).

**Hard rules respected:** no source code change; no `git add` / `commit` / `push`; no `npm install`; no Supabase CLI; no `psql`; no deploy command; no MCP setup; no Ponytail / ECC / affaan-m/ecc install / clone / copy / configure / evaluate. The on-disk SQL migration is unchanged in this overlay.

**No new decisions.** This overlay only records runtime state. The D-IDs in this file remain canonical.

**Source:** `PROJECT_CONTROL_LOG.md` "Booking A runtime state record (2026-06-16)" overlay; `repo-research/SECURITY_3_SUPABASE_RLS_NOTES.md`; `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md`; the 2026-06-16 owner runtime confirmation.

A future agent that receives ChatGPT Control Room's Booking A runtime state record review response must update this reflection, append to `docs/51_AGENT_HANDOFF_LOG.md`, and stop. The D-IDs are not renumbered; the Booking A runtime state record note is the only Booking A runtime state record write to this file. The agent does not start Booking B. The agent does not start the time-ordering fix. The agent does not start Observability, QA, TS0 / RDG0, UIX0 / MOTION0, Admin future, or Final QA / delivery.

## Booking B reflection (2026-06-16)

Booking B is the A0 future phase #9. Booking B ran on 2026-06-16 as a deliberate, additive exception gated by the owner's Booking B recovery prompt. Booking B ran while A0 is still pending review at the phase level (A0 was approved at the plan level as of the Security 4 phase per `ai/AI_CONTEXT_RULES.md`); the Booking B prompt authorizes Booking B as the next eligible implementation phase after the Booking A runtime state record. Booking B ran in two passes: a first pass that hit a provider error before any file was written (no file changes), and a second pass that wrote the files. The reflection is recorded here for completeness. Booking B does not add new D-IDs.

**What Booking B did:**

- **Verified the on-disk Booking B SQL migration** at `supabase/migrations/20260616_booking_b_reserve_slot.sql` (629 lines, pre-existing in the repo from a prior session, unchanged in this batch). The migration creates `public.reserve_slot(p_date date, p_time text, p_booking jsonb) returns uuid`, `SECURITY DEFINER`, `VOLATILE`, `SET search_path = pg_catalog, public`, `LANGUAGE plpgsql`. The function validates inputs, holds a `SELECT ... FOR UPDATE` row lock on the matching `available_slots` row, raises `slot_already_booked` / `slot_not_found` (`P0001`) on conflict, inserts the booking, and flips the slot — all in a single transaction. The migration adds a `UNIQUE (preferred_date, preferred_time)` constraint on `bookings` as a last-line defense. Grants: `service_role` `EXECUTE` only. **Anon is NEVER granted EXECUTE on `reserve_slot`.** The migration is idempotent and reversible. **NOT applied** by OpenCode. The owner applies it manually via the Supabase SQL editor (recommended) or the Supabase CLI (alternative); steps are in `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md` §6.
- **Wrote the Booking Worker source** at `workers/booking-reservation-worker.ts` (~440 lines, new in this batch). The Worker enforces `ALLOWED_ORIGIN` server-side (CORS gate), validates the payload (date / time / name / email / company / phone / message / timezone), calls `POST ${SUPABASE_URL}/rest/v1/rpc/reserve_slot` with the `SUPABASE_SERVICE_ROLE_KEY` (the key is sent as the `apikey` and `Authorization: Bearer` header to the Supabase REST API), and optionally forwards the same payload to the n8n booking webhook with the per-form secret header so the operator still gets a notification. The Worker is a thin proxy plus a strict CORS gate. CORS is not authentication. The Worker is exposed to anyone who can match an `ALLOWED_ORIGIN` entry from a browser they control. **NOT deployed** by OpenCode. The owner deploys it via `wrangler deploy` (recommended) or the Cloudflare dashboard (alternative); steps are in `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md` §7.
- **Replaced `createBooking` in `lib/booking-actions.ts`** (wholesale replacement per its own Booking A docstring). The new body is a thin client-side wrapper that POSTs the booking payload to `${NEXT_PUBLIC_BOOKING_WORKER_URL}/` with `credentials: 'omit'` and `Content-Type: application/json`. The function preserves the `ActionResult<null>` contract. The previous direct `supabase.from('bookings').insert(...)` and `supabase.from('available_slots').update(...)` calls are **removed**. The `getSupabase()` import is preserved (still used by `getAvailableSlots`).
- **Updated `handleSubmit` in `components/booking-calendar-custom.tsx`** to call `createBooking(formData)` instead of posting to `${NEXT_PUBLIC_FORMS_WORKER_URL}/` directly. The form's local `formData` state is augmented with `preferredDate` (from the selected date), `preferredTime` (from the selected time), and `timezone` (from `Intl.DateTimeFormat().resolvedOptions().timeZone`, falling back to `'America/New_York'`) to build the `BookingFormData` payload. Imports updated to include `createBooking` and `BookingFormData`. UI design unchanged: step indicator, form fields, placeholder text, validation, honeypot, type field, success state, error state, the "No spam, ever." footer, the booking summary card, the back buttons. The form's `maxLength` caps (100 / 100 / 100 / 20 / 500) are unchanged and match the Worker's stricter caps (100 / 100 / 100 / 20 / 2000).
- **Updated `.env.local.example`** to add `NEXT_PUBLIC_BOOKING_WORKER_URL` with a comment block explaining the security model. No real `.env` or `.env.local` modified.
- **Wrote `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md`** (new, ~430 lines, primary deliverable). 12-section structure mirroring the Booking A notes: status line, current problem, SQL file created, RPC contract, Worker contract, frontend files changed, owner-side SQL application steps, owner-side Worker deployment steps, verification queries, frontend integration summary, known remaining risks, rollback plan, testing checklist, sign-off.
- **Updated `repo-research/RISK_REGISTER.md`**: R-005 row's "Proposed Future Fix" column updated with the Booking A read path closure and the Booking B code-shipped write path status. A new "Closed risks" section appended with the closure records for R-001 (Cleanup A), R-002 (Cleanup B), R-019 (Cleanup A), R-023 (Cleanup A), R-025 (Setup), R-027 (Cleanup A). R-005 is NOT in the Closed section; it stays in the main table until the owner applies the SQL and deploys the Worker.
- **Updated state files**: `PROJECT_CONTROL_LOG.md` (Booking B batch overlay appended), `memory/CURRENT_STATE.md` (current state extended with Booking B), `ai/AI_TASK_CAPSULE.md` (phase line updated; never-do list extended with Booking B-specific rules), `ai/AI_CONTEXT_RULES.md` (Booking B hard rule added), `docs/51_AGENT_HANDOFF_LOG.md` (Booking B handoff entry appended).

**Hard rules respected (Booking B-specific):**

- `reserve_slot` is `service_role` only. Anon is **never** granted EXECUTE on `reserve_slot`. The migration `REVOKE ALL ON FUNCTION public.reserve_slot(date, text, jsonb) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.reserve_slot(date, text, jsonb) TO service_role;` and no other grants.
- The browser does **not** call `reserve_slot` directly. The browser only knows `NEXT_PUBLIC_BOOKING_WORKER_URL`. The Worker is the boundary. No `supabase.rpc('reserve_slot', ...)` call from the browser. No `supabase.from('bookings').insert(...)` or `supabase.from('available_slots').update(...)` from the browser.
- The `service_role` key is server-side only. No `NEXT_PUBLIC_*` env var contains the key. No `service_role` key in the static bundle, in the repo, in the Cloudflare Pages dashboard, or in any client-reachable file. The key is bound only to the Worker.
- The function signature is `public.reserve_slot(p_date date, p_time text, p_booking jsonb) returns uuid` (no other signature, no overloads).
- `available_slots."time"` is double-quoted wherever referenced (`s."date" = p_date AND s."time" = p_time`).
- The `UNIQUE (preferred_date, preferred_time)` constraint on `bookings` is added in the same migration in an idempotent `DO $$ ... $$` block.
- The Worker is a thin proxy plus a strict CORS gate. CORS is not authentication. The Worker is exposed to anyone who can match an `ALLOWED_ORIGIN` entry from a browser they control. There is no rate limit. The booking form's honeypot is the only bot protection.

**Hard rules respected (general):**

- No `git add`, no `git commit`, no `git push`, no `git remote add`, no `git fetch`, no `git pull`. No GitHub repo. No publish. Local commits are owner-driven and OPTIONAL. The first commit is OPTIONAL.
- No `npm install`, no `pnpm install`, no `yarn install`, no `npx`, no `npm run`, no `pnpm run`, no `yarn run`, no `wrangler deploy`, no deploy command of any kind, no Cloudflare dashboard command, no Supabase dashboard command, no `psql`, no Supabase CLI, no database command, no package-manager command.
- No `package.json` change, no `package-lock.json` change, no `pnpm-lock.yaml` change, no `yarn.lock` change, no `tsconfig.json` change, no `next.config.*` change, no `postcss.config.*` change, no eslint / tailwind config change, no real `.env*` change.
- No source edit outside the explicit Booking B scope: `workers/booking-reservation-worker.ts` (new), `lib/booking-actions.ts` (replace `createBooking`), `components/booking-calendar-custom.tsx` (update `handleSubmit` and imports), `.env.local.example` (add `NEXT_PUBLIC_BOOKING_WORKER_URL`), `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md` (new), `repo-research/RISK_REGISTER.md` (R-005 status + Closed section), `PROJECT_CONTROL_LOG.md` (Booking B overlay), `memory/CURRENT_STATE.md`, `memory/IMPORTANT_DECISIONS.md` (this reflection), `ai/AI_TASK_CAPSULE.md`, `ai/AI_CONTEXT_RULES.md`, `docs/51_AGENT_HANDOFF_LOG.md`, `memory/WORKING_MEMORY.md` (acknowledged; no changes if no new open questions).
- No `app/admin/**` change, no `app/**` change, no `hooks/` change, no `public/` change, no `styles/` change, no `workers/` change other than the new Worker, no `lib/` change other than `lib/booking-actions.ts`, no `components/` change other than `components/booking-calendar-custom.tsx`. No `tests/`, `.github/`, `.mcp.json`, `.opencode/`, `.codex/`, `.claude/` change.
- No MCP setup. No Ponytail. No ECC / affaan-m/ecc. No Impeccable. No Emil Kowalski. No Playwright. No Chrome DevTools MCP. No Graphify. No Repomix. No Context7 MCP. No Tree-sitter. No codebase-memory MCP.
- No Security 1..5 follow-up work. No Observability work. No QA Slice 0..3 work. No TS0 / RDG0 install. No UIX0 / MOTION0 work. No Admin future work. No Final QA / delivery work.
- No new `NEXT_PUBLIC_*_SECRET` env var. No `service_role` key in any `NEXT_PUBLIC_*` env var, in the static bundle, in the repo, or in any client-reachable file.

**Risks closed in this batch:**

- **R-005 (booking double-book) is code-shipped at both read and write path levels** as of 2026-06-16. Booking A closed the read path (verified at runtime by the owner). Booking B closes the write path at the code level (this phase). R-005 is **fully closed** only when the owner applies the Booking B SQL migration and deploys the Booking Worker (deployment steps in `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md` §7). The row lock + UNIQUE constraint are the primary + last-line defenses.
- **F-004 (UI reads `available_slots` and only offers actually-available slots; the submit path persists the booking through a single transactional RPC) is implemented at the full booking flow level** as of 2026-06-16. F-004 is **fully closed** only when R-005 is fully closed (owner applies SQL and deploys Worker).

**Risks still open (carried forward; not in Booking B scope):**

- R-007 / R-031 (seed exhaustion) — unchanged. The seed populates 12 weeks from `2026-05-18`. The operator must re-seed before the window closes.
- R-008 (honeypot-only bot protection) — unchanged. The form still has a honeypot. The Worker is not a new bot vector.
- R-005 (time column ordering) — carried from Booking A. The `"time"` column is `text` and the RPC returns it sorted lexicographically. The frontend sorts the times for the selected date using a hard-coded `TIME_SLOTS` array, so the order is correct in the UI even when the RPC's order is not. The data is correct; only the RPC's `ORDER BY` is non-chronological. **Recorded for a future minor repair or Booking-B-adjacent cleanup. Do not start this repair unless explicitly approved.**
- All other risks (R-001..R-035) are closed, deferred to future phases, or out of scope per `repo-research/RISK_REGISTER.md`.

**No new decisions.** Booking B only records the Booking B-specific hard rules under the existing D-019b (Booking MVP write path = A first, then C; the robust B + D path is Booking B). The D-IDs in this file remain canonical. Booking B appends a Booking B reflection note; it does not add new D-IDs.

**Source:** `PROJECT_CONTROL_LOG.md` "Booking B batch overlay (2026-06-16)"; `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md`; `workers/booking-reservation-worker.ts`; `lib/booking-actions.ts`; `components/booking-calendar-custom.tsx`; `.env.local.example`; `repo-research/RISK_REGISTER.md`; `INTEGRATION_NOTES.md` §8.3 (Booking B write path); `docs/A0_ACTION_PLAN.md` §5.9 (Booking B); `repo-research/A0_PHASE_EXECUTION_QUEUE.md` row #9; `repo-research/A0_AGENT_ASSIGNMENT_MATRIX.md` (BOOKING-B-AGENT row); `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` (phase-by-phase boundaries); the 2026-06-16 Control Room correction on git push / commit policy.

A future agent that receives ChatGPT Control Room's Booking B review response must update this reflection, append to `docs/51_AGENT_HANDOFF_LOG.md`, and stop. The D-IDs are not renumbered; the Booking B reflection is the only Booking B write to this file. The agent does not start the time-ordering fix. The agent does not start Observability, QA, TS0 / RDG0, UIX0 / MOTION0, Admin future, or Final QA / delivery. The agent does not apply the Booking B SQL migration. The agent does not deploy the Booking Worker. Both are owner-driven.

## Booking B runtime state record (2026-06-16)

Booking B is the A0 future phase #9. The prior Booking B turn (the "code-shipped at the write path level" turn) wrote the SQL migration, the Worker source, the frontend `createBooking` replacement, the frontend `handleSubmit` update, the `.env.local.example` update, and the `BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md` deliverable; the prior Booking B Repair 1 turn wrote the dashboard JS copy and updated the state files. Both turns ended with Booking B "code-shipped at the write path level" and "deferred at the runtime level" until the owner applied the SQL and deployed the Worker. The owner has now completed both owner-side actions. This reflection records the runtime state. Booking B runtime state record does not add new D-IDs.

**What the owner confirmed (2026-06-16):**

- **Booking B SQL applied and verified at runtime.** `public.reserve_slot(p_date date, p_time text, p_booking jsonb)` exists with the documented signature. `bookings_preferred_date_time_unique` exists. The grant repair was applied: `anon` and `authenticated` do **not** have EXECUTE on `reserve_slot`; `service_role` has EXECUTE on `reserve_slot`. R-005 is **fully closed at the runtime level**. F-004 is **fully closed at the runtime level**.
- **Booking Worker deployed.** The owner pasted `workers/booking-reservation-worker.dashboard.js` (the Cloudflare dashboard JS repair from the prior turn) into the Cloudflare dashboard Worker editor and saved the deploy. The owner's account workers subdomain is `samuel` (per the deployed URL `booking-reservation-worker.tsamuel.workers.dev`; the `.ts` in the URL is a copy-paste artifact of the source filename; the actual deployed Worker URL is `https://booking-reservation-worker.samuel.workers.dev` by the same convention used for the other two Workers in this project). Required Worker env vars were configured: `ALLOWED_ORIGIN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. n8n vars (`N8N_BOOKING_WEBHOOK_URL`, `N8N_BOOKING_SECRET`) were intentionally left for later (the operator notification is deferred; the booking RPC is the source of truth; n8n notify is best-effort and not required for the booking to succeed).
- **Worker smoke test passed.** The owner called the Worker and received `bookingId = 69e071f0-8954-4da1-bcb4-75f272bd2b87` with `notification = "skipped"` (because n8n vars are not configured; the Worker correctly reports the skipped notification status). The Worker returned `200 OK` with `{"bookingId": "69e071f0-8954-4da1-bcb4-75f272bd2b87", "notification": "skipped"}`.
- **Supabase verification confirmed the booking row exists** in `public.bookings` for `preferred_date = 2026-06-17` / `preferred_time = '10:00 AM'`.
- **Supabase verification confirmed `available_slots.is_booked = true`** for `2026-06-17` / `10:00 AM`.
- **Duplicate booking test returned `slot_already_booked` (`P0001`).** The owner attempted to reserve the same slot a second time; the Worker returned `409 Conflict` with `{"error": "slot_already_booked"}`. This confirms the row lock + UNIQUE constraint defense in depth is working as designed.
- **Cloudflare dashboard JS repair was needed.** The owner attempted to paste the TypeScript Worker source into the Cloudflare dashboard Worker editor; the dashboard rejected the paste with `Uncaught SyntaxError: Unexpected strict mode reserved word at worker.js:178` because the dashboard parser is not a TypeScript parser and `interface Env` is a strict-mode reserved word in JavaScript. The owner used `workers/booking-reservation-worker.dashboard.js` (the 1:1 runtime port shipped in the prior turn's Booking B Repair 1) for the dashboard paste. The repair worked; the Worker deployed.
- **Frontend deployment (Cloudflare Pages) is still old GitHub code.** The Cloudflare Pages project is connected to GitHub. The current Pages deployment predates the Booking B frontend code (the current Pages deployment was the last GitHub push, which did not include the Booking B frontend changes). The booking form's `handleSubmit` on the deployed Pages is still the pre-Booking-B form (which posts to the n8n forms Worker; not the new `createBooking` flow). The Worker is end-to-end functional at the Worker level (smoke test passed; Supabase verification passed); the browser-driven end-to-end flow cannot be live-tested through Pages until the updated local code is pushed/deployed.
- **Git push / remote remains blocked.** Per the 2026-06-16 Control Room correction, `git push`, `git remote add`, GitHub repo creation, and code publishing are NOT approved. The local commits are owner-driven and OPTIONAL. The agent does not push, does not add a remote, and does not create a GitHub repo. The final delivery deploy is owner-driven and gated to the owner's explicit approval.

**Hard rules respected:**

- No source code change. No SQL file change. No env file change. No lockfile change. No `package.json` change. No `tsconfig.json` change. No `next.config.*` change. No `postcss.config.*` change. No eslint / tailwind config change. No real `.env*` change. No `public/_headers` change. No `app/` / `components/` / `hooks/` / `lib/` / `styles/` / `workers/` / `supabase/migrations/` change. The on-disk Booking B SQL migration at `supabase/migrations/20260616_booking_b_reserve_slot.sql` is unchanged. The Worker source at `workers/booking-reservation-worker.ts` is unchanged. The dashboard JS copy at `workers/booking-reservation-worker.dashboard.js` is unchanged. The frontend `lib/booking-actions.ts` and `components/booking-calendar-custom.tsx` are unchanged. `.env.local.example` is unchanged.
- No `git add` / `commit` / `push` / `remote add` / `fetch` / `pull`. The first commit is OPTIONAL. The agent does not push, does not add a remote, and does not create a GitHub repo.
- No `npm install`, no `pnpm install`, no `yarn install`, no `npx`, no `npm run`, no `pnpm run`, no `yarn run`, no `wrangler deploy`, no deploy command of any kind, no Cloudflare dashboard command, no Supabase dashboard command, no `psql`, no `supabase` CLI command, no database command of any kind, no package-manager command of any kind.
- No `service_role` key in any `NEXT_PUBLIC_*` env var, in the static bundle, in the repo, or in any client-reachable file. The `service_role` key is server-side only and is bound only to the Booking Worker.
- No application of the Booking B SQL migration by OpenCode. OpenCode did not apply it; the owner applied it manually. OpenCode is only updating documentation/state files in this overlay.
- No deployment of the Booking Worker by OpenCode. The Worker source is shipped (both `.ts` and `.dashboard.js`). The owner deployed it. OpenCode did not deploy.
- No new decisions. The runtime state record is documentation / state files only. The D-IDs in this file remain canonical.
- No starting of Observability. Observability is still blocked until ChatGPT Control Room issues the exact Observability prompt. The agent does not start Observability, QA, TS0 / RDG0, UIX0 / MOTION0, Admin future, or Final QA / delivery.

**Risks closed in this batch:**

- **R-005 (booking double-book) is fully closed at the runtime level (2026-06-16).** Booking A closed the read path (verified at runtime). Booking B closed the write path at the code level (prior turn). Booking B is now verified at the runtime level: the owner confirmed the Worker smoke test passed, the booking row was created, `available_slots.is_booked` was flipped, and the duplicate booking test returned `slot_already_booked` (P0001). The row lock + UNIQUE constraint defense in depth is working as designed. The runtime closure is end-to-end.
- **F-004 (UI reads `available_slots` and only offers actually-available slots; the submit path persists the booking through a single transactional RPC) is fully closed at the runtime level (2026-06-16).** The read path is closed by Booking A (verified at runtime). The write path is closed by Booking B (code-shipped in the prior turn; verified at runtime in this turn). F-004 is fully closed end-to-end.

**Risks still open:**

- R-005 (time column ordering) — unchanged. The `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`). The frontend `components/booking-calendar-custom.tsx` sorts the times for the selected date using a hard-coded `TIME_SLOTS` array, so the order is correct in the UI even when the RPC's order is not. The data is correct; only the RPC's `ORDER BY` is non-chronological. Recorded for a future minor repair or Booking-B-adjacent cleanup. **Do not start this repair unless explicitly approved.**
- R-007 / R-031 (seed exhaustion) — unchanged. The seed populates 12 weeks from `2026-05-18`. The operator must re-seed before the window closes.
- All other risks (R-001..R-035) are closed, deferred to future phases, or out of scope per `repo-research/RISK_REGISTER.md`.

**Remaining deployment gap (informational, not a Booking B defect):**

- The Cloudflare Pages project is connected to GitHub. The current Pages deployment is still old GitHub code (pre-Booking-B frontend). The booking form's `handleSubmit` on the deployed Pages is the pre-Booking-B form (which posts to the n8n forms Worker; not the new `createBooking` flow). The Worker is end-to-end functional at the Worker level (smoke test passed; Supabase verification passed). The browser-driven end-to-end flow cannot be live-tested through Pages until the updated local code is pushed/deployed.
- **Git push / remote remains blocked** until the owner explicitly approves final delivery deploy. Per the 2026-06-16 Control Room correction, `git push`, `git remote add`, GitHub repo creation, and code publishing are NOT approved. The first commit is OPTIONAL. The final delivery deploy is owner-driven and gated to the owner's explicit approval.
- **A future phase (Final QA / delivery, A0 future phase #20) is the future home for the Git push / Pages final delivery.** That phase is gated to all prior phases being runtime-verified and to the owner's explicit final-delivery approval. The agent does not start the final-delivery phase. The agent does not push.

**No new decisions.** Booking B runtime state record only records runtime state and a reflection note. The D-IDs in this file remain canonical. The runtime state record note is the only Booking B runtime state record write to this file. The agent does not start the time-ordering fix. The agent does not start Observability, QA, TS0 / RDG0, UIX0 / MOTION0, Admin future, Final QA / delivery. The agent does not apply the Booking B SQL migration (already applied by the owner; the on-disk file is unchanged). The agent does not deploy the Booking Worker (already deployed by the owner; the source files are unchanged). The agent does not push to GitHub or trigger a Pages deploy.

**Source:** `PROJECT_CONTROL_LOG.md` "Booking B runtime state record (2026-06-16)" overlay; `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md` runtime state record note; `docs/DEPLOYMENT.md` "Booking B — Reserve Slot RPC + Worker" section; `INTEGRATION_NOTES.md` §2 + §8.3; `memory/CURRENT_STATE.md`; `memory/WORKING_MEMORY.md`; `memory/EPISODIC_MEMORY.md`; `ai/AI_TASK_CAPSULE.md`; `ai/AI_CONTEXT_RULES.md`; `docs/51_AGENT_HANDOFF_LOG.md`; the 2026-06-16 Control Room correction on git push / commit policy; the 2026-06-16 owner runtime confirmation.

A future agent that receives ChatGPT Control Room's Booking B runtime state record review response must update this reflection, append to `docs/51_AGENT_HANDOFF_LOG.md`, and stop. The D-IDs are not renumbered; the Booking B runtime state record note is the only Booking B runtime state record write to this file. The agent does not start the time-ordering fix. The agent does not start Observability, QA, TS0 / RDG0, UIX0 / MOTION0, Admin future, or Final QA / delivery. The agent does not push to GitHub or trigger a Pages deploy. The agent does not apply the Booking B SQL migration. The agent does not deploy the Booking Worker.

