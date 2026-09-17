# CodeOutfitters

> AI automation for US small businesses. Built with Next.js 16.

## What this is

CodeOutfitters is the website and Command Center for a US small-business AI automation agency. It serves the public marketing site, authenticated live dashboard, secure proposals, Google integration foundation, and Meeting Capture extension.

### Current canonical status (2026-09-16)

The active production-readiness work is on `feat/leads-foundation-live` in
`/srv/projects/CodeOutfitters/.worktrees/leads-foundation`. The current app uses the
Next.js server runtime with live-mode dashboard routes and extension-auth/capture APIs;
the legacy static-export/Cloudflare and client-side-admin descriptions below are
historical and are not a production certification. Current public routes include home,
services, about, contact, book, case studies, privacy, terms, security, and public
proposal links. `/pricing` and `/portfolio` are not current routes.

Meeting Capture and extension authorization are verified locally. The current worktree
contains intentional uncommitted WIP; do not treat it as a release candidate until the
hosted schema, security, provider, preview, and exact-SHA release gates are complete.

## Local development

Prerequisites: Node.js 20 or newer. **The canonical package manager is `npm`; the canonical lockfile is `package-lock.json`.** The previous `pnpm-lock.yaml` was removed in the Cleanup B phase (2026-06-16) per D-015 and is now listed in `.gitignore` so it cannot reappear. Do not run `pnpm install` or `yarn install`. Do not mix package managers.

```bash
npm install
cp .env.local.example .env.local   # then fill in real values
npm run dev                        # dev server on port 3005
```

Open <http://localhost:3005>.

## Available scripts

- `npm run dev` — start the dev server on port 3005 (Webpack).
- `npm run build` — produce the optimized Next.js production build.
- `npm run start` — serve the production build locally on port 3005.
- `npm run lint` — run the configured ESLint checks.

## Environment

Public configuration and server-only secrets are configured separately. See `docs/ENVIRONMENT.md` and `.env.example` for the current variable inventory; never expose server-only secrets to client components.

| Var | Required? |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | required public configuration |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | required public configuration |
| `COMMAND_CENTER_MODE` | `live` for the production surface |
| `SUPABASE_SECRET_KEY` | required server-only secret |
| `MEETING_CAPTURE_TOKEN_SECRET` | required server-only secret for capture auth |
| `NEXT_PUBLIC_TAWK_PROPERTY_ID` | optional |

## Deployment

The active release target is the Next.js server runtime. The exact-SHA preview and production deployment gates are not complete for the current dirty worktree; do not deploy it. See `docs/RELEASE-READINESS.md` and `docs/DEPLOYMENT.md` for the gated handoff and historical deployment details.

## Admin tool

The legacy `/admin` client-side proposal tool is retained in the historical documentation below. The current protected product surface is the authenticated Command Center and secure proposal routes; do not treat client-side storage or a browser password gate as authorization.

## Security

The current app uses server-side auth and provider boundaries; service-role credentials must remain server-only, and public configuration must never be used as authorization. Security certification still requires the full security gate, hosted RLS verification, provider review, and exact-SHA release process. See `docs/SECURITY.md` and `docs/RELEASE-READINESS.md`.

## Documentation

- `docs/SETUP.md` — local setup, prerequisites, common pitfalls.
- `docs/DEPLOYMENT.md` — deployment history and environment/setup reference; use `docs/RELEASE-READINESS.md` for the current gated release process.
- `docs/ENVIRONMENT.md` — env var table, per-form payload contracts.
- `docs/ARCHITECTURE.md` — target architecture, surfaces, integrations.
- `docs/SECURITY.md` — known risks (R-001 to R-035).
- `docs/DATABASE.md` — Supabase schema, seed lifecycle.
- `docs/FEATURES.md` — feature inventory.
- `docs/QA_CHECKLIST.md` — pre-deploy QA.
- `repo-research/README_REPAIR_SPEC.md` — source of truth for this README.

## License / owner

CodeOutfitters LLC. © 2026 Tayyab. Internal-first; not currently open-source.

## Contributing

Out of scope right now. Single operator.

## Acknowledgments

Originally bootstrapped with v0. Built on Next.js 16, Supabase, n8n, Anthropic, GSAP, Framer Motion, AOS, Lenis, Tailwind. See `docs/ARCHITECTURE.md` for the full stack.
