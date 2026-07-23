# Command Center — Source Provenance Resolution

**Date:** 2026-07-23
**Authority:** Owner direct message §8 (resolve source contradiction before any build-from-frames).
**Method:** read-only git + filesystem + authed Vercel CLI. No writes, no reset, no checkout.

## Verdict

**My earlier preflight was WRONG.** I claimed "Command Center source absent, only scaffolding."
Cause: I ran `ls command-center/apps` (top dirs only) and saw `api/web/worker`, did not descend into
`apps/web/app`, and misread the empty `packages/database/src/schema.ts` (4 lines) as proof of a stub.
In fact the Command Center is a **complete, tracked, tested Next.js application**.

## Exact facts

- **Tracked state:** TRACKED. `git ls-files command-center` = **177 files**. Not ignored
  (`git check-ignore command-center` → no match). Not a nested repo (`command-center/.git` absent).
  Not a submodule. Not generated.
- **Source path:** `F:\CodeOutfitters\command-center\apps\web` (Next 16.2.6, React 19, name `@command-center/web`, dev port 3100).
- **Route tree (App Router, `(shell)` group):**
  dashboard, leads, pipeline, appointments, meetings, proposals, follow-ups, email-activity, team, settings.
  Plus root `page.tsx`, `layout.tsx`, `globals.css`.
- **Data layer:** contract-driven via `@command-center/contracts`. `lib/data/leads.ts` fetches `/api/leads`
  and validates with `LeadsListResponseSchema`. Two modes gated by `NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE`:
  `mock` (MSW handlers in `apps/web/mocks/handlers/{leads,auth,proposals,meetings,ai-and-crm,client}.ts`)
  vs real (`apps/api`). **No real route handlers exist yet** (`find … route.ts` = none). No real auth page
  (`app/(shell)` has no sign-in route; only `mocks/handlers/auth.ts`). No theme toggle route/control yet.
- **Commits building it (branch `feature/command-center-ui-complete`):**
  - `7df28b6` overview + leads baseline
  - `e22dd65` pipeline, appointments, meetings on shared demo store
  - `f768f5a` proposals, follow-ups, email-activity, team, settings
  - `61a9116` complete and publish full dashboard UI (Jul 23 05:53 +0500)
  - `0f65d2a` (HEAD) store-derived Lead-flow recharts chart; 271 web tests pass
- **Separate Vercel project:** `codeoutfitters-command-center` → https://codeoutfitters-command-center.vercel.app
  (org `warhawk0097s-projects`). Local link at `command-center/.vercel/project.json`
  (projectName `codeoutfitters-command-center`). Build: `apps/web/package.json` via `@vercel/next`.
- **Deployed commit:** last production deploy created Jul 23 05:41 +0500, i.e. **before** HEAD `0f65d2a`
  (06:59) and just before `61a9116` (05:53) — so the live deployment ≈ `61a9116` or its predecessor;
  HEAD `0f65d2a` (lead-flow chart) is **local-ahead, not yet deployed**. Exact deployed SHA not surfaced by
  `vercel inspect` (only timestamp); treat "HEAD is 1 commit ahead of prod" as the safe assumption.

## Consequences for this task

1. **Do NOT rebuild the dashboard from frames.** It exists and passes 271 tests. Owner §8 gate satisfied.
2. Command Center is **mock/demo-backed** (`lib/data` + MSW), which spec §22 forbids presenting as production.
   Integration work = provide **real** `/api/leads`, `/api/leads/[id]` (+PATCH) backed by Supabase and flip
   `NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE` off mock. The contract layer already exists to swap into.
3. Missing pieces confirmed absent (to build): real backend route handlers, sign-in page, Light/Dark/System
   theme control, Settings→Appearance, and the real ingestion path from the marketing `/api/inquiries`.
4. Multi-zone: marketing app (root, project `codeoutfitters`) must expose `/dashboard/*` via Vercel rewrite to
   the `codeoutfitters-command-center` zone (owner §1). Not yet configured (no root `vercel.json`).
