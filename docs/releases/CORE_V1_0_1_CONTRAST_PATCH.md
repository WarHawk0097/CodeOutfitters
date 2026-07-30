# CodeOutfitters Command Center — Core v1.0.1 accessibility contrast patch

Canonical production origin: **https://codeoutfitters.vercel.app**

| Field | Value |
| --- | --- |
| Release tag | `core-v1.0.1` (created in Phase 11, after production QA) |
| Base tag | `core-v1.0.0` |
| Base SHA | `2c3515877330b07fd60a352beb635b29e0be4edb` |
| Patch branch | `release/core-v1.0.1-contrast` |
| Vercel project | `codeoutfitters` (`prj_D8Z0xzQF8OWA0bsz0PGx7A8vYhrX`) |
| Contrast commit | `275fdcd` — `fix(a11y): raise interactive brand contrast to WCAG AA` |
| Test commit | `d62651d` — `test(a11y): protect the public and dashboard contrast ratios` |
| Patch document commit | `14f0ad0` — `docs(release): prepare the Core v1.0.1 contrast patch` |
| Residual fix commit | `a9f1ebe` — `fix(a11y): raise residual enabled-control contrast to AA` |
| Main merge SHA | `12f3c20960e3d109a472338082c0f6fbfabffc22` |
| Final main SHA (tagged `core-v1.0.1`) | `a9f1ebed3adf1ea68514479bd9d0e05b3808b07a` |
| Production deployment | `dpl_4s3LUgVVeAa44svzFvYEXFkq1tu4` (READY) |
| Rollback deployment | `dpl_Ap844xwzPdZTEvdUUEd48FRL8aUi` (the deployment production served before this patch) |
| Feature changes | NONE |
| Migrations applied | NO |
| DNS changes | NONE |
| Release 5 / AI | Not started, still excluded |

## Finding

Core v1.0.0 shipped with five reported control patterns below WCAG 2.1 AA for
normal-sized text (4.5:1). All five have the same root cause, and it is not a
component defect: one brand green was being asked to do three different jobs.

| Job | What the ratio has to be | What #17A063 actually measures |
| --- | --- | --- |
| Decorative graphic, brand mark, glow, gradient | 3:1 (and decorative graphics are exempt) | 3.36:1 on white — adequate |
| Green **text** on ivory or white | 4.5:1 | 3.36:1 — fails |
| Background under a **white label** | 4.5:1 | 3.36:1 — fails |

The `#128A54` sibling token used on `/login` and inside the booking flow has the
same problem one step less severely (3.92–4.38:1 depending on the surface).

The dashboard already had the right token split (`--cc-green` fill versus
`--cc-green-ink` text), so its failures were six components reaching for the
fill token where they meant the text token — plus one genuine gap: no dark-mode
override, which left green text at 2.37–3.21:1 on the dark canvas in all six
palettes.

## Affected patterns, before and after

Ratios are calculated from the sRGB relative-luminance formula
(`v ≤ 0.03928 → v/12.92`, else `((v+0.055)/1.055)^2.4`; `(Lmax+0.05)/(Lmin+0.05)`),
not judged by eye. Rendered confirmation is in the QA section below.

### The five reported patterns

| # | Control | Route | Component | Size / weight | Before | After |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Contact Support` — white label | `/` | `components/faq.tsx` | 16px / 600 | 3.36:1 | **5.37:1** (hover 6.84:1, active 8.66:1) |
| 2 | `Get my free workflow audit` / `Start with a workflow audit` — white label | `/services`, `/industries`, `/security` | `components/inquiry/inquiry-cta.tsx` | 14px / 600 | 3.36:1 | **5.37:1** |
| 3 | `privacy policy` link | `/services`, `/industries`, `/security` (all inquiry forms) | `components/inquiry/{compact,full}-inquiry-form.tsx` | 12–14px / 400 | 3.36:1 | **5.37:1** on white, 4.82:1 on ivory |
| 4 | Five `Open …` attention links | `/dashboard` | `components/dashboard/overview-operations.tsx` | 11.5px / 600 | 3.36:1 | **5.37:1** light; **6.73:1** dark (worst palette 5.50:1) |
| 5 | `Forgot password` | `/login` | `app/login/login-frame.tsx` | 13px / 500 | 3.93:1 | **4.82:1** |

### Same defect, found by the system-wide audit

Not in the rendered v1.0.0 report because reaching them requires interaction or
a token that only exists behind auth.

