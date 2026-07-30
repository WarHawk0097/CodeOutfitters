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
| Patch document commit | this commit — `docs(release): prepare the Core v1.0.1 contrast patch` |
| Main merge SHA | _recorded in Phase 11_ |
| Production deployment | _recorded in Phase 11_ |
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
| Unit + component suite | `npx vitest run --exclude "**/*.pglite.test.ts"` | `Test Files 57 passed (57)`, `Tests 1048 passed (1048)` |
| Serial PGlite suites | `npm run test:pglite:serial` | `PGLITE_SERIAL_RESULT: PASS`, `PGLITE_SUITES_FAILED: 0`, `PGLITE_OOM: NO` |
| Types | `npx tsc --noEmit` | clean |
| Production build | `npx next build` | `✓ Compiled successfully in 4.8s` |
| Whitespace | `git diff --check` | empty |
| Integration suite | `npx vitest run --config vitest.integration.config.ts` | `Test Files 3 failed (3)` / `Tests no tests` — `INTEGRATION_TESTS: ENVIRONMENT_BLOCKED`, the local Docker/Supabase stack is unavailable |

New and extended contrast coverage:

- `app/brand-contrast.test.ts` — 20 tests: public token roles, the reported
  patterns at their source, and the role-conflation sweeps.
- `app/dashboard/palette-contrast.test.ts` — 79 tests: the light appearance as
  before, plus the dark appearance for all six palettes (green text on every dark
  surface and on its own tint, white label on the fill, status ink, focus ring).
- `app/dashboard/visual-system.test.ts` — adds the mirror sweep: no green text
  painted with the accent fill token on any dashboard surface.

## Production deployment

_Recorded in Phase 11, after the merge to `main` and production QA._

| Field | Value |
| --- | --- |
| Main merge SHA | _pending_ |
| Deployment ID | _pending_ |
| Deployment SHA | _pending_ |
| State | _pending_ |
| Timestamp | _pending_ |
| Rollback deployment | `dpl_Ap844xwzPdZTEvdUUEd48FRL8aUi` |

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

Every one of these is static text, not an interactive control, so none of them
appears in the enabled-control counters below. Fixing them means darkening
`#128A54` to `#0E7A4E` across roughly 40 sites in eight marketing components,
which changes how the approved design looks. It needs owner sign-off and should
be its own versioned change.
