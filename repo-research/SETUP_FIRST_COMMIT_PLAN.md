# SETUP FIRST COMMIT PLAN

**Project:** CodeOutfitters
**Phase:** A0 Setup (write-only; first commit OPTIONAL, not yet executed)
**Date:** 2026-06-16
**Author:** SETUP-AGENT

> **Status (updated 2026-06-16):** The first commit is now **OPTIONAL**, not a precondition for Cleanup A. The owner prefers one final clean commit at delivery. The plan in this file still exists; the owner may run the manual commands in §8 at any time, or defer all commits to final delivery. The agent does not commit on the owner's behalf. The agent does not push, does not add a remote, and does not create a GitHub repo. The full git push / commit policy is in `PROJECT_CONTROL_LOG.md` under "Git push / commit policy update (2026-06-16) — Control Room correction."

---

## 1. Purpose

This plan is the first safe commit plan for `F:\CodeOutfitters`. It exists so the owner (or a future SETUP-AGENT invocation) can land a clean, scoped first commit on the `main` branch without committing secrets, lockfiles-by-accident, sandbox runtime files, or local config.

The Setup phase is **not** the first commit. The Setup phase only **prepares** the first commit plan and verifies the root and `.gitignore`. The first commit itself is performed **only when the owner explicitly approves** the next Setup step (or when the next Setup-AGENT invocation is told to commit).

---

## 2. Git state at end of Setup phase

- Repo initialized at `F:\CodeOutfitters` with default branch `main`.
- No commits exist yet.
- All untracked files are listed by `git status`.
- `.gitignore` is repaired and extended (see §5).
- The first commit has **not** been created and is now **OPTIONAL**. The owner may run `git add` and `git commit` manually (for rollback safety or to land a baseline now), or defer all commits to final delivery. The agent does not commit on the owner's behalf. The agent does not push, does not add a remote, and does not create a GitHub repo.

---

## 3. Files and folders expected in the first commit

The first commit is a **snapshot of the current planning state** plus the working tree. It is **not** an implementation commit. Implementation commits belong to Cleanup A, Cleanup B, and the future IMPL phases.

The first commit should contain:

### 3.1 Repository configuration

- `.gitignore` (repaired in this phase; safe hygiene entries only)

### 3.2 Root docs (planning + deployment, no secrets)