| Control | Route | Before | After |
| --- | --- | --- | --- |
| Selected booking day — white label on `#128A54` | `/contact` | 4.38:1 | **5.37:1** |
| Selected booking day sub-label `Selected` | `/contact` | 3.95:1 | **4.84:1** |
| Booking summary date badge — white label | `/contact` | 4.38:1 | **5.37:1** |
| Timezone picker, selected option | `/contact` | 3.92:1 | **4.80:1** |
| Selected timezone `✓` indicator | `/contact` | 4.14:1 | **5.37:1** |
| Public proposal `Submit` — white label | `/proposal/[secureToken]` | 3.36:1 | **5.37:1** |
| Login submit **hover** — ivory label on green | `/login` | 3.26:1 | **4.82:1** |
| Batch/expander actions using the fill token as text | `/dashboard/leads`, `/dashboard/meetings`, `/dashboard/proposals`, pipeline, overview cards | 3.36:1 | **5.37:1** |
| Green text, dark appearance, all six palettes | every dashboard route | 2.37–3.21:1 | **5.50–6.73:1** |
| Required-field `*`, inquiry checkbox accent, all green focus rings | public forms | 3.36:1 (3:1 met, 4.5:1 not) | **4.80–5.37:1** |

## Token changes

`app/globals.css`, public brand block:

```css
--brand-green: #17A063;            /* unchanged — decorative only */
--brand-green-ink: #0E7A4E;        /* green text */
--brand-green-ink-hover: #0B6841;  /* green text on the ivory gradient end */
--brand-green-solid: #0E7A4E;      /* fill under a white label */
--brand-green-solid-hover: #0B6841;
--brand-green-solid-press: #095734;
--brand-focus: #0E7A4E;            /* focus indicators */
--ring: #0E7A4E;                   /* was #17A063 */
```

`app/globals.css`, dark appearance:

```css
--cc-green-ink: color-mix(in srgb, var(--cc-accent) 70%, #ffffff);
```

| Role | Token | Value | Measured |
| --- | --- | --- | --- |
| Brand decorative green | `--brand-green` / `--brand-primary` / `--cc-green` | `#17A063` (per palette on the dashboard) | 3.36:1 on white — non-text only |
| Interactive text green | `--brand-green-ink` / `--cc-green-ink` | `#0E7A4E` light, palette accent lifted 30 % toward white in the dark | 4.80–5.37:1 light, 5.50–6.73:1 dark |
| Filled-action background | `--brand-green-solid` / `--cc-green-solid` | `#0E7A4E` | white label 5.37:1 (worst dashboard palette 5.37:1) |
| Filled-action hover | `--brand-green-solid-hover` | `#0B6841` | 6.84:1 |
| Filled-action active | `--brand-green-solid-press` / `--cc-green-press` | `#095734` | 8.66:1 |
| Focus-ring green | `--brand-focus` / `--cc-focus` | `#0E7A4E` | 4.82–5.37:1 (3:1 required) |
| Disabled / muted | unchanged (`--brand-muted`, `--cc-disabled-*`) | — | deliberately below AA and clearly weaker than the enabled ink beside it |

Nothing was patched hex-by-hex per component: every component now names a role.
The two directions are enforced by sweeps in `app/brand-contrast.test.ts` and
`app/dashboard/visual-system.test.ts`.

### Deliberately unchanged

- **The approved decorative green.** The wordmark, the hero line art, the FAQ
  icon, the progress spine, the step nodes, the chart primary and the section
  glows keep `#17A063`. The patch is a role split, not a global darkening.
- **`#EFE7D6`, the ivory gradient end** of the two FAQ sections.
  `--brand-green-ink` measures 4.36:1 on it. No green text sits there (the FAQ
  control is a white label on the filled action, the copy is `#0A120E`), so it is
  recorded as a boundary with `--brand-green-ink-hover` (5.56:1) as the token to
  use if anything ever lands there. Asserted in `app/brand-contrast.test.ts`.
- **Marketing decorative text** — the uppercase kickers and the badges inside the
  illustrated product mock-ups on `/`, `/services`, `/case-studies` and `/about`
  (`#128A54` at 3.92–3.95:1 on ivory). These are not controls and were not in the
  reported set; changing them is a visible change to the approved marketing
  design across ~40 sites and is listed here for owner sign-off rather than
  taken silently. See “Open finding” below.
- **Font sizes, weights, spacing, layout, copy, button shapes, the six palettes.**

## Routes verified

Public: `/`, `/services`, `/industries`, `/process`, `/about`, `/security`,
`/case-studies`, `/contact`, `/login`, `/forgot-password`, plus `/privacy`,
`/terms` and `/proposal/[secureToken]`.

Dashboard: `/dashboard`, `/dashboard/my-work`, `/dashboard/leads`,
`/dashboard/pipeline`, `/dashboard/appointments`, `/dashboard/meetings`,
`/dashboard/proposals`, `/dashboard/follow-ups`, `/dashboard/email-activity`,
`/dashboard/team`, `/dashboard/settings`.

