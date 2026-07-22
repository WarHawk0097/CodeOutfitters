# REPO AUDIT — F:\CodeOutfitters
Scope: F:\CodeOutfitters only (not ai-delivery-system). Read-only, no writes to repo.

## Git state
- Branch: main, up to date with origin/main.
- HEAD / baseline commit e9ebbee (full: e9ebbeed34e03be0e219f6579ea137eefe8f4f26) VERIFIED via `git rev-parse HEAD`, re-confirmed at Phase 0 decision closure. Exists, HEAD, unchanged.
- Recent history: feat/fix commits for public-site parity (contact flow, homepage, testimonials) — confirms active development on public marketing site, separate from Command Center work.
- Untracked: many `CODEOUTFITTERS-*-REVIEW.zip` review bundles, `# CodeOutfitters Project*` folder/zip set, `$null` — pre-existing clutter, not created by this session, left alone.

## Stack
- Single Next.js 16.2.6 app at repo root (App Router: `app/`), React 19, Tailwind 4, npm (package-lock.json present) — no pnpm-workspace.yaml, no turborepo/nx, no `apps/` or `packages/` dir. Not a monorepo.
- Single Vercel project: `codeoutfitters` (prj_D8Z0xzQF8OWA0bsz0PGx7A8vYhrX, team_grJz901hMVdksz6DwnzCiEei) — one deploy target.
- No `app/api/` directory anywhere in repo — `POST /api/leads` (named in Command Center docs as integration surface) not yet built.

## Existing app/admin/ area
- `app/admin/layout.tsx`: client-side password gate marked explicitly "convenience-only," Cloudflare Access-protected in production per docs/SECURITY.md (R-001), docs/DEPLOYMENT.md.
- `app/admin/page.tsx`, `app/admin/onboarding/page.tsx` (`OnboardingForm`), `app/admin/proposal/page.tsx` (`ProposalOutputView`) — localStorage-only state, no backend/DB, different token palette, ~91 lines total.
- Conclusion: predecessor stub covering a subset of Command Center's Leads/Proposals scope, not mature infrastructure. Overlaps in intent (intake, proposal) but not in design authority, persistence, or code.

## Decision closure (per PHASE0-DECISION-CLOSURE.md)
Per TASK_ID CODEOUTFITTERS_PHASE0_DECISION_CLOSURE0: Command Center is built as a **separate, isolated workspace** at `F:\CodeOutfitters\command-center` (pnpm workspace: apps/web, apps/api, apps/worker + packages), NOT as an extension of `app/admin/`. The existing `app/admin/*` stub is classified LEGACY_NON_AUTHORITATIVE_STUBS (see work/LEGACY-STUB-DISPOSITION.md), preserved untouched, not reused without a written reuse audit. This supersedes the prior tentative "extend app/admin/" recommendation once DECISION 2 (NestJS/Fastify/Postgres/worker) made a single-Next.js-app model infeasible.

## No workspace/monorepo tooling in the public repo root
The public repo root still has no pnpm workspaces, Turborepo, or `apps/`/`packages/` layout, and none will be added there — the new workspace tooling lives entirely inside `command-center/`, isolated from the root's npm/package-lock.json setup.
