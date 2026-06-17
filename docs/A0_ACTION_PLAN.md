# A0 ACTION PLAN

> **Status:** A0 action / build plan package for ChatGPT Control Room. **Plan-only.** No code, no installs, no MCP setup, no lockfile edits, no `package.json` edits, no README edits, no security / booking fixes, no UIX0 / MOTION0 / TS0 / RDG0 / IMPL work started, no git init, no Ponytail install / clone / copy / configure / evaluation, no ECC / affaan-m/ecc install / clone / copy / configure / evaluation. A0 defines the exact future execution queue, but does not execute it.
>
> **Updated 2026-06-16 (Control Room correction):** first baseline commit is **OPTIONAL**, not a precondition for Cleanup A. **No remote, no push, no GitHub repo, no publish** — default to no remote until final delivery approval. PR-style review is replaced by **phase-stop review**. The Setup phase ran on 2026-06-16 and produced `repo-research/SETUP_FIRST_COMMIT_PLAN.md`; the first commit is left to the owner (or to a future Setup-AGENT invocation explicitly told to commit). The full policy is in `PROJECT_CONTROL_LOG.md` under "Git push / commit policy update (2026-06-16) — Control Room correction."
>
> **Phase:** A0 — Action / Build Plan.
>
> **Source materials:** `docs/PM1_PLAN.md`, `docs/PD1_DECISION_LOCK.md`, `docs/D0_ARCHITECTURE_DECISIONS.md`, `docs/D0_SYSTEM_DESIGN.md`, `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md`, `repo-research/PM1_PHASE_SEQUENCE.md`, `repo-research/PM1_DECISION_MATRIX.md`, `repo-research/PD1_OWNER_DECISION_BALLOT.md`, `repo-research/RISK_REGISTER.md`, `repo-research/README_REPAIR_SPEC.md`, `repo-research/LOCKFILE_DECISION_BRIEF.md`, `repo-research/SECURITY_HARDENING_BRIEF.md`, `repo-research/BOOKING_CORRECTNESS_BRIEF.md`, `repo-research/TOOLING_APPROVAL_BRIEF.md`, `repo-research/UIX0_MOTION0_BRIEF.md`, `repo-research/QA_STRATEGY_BRIEF.md`, `repo-research/FEATURE_TRACEABILITY_MATRIX.md`, `repo-research/AGENT_BOUNDARY_MAP.md`, `repo-research/OPEN_QUESTIONS.md`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`, all `memory/`, all `ai/`, `docs/51_AGENT_HANDOFF_LOG.md`.
>
> **Hard rules respected:** no code, no installs, no MCP setup, no lockfile deletes, no `package.json` edits, no README edits, no security fixes, no booking fixes, no git init, no CI config, no test file, no A0 implementation kickoff, no UIX0 / MOTION0 implementation, no TS0 / RDG0 tooling install, no **Ponytail** and no **ECC / affaan-m/ecc** install / clone / copy / configure / evaluation.
>
> **Companion files in this A0 batch:**
> - `repo-research/A0_PHASE_EXECUTION_QUEUE.md` — the future phase queue table.
> - `repo-research/A0_AGENT_ASSIGNMENT_MATRIX.md` — the future agent assignment table.
> - `repo-research/A0_CHANGE_ZONE_MAP.md` — the file-zone classification table.
> - `INTEGRATION_NOTES.md` — sequenced integration clarifications appended (Anthropic Worker path, n8n per-form secret, Supabase RLS, observability alert channel; additive, no breaking changes).

## Table of Contents

1. Purpose and scope
2. Current gate status
3. Approved assumptions carried forward (PM1 / PD1 / D0)
4. Plan-only discipline and the rule that A0 does not execute
5. Full future phase sequence (with description, allowed file zones, must-not-do, owner decisions, acceptance, rollback, stop points)
   5.1 Setup Phase
   5.2 Cleanup A
   5.3 Cleanup B
   5.4 Security Phase 1 (Worker proxy for Anthropic)
   5.5 Security Phase 2 (Admin auth)
   5.6 Security Phase 3 (Supabase RLS)
   5.7 Security Phase 4 (n8n per-form secret)
   5.8 Booking Phase A (MVP)
   5.9 Booking Phase B (Robust)
   5.10 Observability Phase
   5.11 QA Slice 0
   5.12 TS0 / RDG0 Tooling Approval Phase
   5.13 QA Slice 1
   5.14 QA Slice 2
   5.15 QA Slice 3
   5.16 UIX0 / MOTION0 Planning Phase
   5.17 UIX0 / MOTION0 Implementation Phase (first slice)
   5.18 UIX0 / MOTION0 Implementation Phase (later slices)
   5.19 Admin Future Phase
   5.20 Final QA / Delivery Phase
6. Control Room stop points
7. Hard rules reaffirmed
8. A0 acceptance criteria
9. Safety confirmation
10. Recommended next step
11. Appendix A — Cross-references
12. Appendix B — Files created in this batch
13. Appendix C — Files modified in this batch

---

## 1. Purpose and scope

A0 is the **action / build plan** phase between D0 and the first IMPL phase. A0 does not start IMPL. A0 only writes the concrete PR-by-PR, file-by-file, owner-decision-by-owner-decision plan for the future phases that D0 and PM1 / PD1 defined. A0 binds PM1, PD1, and D0 into a single executable queue.

**In scope for A0:**

- The full future phase sequence, with dependencies, allowed file zones, must-not-do lists, owner decisions, acceptance criteria, rollback posture, and Control Room stop points per phase.
- The future agent assignment matrix (one row per future agent, one column per responsibility).
- The file-zone change map (one row per file / zone, one column per phase that may touch it).
- Integration sequencing clarifications appended to `INTEGRATION_NOTES.md` (prose only; no breaking changes).
- Reflection of the D0 ECC addendum and the PD1 Ponytail candidate as future TS0 / RDG0 candidates only (NOT APPROVED; gated to TS0 / RDG0).
- Reflection of the existing PM1, PD1, and D0 outputs as the binding inputs. A0 does not add new decisions.

**Out of scope for A0:**

- Writing any source file under `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`.
- Editing any config file (`package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `components.json`, eslint / tailwind configs, either lockfile, `.env*`, `public/_headers`, `public/_redirects`).
- Installing or configuring any tooling, skill, MCP server, browser binary, or package (including Playwright, Playwright MCP, Chrome DevTools MCP, Graphify, Repomix, Context7 MCP, Tree-sitter, codebase-memory MCP, Impeccable, Emil Kowalski / Agents with Taste, **Ponytail**, **ECC / affaan-m/ecc**).
- Starting Cleanup A, Cleanup B, Setup, Security phases, Booking phases, Observability, QA / CI, UIX0 / MOTION0, Admin future, or Final QA / delivery.
- Initializing git or running any git-changing command.
- Editing `README.md` or deleting `DEPLOY.md` (root).
- Evaluating, installing, cloning, copying config from, or configuring **Ponytail** or **ECC / affaan-m/ecc** in any pre-approval phase.

A0 stops and waits for ChatGPT Control Room.

## 2. Current gate status

| Gate | Status |
|---|---|
| TS0 (tooling scope) | not requested |
| RDG0 (research / data gate) | not requested |
| PM1 (plan merged) | written; pending review |
| PD1 (decision lock) | written; pending review |
| D0 (design merged) | written; pending review |
| **A0 (action / build plan)** | **written; pending review (this batch)** |
| Coding / IMPL | blocked until A0 passes |
| Package install | blocked |
| Tooling install (Playwright / Playwright MCP / Chrome DevTools MCP / Graphify / Repomix / Context7 / Tree-sitter / codebase-memory / Impeccable / Emil Kowalski / Ponytail candidate / ECC candidate) | not approved |

## 3. Approved assumptions carried forward (PM1 / PD1 / D0)

A0 reflects these as binding inputs. Owner overrides, when received, are recorded in `memory/IMPORTANT_DECISIONS.md` under "PD1 lock-tags → Owner overrides" and in `memory/IMPORTANT_DECISIONS.md` "A0 reflection (2026-06-16) → Owner overrides" (new subsection appended in this batch). A0 does not add new D-IDs.

### 3.1 PM1 LOCKED DEFAULTS (D-015..D-027)