Themes: all six palettes (CodeOutfitters, Forest Mist, Graphite Sage, Midnight
Emerald, Ocean Slate, Warm Sand) × both appearances, token-resolved per palette
in `app/dashboard/palette-contrast.test.ts`.

## Tests

| Gate | Command | Result |
| --- | --- | --- |
| Unit + component suite | `npx vitest run --exclude "**/*.pglite.test.ts"` | `Test Files 63 passed (63)`, `Tests 1144 passed (1144)` (at `a9f1ebe`) |
| Serial PGlite suites | `npm run test:pglite:serial` | `PGLITE_SERIAL_RESULT: PASS`, `PGLITE_SUITES_FAILED: 0`, `PGLITE_OOM: NO` |
| Types | `npx tsc --noEmit` | clean |
| Production build | `npx next build` | `✓ Compiled successfully in 4.8s` |
| Whitespace | `git diff --check` | empty |
| Integration suite | `npx vitest run --config vitest.integration.config.ts` | `Test Files 3 failed (3)` / `Tests no tests` — `INTEGRATION_TESTS: ENVIRONMENT_BLOCKED`, the local Docker/Supabase stack is unavailable |

New and extended contrast coverage:

- `app/brand-contrast.test.ts` — 23 tests: public token roles, the reported
  patterns at their source, the role-conflation sweeps, a guard against painting
  a status *fill* token as text, and the composited contact reach-card labels.
- `app/dashboard/palette-contrast.test.ts` — 94 tests: the light appearance as
  before, plus the dark appearance for all six palettes (green text on every dark
  surface and on its own tint, white label on the fill, status ink, focus ring),
  `--cc-body-t3` against every light and dark surface, and a per-rail sidebar
  sweep over all five rails (text, muted, heading on background/surface/hover;
  active text on the active fill; badge text on the badge fill; focus ring).
- `app/dashboard/visual-system.test.ts` — adds the mirror sweep: no green text
  painted with the accent fill token on any dashboard surface.

## Residual defects found by rendered production QA

The token audit in Phases 1–4 could only see brand green. Rendered QA on the
merge-SHA deployment surfaced four more enabled-control text failures that were
not green at all. Each was fixed at the token that owns the role, not at the call
site, and each edit carries an inline comment with the old value and its measured
ratio.

| Site | Before | After | Root cause |
| --- | --- | --- | --- |
| Tertiary body text on light surfaces | `--cc-body-t3: #7d8375` — 3.20:1 | `#64695e` — ≥4.63:1 on all 31 light surfaces (worst: the warm-sand lane `#efe8d7`) | one tertiary token tuned against white only |
| `warm-ink` rail muted text on hover | `#928c7c` — 4.48:1 | `#948e7f` — 4.60:1 | rail hover fill is lighter than the rail background |
| `graphite` rail muted text on hover | `#888d93` — 3.69:1 | `#9b9fa4` — 4.64:1 | same |
| `light-ivory` rail muted / heading on hover | `#7d8375` — 3.18:1 / `#6b7c6f` — 3.60:1 | `#63675c` — 4.71:1 / `#5c6b5f` — 4.58:1 | same |
| Overview "DUE TODAY" tag | `TONE_BASE` (`--cc-amber`) — 3.65:1 on white | `TONE_INK` (`--cc-amber-ink` `#7d5514`) — 6.60:1 | a *fill* tone spent as text |
| Contact reach-card sub-label and eyebrow | `rgba(245,240,232,.5)` — 4.30:1 | `.72` — 7.24:1 at rest, 6.73:1 on hover | alpha tuned by eye |

`--cc-body-t3` stays weaker than `--cc-text-muted` on the same surface, so
disabled and de-emphasised text still read as de-emphasised; that ordering is
asserted, not assumed. `TodaysWorkItem` now carries `color` (the inset rail and
the mobile dot, a fill) and `ink` (the same tone as text) as two fields, because
they are two roles.

## Production deployment

| Field | Value |
| --- | --- |
| Main merge SHA | `12f3c20960e3d109a472338082c0f6fbfabffc22` |
| Merge-SHA deployment | `dpl_6q5H6weaie87u5dUf5NAjfYbLZ6r` (READY) |
| Final main SHA | `a9f1ebed3adf1ea68514479bd9d0e05b3808b07a` |
| Deployment ID | `dpl_4s3LUgVVeAa44svzFvYEXFkq1tu4` |
| Deployment SHA | `a9f1ebed3adf1ea68514479bd9d0e05b3808b07a` |
| State | `READY` (`readyState: READY`, region `iad1`) |
| Timestamp | created `1785376759903`, ready `1785376834065` |
| Canonical host | `https://codeoutfitters.vercel.app` |
| Rollback deployment | `dpl_Ap844xwzPdZTEvdUUEd48FRL8aUi` |

