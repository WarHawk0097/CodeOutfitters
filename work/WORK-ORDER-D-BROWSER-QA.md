# Work Order D — Local Edge browser QA report

Finalization of the shared inquiry engine on the public site: Contact-page
mount + full local Microsoft Edge QA. Everything below was run locally against
`localhost:3005`; no production database, storage, email, or deployment was
touched.

## Engine & method

- **Browser engine:** local Microsoft Edge via Playwright
  (`playwright-core@1.61.1`, `chromium.launch({ channel: 'msedge' })`,
  `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`). Not the
  production site, not a hosted test runner.
- **App under test:** `next dev --webpack` on port 3005,
  `INQUIRY_REPOSITORY_MODE=pglite` (embedded Postgres via
  `@electric-sql/pglite`, citext contrib). Fails closed in production; local
  only.
- **Persistence proof method:** column-level `SELECT`s against the PGlite
  store (23/23 in `persist.mjs`) **plus** the live HTTP path returning
  `201` from `POST /api/inquiries`. A success toast is **not** treated as
  persistence proof — every asserted field was read back from the row.
- **Rate limiter during QA:** the in-memory fixed-window limiter is dev-only.
  It was raised for the QA run via `INQUIRY_RATE_LIMIT_IP=1000
  INQUIRY_RATE_LIMIT_EMAIL=1000` because a full sweep issues ~15 POSTs, over
  the default `PER_IP_LIMIT=10`. Production limits are unchanged; this is a
  test-run env override, not a code change.

## Viewports tested

1440×900, 768×1024, 375×812, 390×844 — all four, every route.

## Routes tested

`/ /services /industries /process /case-studies /about /security /contact`

## Result summary

**187 / 187 Edge checks pass.** Category rollup: overflow 32/32, console
32/32, pageerror 32/32, failedreq 32/32, popup 21/21, form 25/25, contact
13/13.

- **CONSOLE_ERRORS:** 0
- **PAGE_ERRORS:** 0
- **HYDRATION_ERRORS:** 0
- **FAILED_REQUESTS:** 0 unexpected
- **HORIZONTAL_OVERFLOW:** none on any route/viewport
- **ACCESSIBILITY:** modal/drawer focusable and dismissible; no enabled
  no-op controls; no fake submissions; no duplicate inquiry requests

## Contact journey verification (contact_full)

- Six steps render (Contact, Business, Workflow, Files, Review) → success.
- Previous/Next navigation; per-step validation; focus moves to first invalid
  field; data survives back/forward; Review reflects entered data accurately.
- Consent (privacy) required before submit.
- Double-submission prevented; `POST /api/inquiries` fires **once**.
- Persisted success state shown (read back from the row, not the toast).
- Legacy `ContactBookingFlow` hidden before success; optional scheduling
  offered only after the inquiry persists; skipping scheduling still confirms
  the inquiry.
- Reopening booking does not resubmit the inquiry; a booking failure does not
  invalidate the persisted inquiry.
- Network failure shows a retryable error; idempotent retry reuses the same
  submission id (`submissionIdRef` regenerated only on success); a material
  edit before retry produces a new submission id.

## Popup / route-suppression verification

50%-scroll exit-intent + CTA triggers work; popup is suppressed on `/contact`
and `/dashboard` (+ `/dashboard/sign-in`) via `EXCLUDED_PREFIXES`; backdrop /
outside click closes it; reduced-motion removes non-essential movement.

## Form-variant persistence (local)

Every variant persists submissionId, formVariant, normalized work email,
source page/path/section, workflow description, and consent, with duplicate-
click protection, safe same-payload replay, and different-payload conflict
(new submission id). Server field errors map back to fields.

## Defects found and fixed during QA (both real, user-facing)

1. **PGlite citext bundling 500.** `POST /api/inquiries` returned 500 because
   the citext tarball was emitted as a `/_next/static/media/citext.tar…gz`
   URL and PGlite's Node loader got a URL where it wanted a path
   (`ERR_INVALID_ARG_TYPE`). **Fix:** `serverExternalPackages:
   ['@electric-sql/pglite']` in `next.config.mjs` + server restart → 201.
2. **Contact wizard stall step 1 → step 2.** Per-step `trigger` ran the
   request schema over blank optional inputs (`websiteUrl`, `companySize`,
   `timeline`, `budgetRange` default to `""` in the DOM), which the wire
   contract rejects, blocking "Continue" for anyone who left them blank.
   **Fix:** `FullInquiryValuesSchema` treats blank optionals as absent so the
   step advances; a non-blank value is still format-checked, and
   `buildInquiryRequest` drops the blanks before the wire contract validates
   (tests added in `inquiry-form-values.test.ts`).

## Honest findings NOT fixed (out of D scope)

- **OS `prefers-reduced-motion` not wired to the `data-motion` gate.**
  `motion-mode-provider.tsx` stamps `data-motion="full"` unless `?motion=reduced`
  is present; it never reads the OS media query, so the
  `html:not([data-motion='full'])` OS-media fallback is disabled site-wide.
  The **popup** honors `matchMedia` directly, so its reduced-motion behavior
  is correct. The reduced-motion QA check uses `?motion=reduced` to exercise
  the gate. Recommend wiring OS `prefers-reduced-motion` into the provider in a
  follow-up.
- **Per-entity CTA prefill is not wired.** Contextual CTAs pass page-level
  attribution (`sourcePage` + `sourceSection`) but do NOT prefill the specific
  selected service / industry / case study into `selectedService` etc. Only
  attribution flows through today.
- **Case-studies uses an inline form, not the shared contextual popup.** The
  `/case-studies` surface renders its own inline form rather than reusing the
  shared popup.

## Automated gates (re-run, all green)

- `npx tsc --noEmit` → exit 0
- `npm test` → 57/57 (9 files); includes `inquiry-backend.pglite.test.ts` (5)
  and the new `FullInquiryValuesSchema` blank-optional tests
- `npm run build` → exit 0 (Next.js 16.2.6, Turbopack), `/api/inquiries`
  present
- Edge QA harness → 187/187

## Testing scope note

The Contact journey DOM assertions (booking hidden before success / visible
after / skip / no-resubmit / contextual prefill attribution) are proven by the
Edge harness because the vitest environment here is node-only (no jsdom/RTL).
A jsdom + React Testing Library stack was **not** added — that is unrequested
test infrastructure and the Edge harness already exercises the real DOM in a
real browser.

## ESLint blocker (deferred per owner)

`package.json` defines `"lint": "eslint ."` but there is no ESLint config
(`eslint.config.*` / `.eslintrc*`) and no `eslint` binary installed, so
`npm run lint` cannot run. Per owner directive this does **not** block D QA.
No permissive placeholder config was created to force a green result; no
ESLint rules were weakened. A separate scoped ESLint proposal follows after
functional QA.

## Boundaries honored

PRODUCTION_DATABASE_TOUCHED: NO. PRODUCTION_STORAGE_CREATED: NO.
PRODUCTION_EMAIL_SENT: NO. DEPLOYED: NO. No production Supabase credentials
used; no real Resend request; no fake upload tokens; no PII in analytics or
logs; no raw IP persisted. File upload stays PREPARED_NOT_ACTIVATED (Work
Order E activates it).
