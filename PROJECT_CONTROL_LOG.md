# PROJECT_CONTROL_LOG

**Project:** CodeOutfitters
**System:** Universal Agent-Based Project Planning & Delivery System v3.5
**Repository root:** `F:\CodeOutfitters`

---

## Current Phase

**A0**

This phase produces the action / build plan for the future phases that PM1, PD1, and D0 defined. A0 is plan-only. A0 writes the concrete PR-by-PR, file-by-file, owner-decision-by-owner-decision plan for the future phases. A0 does not implement. A0 does not install. A0 does not configure tooling. A0 does not evaluate **Ponytail** or **ECC / affaan-m/ecc**.

## Phase History

| Phase | Status | Notes |
|---|---|---|
| DOC-DISCOVERY | completed | Repository scanned; report produced. |
| DOC-MEMORY-REPAIR | completed | Foundation tree in place. Owner direction addendum (D-011, D-012) captured. |
| OVERNIGHT-SAFE-PRE8-AND-PM1-PREP | completed | PRE8 passed. Documentation audit, risk register, strategy briefs, and PM1 input prepared. Awaiting ChatGPT Control Room approval for next phase. |
| PM1 | written; pending review | `docs/PM1_PLAN.md` created. PM1 plan file written to disk; pending ChatGPT Control Room review. No code, no installs, no lockfile edits, no README edits. |
| PD1 | written; pending review | `docs/PD1_DECISION_LOCK.md` and `repo-research/PD1_OWNER_DECISION_BALLOT.md` created. PM1 register (D-015..D-027) and follow-up items (Q-13..Q-21) normalized into a default-or-approve ballot. No code, no installs, no MCP setup, no lockfile edits, no README edits. |
| D0 | written; pending review | `docs/D0_ARCHITECTURE_DECISIONS.md`, `docs/D0_SYSTEM_DESIGN.md`, `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` created. PM1 + PD1 reflected; target architecture planned. Plan-only. No code, no installs, no MCP setup, no lockfile edits, no README edits, no security/booking fixes. |
| A0 | written; pending review | `docs/A0_ACTION_PLAN.md`, `repo-research/A0_PHASE_EXECUTION_QUEUE.md`, `repo-research/A0_AGENT_ASSIGNMENT_MATRIX.md`, `repo-research/A0_CHANGE_ZONE_MAP.md` created. The concrete PR-by-PR, file-by-file, owner-decision-by-owner-decision plan for the future phases that PM1, PD1, and D0 defined. `INTEGRATION_NOTES.md` updated additively with the A0 integration sequencing clarifications. Plan-only. No code, no installs, no MCP setup, no lockfile edits, no `package.json` edits, no README edits, no security / booking fixes, no UIX0 / MOTION0 / TS0 / RDG0 / IMPL work started, no git init, no Ponytail install / clone / copy / configure / evaluation, no ECC / affaan-m/ecc install / clone / copy / configure / evaluation. |
| Setup | run; first commit pending | Root confirmed `F:\CodeOutfitters`. `git init -b main` run. `.gitignore` repaired (corruption fixed; `dist/`, `build/`, `tsconfig.tsbuildinfo`, `*.log`, `logs/` added). `repo-research/SETUP_FIRST_COMMIT_PLAN.md` written. No commit created. A0 still pending ChatGPT Control Room review. |
| UIX0 / MOTION0 | blocked | Cannot start until PM1 (or later) passes and TS0/RDG0 approval is granted. Captures D-011 (premium motion) and D-012 (Impeccable + Emil Kowalski adoption). |
| Coding / feature work | blocked | Cannot start until A0 passes. |

## Gate Status

| Gate | Status |
|---|---|
| TS0 (tooling scope) | **not requested** |
| RDG0 (research/data gate) | **not requested** |
| PM1 (plan merged) | written; pending review |
| PD1 (decision lock) | written; pending review |
| D0 (design merged) | written; pending review |
| A0 (action / build plan merged) | written; pending review |
| Setup (git init + .gitignore review + first commit plan) | run; first commit pending |
| Coding | blocked |
| Package install | blocked |
| Tooling install (Playwright/MCP/Graphify/Repomix/Context7/Tree-sitter/codebase-memory/ECC/affaan-m/ecc/Ponytail) | **not approved** |

## Current Repo Type

Real working app — production-bound static site + internal admin tool.

- Public surface: Next.js 16 static export, Cloudflare Pages target.
- Internal surface: password-gated admin tool for client intake + AI proposal generation.
- Single operator (Tayyab).
- No test suite. No CI. No error tracking. No analytics.

## Main Blockers (must not be fixed in this phase)

1. Required development memory missing — **addressed by this phase**.
2. README is weak and partially wrong (says port 3000, script is 3005).
3. Security documentation missing — **addressed by this phase**.
4. Admin auth is exposed client-side via `NEXT_PUBLIC_ADMIN_PASSWORD`.
5. Anthropic API key is exposed client-side via `NEXT_PUBLIC_ANTHROPIC_API_KEY`.
6. Dual lockfiles (`package-lock.json` and `pnpm-lock.yaml`) both committed.
7. Booking UI does not consult `available_slots.is_booked` — double-booking risk.
8. No QA / test harness, no Playwright, no MCP, no CI.

## Tooling Status

| Tool | Status |
|---|---|
| Playwright | not approved |
| Playwright MCP | not approved |
| Chrome DevTools MCP | not approved |
| Graphify | not approved |
| Repomix | not approved |
| Context7 MCP | not approved |
| Tree-sitter | not approved |
| codebase-memory MCP | not approved |
| Ponytail (candidate) | not approved |
| ECC / affaan-m/ecc (candidate) | not approved |

No paid tools approved. No new dependencies approved. Free / open-source only when tooling is eventually approved.

## Active Constraints

- Do not code.
- Do not change app logic.
- Do not edit functional source files (`app/`, `components/`, `lib/`, `hooks/`, `public/`, `*.config.*`, `package.json`, lockfiles, `tsconfig.json`).
- Do not run `npm install`, `pnpm install`, or any package manager command.
- Do not run `npx skills add`, `npx impeccable install`, or any skill install command.
- Do not configure MCP servers of any kind.
- Do not add new animation libraries, do not edit `package.json` for motion packages.
- Do not delete either lockfile.
- Do not move the Anthropic API behind a server function.
- Do not start PM1, D0, A0, UIX0 / MOTION0, or feature development.

## Allowed File Operations In This Phase

- Create files inside `docs/`, `memory/`, `ai/`, `repo-research/`.
- Create the three root files: `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`, and (already created) `docs/51_AGENT_HANDOFF_LOG.md`.
- No other writes.

## Next Gate After Repair

**ChatGPT Control Room approval** is required before:
- Repairing the README.
- Removing the dual lockfile.
- Implementing any security hardening.
- Fixing the booking availability logic.
- Requesting TS0 / RDG0 approval for any tooling.
- Opening D0, A0, UIX0 / MOTION0, IMPL, or any implementation.

## PM1 batch overlay (2026-06-16)

**Phase:** PM1 — Plan (write-only).

**Gate status (overlay):**
- PM1 plan file (`docs/PM1_PLAN.md`) created.
- PM1 review is the next gate (ChatGPT Control Room).
- D0 blocked until PM1 passes.
- A0 blocked until D0 passes.
- UIX0 / MOTION0 implementation blocked until PM1, D0, A0, and TS0 / RDG0 approval.
- TS0 / RDG0 tooling blocked.
- Coding blocked.
- Tool installation blocked.
- Lockfile edits blocked.
- `package.json` edits blocked.
- README edits blocked.
- Security fixes blocked.
- Booking fixes blocked.
- No source / runtime / config files were modified.

**Allowed change zones for this batch:** `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`. No other files.

**Inputs respected:** D-001 to D-014 (previous decisions), PRE8 checkpoint, all overnight strategy briefs, all 35 risk-register entries, all state files. New PM1 decisions: D-015 to D-027 (see `memory/IMPORTANT_DECISIONS.md`). These are recommendations, not owner decisions.

**Outputs of this batch:**
- `docs/PM1_PLAN.md` (primary deliverable; 14 workstreams).
- `repo-research/PM1_DECISION_MATRIX.md` (D-15..D-27 detail).
- `repo-research/PM1_PHASE_SEQUENCE.md` (27 phases with gates and rules).
- State updates in `memory/`, `ai/`, `PROJECT_CONTROL_LOG.md`, `docs/51_AGENT_HANDOFF_LOG.md`.

## PD1 batch overlay (2026-06-16)

**Phase:** PD1 — Decision Lock (write-only).

**Gate status (overlay):**
- PD1 plan file (`docs/PD1_DECISION_LOCK.md`) created.
- PD1 ballot (`repo-research/PD1_OWNER_DECISION_BALLOT.md`) created.
- PM1 register (D-015..D-027) and follow-up items (Q-13..Q-21) normalized into a single default-or-approve ballot.
- PD1 review is the next gate (ChatGPT Control Room).
- D0 blocked until PM1 and PD1 pass.
- A0 blocked until D0 passes.
- UIX0 / MOTION0 implementation blocked until PM1, D0, A0, and TS0 / RDG0 approval.
- TS0 / RDG0 tooling blocked.
- Coding blocked.
- Tool installation blocked.
- Lockfile edits blocked.
- `package.json` edits blocked.
- README edits blocked.
- Security fixes blocked.
- Booking fixes blocked.
- No source / runtime / config files were modified.

**Allowed change zones for this batch:** `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`. `INTEGRATION_NOTES.md` was not modified (no integration contract changed in PD1).

**Inputs respected:** D-001 to D-027 (previous decisions), PRE8 checkpoint, all overnight strategy briefs, all 35 risk-register entries, all state files. PD1 does not add new decisions; it normalizes the PM1 register (D-015..D-027) and the PM1 follow-up items (Q-13..Q-21) into a single ballot. Recommended defaults carry forward; owner can accept, override, or defer each.

**Outputs of this batch:**
- `docs/PD1_DECISION_LOCK.md` (primary deliverable; 13 PM1 decisions + 6 architectural-path decisions + 9 follow-up items normalized to a single ballot; lock-status legend; D0 readiness assessment; gates-still-blocked list).
- `repo-research/PD1_OWNER_DECISION_BALLOT.md` (optional support file; one row per decision for fast owner response).
- State updates in `memory/`, `ai/`, `PROJECT_CONTROL_LOG.md`, `docs/51_AGENT_HANDOFF_LOG.md`.

## D0 batch overlay (2026-06-16)

**Phase:** D0 — Design / Architecture (write-only).

**Gate status (overlay):**
- D0 plan files (`docs/D0_ARCHITECTURE_DECISIONS.md`, `docs/D0_SYSTEM_DESIGN.md`, `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md`) created.
- PM1 + PD1 reflected. PD1 LOCKED DEFAULTS and PD1-shadowed architectural-path options carried into the D0 plan.
- D0 review is the next gate (ChatGPT Control Room).
- A0 blocked until D0 passes.
- UIX0 / MOTION0 implementation blocked until PM1, D0, A0, and TS0 / RDG0 approval.
- TS0 / RDG0 tooling blocked.
- Coding blocked.
- Tool installation blocked.
- Lockfile edits blocked.
- `package.json` edits blocked.
- README edits blocked.
- DEPLOY.md delete blocked.
- Security fixes blocked.
- Booking fixes blocked.
- Git init blocked.
- No source / runtime / config files were modified.

**Allowed change zones for this batch:** `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`. `INTEGRATION_NOTES.md` was not modified (no integration contract changed in D0; D0 only plans integration architecture).

**Inputs respected:** D-001 to D-027 (previous decisions), PRE8 checkpoint, PM1 (14 workstreams + 27 phases), PD1 (decision-lock + ballot), all overnight strategy briefs (security, booking, tooling, UIX0/MOTION0, QA, README, lockfile), all 35 risk-register entries, all state files, the current `docs/ARCHITECTURE.md` / `docs/SECURITY.md` / `docs/DATABASE.md`. D0 does not add new decisions; D0 only reflects PM1 + PD1. The D-IDs in `memory/IMPORTANT_DECISIONS.md` remain canonical.

**Outputs of this batch:**
- `docs/D0_ARCHITECTURE_DECISIONS.md` (primary deliverable; 12 areas: snapshot, target direction, security, booking, observability, admin, QA / CI, tooling, UIX0 / MOTION0, phase boundaries, risks, cross-cutting; PD1 reflection table; D0 readiness assessment; gates-still-blocked list; safety confirmation).
- `docs/D0_SYSTEM_DESIGN.md` (primary deliverable; target architecture, security, booking, documentation / cleanup, QA / CI, tooling, UIX0 / MOTION0, admin, observability design diagrams and contracts; phase boundary design; D0 acceptance criteria; safety confirmation).
- `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` (primary deliverable; hard rules, allowed change zones, off-limits, phase-by-phase implementation boundaries, integration contract register, risk-to-phase mapping, rollback posture per phase, owner-confirmation checkpoints; safety confirmation).
- State updates in `memory/`, `ai/`, `PROJECT_CONTROL_LOG.md`, `docs/51_AGENT_HANDOFF_LOG.md`. `INTEGRATION_NOTES.md` is not modified.

## Overnight batch overlay

**Phase:** OVERNIGHT-SAFE-PRE8-AND-PM1-PREP

**Gate status (overlay):**
- PRE8 may be performed in this batch.
- Formal PM1 remains blocked until ChatGPT Control Room approval.
- Coding blocked.
- Tool installation blocked.
- MCP setup blocked.
- D0 / A0 / UIX0 / MOTION0 all blocked.

**Allowed change zones for this batch:** `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`, `docs/*.md`, `memory/*.md`, `ai/*.md`, `repo-research/*.md`. No other files.

**Inputs respected:** D-011 (premium motion, no copy of befluence.pro), D-012 (Impeccable + Emil Kowalski, no install yet), all prior decisions, all known blockers.

## D0 ECC addendum overlay (2026-06-16)

**Phase:** D0 ECC addendum (write-only; additive to D0).

**Gate status (overlay):**
- D0 plan files (architecture decisions, system design, implementation boundaries) updated with ECC / affaan-m/ecc as a tooling candidate only.
- Phase history row added: D0 ECC addendum — pending review.
- Gate status row updated: tooling install row now lists Ponytail and ECC / affaan-m/ecc as not approved.
- Tooling status section extended: Ponytail (candidate) and ECC / affaan-m/ecc (candidate) marked as not approved.
- ECC recorded in `repo-research/TOOLING_APPROVAL_BRIEF.md` §1, §2, §5; in `memory/IMPORTANT_DECISIONS.md` "D0 ECC addendum — ECC / affaan-m/ecc tooling candidate"; in `memory/WORKING_MEMORY.md` "D0 ECC addendum — Open Question (Q-22)"; in `ai/AI_CONTEXT_RULES.md` "D0 ECC addendum tooling candidate rule"; in `ai/AI_TASK_CAPSULE.md` never-do list + D0 ECC tooling candidate section; in `docs/51_AGENT_HANDOFF_LOG.md` "D0 ECC addendum" entry.
- **No install approved.** ECC is a candidate only. Gated to **TS0 / RDG0**.
- A0 blocked until D0 (and the D0 ECC addendum) pass.
- UIX0 / MOTION0 implementation blocked.
- TS0 / RDG0 tooling blocked.
- Coding blocked.
- ECC install / clone / copy / configure / evaluation blocked.
- No source / runtime / config files were modified.

**Allowed change zones for this addendum:** `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`. `INTEGRATION_NOTES.md` was not modified (no integration contract changed in the D0 ECC addendum; ECC is a future TS0 / RDG0 candidate only).

**Inputs respected:** D-001 to D-027 (previous decisions), D0 plan files, D0 reflection note, the PD1 LOCKED DEFAULTS, the PD1 Ponytail candidate, the owner's ECC question, and ChatGPT Control Room's "not approved" assessment.

