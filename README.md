# CodeOutfitters

> AI automation for US small businesses. Built with Next.js 16, deployed on Cloudflare Pages.

## What this is

CodeOutfitters is the website for a US small-business AI automation agency. The repo is a Next.js 16 app with `output: 'export'`, deployed to Cloudflare Pages. It serves the public marketing site (home, services, pricing, portfolio, about, contact, book, privacy, terms) and a single-operator internal admin tool (`/admin`) for client intake and AI proposal generation with Anthropic `claude-sonnet-4-6`.

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
- `npm run build` — produce the static export in `out/`.
- `npm run start` — serve the production build locally on port 3005.
- `npm run lint` — run the linter. **Note:** there is no ESLint config file in the repo yet (R-026). `eslint .` runs against ESLint's defaults until a config lands. See `docs/SETUP.md` for the full setup details.

## Environment

Six env vars are inlined into the static JS bundle at build time. See `docs/ENVIRONMENT.md` for the full table and per-form payload contracts.

| Var | Required? |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | yes |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | yes (exposed client-side — see Security) |
| `NEXT_PUBLIC_ANTHROPIC_API_KEY` | yes (exposed client-side — see Security) |
| `NEXT_PUBLIC_TAWK_PROPERTY_ID` | no |

## Deployment

Target: **Cloudflare Pages**. Build command: `npm run build`. Build output directory: `out/`. Node version: 20. Set all six env vars in the Cloudflare dashboard for Production and Preview. Run `lib/booking-schema.sql` once in the Supabase SQL editor. Full post-deploy checklist in `docs/DEPLOYMENT.md`.

## Admin tool

`/admin` is a single-operator internal tool for client intake and AI proposal generation. It is gated by a client-side password check against `NEXT_PUBLIC_ADMIN_PASSWORD` plus a `localStorage` flag. The last generated proposal is stored in `localStorage.co_last_proposal`. The gate is not a real access control — it only keeps the admin out of casual view. See `docs/ARCHITECTURE.md` and the Security section below.

## Security

This app is a static export. Every `NEXT_PUBLIC_*` env var is shipped in the JS bundle. The Anthropic API key and the admin password are both exposed. The site must not be considered secure until the Worker proxy, real admin auth, and Supabase RLS phases ship (see `repo-research/SECURITY_HARDENING_BRIEF.md` and `docs/SECURITY.md`). Until then: rotate keys regularly, monitor Anthropic usage, and assume the admin gate is public.

## Documentation

- `docs/SETUP.md` — local setup, prerequisites, common pitfalls.
- `docs/DEPLOYMENT.md` — Cloudflare Pages deploy, env vars, Supabase setup, post-deploy checklist, rollback.
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