## Rendered production QA (Phase 9)

26 static routes probed inside a viewport-sized iframe at `1440×900`,
`1366×768`, `768×1024`, `390×844` and `375×812` against
`https://codeoutfitters.vercel.app`.

| Counter | Result |
| --- | --- |
| `CONSOLE_ERRORS` | 0 |
| `PAGE_ERRORS` | 0 |
| `HYDRATION_ERRORS` | 0 |
| `UNEXPECTED_FAILED_REQUESTS` | 0 |
| `HORIZONTAL_OVERFLOW` | 0 |
| `CARD_OVERLAPS` | 0 |
| `LOW_CONTRAST_ENABLED_CONTROLS` | 0 (excluding the WCAG 1.4.3 logotype below) |
| `AMBIGUOUS_DISABLED_STATES` | 0 |
| `INERT_CONTROLS` | 0 |
| `DEAD_LINKS` | 0 |
| `MALFORMED_URLS` | 0 |
| `PREVIEW_HOST_LEAKS` | 0 |
| `SUPABASE_REQUESTS_IN_DEMO` | 0 |

Measured ratios for the five reported patterns, identical at all five viewports:

| Pattern | Before | After |
| --- | --- | --- |
| Homepage FAQ "Contact Support" | 3.36:1 | **5.37:1** |
| Workflow-audit CTA (`/services`, `/industries`, `/security`) | 3.36:1 | **5.37:1** |
| Privacy-policy link on those routes | 3.36:1 | **5.37:1** |
| `/dashboard` "Open …" attention links (all five) | 3.36:1 | **5.37:1** |
| `/login` "Forgot password" | 3.93:1 | **4.82:1** |

Rendered sidebar minima on production, all five rails, background / surface /
hover: `forest` 4.59:1, `warm-ink` 4.60:1, `graphite` 4.64:1,
`midnight-emerald` 4.93:1, `light-ivory` 4.58:1. Rendered `--cc-body-t3` minimum
across all six palettes in both appearances: 5.18:1.

## Rollback

Roll back to `dpl_Ap844xwzPdZTEvdUUEd48FRL8aUi` immediately if the deployment SHA
is wrong, the canonical site fails, any reported control still measures below
4.5:1, a major visual regression appears, routing breaks, a secret is exposed,
the dashboard becomes unusable, or unexpected Supabase requests appear in demo
mode.

```bash
npx vercel rollback dpl_Ap844xwzPdZTEvdUUEd48FRL8aUi --scope warhawk0097s-projects
```

Rollback moves the production alias only: no DNS, no Supabase, no migration. If a
rollback happens, `core-v1.0.1` is not created.

## Scope

This patch changes colour tokens and the components that consume them, plus
tests and this document. It does **not** add features, change layout, typography
scale, copy or spacing, apply migrations, touch production Supabase, touch DNS,
or start Release 5 or the AI/Anthropic integration. `core-v1.0.0` is not moved.

## Open finding — decorative marketing text below AA

Pre-existing, not introduced here, and not fixed here because it is a visible
change to the approved marketing palette rather than a control repair:

| Where | Text | Measured | Required |
| --- | --- | --- | --- |
| `/`, `/services`, `/case-studies`, `/about`, `/contact` | uppercase section kickers, `#128A54` on ivory | 3.93:1 | 4.5:1 |
| `/`, `/services` | badges and captions inside the illustrated product mock-ups | 3.92–3.95:1 | 4.5:1 |
| `/proposal/[secureToken]` | the `pp-logo` wordmark, `#17A063` | 3.36:1 | exempt (logotype) |
| every marketing route at ≤390 px | the header wordmark "Outfitters", `rgb(23,160,99)` on `rgb(247,242,234)` | 3.02:1 | exempt (logotype, WCAG 1.4.3) |
| `/` story carousel | the 8×8 px position dots, `rgba(255,255,255,.25)` / active `rgb(43,212,131)` | ~2.3:1 | 3:1 (non-text, 1.4.11) |

Every one of these is either static text or a non-text indicator, not enabled
control text, so none of them appears in the enabled-control counters. The
carousel dots are the one item that is a real (pre-existing, v1.0.0) 1.4.11
failure rather than an aesthetic one; they are labelled only by `aria-label`, so
the state is still available to assistive technology. Fixing them means darkening
`#128A54` to `#0E7A4E` across roughly 40 sites in eight marketing components,
which changes how the approved design looks. It needs owner sign-off and should
be its own versioned change.