**Outputs of this addendum:**
- `docs/D0_ARCHITECTURE_DECISIONS.md` (new §11 "D0 ECC addendum"; new row #30 in the major decisions reflection table; ECC row in the tooling architecture table; hard-rules-reaffirmed line; gates-still-blocked list; safety confirmation; recommended-next-step list; top header line; "Out of scope" line).
- `docs/D0_SYSTEM_DESIGN.md` (new §7.10 "ECC / affaan-m/ecc candidate rule (NOT APPROVED)"; renumbering of §7.10 → §7.11 and §7.11 → §7.12; phase boundary table; D0 acceptance criteria; safety confirmation; top header line).
- `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` (hard-rules list; phase-by-phase TS0 / RDG0 entry; integration contract register note; risk-to-phase mapping; owner-confirmation checkpoints; safety confirmation; top header line).
- `repo-research/TOOLING_APPROVAL_BRIEF.md` (new ECC row in §1 and §2; §5 "What Must Not Happen" extended; tool-purpose-matrix narrative).
- `memory/WORKING_MEMORY.md` (active restrictions line; D0 plan summary; new "D0 ECC addendum — Open Question" section with Q-22).
- `memory/IMPORTANT_DECISIONS.md` (new "D0 ECC addendum — ECC / affaan-m/ecc tooling candidate (NOT APPROVED, 2026-06-16)" section; D0 reflection note extended).
- `ai/AI_TASK_CAPSULE.md` (never-do list; PD1 tooling candidate section extended with the D0 ECC entry).
- `ai/AI_CONTEXT_RULES.md` (new "D0 ECC addendum tooling candidate rule" hard rule).
- `docs/51_AGENT_HANDOFF_LOG.md` (D0 ECC addendum entry).
- `PROJECT_CONTROL_LOG.md` (this overlay; tooling status section extended; gate status row updated).

## A0 batch overlay (2026-06-16)

**Phase:** A0 — Action / Build Plan (write-only).

**Gate status (overlay):**
- A0 plan files (`docs/A0_ACTION_PLAN.md`, `repo-research/A0_PHASE_EXECUTION_QUEUE.md`, `repo-research/A0_AGENT_ASSIGNMENT_MATRIX.md`, `repo-research/A0_CHANGE_ZONE_MAP.md`) created. PM1 + PD1 + D0 + D0 ECC addendum reflected; concrete PR-by-PR, file-by-file, owner-decision-by-owner-decision plan for the future phases.
- Phase history row added: A0 — written; pending review.
- Gate status row updated: A0 (action / build plan merged) — written; pending review.
- "Current Phase" line updated to **A0**.
- `INTEGRATION_NOTES.md` updated additively with §8 "A0 integration sequencing clarifications" (prose only; no breaking changes; clarifies the Anthropic Worker path, the n8n per-form secret, the Supabase RLS strategy, the observability alert channel, the git / repo root setup contract, the Ponytail / ECC candidate status, the admin persistence contract, and the UIX0 / MOTION0 first-slice contract).
- A0 does not add new decisions. A0 only reflects PM1 + PD1 + D0 + D0 ECC addendum into the future execution queue. The D-IDs in `memory/IMPORTANT_DECISIONS.md` remain canonical. A0 appends an A0 reflection note to `memory/IMPORTANT_DECISIONS.md` and seeds the A0 owner-overrides subsection.
- **Ponytail** and **ECC / affaan-m/ecc** remain candidates only; NOT APPROVED; gated to TS0 / RDG0; no install, no clone, no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install in this batch or any pre-approval phase.
- A0 stops and waits for ChatGPT Control Room. A0 does not start Setup, Cleanup A, Cleanup B, Security 1..5, Booking A, Booking B, Observability, QA Slice 0..3, UIX0 / MOTION0 Planning, UIX0 / MOTION0 first slice, UIX0 / MOTION0 later slices, Admin future, or Final QA / delivery.
- UIX0 / MOTION0 implementation blocked.
- TS0 / RDG0 tooling blocked.
- Coding blocked.
- Lockfile edits blocked.
- `package.json` edits blocked.
- README edits blocked.
- DEPLOY.md delete blocked.
- Git init blocked.
- Security fixes blocked.
- Booking fixes blocked.
- No source / runtime / config files were modified.

**Allowed change zones for this batch:** `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md` (additive prose only).

**Inputs respected:** D-001 to D-027 (previous decisions), D-011, D-012, the PM1 plan, the PD1 LOCKED DEFAULTS, the PD1-shadowed architectural-path options, the PD1 bundled follow-up items (Q-13..Q-21), the D0 plan files, the D0 ECC addendum (Q-22), the existing risk register, the existing state files, and ChatGPT Control Room's "not approved" assessments for Ponytail and ECC.

**Outputs of this batch:**
- `docs/A0_ACTION_PLAN.md` (primary deliverable; current gate status; approved assumptions; full 20-phase sequence; per-phase purpose, must-not-do, allowed file zones, owner decisions, acceptance criteria, rollback plans, Control Room stop points; hard rules reaffirmed; A0 acceptance criteria; safety confirmation; recommended next step).
- `repo-research/A0_PHASE_EXECUTION_QUEUE.md` (the future phase queue table: Order, Phase, Purpose, Depends On, Allowed Files Later, Forbidden Now, Control Room Gate).
- `repo-research/A0_AGENT_ASSIGNMENT_MATRIX.md` (the future agent assignment table: Agent, Future Phase, Responsibility, Allowed Files Later, Required Inputs, Stop Condition).
- `repo-research/A0_CHANGE_ZONE_MAP.md` (the file-zone classification table: File / Zone, Phase Allowed, Why, Approval Required, Notes).
- `INTEGRATION_NOTES.md` (new §8 "A0 integration sequencing clarifications"; additive; prose only; no breaking changes).
- `PROJECT_CONTROL_LOG.md` (this overlay; "Current Phase" line updated to A0; phase history row added; gate status row updated).
- State updates in `memory/`, `ai/`, `docs/51_AGENT_HANDOFF_LOG.md`.

## Sign-off Line

This log is the canonical phase ledger. Any future agent must update it before stopping.

## Setup batch overlay (2026-06-16)

**Phase:** A0 Setup (write-only; git init only; no commit created in this batch).

**Gate status (overlay):**
- Root confirmed: `F:\CodeOutfitters` is the real repo root. `pwd` returns `F:\CodeOutfitters`. `git rev-parse --show-toplevel` (after `git init`) returns `F:/CodeOutfitters`.
- Git initialized: `git init -b main` was run at the confirmed root. No commits have been created. No remote added. No push.
- `.gitignore` reviewed and repaired:
  - Corruption on line 15 (`.DS_Storenode_modules`) fixed — split into `.DS_Store` and `node_modules/`.
  - Missing safe entries added: `dist/`, `build/`, `tsconfig.tsbuildinfo`, `*.log`, `logs/`.
  - `node_modules/` normalized to trailing-slash form.
  - No broad patterns added; no source-file hides; no lockfile pre-emption.
- Q-21 / D-027 owner confirmation: treated as **confirmed** for the purposes of `git init` only, based on the Setup phase prompt. The first commit has not been created in this batch; the owner may run it manually (see `repo-research/SETUP_FIRST_COMMIT_PLAN.md` §8) or the next Setup-AGENT invocation may be told to commit.
- A0 plan still pending ChatGPT Control Room review. The Setup phase is **not** a substitute for A0 review. Setup is one of the 20 future phases A0 names; Setup running before A0 review is a deliberate exception gated by the owner's Setup phase prompt.
- Cleanup A blocked until ChatGPT Control Room approves Setup + A0.
- Cleanup B blocked.
- Security 1..5 blocked.
- Booking A / B blocked.
- Observability blocked.
- QA Slice 0..3 blocked.
- TS0 / RDG0 tooling approval blocked.
- UIX0 / MOTION0 implementation blocked.
- Admin future blocked.
- Final QA / delivery blocked.
- Ponytail install / clone / config / evaluation blocked.
- ECC / affaan-m/ecc install / clone / config / evaluation blocked.
- Package installs blocked.
- No source / runtime / config files were modified (`.gitignore` was modified, which is allowed in Setup per the A0 plan §5.1 and the brief for this phase).

**Allowed change zones for this batch:** `.gitignore` (safe hygiene entries only), `PROJECT_CONTROL_LOG.md`, `docs/*.md`, `memory/*.md`, `ai/*.md`, `repo-research/*.md`. `INTEGRATION_NOTES.md` was not modified (no integration contract changed in Setup; Setup is the git / repo root setup contract already documented in `INTEGRATION_NOTES.md` §8).

**Inputs respected:** D-027 (Git / repo root status = confirm + `git init` at `F:\CodeOutfitters` in Setup phase, only if confirmed), D-015..D-026 (carried forward), the A0 plan (Setup = future phase #1, allowed to `git init`, review `.gitignore`, prepare first commit plan), `INTEGRATION_NOTES.md` §8 (git / repo root setup contract).

**Outputs of this batch:**
- `repo-research/SETUP_FIRST_COMMIT_PLAN.md` (primary deliverable; safe first commit plan; expected files, files NOT to commit, sensitive files, recommended commit message, manual owner commands, reversibility, gates-still-blocked, safety confirmation).
- `.gitignore` (corruption repaired; safe hygiene entries added: `dist/`, `build/`, `tsconfig.tsbuildinfo`, `*.log`, `logs/`).
- State updates in `memory/`, `ai/`, `PROJECT_CONTROL_LOG.md`, `docs/51_AGENT_HANDOFF_LOG.md`.
- No commit was created in this batch.
- `INTEGRATION_NOTES.md` was not modified (no integration contract changed in Setup; the git / repo root setup contract is already documented in §8).
- No source file in `app/`, `components/`, `hooks/`, `lib/`, `public/` was modified.
- No config file (`tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `components.json`, eslint / tailwind configs) was modified.
- No lockfile (`package-lock.json`, `pnpm-lock.yaml`) was modified or deleted.
- No `package.json` was modified.
- No packages were installed.
- No tooling was configured.
- No MCP server was configured.
- No Ponytail or ECC / affaan-m/ecc install / clone / copy / configure / evaluation was performed.
- No README or DEPLOY edits in this batch.
- No test files created.
- No CI files created.

**Status:** Setup phase is **ready for the first commit**; the first commit is **not** performed in this batch. The next gate after the first commit (and after A0 review) is ChatGPT Control Room approval to start Cleanup A.


## Git push / commit policy update (2026-06-16) � Control Room correction

**Phase:** Documentation-only update. No git operations performed in this batch. No source / package / lockfile / runtime / config files were touched.

**Owner direction (captured verbatim):**

- The owner does not want the project pushed in chunks.
- The owner wants the complete project pushed one time at the end.
- git init already happened locally and is accepted.
- git push is NOT approved.
- Adding a remote is NOT approved.
- Pushing to GitHub is NOT approved.
- The first baseline commit is now **OPTIONAL**, not required before Cleanup A.
- Cleanup A may proceed after ChatGPT Control Room approval without a baseline commit, if the owner wants one final commit only.

**Default policy recorded (applies from this batch onward):**

- Default to no remote push until final delivery approval.
- Default to no remote setup until final delivery approval.
- Do not run git push.
- Do not run git remote add.
- Do not create a GitHub repo.
- Do not publish the code.
- Mark local commits as OPTIONAL. The first local commit (if any) is left to the owner, per the Setup plan. If the owner wants rollback safety, local commits may be used later. If the owner wants one final clean commit, do not commit until final delivery.
- Do not run git add, git commit, git push, git remote add, git fetch, or git pull from this batch onward without explicit owner approval per occurrence.

**Effect on the Setup phase:**

- The Setup phase ran with git init -b main at F:\CodeOutfitters. That init is accepted; do not undo it. Do not re-init.
- The first commit, as documented in epo-research/SETUP_FIRST_COMMIT_PLAN.md, is now **OPTIONAL**, not required. The plan still exists; the owner may run the manual commands at any time. The owner may also choose to never run them and to commit once at final delivery.
- Cleanup A does not require a baseline commit. The previous Setup-handoff wording (\"Cleanup A blocked until ChatGPT Control Room approves Setup\") is refined: Cleanup A is blocked until ChatGPT Control Room approves Setup and A0. The first commit is not a precondition for Cleanup A.

**Effect on A0 (docs/A0_ACTION_PLAN.md �5.1 and �6, and epo-research/A0_PHASE_EXECUTION_QUEUE.md row #1):**

- Setup still confirms the root, runs git init (already done), reviews .gitignore (already done), and writes the first commit plan (already done).
- The first commit is OPTIONAL. It is not a stop point. The Setup stop point is \"first commit plan exists; phase stops and waits for ChatGPT Control Room.\"
- Cleanup A may proceed after ChatGPT Control Room approves Setup and A0, with or without a baseline commit.
- Subsequent phases (Cleanup B, TS0 / RDG0, QA Slice 0, Observability) still require the repo to be initialized (already done). They do not require a baseline commit.
- The owner may choose to commit locally at the end of any phase for rollback safety; the agent must not commit on the owner's behalf.

**Effect on the Cleanup B gate (git status clean before deletion):**

- Cleanup B's \"git status must be clean before deletion\" rule is relaxed: since the owner prefers a single final commit, git status showing only the in-progress Cleanup B changes (and any prior local commits the owner has chosen to make) is sufficient. The agent must not create commits to make git status clean. The owner creates commits only if and when they want to.

**Effect on PR-style review (every gated phase):**

- PR-style review is replaced by **phase-stop review**. The agent stops after each gated phase, the owner reviews, and the owner decides whether to commit locally and whether to advance. There is no GitHub PR review yet. The agent must not create a remote, not push, and not open a GitHub PR.

**Effect on tooling that depends on a remote:**

- No tooling in A0 / Cleanup A / Cleanup B / Security 1..5 / Booking / Observability / QA Slice 0 / UIX0 / MOTION0 depends on a remote. The remote is needed only at final delivery. The agent must not block on \"no remote\" in any pre-final-delivery phase.

**Files updated by this correction:**

- PROJECT_CONTROL_LOG.md (this overlay).
- memory/CURRENT_STATE.md.
- memory/ACTIVE_TASK_CONTEXT.md.
- memory/WORKING_MEMORY.md.
- memory/EPISODIC_MEMORY.md.
- memory/IMPORTANT_DECISIONS.md.
- i/AI_TASK_CAPSULE.md.
- i/AI_CONTEXT_RULES.md.
- docs/51_AGENT_HANDOFF_LOG.md.
- epo-research/SETUP_FIRST_COMMIT_PLAN.md (first commit marked optional; new policy section; manual owner commands kept as-is and marked optional).
- docs/A0_ACTION_PLAN.md (Setup �5.1 updated: \"first commit exists\" softened to optional; Control Room stop points �6 updated; \"What it will do\" / \"What it must not do\" / \"Allowed file zones\" carry forward with optional-commit language).
- epo-research/A0_PHASE_EXECUTION_QUEUE.md (Setup row #1: \"first commit plan\" instead of \"first commit\"; PR-style review replaced by phase-stop review).

**Files NOT updated:**

- pp/**, components/**, hooks/**, lib/**, public/**.
- package.json, package-lock.json, pnpm-lock.yaml.
- 	sconfig.json, 
ext.config.mjs, postcss.config.mjs, components.json, eslint / tailwind configs.
- README.md, DEPLOY.md (root), .env*, public/_headers, public/_redirects.
- INTEGRATION_NOTES.md (no integration contract changed in this correction; the git / repo root setup contract in �8 already says \"first commit is a snapshot of the current state\" and that wording is consistent with the new \"optional, not required\" policy).

**Commands NOT run in this batch:**

- No git add, no git commit, no git push, no git remote add, no git fetch, no git pull.
- No 
pm install, no pnpm install, no yarn install, no 
px, no 
px skills add, no 
px impeccable install.
- No package-manager command of any kind.
- No file changes outside the allowed change zones for this correction.

**Status:** Passed. The git push / commit policy is updated. Cleanup A remains blocked until ChatGPT Control Room approves Setup and A0. The first commit is now optional, not a precondition for Cleanup A.

## Cleanup A batch overlay (2026-06-16)

**Phase:** Cleanup A (A0 future phase #2; write + small source edits in the explicit Cleanup A scope; no commit; no push; no remote).

**Gate status (overlay):**
- Cleanup A is **run**; A0 still pending ChatGPT Control Room review (Cleanup A ran as a deliberate, additive exception gated by the owner's Cleanup A prompt; Cleanup A does not bypass A0 review; Cleanup A is not a substitute for A0 review).
- Root confirmed: F:\CodeOutfitters. Git initialized with git init -b main in the Setup phase. No commits. No remote. No push.
- README repaired per epo-research/README_REPAIR_SPEC.md. Port corrected to 3005. Entry point corrected to pp/(public)/page.tsx. Env vars listed (6). Admin warning and security warning included. Foundation docs cross-linked. ~104 lines.
- DEPLOY.md (root) deleted after verifying docs/DEPLOYMENT.md covers all of its content (target, build settings, env vars, Supabase setup, post-deploy checks, rollback). docs/DEPLOYMENT.md header note updated to reflect the deletion.
- Portfolio copy truth fix in pp/(public)/portfolio/page.tsx: metadata.description, PageHero label, PageHero title, and PageHero description changed from \"Real case studies / Real Businesses, Real Results\" to \"Sample Scenarios / Sample Automation Scenarios / Illustrative examples...\" � consistent with the existing SAMPLE WORK overline and per-card \"Sample Project\" badges in components/portfolio.tsx. No layout change. No feature change. Copy-only.
- Contact form components/contact.tsx: payload now includes source: \"contact\". One-line edit in JSON.stringify. No refactor. No webhook URL change. No n8n integration change beyond the source field.
- INTEGRATION_NOTES.md �1 contact row updated additively to record the new payload shape (source: \"contact\" now present).
- docs/ENVIRONMENT.md per-form payload contract list updated: contact form now sends source: \"contact\"; the \"no source and no type � contact form\" line removed.
- .gitignore not modified in this batch. Setup already added all Cleanup A hygiene entries (
ode_modules/, .next/, out/, dist/, uild/, .env, .env.local, .env*.local, 	sconfig.tsbuildinfo, .DS_Store, logs/, *.log). No additional Cleanup A entry is required.
- ESLint config: **deferred**. package.json has lint (eslint .) but no ESLint package is installed and no config file exists. The Cleanup A brief allows ESLint config only if it does not require package installs. Creating eslint.config.mjs with extends: \"next/core-web-vitals\" requires eslint-config-next; creating a flat config requires @eslint/js. The brief forbids installing packages. ESLint config is documented as deferred to a future phase (e.g. QA Slice 0 typecheck / lint prep, or a future Cleanup A pass after owner approves installing ESLint). R-026 remains open; the 
pm run lint line in the README is honest about the gap.
- Cleanup B blocked until ChatGPT Control Room approves Cleanup A.
- Security 1..5 blocked.
- Booking A / B blocked.
- Observability blocked.
- QA Slice 0..3 blocked.
- TS0 / RDG0 tooling approval blocked.
- UIX0 / MOTION0 implementation blocked (planning + first slice + later slices).
- Admin future blocked.
- Final QA / delivery blocked.
- Ponytail install / clone / configure / evaluate blocked.
- ECC / affaan-m/ecc install / clone / configure / evaluate blocked.
- Package installs blocked.
- Source edits outside Cleanup A scope blocked.
- No git add, no git commit, no git push, no git remote add, no GitHub repo, no publish.

**Allowed change zones for this batch:** README.md, DEPLOY.md (delete only), docs/DEPLOYMENT.md, pp/(public)/portfolio/page.tsx, components/contact.tsx (one-line source: \"contact\"), INTEGRATION_NOTES.md (additive clarification), docs/ENVIRONMENT.md (per-form payload table), PROJECT_CONTROL_LOG.md, docs/*.md, memory/*.md, i/*.md, epo-research/*.md. ESLint config not created (deferred). .gitignore not modified (Setup already covered Cleanup A entries).

**Files NOT modified:** package.json, package-lock.json, pnpm-lock.yaml, 	sconfig.json, 
ext.config.mjs, postcss.config.mjs, components.json, eslint / tailwind configs, pp/** (except pp/(public)/portfolio/page.tsx), components/** (except components/contact.tsx), hooks/, lib/, public/, styles/, .env*, .mcp.json, .opencode/, .codex/, .claude/, 	ests/, .github/.

**Inputs respected:** D-001..D-027, PM1, PD1, D0, D0 ECC addendum, A0 plan �5.2, the A0 phase execution queue #2, epo-research/README_REPAIR_SPEC.md, docs/DEPLOYMENT.md, docs/SETUP.md, docs/ENVIRONMENT.md, docs/SECURITY.md, the 2026-06-16 Control Room correction on git push / commit policy.

**Outputs of this batch:**
- README.md (repaired per spec).
- DEPLOY.md (root) (deleted).
- docs/DEPLOYMENT.md (header note updated to record the deletion).
- pp/(public)/portfolio/page.tsx (copy truth fix; metadata + PageHero).
- components/contact.tsx (one-line source: \"contact\" added to payload).
- INTEGRATION_NOTES.md (�1 contact row updated additively).
- docs/ENVIRONMENT.md (per-form payload table updated; contact form now sends source: \"contact\").
- State files updated: PROJECT_CONTROL_LOG.md (this overlay), memory/CURRENT_STATE.md, memory/ACTIVE_TASK_CONTEXT.md, memory/WORKING_MEMORY.md, memory/EPISODIC_MEMORY.md, memory/IMPORTANT_DECISIONS.md (no new D-IDs; ESLint deferral recorded), i/AI_TASK_CAPSULE.md, i/AI_CONTEXT_RULES.md, docs/51_AGENT_HANDOFF_LOG.md.

**Hard rules reaffirmed:** no package installs, no lockfile edits, no package.json edit, no 
ext.config.* edit, no 	sconfig.json edit, no MCP setup, no git add, no git commit, no git push, no git remote add, no GitHub repo, no publish, no Ponytail, no ECC / affaan-m/ecc, no source edit outside Cleanup A scope, no test file, no CI file, no Cleanup B, no Security, no Booking, no QA, no TS0 / RDG0, no UIX0 / MOTION0, no Admin future, no Final QA / delivery.

**Status:** Cleanup A run. README repaired. DEPLOY.md deleted. Portfolio copy truth fixed. Contact form source: \"contact\" added. Integration notes updated. ESLint config deferred. R-001..R-035, R-002 (lockfile), R-019 (portfolio copy), R-023 (DEPLOY.md), R-025 (.gitignore � already closed in Setup), R-026 (ESLint config � remains open, deferred to a future phase), R-027 (admin warning) addressed as appropriate. The first commit is OPTIONAL. The next gate is ChatGPT Control Room approval to start Cleanup B (lockfile cleanup per D-015).

## Cleanup B batch overlay (2026-06-16)

**Phase:** Cleanup B (A0 future phase #3; lockfile cleanup per D-015; no commit; no push; no remote; no package-manager command).

**Gate status (overlay):**
- Cleanup B is **run**; A0 still pending ChatGPT Control Room review. Cleanup B ran as a deliberate, additive exception gated by the owner's Cleanup B prompt. Cleanup B is not a substitute for A0 review.
- Root confirmed: F:\CodeOutfitters. Git initialized with git init -b main in the Setup phase. No commits. No remote. No push.
- **D-015 LOCKED DEFAULT applied: 
pm is the canonical package manager. package-lock.json is the canonical lockfile. pnpm-lock.yaml was deleted in this batch.** pnpm-lock.yaml is now listed in .gitignore so it cannot reappear accidentally. package.json is unchanged (no packageManager field was added because the chosen manager is 
pm and the brief forbids editing package.json unless a documented package-manager metadata field is absolutely required).
- **R-002 (dual-lockfile risk) is closed** in this batch. The CI re-entry guard (asserting pnpm-lock.yaml is absent on every PR) is **gated to a future TS0 / RDG0 phase** per the original epo-research/LOCKFILE_DECISION_BRIEF.md �6 and the A0 plan �5.3. The re-entry guard is a TS0 setup concern because it lives in a CI workflow file (.github/workflows/), which is a TS0 / RDG0 gated zone.
- Security 1..5 blocked until ChatGPT Control Room approves Cleanup B.
- Booking A / B blocked.
- Observability blocked.
- QA Slice 0..3 blocked.
- TS0 / RDG0 tooling approval blocked.
- UIX0 / MOTION0 implementation blocked (planning + first slice + later slices).
- Admin future blocked.
- Final QA / delivery blocked.
- Ponytail install / clone / configure / evaluate blocked.
- ECC / affaan-m/ecc install / clone / configure / evaluate blocked.
- Package installs blocked.
- Source edits outside Cleanup B scope blocked.
- No git add, no git commit, no git push, no git remote add, no GitHub repo, no publish.

**Pre-flight verification:**
- package-lock.json: present. Kept.
- pnpm-lock.yaml: present before deletion. Deleted in this batch.
- yarn.lock: not present.
- package.json: no packageManager field, no .npmrc / .pnpmrc checked in, scripts block uses no manager-specific shell syntax. No pnpm requirement found. Safe to delete pnpm-lock.yaml.

**Allowed change zones for this batch:** pnpm-lock.yaml (delete only), .gitignore, README.md, docs/SETUP.md, docs/DEPLOYMENT.md, epo-research/LOCKFILE_DECISION_BRIEF.md, epo-research/A0_PHASE_EXECUTION_QUEUE.md, epo-research/A0_CHANGE_ZONE_MAP.md, PROJECT_CONTROL_LOG.md, docs/*.md, memory/*.md, i/*.md, epo-research/*.md. INTEGRATION_NOTES.md was **not modified** (its two package-manager references are guard lines, not deployment instructions).

**Files NOT modified:** pp/**, components/**, hooks/**, lib/**, public/**, styles/**, package.json, package-lock.json, yarn.lock, 	sconfig.json, 
ext.config.mjs, postcss.config.mjs, components.json, 
ext-env.d.ts, .env*, .mcp.json, .opencode/, .codex/, .claude/, 	ests/, .github/, eslint / tailwind configs.

**Inputs respected:** D-015 (LOCKED DEFAULT; package manager = npm), A0 plan �5.3 (Cleanup B), epo-research/A0_PHASE_EXECUTION_QUEUE.md row #3, epo-research/A0_CHANGE_ZONE_MAP.md package.json / package-lock.json / pnpm-lock.yaml / .gitignore rows, epo-research/LOCKFILE_DECISION_BRIEF.md �3 (npm option; migration cost) and �6 (migration steps), the 2026-06-16 Control Room correction on git push / commit policy.

**Outputs of this batch:**
- pnpm-lock.yaml (deleted).
- .gitignore (pnpm-lock.yaml added; comment records Cleanup B 2026-06-16 and D-015).
- README.md (lockfile paragraph updated: canonical is 
pm / package-lock.json; pnpm-lock.yaml was removed in Cleanup B 2026-06-16 per D-015).
- docs/SETUP.md (prerequisites, install section, common pitfalls all updated).
- docs/DEPLOYMENT.md (build settings table now includes a "Package manager" row: 
pm; D-015 LOCKED DEFAULT).
- epo-research/LOCKFILE_DECISION_BRIEF.md (status banner: "Decision applied"; "Current State" updated to post-Cleanup-B; �9 "Gate Required Before Action" extended with "Resolution" section recording Cleanup B executed and R-002 closed; CI re-entry guard noted as gated to TS0 / RDG0).
- epo-research/A0_PHASE_EXECUTION_QUEUE.md (header banner: "Cleanup B executed").
- epo-research/A0_CHANGE_ZONE_MAP.md (header banner: "Cleanup B executed").
- State files updated: PROJECT_CONTROL_LOG.md (this overlay), memory/CURRENT_STATE.md, memory/ACTIVE_TASK_CONTEXT.md, memory/WORKING_MEMORY.md, memory/EPISODIC_MEMORY.md, memory/IMPORTANT_DECISIONS.md (Cleanup B reflection note appended; no new D-IDs; D-015 confirmed; R-002 closed), i/AI_TASK_CAPSULE.md, i/AI_CONTEXT_RULES.md (Cleanup B hard rule added), docs/51_AGENT_HANDOFF_LOG.md.

**Hard rules reaffirmed:** no git add, no git commit, no git push, no git remote add, no 
pm install, no pnpm install, no yarn install, no 
px, no package-manager command of any kind, no package.json change, no package-lock.json change, no yarn.lock change, no 	sconfig.json change, no 
ext.config.* change, no postcss.config.* change, no eslint / tailwind config change, no MCP setup, no Ponytail, no ECC / affaan-m/ecc, no Impeccable, no Emil Kowalski, no source edit outside Cleanup B scope, no test file, no CI file, no Security, no Booking, no Observability, no QA, no TS0 / RDG0 install, no UIX0 / MOTION0, no Admin future, no Final QA.

**Status:** Cleanup B run. pnpm-lock.yaml deleted. package-lock.json remains. .gitignore updated. Documentation updated. package.json untouched. R-002 (dual-lockfile risk) closed. CI re-entry guard gated to a future TS0 / RDG0 phase. The first commit is OPTIONAL. The next gate is ChatGPT Control Room approval to start Security 1 (Worker proxy for Anthropic per D-019a).

## Security 1 batch overlay (2026-06-16)

**Phase:** Security 1 (A0 future phase #4; D-019a Cloudflare Worker proxy for Anthropic; code + docs + CSP; no commit; no push; no remote; no deploy).

**Gate status (overlay):**
- Security 1 is **run**; A0 still pending ChatGPT Control Room review. Security 1 ran as a deliberate, additive exception gated by the owner's Security 1 prompt. Security 1 is not a substitute for A0 review.
- Root confirmed: F:\CodeOutfitters. Git initialized with git init -b main in the Setup phase. No commits. No remote. No push.
- **R-002 (Anthropic key in static bundle) is closed at the runtime level.** The browser no longer references NEXT_PUBLIC_ANTHROPIC_API_KEY and no longer connects to https://api.anthropic.com. The Anthropic key is now held server-side as ANTHROPIC_API_KEY in a Cloudflare Worker (workers/anthropic-proposal-proxy.ts).
- **F-001 implemented.** The Cloudflare Worker proxy is in workers/anthropic-proposal-proxy.ts. Native etch only. No npm dependencies. No package.json change. The Worker enforces ALLOWED_ORIGIN server-side (CORS gate) and returns 403 origin_not_allowed for any other Origin.
- **CSP updated.** public/_headers connect-src no longer has https://api.anthropic.com; it has https://*.workers.dev to cover the Worker origin. Supabase, n8n, and Tawk endpoints are unchanged.
- **No deploy was performed in this phase.** The Worker source is shipped. The Worker needs to be deployed to Cloudflare (wrangler deploy or the dashboard) before the frontend can use it. Deployment is owner-driven. Steps are in epo-research/SECURITY_1_WORKER_PROXY_NOTES.md �5.
- **CORS is not authentication.** The Worker is still gated to Security 2 (admin auth) before any non-internal launch. Security 1 does not implement admin auth.
- Security 2 blocked until ChatGPT Control Room approves Security 1.
- Security 3 (Supabase RLS) blocked.
- Security 4 (n8n per-form secret) blocked.
- Booking A / B blocked.
- Observability blocked.
- QA Slice 0..3 blocked.
- TS0 / RDG0 tooling approval blocked.
- UIX0 / MOTION0 implementation blocked (planning + first slice + later slices).
- Admin future blocked.
- Final QA / delivery blocked.
- Ponytail install / clone / configure / evaluate blocked.
- ECC / affaan-m/ecc install / clone / configure / evaluate blocked.
- Package installs blocked.
- Source edits outside Security 1 scope blocked.
- No git add, no git commit, no git push, no git remote add, no GitHub repo, no publish.
- No wrangler deploy. No 
pm install. No pnpm install. No yarn install. No 
px. No package-manager command of any kind. No deploy command of any kind.

**Pre-flight verification:**
- lib/proposal-generator.ts was reading process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY and calling https://api.anthropic.com/v1/messages directly. **Replaced.**
- pp/admin/proposal/page.tsx did not call Anthropic directly. It calls ProposalOutputView which calls generateProposal from lib/proposal-generator.ts. No change needed in the page.
- components/admin/proposal-output.tsx imports generateProposal and calls it. **No change needed** � the function shape and return type are unchanged.
- .env.local.example exposed NEXT_PUBLIC_ANTHROPIC_API_KEY as the primary Anthropic key. **Replaced** with NEXT_PUBLIC_PROPOSAL_WORKER_URL plus a DEPRECATED block.
- public/_headers had https://api.anthropic.com in connect-src. **Removed;** added https://*.workers.dev.
- INTEGRATION_NOTES.md �8.1 described the planned Security 1 contract. **Marked SHIPPED 2026-06-16** with the resolution.
- docs/SECURITY.md R-002 was a documented unfixed risk. **Closed** (moved to the "Closed risks" section with a Security 1 resolution).
- docs/DEPLOYMENT.md had no Worker section. **Added a "Cloudflare Worker (Security 1)" section;** updated CSP note; updated post-deploy check; updated the "What is not part of the deploy" section.

**Allowed change zones for this batch:** workers/anthropic-proposal-proxy.ts (new), lib/proposal-generator.ts (frontend integration), pp/admin/proposal/page.tsx (NOT modified; the page did not need to change because lib/proposal-generator.ts is the only call site for generateProposal), components/admin/proposal-output.tsx (NOT modified; the function shape and return type are unchanged), .env.local.example (template only), public/_headers (CSP), docs/ENVIRONMENT.md, docs/SECURITY.md, docs/DEPLOYMENT.md, INTEGRATION_NOTES.md, epo-research/SECURITY_1_WORKER_PROXY_NOTES.md (new), PROJECT_CONTROL_LOG.md, docs/*.md, memory/*.md, i/*.md, epo-research/*.md. No real .env or .env.local was modified. No package.json was modified. No lockfile was modified. No 	sconfig.json, 
ext.config.mjs, postcss.config.mjs, eslint / tailwind configs were modified.

**Files NOT modified:** package.json, package-lock.json, pnpm-lock.yaml, yarn.lock, 	sconfig.json, 
ext.config.mjs, postcss.config.mjs, components.json, 
ext-env.d.ts, .env* (only the example was touched), .mcp.json, .opencode/, .codex/, .claude/, 	ests/, .github/, all pp/** (except pp/admin/proposal/page.tsx was inspected but not modified), all components/** (except components/admin/proposal-output.tsx was inspected but not modified), hooks/, lib/ (except lib/proposal-generator.ts), public/ (except public/_headers), styles/, pp/admin/proposal/page.tsx, components/admin/proposal-output.tsx.

**Inputs respected:** D-019a (Cloudflare Worker proxy for Anthropic), A0 plan �5.4 (Security 1), epo-research/A0_PHASE_EXECUTION_QUEUE.md row #4, epo-research/A0_CHANGE_ZONE_MAP.md lib/proposal-generator.ts / pp/admin/proposal/page.tsx / public/_headers / Worker source / INTEGRATION_NOTES.md rows, docs/D0_ARCHITECTURE_DECISIONS.md Security area, docs/D0_SYSTEM_DESIGN.md Security design, epo-research/D0_IMPLEMENTATION_BOUNDARIES.md, epo-research/SECURITY_HARDENING_BRIEF.md Option B, docs/SECURITY.md R-002 and F-001, docs/DEPLOYMENT.md, docs/ENVIRONMENT.md, the 2026-06-16 Control Room correction on git push / commit policy.

**Outputs of this batch:**
- workers/anthropic-proposal-proxy.ts (new; the Worker source).
- lib/proposal-generator.ts (replaced direct Anthropic call with a thin Worker client; uses NEXT_PUBLIC_PROPOSAL_WORKER_URL).
- .env.local.example (added NEXT_PUBLIC_PROPOSAL_WORKER_URL; removed the encouraged public NEXT_PUBLIC_ANTHROPIC_API_KEY; added a DEPRECATED; do not set block).
- public/_headers (CSP connect-src updated: pi.anthropic.com removed; *.workers.dev added).
- docs/ENVIRONMENT.md (split into Frontend / Worker tables; deprecated NEXT_PUBLIC_ANTHROPIC_API_KEY).
- docs/SECURITY.md (R-002 closed; F-001 implemented; Security 1 status banner added).
- docs/DEPLOYMENT.md (added "Cloudflare Worker (Security 1)" section; updated CSP note; updated post-deploy check; updated "What is not part of the deploy" section).
- INTEGRATION_NOTES.md �8.1 (marked SHIPPED 2026-06-16 with the resolution).
- epo-research/SECURITY_1_WORKER_PROXY_NOTES.md (new; the primary deliverable for the Worker proxy; covers purpose, files changed, env vars, deployment steps, rollback plan, known remaining risks, Security 2 dependency, testing checklist).
- State files updated: PROJECT_CONTROL_LOG.md (this overlay), memory/CURRENT_STATE.md, memory/ACTIVE_TASK_CONTEXT.md, memory/WORKING_MEMORY.md, memory/EPISODIC_MEMORY.md, memory/IMPORTANT_DECISIONS.md (Security 1 reflection note appended; D-019a applied; R-002 closed; F-001 implemented; no new D-IDs), i/AI_TASK_CAPSULE.md, i/AI_CONTEXT_RULES.md (Security 1 hard rule added), docs/51_AGENT_HANDOFF_LOG.md.

**Hard rules reaffirmed:** no git add, no git commit, no git push, no git remote add, no 
pm install, no pnpm install, no yarn install, no 
px, no 
pm run, no pnpm run, no yarn run, no package-manager command of any kind, no wrangler deploy, no deploy command of any kind, no package.json change, no package-lock.json change, no pnpm-lock.yaml change, no yarn.lock change, no 	sconfig.json change, no 
ext.config.* change, no postcss.config.* change, no eslint / tailwind config change, no real .env* change, no MCP setup, no Ponytail, no ECC / affaan-m/ecc, no Impeccable, no Emil Kowalski, no source edit outside Security 1 scope, no test file, no CI file, no Security 2, no Security 3, no Security 4, no Booking, no Observability, no QA, no TS0 / RDG0 install, no UIX0 / MOTION0, no Admin future, no Final QA.

**Pre-stopping verification:**
- grep -r 'NEXT_PUBLIC_ANTHROPIC_API_KEY' lib/ app/ components/ public/ returns **0 active references** (only the comment in lib/proposal-generator.ts:7 marking it as deprecated, and the DEPRECATED block in .env.local.example). **Pass.**
- grep -r 'api.anthropic.com' lib/ app/ components/ public/ returns **0 matches** outside the Worker source. **Pass.**
- Frontend lib/proposal-generator.ts calls ${NEXT_PUBLIC_PROPOSAL_WORKER_URL}/ with { intakeData } body. **Pass.**
- Worker workers/anthropic-proposal-proxy.ts uses server-side ANTHROPIC_API_KEY and x-api-key header for the upstream Anthropic call. **Pass.**
- .env.local.example no longer encourages exposing the Anthropic key publicly (it is now in a DEPRECATED; do not set block; the new Worker URL placeholder is the primary key). **Pass.**
- public/_headers CSP connect-src does not include https://api.anthropic.com; it does include https://*.workers.dev. **Pass.**
- docs/SECURITY.md R-002 is in the "Closed risks" section. **Pass.**
- Security 2 admin auth remains blocked and not implemented. **Pass.**

**Status:** Security 1 run. Worker source shipped. Frontend updated. CSP updated. Documentation updated. R-002 closed at the runtime level. F-001 implemented. No commit. No push. No remote. No deploy. The first commit is OPTIONAL. The next gate is ChatGPT Control Room approval to start Security 2 (admin auth per D-020a).

## Security 2 batch overlay (2026-06-16)

**Phase:** Security 2 (A0 future phase #5; D-020a Cloudflare Access for fast internal admin protection; code + docs + CSP; no commit; no push; no remote; no deploy).

**Gate status (overlay):**
- Security 2 is **run**; A0 still pending ChatGPT Control Room review. Security 2 ran as a deliberate, additive exception gated by the owner's Security 2 prompt. Security 2 is not a substitute for A0 review.
- Root confirmed: F:\CodeOutfitters. Git initialized with git init -b main in the Setup phase. No commits. No remote. No push.
- **R-001 (admin password in static bundle) is addressed at the deployment level.** The real admin boundary is now **Cloudflare Access** in front of /admin/* on the deployed site. The local client-side password gate in pp/admin/layout.tsx is convenience-only and is explicitly labeled as such in the UI. R-001 is **deferred** for the local dev / preview environment (the convenience gate keeps the admin out of casual view there).
- **F-002 implemented** for the deployed path. Cloudflare Access replaces the client-side admin gate as the real boundary.
- **NEXT_PUBLIC_ADMIN_PASSWORD is deprecated as a real security boundary.** The line is preserved in .env.local.example in a DEPRECATED block ("convenience-only if set") for migration clarity. If the owner has not set up Cloudflare Access yet, the local convenience gate can still run by leaving the var set; it just does not provide security.
- **No new auth library is added.** No Auth.js. No Supabase Auth. No server route. No new npm dependency. Security 2 is a code + docs + CSP-only phase. The repo carries the policy intent and the owner-side setup steps; the policy itself lives in the Cloudflare Zero Trust dashboard.
- **No Cloudflare Access app is created in this phase.** The owner creates the Access app in the Cloudflare dashboard before any non-internal launch. Setup steps are in epo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md �3.
- **Worker-level session-token / Cloudflare Access JWT verification is a future hardening step, intentionally not shipped in Security 2.** The Worker source (workers/anthropic-proposal-proxy.ts) is structured to make this additive (a single check at the top of etch(request, env) after the CORS gate). The doc comment at the top of the Worker documents the contract. Implementation lands when the owner confirms the Access config and the JWT public-key / JWKS configuration.
- Security 3 (Supabase RLS) blocked until ChatGPT Control Room approves Security 2.
- Security 4 (n8n per-form secret) blocked.
- Booking A / B blocked.
- Observability blocked.
- QA Slice 0..3 blocked.
- TS0 / RDG0 tooling approval blocked.
- UIX0 / MOTION0 implementation blocked (planning + first slice + later slices).
- Admin future blocked.
- Final QA / delivery blocked.
- Ponytail install / clone / configure / evaluate blocked.
- ECC / affaan-m/ecc install / clone / configure / evaluate blocked.
- Package installs blocked.
- Source edits outside Security 2 scope blocked.
- No git add, no git commit, no git push, no git remote add, no GitHub repo, no publish.
- No wrangler deploy. No 
pm install. No pnpm install. No yarn install. No 
px. No package-manager command of any kind. No deploy command of any kind. No Cloudflare dashboard commands.

**Pre-flight verification:**
- pp/admin/layout.tsx had a client-side password gate that read process.env.NEXT_PUBLIC_ADMIN_PASSWORD and compared it to localStorage.co_admin_auth. **Kept** as a convenience gate; **explicitly labeled** as convenience-only in the UI (a ShieldCheck notice on the login form and a chip in the admin header).
- pp/admin/page.tsx, pp/admin/onboarding/page.tsx, pp/admin/proposal/page.tsx did not have any auth check. They rely on pp/admin/layout.tsx for the convenience gate. **Not modified.**
- workers/anthropic-proposal-proxy.ts had a CORS gate (origin allowlist). **Doc comment added** to the header explaining the Security 2 boundary: Cloudflare Access in front of the Worker's route is the owner-side configuration that closes the Worker's auth boundary; Worker-level session-token / Cloudflare Access JWT verification is a future hardening step. **No code change.**
- .env.local.example had NEXT_PUBLIC_ADMIN_PASSWORD=your-admin-password as a primary key. **Removed from the encouraged block.** The line is preserved in a DEPRECATED block ("convenience-only if set") for migration clarity.
- docs/ENVIRONMENT.md had NEXT_PUBLIC_ADMIN_PASSWORD as a required env var. **Updated to "no (convenience only)".** "Deprecated / forbidden" section extended.
- docs/SECURITY.md had R-001 as a documented unfixed risk. **Moved to "Closed risks" section** with a Security 2 resolution. F-002 marked implemented. Security 2 status banner added. R-007 CSP description updated.
- docs/DEPLOYMENT.md had no Access section. **Added "Cloudflare Access (Security 2) � admin boundary" section** with the owner-side setup steps and the post-deploy Access verification check. "What is not part of the deploy" section updated.
- INTEGRATION_NOTES.md had no Security 2 section. **Added �8.10 "Admin auth boundary (Security 2) � SHIPPED 2026-06-16"** with the contract.
- epo-research/SECURITY_1_WORKER_PROXY_NOTES.md had a Security 2 dependency section that said Security 2 was the next phase. **Updated** to reflect that Security 2 has run; admin auth (D-020a) is now Cloudflare Access; Worker-level session-token / Cloudflare Access JWT verification is a follow-up.

**Allowed change zones for this batch:** pp/admin/layout.tsx (the only pp/** file modified), workers/anthropic-proposal-proxy.ts (doc comment only; no code change), .env.local.example (template only), docs/ENVIRONMENT.md, docs/SECURITY.md, docs/DEPLOYMENT.md, INTEGRATION_NOTES.md (�8.10 added), epo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md (new primary deliverable), epo-research/SECURITY_1_WORKER_PROXY_NOTES.md (Security 2 dependency section + table updated), PROJECT_CONTROL_LOG.md, docs/*.md, memory/*.md, i/*.md, epo-research/*.md. No real .env or .env.local was modified. No package.json was modified. No lockfile was modified. No 	sconfig.json, 
ext.config.mjs, postcss.config.mjs, eslint / tailwind configs were modified.

**Files NOT modified:** package.json, package-lock.json, pnpm-lock.yaml, yarn.lock, 	sconfig.json, 
ext.config.mjs, postcss.config.mjs, components.json, 
ext-env.d.ts, .env* (only the example was touched), .mcp.json, .opencode/, .codex/, .claude/, 	ests/, .github/, pp/admin/page.tsx, pp/admin/onboarding/page.tsx, pp/admin/proposal/page.tsx, all other pp/** files, all components/**, hooks/, lib/ (the Worker source received only a doc comment), public/, styles/. INTEGRATION_NOTES.md was modified additively (�8.10 added); the rest of the file is unchanged.

**Inputs respected:** D-020a (Cloudflare Access for fast internal protection; LOCKED DEFAULT), D-017 (admin internal-only), A0 plan �5.5 (Security 2), epo-research/A0_PHASE_EXECUTION_QUEUE.md row #5, epo-research/A0_CHANGE_ZONE_MAP.md pp/admin/layout.tsx row, docs/D0_ARCHITECTURE_DECISIONS.md Security area, docs/D0_SYSTEM_DESIGN.md Security design, epo-research/D0_IMPLEMENTATION_BOUNDARIES.md, epo-research/SECURITY_HARDENING_BRIEF.md Option A, epo-research/SECURITY_1_WORKER_PROXY_NOTES.md Security 2 dependency, docs/SECURITY.md R-001 and F-002, docs/DEPLOYMENT.md, docs/ENVIRONMENT.md, the 2026-06-16 Control Room correction on git push / commit policy.

**Outputs of this batch:**
- pp/admin/layout.tsx (convenience gate kept; explicitly labeled as convenience-only in the UI; a chip in the admin header records "Local gate � Cloudflare Access = primary").
- workers/anthropic-proposal-proxy.ts (doc comment only; no code change; the header now explains the Security 2 boundary and the Worker-level JWT verification follow-up).
- .env.local.example (added a Security 2 section in the header; NEXT_PUBLIC_ADMIN_PASSWORD removed from the encouraged block; DEPRECATED block added with "convenience-only if set" note).
- docs/ENVIRONMENT.md (NEXT_PUBLIC_ADMIN_PASSWORD row updated to "no (convenience only)"; "Deprecated / forbidden" section extended with R-001; "Security implications" section updated).
- docs/SECURITY.md (Security 2 status banner added; R-001 moved to "Closed risks" with a Security 2 resolution; F-002 marked implemented; R-007 CSP description updated).
- docs/DEPLOYMENT.md (new "Cloudflare Access (Security 2) � admin boundary" section; post-deploy Access verification check added; "What is not part of the deploy" section updated).
- INTEGRATION_NOTES.md (�8.10 "Admin auth boundary (Security 2) � SHIPPED 2026-06-16" added).
- epo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md (new primary deliverable; covers purpose, files changed, owner-side setup steps, rollback plan, known remaining risks, Security 2 vs Security 1 scope, sign-off).
- epo-research/SECURITY_1_WORKER_PROXY_NOTES.md (Security 2 dependency section rewritten; Security 2 follow-up checklist updated).
- State files updated: PROJECT_CONTROL_LOG.md (this overlay), memory/CURRENT_STATE.md, memory/ACTIVE_TASK_CONTEXT.md, memory/WORKING_MEMORY.md, memory/EPISODIC_MEMORY.md, memory/IMPORTANT_DECISIONS.md (Security 2 reflection note appended; D-020a applied; R-001 addressed at deployment level; F-002 implemented for the deployed path; no new D-IDs), i/AI_TASK_CAPSULE.md, i/AI_CONTEXT_RULES.md (Security 2 hard rule added), docs/51_AGENT_HANDOFF_LOG.md.

**Hard rules reaffirmed:** no git add, no git commit, no git push, no git remote add, no 
pm install, no pnpm install, no yarn install, no 
px, no 
pm run, no pnpm run, no yarn run, no wrangler deploy, no deploy command of any kind, no Cloudflare dashboard commands, no package.json change, no package-lock.json change, no pnpm-lock.yaml change, no yarn.lock change, no 	sconfig.json change, no 
ext.config.* change, no postcss.config.* change, no eslint / tailwind config change, no real .env* change, no Auth.js, no Supabase Auth, no auth library, no server route, no new npm dependency, no MCP setup, no Ponytail, no ECC / affaan-m/ecc, no Impeccable, no Emil Kowalski, no source edit outside Security 2 scope, no test file, no CI file, no Security 3, no Security 4, no Booking, no Observability, no QA, no TS0 / RDG0 install, no UIX0 / MOTION0, no Admin future, no Final QA.

**Pre-stopping verification:**
- NEXT_PUBLIC_ADMIN_PASSWORD is no longer documented as a real security boundary anywhere. The pp/admin/layout.tsx UI now shows: "Convenience gate only. Real admin protection is Cloudflare Access in front of /admin/* on the deployed site. This local check is not security." **Pass.**
- docs/ENVIRONMENT.md row for NEXT_PUBLIC_ADMIN_PASSWORD is now "no (convenience only)" with a clear note that Cloudflare Access is the real boundary. **Pass.**
- docs/SECURITY.md R-001 is in the "Closed risks" section. F-002 is marked implemented. The Security 2 status banner is at the top. **Pass.**
- docs/DEPLOYMENT.md has a "Cloudflare Access (Security 2) � admin boundary" section with the owner-side setup steps and a post-deploy Access verification check. **Pass.**
- epo-research/SECURITY_2_CLOUDFLARE_ACCESS_NOTES.md exists and covers the owner-side setup, the verification steps, the rollback plan, and the known remaining risks. **Pass.**
- Admin remains internal-only (D-017). The owner-side Access setup restricts the allowlist to the operator's email (and any other approved owner / operator emails). The convenience gate is convenience-only. **Pass.**
- Security 3 Supabase RLS remains blocked and not implemented. **Pass.**
- Security 4 n8n secret/header remains blocked and not implemented. **Pass.**
- No package installs or auth library installs occurred. **Pass.**
- No deploy occurred. **Pass.**

**Status:** Security 2 run. Repo changes shipped. Convenience gate explicitly labeled. NEXT_PUBLIC_ADMIN_PASSWORD deprecated as security. R-001 addressed at the deployment level. F-002 implemented for the deployed path. No commit. No push. No remote. No deploy. No Cloudflare Access app created. The first commit is OPTIONAL. The next gate is ChatGPT Control Room approval to start Security 3 (Supabase RLS per D-020).

## Security 3 batch overlay (2026-06-16)

**Phase:** Security 3 (A0 future phase #6; D-020 LOCKED DEFAULT � Supabase RLS is required before any non-internal launch; SQL migration written; no commit; no push; no remote; no deploy; no database command).

**Gate status (overlay):**
- Security 3 is **run**; A0 still pending ChatGPT Control Room review. Security 3 ran as a deliberate, additive exception gated by the owner's Security 3 prompt. Security 3 is not a substitute for A0 review.
- Root confirmed: F:\CodeOutfitters. Git initialized with git init -b main in the Setup phase. No commits. No remote. No push.
- **SQL migration written** at supabase/migrations/20260616_security3_rls.sql. **NOT APPLIED.** The owner applies it manually via the Supabase SQL editor (recommended) or the Supabase CLI (alternative). Steps are in epo-research/SECURITY_3_SUPABASE_RLS_NOTES.md �5.
- **R-003 (Supabase RLS not enabled) is closed at the SQL level.** The migration is on disk and ready to apply. R-003 is **deferred at the runtime level** until the owner applies the migration. After the owner applies the migration, R-003 is fully closed.
- **F-003 implemented at the SQL level.** Anon is denied on both tables; service_role retains full access; forward-compatible grants on the future narrow RPCs (get_available_slots for anon in Booking A; eserve_slot for service_role only in Booking B). F-003 is **deferred at the runtime level** until the owner applies the migration.
- **No service_role key is in any NEXT_PUBLIC_* env var, in the static bundle, in the repo, or in any client-reachable file.** The service_role key is server-side only (Worker, seed, future DB admin). The migration does not add or change any env var.
- **No Supabase dashboard command was run.** No Supabase CLI was installed. No psql was run. No migration was applied. The owner pastes the SQL into the Supabase SQL editor and runs it.
- **The new supabase/ folder is created** in this phase (it did not exist before). The migration file is in supabase/migrations/20260616_security3_rls.sql. This is a new top-level folder that is consistent with the Supabase CLI convention.
- Security 4 (n8n per-form secret) blocked until ChatGPT Control Room approves Security 3.
- Booking A / B blocked.
- Observability blocked.
- QA Slice 0..3 blocked.
- TS0 / RDG0 tooling approval blocked.
- UIX0 / MOTION0 implementation blocked (planning + first slice + later slices).
- Admin future blocked.
- Final QA / delivery blocked.
- Ponytail install / clone / configure / evaluate blocked.
- ECC / affaan-m/ecc install / clone / configure / evaluate blocked.
- Package installs blocked.
- Source edits outside Security 3 scope blocked (no pp/, no components/, no lib/, no hooks/, no public/, no styles/, no workers/).
- No git add, no git commit, no git push, no git remote add, no GitHub repo, no publish.
- No wrangler deploy. No 
pm install. No pnpm install. No yarn install. No 
px. No package-manager command of any kind. No deploy command of any kind. No Supabase command of any kind. No database command of any kind.

**Pre-flight verification:**
- Tables: ookings, vailable_slots (confirmed from lib/booking-schema.sql and docs/DATABASE.md).
- Frontend lib/booking-actions.ts directly reads vailable_slots and writes ookings + vailable_slots from the browser using the anon key. R-003 is the original risk; R-006 in the security doc is the same risk framed differently. F-003 is the fix.
- No supabase/ folder existed before this phase. Created supabase/migrations/20260616_security3_rls.sql.
- Frontend components/booking-calendar-custom.tsx does **not** call getAvailableSlots (R-005). The booking UI was already broken in a different way. RLS does not introduce a new breakage; it makes the existing breakage explicit and gated.
- Frontend pp/, components/, lib/, hooks/, public/, styles/, workers/ were **not** modified in this phase (the brief excludes them).
- lib/booking-actions.ts is **not** modified in this phase (the brief excludes it). The frontend code change to call the future RPCs is Booking A and Booking B work.

**Allowed change zones for this batch:** supabase/migrations/20260616_security3_rls.sql (new), epo-research/SECURITY_3_SUPABASE_RLS_NOTES.md (new primary deliverable), docs/DATABASE.md, docs/SECURITY.md, docs/DEPLOYMENT.md, INTEGRATION_NOTES.md (�8.3 marked SHIPPED), PROJECT_CONTROL_LOG.md, docs/*.md, memory/*.md, i/*.md, epo-research/*.md. No real .env or .env.local was modified. No package.json was modified. No lockfile was modified. No 	sconfig.json, 
ext.config.mjs, postcss.config.mjs, eslint / tailwind configs were modified. No pp/**, no components/**, no hooks/, no lib/, no public/, no styles/, no workers/ were modified.

**Files NOT modified:** package.json, package-lock.json, pnpm-lock.yaml, yarn.lock, 	sconfig.json, 
ext.config.mjs, postcss.config.mjs, components.json, 
ext-env.d.ts, .env* (no env files were touched; the brief said "do not edit real .env or .env.local"), .mcp.json, .opencode/, .codex/, .claude/, 	ests/, .github/, pp/**, components/**, hooks/, lib/**, public/**, styles/**, workers/**. The SQL migration is a new file in a new folder (supabase/); it is not a "modification" of an existing file.

**Inputs respected:** D-020 (LOCKED DEFAULT; Supabase RLS required before launch), A0 plan �5.6 (Security 3), epo-research/A0_PHASE_EXECUTION_QUEUE.md row #6, epo-research/A0_CHANGE_ZONE_MAP.md supabase/migrations/* row, docs/D0_ARCHITECTURE_DECISIONS.md Security area, docs/D0_SYSTEM_DESIGN.md Security design, epo-research/D0_IMPLEMENTATION_BOUNDARIES.md, epo-research/SECURITY_HARDENING_BRIEF.md �3 Option B, INTEGRATION_NOTES.md �8.3 (planned Security 3 contract), lib/booking-schema.sql, lib/booking-actions.ts, docs/DATABASE.md, docs/SECURITY.md, the 2026-06-16 Control Room correction on git push / commit policy.

**Outputs of this batch:**
- supabase/migrations/20260616_security3_rls.sql (new; the SQL migration; primary deliverable; idempotent; reversible; heavily commented; conservative defaults; forward-compatible grants on the future narrow RPCs).
- epo-research/SECURITY_3_SUPABASE_RLS_NOTES.md (new; primary deliverable for the Security 3 phase; covers current risk, tables affected, proposed RLS model, SQL file created, owner application steps, rollback SQL, verification checklist, known impact on current booking flow, dependencies on Booking A/B, what remains blocked).
- docs/DATABASE.md (RLS section rewritten to the Security 3 policy model; "How the app reads and writes" section updated to call out the Security 3 deny and the future RPCs).
- docs/SECURITY.md (Security 3 status banner added; R-003 moved to a "Closed risks" section with a Security 3 resolution; F-003 marked implemented at the SQL level; deferred at the runtime level).
- docs/DEPLOYMENT.md (new "Supabase Row Level Security (Security 3)" section with the owner-side setup steps and the post-deploy checks; �8.3 marked SHIPPED with the resolution).
- INTEGRATION_NOTES.md (�8.3 marked SHIPPED 2026-06-16 with the resolution; explicit Service-role / Worker-only / anon-never-for-reserve language; closure list updated; migration status noted).
- State files updated: PROJECT_CONTROL_LOG.md (this overlay), memory/CURRENT_STATE.md, memory/ACTIVE_TASK_CONTEXT.md, memory/WORKING_MEMORY.md, memory/EPISODIC_MEMORY.md, memory/IMPORTANT_DECISIONS.md (Security 3 reflection note appended; D-020 applied; R-003 closed at SQL level; F-003 implemented at SQL level; deferred at runtime level; no new D-IDs), i/AI_TASK_CAPSULE.md, i/AI_CONTEXT_RULES.md (Security 3 hard rule added), docs/51_AGENT_HANDOFF_LOG.md.

**Hard rules reaffirmed:** no git add, no git commit, no git push, no git remote add, no 
pm install, no pnpm install, no yarn install, no 
px, no 
pm run, no pnpm run, no yarn run, no wrangler deploy, no deploy command of any kind, no Supabase dashboard command, no psql, no supabase CLI command, no database command of any kind, no package.json change, no package-lock.json change, no pnpm-lock.yaml change, no yarn.lock change, no 	sconfig.json change, no 
ext.config.* change, no postcss.config.* change, no eslint / tailwind config change, no real .env* change, no source edit outside Security 3 scope, no service_role key in any NEXT_PUBLIC_* env var, no MCP setup, no Ponytail, no ECC / affaan-m/ecc, no Impeccable, no Emil Kowalski, no test file, no CI file, no Security 4, no Booking, no Observability, no QA, no TS0 / RDG0 install, no UIX0 / MOTION0, no Admin future, no Final QA.

**Pre-stopping verification:**
- SQL file exists at supabase/migrations/20260616_security3_rls.sql. **Pass.**
- SQL does not expose service role to browser. The migration does not add any env var; the service_role policy is server-side only. **Pass.**
- SQL does not grant broad anon write access. Anon is denied on both tables (USING false, WITH CHECK false). Anon is granted EXECUTE only on get_available_slots (a future RPC, no-op until Booking A creates the function). Anon is NOT granted EXECUTE on eserve_slot. **Pass.**
- Docs state SQL was not applied. epo-research/SECURITY_3_SUPABASE_RLS_NOTES.md and docs/DEPLOYMENT.md and INTEGRATION_NOTES.md �8.3 all state that the migration was NOT applied in this phase. **Pass.**
- Docs state owner must apply/review SQL manually. epo-research/SECURITY_3_SUPABASE_RLS_NOTES.md �5 and docs/DEPLOYMENT.md "Supabase Row Level Security (Security 3)" section both describe the manual owner-side setup. **Pass.**
- Booking A/B remain blocked. **Pass.**
- Security 4 remains blocked. **Pass.**
- No package installs or deploys occurred. **Pass.**

**Status:** Security 3 run. SQL migration written. **NOT APPLIED.** Repo changes shipped. R-003 closed at the SQL level. F-003 implemented at the SQL level. No commit. No push. No remote. No deploy. No Supabase command. The first commit is OPTIONAL. The next gate is ChatGPT Control Room approval to start Security 4 (n8n per-form secret per D-022 / R-005).

## Security 4 batch overlay (2026-06-16)

**Phase:** Security 4 (A0 future phase #7; bundled Q-19 / D-022 / R-005 / R-017; n8n per-form secret + header; code + docs + CSP; no commit; no push; no remote; no deploy; no Supabase command; no database command).

**Gate state correction (2026-06-16):** **A0 is approved by ChatGPT Control Room as of this phase.** The Control Room clarification is recorded in memory/CURRENT_STATE.md and the relevant state files. Security 3 is approved at the SQL/documentation level; the Security 3 SQL migration is **NOT applied yet**; Security 3 runtime application remains an owner-side pre-launch action.

**Gate status (overlay):**
- Security 4 is **run**; A0 is approved. Security 4 ran as a deliberate, additive exception gated by the owner's Security 4 prompt. Security 4 is not a substitute for the A0 plan; A0 is approved.
- Root confirmed: F:\CodeOutfitters. Git initialized with git init -b main in the Setup phase. No commits. No remote. No push.
- **R-005 (single shared webhook for four form types, no signing) and R-017 (per-form webhook secret + header) are addressed at the deployment level.** The browser no longer holds the n8n webhook URL or any n8n secret. All public forms (contact, quote, booking, newsletter) post to a Cloudflare Worker (NEXT_PUBLIC_FORMS_WORKER_URL). The Worker adds the per-form secret header server-side (X-CodeOutfitters-Form-Secret) and forwards to the correct n8n webhook URL. R-005 / R-017 are **deferred at the runtime level** until the owner deploys the forms Worker and configures the n8n workflow to verify the header. After the owner deploys and configures, R-005 / R-017 are fully closed.
- **F-006 (per-form webhook secret, header, verify in n8n) implemented at the deployment level.** The Worker source is in workers/n8n-form-proxy.ts. The per-form secrets are held server-side in the Worker (one secret per form: N8N_CONTACT_SECRET, N8N_QUOTE_SECRET, N8N_BOOKING_SECRET, N8N_NEWSLETTER_SECRET). n8n must verify the header against its own workflow-level secret/env var. F-006 is **deferred at the runtime level** until the owner deploys the forms Worker and configures the n8n workflow.
- **NEXT_PUBLIC_N8N_WEBHOOK_URL is deprecated and forbidden.** The line is preserved in .env.local.example in a DEPRECATED block for migration clarity. The browser now uses NEXT_PUBLIC_FORMS_WORKER_URL for all four forms.
- **No NEXT_PUBLIC_*_SECRET env var was added.** All secrets are server-side only in the Worker.
- **CSP updated.** public/_headers connect-src no longer includes https://*.n8n.io; the browser no longer needs to call the n8n domain directly. https://*.workers.dev is already in the CSP (carried over from Security 1) and covers the forms Worker.
- **No Supabase command, no psql, no Supabase CLI.** The Security 3 migration is **NOT applied** in this phase. Security 3 runtime application remains an owner-side pre-launch action.
- **No Worker deploy.** No wrangler deploy. No Cloudflare dashboard command. The forms Worker is owner-deployed; steps are in epo-research/SECURITY_4_N8N_SECRET_NOTES.md �7.
- **No new auth library.** No Auth.js. No Supabase Auth. No server route. No new npm dependency. Security 4 is a code + docs + CSP-only phase.
- Booking A / B blocked until ChatGPT Control Room approves Security 4.
- Observability blocked.
- QA Slice 0..3 blocked.
- TS0 / RDG0 tooling approval blocked.
- UIX0 / MOTION0 implementation blocked (planning + first slice + later slices).
- Admin future blocked.
- Final QA / delivery blocked.
- Ponytail install / clone / configure / evaluate blocked.
- ECC / affaan-m/ecc install / clone / configure / evaluate blocked.
- Package installs blocked.
- Source edits outside Security 4 scope blocked.
- No git add, no git commit, no git push, no git remote add, no GitHub repo, no publish.
- No wrangler deploy. No 
pm install. No pnpm install. No yarn install. No 
px. No package-manager command of any kind. No deploy command of any kind. No Supabase command of any kind. No database command of any kind. No psql.

**Pre-flight verification:**
- Tables: n/a (Security 4 does not touch Supabase schema).
- Frontend lib/booking-actions.ts was not modified. The booking form's Supabase write path is unchanged by Security 4. The booking form's n8n POST was redirected to the forms Worker.
- All four public forms (contact, quote, booking, newsletter) were inspected: components/contact.tsx, components/quote-form.tsx, components/newsletter.tsx, components/booking-calendar-custom.tsx. Each previously called process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL directly from the browser. Each was updated to call ${NEXT_PUBLIC_FORMS_WORKER_URL}/ instead. The existing payload shapes are preserved: source: "contact", source: "quote_request", source: "newsletter", 	ype: "booking". The Worker reads source (for contact/quote/newsletter) and 	ype: "booking" (for booking) and routes accordingly.
- No supabase/ folder changes in this phase (the Security 3 SQL is unchanged).
- Frontend pp/, components/booking-calendar-custom.tsx booking availability logic is unchanged.
- The booking form continues to use 	ype: "booking" (the existing convention from INTEGRATION_NOTES.md �1). The Worker honors both source and 	ype conventions.

**Allowed change zones for this batch:** workers/n8n-form-proxy.ts (new), components/contact.tsx, components/quote-form.tsx, components/newsletter.tsx, components/booking-calendar-custom.tsx (one-line change in each: NEXT_PUBLIC_N8N_WEBHOOK_URL ? NEXT_PUBLIC_FORMS_WORKER_URL; the rest of the form logic is unchanged), .env.local.example, public/_headers (CSP), docs/ENVIRONMENT.md, docs/SECURITY.md, docs/DEPLOYMENT.md, INTEGRATION_NOTES.md (�8.2 marked SHIPPED), epo-research/SECURITY_4_N8N_SECRET_NOTES.md (new primary deliverable), PROJECT_CONTROL_LOG.md, docs/*.md, memory/*.md, i/*.md, epo-research/*.md. No real .env or .env.local was modified. No package.json was modified. No lockfile was modified. No 	sconfig.json, 
ext.config.mjs, postcss.config.mjs, eslint / tailwind configs were modified. No pp/admin/** was modified. No pp/** (other than the four form components in components/) was modified. No lib/, hooks/, styles/, workers/anthropic-proposal-proxy.ts, supabase/migrations/** were modified.

**Files NOT modified:** package.json, package-lock.json, pnpm-lock.yaml, yarn.lock, 	sconfig.json, 
ext.config.mjs, postcss.config.mjs, components.json, 
ext-env.d.ts, .env* (only the example was touched), .mcp.json, .opencode/, .codex/, .claude/, 	ests/, .github/, pp/admin/**, all pp/** files unrelated to the four form components, hooks/, lib/** (no shared webhook helper was needed; the form components are small and the Worker is the source of truth for routing), public/_redirects, styles/, workers/anthropic-proposal-proxy.ts (no doc comment needed; the Security 1 Worker and the Security 4 Worker are independent), supabase/migrations/**. INTEGRATION_NOTES.md was modified additively (�8.2 marked SHIPPED); the rest of the file is unchanged.

**Inputs respected:** D-022 (n8n per-form secret + header), the bundled Q-19 / R-005 / R-017, A0 plan �5.7 (Security 4), epo-research/A0_PHASE_EXECUTION_QUEUE.md row #7, epo-research/A0_CHANGE_ZONE_MAP.md workers/* / components/contact.tsx / components/quote-form.tsx / components/newsletter.tsx / components/booking-calendar-custom.tsx / public/_headers rows, docs/D0_ARCHITECTURE_DECISIONS.md Security area, docs/D0_SYSTEM_DESIGN.md Security design, epo-research/D0_IMPLEMENTATION_BOUNDARIES.md, epo-research/SECURITY_HARDENING_BRIEF.md �3, epo-research/SECURITY_1_WORKER_PROXY_NOTES.md, epo-research/SECURITY_3_SUPABASE_RLS_NOTES.md (for the booking form Supabase write path interaction), INTEGRATION_NOTES.md �1 (n8n webhook payload contracts) and �8.2 (planned Security 4 contract), docs/SECURITY.md R-005 / R-017 / F-006, the 2026-06-16 Control Room correction on git push / commit policy, the 2026-06-16 Control Room clarification that A0 is approved and Security 3 SQL is not applied yet.

**Outputs of this batch:**
- workers/n8n-form-proxy.ts (new; the Worker source; primary deliverable; native etch only; no npm dependencies; no package.json change; idempotent CORS / origin gate; per-form routing; X-CodeOutfitters-Form-Secret server-side; safe error responses; no secret leakage).
- epo-research/SECURITY_4_N8N_SECRET_NOTES.md (new; primary deliverable; covers current risk, new Worker proxy model, required Worker env vars, required n8n workflow env vars / secrets, header name, per-form routing model, owner setup steps, rollback plan, verification checklist, known remaining risks, sign-off).
- components/contact.tsx (one-line change: NEXT_PUBLIC_N8N_WEBHOOK_URL ? NEXT_PUBLIC_FORMS_WORKER_URL; rest of the form logic is unchanged).
- components/quote-form.tsx (one-line change: NEXT_PUBLIC_N8N_WEBHOOK_URL ? NEXT_PUBLIC_FORMS_WORKER_URL; rest of the form logic is unchanged).
- components/newsletter.tsx (one-line change: NEXT_PUBLIC_N8N_WEBHOOK_URL ? NEXT_PUBLIC_FORMS_WORKER_URL; rest of the form logic is unchanged).
- components/booking-calendar-custom.tsx (one-line change in the n8n POST path: NEXT_PUBLIC_N8N_WEBHOOK_URL ? NEXT_PUBLIC_FORMS_WORKER_URL; rest of the booking form logic is unchanged; the Supabase write path is unchanged).
- .env.local.example (added a Security 4 section in the header; added NEXT_PUBLIC_FORMS_WORKER_URL placeholder; removed the encouraged public NEXT_PUBLIC_N8N_WEBHOOK_URL; added a DEPRECATED block for the old key).
- docs/ENVIRONMENT.md (added NEXT_PUBLIC_FORMS_WORKER_URL row to the Frontend table; added a "Worker env vars (Cloudflare Worker � forms proxy)" subsection with all 9 Worker env vars; added the NEXT_PUBLIC_N8N_WEBHOOK_URL deprecated entry; updated the per-form payload contracts section).
- docs/SECURITY.md (Security 4 status banner added; R-005 moved to a "Closed risks" section with a Security 4 resolution; R-017 also addressed; F-006 marked implemented at the deployment level; deferred at the runtime level).
- docs/DEPLOYMENT.md (new "n8n form proxy (Security 4)" section with the owner-side setup steps and the post-deploy checks).
- INTEGRATION_NOTES.md (�8.2 marked SHIPPED 2026-06-16 with the resolution; explicit server-side header language; closure list updated).
- public/_headers (CSP connect-src updated: https://*.n8n.io removed; https://*.workers.dev already in the CSP from Security 1 covers the forms Worker).
- State files updated: PROJECT_CONTROL_LOG.md (this overlay), memory/CURRENT_STATE.md, memory/ACTIVE_TASK_CONTEXT.md, memory/WORKING_MEMORY.md, memory/EPISODIC_MEMORY.md, memory/IMPORTANT_DECISIONS.md (Security 4 reflection note appended; D-022 applied; R-005 / R-017 addressed at the deployment level; F-006 implemented at the deployment level; no new D-IDs; A0 approval carried forward), i/AI_TASK_CAPSULE.md, i/AI_CONTEXT_RULES.md (Security 4 hard rule added), docs/51_AGENT_HANDOFF_LOG.md.

**Hard rules reaffirmed:** no git add, no git commit, no git push, no git remote add, no 
pm install, no pnpm install, no yarn install, no 
px, no 
pm run, no pnpm run, no yarn run, no wrangler deploy, no deploy command of any kind, no Cloudflare dashboard command, no psql, no supabase CLI, no database command of any kind, no package.json change, no package-lock.json change, no pnpm-lock.yaml change, no yarn.lock change, no 	sconfig.json change, no 
ext.config.* change, no postcss.config.* change, no eslint / tailwind config change, no real .env* change, no NEXT_PUBLIC_*_SECRET added, no n8n secret in browser code, no source edit outside Security 4 scope, no pp/admin/** change, no booking availability / reservation logic change, no Security 3 SQL applied, no Booking A / B work, no Observability, no QA, no TS0 / RDG0 install, no UIX0 / MOTION0, no Admin future, no Final QA, no Ponytail, no ECC / affaan-m/ecc, no Impeccable, no Emil Kowalski, no test file, no CI file, no MCP setup.

**Pre-stopping verification:**
- **No NEXT_PUBLIC_*_SECRET env var was added.** Verified by grep on .env.local.example and docs/ENVIRONMENT.md: only NEXT_PUBLIC_* env vars are public Worker URLs and Supabase / n8n form proxy URLs. The N8N_*_SECRET and ANTHROPIC_API_KEY are server-side only. **Pass.**
- **No n8n secret appears in browser code.** Verified by grep on components/contact.tsx, components/quote-form.tsx, components/newsletter.tsx, components/booking-calendar-custom.tsx: no N8N_*_SECRET reference, no X-CodeOutfitters-Form-Secret reference. The browser does not hold the per-form secret. **Pass.**
- **Browser form code calls the Worker URL instead of direct n8n webhook URL.** Verified by grep on the four form components: each uses NEXT_PUBLIC_FORMS_WORKER_URL and POSTs to ${workerUrl.replace(/\/+$/, '')} + '/'. No NEXT_PUBLIC_N8N_WEBHOOK_URL reference in the four form components. **Pass.**
- **Worker source adds the secret header server-side.** Verified by reading workers/n8n-form-proxy.ts: the X-CodeOutfitters-Form-Secret header is set via headers: { ..., [FORWARDED_HEADER_NAME]: route.secret } before the upstream fetch. The oute.secret is the per-form secret bound to the Worker. **Pass.**
- **Docs state n8n must verify the header.** Verified by epo-research/SECURITY_4_N8N_SECRET_NOTES.md �5 and �7.5; docs/DEPLOYMENT.md "n8n form proxy (Security 4)" section; INTEGRATION_NOTES.md �8.2; docs/SECURITY.md Security 4 status banner and F-006 update. **Pass.**
- **Security 3 SQL remains not applied.** Verified by docs/DEPLOYMENT.md "Supabase Row Level Security (Security 3)" section (still says "The migration was NOT applied in this phase.") and by epo-research/SECURITY_3_SUPABASE_RLS_NOTES.md (still says "WRITTEN. NOT APPLIED. Owner applies manually"). Security 3 runtime application remains an owner-side pre-launch action. **Pass.**
- **Booking A/B remain blocked.** Verified by memory/WORKING_MEMORY.md and memory/CURRENT_STATE.md gate state. **Pass.**
- **No package installs or deploys occurred.** Verified by git status (no new files outside the allowed change zones; no commits; no remote; no push). **Pass.**

**Status:** Security 4 run. Worker source shipped. Four forms updated. CSP updated. Documentation updated. R-005 / R-017 addressed at the deployment level. F-006 implemented at the deployment level. **A0 is approved by ChatGPT Control Room as of this phase.** Security 3 SQL still not applied (owner-side pre-launch action). No commit. No push. No remote. No deploy. No Supabase command. The first commit is OPTIONAL. The next gate is ChatGPT Control Room approval to start Booking A (A0 future phase #8).

## Booking A batch overlay (2026-06-16)

**Phase:** Booking A (A0 future phase #8; D-019b MVP read path; the booking read path is now wired through a narrow RPC, replacing the direct table SELECT in `lib/booking-actions.ts`; the write path is intentionally unchanged and remains blocked until Booking B).

**Gate status (overlay):**

- Booking A is **run**; A0 is approved (carried forward from Security 4). Booking A ran as a deliberate, additive exception gated by the owner's Booking A prompt. Booking A is not a substitute for A0 review. A0 is the review gate; Booking A is the IMPL phase that A0 planned.
- **A0 is approved by ChatGPT Control Room as of this phase** (carried forward from Security 4, 2026-06-16).
- **Security 3 RLS migration is approved at SQL/documentation level** (carried forward). Security 3 migration is **NOT applied** at the runtime level. Security 3 runtime application remains an owner-side pre-launch action.
- Root confirmed: `F:\CodeOutfitters`. Git initialized with `git init -b main` in the Setup phase. No commits. No remote. No push.
- **SQL migration written** at `supabase/migrations/20260616_booking_a_get_available_slots.sql`. **NOT applied.** The owner applies it manually via the Supabase SQL editor (recommended) or the Supabase CLI (alternative). Recommended order: Security 3 first, then Booking A, then Booking B. The Booking A SQL works in either order, but the full design is coherent only when Security 3 is in place. Steps are in `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md` §5.
- **R-005 (booking double-book) is partially closed at the read path level.** The calendar now reads availability through the `get_available_slots` RPC and disables dates / times that are not actually available. The write path (`createBooking` → direct `INSERT` into `bookings` + direct `UPDATE` on `available_slots.is_booked`) is intentionally unchanged in Booking A and remains blocked until Booking B (the `reserve_slot` RPC, called server-side from a Cloudflare Worker that holds the `service_role` key). R-005 is **fully closed** only when Booking B ships.
- **Booking B blocked** until ChatGPT Control Room approves Booking A and the owner applies Booking A SQL (and Security 3 SQL if not already applied).
- **No service_role key in any `NEXT_PUBLIC_*` env var, in the static bundle, in the repo, or in any client-reachable file.** The RPC is `SECURITY DEFINER`; it does not need the `service_role` key to read from `available_slots` (it reads in the function owner's context). The `service_role` key is server-side only.
- **No new env var of any kind was added.** The function exists in the public schema; anon is granted `EXECUTE`; service_role is granted `EXECUTE`. No `package.json` change. No lockfile change. No `tsconfig.json` change. No `next.config.*` change. No `postcss.config.*` change. No eslint / tailwind config change. No real `.env*` change. No `public/_headers` change. No Worker change. No `app/**` change. No `hooks/` change. No `styles/` change. No `tests/` change. No `.github/` change. No Supabase dashboard command. No Supabase CLI. No `psql`. No database command. No deploy command. No package-manager command. No MCP setup.
- Observability, QA Slice 0..3, TS0 / RDG0, UIX0 / MOTION0, Admin future, Final QA / delivery, Ponytail / ECC / affaan-m/ecc install / clone / copy / configure / evaluate: all blocked. Not started in this phase.
- No `git add`, no `git commit`, no `git push`, no `git remote add`, no `git fetch`, no `git pull`. No GitHub repo. No publish.
- No `wrangler deploy`. No `npm install`, no `pnpm install`, no `yarn install`, no `npx`, no `npm run`, no `pnpm run`, no `yarn run`.

**Pre-flight verification:**

- Tables: `bookings`, `available_slots` (confirmed from `lib/booking-schema.sql` and `docs/DATABASE.md`).
- The Security 3 forward-compatible anon `EXECUTE` grant on `get_available_slots` is in `supabase/migrations/20260616_security3_rls.sql`. The function body is created in Booking A. The function does not exist until the owner applies the Booking A migration.
- The previous direct `from('available_slots').select(...)` in `lib/booking-actions.ts:35` `getAvailableSlots` is replaced with `supabase.rpc('get_available_slots', { p_month, p_year })`. The `createBooking` function in `lib/booking-actions.ts:107` is intentionally unchanged; its docstring records the gate to Booking B. The legacy `createBooking` UPDATE path on `available_slots.is_booked` is still there and still fails with RLS once Security 3 is applied; that is the desired state until Booking B ships.
- `components/booking-calendar-custom.tsx` did **not** call `getAvailableSlots` (R-005). It now does, via a `useEffect` that fetches slots for the displayed month. The date picker disables days with zero available slots. The time picker renders only the times actually available for the selected date. The submit handler (n8n forms Worker) is unchanged. The UI design, step indicator, form fields, placeholder text, validation, honeypot, and type field are unchanged. The phone placeholder is `+1 (555) 123-4567` (unchanged).
- Frontend `app/`, `hooks/`, `public/`, `styles/`, `workers/` are **not** modified. `lib/booking-schema.sql`, `lib/booking-types.ts`, `lib/supabase.ts` are **not** modified. No new file in `app/`. No new file in `workers/`. The new files in this phase are all in the allowed change zones (see "Allowed change zones" below).
- No supabase CLI / dashboard / psql. The owner pastes the SQL into the Supabase SQL editor and runs it.

**Allowed change zones for this batch:** `supabase/migrations/20260616_booking_a_get_available_slots.sql` (new), `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md` (new), `lib/booking-actions.ts` (RPC swap; `createBooking` docstring updated to record the Booking B gate; no behavior change in `createBooking`), `components/booking-calendar-custom.tsx` (calendar uses the new `getAvailableSlots`; submit handler unchanged; design / layout / step indicator / form fields / placeholder text / validation / honeypot / type field unchanged), `docs/DATABASE.md`, `docs/SECURITY.md`, `docs/DEPLOYMENT.md`, `INTEGRATION_NOTES.md` (§2 and §8.3 updated additively), `PROJECT_CONTROL_LOG.md` (this overlay; phase history row added; gate status row updated; "Exact next gate after Booking A" section added), `memory/CURRENT_STATE.md`, `memory/ACTIVE_TASK_CONTEXT.md`, `memory/WORKING_MEMORY.md`, `memory/EPISODIC_MEMORY.md`, `memory/IMPORTANT_DECISIONS.md` (Booking A reflection note appended; no new D-IDs; D-019b reaffirmed), `ai/AI_TASK_CAPSULE.md`, `ai/AI_CONTEXT_RULES.md` (Booking A hard rule added), `docs/51_AGENT_HANDOFF_LOG.md` (this entry).

**Files NOT modified:** `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `tsconfig.json`, `next.config.*`, `postcss.config.*`, `components.json`, `eslint.config.*` (does not exist; not modified), tailwind config (not modified), `next-env.d.ts`, `.env*` (no env files were touched; the brief said "do not edit real .env or .env.local"), `.mcp.json`, `.opencode/`, `.codex/`, `.claude/`, `tests/`, `.github/`, `app/`, `hooks/`, `public/`, `styles/`, `workers/`, `app/admin/**`. `app/(public)/`, `app/(public)/book/`, `app/(public)/contact/`, `app/(public)/portfolio/`, `app/(public)/privacy/`, `app/(public)/terms/`, `app/(public)/services/`, `app/(public)/pricing/`, `app/(public)/about/` are unchanged. `lib/booking-schema.sql`, `lib/booking-types.ts`, `lib/supabase.ts`, `lib/proposal-generator.ts`, `lib/admin-types.ts`, `lib/animations/` are unchanged. `workers/anthropic-proposal-proxy.ts`, `workers/n8n-form-proxy.ts` are unchanged. The four form components other than `components/booking-calendar-custom.tsx` are unchanged. The brief did not require any `app/**` change; none was made.

**Inputs respected:** D-019 (booking correctness as launch gate), D-019b (Booking MVP write path = A first, then C; A's read path is in Booking A), D-020 (Supabase RLS as launch gate), the Security 3 RLS forward-compatible anon `EXECUTE` grant on `get_available_slots`, the Security 4 forms Worker (booking form still posts to the n8n forms Worker; the Worker adds the per-form secret header server-side), the 2026-06-16 Control Room correction on git push / commit policy, the 2026-06-16 Control Room clarification that A0 is approved and Security 3 SQL is not applied yet. A0 plan §5.8 (Booking A) and `repo-research/A0_PHASE_EXECUTION_QUEUE.md` row #8. `docs/DATABASE.md` (RLS section), `docs/SECURITY.md` (Security 3 status banner; F-003; the forward-compatible grants), `repo-research/SECURITY_3_SUPABASE_RLS_NOTES.md` (forward-compatible grants; rollback), `repo-research/BOOKING_CORRECTNESS_BRIEF.md` (the R-005 read-path gap), `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` (phase-by-phase boundaries; Supabase SQL files = Security 3, Booking A, Booking B), `INTEGRATION_NOTES.md` §8.3 (planned Security 3 contract; planned Booking A read path), `lib/booking-schema.sql`, `lib/booking-actions.ts`, `docs/DATABASE.md` §"How the app reads and writes".

**Outputs of this batch:**

- `supabase/migrations/20260616_booking_a_get_available_slots.sql` (new; primary deliverable; the RPC; idempotent; reversible; heavily commented; conservative defaults; no table shape changes; no `reserve_slot`; no `bookings` changes; no env var changes; no anon `SELECT` on the table).
- `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md` (new; primary deliverable for the Booking A phase; covers current problem, SQL file created, RPC contract, frontend files changed, owner-side application steps, verification queries, known remaining risks, Booking B dependency, rollback plan, testing checklist, sign-off).
- `lib/booking-actions.ts` (RPC swap in `getAvailableSlots(month, year)`; the function now calls `supabase.rpc('get_available_slots', { p_month, p_year })`. Input validation: `p_month` 1..12, `p_year` 1970..2100. Same return shape as before. `createBooking(formData)` is intentionally unchanged; the docstring records the gate to Booking B).
- `components/booking-calendar-custom.tsx` (calendar now calls `getAvailableSlots(month, year)` for the displayed month via `useEffect`; loading and error states added; date picker disables days with zero available slots; time picker renders only the times actually available for the selected date; submit handler unchanged (still posts to `NEXT_PUBLIC_FORMS_WORKER_URL` with `type: "booking"`); design / layout / step indicator / form fields / placeholder text (`+1 (555) 123-4567`) / validation / honeypot / type field all unchanged).
- `docs/DATABASE.md` (status banner for Booking A; the "How the app reads and writes" section updated with the post-Booking-A read path; the "Known issue" section updated to record the partial close of R-005 at the read path level).
- `docs/SECURITY.md` (Booking A status banner added; explicit "Booking A SQL NOT applied" language; `createBooking` is explicitly documented as blocked until Booking B; no new env var; no new package; no new Worker; no new auth library).
- `docs/DEPLOYMENT.md` (new "Booking A — Available slots RPC (2026-06-16)" section with owner-side setup, post-deploy checks, rollback; the post-deploy checklist now includes the Booking A read-path check).
- `INTEGRATION_NOTES.md` (§2 Supabase section updated additively to record the Booking A RPC swap; §8.3 RLS section updated additively to record the Booking A delivery and the partial close of R-005 at the read path level).
- `PROJECT_CONTROL_LOG.md` (this overlay; phase history row added; gate status row updated; "Exact next gate after Booking A" section added).
- `memory/CURRENT_STATE.md` (snapshot extended with Booking A batch; blocked list updated; exact next gate added).
- `memory/ACTIVE_TASK_CONTEXT.md` (task replaced with Booking A; in-scope and out-of-scope lists; definition of done).
- `memory/WORKING_MEMORY.md` (current task updated; phase gate updated; active restrictions updated; Booking A outputs section).
- `memory/EPISODIC_MEMORY.md` (Booking A event appended).
- `memory/IMPORTANT_DECISIONS.md` (Booking A reflection note appended; D-019b reaffirmed; no new D-IDs).
- `ai/AI_TASK_CAPSULE.md` (phase line updated to Booking A; never-do list extended).
- `ai/AI_CONTEXT_RULES.md` (Booking A hard rule added; future-phase boundary rule reaffirmed; tooling-candidate rules reaffirmed).
- `docs/51_AGENT_HANDOFF_LOG.md` (this entry).

**Hard rules reaffirmed:** no `git add`, no `git commit`, no `git push`, no `git remote add`, no `git fetch`, no `git pull`, no GitHub repo, no publish; no `npm install`, no `pnpm install`, no `yarn install`, no `npx`, no `npm run`, no `pnpm run`, no `yarn run`, no `wrangler deploy`, no deploy command of any kind, no Cloudflare dashboard command, no Supabase dashboard command, no `psql`, no `supabase` CLI, no database command, no package-manager command; no `package.json` change, no `package-lock.json` change, no `pnpm-lock.yaml` change, no `yarn.lock` change, no `tsconfig.json` change, no `next.config.*` change, no `postcss.config.*` change, no eslint / tailwind config change, no real `.env*` change; no source edit outside the explicit Booking A scope (the SQL migration in `supabase/migrations/`, the new `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md`, the swap in `lib/booking-actions.ts`, the calendar update in `components/booking-calendar-custom.tsx`, the docs); no `app/admin/**` change, no `app/**` change, no `hooks/` change, no `public/` change (other than what Security 4 already did; no new `_headers` change), no `styles/` change, no `workers/` change (the Security 1 / Security 4 Workers are unchanged; the booking form continues to use the n8n forms Worker, the calendar change is read/display only); no Security 3 SQL applied; no Booking B work started; no Observability, no QA Slice 0..3, no TS0 / RDG0 install, no UIX0 / MOTION0, no Admin future, no Final QA / delivery; no Ponytail, no ECC / affaan-m/ecc, no Impeccable, no Emil Kowalski, no Playwright, no Chrome DevTools MCP, no Graphify, no Repomix, no Context7 MCP, no Tree-sitter, no codebase-memory MCP; no test file, no CI file, no MCP setup; no new `NEXT_PUBLIC_*_SECRET` env var; no `service_role` key in any `NEXT_PUBLIC_*` env var, in the static bundle, in the repo, or in any client-reachable file; no `reserve_slot` SQL written, no `reserve_slot` RPC created, no `bookings` table changes, no new column / index / constraint on `available_slots`; the seed (`lib/booking-schema.sql` §"Seed") is unchanged; the booking form's n8n POST continues to use the n8n forms Worker per Security 4 (the booking form is unchanged except for the read/display path); no Auth.js, no Supabase Auth, no server route, no middleware, no Next.js API route, no new npm dependency.

**Pre-stopping verification:**

- SQL file exists at `supabase/migrations/20260616_booking_a_get_available_slots.sql`. **Pass.**
- SQL does not expose `service_role` to the browser. The function is `SECURITY DEFINER` and runs in the function owner's context (`postgres`); it does not need the `service_role` key. The `service_role` key is not added to any env var; the migration does not add or change any env var. **Pass.**
- SQL does not grant broad anon write access. Anon is denied on both tables (carried over from Security 3). Anon is granted `EXECUTE` on `get_available_slots` only. Anon is NOT granted `EXECUTE` on `reserve_slot` (which does not exist). Anon is NOT granted `SELECT` on `available_slots`. **Pass.**
- SQL does not modify `bookings` or `available_slots` table shape. No new column, no new index, no new constraint. **Pass.**
- SQL does not create `reserve_slot`. **Pass.**
- Docs state SQL was not applied. `docs/DATABASE.md` and `docs/SECURITY.md` and `docs/DEPLOYMENT.md` and `INTEGRATION_NOTES.md` §8.3 and `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md` all state that the migration was NOT applied in this phase. **Pass.**
- Docs state owner must apply / review SQL manually. `repo-research/BOOKING_A_AVAILABLE_SLOTS_RPC_NOTES.md` §5 and `docs/DEPLOYMENT.md` "Booking A — Available slots RPC (2026-06-16)" section both describe the manual owner-side setup. **Pass.**
- Frontend `lib/booking-actions.ts:35` `getAvailableSlots` now calls `supabase.rpc('get_available_slots', { p_month, p_year })`. The function no longer does a direct `supabase.from('available_slots').select(...)` for the read path. The `createBooking` function (line 107) is intentionally unchanged. **Pass.**
- Frontend `components/booking-calendar-custom.tsx` calls `getAvailableSlots(month, year)` and disables dates / times that are not in the response. The submit handler is unchanged. The phone placeholder is unchanged. The honeypot, the validation, the step indicator, the layout, the design tokens, the `type: "booking"` payload field are unchanged. **Pass.**
- Booking B remains blocked. The `createBooking` function still does the direct `INSERT` into `bookings` and the direct `UPDATE` on `available_slots.is_booked`; the gate to Booking B is recorded in the function's docstring. **Pass.**
- Security 3 SQL remains not applied. **Pass.**
- Security 4 forms Worker is unchanged. **Pass.**
- No `package.json` change, no lockfile change, no `tsconfig.json` change, no `next.config.*` change, no `postcss.config.*` change, no eslint / tailwind config change, no real `.env*` change. **Pass.**
- No `git add`, no `git commit`, no `git push`, no `git remote add`, no `git fetch`, no `git pull`. No `npm install`, no `pnpm install`, no `yarn install`, no `npx`, no `npm run`, no `pnpm run`, no `yarn run`, no `wrangler deploy`. No Supabase dashboard command, no `psql`, no Supabase CLI. **Pass.**

**Status:** Booking A run. SQL migration written. **NOT applied.** Repo changes shipped. R-005 partially closed at the read path level. F-004 (UI reads `available_slots` and only offers actually-available slots) **implemented** for the read path; F-004 is **fully closed** only when Booking B ships. The booking calendar is now honest about availability; the booking submission is still non-functional by design until Booking B ships. No commit. No push. No remote. No deploy. No Supabase command. The first commit is OPTIONAL. The next gate is **ChatGPT Control Room approval of Booking A** and **the owner applying the Booking A SQL migration** (and the Security 3 SQL migration if not already applied). The next phase after that is **Booking B** (A0 future phase #9; the `reserve_slot` RPC + Worker-mediated transactional reservation).

## Booking A runtime state record (2026-06-16)

**Phase:** Documentation-only state sync. No source code change. No SQL applied by OpenCode. No Booking B started. The owner has confirmed Security 3 and Booking A are applied and verified at runtime, and has applied a live grant repair. This overlay records the runtime state so the repo no longer says Security 3 or Booking A are "not applied" at runtime. **The on-disk migration file `supabase/migrations/20260616_booking_a_get_available_slots.sql` is unchanged in this overlay** (the file is already in its post-Repair 1 form; runtime changes were applied by the owner in the Supabase SQL editor and are not on disk beyond the Repair 1 edit already recorded in the Booking A overlay above).

**Gate status (overlay):**

- **Security 3 runtime = applied and verified** (confirmed by owner in Supabase).
  - `public.bookings` has `relrowsecurity = true` and `relforcerowsecurity = true`.
  - `public.available_slots` has `relrowsecurity = true` and `relforcerowsecurity = true`.
  - Four RLS policies exist: `anon_deny_all_available_slots`, `service_role_full_access_available_slots`, `anon_deny_all_bookings`, `service_role_full_access_bookings`.
  - The base booking schema is in place; `public.available_slots` was seeded with 840 slots.
  - R-003 is **closed at the SQL level** (carried forward from Security 3) **and closed at the runtime level** (confirmed in this overlay). F-003 is **implemented at the SQL level** and **verified at the runtime level**.

- **Booking A runtime = applied and verified** (confirmed by owner in Supabase).
  - `public.get_available_slots(p_month int, p_year int)` was applied manually by the owner.
  - The migration required **Booking A Repair 1** because the Supabase SQL Editor rejected the unquoted `time text` column with `ERROR: 42601: syntax error at or near "time"` (LINE 195 in the original on-disk form). The Repair 1 edit quotes `"time"` in `RETURNS TABLE`, in the inner `SELECT` (`s."time" AS "time"`), and in `ORDER BY` (`s."time" ASC`). Supabase accepted the repaired SQL.
  - Function verification (read from `pg_proc`): `function_name = get_available_slots`, `arguments = p_month integer, p_year integer`, `returns = TABLE(id uuid, date date, "time" text)`, `security_definer = true`. Volatility: `STABLE`. Config: `['search_path=pg_catalog, public']`.
  - Smoke test passed: `SELECT date, "time" FROM public.get_available_slots(6, 2026) ORDER BY date, "time" LIMIT 20` returned available slots from seeded dates.
  - R-005 is **partially closed at the read path level** (carried forward) **and verified at the runtime level** (confirmed in this overlay). F-004 is **implemented for the read path** (carried forward) and **verified at the runtime level**.

- **Booking A live grant repair = applied and verified** (confirmed by owner in Supabase).
  - The owner revoked any broad direct table privileges from `anon` and `authenticated` on `public.available_slots` and `public.bookings` (defense in depth on top of the Security 3 deny policies).
  - The owner revoked `authenticated` `EXECUTE` on `public.get_available_slots` (the project has no authenticated user flow today; the role is denied by default and should not appear in the RPC grants).
  - The owner restored the intended grants: `anon` `EXECUTE` on `public.get_available_slots`; `service_role` `EXECUTE` on `public.get_available_slots`.
  - Final verification (read from `information_schema.routine_privileges` and `information_schema.table_privileges`): `anon` has `EXECUTE` on `get_available_slots`; `service_role` has `EXECUTE` on `get_available_slots`; `authenticated` does **not** appear in the RPC grants; `anon` has no direct privileges on `available_slots`; `anon` has no direct privileges on `bookings`.

- **Booking A Repair 1 = passed and applied to the on-disk migration.** The repaired `supabase/migrations/20260616_booking_a_get_available_slots.sql` is the source of truth that matches what the owner applied in Supabase. Three SQL repairs + one nearby comment block + one inline comment label. No further code change to the on-disk SQL is required.

- **Booking B = next eligible implementation phase, but NOT started.**
  - Booking B is blocked until ChatGPT Control Room issues the exact Booking B prompt and approves Booking B.
  - The Booking A write path (`createBooking` in `lib/booking-actions.ts`) is still blocked: the direct `INSERT` into `bookings` and the direct `UPDATE` on `available_slots.is_booked` would now fail with 403 / RLS violations because Security 3 RLS is in place and anon is denied on both tables. That is the desired state until Booking B ships.
  - The booking form's n8n POST to the forms Worker (Security 4) is unchanged and still works; the operator is notified via n8n. The transactional Supabase write is gated to Booking B (`reserve_slot` RPC, called server-side from a Cloudflare Worker that holds the `service_role` key).
  - No `reserve_slot` is created. No `bookings` table changes. No new column / index / constraint on `available_slots`.

- **Booking B is the next eligible implementation phase.** It is **not** started in this overlay. Booking B is blocked until ChatGPT Control Room gives the exact Booking B prompt.

- **Git push / remote still blocked until final delivery approval.** No `git push`, no `git remote add`, no GitHub repo, no publish. Local commits are owner-driven and OPTIONAL. The first commit is OPTIONAL.

- **Package installs / tooling still blocked.** No `npm install`, no `pnpm install`, no `yarn install`, no `npx`, no `npm run`, no `pnpm run`, no `yarn run`, no `wrangler deploy`. No new dependency. No new env var. No new auth library. No new Worker change.

- **TS0 / RDG0 still blocked.** Per-tool owner approval gated. No install, no clone, no configuration, no evaluation.

- **Ponytail / ECC still candidate-only and blocked.** No install / clone / copy / configure / evaluate.

- **Worker deployments still owner-side and not done unless separately confirmed.** The Security 1 Worker (`workers/anthropic-proposal-proxy.ts`) and the Security 4 Worker (`workers/n8n-form-proxy.ts`) are unchanged. They are not deployed by OpenCode. Deployment is owner-driven and not done in this overlay.

**Pre-flight verification:**

- The on-disk migration at `supabase/migrations/20260616_booking_a_get_available_slots.sql` matches what the owner applied (with the Repair 1 quoting of `"time"`). The file is the source of truth.
- No source code change in this overlay. No `package.json`, no lockfile, no `tsconfig.json`, no `next.config.*`, no `postcss.config.*`, no eslint / tailwind config, no real `.env*`, no `public/_headers`, no `workers/**` change. No `app/**` change. No `components/**` change. No `hooks/**` change. No `styles/` change. No `lib/**` change.
- No SQL file change in this overlay. The on-disk SQL migration is unchanged (the file is already in its post-Repair 1 form from the prior turn; runtime changes were applied by the owner in Supabase).
- No `git add`, no `git commit`, no `git push`, no `git remote add`, no `git fetch`, no `git pull`. No `npm install`, no `pnpm install`, no `yarn install`, no `npx`, no `npm run`, no `pnpm run`, no `yarn run`, no `wrangler deploy`. No Supabase dashboard command, no `psql`, no Supabase CLI. **Pass.**
- No Booking B work started. No `reserve_slot` SQL written. No `bookings` table changes. No new column / index / constraint on `available_slots`. **Pass.**
- No MCP setup. No `.mcp.json` write. No `.opencode/`, `.codex/`, `.claude/` change. No Ponytail. No ECC / affaan-m/ecc. No Impeccable. No Emil Kowalski. No Playwright. No Chrome DevTools MCP. No Graphify. No Repomix. No Context7 MCP. No Tree-sitter. No codebase-memory MCP. **Pass.**

**Known non-blocking issue (recorded for future cleanup; do not start this repair unless explicitly approved):**

- The Booking A smoke test shows the `"time"` column sorted lexicographically / textually, so `1:00 PM` can appear before `10:00 AM`. This is because the `"time"` column is `text` (`'9:00 AM'`, `'9:30 AM'`, `'1:00 PM'`, etc.), and Postgres sorts `text` by character code, not by the underlying wall-clock value. The current read-path contract returns the columns the calendar needs (`id`, `date`, `"time"`), and the calendar UI can be honest about availability today, but a per-day re-sort by the calendar's own time order is needed if the user expects the visual order `9:00 AM, 9:30 AM, ..., 4:30 PM`. This is a **minor UX / ordering issue**, not a security blocker, and not a correctness issue: the rows themselves are correct; only the order is non-chronological. **Recorded as a future minor repair or a Booking B-adjacent cleanup. Do not start this repair unless explicitly approved.** The RPC and the read path are otherwise working.

**Status:** Documentation-only state sync run. No source code change. No SQL applied by OpenCode. No Booking B started. The repo no longer says Security 3 or Booking A are "not applied" at runtime. Security 3 and Booking A are recorded as **applied and verified**. Booking A Repair 1 is recorded as **passed and applied to the on-disk migration**. Booking A live grant repair is recorded as **applied and verified**. Booking B is **next eligible but not started**. The first commit is OPTIONAL. The next gate is **ChatGPT Control Room issuing the exact Booking B prompt** (and reviewing the Booking A runtime state recorded in this overlay). The next phase after Booking B is Observability. The other phases (QA Slice 0..3, TS0 / RDG0, UIX0 / MOTION0, Admin future, Final QA / delivery) remain blocked behind their respective gates.

## Booking B batch overlay (2026-06-16)

**Phase:** Booking B (A0 future phase #9; D-019b robust transactional reservation; the booking write path that pairs with Booking A's read path). Booking B ran on 2026-06-16 as a deliberate, additive exception gated by the owner's Booking B recovery prompt; Booking B is not a substitute for A0 review. **A0 is approved by ChatGPT Control Room as of the Security 4 phase (2026-06-16); the carry-forward is recorded in `ai/AI_CONTEXT_RULES.md`.**

**Gate status (overlay):**

- Root confirmed: `F:\CodeOutfitters`. Git initialized with `git init -b main` in the Setup phase. No commits. No remote. No push.
- **SQL migration written** at `supabase/migrations/20260616_booking_b_reserve_slot.sql` (629 lines, pre-existing in the repo from a prior session, unchanged in this batch). **NOT applied.** The owner applies it manually via the Supabase SQL editor (recommended) or the Supabase CLI (alternative). Recommended order: Security 3 → Booking A → Booking B. The Booking B SQL works in either order, but the full design is coherent only when Security 3 and Booking A are in place. Steps are in `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md` §6.
- **Booking Worker source written** at `workers/booking-reservation-worker.ts` (~440 lines, new in this batch). **NOT deployed.** The owner deploys it via `wrangler deploy` (recommended) or the Cloudflare dashboard (alternative). The Worker holds the `SUPABASE_SERVICE_ROLE_KEY` server-side and calls `supabase.rpc('reserve_slot', ...)` against the `public.reserve_slot(p_date date, p_time text, p_booking jsonb) returns uuid` RPC. The Worker optionally forwards the same payload to the n8n booking webhook (with the per-form secret) so the operator still gets a notification. Deployment steps are in `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md` §7.
- **`createBooking` in `lib/booking-actions.ts` replaced wholesale** (per its own Booking A docstring). The new body is a thin client-side wrapper that POSTs the booking payload to `${NEXT_PUBLIC_BOOKING_WORKER_URL}/` with `credentials: 'omit'` and `Content-Type: application/json`. The function preserves the `ActionResult<null>` contract: `200` → success; `409` → "this time slot is no longer available"; `400` → validation error surfaced; other → generic "Failed to create booking" message. The previous direct `supabase.from('bookings').insert(...)` and `supabase.from('available_slots').update(...)` calls are **removed**. The `getSupabase()` import is preserved (still used by `getAvailableSlots`).
- **`handleSubmit` in `components/booking-calendar-custom.tsx` replaced** to call `createBooking(formData)` instead of posting to `${NEXT_PUBLIC_FORMS_WORKER_URL}/` directly. The form's local `formData` state (name / email / company / phone / message) is augmented with `preferredDate` (from the selected date), `preferredTime` (from the selected time), and `timezone` (from `Intl.DateTimeFormat().resolvedOptions().timeZone`, falling back to `'America/New_York'`) to build the `BookingFormData` payload. Imports updated: `createBooking` added to the action import; `BookingFormData` added to the type import. **UI design unchanged**: step indicator, form fields, placeholder text, validation, honeypot, type field, success state, error state, the "No spam, ever." footer, the booking summary card, the back buttons. The form's `maxLength` caps (100 / 100 / 100 / 20 / 500) are unchanged and match the Worker's stricter caps (100 / 100 / 100 / 20 / 2000).
- **`.env.local.example` updated**: added `NEXT_PUBLIC_BOOKING_WORKER_URL` with a comment block explaining the security model (the Worker holds the `service_role` key server-side; the browser never calls `reserve_slot` directly). No real `.env` or `.env.local` is modified.
- **`repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md` written** (new; ~430 lines; primary deliverable for the Booking B phase; covers current problem, SQL file created, RPC contract, Worker contract, frontend files changed, owner-side SQL application steps, owner-side Worker deployment steps, verification queries, frontend integration summary, known remaining risks, rollback plan, testing checklist, sign-off).
- **`repo-research/RISK_REGISTER.md` updated**: R-005 row's "Proposed Future Fix" column updated with the Booking A read path closure and the Booking B code-shipped write path status. A new "Closed risks" section appended with the closure records for R-001 (Cleanup A), R-002 (Cleanup B), R-019 (Cleanup A), R-023 (Cleanup A), R-025 (Setup), R-027 (Cleanup A). R-005 is NOT in the Closed section; it stays in the main table until the owner applies the SQL and deploys the Worker.
- **`memory/IMPORTANT_DECISIONS.md` updated**: Booking B reflection note appended. No new D-IDs.
- **`ai/AI_TASK_CAPSULE.md` updated**: "Phase we are in" updated; Booking B never-do rules added.
- **`ai/AI_CONTEXT_RULES.md` updated**: Booking B hard rule added.
- **`docs/51_AGENT_HANDOFF_LOG.md` updated**: Booking B handoff entry appended.
- **`memory/CURRENT_STATE.md` updated**: current state extended with Booking B.
- **`memory/WORKING_MEMORY.md` acknowledged**: no new open questions; the file is unchanged.

**Pre-flight verification:**

- `supabase/migrations/20260616_booking_b_reserve_slot.sql` exists, 629 lines, is heavily commented, is idempotent, creates only the `reserve_slot` function and the `UNIQUE (preferred_date, preferred_time)` constraint, grants `EXECUTE` to `service_role` only, and does not modify `get_available_slots` (Booking A). Quotes `s."date"` and `s."time"` everywhere. **Pass.**
- `workers/booking-reservation-worker.ts` exists, ~440 lines, is heavily commented, calls `POST ${SUPABASE_URL}/rest/v1/rpc/reserve_slot` with the `SUPABASE_SERVICE_ROLE_KEY`, enforces `ALLOWED_ORIGIN` server-side, validates the payload, optionally forwards to n8n. No npm dependencies. No `package.json` change. **Pass.**
- `lib/booking-actions.ts` does **not** call `supabase.from('bookings').insert(...)` or `supabase.from('available_slots').update(...)` anywhere. The only Supabase reference in the file is `getSupabase()` in `getAvailableSlots`. The new `createBooking` posts to `${NEXT_PUBLIC_BOOKING_WORKER_URL}/`. **Pass.**
- `components/booking-calendar-custom.tsx:handleSubmit` calls `createBooking(formData)`. It does not call the n8n forms Worker directly. The UI design is unchanged. The form's `maxLength` caps are unchanged. The honeypot, the validation, the step indicator, the design tokens, the `type: "booking"` payload field are all unchanged. **Pass.**
- `package.json`, `package-lock.json`, `pnpm-lock.yaml` (in `.gitignore`; not present), `yarn.lock`, `tsconfig.json`, `next.config.*`, `postcss.config.*`, eslint / tailwind configs are unchanged. `public/_headers` is unchanged (the Worker is reachable on `https://*.workers.dev` which is already in the CSP from Security 1 / Security 4). `app/`, `hooks/`, `styles/` are unchanged. `lib/` is unchanged except `lib/booking-actions.ts`. The forms Worker (`workers/n8n-form-proxy.ts`) is unchanged. The Security 1 Worker (`workers/anthropic-proposal-proxy.ts`) is unchanged. `lib/supabase.ts`, `lib/booking-schema.sql`, `lib/booking-types.ts` are unchanged. The four form components other than `components/booking-calendar-custom.tsx` are unchanged. `tests/`, `.github/`, `.mcp.json`, `.opencode/`, `.codex/`, `.claude/` are unchanged. **Pass.**
- No `git add`, no `git commit`, no `git push`, no `git remote add`, no `git fetch`, no `git pull`. No `npm install`, no `pnpm install`, no `yarn install`, no `npx`, no `npm run`, no `pnpm run`, no `yarn run`. No `wrangler deploy`. No `psql`. No Supabase CLI. No database command. No package-manager command. No deploy command. No Cloudflare dashboard command. No Supabase dashboard command. No MCP setup. No Ponytail. No ECC / affaan-m/ecc. No Impeccable. No Emil Kowalski. No Playwright. No Chrome DevTools MCP. No Graphify. No Repomix. No Context7 MCP. No Tree-sitter. No codebase-memory MCP. **Pass.**
- No `Observability` work started. No `QA Slice` work started. No `TS0 / RDG0` work started. No `UIX0 / MOTION0` work started. No `Admin future` work started. No `Final QA / delivery` work started. **Pass.**

**Known non-blocking issue (carried from Booking A; do not start this repair unless explicitly approved):**

- The `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`). The frontend `components/booking-calendar-custom.tsx` sorts the times for the selected date using a hard-coded `TIME_SLOTS` array, so the order is correct in the UI even when the RPC's order is not. The data is correct; only the RPC's `ORDER BY` is non-chronological. Recorded for a future minor repair or a Booking-B-adjacent cleanup. **Do not start this repair unless explicitly approved.**

**Hard rules reaffirmed (Booking B-specific):**

- `reserve_slot` is `service_role` only. Anon is **never** granted EXECUTE on `reserve_slot`. The migration `REVOKE ALL ON FUNCTION public.reserve_slot(date, text, jsonb) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.reserve_slot(date, text, jsonb) TO service_role;` and no other grants.
- The browser does **not** call `reserve_slot` directly. The browser only knows `NEXT_PUBLIC_BOOKING_WORKER_URL`. The Worker is the boundary. No `supabase.rpc('reserve_slot', ...)` call from the browser. No `supabase.from('bookings').insert(...)` or `supabase.from('available_slots').update(...)` from the browser.
- The `service_role` key is server-side only. No `NEXT_PUBLIC_*` env var contains the key. No `service_role` key in the static bundle, in the repo, in the Cloudflare Pages dashboard, or in any client-reachable file. The key is bound only to the Worker.
- The function signature is `public.reserve_slot(p_date date, p_time text, p_booking jsonb) returns uuid` (no other signature, no overloads).
- `available_slots."time"` is double-quoted wherever referenced (`s."date" = p_date AND s."time" = p_time`).
- The `UNIQUE (preferred_date, preferred_time)` constraint on `bookings` is added in the same migration in an idempotent `DO $$ ... $$` block.
- The Worker is a thin proxy plus a strict CORS gate. CORS is not authentication. The Worker is exposed to anyone who can match an `ALLOWED_ORIGIN` entry from a browser they control. There is no rate limit. The booking form's honeypot is the only bot protection.

**Inputs respected:** D-019 (booking correctness as launch gate), D-019b (Booking MVP write path = A first, then C; the robust B + D path is Booking B), D-020 (Supabase RLS as launch gate), the Security 3 RLS forward-compatible `service_role` EXECUTE grant on `reserve_slot`, the Security 4 forms Worker (still handles contact / quote / newsletter; booking form posts to the Booking Worker instead), the 2026-06-16 Control Room correction on git push / commit policy. A0 plan §5.9 (Booking B) and `repo-research/A0_PHASE_EXECUTION_QUEUE.md` row #9. `docs/DATABASE.md` (RPC section), `docs/SECURITY.md` (Security 3 status banner; F-003; the forward-compatible grants), `repo-research/SECURITY_3_SUPABASE_RLS_NOTES.md` (forward-compatible grants; rollback), `repo-research/BOOKING_CORRECTNESS_BRIEF.md` (the R-005 read-path gap), `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` (phase-by-phase boundaries; Supabase SQL files = Security 3, Booking A, Booking B; worker source = Security 1, Booking B), `INTEGRATION_NOTES.md` §8.3 (planned Booking B write path), `lib/booking-schema.sql`, `lib/booking-actions.ts`, `components/booking-calendar-custom.tsx`.

**Outputs of this batch:**

- `workers/booking-reservation-worker.ts` (new; primary deliverable; the Worker; ~440 lines; heavily commented; no npm dependencies; CORS gate; payload validation; RPC call; optional n8n forward; no `service_role` key in the static bundle).
- `lib/booking-actions.ts` (replaced `createBooking` body per its own Booking A docstring; the new body is a thin client-side wrapper that posts to `${NEXT_PUBLIC_BOOKING_WORKER_URL}/`; preserves `ActionResult<null>`; `getAvailableSlots` unchanged).
- `components/booking-calendar-custom.tsx` (replaced `handleSubmit` to call `createBooking(formData)`; imports updated to include `createBooking` and `BookingFormData`; UI design unchanged; submit handler no longer posts to `${NEXT_PUBLIC_FORMS_WORKER_URL}/`).
- `.env.local.example` (added `NEXT_PUBLIC_BOOKING_WORKER_URL` with a comment block; no real `.env` or `.env.local` modified).
- `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md` (new; primary deliverable for the Booking B phase; covers current problem, SQL file created, RPC contract, Worker contract, frontend files changed, owner-side SQL application steps, owner-side Worker deployment steps, verification queries, frontend integration summary, known remaining risks, rollback plan, testing checklist, sign-off).
- `repo-research/RISK_REGISTER.md` (R-005 row updated; new "Closed risks" section appended with the closure records for R-001, R-002, R-019, R-023, R-025, R-027).
- `PROJECT_CONTROL_LOG.md` (this overlay; phase history row to be added; gate status row to be updated; "Exact next gate after Booking B" section).
- `memory/CURRENT_STATE.md` (snapshot extended with Booking B; blocked list updated; exact next gate added).
- `memory/IMPORTANT_DECISIONS.md` (Booking B reflection note appended; D-019b reaffirmed; no new D-IDs).
- `ai/AI_TASK_CAPSULE.md` (phase line updated to Booking B; never-do list extended with Booking B-specific rules).
- `ai/AI_CONTEXT_RULES.md` (Booking B hard rule added; future-phase boundary rule reaffirmed).
- `docs/51_AGENT_HANDOFF_LOG.md` (Booking B handoff entry appended).

**Status:** Booking B run. SQL migration on disk (pre-existing, unchanged). **NOT applied.** Worker source on disk (new). **NOT deployed.** Frontend `createBooking` replaced. Frontend `handleSubmit` updated. `.env.local.example` updated. R-005 code-shipped at the write path level. F-004 implemented for the full booking flow (read + write); F-004 is **fully closed** only when the owner applies the SQL and deploys the Worker. The booking UI is end-to-end honest: the calendar shows only available slots, and the submit path persists the booking through a single transactional RPC. No commit. No push. No remote. No deploy. No Supabase command. The first commit is OPTIONAL. The next gate is **the owner applying the Booking B SQL migration** and **the owner deploying the Booking Worker** to Cloudflare, plus any follow-up the owner requests. The next phase after Booking B is **Observability** (A0 future phase #10). The other phases (QA Slice 0..3, TS0 / RDG0, UIX0 / MOTION0, Admin future, Final QA / delivery) remain blocked behind their respective gates.

## Booking B Repair 1 batch overlay (2026-06-16) — dashboard JS copy

**Phase:** Booking B Repair 1 (small deployment-compatibility repair; one new file + state updates; no source-of-truth changes).

**Gate status (overlay):**

- The owner pasted `workers/booking-reservation-worker.ts` into the Cloudflare dashboard Worker editor and received `Uncaught SyntaxError: Unexpected strict mode reserved word at worker.js:178`. Root cause: the dashboard Worker editor parses pasted code as JavaScript, not TypeScript. The `.ts` source contains `interface Env` (line 178) and other TypeScript-only syntax. `interface` is a strict-mode reserved word in JavaScript; hence the parser error.
- **Repair:** `workers/booking-reservation-worker.dashboard.js` shipped. 1:1 runtime port of the TypeScript Worker. All TypeScript-only syntax removed (`interface`, type annotations, type unions, type intersections, type predicates, `as` casts). All runtime logic preserved byte-for-byte: CORS gate, payload validation, Supabase REST call (path, method, headers, body), response shape, n8n forward with `X-CodeOutfitters-Form-Secret` header and `type: 'booking'` body field, error mapping (P0001 / 23505 / 22023). All env bindings preserved exactly: `ALLOWED_ORIGIN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `N8N_BOOKING_WEBHOOK_URL`, `N8N_BOOKING_SECRET`. Worker module format preserved: `export default { async fetch(request, env) { ... } }`. Service-role key handling preserved: only in the `apikey` and `Authorization: Bearer` request headers to the Supabase REST API. Supabase RPC path preserved: `${SUPABASE_URL}/rest/v1/rpc/reserve_slot`.
- **Two deployment paths documented:**
  - **`wrangler` CLI** (recommended): use `workers/booking-reservation-worker.ts`. `wrangler` accepts `.ts` directly (esbuild). The TypeScript Worker is the source of truth.
  - **Cloudflare dashboard paste** (when the owner prefers GUI or when `wrangler` is unavailable): use `workers/booking-reservation-worker.dashboard.js`. Do **not** paste the `.ts` source into the dashboard; it will fail with the same syntax error.
- **TypeScript Worker source:** unchanged. The `.ts` file at `workers/booking-reservation-worker.ts` is the source of truth for `wrangler` deploys. The `.dashboard.js` file is the dashboard-paste form. Both files produce the same Worker behavior.
- **Hard rules reaffirmed:** no SQL applied; no Worker deployed by OpenCode; no package commands; no `git add` / `commit` / `push`; no service-role key exposed; no Booking B SQL changed; no new phase started. The repair is one new file + state updates only.
- **Next phase:** Observability (A0 future phase #10). Still blocked until ChatGPT Control Room issues the exact Observability prompt and the owner completes the Booking B owner-action steps (SQL apply + Worker deploy).
- **Files created in this repair:** `workers/booking-reservation-worker.dashboard.js` (~400 lines; the dashboard JS copy).
- **Files modified in this repair:** `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md` (§14 "Booking B Repair 1 — dashboard JS copy" appended); `PROJECT_CONTROL_LOG.md` (this overlay); `memory/CURRENT_STATE.md` (Booking B Repair 1 note appended); `docs/51_AGENT_HANDOFF_LOG.md` (Booking B Repair 1 handoff entry appended).
- **Files NOT modified:** `workers/booking-reservation-worker.ts` (unchanged; the `.ts` source is the source of truth). All Booking B code-level files (`supabase/migrations/20260616_booking_b_reserve_slot.sql`, `lib/booking-actions.ts`, `components/booking-calendar-custom.tsx`, `.env.local.example`) are unchanged. `package.json`, lockfiles, `tsconfig.json`, `next.config.*`, `postcss.config.*`, eslint / tailwind configs are unchanged. `public/_headers`, `app/`, `hooks/`, `styles/`, `workers/` (other than the new `.dashboard.js`), `lib/` (other than the prior `lib/booking-actions.ts`), `components/` (other than the prior `components/booking-calendar-custom.tsx`) are unchanged. The other two Workers (`workers/anthropic-proposal-proxy.ts`, `workers/n8n-form-proxy.ts`) are unchanged. `tests/`, `.github/`, `.mcp.json`, `.opencode/`, `.codex/`, `.claude/` are unchanged.
- **Status:** Booking B Repair 1 run. JS dashboard copy shipped. TypeScript Worker unchanged. State files updated. R-005, F-004, all hard rules, and all "no" rules (no deploy, no SQL, no package commands, no git add/commit/push, no service-role key exposure, no new phase) are preserved.

## Booking B runtime state record batch overlay (2026-06-16) — documentation-only state sync

**Phase:** Booking B runtime state record (documentation-only state sync; no source code change; no SQL applied by OpenCode; no Worker deployed by OpenCode).

**Gate status (overlay):**

- **Booking B is now applied and verified at runtime by the owner (2026-06-16).** The repo previously said Booking B was "code-shipped at the write path level" and "deferred at the runtime level" — that is no longer true. The owner confirmed the runtime facts listed below. This overlay is documentation / state files only.
- **Runtime facts confirmed by owner (2026-06-16):**
  - **Booking B SQL:** `public.reserve_slot(p_date date, p_time text, p_booking jsonb)` exists with the documented signature. `bookings_preferred_date_time_unique` exists. The grant repair was applied: `anon` and `authenticated` do **not** have EXECUTE on `reserve_slot`; `service_role` has EXECUTE on `reserve_slot`.
  - **Booking Worker:** deployed. The owner's account workers subdomain is `samuel` (per the deployed URL the owner used; the `.ts` in the URL is a copy-paste artifact of the source filename; the actual deployed Worker URL is the Worker URL the owner pasted into the Cloudflare dashboard). The Cloudflare dashboard JS repair (Booking B Repair 1, 2026-06-16) was needed because the dashboard editor parses pasted code as JavaScript, not TypeScript; the `.ts` source contains `interface Env` (line 178) and other TypeScript-only syntax that fails strict-mode parsing. The owner used `workers/booking-reservation-worker.dashboard.js` for the dashboard paste. Required Worker env vars were configured: `ALLOWED_ORIGIN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. n8n vars (`N8N_BOOKING_WEBHOOK_URL`, `N8N_BOOKING_SECRET`) were intentionally left for later.
  - **Worker smoke test passed:** the owner called the Worker and received `bookingId = 69e071f0-8954-4da1-bcb4-75f272bd2b87` with `notification = "skipped"`. Supabase verification confirmed the booking row exists in `public.bookings` for `preferred_date = 2026-06-17` / `preferred_time = '10:00 AM'`. Supabase verification confirmed `available_slots.is_booked = true` for `2026-06-17` / `10:00 AM`. A duplicate booking test returned `slot_already_booked` (`P0001`).
  - **Frontend deployment:** Cloudflare Pages project is connected to GitHub. Current Pages deployment is still old GitHub code (pre-Booking-B). Booking B frontend cannot be live-tested through Pages until the updated local code is pushed/deployed. Git push / remote remains blocked until the owner explicitly approves final delivery deploy.
- **Files modified in this overlay:** `repo-research/BOOKING_B_RESERVATION_RPC_WORKER_NOTES.md` (status banner updated; "What is blocked" / sign-off updated; runtime state record note appended); `PROJECT_CONTROL_LOG.md` (this overlay); `memory/CURRENT_STATE.md` (Phase line + "What is blocked" + "Exact next gate after Booking B" updated); `memory/ACTIVE_TASK_CONTEXT.md` (task replaced with the runtime state record task; in-scope / out-of-scope / definition of done updated); `memory/WORKING_MEMORY.md` (current task + phase gate + new "Booking B runtime state record" section); `memory/EPISODIC_MEMORY.md` (Booking B runtime state record event appended); `memory/IMPORTANT_DECISIONS.md` (Booking B runtime state record reflection note appended; no new D-IDs); `ai/AI_TASK_CAPSULE.md` ("Phase we are in" updated; never-do list extended with runtime-state rules; "Things to be skeptical of" updated); `ai/AI_CONTEXT_RULES.md` (Booking B hard rule extended with runtime state record line); `docs/DEPLOYMENT.md` (new "Booking B — Reserve Slot RPC + Worker" section; post-deploy checklist extended; "What is not part of the deploy" updated); `INTEGRATION_NOTES.md` (§2 `createBooking` updated; §8.3 "Writes via a specific RPC" / "Impact on the current booking flow" / new "Booking B delivery" entry; `p_time time` typo corrected to `p_time text`); `docs/51_AGENT_HANDOFF_LOG.md` (Booking B runtime state record handoff entry appended).
- **Files NOT modified:** `workers/booking-reservation-worker.ts` (unchanged; the `.ts` source is the source of truth); `workers/booking-reservation-worker.dashboard.js` (unchanged; the dashboard-paste form); `supabase/migrations/20260616_booking_b_reserve_slot.sql` (unchanged; already in its final form from the prior Booking B turn; runtime changes were applied by the owner in Supabase); `lib/booking-actions.ts` (unchanged); `components/booking-calendar-custom.tsx` (unchanged); `.env.local.example` (unchanged); `package.json`, `package-lock.json`, `pnpm-lock.yaml` (in `.gitignore`; not present), `yarn.lock`, `tsconfig.json`, `next.config.*`, `postcss.config.*`, eslint / tailwind configs (unchanged); `public/_headers` (unchanged); `app/`, `hooks/`, `styles/`, `lib/` (other than the prior `lib/booking-actions.ts`), `components/` (other than the prior `components/booking-calendar-custom.tsx`), `workers/` (other than the prior `.ts` + `.dashboard.js`) (unchanged); the other two Workers (`workers/anthropic-proposal-proxy.ts`, `workers/n8n-form-proxy.ts`) (unchanged); `tests/`, `.github/`, `.mcp.json`, `.opencode/`, `.codex/`, `.claude/` (unchanged).
- **Hard rules reaffirmed:** no source code change; no SQL file change; no env file change; no lockfile change; no `package.json` change; no `tsconfig.json` change; no `next.config.*` change; no `postcss.config.*` change; no eslint / tailwind config change; no real `.env*` change; no `public/_headers` change; no `app/` / `components/` / `hooks/` / `lib/` / `styles/` / `workers/` / `supabase/migrations/` change; no `git add` / `commit` / `push` / `remote add` / `fetch` / `pull`; no `npm install`, `pnpm install`, `yarn install`, `npx`, `npm run`, `pnpm run`, `yarn run`, `wrangler deploy`, deploy command of any kind, Cloudflare dashboard command, Supabase dashboard command, `psql`, Supabase CLI, database command of any kind, package-manager command of any kind; no new `NEXT_PUBLIC_*_SECRET` env var; no `service_role` key in any `NEXT_PUBLIC_*` env var, in the static bundle, in the repo, or in any client-reachable file; no MCP setup; no Ponytail; no ECC / affaan-m/ecc; no Impeccable; no Emil Kowalski; no Playwright; no Chrome DevTools MCP; no Graphify; no Repomix; no Context7 MCP; no Tree-sitter; no codebase-memory MCP. The runtime state record is documentation / state files only.
- **No application of the Booking B SQL migration by OpenCode.** The owner applied it manually on 2026-06-16. OpenCode did not apply it.
- **No deployment of the Booking Worker by OpenCode.** The owner deployed the Worker via the Cloudflare dashboard paste of `workers/booking-reservation-worker.dashboard.js` on 2026-06-16. OpenCode did not deploy.
- **No new decisions.** This overlay only records runtime state and a Booking B runtime state record reflection note. The D-IDs in `memory/IMPORTANT_DECISIONS.md` remain canonical.
- **No starting of Observability.** The next eligible implementation phase after Booking B runtime closure is **Observability (A0 future phase #10)**. Observability is blocked until ChatGPT Control Room issues the exact Observability prompt.
- **Remaining deployment gap (informational, not a Booking B defect):** the Cloudflare Pages project is connected to GitHub; the current Pages deployment is still old GitHub code (pre-Booking-B frontend). The Worker is end-to-end functional at the Worker level (smoke test passed; Supabase verification passed); the browser-driven end-to-end flow cannot be live-tested through Pages until the updated local code is pushed/deployed. **Git push / remote remains blocked** until the owner explicitly approves final delivery deploy (per the 2026-06-16 Control Room correction on git push / commit policy).
- **Risks closed in this batch:** **R-005 (booking double-book) is fully closed at the runtime level (2026-06-16).** The owner confirmed the Worker smoke test passed (bookingId returned), the Supabase verification confirmed the booking row was created and `available_slots.is_booked` was flipped, and the duplicate booking test returned `slot_already_booked` (`P0001`). The row lock + UNIQUE constraint defense in depth is working as designed. **F-004 (UI reads `available_slots` and only offers actually-available slots; the submit path persists the booking through a single transactional RPC) is fully closed at the runtime level (2026-06-16).** Read path closed by Booking A (verified at runtime); write path closed by Booking B (code-shipped in prior turn; verified at runtime in this turn).
- **Risks still open:** R-005 (time column ordering) — unchanged. The `"time"` column is `text` and the RPC returns it sorted lexicographically (so `1:00 PM` can appear before `10:00 AM`). The frontend sorts the times for the selected date using a hard-coded `TIME_SLOTS` array, so the order is correct in the UI even when the RPC's order is not. Recorded for a future minor repair or Booking-B-adjacent cleanup. **Do not start this repair unless explicitly approved.** R-007 / R-031 (seed exhaustion) — unchanged. All other risks (R-001..R-035) are closed, deferred to future phases, or out of scope per `repo-research/RISK_REGISTER.md`.
- **Status:** Documentation-only state sync run. Booking B is **applied and verified at runtime by the owner (2026-06-16)**. R-005 is **fully closed at the runtime level**. F-004 is **fully closed at the runtime level**. The on-disk SQL migration is unchanged. The Worker sources are unchanged. The frontend is unchanged. `.env.local.example` is unchanged. No commit. No push. No remote. The first commit is OPTIONAL. The next gate is **ChatGPT Control Room approval of the Booking B runtime state record** and the owner's decision on whether to push the local code to GitHub and trigger a final-delivery Pages deploy. The next phase after Booking B runtime closure is **Observability (A0 future phase #10)**. Observability is still blocked.

