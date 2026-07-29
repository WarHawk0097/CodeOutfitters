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
| Main merge SHA | `0103fff2d75f02fb0291e5c21a26b9e2a3bfa421` (`release: CodeOutfitters Command Center Core v1.0.0`, `--no-ff`) |
| Production deployment | `dpl_GuA7SSPNwWVi49DwCRUyS1xS6myQ` (target `production`, SHA `0103fff2d75f02fb0291e5c21a26b9e2a3bfa421`, READY 2026-07-29T23:32:51Z, `aliasError: null`) |
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
| Newsletter | Not mounted. `components/newsletter.tsx` exists but is imported by no route, so Core v1 ships no newsletter field at all — verified in the rendered production pages (no `input[type=email]` subscribe surface on any public route). Nothing pretends to subscribe. |
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

### Pre-merge and post-merge gates (release branch `release/core-v1.0.0-production`, then `main`)

| Gate | Command | Result |
| --- | --- | --- |
| Unit + component suite | `npx vitest run` | `Test Files 56 passed (56)`, `Tests 997 passed (997)` |
| Serial PGlite suites | project PGlite gate | `PGLITE_SERIAL_RESULT: PASS`, `PGLITE_SUITES_FAILED: 0` |
| Types | `npx tsc --noEmit` | clean |
| Production build | `npx next build` | `✓ Compiled successfully in 5.0s` |
| Whitespace | `git diff --check` | empty |
| Integration suite | integration project | `Test Files 3 failed (3)` / `Tests no tests` — `INTEGRATION_TESTS: ENVIRONMENT_BLOCKED` (no live backend, see blockers) |

### Production HTTP smoke (canonical origin)

- All 12 canonical routes return `200`, with `preview-host leaks = 0`, `/dashboard/dashboard occurrences = 0`, `m.` hosts `= 0`.
- `robots.txt` advertises `Sitemap: https://codeoutfitters.vercel.app/sitemap.xml`.
- `sitemap.xml` first entry is `<loc>https://codeoutfitters.vercel.app</loc>`; no `/dashboard`, no `/proposal`.
- JSON-LD organization node carries `"url":"https://codeoutfitters.vercel.app"`.
- `https://codeoutfitters.vercel.app/dashboard?view=today` returns `200` with `num_redirects=0` — the canonical host is never redirected.
- On a non-canonical production alias, `/auth/callback?code=x` and `/api/leads` are **not** folded onto the canonical origin, confirming the exemptions.

### Production rendered QA (Playwright, canonical origin)

Viewports exercised: 1440×900 (all 20 routes), 1366×768, 768×1024, 390×844, 375×812
(`/`, `/login`, `/contact`, `/dashboard`, `/dashboard/leads`, `/dashboard/pipeline`, `/dashboard/settings`).

| Counter | Result |
| --- | --- |
| Console errors | 0 |
| Page errors | 0 |
| Hydration errors | 0 |
| Unexpected failed requests | 0 (no 4xx/5xx; the only network calls are same-origin RSC fetches and the MSW-mocked `/api/leads`) |
| Horizontal overflow | 0 |
| Card overlaps | 0 |
| Ambiguous disabled states | 0 |
| Inert controls | 0 |
| Dead links | 0 |
| Malformed URLs | 0 |
| Preview-host leaks | 0 |
| Supabase requests in demo | 0 |
| Low-contrast enabled controls | **not 0 — see below** |

Rendered behaviour confirmed: demo sign-in reaches `/dashboard`; Google and Apple
are `disabled` with `cursor: not-allowed` and reduced opacity, so neither pretends to
work; the owner identity renders as **Marc Bryce — Owner**; six public-site palettes
(CodeOutfitters, Forest Mist, Graphite Sage, Midnight Emerald, Ocean Slate, Warm Sand)
and six dashboard themes (Match palette, Deep Forest, Warm Ink, Graphite,
Midnight Emerald, Light Ivory) are all present; the dashboard mobile drawer opens with
11 root-relative dashboard links plus `/` for **View website**; the public mobile menu
opens with 8 root-relative links.

### Open accessibility finding — brand green below AA for normal text

Not introduced by this release (the release branch changed routing, docs and tests
only — no colour token was touched) and **not fixed here**, because this freeze is
authorised for canonical-URL corrections, not visual-system changes:

| Where | Control | Measured | Required |
| --- | --- | --- | --- |
| `/` (`components/faq.tsx`) | `Contact Support` — white on `rgb(23,160,99)` | 3.36:1 | 4.5:1 |
| `/services`, `/industries`, `/security` | `Get my free workflow audit` / `Start with a workflow audit` — white on `rgb(23,160,99)` | 3.36:1 | 4.5:1 |
| `/services`, `/industries`, `/security` | `privacy policy` link — `rgb(23,160,99)` on white | 3.36:1 | 4.5:1 |
| `/dashboard` | five `Open …` attention links — `rgb(23,160,99)` on white | 3.36:1 | 4.5:1 |
| `/login` | `Forgot password` — `rgb(18,138,84)` on `rgb(247,242,234)` | 3.93:1 | 4.5:1 |

Root cause is one pair of brand tokens (`#17A063`, `#128A54`) used for 14–16 px text.
A future versioned release should darken those two tokens for text use; it needs owner
sign-off because it changes the approved palette.

## Known environment blockers

- **Integration tests**: `npx vitest run --config vitest.integration.config.ts` cannot run
  locally — the Docker/Supabase stack is unavailable on the release machine.
  Status reported as `INTEGRATION_TESTS: ENVIRONMENT_BLOCKED`.
- **Browser visual QA of preview builds** is owner-performed: preview deployments sit behind
  Vercel Authentication.
- `git diff --check` reports CR-at-EOL on pre-existing CRLF blobs; this is a repository
  trait, not a whitespace error introduced by this release.
- **The production host redirect is unit-verified, not live-observable.** Vercel
  Authentication intercepts every non-canonical production host (system alias, `git-main`
  alias) with a `302` to `vercel.com/sso-api` *before* Edge middleware runs, and the edge
  normalises a spoofed `x-forwarded-host` on the canonical host. The 308 fold onto the
  canonical origin is therefore proven by `lib/routing/canonical-origin.test.ts` rather
  than by a live request; what is observable in production is that the canonical host is
  never redirected (`num_redirects=0`) and that the exempt paths are untouched.

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
