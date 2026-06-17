# Episodic Memory

Time-ordered log of meaningful events. Append-only. Edit history.

## 2026-05 (approx.)

- `app/(public)/privacy/page.tsx` and `app/(public)/terms/page.tsx` were authored with "Last updated: May 2026".
- `lib/booking-schema.sql` seeds available slots from `2026-05-18` (Monday) for 12 weeks.
- `pnpm-lock.yaml` was created. `package-lock.json` already existed. Both committed.

## 2026-06-15

### DOC-DISCOVERY phase

- DOC-DISCOVERY-AGENT scanned the full repo and produced a 15-section report.
- Findings: real working app, eight structural risks, all required memory/AI/docs files missing, no tooling installed.
- Outcome: `Status: Repair needed`. No files changed.
- Decision: enter DOC-MEMORY-REPAIR.

### DOC-MEMORY-REPAIR phase

- DOC-MEMORY-REPAIR-AGENT created the full foundation tree:
  - 3 root files: `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`, `docs/51_AGENT_HANDOFF_LOG.md`
  - 9 memory files in `memory/`
  - 5 AI context files in `ai/`
  - 9 docs files in `docs/`
  - 1 file in `repo-research/`
- No functional source files were edited.
- No package manager was run.
- No tooling was installed.
- Outcome: `Status: Passed` pending ChatGPT Control Room review.
- Next phase request: PM1 — Plan.

### DOC-MEMORY-REPAIR — owner direction addendum (D-011, D-012)

- Owner added two non-coding requirements mid-phase:
  - **D-011** — premium, agency-grade animation direction inspired by `befluence.pro` (reference only, do not copy). No code, no installs.
  - **D-012** — design-taste guidance via Impeccable (frontend review) and Emil Kowalski / Agents with Taste (motion taste). No installs, no `npx skills add`, no `npx impeccable install`, no MCP setup.
- Both directions were captured as decisions in `memory/IMPORTANT_DECISIONS.md` (D-011, D-012) and propagated to:
  - `memory/SEMANTIC_MEMORY.md` — design/motion posture
  - `memory/CURRENT_STATE.md` — blocked state extended
  - `memory/PROJECT_CONTEXT_PACK.md` — one-page orientation
  - `memory/WORKING_MEMORY.md` — open questions for Control Room
  - `memory/ACTIVE_TASK_CONTEXT.md` — explicit "do not" rules
  - `ai/AI_CONTEXT_RULES.md` — tooling and code rules
  - `ai/AI_TASK_CAPSULE.md` — never-do list
  - `docs/ROADMAP.md` — new Phase 3.5 (UIX0 / MOTION0) with R-3.5.1 to R-3.5.4
  - `docs/FEATURES.md` — design and motion target section
  - `docs/QA_CHECKLIST.md` — motion + taste + performance QA targets
  - `docs/ARCHITECTURE.md` — future motion architecture constraints
- No new files were created for the addendum; existing files were updated in place.
- DOC-MEMORY-REPAIR is now ready to hand off.

### 2026-06-15 — OVERNIGHT-SAFE-PRE8-AND-PM1-PREP batch (start)

- Long-running safe batch started while owner is away.
- Goal: run PRE8 checkpoint, do a documentation consistency audit, expand the risk register, prepare PM1 input materials, and produce strategy briefs for README, lockfile, security, booking, tooling, UIX0/MOTION0, and QA. No code, no installs, no MCP setup, no PM1 execution.
- Safety snapshot taken: not a git repo, allowed zones are populated, no source files modified by this session.
- State files updated with the overlay (PROJECT_CONTROL_LOG.md, EPISODIC_MEMORY.md, ACTIVE_TASK_CONTEXT.md, CURRENT_STATE.md, AI_TASK_CAPSULE.md, handoff log).
- PRE8 checkpoint, audits, and strategy briefs will follow in subsequent passes.

### 2026-06-15 — OVERNIGHT batch passes 1 through 15 (end)

- All 15 passes completed in a single session.
- Files created in `repo-research/`:
  - `PRE8_CHECKPOINT.md` (PRE8 passed)
  - `DOCUMENTATION_CONSISTENCY_AUDIT.md` (20 contradictions cataloged, 10 weak spots cataloged, 6 overlap/duplicate findings)
  - `PM1_INPUT_BRIEF.md` (workstreams A–J, dependencies, sequencing, acceptance criteria)
  - `RISK_REGISTER.md` (35 risks R-001 to R-035)
  - `README_REPAIR_SPEC.md` (full spec, 10 acceptance criteria)
  - `LOCKFILE_DECISION_BRIEF.md` (npm recommended)
  - `SECURITY_HARDENING_BRIEF.md` (B + D recommended)
  - `BOOKING_CORRECTNESS_BRIEF.md` (A + C MVP, B + D future)
  - `TOOLING_APPROVAL_BRIEF.md` (recommended install order)
  - `UIX0_MOTION0_BRIEF.md` (first slice recommendation)
  - `QA_STRATEGY_BRIEF.md` (config-only first slice)
  - `FEATURE_TRACEABILITY_MATRIX.md` (every public + admin feature traced)
  - `AGENT_BOUNDARY_MAP.md` (ownership rules per file class)
  - `OPEN_QUESTIONS.md` (Q-01 to Q-20)
- Files modified: `PROJECT_CONTROL_LOG.md`, `memory/EPISODIC_MEMORY.md`, `memory/ACTIVE_TASK_CONTEXT.md`, `memory/CURRENT_STATE.md`, `memory/WORKING_MEMORY.md`, `memory/IMPORTANT_DECISIONS.md`, `ai/AI_TASK_CAPSULE.md`, `ai/AI_CONTEXT_RULES.md`, `ai/AI_FILE_OWNERSHIP.md`, `docs/51_AGENT_HANDOFF_LOG.md`.
- Two new decisions captured: D-013 (risk register is canonical) and D-014 (strategy briefs are PM1 inputs, not PM1 deliverables).
- Safety: not a git repo, no source files modified, no package files modified, no `package.json` change, no tooling install, no MCP setup, no `npx` command run.
- Status: ready for ChatGPT Control Room review.

## 2026-06-16 — PM1 batch (write-only)

- Long-running PM1 batch executed in two stages: (1) PM1-PLAN-AGENT ran in plan mode and printed the full PM1 plan to chat (write blocked by OpenCode plan mode); (2) PM1-FILE-APPLY-AGENT (build mode) wrote the plan to disk and updated the required state files.
- Files created in `docs/`:
  - `docs/PM1_PLAN.md` (primary deliverable; 14 workstreams; ~600 lines)
- Files created in `repo-research/`:
  - `repo-research/PM1_DECISION_MATRIX.md` (D-15..D-27 detail with rationale, evidence, owner question per decision)
  - `repo-research/PM1_PHASE_SEQUENCE.md` (27 phases with gates, depends-on, file-ownership rules, parallelism)
- State files modified: `PROJECT_CONTROL_LOG.md`, `memory/CURRENT_STATE.md`, `memory/ACTIVE_TASK_CONTEXT.md`, `memory/WORKING_MEMORY.md`, `memory/EPISODIC_MEMORY.md`, `memory/IMPORTANT_DECISIONS.md` (D-015..D-027 added), `ai/AI_TASK_CAPSULE.md`, `ai/AI_CONTEXT_RULES.md`, `docs/51_AGENT_HANDOFF_LOG.md`.
- 13 new PM1 recommendations captured as D-015..D-027 (see `memory/IMPORTANT_DECISIONS.md`). These are recommendations, not owner decisions.
- Git / repo root status: PM1 documented as a planning concern. `F:\CodeOutfitters` is not a git repo. Q-21 / D-27 surfaced for owner confirmation.
- Safety: no source files modified, no package files modified, no `package.json` change, no tooling install, no MCP setup, no `npx` command run, no lockfile edits, no `README.md` edits, no `DEPLOY.md` delete, no CI config file created, no test file created, no D0 / A0 / UIX0 / MOTION0 / IMPL work started.
- Status: PM1 plan file written; pending ChatGPT Control Room review. D0, A0, UIX0 / MOTION0, TS0 / RDG0, coding, and tool installation all remain blocked.

## 2026-06-16 — PD1 batch (write-only)

- **Agent:** PD1-DECISION-LOCK-AGENT.
- **Phase status:** written; pending ChatGPT Control Room review.
- **Goal:** convert the PM1 owner decision register (D-015..D-027) and the bundled follow-up items (Q-13..Q-21) into a clear default-or-approve ballot so the owner and ChatGPT Control Room can lock exact defaults before D0 begins. Decision-lock phase only.
- **Files created in this batch:**
  - `docs/PD1_DECISION_LOCK.md` (primary deliverable; 13 PM1 decisions + 6 architectural-path decisions + 9 follow-up items normalized to a single ballot; lock-status legend; D0 readiness assessment; gates-still-blocked list).
  - `repo-research/PD1_OWNER_DECISION_BALLOT.md` (optional support file; one row per decision for fast owner response).
- **State files modified:**
  - `PROJECT_CONTROL_LOG.md` (PD1 batch overlay; phase history row added; gate status row added).
  - `memory/CURRENT_STATE.md` (snapshot updated to PD1 written; pending review).
  - `memory/ACTIVE_TASK_CONTEXT.md` (task replaced with PD1 — Decision Lock; definition of done updated).
  - `memory/WORKING_MEMORY.md` (PD1 ballot; architectural-path decisions; bundled follow-up items; D0 readiness note).
  - `memory/EPISODIC_MEMORY.md` (this entry).
  - `memory/IMPORTANT_DECISIONS.md` (PD1 lock-tags appended to D-015..D-027; no new decisions).
  - `ai/AI_TASK_CAPSULE.md` (phase line updated; never-do list reaffirmed).
  - `ai/AI_CONTEXT_RULES.md` (PD1 hard rule added; ballot handling note).
  - `docs/51_AGENT_HANDOFF_LOG.md` (PD1 entry appended).
- **Files NOT modified:** `app/**`, `components/**`, `hooks/**`, `lib/**`, `public/**`, `package.json`, either lockfile, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `components.json`, `.env*`, `.gitignore`, `README.md`, `DEPLOY.md` (root), `INTEGRATION_NOTES.md`. `INTEGRATION_NOTES.md` was not modified in this batch because no integration contract changed in PD1.
- **No new decisions.** PD1 only normalizes the existing PM1 register (D-015..D-027) and the PM1 follow-up items (Q-13..Q-21) into a single ballot. The D-IDs in `memory/IMPORTANT_DECISIONS.md` remain canonical.
- **D0 readiness:** D0 may proceed against the recommended defaults if the owner returns Accept on all rows. The owner can also override individual rows; overrides are recorded in the response and the next agent reads them first.
- **Safety:** no source files modified, no package files modified, no `package.json` change, no tooling install, no MCP setup, no `npx` command run, no lockfile edits, no `README.md` edits, no `DEPLOY.md` delete, no CI config file created, no test file created, no D0 / A0 / UIX0 / MOTION0 / IMPL work started. All operations stayed in the allowed change zones.
- **Status:** PD1 plan file and ballot written; pending ChatGPT Control Room review. D0, A0, UIX0 / MOTION0, TS0 / RDG0, coding, and tool installation all remain blocked.

## 2026-06-16 — PD1 addendum (Ponytail tooling candidate)

- **Agent:** PD1-DECISION-LOCK-AGENT (same agent, same session, additive only).
- **Phase status:** written; pending ChatGPT Control Room review.
- **Goal:** record **Ponytail** (third-party dev / AI tool, owner-asked candidate) as a candidate for the future TS0 / RDG0 submission. Do not install, do not clone, do not run any command, do not add to `package.json`, do not configure.
- **Status:** **NOT APPROVED.** Type: developer / AI tooling candidate. Not a runtime dependency by default. Required gate: **TS0 / RDG0**. Required owner input: exact official GitHub repo URL, pinned version, scope (global / per-project / reference-only; default: reference-only). Required evaluation (answered in a future TS0 / RDG0 submission, not in PD1): what it does, safety / maintenance, install footprint, overlap with existing candidates (Graphify, Repomix, Context7, Impeccable, Emil Kowalski), scope decision, free / open-source, production / runtime impact.
- **Files modified in this addendum:** `docs/PD1_DECISION_LOCK.md` (§6.1 added; safety confirmation updated; gates-still-blocked list updated; TOC updated); `repo-research/PD1_OWNER_DECISION_BALLOT.md` (Section A.1 + Section C.1 added; safety confirmation updated); `memory/WORKING_MEMORY.md` (Ponytail section added); `memory/IMPORTANT_DECISIONS.md` (Ponytail section added); `ai/AI_CONTEXT_RULES.md` (Ponytail hard rule added); `ai/AI_TASK_CAPSULE.md` (Ponytail line added); `docs/51_AGENT_HANDOFF_LOG.md` (this entry); `memory/EPISODIC_MEMORY.md` (this event).
- **Files NOT modified:** `app/**`, `components/**`, `hooks/**`, `lib/**`, `public/**`, `package.json`, either lockfile, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `components.json`, `.env*`, `.gitignore`, `README.md`, `DEPLOY.md` (root), `INTEGRATION_NOTES.md`, `PROJECT_CONTROL_LOG.md`.
- **Hard rules reaffirmed in this addendum:** no install, no clone, no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install, no code, no README / DEPLOY edit, no security / booking fix, no D0 / A0 / UIX0 / MOTION0 / IMPL start, no git init. PD1 only records the candidate.
- **Status:** PD1 addendum written; pending ChatGPT Control Room review. Ponytail is a candidate only.

