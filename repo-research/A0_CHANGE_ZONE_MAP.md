# A0 CHANGE ZONE MAP

> **Status:** A0 file-zone classification map for ChatGPT Control Room. **Plan-only.** No code, no installs, no MCP setup, no lockfile edits, no `package.json` edits, no README edits, no security / booking fixes, no UIX0 / MOTION0 / TS0 / RDG0 / IMPL work started, no git init, no Ponytail / ECC install / clone / copy / configure / evaluation.
>
> **Phase:** A0 — Action / Build Plan (companion to `docs/A0_ACTION_PLAN.md`, `repo-research/A0_PHASE_EXECUTION_QUEUE.md`, and `repo-research/A0_AGENT_ASSIGNMENT_MATRIX.md`).
>
> **Source materials:** `docs/PM1_PLAN.md`, `docs/PD1_DECISION_LOCK.md`, `docs/D0_ARCHITECTURE_DECISIONS.md`, `docs/D0_SYSTEM_DESIGN.md`, `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md`, `repo-research/PM1_PHASE_SEQUENCE.md`, `repo-research/AGENT_BOUNDARY_MAP.md`, `docs/A0_ACTION_PLAN.md`, `repo-research/A0_PHASE_EXECUTION_QUEUE.md`, `repo-research/A0_AGENT_ASSIGNMENT_MATRIX.md`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`, all `memory/`, all `ai/`.
>
> **Hard rules respected:** no code, no installs, no MCP setup, no lockfile edits, no `package.json` edits, no README edits, no security / booking fixes, no A0 / UIX0 / MOTION0 / TS0 / RDG0 / IMPL work started, no git init, no Ponytail / ECC install / clone / copy / configure / evaluation.
>
> **Updated 2026-06-16 (Cleanup B executed):** Cleanup B ran on 2026-06-16. `pnpm-lock.yaml` deleted; `package-lock.json` canonical; `pnpm-lock.yaml` listed in `.gitignore`; `package.json` unchanged. R-002 closed. CI re-entry guard is gated to a future TS0 / RDG0 phase.

## How to use this file

- Each row is a file or zone. Each row names the phase that may touch it later, the reason, the approval required, and notes.
- "Forbidden now" means the file or zone is off-limits in the A0 phase. The A0 phase may not modify it.
- "Phase allowed" names the future phase that owns the file or zone. The future phase is gated to ChatGPT Control Room and respects the per-phase rules in `repo-research/A0_PHASE_EXECUTION_QUEUE.md`.
- The "Approval required" column names the gate that must clear before the file or zone may be modified.

## Change zone table

| File / Zone | Phase Allowed | Why | Approval Required | Notes |
|---|---|---|---|---|
| `docs/` | A0 (this phase); Setup; Cleanup A; Cleanup B; Security 1..5; Booking A; Booking B; Observability; QA Slice 0..3; UIX0 / MOTION0 Planning; UIX0 / MOTION0 first slice + later slices; Admin future; Final QA; every phase that updates docs | Project documentation. A0 writes its primary deliverable here. Every future phase may update the relevant `docs/*.md` file (prose only; no code). | Per phase gate (e.g. Cleanup A may edit `README.md` only with Q-13 / Q-14 owner answers; UIX0 / MOTION0 may edit `docs/FEATURES.md`, `docs/ARCHITECTURE.md`, `docs/QA_CHECKLIST.md` with the motion plan approved). | A0 itself writes `docs/A0_ACTION_PLAN.md` only. |
| `memory/` | A0 (this phase); every phase that records state | Development memory is mandatory repo infrastructure (D-001). A0 updates the required state files. | Per phase gate. | A0 itself updates `memory/CURRENT_STATE.md`, `memory/ACTIVE_TASK_CONTEXT.md`, `memory/WORKING_MEMORY.md`, `memory/EPISODIC_MEMORY.md`, `memory/IMPORTANT_DECISIONS.md` only. Append-only for `EPISODIC_MEMORY.md`, `IMPORTANT_DECISIONS.md`, `WORKING_MEMORY.md`; rewrite OK for `CURRENT_STATE.md`, `ACTIVE_TASK_CONTEXT.md` (most-recent-writer-wins). |
| `ai/` | A0 (this phase); every phase that records agent context | Agent context. A0 updates the required state files. | Per phase gate. | A0 itself updates `ai/AI_TASK_CAPSULE.md`, `ai/AI_CONTEXT_RULES.md` only. |
| `repo-research/` | A0 (this phase); every phase; planning scratchpad | Planning scratchpad. A0 writes its three companion tables here. | Per phase gate. | A0 itself writes `repo-research/A0_PHASE_EXECUTION_QUEUE.md`, `repo-research/A0_AGENT_ASSIGNMENT_MATRIX.md`, `repo-research/A0_CHANGE_ZONE_MAP.md` only. |
| `PROJECT_CONTROL_LOG.md` | A0 (this phase); every phase (append-only) | Phase ledger. A0 appends the A0 batch overlay. | Per phase gate. | Append-only. |
| `INTEGRATION_NOTES.md` | A0 (this phase); every phase (prose only) | External service contracts. A0 appends integration sequencing clarifications (additive only; no breaking changes; prose only). | Per phase gate. | A0 itself appends §8 "A0 integration sequencing clarifications" (prose only; no breaking changes). |
| `README.md` | Cleanup A only | The README is wrong today (port 3000, wrong entry, no admin / security / Supabase). PM1 + D0 planned the surgical repair. A0 may not edit it. A0 only references it. | Cleanup A: Q-13 / Q-14 owner answers; ChatGPT Control Room approval. | A0 may not edit `README.md` in this phase. Cleanup A may edit it surgically per `repo-research/README_REPAIR_SPEC.md`. |
| `DEPLOY.md` (root) | Cleanup A (delete per Q-13) or Cleanup B | Legacy `DEPLOY.md` is superseded by `docs/DEPLOYMENT.md`. | Cleanup A: Q-13 owner answer; ChatGPT Control Room approval. | A0 may not delete `DEPLOY.md` in this phase. |
| `app/` | Setup (first commit is a snapshot, no edits); IMPL phases only (gated per workstream) | Public routes (`app/(public)/...`) and admin routes (`app/admin/...`). A0 may not edit any file in `app/`. | Per phase gate. The first IMPL phase that edits `app/admin/layout.tsx` is Security 2. The first IMPL phase that edits `app/admin/proposal/page.tsx` is Security 1. The first IMPL phase that edits `app/admin/page.tsx` is Security 2 or Admin future. The first IMPL phase that edits `app/(public)/portfolio/page.tsx` is Cleanup A (copy only). | A0 may not edit any file in `app/`. |
| `components/` | Cleanup A (one field in `components/contact.tsx`); Security 4 (header in four form components); IMPL phases only (gated per workstream) | Form components, calendar component, hero, etc. A0 may not edit any file in `components/`. | Per phase gate. Cleanup A: Q-14 owner answer. Security 4: optional. | A0 may not edit any file in `components/`. |
| `hooks/` | IMPL phases only (gated per workstream) | `useScrollReveal` and other hooks. A0 may not edit any file in `hooks/`. | Per phase gate. The first IMPL phase that edits `hooks/useScrollReveal.ts` is UIX0 / MOTION0 first slice (collapse duplicates; respect reduced-motion). | A0 may not edit any file in `hooks/`. |
| `lib/` | IMPL phases only (gated per workstream) | `lib/supabase.ts`, `lib/booking-actions.ts`, `lib/booking-schema.sql`, `lib/proposal-generator.ts`, `lib/animations/`, `lib/gsap.ts`. A0 may not edit any file in `lib/`. | Per phase gate. The first IMPL phase that edits `lib/proposal-generator.ts` is Security 1. The first IMPL phase that edits `lib/booking-actions.ts` is Security 3 or Booking A. The first IMPL phase that edits `lib/booking-schema.sql` is Security 3 or Booking A. The first IMPL phase that edits `lib/supabase.ts` is Security 2 or Admin future. The first IMPL phase that edits `lib/animations/` is UIX0 / MOTION0 first slice. | A0 may not edit any file in `lib/`. |
| `public/` | IMPL phases only (gated per workstream) | Static assets, `_headers`, `_redirects`. A0 may not edit any file in `public/`. | Per phase gate. | A0 may not edit any file in `public/`. |
| `public/_headers` | Security 1 (CSP update); Security 5 (CI guard); IMPL phases only (gated) | CSP enforcement at the edge. | Per phase gate. Security 1: D-019a confirmed. Security 5: requires Security 1 + CI. | A0 may not edit `public/_headers` in this phase. |
| `public/_redirects` | IMPL phases only (gated) | SPA fallback. | Per phase gate. | A0 may not edit `public/_redirects` in this phase. |
| `package.json` | Cleanup B (`packageManager` field only if pnpm); QA Slice 0 (script field only); QA Slice 1 / 2 / 3 (devDeps; gated per TS0 / RDG0 approval); TS0 setup (devDeps; gated per tool) | Package manifest. A0 may not edit `package.json` in this phase. | Per phase gate. Cleanup B: D-015 answered. QA Slice 0: config-only. QA Slice 1..3: per-tool TS0 / RDG0 approval. | A0 may not edit `package.json` in this phase. |
| `package-lock.json` | Cleanup B (drop only if npm is not chosen; here npm IS the default, so `package-lock.json` is the kept one); TS0 setup (regenerate only if a new devDep is added) | npm lockfile. The default keeps `package-lock.json` and drops `pnpm-lock.yaml`. | Per phase gate. | A0 may not edit `package-lock.json` in this phase. |
| `pnpm-lock.yaml` | Cleanup B (drop only) | pnpm lockfile. The default drops `pnpm-lock.yaml`. | Cleanup B: D-015 answered; `git status` clean before deletion. | A0 may not delete `pnpm-lock.yaml` in this phase. |
| `tsconfig.json` | IMPL phases only (gated) | TypeScript config. A0 may not edit `tsconfig.json` in this phase. | Per phase gate. | A0 may not edit `tsconfig.json` in this phase. |
| `next.config.*` | IMPL phases only (gated) | Next.js config. A0 may not edit `next.config.mjs` in this phase. | Per phase gate. | A0 may not edit `next.config.mjs` in this phase. |
| `postcss.config.*` | IMPL phases only (gated) | PostCSS config. A0 may not edit `postcss.config.mjs` in this phase. | Per phase gate. | A0 may not edit `postcss.config.mjs` in this phase. |
| eslint config | Cleanup A (new `eslint.config.mjs`); IMPL phases only (gated) | ESLint config. A0 may not edit any eslint config in this phase. | Cleanup A: config-only. | A0 may not edit any eslint config in this phase. |
| tailwind config | IMPL phases only (gated) | Tailwind config. A0 may not edit any tailwind config in this phase. | Per phase gate. | A0 may not edit any tailwind config in this phase. |
| `.github/` | QA Slice 0+ (gated) | GitHub config. A0 may not create any CI config file in this phase. | Per phase gate. QA Slice 0: config-only. | A0 may not create any `.github/` file in this phase. |
| `tests/` | QA Slice 1+ (gated) | Test files. A0 may not create any test file in this phase. | Per phase gate. QA Slice 1: per-tool TS0 / RDG0 approval. | A0 may not create any test file in this phase. |
| `.mcp.json` | TS0 setup only (gated per-tool approval) | MCP server config. A0 may not write or edit `.mcp.json` in this phase. | Per-tool TS0 / RDG0 approval. | A0 may not configure any MCP server in this phase. |
| `.opencode/` | TS0 setup only if the tool requires it (gated per-tool approval) | OpenCode config. A0 may not write or edit `.opencode/` in this phase. | Per-tool TS0 / RDG0 approval. | A0 may not touch `.opencode/` in this phase. |
| `.codex/` | TS0 setup only if the tool requires it (gated per-tool approval) | Codex config. A0 may not write or edit `.codex/` in this phase. | Per-tool TS0 / RDG0 approval. | A0 may not touch `.codex/` in this phase. |
| `.claude/` | TS0 setup only if the tool requires it (gated per-tool approval) | Claude config. A0 may not write or edit `.claude/` in this phase. | Per-tool TS0 / RDG0 approval. | A0 may not touch `.claude/` in this phase. |
| Worker source | Security 1; Booking B (gated) | Cloudflare Worker source (new). A0 may not create Worker source in this phase. | Per phase gate. Security 1: D-019a confirmed. Booking B: Booking A + Security 1. | A0 may not create Worker source in this phase. |
| Supabase SQL files (`lib/booking-schema.sql`) | Security 3; Booking A (re-seed script); Booking B (RPC); IMPL phases only (gated) | Booking schema and RPCs. A0 may not edit any Supabase SQL file in this phase. | Per phase gate. Security 3: D-020 confirmed. Booking A: D-019b confirmed. Booking B: Booking A + Security 1. | A0 may not edit any Supabase SQL file in this phase. |
| n8n workflow docs | Security 4; Observability (gated) | Out-of-repo; documented in `INTEGRATION_NOTES.md`. A0 may not edit any n8n workflow doc in this phase. | Per phase gate. | A0 may not edit any n8n workflow doc in this phase. |
| `.gitignore` | Setup (review only); Cleanup A (R-025 entry); Cleanup B (dropped lockfile); IMPL (rare; gated) | `.gitignore` review and updates. A0 may not edit `.gitignore` in this phase. | Per phase gate. | A0 may not edit `.gitignore` in this phase. |
| `.env*` | IMPL phases only (gated) | Environment files. A0 may not edit `.env*` in this phase. | Per phase gate. | A0 may not edit `.env*` in this phase. |
| `next-env.d.ts` | IMPL phases only (gated) | Next.js auto-generated type defs. A0 may not edit `next-env.d.ts` in this phase. | Per phase gate. | A0 may not edit `next-env.d.ts` in this phase. |
| `components.json` | IMPL phases only (gated) | shadcn config. A0 may not edit `components.json` in this phase. | Per phase gate. | A0 may not edit `components.json` in this phase. |

## Universal rules

- **No D0 before PM1 and PD1 pass.** D0 depends on PM1 review and PD1 review. D0 is already written; pending review.
- **No A0 before D0.** A0 depends on D0. A0 is already written; pending review.
- **No feature agents before A0.** IMPL phases depend on A0.
- **No package installs before TS0 / RDG0 approval.** TS0 setup is its own gated phase.
- **No UIX0 / MOTION0 implementation before PM1, D0, A0, and tooling decisions.** UIX0 / MOTION0 depends on PM1, D0, A0, and TS0 setup.
- **No lockfile deletion before Cleanup B.** Cleanup B is its own gated phase.
- **No README edits before Cleanup A.** Cleanup A is its own gated phase.
- **No security or booking fix before their respective gated phases.** Each is a separate phase with its own gate.
- **No D-011 / D-012 implementation outside an approved UIX0 / MOTION0 phase.** D-011 and D-012 are capture-only decisions until the UIX0 / MOTION0 first slice.
- **No copy / scrape / clone of `befluence.pro` or any reference site.** Reference only.
- **No install, clone, copy, configure, or evaluation of Ponytail before TS0 / RDG0 approval.** Ponytail is a candidate only; not approved; gated to TS0 / RDG0.
- **No install, clone, copy, configure, or evaluation of ECC / affaan-m/ecc before TS0 / RDG0 approval.** ECC is a candidate only; not approved; gated to TS0 / RDG0.
- **No git init or git-changing command in any pre-Setup phase.** Setup is its own gated phase; only Setup runs `git init`, and only after the owner confirms the repo root (Q-21 / D-027).
- **A phase does not start the next phase.** It stops and waits for ChatGPT Control Room.
- **No code, no installs, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install, no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `package.json` change in any pre-approval phase.**

## Carried-forward candidates (NOT APPROVED, gated to TS0 / RDG0)

- **Ponytail** — candidate only. NOT APPROVED. No install, no clone, no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install, in this batch or any pre-approval phase. Gated to TS0 / RDG0. Owner must provide the exact official GitHub repo URL, a pinned version, and a scope (global / per-project / reference-only; default: reference-only) before TS0 / RDG0 evaluation.
- **ECC / affaan-m/ecc** — candidate only. NOT APPROVED. No install, no clone, no `git clone`, no copy of config folders, no copy of `.opencode/`, `.codex/`, `.claude/`, `.mcp.json`, or any MCP configs; no `npx`, no `npm install`, no `pnpm install`, no `yarn install`, no `pip`, no `playwright` install, no package-manager command of any kind, no `package.json` change, no MCP config, no `.mcp.json` write, no `devDependencies` change, no global tool install in any pre-approval phase. Gated to TS0 / RDG0. Owner must provide the exact official GitHub repo URL, a pinned version, and a scope (global / per-project / reference-only; default: reference-only) before TS0 / RDG0 evaluation. The future TS0 / RDG0 submission must answer the ten evaluation questions in `docs/D0_ARCHITECTURE_DECISIONS.md` §11.
- **Impeccable** — not installed. D-012, D-024; gated to UIX0 / MOTION0 first slice.
- **Emil Kowalski / Agents with Taste** — not installed. D-012, D-024; gated to UIX0 / MOTION0 first slice.
- **Playwright MCP** — not configured. D-021, D-021a; gated to QA Slice 2 + UIX0 / MOTION0 first slice.
- **Chrome DevTools MCP** — not configured. D-021, D-021a; gated to QA Slice 2 + UIX0 / MOTION0 first slice.
- **Graphify** — not configured. D-021, D-023; gated to TS0 / RDG0.
- **Repomix** — not configured. D-021, D-023; gated to TS0 / RDG0.
- **Context7 MCP** — not configured. D-021, D-023; gated to TS0 / RDG0.
- **Tree-sitter** — not configured. D-021, D-023; gated to TS0 / RDG0 (optional).
- **codebase-memory MCP** — not configured. D-021, D-023; gated to TS0 / RDG0 (optional).
- **Sentry** — not installed. D-026; gated to Observability phase.
- **UptimeRobot** — not configured. D-026; gated to Observability phase.

## Carried-forward rules (memory and dev tooling)

- **Runtime memory (product-level):** out of scope. D-001.
- **Development memory (mandatory):** repo infrastructure. D-001. Continue to maintain.
- **npm canonical package manager (recommended default):** Cleanup B drops `pnpm-lock.yaml`; keeps `package-lock.json`. D-015.
- **BeFluence reference only:** D-022 (reaffirmed from D-011). No copy / scrape / clone.
- **Free / open-source first:** D-009. If a tool becomes paid, do not upgrade; find a free alternative.

## Safety confirmation (this file)

- This file is documentation only. No code, no installs, no config.
- No source / runtime / config files were modified to produce this file.
- This file lives in the allowed change zone (`repo-research/`).
- No Ponytail / ECC install / clone / copy / configure / evaluation.
- No git init.
- No `npx` or package manager command.
