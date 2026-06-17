# README REPAIR SPEC

The current `README.md` is v0 boilerplate. It says port 3000; the dev script uses 3005. It points operators to `app/page.tsx`; the real entry is `app/(public)/page.tsx`. It treats `npm`, `yarn`, and `pnpm` as interchangeable even though the repo has dual lockfiles.

This spec is for a future agent to repair `README.md` after the owner approves the repair in a future phase. **Do not edit `README.md` in this batch.**

## 1. Current README Problems

- Title is `v0-codeoutfitters-website-build` (a v0 internal name) instead of the real product name.
- "Built with v0" section promotes the v0 tool; the project is now past v0 bootstrap.
- The v0 Kiro badge is in the README footer.
- "Getting Started" block is the v0 default.
- Port is wrong (3000 vs 3005).
- Three different package managers are offered without explaining the dual-lockfile problem.
- The "edit this file" hint points at `app/page.tsx`, but the real entry is `app/(public)/page.tsx`.
- "Learn More" links are generic v0 / Next.js / Kiro links with no project-specific guidance.
- No mention of the admin tool, the booking calendar, the n8n webhook, the Supabase schema, the Anthropic integration, or the security model.
- No link to the foundation docs.

## 2. Correct Project Description

CodeOutfitters is a US small-business AI automation agency website. The repo is a Next.js 16 app with `output: 'export'`, deployed to Cloudflare Pages. It serves the public marketing site (home, services, pricing, portfolio, about, contact, book, privacy, terms) and a single-operator internal admin tool (`/admin`) for client intake and AI proposal generation with Anthropic `claude-sonnet-4-6`.

## 3. Correct Local Setup Notes

- Prerequisites: Node.js 20 or newer. A package manager (the repo currently has `package-lock.json` and `pnpm-lock.yaml` both; pick one and stick with it).
- Install: `npm install` (or `pnpm install` if that is the canonical choice). Do not mix.
- Copy `.env.local.example` to `.env.local` and fill in real values. See `docs/ENVIRONMENT.md` for the full list.
- Run: `npm run dev` (or the equivalent for the chosen manager). The dev server starts on port 3005.
- Open `http://localhost:3005`.
- Build: `npm run build` produces a static export in `out/`.
- Lint: `npm run lint` — note: there is no ESLint config file in the repo yet; this is a known gap (R-026).
- See `docs/SETUP.md` for full details.

## 4. Correct Commands To Verify Later

After the repair, the README should direct operators to:

- `npm run dev` — start the dev server on port 3005
- `npm run build` — build the static export
- `npm run start` — serve the production build locally on port 3005
- `npm run lint` — run the linter (note the ESLint config gap)

It should not direct operators to:

- `http://localhost:3000` (wrong)
- `app/page.tsx` (wrong; the real entry is `app/(public)/page.tsx`)
- any yarn-only or pnpm-only command unless the lockfile decision is settled

## 5. Correct Environment Summary

Six env vars:

- `NEXT_PUBLIC_SUPABASE_URL` — required
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — required
- `NEXT_PUBLIC_N8N_WEBHOOK_URL` — required
- `NEXT_PUBLIC_ADMIN_PASSWORD` — required (and exposed client-side; see `docs/SECURITY.md` R-001 / R-003)
- `NEXT_PUBLIC_ANTHROPIC_API_KEY` — required (and exposed client-side; see R-002 / R-004)
- `NEXT_PUBLIC_TAWK_PROPERTY_ID` — optional

All are inlined at build time. See `docs/ENVIRONMENT.md` for the full table.

## 6. Correct Deployment Summary

- Target: Cloudflare Pages.
- Build command: `npm run build`.
- Build output directory: `out/`.
- Node version: 20.
- Set all six env vars in the Cloudflare dashboard for Production and Preview.
- Run `lib/booking-schema.sql` once in Supabase.
- See `docs/DEPLOYMENT.md` for the post-deploy checklist.

## 7. Admin Tool Warning

The admin tool at `/admin` is gated by a client-side password check against `NEXT_PUBLIC_ADMIN_PASSWORD`. This is **not a real auth boundary** — the password is in the static bundle. The gate is intended only to keep the admin out of casual view. See `docs/SECURITY.md` R-003.

The admin form data and the last generated proposal are stored in browser `localStorage`. If the browser is shared, the data is shared. See R-018.

## 8. Security Warning

This app is a static export. Every `NEXT_PUBLIC_*` env var is shipped in the JS bundle. The Anthropic API key and the admin password are both exposed. The site must not be considered secure until `repo-research/SECURITY_HARDENING_BRIEF.md` is implemented. See `docs/SECURITY.md` for the full risk list.

## 9. Proposed README Structure

A future agent can use this structure when repairing the README. Section names are mandatory; section order can be adjusted.

```markdown
# CodeOutfitters

> AI automation for US small businesses. Built with Next.js 16, deployed on Cloudflare Pages.

## What this is

One-paragraph product description (from §2 above).

## Local development

Three-step quick start: install, env, run. Point at port 3005.

## Available scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint` — note: ESLint config gap (R-026)

## Environment

Bullet list of the 6 env vars with required/optional. Link to `docs/ENVIRONMENT.md`.

## Deployment

Three-line Cloudflare summary. Link to `docs/DEPLOYMENT.md`.

## Admin tool

Short paragraph. Link to `docs/ARCHITECTURE.md` and the security warning below.

## Security

Two-paragraph warning. Link to `docs/SECURITY.md`. Do not downplay.

## Documentation

A short list of links to `docs/`, `memory/`, `ai/`, `repo-research/`. The reader should know where to look.

## License / owner

CodeOutfitters LLC. © year Tayyab. Internal-first; not currently open-source.

## Contributing

Out of scope right now. Single operator.

## Acknowledgments

Optional. Acknowledge v0, GSAP, Framer Motion, Supabase, n8n, Anthropic.
```

## 10. Acceptance Criteria For Future README Repair

A repaired `README.md` must:

1. Show the correct product name (`CodeOutfitters`) and a one-paragraph description (from §2).
2. Show port 3005, not 3000.
3. Show the real entry file (`app/(public)/page.tsx`), not `app/page.tsx`.
4. Match the chosen package manager (after R-002 is resolved).
5. List the six env vars with required/optional.
6. Mention the admin tool, the security warning, and the Supabase schema.
7. Link to `docs/SETUP.md`, `docs/DEPLOYMENT.md`, `docs/ENVIRONMENT.md`, `docs/SECURITY.md`, `docs/ARCHITECTURE.md`.
8. Drop the v0 Kiro badge and the v0 "Built with v0" section, or move it to a small "Acknowledgments" note.
9. Not over-promise. The README must reflect what the code actually does today.
10. Be no longer than ~150 lines of markdown.