## 2026-06-16 — D0 batch (write-only)

- **Agent:** D0-DESIGN-ARCHITECTURE-AGENT.
- **Phase status:** written; pending ChatGPT Control Room review.
- **Goal:** convert PM1 and PD1 into a concrete design / architecture plan for security, booking, observability, admin, QA / CI, tooling, and UIX0 / MOTION0. Plan-only. No code, no installs, no MCP setup, no lockfile edits, no `package.json` edits, no README edits, no security / booking fixes, no A0 / UIX0 / MOTION0 / IMPL work started.
- **Files created in this batch:**
  - `docs/D0_ARCHITECTURE_DECISIONS.md` (primary deliverable; 12 areas: snapshot, target direction, security, booking, observability, admin, QA / CI, tooling, UIX0 / MOTION0, phase boundaries, risks, cross-cutting; PD1 reflection table; D0 readiness assessment; gates-still-blocked list; safety confirmation).
  - `docs/D0_SYSTEM_DESIGN.md` (primary deliverable; target architecture, security, booking, documentation / cleanup, QA / CI, tooling, UIX0 / MOTION0, admin, observability design diagrams and contracts; phase boundary design; D0 acceptance criteria; safety confirmation).
  - `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` (primary deliverable; hard rules, allowed change zones, off-limits, phase-by-phase implementation boundaries, integration contract register, risk-to-phase mapping, rollback posture per phase, owner-confirmation checkpoints; safety confirmation).
- **State files modified:**
  - `PROJECT_CONTROL_LOG.md` (D0 batch overlay; "Current Phase" updated to D0; phase history row added; gate status row updated).
  - `memory/CURRENT_STATE.md` (snapshot updated to D0 written; pending review).
  - `memory/ACTIVE_TASK_CONTEXT.md` (task replaced with D0 — Design / Architecture; definition of done updated).
  - `memory/WORKING_MEMORY.md` (D0 plan summary; PD1 LOCKED DEFAULTS reflection table; architectural-path options reflection; bundled follow-up items reflection; Ponytail carried forward; D0 readiness note).
  - `memory/EPISODIC_MEMORY.md` (this entry).
  - `memory/IMPORTANT_DECISIONS.md` (D0 reflection note appended; no new decisions).
  - `ai/AI_TASK_CAPSULE.md` (phase line updated to D0; D0 reflection note).
  - `ai/AI_CONTEXT_RULES.md` (D0 hard rule added; future-phase boundary note).
  - `docs/51_AGENT_HANDOFF_LOG.md` (D0 entry appended).
- **Files NOT modified:** `app/**`, `components/**`, `hooks/**`, `lib/**`, `public/**`, `package.json`, either lockfile, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `components.json`, `.env*`, `.gitignore`, `README.md`, `DEPLOY.md` (root), `INTEGRATION_NOTES.md`. `INTEGRATION_NOTES.md` was not modified in this batch because no integration contract changed in D0; D0 only plans integration architecture, it does not change current integration contracts.
- **No new decisions.** D0 only reflects PM1 + PD1. The D-IDs in `memory/IMPORTANT_DECISIONS.md` remain canonical. A future D0 reflection note in `memory/IMPORTANT_DECISIONS.md` records that D0 carries the PD1 LOCKED DEFAULTS and the PD1-shadowed architectural-path options into the target architecture; A0 will plan against that.
- **D0 readiness:** A0 may proceed against the D0 plan and the PD1 LOCKED DEFAULTS if the owner returns Accept on the D0 plan. The owner can also override individual rows; overrides are recorded in the response and the next agent reads them first.
- **Ponytail:** carried forward as candidate only. NOT APPROVED. Gated to TS0 / RDG0. No install, no clone, no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install, in this batch or any pre-approval phase.
- **Safety:** no source files modified, no package files modified, no `package.json` change, no tooling install, no MCP setup, no `npx` command run, no lockfile edits, no `README.md` edits, no `DEPLOY.md` delete, no CI config file created, no test file created, no A0 / UIX0 / MOTION0 / TS0 / RDG0 / IMPL work started, no Ponytail install / clone / config / evaluation, no git init. All operations stayed in the allowed change zones.
- **Status:** D0 plan files written; pending ChatGPT Control Room review. A0, UIX0 / MOTION0, TS0 / RDG0, coding, and tool installation all remain blocked.

## 2026-06-16 — A0 batch (write-only)

- **Agent:** A0-ACTION-PLAN-AGENT.
- **Phase status:** written; pending ChatGPT Control Room review.
- **Goal:** convert PM1, PD1, D0, and the D0 ECC addendum into a concrete PR-by-PR, file-by-file, owner-decision-by-owner-decision plan for the future phases that PM1 / PD1 / D0 defined. Plan-only. No code, no installs, no MCP setup, no lockfile edits, no `package.json` edits, no README edits, no security / booking fixes, no Setup / Cleanup A / Cleanup B / Security 1..5 / Booking A / Booking B / Observability / QA Slice 0..3 / UIX0 / MOTION0 Planning / UIX0 / MOTION0 first slice / UIX0 / MOTION0 later slices / Admin future / Final QA / delivery work started, no git init, no Ponytail install / clone / copy / configure / evaluation, no ECC / affaan-m/ecc install / clone / copy / configure / evaluation.
- **Files created in this batch:**
  - `docs/A0_ACTION_PLAN.md` (primary deliverable; current gate status; approved assumptions from PM1 / PD1 / D0; full 20-phase sequence with purpose, must-not-do, allowed file zones, owner decisions, acceptance criteria, rollback plans, Control Room stop points; hard rules reaffirmed; A0 acceptance criteria; safety confirmation; recommended next step).
  - `repo-research/A0_PHASE_EXECUTION_QUEUE.md` (primary deliverable; the future phase queue table: Order, Phase, Purpose, Depends On, Allowed Files Later, Forbidden Now, Control Room Gate).
  - `repo-research/A0_AGENT_ASSIGNMENT_MATRIX.md` (primary deliverable; the future agent assignment table: Agent, Future Phase, Responsibility, Allowed Files Later, Required Inputs, Stop Condition).
  - `repo-research/A0_CHANGE_ZONE_MAP.md` (primary deliverable; the file-zone classification table: File / Zone, Phase Allowed, Why, Approval Required, Notes).
- **State files modified:**
  - `PROJECT_CONTROL_LOG.md` (A0 batch overlay; "Current Phase" line updated to A0; phase history row added; gate status row updated).
  - `memory/CURRENT_STATE.md` (snapshot updated to A0 written; pending review).
  - `memory/ACTIVE_TASK_CONTEXT.md` (task replaced with A0 — Action / Build Plan; definition of done updated).
  - `memory/WORKING_MEMORY.md` (A0 plan summary; PD1 LOCKED DEFAULTS reflection table; architectural-path options reflection; bundled follow-up items reflection; Ponytail carried forward; D0 ECC carried forward; A0 integration sequencing clarifications; A0 readiness note).
  - `memory/EPISODIC_MEMORY.md` (this entry).
  - `memory/IMPORTANT_DECISIONS.md` (A0 reflection note appended; no new decisions; existing D-IDs remain canonical; "PD1 lock-tags → Owner overrides" table extended for A0; "A0 reflection (2026-06-16) → Owner overrides" subsection added).
  - `ai/AI_TASK_CAPSULE.md` (phase line updated to A0; A0 reflection note in the owner-direction summary).
  - `ai/AI_CONTEXT_RULES.md` (A0 hard rule added; future-phase boundary rule reaffirmed; tooling-candidate rules reaffirmed).
  - `docs/51_AGENT_HANDOFF_LOG.md` (A0 entry appended).
- **Files NOT modified:** `app/**`, `components/**`, `hooks/**`, `lib/**`, `public/**`, `package.json`, either lockfile, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `components.json`, `.env*`, `.gitignore`, `README.md`, `DEPLOY.md` (root).
- **Files updated additively (prose only):** `INTEGRATION_NOTES.md` (new §8 "A0 integration sequencing clarifications" appended; prose only; no breaking changes; clarifies the Anthropic Worker path, the n8n per-form secret, the Supabase RLS strategy, the observability alert channel, the git / repo root setup contract, the Ponytail / ECC candidate status, the admin persistence contract, and the UIX0 / MOTION0 first-slice contract).
- **No new decisions.** A0 only reflects PM1 + PD1 + D0 + D0 ECC addendum into the future execution queue. The D-IDs in `memory/IMPORTANT_DECISIONS.md` remain canonical. A0 appends an A0 reflection note and seeds the A0 owner-overrides subsection. Owner overrides, when received, are recorded in `memory/IMPORTANT_DECISIONS.md` under "PD1 lock-tags → Owner overrides" and "A0 reflection (2026-06-16) → Owner overrides."
- **Ponytail:** carried forward as candidate only. NOT APPROVED. Gated to TS0 / RDG0. No install, no clone, no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install, in this batch or any pre-approval phase.
- **ECC / affaan-m/ecc:** carried forward as candidate only. NOT APPROVED. Gated to TS0 / RDG0. No install, no clone, no `git clone`, no copy of config folders, no copy of `.opencode/`, `.codex/`, `.claude/`, `.mcp.json`, or any MCP configs; no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `pip`, no `playwright` install, no package-manager command of any kind, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install, in this batch or any pre-approval phase.
- **Safety:** no source files modified, no package files modified, no `package.json` change, no tooling install, no MCP setup, no `npx` command run, no lockfile edits, no `README.md` edits, no `DEPLOY.md` delete, no CI config file created, no test file created, no Setup / Cleanup A / Cleanup B / Security 1..5 / Booking A / Booking B / Observability / QA Slice 0..3 / UIX0 / MOTION0 Planning / UIX0 / MOTION0 first slice / UIX0 / MOTION0 later slices / Admin future / Final QA / delivery work started, no Ponytail install / clone / copy / configure / evaluation, no ECC / affaan-m/ecc install / clone / copy / configure / evaluation, no git init. All operations stayed in the allowed change zones.
- **Status:** A0 plan files written; pending ChatGPT Control Room review. All IMPL phases, UIX0 / MOTION0 implementation, TS0 / RDG0 tooling, coding, and tool installation remain blocked.

## 2026-06-16 — Setup batch (write-only; first commit not in this batch)

- **Agent:** SETUP-AGENT.
- **Phase status:** run; first commit pending. A0 (the parent plan) is still pending ChatGPT Control Room review. Setup is not a substitute for A0 review.
- **Goal:** verify the project root, init git if needed, review `.gitignore`, prepare the first commit plan. No code, no installs, no MCP setup, no lockfile edits, no `package.json` edits, no README edits, no security fixes, no booking fixes, no Cleanup A / Cleanup B / Security 1..5 / Booking A / Booking B / Observability / QA Slice 0..3 / UIX0 / MOTION0 Planning / UIX0 / MOTION0 first slice / UIX0 / MOTION0 later slices / Admin future / Final QA / delivery work started, no Ponytail install / clone / copy / configure / evaluation, no ECC / affaan-m/ecc install / clone / copy / configure / evaluation.
- **Root verification:** `pwd` returned `F:\CodeOutfitters`. `git rev-parse --show-toplevel` (after `git init`) returned `F:/CodeOutfitters`. Root matches the expected project root. Key project files confirmed: `package.json`, `docs/A0_ACTION_PLAN.md`, `PROJECT_CONTROL_LOG.md`, `memory/CURRENT_STATE.md`, `ai/AI_TASK_CAPSULE.md`.
- **Git init:** `git init -b main` run at the confirmed root. No commits created. No remote added. No push. Branch: `main`.
- **`.gitignore` review and repair:** the pre-existing file had a corruption on line 15 (`.DS_Storenode_modules` — a join of `.DS_Store` and `node_modules`). Repaired by splitting into two lines. Missing safe entries added: `dist/`, `build/`, `tsconfig.tsbuildinfo`, `*.log`, `logs/`. `node_modules/` normalized to trailing-slash form. No broad patterns added; no source-file hides; no lockfile pre-emption; no `pnpm-lock.yaml` pre-ignore. The `pnpm-lock.yaml` is intentionally NOT pre-ignored; that decision belongs to Cleanup B per D-015.
- **Files created in this batch:**
  - `repo-research/SETUP_FIRST_COMMIT_PLAN.md` (primary deliverable; expected files, files NOT to commit, sensitive files, recommended commit message, manual owner commands, reversibility, gates-still-blocked, safety confirmation).
