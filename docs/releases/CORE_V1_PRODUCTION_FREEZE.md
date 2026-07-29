# CodeOutfitters Command Center — Core v1.0.0 production freeze

Canonical production origin: **https://codeoutfitters.vercel.app**
Canonical dashboard: **https://codeoutfitters.vercel.app/dashboard**

| Field | Value |
| --- | --- |
| Release tag | `core-v1.0.0` |
| Vercel project | `codeoutfitters` (`prj_D8Z0xzQF8OWA0bsz0PGx7A8vYhrX`) |
| Source branch | `fix/core-v1-dashboard-visual-system` |
| Verified source head | `df033b1d33e813c1cb5d32b83dbc48889309a748` |
| Release branch | `release/core-v1.0.0-production` |
| Main merge SHA | _recorded below after merge_ |
| Production deployment | _recorded below after deploy_ |
| Rollback deployment | `dpl_GXhtJCpEunTeJ9K45YYPBacTQsRC` (SHA `e29900b030580c940966c1d0dd52eb21b8804836`, READY, rollback candidate) |
| Migrations applied by this release | NO |

## What Core v1 contains

Releases 1–4 of the Command Center, plus the two repair passes that followed them:

- **Workspace data foundation** — workspace-scoped tables with membership RLS, the activity
  log with an append-only grant, the tasks collection, the saved-views schema.
- **Operational Overview** — today's work fed from the task collection, and the five
  operational cards (overdue, waiting on client, meetings to prepare, proposals needing
  attention, leads with no next action). Every number is a record-set length and expands to
  exactly the rows it counted.
- **Seven list routes** — My Work, Leads, Pipeline, Meetings, Proposals, Follow-ups, Email
  Activity, each with search, filters and a Saved View bar.
- **Universal Search, Command Palette, Recent Items, Saved Views** — no secure token, access
  link or restricted activity reaches the index.
- **Meetings** — prepare, live, transcript and review as deep-linkable routes, with provider
  posture stated honestly on every module that would need one.
- **Proposals** — builder, preview, templates, access publishing, and the public
  `/proposal/[secureToken]` route: token-only input, `noindex`, uniform resolution for
  unknown/expired/revoked/foreign tokens.
- **Identity** — the administrator account displays as **Owner** through
  `getTeamRoleDisplayLabel`. The stored `TeamRole` is still `"Administrator"`, the admin gate
  still compares against it, and no permission was widened or narrowed.
- **Dashboard visual system** — one control primitive module
  (`lib/command-center/ui/control-system.ts`): 40px standard controls, 36px compact row
  actions, 44px mobile targets, real disabled semantics with a stated reason instead of an
  opacity fade, a visible focus ring on every variant, one shared toolbar row and one shared
  Saved View bar, content-driven Overview cards, and AA-measured contrast across all six
  palettes.
- **Canonical URL policy** — one client-facing origin, enforced in source and in middleware.
  See [`docs/architecture/CANONICAL-URL-POLICY.md`](../architecture/CANONICAL-URL-POLICY.md).

## Demo / live posture — honest, unchanged

| Capability | State in production |
| --- | --- |
| Mode | Demo. The dashboard reads the in-repo demo store and makes zero Supabase requests. |
| Supabase (live plane) | Not configured. Live auth resolves to `provider_required`. |
| Migrations | Present in `supabase/migrations/`, **not applied** by this release. |
| Google sign-in | Unavailable and shown as unavailable. |
| Apple sign-in | Unavailable and shown as unavailable. |
| Newsletter | Shows the unavailable notice with the direct email address; it does not pretend to subscribe. |
| Booking / quote / inquiry | Report unavailability honestly when the backend is absent. |
| AI features | Not present. Not started. |

Nothing in this release hides a missing integration behind a fake success.

## Canonical routing policy (summary)

- Canonical origin: `https://codeoutfitters.vercel.app`.
- Internal navigation is root-relative.
- Production requests on a Vercel system alias are 308-redirected to the canonical origin,
  path and query preserved; `/api`, `/auth`, `/proposal`, `/_next` and `/_vercel` are exempt.
- Preview deployments and local development are never redirected.
- Prohibited alternative origins: any `*.vercel.app` deployment hostname, any branch alias,
  `m.codeoutfitters.*`, and `codeoutfitters.com` (not deployed; DNS untouched).
- Absolute URLs come from `publicOrigin()`, never from `x-forwarded-host`.

## Verification

_Recorded below at freeze time._

## Known environment blockers

- **Integration tests**: `npx vitest run --config vitest.integration.config.ts` cannot run
  locally — the Docker/Supabase stack is unavailable on the release machine.
  Status reported as `INTEGRATION_TESTS: ENVIRONMENT_BLOCKED`.
- **Browser visual QA of preview builds** is owner-performed: preview deployments sit behind
  Vercel Authentication.
- `git diff --check` reports CR-at-EOL on pre-existing CRLF blobs; this is a repository
  trait, not a whitespace error introduced by this release.

## Rollback procedure

The previous production deployment stays available and is a rollback candidate:

- Deployment: `dpl_GXhtJCpEunTeJ9K45YYPBacTQsRC`
- SHA: `e29900b030580c940966c1d0dd52eb21b8804836`
- URL: `https://codeoutfitters-1hhk17onr-warhawk0097s-projects.vercel.app`

To roll back:

```bash
npx vercel rollback dpl_GXhtJCpEunTeJ9K45YYPBacTQsRC --scope warhawk0097s-projects
```

or, in the Vercel dashboard, Project → Deployments → the deployment above → **Instant
Rollback**. Rollback moves the production alias only; no DNS, no Supabase, no migration.

## Freeze rules

Core v1.0.0 is frozen at the tag `core-v1.0.0`. The tag is not moved or recreated. Any
change after this freeze requires:

1. a new branch off `main`,
2. its own verification pass (unit, pglite, typecheck, build, canonical-policy tests),
3. and a new version — `core-v1.0.1` for a documented patch release, or a new minor/major.

**Not included and not started:** Release 5, AI or Anthropic integration, Notification
Centre, new roles or permission architecture, live backend configuration, DNS changes.
