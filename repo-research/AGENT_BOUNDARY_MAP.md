# AGENT BOUNDARY MAP

Complements `ai/AI_FILE_OWNERSHIP.md` with sharper agent-by-agent and risk-by-risk boundaries.

## 1. File Ownership Rules

- **Allowed zones** for any non-IMPL agent: `PROJECT_CONTROL_LOG.md`, `INTEGRATION_NOTES.md`, `docs/*.md`, `memory/*.md`, `ai/*.md`, `repo-research/*.md`.
- **Source / runtime zones**: `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`. Off-limits without Control Room approval.
- **Config zones**: `package.json`, both lockfiles, `tsconfig.json`, `next.config.*`, `postcss.config.*`, eslint configs, tailwind configs. Off-limits without Control Room approval.
- **Generated zones**: `.next/`, `out/`, `node_modules/`. Never committed, never modified directly.

## 2. Safe Docs / Memory Files

| File | Owner phase | Allowed to modify without approval |
|---|---|---|
| `PROJECT_CONTROL_LOG.md` | any | yes — append-only, never rewrite history |
| `INTEGRATION_NOTES.md` | any | yes — append/update |
| `docs/51_AGENT_HANDOFF_LOG.md` | any | yes — append-only |
| `docs/ARCHITECTURE.md` | DOC-MEMORY-REPAIR, PM1 | yes |
| `docs/SETUP.md` | DOC-MEMORY-REPAIR, PM1 | yes |
| `docs/ENVIRONMENT.md` | DOC-MEMORY-REPAIR, PM1, IMPL | yes for prose; lockfile change is out of band |
| `docs/DATABASE.md` | DOC-MEMORY-REPAIR, PM1, booking phase | yes for prose; SQL change is out of band |
| `docs/SECURITY.md` | DOC-MEMORY-REPAIR, security phase | yes for prose; any code change is out of band |
| `docs/FEATURES.md` | DOC-MEMORY-REPAIR, IMPL | yes |
| `docs/DEPLOYMENT.md` | DOC-MEMORY-REPAIR, IMPL | yes for prose; deploy config change is out of band |
| `docs/ROADMAP.md` | DOC-MEMORY-REPAIR, PM1, IMPL | yes |
| `docs/QA_CHECKLIST.md` | DOC-MEMORY-REPAIR, QA phase | yes for prose; adding test files is out of band |
| `memory/PROJECT_CONTEXT_PACK.md` | DOC-MEMORY-REPAIR, any | yes |
| `memory/WORKING_MEMORY.md` | any | yes |
| `memory/SEMANTIC_MEMORY.md` | DOC-MEMORY-REPAIR, IMPL | yes |
| `memory/EPISODIC_MEMORY.md` | any | yes — append-only |
| `memory/PROCEDURAL_MEMORY.md` | DOC-MEMORY-REPAIR, PM1 | yes |
| `memory/AGENT_IDENTITY_MEMORY.md` | DOC-MEMORY-REPAIR | yes |
| `memory/ACTIVE_TASK_CONTEXT.md` | any | yes |
| `memory/CURRENT_STATE.md` | any | yes |
| `memory/IMPORTANT_DECISIONS.md` | any | yes — append-only; older entries are not edited |
| `ai/AI_TASK_CAPSULE.md` | any | yes |
| `ai/AI_REPO_MAP.md` | DOC-MEMORY-REPAIR, IMPL | yes |
| `ai/AI_FILE_OWNERSHIP.md` | DOC-MEMORY-REPAIR, PM1 | yes |
| `ai/AI_CONTEXT_RULES.md` | DOC-MEMORY-REPAIR, PM1 | yes |
| `ai/AI_CONTRACTS.md` | DOC-MEMORY-REPAIR | yes |
| `repo-research/*.md` | any | yes |

## 3. Source Files Requiring Approval

Any file under:

- `app/**`
- `components/**`
- `hooks/**`
- `lib/**`
- `public/**` (except `_redirects` and `_headers` for CSP updates, which still need approval)
- `styles/**` (currently none in repo, but if added)
- `next-env.d.ts`

