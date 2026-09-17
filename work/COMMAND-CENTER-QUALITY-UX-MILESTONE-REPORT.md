# Command Center — Quality + UX Milestone Report

Branch `feat/leads-foundation-live`, worktree
`/srv/projects/CodeOutfitters-worktrees/leads-foundation`.
Supersedes the 2026-08-18 01:24 draft of this file (that draft was written while
Phase F scripts were still running, and its session was then lost to a power
interruption). All figures below are from the current tree.

## A. Recovery

- Branch: `feat/leads-foundation-live`.
- HEAD at resume: `8cf02b0` ("feat: restore live settings and refine copilot
  conversations"), parent `c8ac1f2` ("feat: harden live command center identity
  and copilot UX"), parent `612308f` (the pre-milestone baseline).
- Existing work recovered: **yes, nothing lost and nothing discarded.** The
  Phase B identity work, the Phase C `getDashboardContext()` fix and the Phase D
  Copilot launcher were all already committed in `c8ac1f2`/`8cf02b0`. Untracked
  work present before this session (`app/api/dashboard/meetings/`,
  `lib/meetings/`, `supabase/migrations/20260820000000_meetings_transcripts.sql`,
  the `scripts/.*.cjs` QA tooling) was left untouched. No reset, no stash, no
  checkout of tracked files.
- Processes restarted: **yes, all of them.** Nothing survived the interruption —
  no `next dev`, no `next start`, no listener on 3000/3005/3010, and the `/tmp`
  QA artifacts were gone. Rebuilt with `next build` and restarted
  `next start -p 3010 -H 127.0.0.1`. The only Playwright processes running were
  this session's MCP servers; nothing unrelated was killed.
- QA credential/user recovery method: `/tmp/codeoutfitters-qa-login.env` was
  missing. The existing temporary QA Auth user
  (`qa-automation+…@codeoutfitters.test`, id `29c488ef-…`) still existed, so **no
  duplicate account was created**. Its `workspace_memberships` row had been
  removed at some point, so it was re-inserted (workspace
  `3a01d0a9-a1dd-4712-9b47-c611cd4bf834`, role `member`, status `active`) and the
  password was reset. The password was generated inside a Python process, written
  straight to `/tmp/codeoutfitters-qa-login.env` (mode `600`, keys `QA_EMAIL` and
  `QA_PASSWORD`), and only the bcrypt hash left that process — the plaintext was
  never printed, logged, or passed on a command line. Login was then verified
  end-to-end through the app. SQL ran through the Supabase Management API with
  the CLI's already-present access token; no owner, no Google-authenticated QA
  member, no customer workspace and no Leads data were modified.
- `.env.local` present, names only (values never read or printed):
  `COMMAND_CENTER_MODE`, `AUTH_GOOGLE_ENABLED`, `NEXT_PUBLIC_SITE_URL`,
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
  `INTEGRATION_TOKEN_ENCRYPTION_KEY` (plus `VERCEL_OIDC_TOKEN`). All eight
  expected names present. The three non-secret values are as expected:
  `COMMAND_CENTER_MODE=live`, `AUTH_GOOGLE_ENABLED=true`,
  `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

## B. Hydration

Not re-investigated, per instruction. Prior classification stands:
`NEXT_DEV_TOOLING_REGRESSION` — Next 16.2.6 / React 19.2.7, reproduces only under
`next dev`, `next build` + `next start` hydrates correctly, production not
affected, no application code implicated, no dependency change recommended. All
QA in this report was run against a production build for exactly this reason.

## C. Dashboard completeness

Twelve implemented dashboard routes, all HTTP 200 in the production build, all
with zero console errors: `/dashboard`, `/dashboard/my-work`, `/dashboard/leads`,
`/dashboard/pipeline`, `/dashboard/appointments`, `/dashboard/meetings`,
`/dashboard/proposals`, `/dashboard/follow-ups`, `/dashboard/email-activity`,
`/dashboard/ai`, `/dashboard/team`, `/dashboard/settings`.

`/dashboard/integrations` — **disposition: route correctly does not exist.** It
is absent from the build manifest, there is no code or navigation reference to it
anywhere (`lib/command-center/ui/sidebar.tsx` has no such link), and the
integration backend
(`app/api/dashboard/integrations/connections/{,[id],connect,callback}`) is fully
consumed by `GoogleConnectionCard` inside `/dashboard/settings`. This is **not**
`MISSING_UI_FOR_EXISTING_BACKEND`: the backend's UI exists and is reachable. The
404 is correct behaviour for a URL that was never intended to exist. No fix made,
none needed.

## D. Performance

Method: `next build` + `next start -p 3010 -H 127.0.0.1`, direct Chromium via
Playwright, authenticated storage state. No `next dev` timing was used as
evidence.

**P1 found and fixed (committed in `c8ac1f2`): sequential remote round trips in
`getDashboardContext()`.** It awaited `workspace_memberships`, then `profiles` —
two dependent-in-code but independent-in-data Supabase calls on every
authenticated request, i.e. on the SSR layout *and* on every API route. Both
depend only on `user.id`, so they now run under one `Promise.all`.

BEFORE / AFTER (curl, 5 runs each, warm median):

| Endpoint | Before | After |
|---|---|---|
| `/api/dashboard/activity?limit=50` | ~1.10 s | ~0.84 s |
| `/api/dashboard/tasks` | ~1.27 s | ~0.99 s |
| `/api/leads?pageSize=200` | ~1.13 s | ~0.95 s |

Post-fix full sweep, current tree (wall clock to `networkidle`; TTFB 629–653 ms
on every route):

| Route | Wall | Route | Wall |
|---|---|---|---|
| `/dashboard` | 3327 ms | `/dashboard/follow-ups` | 2775 ms |
| `/dashboard/leads` | 2949 ms | `/dashboard/my-work` | 2902 ms |
| `/dashboard/pipeline` | 3009 ms | `/dashboard/proposals` | 2693 ms |
| `/dashboard/settings` | 2832 ms | `/dashboard/team` | 2703 ms |
| `/dashboard/ai` | 2663 ms | `/dashboard/meetings` | 5183 ms |
| `/dashboard/appointments` | 2729 ms | `/dashboard/email-activity` | 2822 ms |

`/dashboard` was 7368 ms before the Phase C dedup work and 5782 ms immediately
after it; it is 3327 ms now. The `/dashboard/meetings` outlier is a single
3353 ms RSC prefetch of `/dashboard/team` under sweep contention, not a property
of the route — its own TTFB was 639 ms.

The `DUPLICATE_REQUESTS` entries in the sweep are Next `<Link>` RSC prefetches of
the sidebar destinations (each sidebar target fetched twice: prefetch + payload).
That is framework prefetch behaviour, not an application N+1. Read paths were
checked for N+1 directly: `app/api/dashboard/tasks/route.ts` already parallelises
via `Promise.all` and batches profile lookups with a single `.in("id", userIds)`.

Remaining items are P2/P3 and were not changed: per-route
`/api/dashboard/saved-views` costs 620–680 ms, and JS transfer is 12–16 KB per
route (already small).

## E. Settings + completeness classification

| Area | Classification | Evidence |
|---|---|---|
| INTEGRATIONS (Calendar connections) | **LIVE** | `GoogleConnectionCard` drives the real `integrations/connections` API; connect/callback/disconnect all wired; OAuth provider behind `AUTH_GOOGLE_ENABLED`. |
| ACCOUNT (General) | **IMPLEMENTED_BUT_GATED** | Live viewer name/role are rendered from `getDashboardContext()` (not demo `CURRENT_USER`); secret fields render as `SecretFieldNotice`, never inputs. Persistence is honest: "Local preview only — account sync is not available yet." |
| WORKSPACE / Team and Permissions | **IMPLEMENTED_BUT_GATED** | Settings section is preview-only but links out to the real `/dashboard/team` surface ("Manage team members and roles →"). |
| SECURITY | **COMING_SOON** | Section renders with the same live-mode disclosure; no security backend behind it. Actual security controls live in RLS + route guards, not this panel. |
| BUSINESS PROFILE (General/Services) | **COMING_SOON** | Local-preview disclosure, no backend. |
| NOTIFICATIONS | **COMING_SOON** | Local-preview disclosure, no backend. |
| SCHEDULING (Appointments, Calendar prefs) | **COMING_SOON** for preferences; the Google calendar *connection* itself is LIVE (above). |
| COPILOT / AI | **BACKEND_NOT_IMPLEMENTED (honest)** | `/api/ai/copilot` returns HTTP 503 `configuration` with no provider configured; the UI surfaces "The assistant is unavailable right now. Try again shortly." and a "Read-only preview" badge. No fabricated turns. |

Fifteen settings sections render: Appearance, Calendar connections, General,
Services, Pipeline, Appointments, Email, Follow-ups, AI & Meeting Intelligence,
Proposal Settings, Notifications, Dashboard preferences, Team and Permissions,
Security, Data and Export. No raw error/exception text is exposed. Nothing was
stubbed or faked to fill a gap.

## F. Copilot (Phase D)

Verified against the production build:

- Floating trigger `aria-label="Open Copilot"`, fixed bottom-right, visible on
  every dashboard route and hidden on `/dashboard/ai` itself (count 0).
- Click (not hover) opens a `role="dialog" aria-modal="true"` right-side drawer;
  the underlying page stays visible.
- Focus moves to "Close Copilot" on open and returns to the trigger on close.
- Escape closes; backdrop click closes; body scroll is locked while open.
- Draft state survives client-side navigation between dashboard routes
  (mounted once in the shell, `hidden` toggled rather than unmounted).
- "Open full Copilot" links to `/dashboard/ai` and closes the drawer.
- Mobile (390×844): drawer is full-screen `{x:0,y:0,width:390,height:844}`, no
  collision with page actions.
- Zero console errors throughout.

## G. Browser QA (Phase F)

All against the production build on 127.0.0.1:3010.

- **AUTH.** Login as the authorized QA member → `/dashboard`. Sign out →
  `/login`, and a subsequent `/dashboard` request redirects to `/login`
  server-side. **Access-pending: a real defect was found and fixed — see below.**
- **IDENTITY.** Viewer email/name correct; no "Marc Bryce"/"Mark Bryce" anywhere
  on dashboard or settings; no cross-user identity.
- **DASHBOARD.** All 12 routes 200, zero console errors, zero page errors.
- **LEADS.** List → detail navigation, and on the detail page: contact name,
  company, stage/status ("Negotiation"), Pipeline, Next action, Activity and
  Attachments sections all present, and all persist across a fresh reload.
  (Two earlier "missing section" readings were script bugs, not product bugs:
  headings are CSS `uppercase` and `innerText` returns transformed text, so a
  case-sensitive match missed "ATTACHMENTS". Corrected and re-run clean. The
  deferred hosted stale-stage 409 was not retried, per instruction.)
- **INTEGRATIONS.** `/api/dashboard/integrations/connections` 200 when
  authorized, 401 when not; no `credential_ciphertext` and no `ciphertext` in any
  response.
- **SETTINGS.** All 15 sections walked; honest unavailable/preview states; no raw
  error text.
- **COPILOT.** As §F.
- **RESPONSIVE.** Desktop 1440×900, tablet 834×1194, mobile 390×844 — no
  horizontal overflow on `/dashboard` or `/dashboard/leads` at any width.
- **SECURITY.** See §I.

### P1 defect found and fixed: the shell rendered for a non-member

With the QA member's `workspace_memberships.status` flipped to `invited`, a
signed-in but unauthorized account still reached `/dashboard` and saw the full
Command Center shell — sidebar, rail badges ("12 new", "5 needing attention") and
the Overview KPI strip. No workspace data leaked (every data plane answered 401),
but the frame is composed of canonical fixtures and therefore renders convincing
numbers without ever touching the workspace, so the page *looked* like a
provisioned account.

Cause: `middleware.ts` gates on authentication only, and the routes that do gate
on membership do it inside `requireDashboardContext()` — which the overview,
leads, pipeline, settings … pages never call, because they are client-island
shells. The layout deliberately did not gate, on a stale premise that
`/access-pending` needed the shell; `/access-pending` in fact lives at
`app/access-pending`, outside this layout.

Fix (`app/dashboard/layout.tsx`): the layout already resolves
`getDashboardContext()` for viewer identity in live mode, so the guard costs no
extra query —

```tsx
if (config.live && !viewer) redirect("/access-pending");
```

Verified: with `status = 'invited'`, `/dashboard` now lands on `/access-pending`
showing "You are signed in as … but this account does not have access to a
CodeOutfitters workspace yet." Membership was restored to `active` immediately
afterwards and the full identity/security and Copilot suites were re-run clean.
Covered by `app/dashboard/shell-access-gate.test.ts`.

## H. Identity

Phase B was not redone; QA found no regression. Confirmed on the live build: the
sidebar/header show the authenticated viewer, the demo `CURRENT_USER` identity
does not appear in live mode, and there is no cross-user identity inheritance.

## I. Security

- Workspace isolation holds: the QA workspace's leads API returns only its own
  single lead.
- Non-active membership now cannot reach the dashboard shell (§G), and could
  never reach data: `/api/leads`, `/api/dashboard/tasks`,
  `/api/dashboard/activity`, `/api/dashboard/integrations/connections` all
  answered 401 for the `invited` account.
- No credential ciphertext in any integration response.
- No client-side secrets: page source contains no `GOOGLE_OAUTH_CLIENT_SECRET`,
  `INTEGRATION_TOKEN_ENCRYPTION_KEY`, `SUPABASE_SERVICE_ROLE` or
  `SUPABASE_ACCESS_TOKEN`.
- No demo record leakage in live mode; settings secret fields are notices, never
  inputs, so a secret can never be typed in or stored.
- `secure-check .` run on the final tree: **no finding in any file this milestone
  touched.** All 40 semgrep findings are in the vendored
  `CodeOutfitters homepage design Latest (4)/**/support.js` design-handoff copies;
  all 30 gitleaks filesystem hits are in gitignored artifacts (`.next/**`,
  `.env.local`), nothing committed; 30 Trivy HIGH/CRITICAL are dependency CVEs.
  Three gitleaks *history* hits are pre-existing test fixtures from June–July
  commits (`app/api/ai/copilot/copilot-route.test.ts` c35f9616,
  `lib/auth/live-auth.test.ts` 73c00561, `lib/supabase.ts` 395e5318) — disclosed,
  not suppressed; remediating them means history rewriting and secret rotation,
  which is a separate decision and outside this milestone's authority.
- **P2, not fixed, disclosed:** the sidebar rail badges are hardcoded canonical
  design constants (`lib/command-center/ui/sidebar.tsx`: Leads "12", My Work "5",
  Appointments "3" …), as is the Overview KPI strip. They render identical
  numbers in live mode regardless of the workspace's real contents. This is not a
  data leak — the values are static literals, not demo records — but it is
  misleading in live mode. Pre-existing, outside this milestone's stated scope,
  and wiring them to real counts is a feature change rather than a fix.

## J. Quality gates

Run against the final tree:

| Gate | Result |
|---|---|
| Targeted Vitest (`shell-access-gate`, `viewer-identity`, `sign-out`) | 3 files, 13 tests, **13 passed** |
| Full Vitest | **136 files, 2248 tests, 2248 passed, 0 failed, 0 skipped** |
| `tsc --noEmit` | **0 errors** |
| ESLint (changed files) | **0 problems** |
| ESLint (whole repo) | 68 errors / 86 warnings — of which **25 errors are in my own throwaway `scripts/.*.cjs` QA dotfiles**; 43 in app code, all pre-existing, none in any file this milestone touched |
| `next build` | **exit 0**, compiled successfully |

Baseline was 2193 total / 2165 pass / 28 skip. The suite is now 2248/2248 with
zero skips; the growth is prior committed work plus this session's new test. No
pglite parallel flakes appeared — the full run was clean on the first attempt, so
no isolation re-run was needed and nothing was suppressed.

## K. Files changed (this session)

- `app/dashboard/layout.tsx` — **modified**: `/access-pending` guard for a live
  viewer with no active membership (§G).
- `app/dashboard/shell-access-gate.test.ts` — **new**: regression test for it.
- `scripts/.access-pending-check.cjs`, `scripts/.access-pending-api-check.cjs` —
  **new** QA tooling (dotfiles, not shipped app code).
- `scripts/.lead-detail-check.cjs`, `scripts/.copilot-qa.cjs`,
  `scripts/.perf-prod.cjs` — QA script corrections (case-insensitive matching,
  assertion-stating log labels, `PERF_OUT` output path).
- `work/COMMAND-CENTER-QUALITY-UX-MILESTONE-REPORT.md` — this report.

Already committed before this session, in `c8ac1f2`/`8cf02b0`:
`lib/dashboard/server.ts` (Phase C `Promise.all`), `lib/identity/display-name.ts`
(Phase B), `components/command-center/copilot-launcher.tsx` and its test
(Phase D), `lib/data/leads.ts` / `lib/tasks/use-live-tasks.ts` (Phase C dedup),
settings live-mode work.

## L. Git status

Branch `feat/leads-foundation-live`, HEAD `8cf02b0`. Nothing committed, pushed or
deployed this session.

Modified: `app/dashboard/layout.tsx`.
Untracked: `app/dashboard/shell-access-gate.test.ts`,
`work/COMMAND-CENTER-QUALITY-UX-MILESTONE-REPORT.md`, the `scripts/.*.cjs` QA
tooling, plus pre-existing untracked work not authored here
(`app/api/dashboard/meetings/`, `lib/meetings/`,
`supabase/migrations/20260820000000_meetings_transcripts.sql`,
`..env.local.swp`).

## M. TEMP_QA_CLEANUP pending?

**YES.** Still to be removed when QA is finally finished:

- Supabase Auth user `29c488ef-dd31-4cd4-b38b-34e5a7a4223a`
  (`qa-automation+…@codeoutfitters.test`) and its membership in workspace
  `3a01d0a9-a1dd-4712-9b47-c611cd4bf834`.
- `/tmp/codeoutfitters-qa-login.env` (mode 600) and
  `/tmp/codeoutfitters-qa-storage-3010.json`.
- The synthetic QA lead `06b6a526-57c3-4c8f-9d60-c1cd19992781`
  ("QA Synthetic" / "QA Verification Co").
- The `scripts/.*.cjs` QA dotfiles, if they are not being kept.

Nothing was cleaned up, per instruction.

## N. Next action

**COMMAND_CENTER_QUALITY_READY_FOR_PREVIEW**

No P0 or P1 issues remain open: the one P1 found in this session (unauthorized
accounts reaching the dashboard shell) is fixed, tested and verified end to end.
The two disclosed items — the hardcoded sidebar/KPI counts in live mode (§I, P2)
and the ten demo-store-only dashboard sections with no backend to wire (§E) — are
pre-existing scope items, not regressions of this milestone. Not deployed, not
pushed.