- **Files modified in this batch:**
  - `.gitignore` (corruption repair + safe hygiene entries; per Setup brief, this is the only runtime/config file allowed).
  - `PROJECT_CONTROL_LOG.md` (Setup batch overlay; phase history row added; gate status row updated).
  - `memory/CURRENT_STATE.md` (snapshot extended with Setup batch; blocked list updated; exact next gate added).
  - `memory/ACTIVE_TASK_CONTEXT.md` (task replaced with Setup — A0 #1; definition of done updated).
  - `memory/WORKING_MEMORY.md` (current task updated; phase gate updated; active restrictions updated; Setup outputs section appended; next concrete action note).
  - `memory/EPISODIC_MEMORY.md` (this entry).
  - `memory/IMPORTANT_DECISIONS.md` (Setup reflection note appended; D-027 confirmed for `git init` only via the Setup phase prompt; first commit is gated to the owner or a future Setup-AGENT invocation explicitly told to commit).
  - `ai/AI_TASK_CAPSULE.md` (Setup phase row added; D-027 Setup-specific line).
  - `ai/AI_CONTEXT_RULES.md` (Setup hard rule added; git init rule reaffirmed; first commit gate rule added).
  - `docs/51_AGENT_HANDOFF_LOG.md` (Setup entry appended).
- **Files NOT modified:** `app/**`, `components/**`, `hooks/**`, `lib/**`, `public/**`, `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `components.json`, `next-env.d.ts`, `.env*`, `README.md`, `DEPLOY.md` (root), `INTEGRATION_NOTES.md`. `INTEGRATION_NOTES.md` was not modified (no integration contract changed in Setup; the git / repo root setup contract is already documented in §8).
- **No new decisions.** Setup only records the D-027 confirmation for `git init` and the `.gitignore` repair. The D-IDs in `memory/IMPORTANT_DECISIONS.md` remain canonical. D-027 is reaffirmed as `LOCKED DEFAULT`; Setup running before A0 review is a deliberate exception gated by the owner's Setup phase prompt.
- **No commits created in this batch.** The first commit is left to the owner (manual commands in `repo-research/SETUP_FIRST_COMMIT_PLAN.md` §8) or to a future Setup-AGENT invocation explicitly told to commit.
- **Ponytail:** candidate only. NOT APPROVED. Gated to TS0 / RDG0. No install, no clone, no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install, in this batch or any pre-approval phase.
- **ECC / affaan-m/ecc:** candidate only. NOT APPROVED. Gated to TS0 / RDG0. No install, no clone, no `git clone`, no copy of config folders, no copy of `.opencode/`, `.codex/`, `.claude/`, `.mcp.json`, or any MCP configs; no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `pip`, no `playwright` install, no package-manager command of any kind, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install, in this batch or any pre-approval phase.
- **Safety:** no source files modified, no package files modified, no `package.json` change, no tooling install, no MCP setup, no `npx` command run, no lockfile edits, no `README.md` edits, no `DEPLOY.md` delete, no CI config file created, no test file created, no Cleanup A / Cleanup B / Security 1..5 / Booking A / Booking B / Observability / QA Slice 0..3 / UIX0 / MOTION0 Planning / UIX0 / MOTION0 first slice / UIX0 / MOTION0 later slices / Admin future / Final QA / delivery work started, no Ponytail install / clone / copy / configure / evaluation, no ECC / affaan-m/ecc install / clone / copy / configure / evaluation. All operations stayed in the allowed change zones. The only "runtime" file modified is `.gitignore`, which is allowed by the Setup brief.
- **Status:** Setup phase run; first commit pending; A0 still pending ChatGPT Control Room review. The next gate after the first commit is Cleanup A (gated to A0 + Setup approval).

## 2026-06-16 � Git push / commit policy update (Control Room correction; documentation-only; no git operations)

- **Agent:** SETUP-AGENT (same session, additive only).
- **Phase status:** run; documentation-only. No git operations performed. No source / package / lockfile / runtime / config files were touched.
- **Goal:** update the project state and setup notes to reflect the owner's policy: no push, no remote, no GitHub repo, no publish; first baseline commit is OPTIONAL (not required before Cleanup A); Cleanup A may proceed after ChatGPT Control Room approval without a baseline commit.
- **Owner direction (captured verbatim):** the owner does not want the project pushed in chunks; the owner wants the complete project pushed one time at the end; git init already happened locally and is accepted; git push is NOT approved; adding a remote is NOT approved; pushing to GitHub is NOT approved; first baseline commit is now OPTIONAL, not required before Cleanup A; Cleanup A may proceed after ChatGPT Control Room approval without a baseline commit, if the owner wants one final commit only.
- **Default policy recorded:** no remote push until final delivery approval; no remote setup until final delivery approval; do not run git push; do not run git remote add; do not create a GitHub repo; do not publish the code; local commits are OPTIONAL and owner-driven; the agent does not run git add, git commit, git push, git remote add, git fetch, or git pull from this batch onward without explicit owner approval per occurrence.
- **Effect on Setup:** the git init -b main at F:\CodeOutfitters is accepted; do not undo it; do not re-init. The first commit, as documented in epo-research/SETUP_FIRST_COMMIT_PLAN.md, is now OPTIONAL, not required. Cleanup A does not require a baseline commit.
- **Effect on Cleanup B:** the "git status must be clean before deletion" rule is relaxed; the agent must not create commits to make git status clean; the owner creates commits only if and when they want to.
- **Effect on PR-style review:** PR-style review is replaced by **phase-stop review**. The agent stops after each gated phase; the owner reviews; the owner decides whether to commit locally and whether to advance. There is no GitHub PR review yet.
- **Effect on tooling that depends on a remote:** none in pre-final-delivery phases. The remote is needed only at final delivery. The agent must not block on "no remote" in any pre-final-delivery phase.
- **Files updated in this batch:**
  - PROJECT_CONTROL_LOG.md (new overlay: "Git push / commit policy update (2026-06-16) � Control Room correction").
  - memory/CURRENT_STATE.md (snapshot extended; blocked list updated; "What is blocked" updated; "What must not happen next" extended with push / remote / GitHub rules; "Exact next gate after Setup" rewritten).
  - memory/ACTIVE_TASK_CONTEXT.md (task replaced with Git policy update; in-scope and out-of-scope lists updated; definition of done carry-forward).
  - memory/WORKING_MEMORY.md (current task updated; phase gate updated; active restrictions extended with push / remote / GitHub rules; Setup phase outputs carry-forward; "Git push / commit policy" section appended).
  - memory/EPISODIC_MEMORY.md (this event).
  - memory/IMPORTANT_DECISIONS.md (Setup reflection carry-forward; new "Git push / commit policy (2026-06-16) � Control Room correction" section appended; no new D-IDs; owner-overrides table carry-forward).
  - i/AI_TASK_CAPSULE.md (D-027 Setup-specific line extended with the new policy; never-do list extended with push / remote / GitHub rules).
  - i/AI_CONTEXT_RULES.md (Setup hard rule extended; first commit gate rule softened; new "git push / commit policy rule" hard rule added).
  - docs/51_AGENT_HANDOFF_LOG.md (this event).
  - epo-research/SETUP_FIRST_COMMIT_PLAN.md (first commit marked optional; new policy section at the top; manual owner commands kept as-is and marked optional).
  - docs/A0_ACTION_PLAN.md (Setup �5.1 updated: "first commit exists" softened to optional; Control Room stop points �6 updated; "What it will do" / "What it must not do" / "Allowed file zones" carry forward with optional-commit language).
  - epo-research/A0_PHASE_EXECUTION_QUEUE.md (Setup row #1: "first commit plan" instead of "first commit"; PR-style review replaced by phase-stop review).
- **Files NOT updated:** pp/**, components/**, hooks/**, lib/**, public/**, package.json, package-lock.json, pnpm-lock.yaml, 	sconfig.json, 
ext.config.mjs, postcss.config.mjs, components.json, 
ext-env.d.ts, .env*, README.md, DEPLOY.md (root), INTEGRATION_NOTES.md (no integration contract changed in this correction; the git / repo root setup contract in �8 is consistent with the new optional-commit policy).
- **No new decisions.** The policy update is a Control Room correction. It refines D-027 and the Setup-phase first-commit gate. No new D-IDs are introduced. The D-IDs in this file remain canonical.
- **No commits created.** No remote added. No push. No git add, git commit, git push, git remote add, git fetch, git pull. No 
pm install, pnpm install, yarn install, 
px, 
px skills add, 
px impeccable install. No package-manager command of any kind. No package.json change. No MCP setup. No Ponytail or ECC / affaan-m/ecc install / clone / copy / configure / evaluation. No README / DEPLOY edit. No test / CI file.
- **Safety:** no source files modified, no package files modified, no package.json change, no tooling install, no MCP setup, no 
px command run, no lockfile edits, no README.md edits, no DEPLOY.md delete, no CI config file created, no test file created, no Cleanup A / Cleanup B / Security 1..5 / Booking A / Booking B / Observability / QA Slice 0..3 / UIX0 / MOTION0 Planning / UIX0 / MOTION0 first slice / UIX0 / MOTION0 later slices / Admin future / Final QA / delivery work started, no Ponytail install / clone / copy / configure / evaluation, no ECC / affaan-m/ecc install / clone / copy / configure / evaluation. All operations stayed in the allowed change zones. The only files modified in this batch are documentation files (docs/, memory/, i/, epo-research/, PROJECT_CONTROL_LOG.md).
- **Status:** Git push / commit policy update run. Cleanup A remains blocked until ChatGPT Control Room approves Setup and A0. The first commit is now optional, not a precondition for Cleanup A.

## 2026-06-16 � Cleanup A batch (run; no commit; no push; no remote)

- **Agent:** CLEANUP-A-AGENT (same session, additive only).
- **Phase status:** run; A0 (the parent plan) is still pending ChatGPT Control Room review. Cleanup A ran as a deliberate, additive exception gated by the owner's Cleanup A prompt. Cleanup A is not a substitute for A0 review.
- **Goal:** perform the approved Cleanup A hygiene / content fixes only: README repair per epo-research/README_REPAIR_SPEC.md; root DEPLOY.md deletion (after verifying docs/DEPLOYMENT.md covers it); portfolio copy truth fix in pp/(public)/portfolio/page.tsx; contact form source: \"contact\" in components/contact.tsx; .gitignore check (already done in Setup); ESLint config deferred (requires package install, forbidden in Cleanup A).
- **Owner Git policy respected:** no git add, no git commit, no git push, no git remote add, no GitHub repo, no publish. First commit remains OPTIONAL. Cleanup A proceeded without a baseline commit.
- **Files modified in this batch:**
  - README.md (repaired per spec; ~104 lines; port 3005; entry pp/(public)/page.tsx; six env vars; admin warning; security warning; foundation docs cross-linked; v0 Kiro badge and v0 \"Built with v0\" section removed; acknowledgments added).
  - pp/(public)/portfolio/page.tsx (copy truth fix; metadata + PageHero; no layout change; no feature change).
  - components/contact.tsx (one-line: JSON.stringify({ source: 'contact', ...form }) instead of JSON.stringify(form)).
  - INTEGRATION_NOTES.md (�1 contact row updated additively).
  - docs/ENVIRONMENT.md (per-form payload table updated; contact form now sends source: \"contact\").
  - docs/DEPLOYMENT.md (header note updated to record the deletion of root DEPLOY.md).
  - PROJECT_CONTROL_LOG.md (Cleanup A batch overlay).
  - memory/CURRENT_STATE.md (snapshot, blocked list, exact next gate, gate status).
  - memory/ACTIVE_TASK_CONTEXT.md (task replaced with Cleanup A; in-scope and out-of-scope lists; definition of done).
  - memory/WORKING_MEMORY.md (current task, phase gate, active restrictions, Cleanup A outputs section).
  - memory/IMPORTANT_DECISIONS.md (Cleanup A reflection note appended; no new D-IDs; ESLint deferral recorded under R-026).
  - memory/EPISODIC_MEMORY.md (this event).
  - i/AI_TASK_CAPSULE.md (phase line updated to Cleanup A; never-do list extended).
  - i/AI_CONTEXT_RULES.md (Cleanup A hard rule added; future-phase boundary rule reaffirmed; tooling-candidate rules reaffirmed).
  - docs/51_AGENT_HANDOFF_LOG.md (Cleanup A entry appended).
- **Files deleted in this batch:**
  - DEPLOY.md (root; legacy deployment checklist; covered by docs/DEPLOYMENT.md; per Q-13 and the A0 plan �5.2).
- **Files NOT modified:** pp/** (except pp/(public)/portfolio/page.tsx), components/** (except components/contact.tsx), hooks/, lib/, public/, styles/, package.json, package-lock.json, pnpm-lock.yaml, yarn.lock, 	sconfig.json, 
ext.config.mjs, postcss.config.mjs, components.json, 
ext-env.d.ts, .env*, .mcp.json, .opencode/, .codex/, .claude/, 	ests/, .github/, eslint / tailwind configs, .gitignore (Setup already covered it). INTEGRATION_NOTES.md was modified additively (contact row); the rest of the file is unchanged.
- **No new decisions.** Cleanup A only records the ESLint deferral as a decision under the existing R-026. The D-IDs in memory/IMPORTANT_DECISIONS.md remain canonical. Cleanup A appends a Cleanup A reflection note; it does not add new D-IDs.
- **No commits created.** No remote added. No push. No git add, git commit, git push, git remote add, git fetch, git pull. No 
pm install, pnpm install, yarn install, 
px. No package-manager command of any kind. No package.json change. No MCP setup. No Ponytail or ECC / affaan-m/ecc install / clone / copy / configure / evaluation. No README / DEPLOY edit beyond Cleanup A scope. No test / CI file. No Cleanup B / Security / Booking / Observability / QA / TS0 / RDG0 / UIX0 / MOTION0 / Admin future / Final QA work started.
- **Safety:** no source files modified outside Cleanup A scope; no package files modified; no package.json change; no tooling install; no MCP setup; no 
px command run; no lockfile edits; no 	sconfig.json edits; no 
ext.config.* edits; no postcss.config.* edits; no CI config file created; no test file created; no Cleanup B / Security / Booking / Observability / QA / TS0 / RDG0 / UIX0 / MOTION0 / Admin future / Final QA work started; no Ponytail install / clone / copy / configure / evaluation; no ECC / affaan-m/ecc install / clone / copy / configure / evaluation. All operations stayed in the allowed change zones.
- **Status:** Cleanup A run. README repaired. DEPLOY.md deleted. Portfolio copy truth fixed. Contact form source: \"contact\" added. Integration notes updated. .gitignore confirmed clean. ESLint config deferred. R-019, R-023, R-025, R-027 closed/addressed. R-026 (ESLint config) remains open and deferred. The first commit is OPTIONAL. The next gate is ChatGPT Control Room approval to start Cleanup B (lockfile cleanup per D-015).

## 2026-06-16 � Cleanup B batch (run; no commit; no push; no remote; no package-manager command)

- **Agent:** CLEANUP-B-AGENT (same session, additive only).
- **Phase status:** run; A0 (the parent plan) is still pending ChatGPT Control Room review. Cleanup B ran as a deliberate, additive exception gated by the owner's Cleanup B prompt. Cleanup B is not a substitute for A0 review.
- **Goal:** lockfile cleanup per D-015 LOCKED DEFAULT: 
pm is canonical; package-lock.json is the canonical lockfile; pnpm-lock.yaml was deleted; pnpm-lock.yaml added to .gitignore; documentation updated; package.json untouched.
- **Owner Git policy respected:** no git add, no git commit, no git push, no git remote add, no GitHub repo, no publish. First commit remains OPTIONAL. Cleanup B proceeded without a baseline commit.
- **Pre-flight verification:** package-lock.json present. pnpm-lock.yaml present before deletion. yarn.lock not present. package.json has no packageManager field, no .npmrc / .pnpmrc checked in, no manager-specific shell syntax in scripts. No evidence of a pnpm requirement. Safe to delete pnpm-lock.yaml.
- **Files deleted in this batch:**
  - pnpm-lock.yaml (root; pnpm v9 lockfile; the dropped lockfile per D-015 LOCKED DEFAULT).
- **Files modified in this batch:**
  - .gitignore (pnpm-lock.yaml added with comment recording Cleanup B 2026-06-16 and D-015).
  - README.md (lockfile paragraph rewritten).
  - docs/SETUP.md (prerequisites, install note, common-pitfall line all updated).
  - docs/DEPLOYMENT.md (build settings table now includes a \"Package manager\" row: 
pm; D-015 LOCKED DEFAULT).
  - epo-research/LOCKFILE_DECISION_BRIEF.md (status banner: \"Decision applied\"; \"Current State\" updated; �9 \"Resolution\" section added).
  - epo-research/A0_PHASE_EXECUTION_QUEUE.md (header banner: \"Cleanup B executed\").
  - epo-research/A0_CHANGE_ZONE_MAP.md (header banner: \"Cleanup B executed\").
  - PROJECT_CONTROL_LOG.md (Cleanup B batch overlay).
  - memory/CURRENT_STATE.md (snapshot, blocked list, exact next gate, gate status).
  - memory/ACTIVE_TASK_CONTEXT.md (task replaced with Cleanup B; in-scope and out-of-scope lists; definition of done).
  - memory/WORKING_MEMORY.md (current task, phase gate, active restrictions, Cleanup B outputs section).
  - memory/IMPORTANT_DECISIONS.md (Cleanup B reflection note appended; no new D-IDs; D-015 confirmed; R-002 closed).
  - memory/EPISODIC_MEMORY.md (this event).
  - i/AI_TASK_CAPSULE.md (phase line updated to Cleanup B; never-do list extended).
  - i/AI_CONTEXT_RULES.md (Cleanup B hard rule added; future-phase boundary rule reaffirmed; tooling-candidate rules reaffirmed).
  - docs/51_AGENT_HANDOFF_LOG.md (Cleanup B entry appended).
- **Files NOT modified:** pp/**, components/**, hooks/**, lib/**, public/**, styles/**, package.json, package-lock.json, yarn.lock, 	sconfig.json, 
ext.config.mjs, postcss.config.mjs, components.json, 
ext-env.d.ts, .env*, .mcp.json, .opencode/, .codex/, .claude/, 	ests/, .github/, eslint / tailwind configs, INTEGRATION_NOTES.md (its two package-manager references are guard lines, not deployment instructions).
- **No new decisions.** Cleanup B only applies the existing D-015 LOCKED DEFAULT. The D-IDs in memory/IMPORTANT_DECISIONS.md remain canonical. Cleanup B appends a Cleanup B reflection note; it does not add new D-IDs.
- **No commits created.** No remote added. No push. No git add, git commit, git push, git remote add, git fetch, git pull. No 
pm install, pnpm install, yarn install, 
px. No package-manager command of any kind. No package.json change. No MCP setup. No Ponytail or ECC / affaan-m/ecc install / clone / copy / configure / evaluation. No test / CI file. No Security / Booking / Observability / QA / TS0 / RDG0 / UIX0 / MOTION0 / Admin future / Final QA work started.
- **Safety:** no source files modified; no package files modified; no package.json change; no tooling install; no MCP setup; no 
px command run; no lockfile edits (other than the planned pnpm-lock.yaml delete); no 	sconfig.json edits; no 
ext.config.* edits; no postcss.config.* edits; no CI config file created; no test file created. All operations stayed in the allowed change zones.
- **Status:** Cleanup B run. pnpm-lock.yaml deleted. package-lock.json remains as the canonical lockfile. pnpm-lock.yaml listed in .gitignore. package.json untouched. R-002 closed. The CI re-entry guard is gated to a future TS0 / RDG0 phase. The first commit is OPTIONAL. The next gate is ChatGPT Control Room approval to start Security 1 (Worker proxy for Anthropic per D-019a).

## 2026-06-16 � Security 1 batch (run; code + docs + CSP; no commit; no push; no remote; no deploy)

- **Agent:** SECURITY-1-WORKER-AGENT (same session, additive only).
- **Phase status:** run; A0 (the parent plan) is still pending ChatGPT Control Room review. Security 1 ran as a deliberate, additive exception gated by the owner's Security 1 prompt. Security 1 is not a substitute for A0 review.
- **Goal:** Cloudflare Worker proxy for Anthropic per D-019a. Replace the direct browser-to-Anthropic call with a Worker that holds the key server-side. R-002 closed. F-001 implemented.
- **Owner Git policy respected:** no git add, no git commit, no git push, no git remote add, no GitHub repo, no publish. First commit remains OPTIONAL. Security 1 proceeded without a baseline commit.
- **No deploy was performed in this phase.** The Worker source is shipped. The Worker needs to be deployed to Cloudflare (wrangler deploy or the dashboard) by the owner. Steps are in epo-research/SECURITY_1_WORKER_PROXY_NOTES.md �5.
- **Pre-flight verification:** lib/proposal-generator.ts was reading process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY and calling https://api.anthropic.com/v1/messages directly. **Replaced.** pp/admin/proposal/page.tsx did not call Anthropic directly (calls ProposalOutputView which calls generateProposal from lib/proposal-generator.ts); no change needed. components/admin/proposal-output.tsx imports generateProposal and calls it; the function shape and return type are unchanged; no change needed. .env.local.example exposed NEXT_PUBLIC_ANTHROPIC_API_KEY as the primary key; **replaced** with NEXT_PUBLIC_PROPOSAL_WORKER_URL plus a DEPRECATED; do not set block. public/_headers had https://api.anthropic.com in connect-src; **removed**; added https://*.workers.dev. INTEGRATION_NOTES.md �8.1 described the planned Security 1 contract; **marked SHIPPED 2026-06-16**. docs/SECURITY.md R-002 was a documented unfixed risk; **closed** (moved to the \"Closed risks\" section with a Security 1 resolution). docs/DEPLOYMENT.md had no Worker section; **added a \"Cloudflare Worker (Security 1)\" section;** updated CSP note; updated post-deploy check; updated the \"What is not part of the deploy\" section.
- **Files created in this batch:**
  - workers/anthropic-proposal-proxy.ts (the Worker source; primary deliverable).
  - epo-research/SECURITY_1_WORKER_PROXY_NOTES.md (primary deliverable; purpose, files changed, env vars, deployment steps, rollback plan, known remaining risks, Security 2 dependency, testing checklist).
- **Files modified in this batch:**
  - lib/proposal-generator.ts (replaced direct Anthropic call with a thin Worker client; uses NEXT_PUBLIC_PROPOSAL_WORKER_URL).
  - .env.local.example (added NEXT_PUBLIC_PROPOSAL_WORKER_URL; removed the encouraged public NEXT_PUBLIC_ANTHROPIC_API_KEY; added a DEPRECATED; do not set block).
  - public/_headers (CSP connect-src updated: pi.anthropic.com removed; *.workers.dev added).
  - docs/ENVIRONMENT.md (split into Frontend / Worker tables; deprecated NEXT_PUBLIC_ANTHROPIC_API_KEY; added Worker env vars and dev / production notes).
  - docs/SECURITY.md (R-002 closed; F-001 implemented; Security 1 status banner added).
  - docs/DEPLOYMENT.md (added \"Cloudflare Worker (Security 1)\" section; updated CSP note; updated post-deploy check; updated \"What is not part of the deploy\" section).
  - INTEGRATION_NOTES.md (�8.1 marked SHIPPED 2026-06-16 with the resolution).
  - PROJECT_CONTROL_LOG.md (Security 1 batch overlay).
  - memory/CURRENT_STATE.md (snapshot, blocked list, exact next gate, gate status).
  - memory/ACTIVE_TASK_CONTEXT.md (task replaced with Security 1; in-scope and out-of-scope lists; definition of done).
  - memory/WORKING_MEMORY.md (current task, phase gate, active restrictions, Security 1 outputs section).
  - memory/IMPORTANT_DECISIONS.md (Security 1 reflection note appended; D-019a applied; R-002 closed; F-001 implemented; no new D-IDs).
  - memory/EPISODIC_MEMORY.md (this event).
  - i/AI_TASK_CAPSULE.md (phase line updated to Security 1; never-do list extended).
  - i/AI_CONTEXT_RULES.md (Security 1 hard rule added).
  - docs/51_AGENT_HANDOFF_LOG.md (this event).
- **Files NOT modified:** package.json, package-lock.json, pnpm-lock.yaml, yarn.lock, 	sconfig.json, 
ext.config.mjs, postcss.config.mjs, components.json, 
ext-env.d.ts, real .env or .env.local, .mcp.json, .opencode/, .codex/, .claude/, 	ests/, .github/, all pp/** (except pp/admin/proposal/page.tsx was inspected but not modified), all components/** (except components/admin/proposal-output.tsx was inspected but not modified), hooks/, lib/ (except lib/proposal-generator.ts), public/ (except public/_headers), styles/, pp/admin/proposal/page.tsx, components/admin/proposal-output.tsx. INTEGRATION_NOTES.md was modified additively (�8.1 marked SHIPPED); the rest of the file is unchanged.
- **No new decisions.** Security 1 only applies the existing D-019a LOCKED DEFAULT. The D-IDs in memory/IMPORTANT_DECISIONS.md remain canonical. Security 1 appends a Security 1 reflection note; it does not add new D-IDs.
- **No commits created.** No remote added. No push. No git add, git commit, git push, git remote add, git fetch, git pull. No 
pm install, pnpm install, yarn install, 
px, wrangler deploy. No deploy command of any kind. No package.json change. No MCP setup. No Ponytail or ECC / affaan-m/ecc install / clone / copy / configure / evaluation. No test / CI file. No Security 2..5 / Booking / Observability / QA / TS0 / RDG0 / UIX0 / MOTION0 / Admin future / Final QA work started.
- **Safety:** no source files modified outside Security 1 scope; no package files modified; no package.json change; no tooling install; no MCP setup; no 
px command run; no lockfile edits; no 	sconfig.json edits; no 
ext.config.* edits; no postcss.config.* edits; no CI config file created; no test file created. All operations stayed in the allowed change zones. The Worker source is the only file outside the existing pp/ / components/ / lib/ / docs/ / memory/ / i/ / epo-research/ / public/ zones; the new workers/ folder is a documented Security 1 zone per the A0 plan �5.4 and epo-research/A0_CHANGE_ZONE_MAP.md.
- **Pre-stopping verification:**
  - grep -r 'NEXT_PUBLIC_ANTHROPIC_API_KEY' lib/ app/ components/ public/ returns **0 active references** (only the comment in lib/proposal-generator.ts:7 marking it as deprecated, and the DEPRECATED block in .env.local.example). **Pass.**
  - grep -r 'api.anthropic.com' lib/ app/ components/ public/ returns **0 matches** outside the Worker source. **Pass.**
  - Frontend lib/proposal-generator.ts calls ${NEXT_PUBLIC_PROPOSAL_WORKER_URL}/ with { intakeData } body. **Pass.**
  - Worker workers/anthropic-proposal-proxy.ts uses server-side ANTHROPIC_API_KEY and x-api-key header for the upstream Anthropic call. **Pass.**
  - .env.local.example no longer encourages exposing the Anthropic key publicly. **Pass.**
  - public/_headers CSP connect-src does not include https://api.anthropic.com; it does include https://*.workers.dev. **Pass.**
  - docs/SECURITY.md R-002 is in the \"Closed risks\" section. **Pass.**
  - Security 2 admin auth remains blocked and not implemented. **Pass.**
- **Status:** Security 1 run. Worker source shipped. Frontend updated. CSP updated. Documentation updated. R-002 closed at the runtime level. F-001 implemented. No commit. No push. No remote. No deploy. The first commit is OPTIONAL. The next gate is ChatGPT Control Room approval to start Security 2 (admin auth per D-020a).

## 2026-06-16 � Security 2 batch (run; code + docs; no commit; no push; no remote; no deploy)

- **Agent:** SECURITY-2-AUTH-AGENT (same session, additive only).
- **Phase status:** run; A0 (the parent plan) is still pending ChatGPT Control Room review. Security 2 ran as a deliberate, additive exception gated by the owner's Security 2 prompt. Security 2 is not a substitute for A0 review.
- **Goal:** Cloudflare Access in front of /admin/* per D-020a LOCKED DEFAULT. The real admin boundary is now Cloudflare Access. The local client-side password gate in pp/admin/layout.tsx is convenience-only and is explicitly labeled as such. R-001 addressed at the deployment level. F-002 implemented for the deployed path.
- **Owner Git policy respected:** no git add, no git commit, no git push, no git remote add, no GitHub repo, no publish. First commit remains OPTIONAL. Security 2 proceeded without a baseline commit.
- **No Cloudflare Access app was created in this phase.** The owner creates it in the Cloudflare Zero Trust dashboard before any non-internal launch. Setup steps are in epo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md �3.
- **No Worker-level session-token / Cloudflare Access JWT verification was shipped.** Documented as a future hardening step. The Worker's ALLOWED_ORIGIN CORS gate is unchanged. The Worker's header comment now records the contract.
- **Pre-flight verification:** pp/admin/layout.tsx had a client-side password gate that read process.env.NEXT_PUBLIC_ADMIN_PASSWORD and compared it to localStorage.co_admin_auth. **Kept** as a convenience gate; **explicitly labeled** as convenience-only in the UI (a ShieldCheck notice on the login form and a chip in the admin header). pp/admin/page.tsx, pp/admin/onboarding/page.tsx, pp/admin/proposal/page.tsx did not have any auth check. They rely on pp/admin/layout.tsx for the convenience gate. **Not modified.** workers/anthropic-proposal-proxy.ts had a CORS gate (origin allowlist). **Doc comment added** to the header explaining the Security 2 boundary; **no code change.** .env.local.example had NEXT_PUBLIC_ADMIN_PASSWORD=your-admin-password as a primary key. **Removed from the encouraged block**; line preserved in a DEPRECATED block. docs/ENVIRONMENT.md had NEXT_PUBLIC_ADMIN_PASSWORD as a required env var. **Updated to "no (convenience only)".** docs/SECURITY.md had R-001 as a documented unfixed risk. **Moved to "Closed risks" section** with a Security 2 resolution. F-002 marked implemented. Security 2 status banner added. R-007 CSP description updated. docs/DEPLOYMENT.md had no Access section. **Added "Cloudflare Access (Security 2) � admin boundary" section** with the owner-side setup steps and the post-deploy Access verification check. INTEGRATION_NOTES.md had no Security 2 section. **Added �8.10 "Admin auth boundary (Security 2) � SHIPPED 2026-06-16"** with the contract. epo-research/SECURITY_1_WORKER_PROXY_NOTES.md had a Security 2 dependency section that said Security 2 was the next phase. **Updated** to reflect that Security 2 has run; admin auth (D-020a) is now Cloudflare Access; Worker-level session-token / Cloudflare Access JWT verification is a follow-up.
- **Files created in this batch:**
  - epo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md (primary deliverable; covers why Cloudflare Access, what changed, owner-side setup steps, verification steps, rollback plan, known remaining risks, Security 2 vs Security 1 scope).
- **Files modified in this batch:**
  - pp/admin/layout.tsx (the only pp/** file modified; convenience gate kept; explicitly labeled as convenience-only in the UI; a chip in the admin header records \"Local gate � Cloudflare Access = primary\"; doc comment at the top of the file records the rule).
  - workers/anthropic-proposal-proxy.ts (doc comment only; no code change; the header now explains the Security 2 boundary and the Worker-level JWT verification follow-up).
  - .env.local.example (added a Security 2 section in the header; NEXT_PUBLIC_ADMIN_PASSWORD removed from the encouraged block; DEPRECATED block added with \"convenience-only if set\" note).
  - docs/ENVIRONMENT.md (NEXT_PUBLIC_ADMIN_PASSWORD row updated to \"no (convenience only)\"; \"Deprecated / forbidden\" section extended; \"Security implications\" section updated).
  - docs/SECURITY.md (Security 2 status banner added; R-001 moved to \"Closed risks\" with a Security 2 resolution; F-002 marked implemented; R-007 CSP description updated).
  - docs/DEPLOYMENT.md (new \"Cloudflare Access (Security 2) � admin boundary\" section; post-deploy Access verification check added; \"What is not part of the deploy\" section updated).
  - INTEGRATION_NOTES.md (�8.10 \"Admin auth boundary (Security 2) � SHIPPED 2026-06-16\" added).
  - epo-research/SECURITY_1_WORKER_PROXY_NOTES.md (Security 2 dependency section rewritten; Security 2 follow-up checklist updated).
  - PROJECT_CONTROL_LOG.md (Security 2 batch overlay).
  - memory/CURRENT_STATE.md (snapshot, blocked list, exact next gate, gate status; \"Exact next gate after Security 2\" section added).
  - memory/ACTIVE_TASK_CONTEXT.md (task replaced with Security 2; in-scope and out-of-scope lists; definition of done).
  - memory/WORKING_MEMORY.md (current task, phase gate, active restrictions, Security 2 outputs section).
  - memory/IMPORTANT_DECISIONS.md (Security 2 reflection note appended; D-020a applied; R-001 addressed at deployment level; F-002 implemented for the deployed path; no new D-IDs).
  - memory/EPISODIC_MEMORY.md (this event).
  - i/AI_TASK_CAPSULE.md (phase line updated to Security 2; never-do list extended).
  - i/AI_CONTEXT_RULES.md (Security 2 hard rule added).
  - docs/51_AGENT_HANDOFF_LOG.md (this event).
- **Files NOT modified:** package.json, package-lock.json, pnpm-lock.yaml, yarn.lock, 	sconfig.json, 
ext.config.mjs, postcss.config.mjs, components.json, 
ext-env.d.ts, real .env or .env.local, .mcp.json, .opencode/, .codex/, .claude/, 	ests/, .github/, all pp/** (except pp/admin/layout.tsx), all components/**, hooks/, lib/ (except the Worker source doc comment), public/, styles/, pp/admin/page.tsx, pp/admin/onboarding/page.tsx, pp/admin/proposal/page.tsx. INTEGRATION_NOTES.md was modified additively (�8.10 added); the rest of the file is unchanged.
- **No new decisions.** Security 2 only applies the existing D-020a LOCKED DEFAULT. The D-IDs in memory/IMPORTANT_DECISIONS.md remain canonical. Security 2 appends a Security 2 reflection note; it does not add new D-IDs.
- **No commits created.** No remote added. No push. No git add, git commit, git push, git remote add, git fetch, git pull. No 
pm install, pnpm install, yarn install, 
px, 
pm run, pnpm run, yarn run, wrangler deploy. No deploy command of any kind. No Cloudflare dashboard command. No package.json change. No MCP setup. No Ponytail or ECC / affaan-m/ecc install / clone / copy / configure / evaluation. No test / CI file. No Security 3..5 / Booking / Observability / QA / TS0 / RDG0 / UIX0 / MOTION0 / Admin future / Final QA work started.
- **Safety:** no source files modified outside Security 2 scope; no package files modified; no package.json change; no tooling install; no MCP setup; no 
px command run; no lockfile edits; no 	sconfig.json edits; no 
ext.config.* edits; no postcss.config.* edits; no CI config file created; no test file created. All operations stayed in the allowed change zones.
- **Pre-stopping verification:**
  - NEXT_PUBLIC_ADMIN_PASSWORD is no longer documented as a real security boundary anywhere. The pp/admin/layout.tsx UI now shows: \"Convenience gate only. Real admin protection is Cloudflare Access in front of /admin/* on the deployed site. This local check is not security.\" **Pass.**
  - docs/ENVIRONMENT.md row for NEXT_PUBLIC_ADMIN_PASSWORD is now \"no (convenience only)\" with a clear note that Cloudflare Access is the real boundary. **Pass.**
  - docs/SECURITY.md R-001 is in the \"Closed risks\" section. F-002 is marked implemented. The Security 2 status banner is at the top. **Pass.**
  - docs/DEPLOYMENT.md has a \"Cloudflare Access (Security 2) � admin boundary\" section with the owner-side setup steps and a post-deploy Access verification check. **Pass.**
  - epo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md exists and covers the owner-side setup, the verification steps, the rollback plan, and the known remaining risks. **Pass.**
  - Admin remains internal-only (D-017). The owner-side Access setup restricts the allowlist to the operator's email (and any other approved owner / operator emails). The convenience gate is convenience-only. **Pass.**
  - Security 3 Supabase RLS remains blocked and not implemented. **Pass.**
  - Security 4 n8n secret/header remains blocked and not implemented. **Pass.**
  - No package installs or auth library installs occurred. **Pass.**
  - No deploy occurred. **Pass.**
- **Status:** Security 2 run. Repo changes shipped. Convenience gate explicitly labeled. NEXT_PUBLIC_ADMIN_PASSWORD deprecated as security. R-001 addressed at the deployment level. F-002 implemented for the deployed path. No commit. No push. No remote. No deploy. No Cloudflare Access app created. The first commit is OPTIONAL. The next gate is ChatGPT Control Room approval to start Security 3 (Supabase RLS per D-020).

## 2026-06-16 � Security 3 batch (run; SQL + docs; no commit; no push; no remote; no deploy; no database command)

- **Agent:** SECURITY-3-RLS-AGENT (same session, additive only).
- **Phase status:** run; A0 (the parent plan) is still pending ChatGPT Control Room review. Security 3 ran as a deliberate, additive exception gated by the owner's Security 3 prompt. Security 3 is not a substitute for A0 review.
- **Goal:** Supabase Row Level Security per D-020 LOCKED DEFAULT. RLS is required before any non-internal launch. The SQL migration was written and is on disk; **NOT applied in this phase.** The owner applies it manually via the Supabase SQL editor (recommended) or the Supabase CLI (alternative). R-003 closed at the SQL level; deferred at the runtime level. F-003 implemented at the SQL level; deferred at the runtime level.
- **Owner Git policy respected:** no git add, no git commit, no git push, no git remote add, no GitHub repo, no publish. First commit remains OPTIONAL. Security 3 proceeded without a baseline commit.
- **No Supabase dashboard command, no Supabase CLI, no psql, no database command of any kind.** The owner pastes the SQL into the Supabase SQL editor and runs it.
- **No service_role key in any NEXT_PUBLIC_* env var, in the static bundle, in the repo, or in any client-reachable file.** The migration does not add or change any env var.
- **No new auth library was added.** No Auth.js. No Supabase Auth. No server route. No new npm dependency.
- **Pre-flight verification:** Tables: ookings, vailable_slots (confirmed from lib/booking-schema.sql and docs/DATABASE.md). Frontend lib/booking-actions.ts directly reads vailable_slots and writes ookings + vailable_slots from the browser using the anon key. R-003 is the original risk. No supabase/ folder existed before this phase. Created supabase/migrations/20260616_security3_rls.sql. Frontend components/booking-calendar-custom.tsx does **not** call getAvailableSlots (R-005). The booking UI was already broken in a different way. RLS does not introduce a new breakage; it makes the existing breakage explicit and gated. Frontend pp/, components/, lib/, hooks/, public/, styles/, workers/ were **not** modified in this phase (the brief excludes them).
- **Files created in this batch:**
  - supabase/migrations/20260616_security3_rls.sql (the SQL migration; primary deliverable; idempotent; reversible; heavily commented; conservative defaults; forward-compatible grants on the future narrow RPCs).
  - epo-research/SECURITY_3_SUPABASE_RLS_NOTES.md (primary deliverable for the Security 3 phase; covers current risk, tables affected, proposed RLS model, the SQL file created, owner-side application steps, rollback SQL, verification checklist, known impact on current booking flow, dependencies on Booking A/B, what remains blocked).
- **Files modified in this batch:**
  - docs/DATABASE.md (RLS section rewritten to the Security 3 policy model; "How the app reads and writes" section updated to call out the Security 3 deny and the future RPCs).
  - docs/SECURITY.md (Security 3 status banner added; R-003 moved to "Closed risks" with a Security 3 resolution; F-003 marked implemented at the SQL level; deferred at the runtime level).
  - docs/DEPLOYMENT.md (new "Supabase Row Level Security (Security 3)" section with the owner-side setup steps and the post-deploy checks).
  - INTEGRATION_NOTES.md (�8.3 marked SHIPPED 2026-06-16 with the resolution; explicit Service-role / Worker-only / anon-never-for-reserve language; closure list updated; migration status noted).
  - PROJECT_CONTROL_LOG.md (Security 3 batch overlay).
  - memory/CURRENT_STATE.md (snapshot, blocked list, exact next gate, gate status; "Exact next gate after Security 3" section added).
  - memory/ACTIVE_TASK_CONTEXT.md (task replaced with Security 3; in-scope and out-of-scope lists; definition of done).
  - memory/WORKING_MEMORY.md (current task, phase gate, active restrictions, Security 3 outputs section).
  - memory/IMPORTANT_DECISIONS.md (Security 3 reflection note appended; D-020 applied; R-003 closed at SQL level; F-003 implemented at SQL level; deferred at runtime level; no new D-IDs).
  - memory/EPISODIC_MEMORY.md (this event).
  - i/AI_TASK_CAPSULE.md (phase line updated to Security 3; never-do list extended).
  - i/AI_CONTEXT_RULES.md (Security 3 hard rule added).
  - docs/51_AGENT_HANDOFF_LOG.md (this event).
- **Files NOT modified:** package.json, package-lock.json, pnpm-lock.yaml, yarn.lock, 	sconfig.json, 
ext.config.mjs, postcss.config.mjs, components.json, 
ext-env.d.ts, .env* (no env files were touched), .mcp.json, .opencode/, .codex/, .claude/, 	ests/, .github/, pp/**, components/**, hooks/**, lib/**, public/**, styles/**, workers/**. INTEGRATION_NOTES.md was modified additively (�8.3 marked SHIPPED); the rest of the file is unchanged. The SQL migration is a new file in a new folder (supabase/); it is not a "modification" of an existing file.
- **No new decisions.** Security 3 only applies the existing D-020 LOCKED DEFAULT. The D-IDs in memory/IMPORTANT_DECISIONS.md remain canonical. Security 3 appends a Security 3 reflection note; it does not add new D-IDs.
- **No commits created.** No remote added. No push. No git add, git commit, git push, git remote add, git fetch, git pull. No 
pm install, pnpm install, yarn install, 
px, 
pm run, pnpm run, yarn run, wrangler deploy. No deploy command of any kind. No Cloudflare dashboard command. No Supabase dashboard command. No psql. No supabase CLI. No database command. No package.json change. No MCP setup. No Ponytail or ECC / affaan-m/ecc install / clone / copy / configure / evaluation. No test / CI file. No Security 4..5 / Booking / Observability / QA / TS0 / RDG0 / UIX0 / MOTION0 / Admin future / Final QA work started.
- **Safety:** no source files modified outside Security 3 scope; no package files modified; no package.json change; no tooling install; no MCP setup; no 
px command run; no lockfile edits; no 	sconfig.json edits; no 
ext.config.* edits; no postcss.config.* edits; no CI config file created; no test file created. All operations stayed in the allowed change zones.
- **Pre-stopping verification:**
  - SQL file exists at supabase/migrations/20260616_security3_rls.sql. **Pass.**
  - SQL does not expose service role to browser. The migration does not add any env var; the service_role policy is server-side only. **Pass.**
  - SQL does not grant broad anon write access. Anon is denied on both tables (USING false, WITH CHECK false). Anon is granted EXECUTE only on get_available_slots (a future RPC, no-op until Booking A creates the function). Anon is NOT granted EXECUTE on eserve_slot. **Pass.**
  - Docs state SQL was not applied. epo-research/SECURITY_3_SUPABASE_RLS_NOTES.md and docs/DEPLOYMENT.md and INTEGRATION_NOTES.md �8.3 all state that the migration was NOT applied in this phase. **Pass.**
  - Docs state owner must apply/review SQL manually. epo-research/SECURITY_3_SUPABASE_RLS_NOTES.md �5 and docs/DEPLOYMENT.md "Supabase Row Level Security (Security 3)" section both describe the manual owner-side setup. **Pass.**
  - Booking A/B remain blocked. **Pass.**
  - Security 4 remains blocked. **Pass.**
  - No package installs or deploys occurred. **Pass.**
- **Status:** Security 3 run. SQL migration written. **NOT APPLIED.** Repo changes shipped. R-003 closed at the SQL level. F-003 implemented at the SQL level. No commit. No push. No remote. No deploy. No Supabase command. The first commit is OPTIONAL. The next gate is ChatGPT Control Room approval to start Security 4 (n8n per-form secret per D-022 / R-005).

## 2026-06-16 � Security 4 (n8n per-form secret/header) run

- A0 approved by ChatGPT Control Room as of this phase (carry-forward recorded in memory/CURRENT_STATE.md, PROJECT_CONTROL_LOG.md, docs/SECURITY.md).
- Inspected n8n webhook usage: four public forms (contact, quote, newsletter, booking) all POST directly to NEXT_PUBLIC_N8N_WEBHOOK_URL from the browser. R-005 / R-017 were open.
- Created workers/n8n-form-proxy.ts (native etch only, no deps, no package.json change). CORS / origin gate, per-form routing by source / 	ype: "booking", server-side X-CodeOutfitters-Form-Secret header with the matching per-form secret, safe error responses (400 / 403 / 405 / 500 / 502), no secret echo.
- Updated the four form submit files to call ${NEXT_PUBLIC_FORMS_WORKER_URL}/:
  - components/contact.tsx � preserves source: "contact".
  - components/quote-form.tsx � preserves source: "quote_request".
  - components/newsletter.tsx � preserves source: "newsletter".
  - components/booking-calendar-custom.tsx � n8n POST path only; preserves 	ype: "booking"; Supabase write path unchanged.
- Updated public/_headers: removed https://*.n8n.io from connect-src; https://*.workers.dev already in CSP from Security 1 covers the forms Worker.
- Updated .env.local.example: added NEXT_PUBLIC_FORMS_WORKER_URL; deprecated NEXT_PUBLIC_N8N_WEBHOOK_URL.
- Updated docs/ENVIRONMENT.md: added NEXT_PUBLIC_FORMS_WORKER_URL; added the 9-var Worker env subsection; deprecated the n8n URL; updated per-form payload contracts.
- Updated docs/SECURITY.md: added Security 4 status banner (notes A0 approved); moved R-005 to "Closed risks" with a Security 4 resolution; marked R-017 addressed; marked F-006 implemented at the deployment level.
- Updated docs/DEPLOYMENT.md: new "n8n form proxy (Security 4)" section with owner-side setup steps.
- Updated INTEGRATION_NOTES.md �8.2: marked SHIPPED 2026-06-16.
- Created epo-research/SECURITY_4_N8N_SECRET_NOTES.md (primary deliverable).
- Verified via grep:
  - No NEXT_PUBLIC_N8N_WEBHOOK_URL in any of the four form components.
  - No N8N_*_SECRET in any frontend component.
  - No X-CodeOutfitters-Form-Secret in any frontend component.
  - All four forms use NEXT_PUBLIC_FORMS_WORKER_URL.
- Updated PROJECT_CONTROL_LOG.md (Security 4 batch overlay), memory/CURRENT_STATE.md (A0 approved + Security 4 run + exact next gate), memory/ACTIVE_TASK_CONTEXT.md (replaced by Security 4 task), memory/WORKING_MEMORY.md (current task + outputs section), memory/IMPORTANT_DECISIONS.md (Security 4 reflection note appended; no new D-IDs).
- Hard rules respected: no git add / commit / push / emote add; no wrangler deploy; no 
pm install; no psql; no Supabase CLI; no NEXT_PUBLIC_*_SECRET; no n8n secret in browser code; no Security 3 SQL apply; no Booking A / B; no Observability; no QA; no TS0 / RDG0 install; no UIX0 / MOTION0; no Admin future; no Final QA / delivery.

**Key decision: header name.** Used X-CodeOutfitters-Form-Secret (A0 plan originally said X-CO-Form-Secret; Security 4 uses the longer header name for clarity). Recorded in
epo-research/SECURITY_4_N8N_SECRET_NOTES.md and INTEGRATION_NOTES.md �8.2.

### 2026-06-16 — Booking A batch (run; SQL written; SQL NOT applied; code + docs + state)

- **Phase:** Booking A (A0 future phase #8; D-019b MVP read path; the booking read path is now wired through a narrow RPC).
- **Carry-forward:** A0 is approved by ChatGPT Control Room. Security 3 RLS migration is approved at SQL/documentation level; Security 3 migration is **NOT applied** at the runtime level. Security 3 runtime application remains an owner-side pre-launch action.
- **SQL migration written** at `supabase/migrations/20260616_booking_a_get_available_slots.sql`. **NOT applied.** The owner applies the SQL manually via the Supabase SQL editor (recommended) or the Supabase CLI (alternative). Recommended order: Security 3 first, then Booking A, then Booking B.
- The RPC: `public.get_available_slots(p_month int, p_year int) returns TABLE(id uuid, date date, time text)`. `SECURITY DEFINER`, `STABLE`, `SET search_path = pg_catalog, public`, `LANGUAGE plpgsql`. Filters `is_booked = false` server-side. Returns rows ordered by date then time. Anon is granted `EXECUTE`. Service_role is granted `EXECUTE`. No anon `SELECT` on `available_slots`. No `reserve_slot` (Booking B). No `bookings` changes. No table shape changes. No env var changes. Idempotent. Reversible.
- **`lib/booking-actions.ts:35` `getAvailableSlots(month, year)` rewritten** to call `supabase.rpc('get_available_slots', { p_month, p_year })`. Same input shape, same return shape, same error shape. Input validation: `p_month` 1..12, `p_year` 1970..2100. `createBooking` (line 107) is **intentionally unchanged**; the function's docstring records the gate to Booking B.
- **`components/booking-calendar-custom.tsx`** now calls `getAvailableSlots(month, year)` for the displayed month via `useEffect`. Loading and error states added. Date picker disables days with zero available slots. Time picker renders only the times actually available for the selected date. Submit handler unchanged (still posts to `NEXT_PUBLIC_FORMS_WORKER_URL` with `type: "booking"`). UI design, step indicator, form fields, placeholder text (`+1 (555) 123-4567`), validation, honeypot, and type field all unchanged.
- **`repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md`** created. Primary deliverable. Covers current problem, SQL file created, RPC contract, frontend files changed, owner-side application steps, verification queries, known remaining risks, Booking B dependency, rollback plan, testing checklist, sign-off.
- **Docs updated:** `docs/DATABASE.md` (Booking A status banner; "How the app reads and writes" section; "Known issue" section), `docs/SECURITY.md` (Booking A status banner; explicit "SQL NOT applied" language; `createBooking` documented as blocked until Booking B), `docs/DEPLOYMENT.md` (new "Booking A — Available slots RPC" section; post-deploy checklist extended), `INTEGRATION_NOTES.md` §2 and §8.3 updated additively.
- **State files updated:** `PROJECT_CONTROL_LOG.md` (Booking A batch overlay; phase history row; gate status row; "Exact next gate after Booking A" section), `memory/CURRENT_STATE.md` (Booking A entry in "What is done" / "What is blocked" / "Exact next gate" sections), `memory/ACTIVE_TASK_CONTEXT.md` (replaced with Booking A task; in-scope and out-of-scope lists; definition of done), `memory/WORKING_MEMORY.md` (current task updated; phase gate updated; active restrictions updated; Booking A outputs section), `memory/IMPORTANT_DECISIONS.md` (Booking A reflection note appended; D-019b reaffirmed; no new D-IDs), `ai/AI_TASK_CAPSULE.md` (phase line updated; never-do list extended), `ai/AI_CONTEXT_RULES.md` (Booking A hard rule added; future-phase boundary rule reaffirmed), `docs/51_AGENT_HANDOFF_LOG.md` (Booking A entry appended).
- **Hard rules respected:** no `git add` / `commit` / `push` / `remote add` / `fetch` / `pull`; no `wrangler deploy`; no `npm install` / `pnpm install` / `yarn install` / `npx` / `npm run` / `pnpm run` / `yarn run`; no `psql`; no Supabase CLI; no Supabase dashboard command; no `package.json` change; no `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock` change; no `tsconfig.json` / `next.config.*` / `postcss.config.*` / eslint / tailwind config change; no real `.env*` change; no source edit outside the explicit Booking A scope (the new SQL migration, the new `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md`, the swap in `lib/booking-actions.ts`, the calendar update in `components/booking-calendar-custom.tsx`, the docs); no `app/admin/**` change; no `app/**` change; no `hooks/` change; no `public/` change (other than what Security 4 already did); no `styles/` change; no `workers/` change; no Security 3 SQL apply; no Booking B work started; no Observability; no QA Slice 0..3; no TS0 / RDG0 install; no UIX0 / MOTION0; no Admin future; no Final QA / delivery; no Ponytail; no ECC / affaan-m/ecc; no Impeccable; no Emil Kowalski; no Playwright; no Chrome DevTools MCP; no Graphify; no Repomix; no Context7 MCP; no Tree-sitter; no codebase-memory MCP; no test file; no CI file; no MCP setup; no new `NEXT_PUBLIC_*_SECRET` env var; no `service_role` key in any `NEXT_PUBLIC_*` env var, in the static bundle, in the repo, or in any client-reachable file; no `reserve_slot` SQL written; no `bookings` table changes; no new column / index / constraint on `available_slots`; no Auth.js; no Supabase Auth; no server route; no middleware; no Next.js API route; no new npm dependency.
- **Open / blocked:** Booking A is **deferred at the runtime level** until the owner applies the SQL migration. The next phase (Booking B) is **blocked** until (a) ChatGPT Control Room approves Booking A and (b) the owner applies the Booking A SQL migration (and the Security 3 SQL migration if not already applied). Booking A is **not complete at runtime** until the SQL is applied. The booking calendar will continue to surface "could not load availability" until the RPC is in the database.
- **Owner action required:** (1) Open the Supabase project dashboard. (2) Go to **SQL Editor**. (3) Click **New query**. (4) Paste the contents of `supabase/migrations/20260616_booking_a_get_available_slots.sql` into the editor. (5) **Review the SQL carefully.** The owner is the last line of defense. Do not apply SQL you have not read. (6) Click **Run**. (7) Run the read-only verification queries in `supabase/migrations/20260616_booking_a_get_available_slots.sql` §7 (the comments at the end). Confirm: function exists with `prosecdef = true`, `provolatile = 's'`, `proconfig = ['search_path=pg_catalog, public']`; `anon` has `EXECUTE`; `service_role` has `EXECUTE`; a smoke call to `select * from public.get_available_slots(6, 2026)` returns unbooked slots for the seeded weekdays, ordered by date then time. Detailed steps are in `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md` §5.
- **Stop condition:** Stopped. Awaiting ChatGPT Control Room review of Booking A. Do not start Booking B. Do not start Observability, QA, TS0 / RDG0, UIX0 / MOTION0, Admin future, or Final QA / delivery.
- **Key decision reaffirmed:** D-019b (Booking MVP write path = A first, then C). Booking A implements the read-path leg of "A first." The write path remains blocked until Booking B.
- **R-005 status:** partially closed at the read path level; fully closed only when Booking B ships.
- **F-004 status:** implemented for the read path; fully closed only when Booking B ships.

### 2026-06-16 — Booking A Repair 1 (quote "time" in the RPC; on-disk + Supabase applied)

- **Phase:** Booking A Repair 1 (small repair; on-disk + Supabase applied; documented in `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md`).
- **Carry-forward:** Booking A is the read path; A0 is approved; Security 3 is the gate; Booking B is the write path; D-019b is the LOCKED DEFAULT (A first, then C; B is the robust path).
- **Issue:** The owner attempted to apply `supabase/migrations/20260616_booking_a_get_available_slots.sql` in the Supabase SQL editor and received `ERROR: 42601: syntax error at or near "time"` at LINE 195. Root cause: the RPC used an unquoted `time text` column in `RETURNS TABLE`. Supabase rejected it.
- **Repair:** The on-disk migration at `supabase/migrations/20260616_booking_a_get_available_slots.sql` was updated to quote `"time"` in three places:
  - `RETURNS TABLE`: `time text` → `"time" text`.
  - inner `SELECT`: `s.time` → `s."time" AS "time"`.
  - `ORDER BY`: `ORDER BY s.date ASC, s.time ASC` → `ORDER BY s.date ASC, s."time" ASC`.
  - Plus a nearby comment block documenting the quoting rationale and an inline comment label.
- **Verification:** the owner re-applied the repaired migration in the Supabase SQL editor. Supabase accepted it. Function verification (read from `pg_proc`) passed: `function_name = get_available_slots`, `arguments = p_month integer, p_year integer`, `returns = TABLE(id uuid, date date, "time" text)`, `security_definer = true`, `provolatile = 's'`, `proconfig = ['search_path=pg_catalog, public']`. Smoke test passed: `SELECT date, "time" FROM public.get_available_slots(6, 2026) ORDER BY date, "time" LIMIT 20` returned available slots from seeded dates.
- **Hard rules respected:** no source code change outside the on-disk SQL migration (the only file modified was the SQL migration itself; the modification was limited to the three quoted-`"time"` repairs + the documentation comments); no `git add` / `commit` / `push`; no `npm install`; no Supabase CLI; no `psql`; no deploy command; no MCP setup; no Ponytail / ECC / affaan-m/ecc install / clone / copy / configure / evaluate. OpenCode did not run the SQL; the owner did.
- **Status:** Booking A Repair 1 passed. Booking A SQL is applied in Supabase. The on-disk migration is the source of truth and matches the applied SQL.

### 2026-06-16 — Booking A live grant repair (applied and verified by owner)

- **Phase:** Booking A live grant repair (post-apply hardening; documented in `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md`).
- **Carry-forward:** Booking A SQL is applied (after Repair 1). Security 3 RLS is in place. The forward-compatible anon `EXECUTE` grant on `get_available_slots` is the intended read path. Defense in depth: the owner also revoked any broad direct table privileges from `anon` and `authenticated` on the underlying tables.
- **What the owner did:**
  - Revoked any broad direct table privileges from `anon` and `authenticated` on `public.available_slots` and `public.bookings` (defense in depth on top of the Security 3 deny policies).
  - Revoked `authenticated` `EXECUTE` on `public.get_available_slots` (the project has no authenticated user flow today; the role is denied by default and should not appear in the RPC grants).
  - Restored the intended grants: `anon` `EXECUTE` on `public.get_available_slots`; `service_role` `EXECUTE` on `public.get_available_slots`.
- **Final verification (confirmed by owner 2026-06-16):**
  - `anon` has `EXECUTE` on `get_available_slots`.
  - `service_role` has `EXECUTE` on `get_available_slots`.
  - `authenticated` does **not** appear in the RPC grants.
  - `anon` has no direct privileges on `available_slots`.
  - `anon` has no direct privileges on `bookings`.
- **Hard rules respected:** no source code change; no `git add` / `commit` / `push`; no `npm install`; no Supabase CLI; no `psql`; no deploy command; no MCP setup. OpenCode did not run the SQL; the owner did.
- **Status:** Booking A live grant repair applied and verified.

### 2026-06-16 — Booking A runtime state record (documentation-only state sync)

- **Phase:** Booking A runtime state record (documentation-only state sync; no source code change; no SQL applied by OpenCode).
- **Goal:** Update documentation/state files so the repo no longer says Security 3 or Booking A are "not applied at runtime." Record the runtime-applied state, the Booking A Repair 1 outcome, the live grant repair, and the known non-blocking time-ordering issue.
- **Runtime facts (confirmed by owner 2026-06-16):**
  - Security 3: `public.bookings` and `public.available_slots` have `relrowsecurity = true` and `relforcerowsecurity = true`; four RLS policies exist; base schema in place; `public.available_slots` was seeded with 840 slots. **R-003 closed end-to-end.** F-003 verified.
  - Booking A: `public.get_available_slots(p_month int, p_year int)` was applied after Booking A Repair 1. Function verification passed. Smoke test passed. **R-005 partially closed at the read path level and verified at the runtime level.** F-004 implemented for the read path and verified at the runtime level.
  - Booking A live grant repair applied and verified. `anon` has `EXECUTE`; `service_role` has `EXECUTE`; `authenticated` does **not** appear in the RPC grants; `anon` has no direct privileges on the tables.
- **Known non-blocking issue:** the `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`). Recorded as a future minor repair or Booking B-adjacent cleanup. Do not start that repair unless explicitly approved.
- **State files updated:** `PROJECT_CONTROL_LOG.md` (Booking A runtime state record overlay), `memory/CURRENT_STATE.md` (Security 3 + Booking A entries updated to "applied and verified at runtime"; "What is blocked" updated; "Exact next gate" updated), `memory/ACTIVE_TASK_CONTEXT.md` (replaced with the runtime state record task; in-scope and out-of-scope lists; definition of done), `memory/WORKING_MEMORY.md` (current task updated; phase gate updated; "Booking A runtime state record" section appended), `memory/EPISODIC_MEMORY.md` (this event), `memory/IMPORTANT_DECISIONS.md` (Booking A Repair 1 reflection note appended; Booking A runtime state record note appended; no new D-IDs), `ai/AI_TASK_CAPSULE.md` (phase line updated; never-do list extended; "Things to be skeptical of" updated), `ai/AI_CONTEXT_RULES.md` (Booking A runtime state rule appended; Security 3 runtime state rule appended), `docs/51_AGENT_HANDOFF_LOG.md` (runtime state record entry appended), `repo-research/SECURITY_3_SUPABASE_RLS_NOTES.md` (status banner updated; "What remains blocked" section updated), `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md` (status banner updated; live grant repair recorded; known non-blocking time-ordering issue recorded; "What remains blocked" section updated; sign-off updated), `docs/DATABASE.md` (Security 3 + Booking A recorded as applied and verified at runtime), `docs/SECURITY.md` (Security 3 + Booking A recorded as applied and verified at runtime; live grant repair recorded; F-003 verified; R-003 closed end-to-end), `docs/DEPLOYMENT.md` (Security 3 + Booking A sections updated to reflect runtime-applied state; post-deploy checklist updated), `INTEGRATION_NOTES.md` (§2 + §8.3 updated to reflect runtime state).
- **On-disk migration at `supabase/migrations/20260616_booking_a_get_available_slots.sql`:** unchanged in this overlay (already in its post-Repair 1 form from the prior turn; runtime changes were applied by the owner in Supabase).
- **Booking B = next eligible implementation phase, but NOT started.** Booking B is blocked until ChatGPT Control Room issues the exact Booking B prompt. No `reserve_slot` SQL written. No `bookings` table changes. No Worker changes.
- **Hard rules respected:** no source code change; no `git add` / `commit` / `push`; no `npm install`; no Supabase CLI; no `psql`; no deploy command; no MCP setup; no Ponytail / ECC / affaan-m/ecc install / clone / copy / configure / evaluate. The on-disk SQL migration is unchanged in this overlay.
- **Status:** Documentation-only state sync run. The repo no longer says Security 3 or Booking A are "not applied at runtime." Security 3 and Booking A are recorded as **applied and verified**. Booking A Repair 1 is recorded as **passed and applied to the on-disk migration**. Booking A live grant repair is recorded as **applied and verified**. Booking B is **next eligible but not started**. The first commit is OPTIONAL. The next gate is **ChatGPT Control Room issuing the exact Booking B prompt** (and reviewing the Booking A runtime state recorded in this overlay).

## 2026-06-16 — Booking B runtime state record (documentation-only state sync)

- **Agent:** BOOKING-B-AGENT.
- **Phase status:** documentation-only state sync. No source code change. No SQL applied by OpenCode. No Worker deployed by OpenCode. **Booking B is now applied and verified at runtime by the owner (2026-06-16).** The repo previously said Booking B was "code-shipped at the write path level" and "deferred at the runtime level" — that is no longer true. This task updates documentation/state files to reflect the runtime state. No `git add`, no `git commit`, no `git push`, no `git remote add`, no `git fetch`, no `git pull`. No `wrangler deploy`. No `npm install`, no `pnpm install`, no `yarn install`, no `npx`, no `psql`, no `supabase` CLI command, no database command of any kind. No deploy command. No package-manager command. No Cloudflare dashboard command. No Supabase dashboard command. No source code edits. No SQL file edits. No lockfile edits. No config file edits. No env edits. No `package.json` edits. No `tsconfig.json` edits. No `next.config.*` edits. No `postcss.config.*` edits. No eslint / tailwind config edits. No real `.env*` edits. No `public/_headers` edits. No `app/`, `components/`, `hooks/`, `lib/`, `styles/` edits. No `workers/` edits. No `supabase/migrations/` edits. No MCP setup. No Ponytail / ECC / affaan-m/ecc install / clone / copy / configure / evaluate. No Observability, no QA, no TS0 / RDG0 install, no UIX0 / MOTION0, no Admin future, no Final QA / delivery work started.
- **Runtime facts confirmed by owner (2026-06-16):**
  - **Booking B SQL:** `public.reserve_slot(p_date date, p_time text, p_booking jsonb)` exists with the documented signature. `bookings_preferred_date_time_unique` exists. The grant repair was applied: `anon` and `authenticated` do **not** have EXECUTE on `reserve_slot`; `service_role` has EXECUTE on `reserve_slot`. R-005 is **fully closed at the runtime level** (was code-shipped at the write path level in the prior Booking B turn). F-004 is **fully closed at the runtime level** (was implemented at the full booking flow level in the prior Booking B turn).
  - **Worker:** `workers/booking-reservation-worker.tsamuel.workers.dev` is deployed (owner-provided Worker URL; the `.ts` in the URL is a copy-paste artifact of the source filename; the actual deployed URL is the Worker URL the owner used during dashboard paste). The Cloudflare dashboard JS repair (Booking B Repair 1, 2026-06-16) was needed because the Cloudflare dashboard editor parses pasted code as JavaScript, not TypeScript; the `.ts` source contains `interface Env` (line 178) and other TypeScript-only syntax that fails strict-mode parsing. The owner used `workers/booking-reservation-worker.dashboard.js` for the dashboard paste. Required Worker env vars were configured: `ALLOWED_ORIGIN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. n8n vars (`N8N_BOOKING_WEBHOOK_URL`, `N8N_BOOKING_SECRET`) were intentionally left for later. The Worker smoke test passed. The Worker returned `bookingId = 69e071f0-8954-4da1-bcb4-75f272bd2b87` with `notification = "skipped"` (because n8n vars are not configured). Supabase verification confirmed the booking row exists in `public.bookings` for `preferred_date = 2026-06-17` / `preferred_time = '10:00 AM'`. Supabase verification confirmed `available_slots.is_booked = true` for `2026-06-17` / `10:00 AM`. A duplicate booking test returned `slot_already_booked` (`P0001`), which confirms the row lock + UNIQUE constraint defense in depth is working.
  - **Frontend deployment:** Cloudflare Pages project is connected to GitHub. Current Pages deployment is still old GitHub code (pre-Booking-B). Booking B frontend cannot be live-tested through Pages until the updated local code is pushed/deployed. Git push / remote remains blocked until the owner explicitly approves final delivery deploy.
- **State files updated in this overlay:** `PROJECT_CONTROL_LOG.md` (Booking B runtime state record overlay appended after the Booking B Repair 1 overlay); `memory/CURRENT_STATE.md` (Phase line + "What is blocked" + "Exact next gate after Booking B" updated to reflect runtime state); `memory/ACTIVE_TASK_CONTEXT.md` (task replaced with the runtime state record task; in-scope / out-of-scope / definition of done updated); `memory/WORKING_MEMORY.md` (current task updated; phase gate updated; active restrictions line preserved; "Booking B runtime state record" section appended); `memory/EPISODIC_MEMORY.md` (this event); `memory/IMPORTANT_DECISIONS.md` (Booking B runtime state record note appended; no new D-IDs); `ai/AI_TASK_CAPSULE.md` ("Phase we are in" updated; never-do list extended with runtime-state rules; "Things to be skeptical of" updated); `ai/AI_CONTEXT_RULES.md` (Booking B hard rule extended with runtime state record line; future-phase boundary rule reaffirmed); `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md` (status banner updated; "What is blocked" section updated; sign-off updated; a runtime state record note appended); `docs/DEPLOYMENT.md` (new "Booking B — Reserve Slot RPC + Worker (2026-06-16; applied and verified at runtime 2026-06-16)" section added; post-deploy checklist extended; "What is not part of the deploy" extended); `INTEGRATION_NOTES.md` (§2 + §8.3 updated to reflect Booking B runtime state; §8.3 Booking B write-path section updated to record the runtime-applied state; the §8.3 `p_time time` typo is informational only — the actual SQL on disk has `p_time text` per the existing `available_slots.time` text column and per the spec; the typo is a documentation reference, not a code issue); `docs/51_AGENT_HANDOFF_LOG.md` (Booking B runtime state record handoff entry appended).
- **No source code change.** No SQL file change. No env file change. No lockfile change. No `package.json` change. No `tsconfig.json` change. No `next.config.*` change. No `postcss.config.*` change. No eslint / tailwind config change. No `public/_headers` change. No `app/` / `components/` / `hooks/` / `lib/` / `styles/` / `workers/` / `supabase/migrations/` change. The on-disk Booking B SQL migration at `supabase/migrations/20260616_booking_b_reserve_slot.sql` is unchanged in this overlay (already in its final form from the prior turn; runtime changes were applied by the owner in Supabase). The Worker source at `workers/booking-reservation-worker.ts` is unchanged. The dashboard JS copy at `workers/booking-reservation-worker.dashboard.js` is unchanged. The frontend `lib/booking-actions.ts` and `components/booking-calendar-custom.tsx` are unchanged. `.env.local.example` is unchanged.
- **Hard rules respected:** no source files modified; no `git add` / `commit` / `push`; no `npm install`; no `pnpm install`; no `yarn install`; no `npx`; no `npm run`; no `pnpm run`; no `yarn run`; no `wrangler deploy`; no deploy command of any kind; no Cloudflare dashboard command; no Supabase dashboard command; no `psql`; no `supabase` CLI command; no database command of any kind; no package-manager command of any kind; no `package.json` change; no `package-lock.json` change; no `pnpm-lock.yaml` change; no `yarn.lock` change; no `tsconfig.json` change; no `next.config.*` change; no `postcss.config.*` change; no eslint / tailwind config change; no real `.env*` change; no source edit outside the explicit Booking B runtime state record scope (state files only); no `app/admin/**` change; no `app/**` change; no `hooks/` change; no `public/` change; no `styles/` change; no `workers/` change; no `lib/` change; no `components/` change; no `supabase/migrations/` change; no `tests/` change; no `.github/` change; no MCP setup; no Ponytail; no ECC / affaan-m/ecc; no Impeccable; no Emil Kowalski; no Playwright; no Chrome DevTools MCP; no Graphify; no Repomix; no Context7 MCP; no Tree-sitter; no codebase-memory MCP; no new `NEXT_PUBLIC_*_SECRET` env var; no `service_role` key in any `NEXT_PUBLIC_*` env var, in the static bundle, in the repo, or in any client-reachable file; no new env var of any kind. The runtime state record is documentation / state files only.
- **No application of the Booking B SQL migration by OpenCode.** The migration is on disk and the owner has applied it. OpenCode did not apply it; OpenCode is only updating documentation/state files in this overlay.
- **No deployment of the Booking Worker by OpenCode.** The Worker source is shipped (both `.ts` and `.dashboard.js`). Deployment is owner-driven and has been completed by the owner. OpenCode did not deploy.
- **No new decisions.** This overlay only records runtime state and a Booking B runtime state record reflection note. The D-IDs in `memory/IMPORTANT_DECISIONS.md` remain canonical. The runtime state record note is the only Booking B runtime state record write to `memory/IMPORTANT_DECISIONS.md`. The agent does not start Observability, QA, TS0 / RDG0, UIX0 / MOTION0, Admin future, or Final QA / delivery.
- **No starting of Observability.** The next eligible implementation phase after Booking B is **Observability (A0 future phase #10)**. Observability is blocked until ChatGPT Control Room issues the exact Observability prompt.
- **Remaining deployment gap:** the Cloudflare Pages project is connected to GitHub but the current Pages deployment is still old GitHub code (pre-Booking-B). The Booking B frontend cannot be live-tested through Pages until the updated local code is pushed/deployed. Git push / remote remains blocked until the owner explicitly approves final delivery deploy. The booking submission path can be smoke-tested at the Worker level (which is the case the owner did with `bookingId = 69e071f0-8954-4da1-bcb4-75f272bd2b87` + `notification = "skipped"`) but the browser-driven end-to-end flow requires Pages to serve the new frontend.
- **Status:** Documentation-only state sync run. Booking B is **applied and verified at runtime by the owner (2026-06-16)**. R-005 is **fully closed at the runtime level**. F-004 is **fully closed at the runtime level**. The on-disk SQL migration is unchanged. The Worker sources are unchanged. The frontend is unchanged. `.env.local.example` is unchanged. No commit. No push. No remote. The first commit is OPTIONAL. The next gate is **ChatGPT Control Room approval of the Booking B runtime state record** and the owner's decision on whether to push the local code to GitHub and trigger a final-delivery Pages deploy. The next phase after Booking B runtime closure is **Observability (A0 future phase #10)**. Observability is still blocked.

