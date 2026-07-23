# Inquiry form existing-surface audit (Work Order D, Step 1)

Read-only inventory of every existing form/lead-capture surface before building
the shared inquiry engine. Goal: reuse the established design language and not
introduce a second, conflicting form system.

## Existing lead-capture surfaces

| Surface | File | Fields | Submit target |
|---|---|---|---|
| Contact section | `components/contact.tsx` (252) | firstName, lastName, email, businessType(select), message, `honeypot` | Cloudflare Worker (`NEXT_PUBLIC_FORMS_WORKER_URL`) → n8n, `source: 'contact'` |
| Quote form | `components/quote-form.tsx` (235) | fullName, email, company, businessType, automationGoal, currentTools, timeline, `honeypot` | Worker → n8n, `source: 'quote_request'` |
| Newsletter | `components/newsletter.tsx` (112) | email, `honeypot` | Worker → n8n, `source: 'newsletter'` |
| Contact booking flow | `components/contact-booking-flow.tsx` (1046) | multi-step calendar + booking (own module) | Worker → n8n (booking) |
| Booking calendar | `components/booking-calendar-custom.tsx` | calendar picker | Worker → n8n |

Contact page mounts `ContactBookingFlow` (not the plain `Contact` section) at
`app/(public)/contact/contact-page-client.tsx`.

## Current submission architecture (do NOT disturb)

All existing forms POST to a **Cloudflare Worker** at
`${NEXT_PUBLIC_FORMS_WORKER_URL}/`, which adds the per-form secret header
server-side and forwards to the correct n8n webhook. Browser holds no n8n URL or
secret (Security 4, 2026-06-16). `fetch` uses `credentials: 'omit'`,
`Content-Type: application/json`.

**Work Order D adds a parallel path** to the new `POST /api/inquiries` (Zod
contract + atomic backend from Work Orders B/C). It does not replace the Worker
path. The new shared engine is opt-in per new surface (popup + Services/
Industries/Contact inquiry forms + contextual CTAs).

## Established design tokens (reuse verbatim)

- Colors: bg `#FAFAF7`, section bg `#F5F0EB`, text `#1C1612`, muted `#6B6155`,
  placeholder `#9B9088`, accent green `#2A6B5A`, error `border-red-400`.
- Shared input class (identical in `contact.tsx` + `quote-form.tsx`):
  `w-full bg-[#FAFAF7] border rounded-lg px-4 py-3 min-h-[48px] text-sm text-[#1C1612] placeholder-[#9B9088] outline-none transition-all duration-200 focus:border-[#2A6B5A] focus:ring-2 focus:ring-[#2A6B5A]/15 focus:bg-white`
  with `border-red-400` on error, else `border-transparent`.
- Utility classes: `.section-label`, `.font-heading`, `--space-section`,
  `.section-depth`, `.dot-grid`.
- Animation: **framer-motion** `^12.38.0` (`initial/whileInView/transition`,
  ease `[0.25,0.1,0.25,1]`). GSAP `^3.15.0` installed, used elsewhere.
- Icons: **lucide-react** (`CheckCircle`, `ArrowRight`, `Clock`, `Mail`, …).
- Success + error pattern: local state machine
  (`idle|loading|success|error` or `submitted/loading/errors/submitError`),
  inline success card, "email us at hello@codeoutfitters.com" fallback.
- Honeypot field already convention on every form (silent success on trip).

## Consent + popup constraints

- Cookie consent stored at `localStorage['co_cookie_consent']`
  (`'accepted'|'declined'`) — set by `components/cookie-consent.tsx`.
- `components/consent-gated.tsx` renders children only when accepted.
- Global popup mount point: `app/(public)/layout.tsx`
  (`MotionModeProvider > AnnouncementBar > Navbar > main > Footer`).
- Popup suppression state must use its own storage key (do NOT overload
  `co_cookie_consent`).

## Installed deps relevant to Work Order D

| Dep | Status |
|---|---|
| `zod` `^4.4.3` | present (contract authority) |
| `framer-motion` `^12.38.0` | present |
| `gsap` `^3.15.0` | present |
| `@electric-sql/pglite` `^0.5.4` | present (local submission mode) |
| `server-only` `^0.0.1` | present |
| `next` `16.2.6`, `react` `^19` | present |
| **`react-hook-form`** | **ABSENT — install** |
| **`@hookform/resolvers`** | **ABSENT — install** |

No duplicate UI kit, no second schema lib, no second motion lib to add. Only
`react-hook-form` + `@hookform/resolvers` are missing per owner.

## Decisions carried into implementation

1. New engine posts to `/api/inquiries` via existing
   `lib/inquiry/inquiry-api-client.ts` (`submitInquiry`), NOT the Worker.
2. Reuse the exact input class + color tokens + framer-motion patterns so new
   forms are visually indistinguishable from `contact.tsx`/`quote-form.tsx`.
3. Popup mounts in `app/(public)/layout.tsx`; own suppression storage key.
4. Keep the Worker→n8n path on the legacy Contact/Newsletter/booking surfaces
   untouched (not in Work Order D scope to migrate them).

## Contact-page finalization (Work Order D closeout)

The Contact page now mounts the shared engine as the **primary** inquiry surface
while preserving the legacy booking module unchanged:

- `app/(public)/contact/contact-page-client.tsx` renders
  `components/inquiry/full-inquiry-form.tsx` with `formVariant: "contact_full"`
  (six-step wizard: Contact, Business, Workflow, Files, Review, success).
- `components/contact-booking-flow.tsx` and its Cloudflare Worker→n8n booking
  integration are **untouched**. Booking is NOT shown on initial load and NOT
  rendered beside the inquiry form.
- Journey: complete FullInquiryForm → `POST /api/inquiries` (once) → persisted
  success state → THEN optional scheduling offer → only then render/open
  ContactBookingFlow. Booking is separate from inquiry persistence; a booking
  failure never erases the persisted inquiry, reopening booking never
  resubmits the inquiry, and scheduling can be skipped — success still
  confirms the inquiry with no appointment required.
- No two competing forms mount simultaneously; no double-send across the new
  API and the legacy Worker.

## File upload boundary (unchanged for D)

Upload stays PREPARED_NOT_ACTIVATED. The Files step shows browser-selected
files as local-only; no attachment tokens are issued, no production bucket is
created, no production storage is called. `buildInquiryRequest` omits
`attachmentTokens` entirely when none are supplied (covered by test). Work
Order E activates uploads.