- `README.md` (already on disk; surgical repair is Cleanup A — **do not modify in this phase**)
- `DEPLOY.md` (already on disk; delete is Cleanup A per Q-13 — **do not modify in this phase**)
- `INTEGRATION_NOTES.md` (additive §8 from A0 is on disk; no further changes in this phase)
- `PROJECT_CONTROL_LOG.md` (state file; updated with the Setup overlay in this phase)
- `package.json`, `package-lock.json`, `pnpm-lock.yaml` (kept as-is; **not** removed in this phase; lockfile cleanup is Cleanup B per D-015)
- `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `components.json`, `next-env.d.ts` (kept as-is; **not** modified in this phase)

### 3.3 Application source (snapshot only; no edits in this phase)

- `app/`
- `components/`
- `hooks/`
- `lib/`
- `public/`

### 3.4 Planning and state

- `docs/` (all planning docs produced in PM1, PD1, D0, A0; A0_ACTION_PLAN.md, A0 companion files, etc.)
- `memory/` (all state files updated by the planning batches and by the Setup phase)
- `ai/` (AI task capsule, AI context rules)
- `repo-research/` (all PM1 / PD1 / D0 / A0 supporting research; the new SETUP_FIRST_COMMIT_PLAN.md will be added in this phase)
- `docs/51_AGENT_HANDOFF_LOG.md` (handoff log; updated with the Setup entry in this phase)

### 3.5 Environment example

- `.env.local.example` (template only; no real secrets)

---

## 4. Files and folders that must NOT be committed

These are blocked from the first commit by `.gitignore`, by file-zone rules, or by safety. They appear in `git status` only as untracked or as ignored paths.

### 4.1 Ignored by `.gitignore` (added or repaired in this phase)

- `node_modules/`
- `.next/`
- `out/`
- `dist/`
- `build/`
- `.env`, `.env.local`, any `.env*.local`
- `.DS_Store`
- `__v0_runtime_loader.js`, `__v0_devtools.tsx`, `__v0_jsx-dev-runtime.ts`
- `.snowflake/`, `.v0-trash/`, `.vercel/`
- `.opencode/`
- `*.log`
- `logs/`
- `tsconfig.tsbuildinfo`

### 4.2 Sensitive files (must never be committed, even if they are untracked)

- Real `.env`, `.env.local`, `.env.production`, `.env.development` (the example `.env.local.example` is safe to commit)
- Any file containing Anthropic API keys, Supabase service-role keys, n8n webhook URLs with secrets, or admin passwords
- Any backup file, swap file, or editor temp file (e.g. `*.swp`, `*.bak`, `*~`)

### 4.3 Off-limits by file-zone rule (not in first commit by intent)

- `package.json` edits → Cleanup A or later
- `tsconfig.json` edits → not in any current phase
- `next.config.mjs`, `postcss.config.mjs`, `components.json`, eslint / tailwind configs → not in any current phase
- Lockfile deletion (`pnpm-lock.yaml` removal) → Cleanup B per D-015, owner-approved only
- `README.md` edits → Cleanup A
- `DEPLOY.md` deletion → Cleanup A per Q-13, owner-approved only

---

## 5. `.gitignore` review and changes

### 5.1 Entries checked

| Entry | Status before | Status after | Notes |
|---|---|---|---|
| `node_modules` | present (no trailing slash) | `node_modules/` (trailing slash added) | Pre-existing; normalized. |
| `.next/` | present | `.next/` | Pre-existing. |
| `out/` | present | `out/` | Pre-existing. |
| `dist/` | missing | `dist/` | **Added** — standard build output dir. |
| `build/` | missing | `build/` | **Added** — standard build output dir. |
| `.env` | present | `.env` | Pre-existing. |
| `.env.local` | present | `.env.local` | Pre-existing. |
| `.env*.local` | present | `.env*.local` | Pre-existing. |
| `tsconfig.tsbuildinfo` | missing | `tsconfig.tsbuildinfo` | **Added** — TypeScript incremental build artifact, exists at repo root. |
| `.DS_Store` | present but **corrupted** (concatenated with `node_modules` on the same line: `.DS_Storenode_modules`) | `.DS_Store` | **Repaired** — split the merged line. |
| `logs` / `*.log` | missing | `logs/`, `*.log` | **Added** — standard log hygiene. |
| `.opencode/` | present | `.opencode/` | Pre-existing. |
| v0 sandbox runtime | present | present | Pre-existing. |
| `.vercel/`, `.snowflake/`, `.v0-trash/` | present | present | Pre-existing. |

### 5.2 Entries NOT added (intentional)

- No broad patterns (e.g. `*.bak`, `*.tmp`, `*` wildcards) — these could hide source files.
- No `coverage/` — there is no test suite; the future QA phases may add it, and that decision belongs to TS0 / RDG0, not Setup.
- No `.idea/`, `.vscode/`, `.vs/` — these are operator-choice; A0 does not add them. The owner can add per-machine ignores to `~/.gitignore_global` or a later Setup step.
- No `pnpm-lock.yaml` ignore — Cleanup B is the only phase that may drop or ignore a lockfile (D-015). Setup must not pre-empt that decision.
- No `.mcp.json` ignore — there is no `.mcp.json` in the repo today. A0 / future phases must not pre-create it.

### 5.3 Corruption repair

The pre-existing line 15 read `.DS_Storenode_modules`, which was a join of `.DS_Store` and `node_modules`. The repaired file splits these into two lines: `.DS_Store` (line 18) and `node_modules/` (line 13). No other ignore entries were changed.

---

## 6. Git initialization

- `git init -b main` was run in this phase at `F:\CodeOutfitters`.
- Default branch is `main`.
- No commits have been created in this phase.
- The first commit is **OPTIONAL** and left for the owner (recommended), or for the next Setup-AGENT invocation if explicitly told to commit. Cleanup A does not require a baseline commit.
- No remote has been added. The remote is OPTIONAL and gated to final delivery approval.

---

## 7. Recommended first commit message (OPTIONAL)

The first commit is **OPTIONAL**, not a precondition for Cleanup A. If the owner chooses to land a baseline commit now (for rollback safety), the recommended message is:

```
chore(setup): initial repository snapshot at F:\CodeOutfitters

First safe commit for CodeOutfitters.

Setup phase (A0 setup) — write-only. This commit captures the
current repository state, including the planning docs produced
by PM1, PD1, D0, and A0.

Includes:
- .gitignore (repaired corruption on `.DS_Store`; added dist/,
  build/, tsconfig.tsbuildinfo, *.log, logs/)
- README.md (kept as-is; surgical repair is Cleanup A per A0 §5.2)
- DEPLOY.md (kept as-is; delete is Cleanup A per Q-13)
- INTEGRATION_NOTES.md (additive §8 from A0)
- PROJECT_CONTROL_LOG.md (Setup phase overlay added)
- package.json, package-lock.json, pnpm-lock.yaml (kept as-is;
  lockfile cleanup is Cleanup B per D-015)
- app/, components/, hooks/, lib/, public/ (snapshot only;
  no edits in this phase)
- docs/, memory/, ai/, repo-research/ (planning + state)
- .env.local.example (template only)

Not included (ignored or off-limits):
- node_modules/, .next/, out/, dist/, build/
- .env, .env.local, any .env*.local
- tsconfig.tsbuildinfo, *.log, logs/, .DS_Store
- .opencode/, v0 runtime files, .snowflake/, .v0-trash/, .vercel/

Source files: unchanged.
Config files: unchanged.
Lockfiles: unchanged.
Packages: not installed.
README / DEPLOY: unchanged.
Tests: not created.
CI: not created.