| D-ID | Topic | Status | A0 reflection |
|---|---|---|---|
| D-015 | Package manager = `npm` | LOCKED DEFAULT | Cleanup B drops `pnpm-lock.yaml`. |
| D-016 | Real business launch | LOCKED DEFAULT | Launch gates (LG-1..LG-10) gate any non-internal launch. |
| D-017 | Admin internal-only | LOCKED DEFAULT | Admin features phase stays internal-only. |
| D-018 | Security as launch gate | LOCKED DEFAULT | Security 1..5 all block launch. |
| D-019 | Booking correctness as launch gate | LOCKED DEFAULT | Booking A and Booking B block launch. |
| D-020 | Supabase RLS as launch gate | LOCKED DEFAULT | Security 3 closes LG-3. |
| D-021 | Motion priority (balanced with §8.7 budget) | LOCKED DEFAULT | UIX0 / MOTION0 first slice honors the budget. |
| D-022 | BeFluence reference only | LOCKED DEFAULT | No copy / scrape / clone. |
| D-023 | Tooling order per §7.2 | LOCKED DEFAULT | TS0 / RDG0 submission in the §7.2 order. |
| D-024 | Impeccable / Emil install scope = per-project, gated | LOCKED DEFAULT | Gated to UIX0 / MOTION0 first slice. |
| D-025 | Recent Proposals viewer: A now, B later | LOCKED DEFAULT | Admin future phase. |
| D-026 | Observability vendor = Sentry + UptimeRobot + email | LOCKED DEFAULT | Observability phase. |
| D-027 | Git / repo root status = `git init` at `F:\CodeOutfitters` in Setup phase (only if confirmed) | LOCKED DEFAULT | Setup phase. |

### 3.2 PD1-shadowed architectural-path options (NEEDS OWNER APPROVAL)

| ID | Question | A0 default reflection |
|---|---|---|
| D-019a | Anthropic protection path | Cloudflare Worker proxy (Security 1). |
| D-020a | Admin auth path | Cloudflare Access for fast internal protection; Supabase Auth / magic link if admin becomes productized (Security 2). |
| D-019b | Booking MVP write path | A first (UI reads `available_slots`), then C (n8n handles booking validation) (Booking A). |
| D-022a | Performance budget | Accept PM1 §8.7. |
| D-021a | Test runner form | Both: real Playwright runner + Playwright MCP / Chrome DevTools MCP for the visual QA loop. |
| D-021b | Observability vendor choice | Sentry + UptimeRobot. GlitchTip / Better Stack as fallback. |

### 3.3 PD1 bundled follow-up items (Q-13..Q-21) and the D0 ECC addendum (Q-22)

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

### 3.4 D0 architecture (binding inputs to A0)

A0 does not re-derive the architecture. A0 inherits the D0 trust-boundary contract, target architecture, security design, booking design, observability design, admin design, QA / CI design, tooling design, UIX0 / MOTION0 design, phase-boundary design, and integration contract register from `docs/D0_ARCHITECTURE_DECISIONS.md`, `docs/D0_SYSTEM_DESIGN.md`, and `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md`.

## 4. Plan-only discipline and the rule that A0 does not execute

A0 is the last planning phase. Every future phase below is **plan-only in A0**. A0 does not start any future phase. A0 does not write code, install a package, configure an MCP server, edit a config file, edit `README.md`, delete `DEPLOY.md`, initialize git, or evaluate **Ponytail** or **ECC / affaan-m/ecc**. A0 only documents the queue, the agent matrix, the change zones, and the integration sequencing.

Each future phase below carries the same hard rules:

- The phase does not start the next phase. It stops and waits for ChatGPT Control Room.
- The phase does not modify a file zone it does not own.
- The phase does not install a package or run a package manager without TS0 / RDG0 approval (for dev tooling) or owner approval (for runtime deps).
- The phase does not delete a lockfile outside Cleanup B.
- The phase does not edit `README.md` outside Cleanup A.
- The phase does not delete `DEPLOY.md` outside Cleanup A or Cleanup B (Cleanup A per Q-13).
- The phase does not run `git init` outside Setup (Setup is gated to Q-21 / D-027).
- The phase does not install / clone / copy / configure / evaluate **Ponytail** or **ECC / affaan-m/ecc** in any pre-approval phase.

## 5. Full future phase sequence

The 20 future phases below are the binding queue. Detailed file-zone, integration contract, and rollback posture per phase are in `repo-research/A0_PHASE_EXECUTION_QUEUE.md`. Per-agent responsibility, allowed files later, required inputs, and stop condition per agent are in `repo-research/A0_AGENT_ASSIGNMENT_MATRIX.md`. File-zone classification per phase is in `repo-research/A0_CHANGE_ZONE_MAP.md`.

### 5.1 Setup Phase

- **Future order:** 1 (parallel with TS0 / RDG0 submission; TS0 / RDG0 may not install until Setup confirms the root).
- **Owner / decision:** Q-21 / D-027 — confirm `F:\CodeOutfitters` is the real repo root. If yes, `git init`. If no, find the real root and re-run PM1 there. **First baseline commit is OPTIONAL, not a precondition for Cleanup A** (per the 2026-06-16 Control Room correction). **No remote, no push, no GitHub repo, no publish** — default to no remote until final delivery approval. PR-style review is replaced by **phase-stop review**.
- **Purpose:** confirm the real repo root. Decide whether to initialize git. Review `.gitignore`. Prepare first safe commit plan.
- **What it will do:** confirm root; `git init` (gated; already done in the Setup phase run on 2026-06-16); review `.gitignore` against current contents; **first commit is OPTIONAL** — the owner may commit now for rollback safety, or defer all commits to final delivery; the agent does not commit on the owner's behalf; no remote, no push, no GitHub repo, no publish; no source edits.
- **What it must not do:** run `git init` in A0 (A0 does not). Edit `.gitignore` in A0 (A0 does not). Start Cleanup A, Cleanup B, TS0 / RDG0, or any IMPL phase. Install / clone / configure / evaluate **Ponytail** or **ECC / affaan-m/ecc**. Run `git push`, `git remote add`, create a GitHub repo, or publish the code. Commit on the owner's behalf. Re-initialize git. Run `git add`, `git commit`, `git push`, `git remote add`, `git fetch`, or `git pull` without explicit owner approval per occurrence.
- **Allowed file zones (later, when the phase runs):** `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`, `.gitignore` (review only), `docs/`, `memory/`, `ai/`, `repo-research/`. If the first commit is created, it is a snapshot of the current state; it does not modify source files.
- **Required owner decision before start:** Q-21 / D-027 confirmed. First commit: OPTIONAL.
- **Acceptance criteria:** repo initialized at the confirmed root (or decision to defer logged); `.gitignore` reviewed; first commit plan exists in `repo-research/SETUP_FIRST_COMMIT_PLAN.md`; first commit itself is **OPTIONAL** (not required for Cleanup A); phase stops and waits for ChatGPT Control Room.
- **Rollback:** the first commit (if created) can be reverted with `git reset` (gated) if needed. No risk to source code because the first commit is a snapshot. If the first commit is never created, no rollback is needed for that step.
- **Control Room stop point:** mandatory stop after the first commit plan exists (already done in the Setup phase run on 2026-06-16), before any other phase may start. The first commit itself is OPTIONAL and is not a stop point. Subsequent phases (Cleanup A, Cleanup B, TS0 / RDG0, QA Slice 0, Observability) require the repo to be initialized (already done). They do not require a baseline commit. They use **phase-stop review** (the agent stops after each gated phase; the owner reviews; the owner decides whether to commit locally and whether to advance) instead of PR-style review. Cleanup B's "git status clean" rule is relaxed — the agent must not create commits to make `git status` clean.

### 5.2 Cleanup A

- **Future order:** 2 (after Setup; Q-13, Q-14 still open).
- **Owner / decision:** Q-13 (delete `DEPLOY.md` root), Q-14 (add `source: "contact"`).
- **Purpose:** README repair. `DEPLOY.md` cleanup. Portfolio copy truth fix. Contact form `source: "contact"` field. `tsconfig.tsbuildinfo` ignore plan. ESLint config plan if needed.
- **What it will do:** surgical README repair per `repo-research/README_REPAIR_SPEC.md`; delete `DEPLOY.md` (root) per Q-13; portfolio copy fix (R-019); add `source: "contact"` to `components/contact.tsx` (Q-14, one field); add `tsconfig.tsbuildinfo` to `.gitignore` (R-025); add minimal `eslint.config.mjs` (R-026).
- **What it must not do (in A0):** edit `README.md`, delete `DEPLOY.md`, edit source files. In the future phase itself, the same rules apply outside its allowed zones. The future phase may edit `README.md` (surgical repair only) and delete `DEPLOY.md` (per Q-13).
- **Allowed file zones (later):** `README.md` (surgical repair), `DEPLOY.md` (root; delete only), `app/(public)/portfolio/page.tsx` (copy only), `components/contact.tsx` (one field: `source: "contact"`), `.gitignore` (R-025 entry), `eslint.config.mjs` (new file; config-only), `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`.
- **Required owner decision before start:** Q-13, Q-14 answered.
- **Acceptance criteria:** R-001 (doc), R-019, R-023, R-025, R-026, R-027, R-034 closed in `repo-research/RISK_REGISTER.md`; README ≤ ~150 lines and reflects what the code actually does; DEPLOY.md is deleted (if Q-13 default stands); contact form sends `source: "contact"`; `.gitignore` includes `tsconfig.tsbuildinfo`; `eslint.config.mjs` extends `next/core-web-vitals` and runs cleanly.
- **Rollback:** revert the commit. README / DEPLOY.md / contact form / `.gitignore` / `eslint.config.mjs` are recoverable from git history once Setup initializes the repo.
- **Control Room stop point:** mandatory stop after each PR (or one PR if combined). Subsequent phases (Cleanup B, TS0 / RDG0, QA Slice 0, Observability) require Cleanup A completion.

