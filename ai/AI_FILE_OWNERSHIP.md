# AI File Ownership

Who can edit what. This is a guardrail, not a permission system. The repo does not enforce it; agents are expected to follow it.

## Owner: CodeOutfitters (human operator: Tayyab)

- Brand, copy, pricing, services, public messaging.
- Final sign-off on any release.

## Owner: Cloudflare Pages (deployment platform — external)

- `public/_headers`, `public/_redirects` reflect the Cloudflare model.
- Edits to deploy config must not break the static-export assumption.

## Owner: Each phase agent

| Phase | Owned files |
|---|---|
| DOC-DISCOVERY | No file writes. Produces a report only. |
| DOC-MEMORY-REPAIR | Creates files in `docs/`, `memory/`, `ai/`, `repo-research/`, and the three root files `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`, `docs/51_AGENT_HANDOFF_LOG.md`. **Does not** edit functional source files. |
| PM1 (Plan) | Edits `docs/ROADMAP.md` and `memory/IMPORTANT_DECISIONS.md` only. Appends to `docs/51_AGENT_HANDOFF_LOG.md`. |
| D0 (Design) | Adds design docs under `docs/`. No app code. |
| A0 (Architecture) | Adds architecture decisions to `docs/ARCHITECTURE.md` and `memory/IMPORTANT_DECISIONS.md`. No app code. |
| IMPL (Implementation) | Edits app code. Updates the relevant `docs/`, `memory/`, and `ai/` files to reflect what shipped. |

## Shared files (multiple owners must coordinate)

- `PROJECT_CONTROL_LOG.md` — phase ledger. Any agent may append a phase row. No agent rewrites history.
- `memory/CURRENT_STATE.md` — snapshot. Most-recent writer wins. Reconcile with `EPISODIC_MEMORY.md` if drift is detected.
- `memory/WORKING_MEMORY.md` — scratchpad. Each session updates it; outdated content is acceptable.
- `memory/IMPORTANT_DECISIONS.md` — decision ledger. Add new decisions; do not edit past ones without a new decision record.
- `docs/51_AGENT_HANDOFF_LOG.md` — append-only.
- `docs/ROADMAP.md` — PM1 owner; IMPL owner may move items from "Planned" to "Shipped" with a date.
- `docs/SECURITY.md` — DOC-MEMORY-REPAIR owner for initial creation; security-hardening phase owns future updates.
- `INTEGRATION_NOTES.md` — DOC-MEMORY-REPAIR owner for initial creation; IMPL owner updates when an integration changes.

## Off-limits to all agents without explicit approval

- `package.json` and both lockfiles
- `next.config.mjs`
- `tsconfig.json`
- `postcss.config.mjs`
- `app/**` and `components/**` during non-IMPL phases
- `lib/**` and `hooks/**` during non-IMPL phases
- `public/**` (except `_headers` / `_redirects`, which require explicit approval)
- Any `.env*` file
- Any git history rewrite

## Tooling-owned files (only when tooling is approved)

- `playwright.config.*` (when Playwright is approved)
- `.mcp.json` or equivalent (when MCP servers are approved)
- Tooling config in `package.json` devDependencies (only after install is approved)
- Any `.github/workflows/*` (when CI is approved)

## Overnight batch overlay

When an overnight batch is in flight (e.g. `OVERNIGHT-SAFE-PRE8-AND-PM1-PREP`), the agent may additionally create or modify files under `repo-research/`. The repo-research tree is a planning scratchpad. It is not promoted to canonical docs without PM1 review.