Affects risks: R-005, R-006, R-007, R-012, R-013, R-014, R-015, R-017, R-018, R-019, R-021, R-022, R-027, R-029, R-031, R-032, R-033, R-034, R-035.

## 4. Package / Config Files Requiring TS0 / RDG0

- `package.json`
- `package-lock.json`
- `pnpm-lock.yaml`
- `tsconfig.json`
- `next.config.mjs`
- `postcss.config.mjs`
- eslint configs
- tailwind configs
- `.env*`
- `public/_headers`
- `public/_redirects`
- `.gitignore`

Affects risks: R-001, R-002, R-008, R-009, R-011, R-016, R-020, R-025, R-026.

## 5. Security-Sensitive Files

- `app/admin/layout.tsx` — admin gate.
- `lib/proposal-generator.ts` — Anthropic client call.
- `next.config.mjs` — `output: 'export'` and image config.
- `public/_headers` — CSP.
- `lib/booking-schema.sql` — Supabase tables and (in the future) RLS.
- `lib/booking-actions.ts` — Supabase writes (will need server boundary in the future).
- `.env.local.example` — env var contract.
- Any file that holds an `NEXT_PUBLIC_*` secret.

Affects risks: R-001, R-002, R-003, R-004, R-006, R-016, R-018, R-020, R-029.

## 6. Booking-Sensitive Files

- `components/booking-calendar-custom.tsx`
- `lib/booking-actions.ts`
- `lib/booking-types.ts`
- `lib/booking-schema.sql`
- `lib/supabase.ts`

Affects risks: R-005, R-006, R-007, R-031.

## 7. Animation-Sensitive Files

- `components/hero.tsx`
- `components/gsap-provider.tsx`
- `components/aos-provider.tsx`
- `components/page-transition.tsx`
- `components/gradient-canvas.tsx`
- `components/animated-text.tsx`
- `components/animated-bg.tsx`
- `components/portfolio.tsx`
- `components/services.tsx`
- `components/process.tsx`
- `components/roi-calculator.tsx`
- `components/navbar.tsx`
- `components/scroll-progress.tsx`
- `components/announcement-bar.tsx`
- `components/floating-cta.tsx`
- `components/back-to-top.tsx`
- `components/tools-strip.tsx`
- `components/admin/**` (admin motion is lighter)
- `hooks/useGSAP.ts`
- `hooks/useScrollReveal.ts`
- `hooks/useParallaxFloat.ts`
- `lib/gsap.ts`
- `lib/animations/**`
- `package.json` (animation deps live here)

Affects risks: R-012, R-013, R-014, R-015, R-021, R-022.

## 8. Admin-Sensitive Files

- `app/admin/**`
- `components/admin/**`
- `lib/admin-types.ts`
- `lib/proposal-generator.ts`
- `.env.local.example` (admin password + Anthropic key)

Affects risks: R-001, R-002, R-003, R-004, R-018, R-029, R-032.

## 9. Never-Touch Without Approval List

Even when "in the allowed zone" the following actions always need explicit approval:

- Editing `package.json` (any field).
- Adding or removing a dependency.
- Editing either lockfile.
- Editing `tsconfig.json`.
- Editing `next.config.mjs`.
- Editing `postcss.config.mjs`.
- Editing `public/_headers` (CSP changes).
- Editing `public/_redirects` (SPA fallback changes).
- Editing any file under `app/`, `components/`, `hooks/`, `lib/`, `public/`, `styles/`.
- Running `npm install`, `pnpm install`, `yarn install`.
- Running `npx` of any kind.
- Running `npx skills add`, `npx impeccable install`.
- Configuring any MCP server.
- Generating new components via `npx shadcn-ui add` (or any shadcn CLI).
- Touching the `.gitignore` (so the lockfile-drop plan can add a clean entry).
- Deleting the legacy `DEPLOY.md` (proposed but not approved).
- Editing `README.md` (proposed but not approved).
- Generating new test files.
- Editing CI config (none exists yet).