### 5.3 Cleanup B

- **Future order:** 3 (after Cleanup A; D-015 still open).
- **Owner / decision:** D-015 — `npm` vs `pnpm` as canonical package manager.
- **Purpose:** lockfile cleanup. npm canonical decision. Remove `pnpm-lock.yaml` later if confirmed. Validate package manager workflow.
- **What it will do:** drop the chosen lockfile (D-015 default: `pnpm-lock.yaml`); add the dropped lockfile to `.gitignore`; update `docs/SETUP.md`, `docs/DEPLOYMENT.md`, and the repaired `README.md` to match the chosen manager; if pnpm is chosen, add `"packageManager": "pnpm@<version>"` to `package.json`; add a CI guard (in a future TS0 / RDG0 gated phase) that fails the build if the dropped lockfile reappears.
- **What it must not do (in A0):** delete either lockfile, edit `package.json` in a way that is not gated, run any package manager. In the future phase itself, it may delete the chosen lockfile (Cleanup B's only lockfile write) and add the `packageManager` field if pnpm is chosen.
- **Allowed file zones (later):** the dropped lockfile (delete only); `.gitignore` (add the dropped lockfile); `docs/SETUP.md`, `docs/DEPLOYMENT.md` (prose only); `README.md` (already repaired in Cleanup A; this phase only updates the package manager reference if needed); if pnpm, `package.json` (add `"packageManager"` field only; gated); `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`.
- **Required owner decision before start:** D-015 answered; `git status` must be clean before deletion.
- **Acceptance criteria:** exactly one lockfile at the repo root; the chosen manager's install command is documented in `README.md`, `docs/SETUP.md`, `docs/DEPLOYMENT.md`; the dropped lockfile is listed in `.gitignore`; a CI guard (added in TS0 setup) asserts the dropped lockfile is absent; Cloudflare Pages is configured to use the chosen manager's build command; R-002 (config) is moved to "Closed" with a date.
- **Rollback:** re-create the dropped lockfile (`npm install` or `pnpm install`); remove the `.gitignore` entry; remove the CI guard. Reversible, but multiple PRs.
- **Control Room stop point:** mandatory stop after the lockfile drop, the docs update, and the `package.json` `packageManager` change (if pnpm). The CI guard itself is added in a later TS0 / RDG0 gated phase.

### 5.4 Security Phase 1 (Worker proxy for Anthropic)

- **Future order:** 4 (after A0; Setup; Booking A may run ahead if the owner approves keeping the anon-key write path).
- **Owner / decision:** D-019a — Cloudflare Worker proxy.
- **Purpose:** Cloudflare Worker proxy for Anthropic proposal generation. Remove client-side Anthropic key from bundle later.
- **What it will do:** stand up a Cloudflare Worker; the admin UI calls the Worker (not `api.anthropic.com` directly); the Worker holds the Anthropic key as a server-side env var; `NEXT_PUBLIC_ANTHROPIC_API_KEY` is removed from the build output; CSP updated to include the Worker origin; `INTEGRATION_NOTES.md` §3 is updated to reflect the new contract.
- **What it must not do (in A0):** implement the Worker, edit proposal code, run any package manager, edit `next.config.mjs`, edit `tsconfig.json`. In the future phase itself, it may edit `lib/proposal-generator.ts`, the new Worker source, `public/_headers` (CSP update; gated), `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md` (move R-002, R-004 to "Closed"), `memory/`, `ai/`, `PROJECT_CONTROL_LOG.md`.
- **Allowed file zones (later):** `lib/proposal-generator.ts`, `app/admin/proposal/page.tsx` (only if the fetch URL changes here), new Worker source, `public/_headers` (CSP update; gated), `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `ai/`, `PROJECT_CONTROL_LOG.md`.
- **Required owner decision before start:** D-019a confirmed.
- **Acceptance criteria:** `NEXT_PUBLIC_ANTHROPIC_API_KEY` is not present in `out/`; the Worker is reachable from the deployed admin UI; the Anthropic key is not in any client-reachable file; R-002 and R-004 are moved to "Closed" with a date; a post-deploy smoke test verifies the Worker path.
- **Rollback:** revert the Worker route; revert `lib/proposal-generator.ts` to call Anthropic directly; restore `NEXT_PUBLIC_ANTHROPIC_API_KEY` (or rotate the key if the rollback is post-rotate). One PR.
- **Control Room stop point:** mandatory stop after the Worker ships and the smoke test passes, before Security 2 may start.

### 5.5 Security Phase 2 (Admin auth)

- **Future order:** 5 (after Security 1).
- **Owner / decision:** D-020a — Cloudflare Access for fast internal protection; Supabase Auth / magic link if admin becomes productized.
- **Purpose:** real admin auth path. Cloudflare Access fast path. Supabase Auth only if admin becomes productized.
- **What it will do:** replace the client-side `localStorage` password gate with a real auth flow. Fast path: Cloudflare Access (protected application in front of `/admin/*`). Productized path: Supabase Auth / magic link. Remove `NEXT_PUBLIC_ADMIN_PASSWORD` from the build output. `INTEGRATION_NOTES.md` §5 is updated.
- **What it must not do (in A0):** edit admin files, configure Cloudflare Access, configure Supabase Auth, edit any source file. In the future phase itself, it may edit `app/admin/layout.tsx`, `app/admin/page.tsx`, `lib/supabase.ts` (Auth; if Supabase Auth path is used), `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `ai/`, `PROJECT_CONTROL_LOG.md`. Cloudflare Access policy is set at the Cloudflare dashboard, not in the repo.
- **Allowed file zones (later):** `app/admin/layout.tsx`, `app/admin/page.tsx` (only if the dashboard depends on the auth shape), `lib/supabase.ts` (Auth; if Supabase Auth path is used), `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `ai/`, `PROJECT_CONTROL_LOG.md`. Cloudflare Access policy is set at the Cloudflare dashboard; A0 / Security 2 documents the policy intent.
- **Required owner decision before start:** D-020a confirmed.
- **Acceptance criteria:** `/admin` cannot be reached without a valid auth session (Access JWT or Supabase session); the static bundle does not contain `NEXT_PUBLIC_ADMIN_PASSWORD`; `localStorage.co_admin_auth` is not consulted; R-001, R-003, R-029 are moved to "Closed" with a date.
- **Rollback:** re-enable the password gate; restore `NEXT_PUBLIC_ADMIN_PASSWORD`. One PR.
- **Control Room stop point:** mandatory stop after the auth path ships and the smoke test passes, before Security 3 may start.

### 5.6 Security Phase 3 (Supabase RLS)

- **Future order:** 6 (after Security 1 or 2).
- **Owner / decision:** D-020 — Supabase RLS.
- **Purpose:** enable RLS on `bookings` and `available_slots`; deny anon direct read/write; controlled insert path (RPC or Worker-mediated).
- **What it will do:** `ENABLE ROW LEVEL SECURITY` on both tables; `anon` role `USING (false)` for both; explicit narrow grants for the `get_available_slots` and (post-Worker) `reserve_slot` RPCs; `service_role` retains full access (used by the Worker). `INTEGRATION_NOTES.md` §2 is updated.
- **What it must not do (in A0):** edit schema, edit Supabase code, run any Supabase migration, edit any source file. In the future phase itself, it may edit `lib/booking-schema.sql` (RLS policies, RPCs), `lib/booking-actions.ts` (RPC call shape, if changed), `docs/DATABASE.md`, `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Allowed file zones (later):** `lib/booking-schema.sql`, `lib/booking-actions.ts` (RPC call shape, if changed), `docs/DATABASE.md`, `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md`. Supabase dashboard settings (RLS is enabled in the SQL; the SQL is the source of truth).
- **Required owner decision before start:** D-020 confirmed; Supabase service-role key in the Worker (or available for the future Worker).
- **Acceptance criteria:** anon cannot read or write `bookings` / `available_slots` directly from the browser; a controlled insert path exists (RPC or Worker-mediated); a post-deploy smoke test verifies the deny; R-006 is moved to "Closed" with a date.
- **Rollback:** drop the policies; drop the RPCs. One SQL migration. Reversible.
- **Control Room stop point:** mandatory stop after RLS is enabled and the smoke test verifies the deny, before Booking B may start.

### 5.7 Security Phase 4 (n8n per-form secret)

- **Future order:** 7 (after Security 1 or 2).
- **Owner / decision:** optional — n8n signing is recommended but not gated.
- **Purpose:** per-form secret / header contract. Each form POSTs with a header containing the secret; n8n verifies.
- **What it will do:** add a per-form secret; each of the four forms POSTs with a header containing the secret; n8n workflow verifies the header against a workflow-level env var. `INTEGRATION_NOTES.md` §1 is updated.
- **What it must not do (in A0):** edit form components, edit n8n workflows, edit any source file. In the future phase itself, it may edit `components/quote-form.tsx`, `components/contact.tsx`, `components/booking-calendar-custom.tsx`, `components/newsletter.tsx` (add the header), the n8n workflow (out-of-repo; documented in `INTEGRATION_NOTES.md`), `INTEGRATION_NOTES.md`, `docs/SECURITY.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Allowed file zones (later):** `components/quote-form.tsx`, `components/contact.tsx`, `components/booking-calendar-custom.tsx`, `components/newsletter.tsx` (add the header), the n8n workflow (out-of-repo; documented in `INTEGRATION_NOTES.md`), `INTEGRATION_NOTES.md`, `docs/SECURITY.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Required owner decision before start:** n8n workflow is ready to accept the header (out-of-repo; documented).
- **Acceptance criteria:** an unsigned request to the n8n webhook is rejected or dropped; the n8n workflow has a verification node; R-017 is moved to "Closed" with a date.
- **Rollback:** remove the header from each form; n8n stops accepting. One PR + one n8n workflow change.
- **Control Room stop point:** mandatory stop after the header check is live in n8n and the unsigned-request test fails as expected.

### 5.8 Booking Phase A (MVP)

- **Future order:** 8 (after D0; A0; Setup). May run ahead of Security 2 if the owner approves keeping the anon-key write path.
- **Owner / decision:** D-019b — A first (UI reads `available_slots`, visually disable booked slots), then C (n8n handles booking validation).
- **Purpose:** UI reads available slots. Prevent visible double-booking. Clarify n8n booking flow. Confirm whether UI calls `createBooking`.
- **What it will do:** `components/booking-calendar-custom.tsx` calls `getAvailableSlots` for the displayed month; days with no remaining slots are visually disabled; times with `is_booked = true` are removed from the picker; the submission path is wired to `createBooking` (or a successor) and the UI shows success or failure honestly; graceful degradation when Supabase is unreachable; seed lifecycle addressed (re-seed script or scheduled function).
- **What it must not do (in A0):** edit booking files, edit `lib/booking-actions.ts`, edit `lib/booking-schema.sql`, run any Supabase migration, edit any source file. In the future phase itself, it may edit `components/booking-calendar-custom.tsx`, `lib/booking-actions.ts` (RPC or guarded insert/update; do not change the anon-key write path in a way that breaks the Worker plan), `lib/booking-schema.sql` (re-seed script, if scheduled-function path is chosen), `docs/DATABASE.md`, `docs/ARCHITECTURE.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Allowed file zones (later):** `components/booking-calendar-custom.tsx`, `lib/booking-actions.ts`, `lib/booking-schema.sql` (re-seed script, if scheduled-function path is chosen), `docs/DATABASE.md`, `docs/ARCHITECTURE.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Required owner decision before start:** D-019b confirmed; Booking A write path (A first, then C) confirmed.
- **Acceptance criteria:** the booking UI calls `getAvailableSlots` for the displayed month and visually disables unavailable dates and times; the booking submission persists to `bookings` and updates `available_slots.is_booked` through a single transactional path; two concurrent submissions for the same slot cannot both succeed (per the chosen path); the booking flow degrades gracefully when Supabase is unreachable; `components/booking-calendar-custom.tsx` and `lib/booking-actions.ts` are updated; the changes are reflected in `docs/DATABASE.md`, `docs/ARCHITECTURE.md`, and `repo-research/RISK_REGISTER.md`; a manual test confirms two simulated rapid submissions for the same slot result in exactly one `bookings` row and one `is_booked = true`; the seed lifecycle is solved (re-seed script or scheduled function), removing R-007 / R-031; R-005 is moved to "Closed" (UI honesty + MVP data path).
- **Rollback:** revert the calendar component; revert `lib/booking-actions.ts`. One PR.
- **Control Room stop point:** mandatory stop after the UI reads slots and the write path is wired honestly, before Booking B may start.

### 5.9 Booking Phase B (Robust)

- **Future order:** 9 (after Booking A; Security 1).
- **Owner / decision:** D-019b (robust path: B + D — `reserve_slot` RPC + Worker).
- **Purpose:** robust reservation path. RPC + Worker. Unique constraint / transactional reservation.
- **What it will do:** `reserve_slot(p_date, p_time, p_booking)` Postgres function in one transaction: check `is_booked = false`, insert into `bookings`, update `available_slots`; add `UNIQUE (preferred_date, preferred_time)` constraint on `bookings` as defense in depth; put the call behind the Worker (Worker holds the service-role key); signed event to n8n for downstream workflows.
- **What it must not do (in A0):** edit database, edit Worker files, run any Supabase migration, edit any source file. In the future phase itself, it may edit `lib/booking-schema.sql` (RPC, unique constraint), `lib/booking-actions.ts` (RPC call shape), the Worker source (or a follow-up to the Worker from Security 1), `docs/DATABASE.md`, `docs/ARCHITECTURE.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Allowed file zones (later):** `lib/booking-schema.sql`, `lib/booking-actions.ts`, Worker source, `docs/DATABASE.md`, `docs/ARCHITECTURE.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Required owner decision before start:** Worker is in place (Security 1); Booking A is shipped; D-019b robust path is confirmed.
- **Acceptance criteria:** two concurrent submissions for the same slot cannot both succeed (transactional guarantee); the Supabase anon key cannot write to `bookings` or `available_slots` directly (post-RLS); the booking flow degrades gracefully when Supabase is unreachable; the Worker can notify n8n via a signed event; R-005 is moved to "Closed" (full).
- **Rollback:** drop the RPC; drop the unique constraint; restore the anon-key path. One PR + one SQL migration. Reversible.
- **Control Room stop point:** mandatory stop after the RPC ships and the concurrent-submit test passes under load, before Admin features may run.

### 5.10 Observability Phase

- **Future order:** 10 (after Cleanup A; D-026 / D-021b still open). Can run in parallel with Cleanup B, TS0 / RDG0, QA Slice 0 once Cleanup A is in.
- **Owner / decision:** D-026 (observability vendor) and D-021b (Sentry + UptimeRobot).
- **Purpose:** Sentry candidate. UptimeRobot candidate. Email alerts. Webhook / booking / proposal failure visibility.
- **What it will do:** Sentry (errors, free tier) wire to `components/error-boundary.tsx`; UptimeRobot watches `/`, `/contact`, `/book` and alerts on 5xx or timeout; n8n delivery monitor (free; n8n already in stack); Sentry wrap on `lib/booking-actions.ts`; Sentry wrap on the proposal-generation path; owner channel = email to `hello@codeoutfitters.com` (Discord webhook fallback). `INTEGRATION_NOTES.md` gains a new "Observability" section.
- **What it must not do (in A0):** install Sentry, configure UptimeRobot, edit `components/error-boundary.tsx`, edit `lib/booking-actions.ts`, edit any source file. In the future phase itself, it may edit `components/error-boundary.tsx` (Sentry wire), `lib/booking-actions.ts` (Sentry wrap), new monitor scripts (e.g. a `scripts/seed-check.mjs` for the booking seed lifecycle), the n8n workflow (out-of-repo; documented in `INTEGRATION_NOTES.md`), `docs/SECURITY.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Allowed file zones (later):** `components/error-boundary.tsx` (Sentry wire), `lib/booking-actions.ts` (Sentry wrap), new monitor scripts, n8n workflow (out-of-repo; documented), `docs/SECURITY.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Required owner decision before start:** D-026, D-021b confirmed; owner channel picked.
- **Acceptance criteria:** a forced client-side error on the deployed site is reported to the chosen channel within 5 minutes; a forced 5xx is reported within 5 minutes; a forced webhook failure is reported within 5 minutes; a forced Supabase write failure is reported within 5 minutes; the static "All systems operational" badge becomes a live badge; R-010 and R-035 are moved to "Closed" with a date; `docs/SECURITY.md` and `INTEGRATION_NOTES.md` are updated.
- **Rollback:** remove the Sentry wire; remove the UptimeRobot checks; remove the n8n monitor workflow. One PR per wire.
- **Control Room stop point:** mandatory stop after each wire ships, before the next wire.

### 5.11 QA Slice 0

- **Future order:** 11 (after Cleanup A; parallel with Cleanup B, TS0 / RDG0, Observability).
- **Owner / decision:** none (config-only; no new deps).
- **Purpose:** Typecheck / lint plan. ESLint config plan. GitHub Actions plan.
- **What it will do:** add `typecheck` script (`tsc --noEmit`); confirm `eslint.config.mjs` (added in Cleanup A) is wired into CI; add GitHub Actions CI (`.github/workflows/ci.yml`) that runs `npm run typecheck` and `npm run lint` on every PR.
- **What it must not do (in A0):** create CI files, edit `package.json` (script field is allowed in the future phase), run any command. In the future phase itself, it may edit `package.json` (script field only; no new dep), `eslint.config.mjs` (already added in Cleanup A; QA Slice 0 confirms it is wired into CI), `.github/workflows/ci.yml` (new; CI config), `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`.
- **Allowed file zones (later):** `package.json` (script field only; no new dep), `eslint.config.mjs` (already added in Cleanup A; QA Slice 0 confirms wiring), `.github/workflows/ci.yml` (new; CI config), `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`.
- **Required owner decision before start:** none.
- **Acceptance criteria:** CI runs `npm run typecheck` and `npm run lint` on every PR; R-008 (partial) and R-009 are moved to "Closed" with a date; the CI workflow does not run any command that modifies the lockfile.
- **Rollback:** delete the workflow file; remove the `typecheck` script. One PR.
- **Control Room stop point:** mandatory stop after CI is green on a real PR, before QA Slice 1 may start.

### 5.12 TS0 / RDG0 Tooling Approval Phase

- **Future order:** 12 (after Cleanup A; PD1 + D0 + A0 pass). Submission is documentation-only. Each tool approved here may be installed in the follow-on TS0 setup phase.
- **Owner / decision:** per-tool owner approval; Ponytail and ECC are candidates only and require the extra owner input recorded in `docs/PD1_DECISION_LOCK.md` §6.1 and `docs/D0_ARCHITECTURE_DECISIONS.md` §11.
- **Purpose:** plan exact evaluation and approval process for Repomix, Graphify, Context7 MCP, Playwright MCP, Chrome DevTools MCP, Impeccable, Emil Kowalski / Agents with Taste, Tree-sitter, codebase-memory MCP, Ponytail, ECC / affaan-m/ecc.
- **What it will do:** write `repo-research/TS0_RDG0_REQUEST.md` (or split into 9+2 PRs) with one section per tool. For each tool, the request specifies:
  - Why it is wanted (use case with a concrete scenario in this repo).
  - Whether it is dev tooling or runtime.
  - Whether install is needed (and which kind: `devDependency`, `git clone`, MCP server config, global tool install, plugin install, copied config folder, repo dependency).
  - Which files it may touch later (`package.json` devDependencies, MCP config files, etc.).
  - Which gate must approve it (TS0 / RDG0; per-tool owner sign-off; ChatGPT Control Room).
  - What evidence is required before approval (free / open-source confirmation, supply-chain check, scope decision, overlap analysis, free-tier confirmation, no-runtime-impact confirmation, rollback plan).
  - Rollback plan (one PR per tool, so rollback is one revert).
  - Overlap risk (with existing candidates).
- **What it must not do (in A0):** install any tool, configure any MCP server, clone Ponytail or ECC, copy config files, edit `package.json`, run any `npx` or package manager. In the future phase itself, the submission is documentation-only; the submission is in `repo-research/`, `docs/`, `memory/`, `ai/`, `PROJECT_CONTROL_LOG.md`.
- **Allowed file zones (later):** `repo-research/TS0_RDG0_REQUEST.md` (new; or split into per-tool PRs), `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`.
- **Required owner decision before start:** none to submit; per-tool approval is the gate.
- **Acceptance criteria:** the submission exists; each tool has a section; Ponytail and ECC are recorded as candidates with the required owner-input questions; ChatGPT Control Room returns per-tool approve / repair / reject.
- **Rollback:** n/a (documentation only).
- **Control Room stop point:** mandatory stop after ChatGPT Control Room returns per-tool decisions, before TS0 setup may start.

### 5.13 QA Slice 1

- **Future order:** 13 (after TS0 setup; QA Slice 0).
- **Owner / decision:** D-021a — real Playwright runner + MCP.
- **Purpose:** real Playwright test runner later. CI runs the smoke spec on every PR and every deploy.
- **What it will do:** install Playwright as a real test runner in `devDependencies`; add `tests/smoke.spec.ts` that covers: home, services, pricing, contact, book (each step), admin gate, admin onboarding (each section), admin proposal (mocked). Mocks for Anthropic, n8n, Supabase (or a test Supabase project). CI runs the smoke spec.
- **What it must not do (in A0):** add tests, install Playwright, edit any source file, run any package manager. In the future phase itself, it may edit `package.json` (devDep; Playwright), `playwright.config.*` (new), `tests/` (new; smoke spec only), `.github/workflows/ci.yml` (add the Playwright job), `docs/QA_CHECKLIST.md`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Allowed file zones (later):** `package.json` (devDep; Playwright), `playwright.config.*` (new), `tests/` (new; smoke spec only), `.github/workflows/ci.yml` (add the Playwright job), `docs/QA_CHECKLIST.md`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Required owner decision before start:** D-021a confirmed; TS0 setup has installed Playwright (or the per-tool approval to install Playwright is given as part of TS0 / RDG0).
- **Acceptance criteria:** smoke passes on every PR; R-008 is moved to "Closed" (full) with a date; no mutating tests; smoke only.
- **Rollback:** remove the devDep; delete `tests/`; remove the CI job. One PR.
- **Control Room stop point:** mandatory stop after the smoke spec is green on a real PR, before QA Slice 2 may start.

### 5.14 QA Slice 2

- **Future order:** 14 (after QA Slice 1; TS0 setup).
- **Owner / decision:** D-021a (MCP form), D-022a (performance budget).
- **Purpose:** Lighthouse CI budgets. Playwright visual regression. Chrome DevTools MCP integration.
- **What it will do:** Lighthouse CI budgets for LCP, CLS, INP, TBT (captured in `repo-research/MOTION_QA_LOG.md`); Playwright visual regression (screenshots at 375 / 768 / 1024 / 1440) with a 1% pixel-delta gate; Chrome DevTools MCP integration for the visual review loop.
- **What it must not do (in A0):** add tests, install Playwright plugins, configure Lighthouse CI, configure Chrome DevTools MCP, edit any source file. In the future phase itself, it may edit `package.json` (devDeps; Lighthouse, Playwright plugins), `tests/` (visual regression specs), `.github/workflows/ci.yml` (Lighthouse job), `.lighthouserc.*` (new; budget config), `repo-research/`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Allowed file zones (later):** `package.json` (devDeps; Lighthouse, Playwright plugins), `tests/` (visual regression specs), `.github/workflows/ci.yml` (Lighthouse job), `.lighthouserc.*` (new; budget config), `repo-research/`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Required owner decision before start:** D-021a, D-022a confirmed; Chrome DevTools MCP approved in TS0 / RDG0.
- **Acceptance criteria:** Lighthouse budget enforced in CI; visual diff blocked on > 1% delta; R-013, R-014 (enforced budget), R-012 (taste review evidence) closed.
- **Rollback:** remove the devDeps; delete the spec files; remove the CI job. One PR.
- **Control Room stop point:** mandatory stop after the budget is enforced and the visual regression is green on a real PR, before UIX0 / MOTION0 first slice may start.

### 5.15 QA Slice 3

- **Future order:** 15 (after QA Slice 1; the feature phases — form, booking, admin).
- **Owner / decision:** D-021a.
- **Purpose:** form contract tests, booking flow tests, admin proposal flow tests, accessibility scan, bundle size guard.
- **What it will do:** form contract tests (n8n payload shape per form, no browser needed); booking flow tests (simulate concurrent submissions; assert exactly one `bookings` row); admin proposal flow tests (mock Anthropic; assert 11 sections render); accessibility scan with axe-core via Playwright; bundle size guard (size-limit or similar).
- **What it must not do (in A0):** add tests, install axe-core, install size-limit, edit any source file. In the future phase itself, it may edit `tests/` (new specs), `package.json` (devDeps; axe-core, size-limit), `.github/workflows/ci.yml` (new jobs), `repo-research/`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Allowed file zones (later):** `tests/` (new specs; mocks for Anthropic, n8n, Supabase), `package.json` (devDeps; axe-core, size-limit, etc.), `.github/workflows/ci.yml` (new jobs), `repo-research/`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Required owner decision before start:** D-021a confirmed; the feature phases (form, booking, admin) are in or ready.
- **Acceptance criteria:** all slice 3 tests pass on every PR; R-008 (full), R-015 (a11y), R-013 / R-014 (bundle size) closed; no flaky tests; mocks for Anthropic.
- **Rollback:** remove the devDeps; delete the spec files; remove the CI jobs. One PR.
- **Control Room stop point:** mandatory stop after the slice 3 tests are green on a real PR, before UIX0 / MOTION0 first slice may start.

### 5.16 UIX0 / MOTION0 Planning Phase

- **Future order:** 16 (after QA Slice 2; TS0 setup).
- **Owner / decision:** D-021 (motion priority), D-022a (performance budget), D-022 (BeFluence reference only), D-024 (Impeccable / Emil install scope), Q-17 (taste rubric).
- **Purpose:** convert D-011 and D-012 into a motion plan. Heavy premium agency-grade animations inspired by BeFluence reference only. Impeccable / Emil Kowalski review later. Performance budget. Reduced motion. Mobile rules. Admin lighter motion.
- **What it will do:** write the UIX0 / MOTION0 motion plan: motion inventory (in-scope / deferred), per-component animation spec, performance budget, reduced-motion coverage, mobile rules, admin motion discipline, taste rubric, browser review loop, Impeccable + Emil review at the end of the first slice.
- **What it must not do (in A0):** edit UI code, implement motion, install design skills, edit any source file. In the future phase itself, the plan is documentation-only; it lives in `docs/`, `repo-research/`, `memory/`, `ai/`, `PROJECT_CONTROL_LOG.md`.
- **Allowed file zones (later):** `docs/`, `repo-research/`, `memory/`, `ai/`, `PROJECT_CONTROL_LOG.md`.
- **Required owner decision before start:** D-021, D-022a, D-022, D-024, Q-17 confirmed.
- **Acceptance criteria:** the motion plan exists; per-component animation spec is approved; performance budget is locked; reduced-motion coverage is required; admin motion discipline is codified (≤ 200ms page transitions; no parallax, floating cards, marquees; no entrance animations that delay the user); Impeccable + Emil review is required at the end of the first slice.
- **Rollback:** n/a (documentation only).
- **Control Room stop point:** mandatory stop after the motion plan is approved, before the UIX0 / MOTION0 first slice may start.

### 5.17 UIX0 / MOTION0 Implementation Phase (first slice)

- **Future order:** 17 (after UIX0 / MOTION0 Planning Phase; QA Slice 2; TS0 setup).
- **Owner / decision:** D-021, D-022a, D-022, D-024, Q-17 (all confirmed in Planning).
- **Purpose:** first slice — hero, headline reveal, scroll reveals, ROI micro-interactions, reduced-motion coverage.
- **What it will do:** ship in one PR: hero entrance + animated headline reveal (GSAP or AOS); scroll-triggered section reveals (one canonical hook, replaces `useScrollReveal` duplicates, respects `prefers-reduced-motion`); ROI calculator micro-interactions (value-update animation, subtle "settle" on stop); reduced-motion coverage (AOS opt-out, GSAP opt-out, Framer Motion opt-out).
- **What it must not do (in A0):** edit UI code, implement motion, install design skills, run any package manager, add any animation libraries. In the future phase itself, it may edit `components/hero.tsx` (animation), `components/aos-provider.tsx` (reduced-motion opt-out), `hooks/useScrollReveal.ts` (collapse duplicates; respect reduced-motion), `components/roi-calculator.tsx` (micro-interactions), `lib/animations/` (collapse to one canonical setup; respect reduced-motion), `docs/FEATURES.md`, `docs/ARCHITECTURE.md`, `docs/QA_CHECKLIST.md`, `repo-research/MOTION_QA_LOG.md` (new), `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Allowed file zones (later):** `components/hero.tsx` (animation), `components/aos-provider.tsx` (reduced-motion opt-out), `hooks/useScrollReveal.ts` (collapse duplicates; respect reduced-motion), `components/roi-calculator.tsx` (micro-interactions), `lib/animations/` (collapse to one canonical setup; respect reduced-motion), `docs/FEATURES.md`, `docs/ARCHITECTURE.md`, `docs/QA_CHECKLIST.md`, `repo-research/MOTION_QA_LOG.md` (new), `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Required owner decision before start:** UIX0 / MOTION0 motion plan is approved.
- **Acceptance criteria:** hero entrance, animated headline, scroll-triggered section reveals, ROI micro-interactions, reduced-motion coverage ship together in one PR; LCP, CLS, and INP are within the agreed budget on a real device; the site passes `prefers-reduced-motion: reduce` testing in Chrome DevTools; Impeccable + Emil Kowalski review has been run, and the team can point to specific before / after; the duplicate GSAP and `useScrollReveal` paths are removed (or at least the unused ones are); `repo-research/MOTION_QA_LOG.md` captures the Lighthouse + reduced-motion + taste review; R-012, R-013 (partial), R-014, R-015, R-021 are moved to "Closed" with a date.
- **Rollback:** revert the PR. The site returns to the pre-slice state. One PR.
- **Control Room stop point:** mandatory stop after the first slice ships and the smoke test + taste review pass, before UIX0 / MOTION0 later slices may start.

### 5.18 UIX0 / MOTION0 Implementation Phase (later slices)

- **Future order:** 18 (after the first slice).
- **Owner / decision:** per-slice owner approval; D-022a (performance budget) reaffirmed.
- **Purpose:** parallax, magnetic buttons, portfolio motion depth, process timeline animation, contact / booking form transitions, marquee polish, animated statistics counters.
- **What it will do:** each slice is a separate PR; each PR may target a subset of the allowed file zones; each slice is benchmarked against the performance budget; Impeccable + Emil review at the end of each slice.
- **What it must not do (in A0):** edit UI code, implement motion, install design skills, run any package manager, add any animation libraries. In the future phase itself, it may edit `components/`, `hooks/`, `lib/animations/`, `docs/`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Allowed file zones (later):** `components/`, `hooks/`, `lib/animations/`, `docs/`, `memory/`, `PROJECT_CONTROL_LOG.md`. Each slice is a separate PR. Each PR may target a subset of these files.
- **Required owner decision before start:** per-slice owner approval.
- **Acceptance criteria:** each slice merges with budget met; taste review per slice; each slice is one PR; benchmarks per slice.
- **Rollback:** revert the PR for that slice. One PR per slice.
- **Control Room stop point:** mandatory stop after each slice ships, before the next slice.

### 5.19 Admin Future Phase

- **Future order:** 19 (after Security 2; Booking A; D-025 confirmed).
- **Owner / decision:** D-025 (Recent Proposals viewer: A first, B later).
- **Purpose:** Recent Proposals viewer. Proposal persistence. Better admin data model.
- **What it will do:** Option A: surface `localStorage.co_last_proposal` in the existing Recent Proposals tile; remove the "Coming soon" tag; no new persistence. Option B (post-Worker): persist proposals to Supabase / Worker + KV; list on the dashboard with click-through.
- **What it must not do (in A0):** edit admin files, edit `lib/proposal-generator.ts`, edit any source file. In the future phase itself, it may edit `app/admin/page.tsx` (list view), `app/admin/proposal/page.tsx` (persistence on generate), `components/admin/` (list component, if new), `lib/proposal-generator.ts` (if persistence changes the flow), `lib/supabase.ts` (proposals table; if Supabase path is chosen), `docs/ARCHITECTURE.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Allowed file zones (later):** `app/admin/page.tsx` (list view), `app/admin/proposal/page.tsx` (persistence on generate), `components/admin/` (list component, if new), `lib/proposal-generator.ts` (if persistence changes the flow), `lib/supabase.ts` (proposals table; if Supabase path is chosen), `docs/ARCHITECTURE.md`, `INTEGRATION_NOTES.md`, `repo-research/RISK_REGISTER.md`, `memory/`, `PROJECT_CONTROL_LOG.md`.
- **Required owner decision before start:** D-025 confirmed.
- **Acceptance criteria:** A: `localStorage.co_last_proposal` is shown in the tile; "Coming soon" tag is removed; no new persistence. B: proposals are persisted; the dashboard lists them; click-through works; R-018 (partial) is moved to "Closed" with a date.
- **Rollback:** revert the list view; revert the persistence write. One PR per change.
- **Control Room stop point:** mandatory stop after A (or B) ships, before the admin motion discipline work.

### 5.20 Final QA / Delivery Phase

- **Future order:** 20 (after all above; all launch gates green).
- **Owner / decision:** release approval.
- **Purpose:** full manual QA. Automated smoke. Deploy checklist. Cloudflare post-deploy checks.
- **What it will do:** full manual QA per `docs/QA_CHECKLIST.md`; full automated smoke (Playwright, Lighthouse, axe); deploy checklist per `docs/DEPLOYMENT.md`; Cloudflare post-deploy checks (CSP, redirects, headers, edge function health, observability alerts).
- **What it must not do (in A0):** deploy, run any production operation, edit any source file. In the future phase itself, the work is verification only; no new feature work.
- **Allowed file zones (later):** `docs/QA_CHECKLIST.md`, `docs/DEPLOYMENT.md`, `memory/EPISODIC_MEMORY.md`, `PROJECT_CONTROL_LOG.md`. Verification only — no new work.
- **Required owner decision before start:** all launch gates green; release approval.
- **Acceptance criteria:** all checks pass; release tagged; Cloudflare deployment is green; observability alerts are quiet for the first 24 hours.
- **Rollback:** n/a (verification only).
- **Control Room stop point:** mandatory stop after release; subsequent maintenance is outside the A0 queue.

## 6. Control Room stop points

A0 is gated to ChatGPT Control Room. The following are mandatory stop points:

1. **A0 itself:** after A0 writes its four primary deliverables and updates the required state files. A0 stops and waits for ChatGPT Control Room review of A0.
2. **Setup:** after the first commit plan exists (the Setup phase ran on 2026-06-16 and produced `repo-research/SETUP_FIRST_COMMIT_PLAN.md`), before any other phase may start. The first commit itself is **OPTIONAL** and is not a stop point (per the 2026-06-16 Control Room correction). Subsequent phases require the repo to be initialized (already done in the Setup phase run). PR-style review is replaced by **phase-stop review**.
3. **Cleanup A:** after each PR (or one PR if combined), before Cleanup B, TS0 / RDG0, QA Slice 0, or Observability may start.
4. **Cleanup B:** after the lockfile drop, the docs update, and the `package.json` `packageManager` change (if pnpm). The CI guard itself is added in a later TS0 / RDG0 gated phase.
5. **Security 1:** after the Worker ships and the smoke test passes, before Security 2 may start.
6. **Security 2:** after the auth path ships and the smoke test passes, before Security 3 may start.
7. **Security 3:** after RLS is enabled and the smoke test verifies the deny, before Booking B may start.
8. **Security 4:** after the header check is live in n8n and the unsigned-request test fails as expected.
9. **Booking A:** after the UI reads slots and the write path is wired honestly, before Booking B may start.
10. **Booking B:** after the RPC ships and the concurrent-submit test passes under load, before Admin features may run.
11. **Observability:** after each wire ships, before the next wire.
12. **QA Slice 0:** after CI is green on a real PR, before QA Slice 1 may start.
13. **TS0 / RDG0:** after ChatGPT Control Room returns per-tool decisions, before TS0 setup may start.
14. **QA Slice 1:** after the smoke spec is green on a real PR, before QA Slice 2 may start.
15. **QA Slice 2:** after the budget is enforced and the visual regression is green on a real PR, before UIX0 / MOTION0 first slice may start.
16. **QA Slice 3:** after the slice 3 tests are green on a real PR, before UIX0 / MOTION0 first slice may start.
17. **UIX0 / MOTION0 Planning:** after the motion plan is approved, before the first slice may start.
18. **UIX0 / MOTION0 first slice:** after the slice ships and the smoke test + taste review pass, before later slices may start.
19. **UIX0 / MOTION0 later slices:** after each slice ships, before the next slice.
20. **Admin future:** after A (or B) ships, before the admin motion discipline work.
21. **Final QA / delivery:** after release; subsequent maintenance is outside the A0 queue.

A phase does not start the next phase. It stops and waits for ChatGPT Control Room.

## 7. Hard rules reaffirmed

Every future phase above respects the following hard rules:

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

## 8. A0 acceptance criteria

A0 passes only if **all** of the following are true:

### 8.1 Deliverables

- [x] `docs/A0_ACTION_PLAN.md` (this file) exists, covers the current gate status, approved assumptions, full phase sequence, what each phase will do, what each phase must not do, required owner decisions, allowed file zones, acceptance criteria, rollback plans, and Control Room stop points.
- [x] `repo-research/A0_PHASE_EXECUTION_QUEUE.md` exists, covers the future phase queue table (Order, Phase, Purpose, Depends On, Allowed Files Later, Forbidden Now, Control Room Gate).
- [x] `repo-research/A0_AGENT_ASSIGNMENT_MATRIX.md` exists, covers the future agent assignment table (Agent, Future Phase, Responsibility, Allowed Files Later, Required Inputs, Stop Condition).
- [x] `repo-research/A0_CHANGE_ZONE_MAP.md` exists, covers the file-zone classification table (File / Zone, Phase Allowed, Why, Approval Required, Notes).
- [x] `PROJECT_CONTROL_LOG.md` is updated with the A0 batch overlay.
- [x] `memory/CURRENT_STATE.md` is updated to reflect A0 written; pending review.
- [x] `memory/ACTIVE_TASK_CONTEXT.md` is updated for the A0 phase.
- [x] `memory/WORKING_MEMORY.md` is updated with A0 plan summary, A0 reflection of PD1 LOCKED DEFAULTS, A0 reflection of architectural-path options, A0 reflection of bundled follow-up items, Ponytail carried forward, ECC carried forward, A0 readiness note.
- [x] `memory/EPISODIC_MEMORY.md` is updated with the A0 event.
- [x] `memory/IMPORTANT_DECISIONS.md` is updated with an A0 reflection note (no new decisions; existing D-IDs remain canonical; owner overrides table is seeded for A0).
- [x] `ai/AI_TASK_CAPSULE.md` is updated with the A0 phase line and reflection note.
- [x] `ai/AI_CONTEXT_RULES.md` is updated with the A0 hard rule and future-phase boundary note.
- [x] `docs/51_AGENT_HANDOFF_LOG.md` is appended to (not rewritten).
- [x] `INTEGRATION_NOTES.md` is updated with the A0 integration sequencing clarifications (additive only; no breaking changes; prose only).

### 8.2 Constraints

- [x] No source files in `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/` were modified.
- [x] No `package.json` edits.
- [x] No lockfile edits (neither `package-lock.json` nor `pnpm-lock.yaml`).
- [x] No `tsconfig.json` edits.
- [x] No `next.config.mjs`, `postcss.config.mjs`, `components.json` edits.
- [x] No `.env*` edits.
- [x] No `public/_headers` or `public/_redirects` edits.
- [x] No `README.md` edits.
- [x] No `DEPLOY.md` delete.
- [x] No `npm install` / `pnpm install` / `yarn install` / `npx` of any kind.
- [x] No MCP server configuration.
- [x] No skill install (`npx skills add`, `npx impeccable install`).
- [x] No git init / no git-changing commands.
- [x] No CI config file (`.github/`, etc.) created.
- [x] No test file created.
- [x] No A0 / UIX0 / MOTION0 / TS0 / RDG0 / IMPL work started.
- [x] No tooling installs.
- [x] No lockfile deletion.
- [x] **Ponytail** remains candidate only; not approved; not installed; not cloned; not configured; not copied; not added to `package.json`; not evaluated.
- [x] **ECC / affaan-m/ecc** remains candidate only; not approved; not installed; not cloned; not copied; not configured; not added to `package.json`; not added to `devDependencies`; not evaluated.

### 8.3 Plan quality

- [x] The A0 plan synthesizes PM1, PD1, D0, the strategy briefs, the risk register, the state files, and the existing docs.
- [x] The A0 plan reflects every PD1 LOCKED DEFAULT and every PD1-shadowed architectural-path option.
- [x] The A0 plan respects the hard rules (no code, no installs, no MCP, no lockfile edits, no `package.json`, no README, no security / booking fix, no D0 / A0 / UIX0 / MOTION0 / IMPL start, no git init, no Ponytail / ECC).
- [x] The A0 plan recommends whether IMPL may start (it may, if A0 is approved by ChatGPT Control Room).
- [x] The A0 plan names the future phases in order: Setup, Cleanup A, Cleanup B, Security 1, Security 2, Security 3, Security 4, Booking A, Booking B, Observability, QA Slice 0, TS0 / RDG0, QA Slice 1, QA Slice 2, QA Slice 3, UIX0 / MOTION0 Planning, UIX0 / MOTION0 first slice, UIX0 / MOTION0 later slices, Admin future, Final QA / delivery.
- [x] The A0 plan names the future agents: SETUP-AGENT, CLEANUP-A-AGENT, CLEANUP-B-AGENT, SECURITY-1-WORKER-AGENT, SECURITY-2-AUTH-AGENT, SECURITY-3-RLS-AGENT, SECURITY-4-N8N-AGENT, BOOKING-A-AGENT, BOOKING-B-AGENT, OBSERVABILITY-AGENT, QA0-AGENT, TS0-RDG0-TOOLING-AGENT, QA1-AGENT, QA2-AGENT, QA3-AGENT, UIX0-MOTION-PLAN-AGENT, UIX0-MOTION-IMPL-AGENT, ADMIN-FUTURE-AGENT, FINAL-QA-AGENT.
- [x] The A0 plan classifies the file / zone per phase: `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`, `README.md`, `DEPLOY.md`, `app/`, `components/`, `hooks/`, `lib/`, `public/`, `public/_headers`, `public/_redirects`, `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.*`, `postcss.config.*`, eslint config, tailwind config, `.github/`, `tests/`, `.mcp.json`, `.opencode/`, `.codex/`, `.claude/`, worker source, Supabase SQL files, n8n workflow docs.

### 8.4 Stop rule

- A0 stops. It does not start Setup, Cleanup A, Cleanup B, Security 1, Security 2, Security 3, Security 4, Booking A, Booking B, Observability, QA Slice 0, TS0 / RDG0, QA Slice 1, QA Slice 2, QA Slice 3, UIX0 / MOTION0 Planning, UIX0 / MOTION0 first slice, UIX0 / MOTION0 later slices, Admin future, or Final QA / delivery.
- A0 does not install anything.
- A0 does not configure any MCP server.
- A0 does not evaluate, install, clone, copy, or configure **Ponytail** or **ECC / affaan-m/ecc**.
- A0 waits for ChatGPT Control Room.

## 9. Safety confirmation

This A0 batch:

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
- Did not start Setup, Cleanup A, Cleanup B, Security 1, Security 2, Security 3, Security 4, Booking A, Booking B, Observability, QA Slice 0, TS0 / RDG0, QA Slice 1, QA Slice 2, QA Slice 3, UIX0 / MOTION0 Planning, UIX0 / MOTION0 first slice, UIX0 / MOTION0 later slices, Admin future, or Final QA / delivery.
- Only created or modified files inside the allowed change zones: `docs/`, `memory/`, `ai/`, `repo-research/`, `PROJECT_CONTROL_LOG.md`. `INTEGRATION_NOTES.md` was updated in this batch with the A0 integration sequencing clarifications (additive only; no breaking changes; prose only).

## 10. Recommended next step

ChatGPT Control Room should:

1. **Approve the A0 action plan** by returning Accept / Override / Defer per phase. The 20 future phases are listed in §5. The companion tables (`A0_PHASE_EXECUTION_QUEUE.md`, `A0_AGENT_ASSIGNMENT_MATRIX.md`, `A0_CHANGE_ZONE_MAP.md`) are the binding execution queue.
2. **Confirm the PM1 LOCKED DEFAULTS** (D-015..D-027) if not already locked, and the PD1-shadowed architectural-path options (D-019a, D-020a, D-019b, D-022a, D-021a, D-021b).
3. **Answer the bundled follow-up items** (Q-13..Q-21) and the D0 ECC addendum (Q-22) if not already answered.
4. **Authorize IMPL to start** against the accepted A0 plan, or request A0 repair.

If the owner chooses to override any default, the override must name:

- the phase / decision ID,
- the new choice,
- the rationale (one line is enough),
- any downstream decisions that the override frees or imposes.

A0 does not start IMPL. A0 does not code. A0 does not install. A0 does not configure tooling. A0 stops and waits for ChatGPT Control Room.

---

## Appendix A — Cross-references

- `docs/PM1_PLAN.md` — PM1 plan (14 workstreams).
- `docs/PD1_DECISION_LOCK.md` — PD1 decision-lock package and D0 readiness assessment.
- `docs/D0_ARCHITECTURE_DECISIONS.md` — D0 area-by-area decision table.
- `docs/D0_SYSTEM_DESIGN.md` — D0 target architecture, security, booking, observability, admin, QA / CI, tooling, UIX0 / MOTION0 design diagrams and contracts.
- `repo-research/D0_IMPLEMENTATION_BOUNDARIES.md` — D0 file-zone per phase, integration contract register, rollback posture per phase.
- `repo-research/PM1_PHASE_SEQUENCE.md` — 27 phases with gates, depends-on, file-ownership rules.
- `repo-research/PM1_DECISION_MATRIX.md` — D-15..D-27 detail.
- `repo-research/PD1_OWNER_DECISION_BALLOT.md` — one-row-per-decision ballot.
- `repo-research/A0_PHASE_EXECUTION_QUEUE.md` — the future phase queue table.
- `repo-research/A0_AGENT_ASSIGNMENT_MATRIX.md` — the future agent assignment table.
- `repo-research/A0_CHANGE_ZONE_MAP.md` — the file-zone classification table.
- `repo-research/RISK_REGISTER.md` — R-001..R-035.
- `repo-research/SECURITY_HARDENING_BRIEF.md` — security options A..E.
- `repo-research/BOOKING_CORRECTNESS_BRIEF.md` — booking options A..E.
- `repo-research/TOOLING_APPROVAL_BRIEF.md` — 9-tool matrix.
- `repo-research/UIX0_MOTION0_BRIEF.md` — first slice and budget.
- `repo-research/QA_STRATEGY_BRIEF.md` — QA strategy.
- `repo-research/FEATURE_TRACEABILITY_MATRIX.md` — feature-by-feature trace.
- `repo-research/AGENT_BOUNDARY_MAP.md` — file-zone ownership rules.
- `repo-research/OPEN_QUESTIONS.md` — Q-01..Q-20 (Q-13..Q-21 in PD1; Q-22 in D0 ECC addendum).
- `docs/ARCHITECTURE.md` — current architecture.
- `docs/SECURITY.md` — current security posture.
- `docs/DATABASE.md` — booking schema and RLS gap.
- `docs/FEATURES.md` — public + admin feature inventory.
- `docs/ROADMAP.md` — Phase 0..5 + 3.5.
- `docs/QA_CHECKLIST.md` — manual QA + future motion / taste QA.
- `docs/51_AGENT_HANDOFF_LOG.md` — phase ledger.
- `PROJECT_CONTROL_LOG.md` — phase ledger and gate status.
- `INTEGRATION_NOTES.md` — external service contracts (A0 appended integration sequencing clarifications).
- `memory/IMPORTANT_DECISIONS.md` — D-001..D-027 (A0 does not add new decisions; A0 reflection appended; owner overrides table seeded for A0).
- `memory/EPISODIC_MEMORY.md` — event log.
- `ai/AI_CONTEXT_RULES.md` — never-do list and phase discipline.
- `ai/AI_TASK_CAPSULE.md` — orientation.
- `ai/AI_FILE_OWNERSHIP.md` — file ownership rules.

## Appendix B — Files created in this batch

- `docs/A0_ACTION_PLAN.md` (this file; primary deliverable).
- `repo-research/A0_PHASE_EXECUTION_QUEUE.md` (the future phase queue table; primary deliverable).
- `repo-research/A0_AGENT_ASSIGNMENT_MATRIX.md` (the future agent assignment table; primary deliverable).
- `repo-research/A0_CHANGE_ZONE_MAP.md` (the file-zone classification table; primary deliverable).

## Appendix C — Files modified in this batch

- `PROJECT_CONTROL_LOG.md` (A0 batch overlay; "Current Phase" updated to A0; phase history row added; gate status row updated; tooling status section updated; D0 ECC addendum overlay reaffirmed).
- `memory/CURRENT_STATE.md` (snapshot updated to A0 written; pending review).
- `memory/ACTIVE_TASK_CONTEXT.md` (task replaced with A0 — Action / Build Plan; definition of done updated).
- `memory/WORKING_MEMORY.md` (A0 plan summary; PD1 LOCKED DEFAULTS reflection table; architectural-path options reflection; bundled follow-up items reflection; Ponytail carried forward; D0 ECC carried forward; A0 readiness note).
- `memory/EPISODIC_MEMORY.md` (A0 event appended).
- `memory/IMPORTANT_DECISIONS.md` (A0 reflection note appended; no new decisions; existing D-IDs remain canonical; "PD1 lock-tags → Owner overrides" table extended for A0; "A0 reflection (2026-06-16) → Owner overrides" subsection added).
- `ai/AI_TASK_CAPSULE.md` (phase line updated to A0; A0 reflection note in the owner-direction summary).
- `ai/AI_CONTEXT_RULES.md` (A0 hard rule added; future-phase boundary rule reaffirmed; tooling-candidate rules reaffirmed).
- `docs/51_AGENT_HANDOFF_LOG.md` (A0 entry appended).
- `INTEGRATION_NOTES.md` — **updated additively** with §8 "A0 integration sequencing clarifications" (prose only; no breaking changes; clarifies the Anthropic Worker path, the n8n per-form secret, the Supabase RLS strategy, the observability alert channel, the git / repo root setup contract, the Ponytail / ECC candidate status, the admin persistence contract, and the UIX0 / MOTION0 first-slice contract).
