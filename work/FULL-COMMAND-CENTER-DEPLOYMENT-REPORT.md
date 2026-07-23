# Full Command Center — Deployment Report

## Result

- **Live URL:** https://codeoutfitters-command-center.vercel.app — PUBLISHED, all routes 200, public (no auth wall).
- **Deployment mode:** `PRODUCTION_DEMO_UI` (mock data, MSW, no backend).
- **Vercel project:** `codeoutfitters-command-center` = `prj_kWRbHrsmnKlNsWIzl8JrOXrxFXQl`, team `warhawk0097s-projects` = `team_grJz901hMVdksz6DwnzCiEei`.
- **Deployment id:** `dpl_DKgWmHkJUY9xxY6UdCp8fEtBu5LX` (readyState READY, target production).
- **Public marketing site untouched:** `codeoutfitters` = `prj_D8Z0xzQF8OWA0bsz0PGx7A8vYhrX` is a separate project; never targeted.

## How it was deployed

Source (cloud) build, not prebuilt. Deployed from `F:\CodeOutfitters\command-center` so the whole pnpm
workspace uploads (the web app imports sibling source packages `@command-center/contracts` and
`@command-center/ui` from `command-center/packages/`).

```
cd F:\CodeOutfitters\command-center
vercel link --yes --project codeoutfitters-command-center --scope warhawk0097s-projects
vercel deploy --prod --yes --scope warhawk0097s-projects
```

### Why source, not prebuilt

Local `vercel build` (`@vercel/next`) pins `outputFileTracingRoot` to `apps/web` and refuses to compile
files outside it — fatal here because the app imports sibling workspace packages as **source**. The cloud
build has no such constraint: only the `command-center` tree uploads (the outer marketing
`package-lock.json` at `F:\CodeOutfitters` is absent), so Turbopack's workspace root is unambiguous and the
sibling packages compile.

### Config that made it work

- `command-center/vercel.json` — legacy `builds` config targeting the app, since the CLI has no
  Root-Directory flag and the project's Root Directory could not be set non-interactively:
  ```json
  { "version": 2, "builds": [{ "src": "apps/web/package.json", "use": "@vercel/next" }] }
  ```
- `command-center/apps/web/vercel.json` — `{ "framework": "nextjs" }` (forces `@vercel/next`, not the
  zero-config static-build fallback that had produced an empty output).
- `command-center/apps/web/next.config.ts` — no `turbopack.root`; the local workspace-root warning is a
  local-disk artifact only (documented inline).
- Project env var `NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE=mock` (Production) — inlined at build so the MSW
  worker starts and `/api/leads` is served client-side.

## Verification (Microsoft Edge via Playwright, 2026-07-23)

- 10/10 routes 200, correct headings, correct active nav, 0 not-found, 0 console errors.
- `/leads`: service worker `mockServiceWorker.js` registered, `/api/leads?page=1&pageSize=10` → 200,
  10 demo rows render (first row: Dana Whitfield / Meridian Dental Group).
- Responsive: desktop / tablet / mobile all clean, no horizontal overflow.

## Local gates (pre-deploy)

- `pnpm -r typecheck` — clean, all 9 workspaces.
- `pnpm -r test` — 252 passed (19 files), web app.
- `pnpm --filter web lint` — 0 errors, 6 pre-existing warnings (incl. generated `mockServiceWorker.js`).
- Cloud build (the deployment) — succeeded, READY.

## Not done (out of scope, per brief)

- No production backend connected.
- No Gmail / external provider connected.
- Not merged to `main` (branch `feature/command-center-ui-complete` pushed only).
