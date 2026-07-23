# PUBLIC FRONTEND PROTECTION MAP
Purpose: make explicit what must never change while Command Center is built, and how isolation is enforced structurally, not just by instruction.

## Protected surface
- `F:\CodeOutfitters\app\(public)\*` — public marketing site routes.
- `F:\CodeOutfitters\components\*` (root-level, non-admin) — public site components (about-values, animated-bg, gsap-provider, live-chat, trust-bar, etc.).
- `F:\CodeOutfitters\lib\*` (root-level) — public site libs (booking-schema.sql, booking-types.ts, animations/*).
- `F:\CodeOutfitters\package.json`, `package-lock.json` — root npm manifest/lockfile.
- `F:\CodeOutfitters\out\*`, `F:\CodeOutfitters\public\*` — static export/public assets.
- Vercel project `codeoutfitters` (prj_D8Z0xzQF8OWA0bsz0PGx7A8vYhrX) — single existing deploy target.
- Baseline commit `e9ebbeed34e03be0e219f6579ea137eefe8f4f26` — current HEAD, unchanged by this task.

## Isolation mechanism (structural, per ADR-COMMAND-CENTER-LOCATION.md)
- `command-center/` is a sibling directory with its own `package.json` and `pnpm-workspace.yaml` — not nested inside the root app's dependency graph, so `npm install` at root never touches it and vice versa.
- No shared `node_modules` between root app and `command-center/`.
- No import statements cross the boundary in either direction: root app code never imports from `command-center/`, and `command-center/` never imports from root `app/`, `components/`, or `lib/`.
- Legacy `app/admin/*` stubs stay in the root app, untouched, per LEGACY-STUB-DISPOSITION.md — they are not moved into `command-center/` and not deleted.

## Explicitly out of scope for any Command Center phase
- Modifying `app/(public)/*` routes or their components.
- Modifying root `package.json`/`package-lock.json` to add Command Center dependencies.
- Modifying the existing Vercel project's build/deploy configuration.
- Deleting, moving, or redesigning `app/admin/*` stubs.
- Any change to DNS, domain, or the public site's Cloudflare configuration.

## Verification method for future phases
Before any phase that touches files under `F:\CodeOutfitters` (outside `command-center/` and `work/`), re-run: `git status --porcelain` scoped to root-level `app/`, `components/`, `lib/`, `package.json`, `package-lock.json` and confirm no unexpected diffs. A phase that shows changes in this protected surface without an explicit, separately-approved reason should be treated as a blocking anomaly, not silently committed.

## Status at Phase 0 closure
Public frontend confirmed unmodified. HEAD `e9ebbeed34e03be0e219f6579ea137eefe8f4f26` verified via `git rev-parse HEAD`. No files under the protected surface were touched by this task — only `work/*.md` documents were created or updated.
