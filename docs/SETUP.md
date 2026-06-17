# Setup

Local development for CodeOutfitters. The README is currently weak and partially wrong — this is the source of truth.

## Prerequisites

- Node.js 20 or newer (the deploy target is Cloudflare Pages, which uses Node 20).
- **Package manager: `npm`.** `npm` is the canonical package manager for this repo. The canonical lockfile is `package-lock.json`. The previous `pnpm-lock.yaml` was removed in the Cleanup B phase (2026-06-16) and is now listed in `.gitignore` so it cannot reappear accidentally. Do not run `pnpm install`. Do not mix package managers.
- A Supabase project (only required for the booking flow).
- An n8n instance with a webhook (only required for forms).
- An Anthropic API key (only required for the admin proposal generator).
- Optional: a Tawk.to property ID for live chat.

## Install

```bash
npm install
```

> Canonical lockfile is `package-lock.json`. `pnpm-lock.yaml` was removed in Cleanup B (2026-06-16) per D-015 and is listed in `.gitignore`. Do not run `pnpm install`; do not mix package managers.

## Environment

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

See `docs/ENVIRONMENT.md` for the full list and what each variable does.

## Run

```bash
npm run dev
```

The dev server starts on **port 3005** with the Webpack bundler. Open <http://localhost:3005>.

> The `README.md` says port 3000. That is wrong. Do not follow the README's port.

## Build

```bash
npm run build
```

The static export lands in `out/`. This folder is the deployable artifact.

## Lint

```bash
npm run lint
```

The script exists; the configuration file does not. ESLint will use its default config. If you need a real lint config, that is a future task.

## Common pitfalls

- **Port 3000** — the dev server uses 3005, not 3000.
- **`npm` is the only canonical package manager** (D-015; LOCKED DEFAULT). Do not run `pnpm install` or `yarn install`. Do not introduce a second lockfile. `pnpm-lock.yaml` is in `.gitignore` so it cannot return.
- **`NEXT_PUBLIC_*` env vars are inlined at build time.** Changing them requires a rebuild and a redeploy, not just a page refresh.
- **Supabase schema** — the booking page will not work until you run `lib/booking-schema.sql` in the Supabase SQL editor. See `docs/DATABASE.md`.
- **Admin password** — `/admin` will not unlock without `NEXT_PUBLIC_ADMIN_PASSWORD` set.
- **Anthropic key** — `/admin/proposal` will throw a clear error if `NEXT_PUBLIC_ANTHROPIC_API_KEY` is missing.

## Smoke test after install

1. `npm run dev`
2. Open <http://localhost:3005> — the home page should render.
3. Open <http://localhost:3005/pricing> — the quote form should appear.
4. Open <http://localhost:3005/book> — the calendar should appear (without slots if Supabase is not configured; the UI will still render).
5. Open <http://localhost:3005/admin> — the password gate should appear.

If any of those fail, see `docs/QA_CHECKLIST.md`.
