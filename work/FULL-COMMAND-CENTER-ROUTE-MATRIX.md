# Full Command Center — Route Matrix

Live: https://codeoutfitters-command-center.vercel.app
Verified in Microsoft Edge (`chromium.launch({ channel: "msedge" })` via Playwright), 2026-07-23.

| Route | HTTP | Heading | Active nav | Not-found | Notes |
|-------|------|---------|-----------|-----------|-------|
| `/` | 200 | — | — | no | Redirects to `/dashboard` |
| `/dashboard` | 200 | Dashboard | `/dashboard` | no | Overview (Phase 3 accepted) |
| `/leads` | 200 | Leads | `/leads` | no | 10 demo rows render via MSW `/api/leads` |
| `/pipeline` | 200 | Pipeline | `/pipeline` | no | Stage-window pager (deviation D-01) |
| `/appointments` | 200 | Appointments | `/appointments` | no | |
| `/meetings` | 200 | Meeting Intelligence | `/meetings` | no | |
| `/proposals` | 200 | Proposals | `/proposals` | no | |
| `/follow-ups` | 200 | Follow-ups | `/follow-ups` | no | |
| `/email-activity` | 200 | Email Activity | `/email-activity` | no | |
| `/team` | 200 | Team | `/team` | no | Member removal reassigns owned records |
| `/settings` | 200 | Settings | `/settings` | no | |

All 10 required routes plus `/` redirect: **PASS**. 0 broken routes. 0 console errors across all routes.
All routes prerender Static (`○`) under Next.js 16 App Router; client data hydrates from the MSW mock worker.
