# CodeOutfitters — Responsive QA (Production Server)

Server: `http://127.0.0.1:3999` (genuine `next start` production build, post-fix)
Chromium: 149.0.7827.55 (Playwright 1.61.1)
Viewports: 1440x1000 (desktop), 820x1180 (tablet), 390x844 (mobile)
Full raw data: `claude-code-final-browser-evidence/raw-results.json`

## Matrix result: 24/24 PASS

All 8 required routes × 3 viewports: HTTP 200, no horizontal overflow (`scrollWidth <= clientWidth`), zero console errors, zero failed requests, correct `<title>`.

| Route | Desktop | Tablet | Mobile |
|---|---|---|---|
| / | PASS | PASS | PASS |
| /services | PASS | PASS | PASS |
| /industries | PASS | PASS | PASS |
| /process | PASS | PASS | PASS |
| /about | PASS | PASS | PASS |
| /security | PASS | PASS | PASS |
| /case-studies | PASS | PASS | PASS |
| /contact | PASS | PASS | PASS |

## Obsolete routes (must 404): 3/3 PASS

| Route | HTTP Status | is404 |
|---|---|---|
| /pricing | 404 | true |
| /book | 404 | true |
| /portfolio | 404 | true |

Body confirms genuine Next.js not-found render ("Page not found... Maybe it was automated away."), not a generic proxy 404.

## Dev-server regression subset

Homepage confirmed live and serving correct title at `http://127.0.0.1:3005/` (dev, webpack mode per `next dev --port 3005 --webpack`). Used only as the tooling-availability check for this run; full matrix executed against production per spec.