Note (2026-06-16): the first commit is OPTIONAL per the Control Room
correction. The owner may defer all commits to final delivery. The
agent does not commit on the owner's behalf. The agent does not push,
does not add a remote, and does not create a GitHub repo.
```

---

## 8. Commands the owner may run manually later (OPTIONAL)

All commands in this section are **OPTIONAL**. The first commit is not a precondition for Cleanup A. The owner may also defer all commits to final delivery. The agent does not run any of these commands without explicit owner approval per occurrence.

All commands assume the working directory is `F:\CodeOutfitters`. The owner runs these manually; SETUP-AGENT does not run them in this phase.

### 8.1 Inspect the working tree

```
git status
git rev-parse --show-toplevel
git check-ignore -v <path>       # confirm a file is ignored
```

### 8.2 Verify no secrets are about to be added

```
git status --porcelain
git diff --cached --name-only      # (after a dry-run add)
git ls-files --others --exclude-standard
```

### 8.3 Dry-run the first commit

```
git add -n .
```

The `-n` (dry-run) flag shows what `git add .` would stage, without staging anything. The owner should scan the list and confirm none of the items in §4 are present.

### 8.4 Create the first commit (only after owner approval; OPTIONAL)

```
git add .gitignore README.md DEPLOY.md INTEGRATION_NOTES.md PROJECT_CONTROL_LOG.md package.json package-lock.json pnpm-lock.yaml tsconfig.json next.config.mjs postcss.config.mjs components.json next-env.d.ts .env.local.example
git add app components hooks lib public
git add docs memory ai repo-research
git status
git commit -m "chore(setup): initial repository snapshot at F:\CodeOutfitters"
git log --oneline
```

The owner can scope `git add` more narrowly (e.g. add planning files first, app files second) if they want separate commits. The recommended shape above is **one commit** to keep the first commit clean and reversible. The owner may also choose to commit nothing now and to commit once at final delivery.

### 8.5 Verify after the first commit (if the owner chose to commit)

```
git log --oneline
git show --stat HEAD
git ls-files | head -50
```

Confirm the commit contains only the items in §3 and none of the items in §4.

### 8.6 What the agent will NOT do

- Will not run `git add`, `git commit`, `git push`, `git remote add`, `git fetch`, or `git pull` without explicit owner approval per occurrence.
- Will not push to a remote at any time, including final delivery, without explicit owner approval.
- Will not add a remote. The remote is gated to final delivery approval.
- Will not create a GitHub repo. The owner creates the GitHub repo at final delivery if and when the owner decides.
- Will not publish the code.

---

## 9. Reversibility

- If the first commit is created, it can be reverted with `git reset --soft HEAD~1` (keeps changes staged) or `git reset --hard HEAD~1` (destroys the commit and the working tree). Both are reversible only if the owner has not pushed to a remote.
- The first commit should **not** be pushed to a remote in this phase. Push to a remote (e.g. GitHub, Cloudflare Pages source) is gated to final delivery approval. The owner prefers one final clean push at delivery; no chunked pushes.
- The first commit does not modify any source, config, lockfile, or runtime file. It is a snapshot. The only "modification" is to `.gitignore` (repaired and extended per §5), which is itself a safe hygiene change.
- The owner may also choose to never create the first commit. In that case, reversibility is provided by the working tree itself (and by the owner's local snapshots if they have any). The agent does not push in any case.

---

## 10. Gates still blocked after the first commit

Even after the first commit lands, all of the following remain blocked until ChatGPT Control Room approves them individually:

- Cleanup A (README repair, DEPLOY.md delete, contact `source: "contact"`, tsbuildinfo ignore plan, eslint config plan)
- Cleanup B (lockfile drop per D-015)
- Security 1..5 (Worker proxy, admin auth, Supabase RLS, n8n per-form secret)
- Booking A / Booking B
- Observability (Sentry + UptimeRobot)
- QA Slice 0..3
- TS0 / RDG0 tooling approval
- UIX0 / MOTION0 planning + implementation
- Admin future
- Final QA / delivery
- Ponytail install / clone / configure / evaluate
- ECC / affaan-m/ecc install / clone / configure / evaluate
- All package installs
- All `package.json` edits outside approved phases
- All `README.md` edits outside Cleanup A
- All `DEPLOY.md` deletes outside Cleanup A

---

## 11. Safety confirmation

- No source files in `app/`, `components/`, `hooks/`, `lib/`, `public/` were modified in this phase.
- No config files (`tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `components.json`, eslint / tailwind configs) were modified in this phase.
- No lockfile (`package-lock.json`, `pnpm-lock.yaml`) was modified or deleted in this phase.
- No `package.json` was modified in this phase.
- No packages were installed in this phase.
- No tooling was configured in this phase.
- No MCP server was configured in this phase.
- No Ponytail or ECC / affaan-m/ecc install / clone / copy / configure / evaluation was performed in this phase.
- No README or DEPLOY edits in this phase.
- No test files were created in this phase.
- No CI files were created in this phase.
- Only `.gitignore` was modified (corruption repair + safe hygiene entries), and the new file `repo-research/SETUP_FIRST_COMMIT_PLAN.md` was created.
- Git was initialized (`git init -b main`) at the confirmed root `F:\CodeOutfitters`.
- No commits were created in this phase.
