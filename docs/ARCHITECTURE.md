# Architecture

CodeOutfitters is a single Next.js 16 application with two surfaces, both rendered from the same static export.

## High-level shape

```
┌──────────────────────────────────────────────────────────┐
│                Next.js 16 App Router                     │
│                                                          │
│  app/(public)/...  →  public marketing site              │
│  app/admin/...     →  internal admin tool (gated)        │
│                                                          │
│  next.config.mjs → output: 'export' (static build)      │
│  Build target    → out/ (uploaded to Cloudflare Pages)   │
└──────────────────────────────────────────────────────────┘
            │                              │
            ▼                              ▼
   ┌──────────────────┐          ┌─────────────────────┐
   │ Browser-side     │          │ External services   │
   │ integrations     │  ──────► │                     │
   │                  │          │  • n8n (1 webhook)  │
   │  • Supabase REST │          │  • Anthropic API    │
   │  • Anthropic API │          │  • Tawk.to (opt.)   │
   │  • n8n webhook   │          │                     │
   │  • Tawk (opt.)   │          │                     │
   └──────────────────┘          └─────────────────────┘
```

## Why static export

- Cheapest possible hosting: Cloudflare Pages, no functions, no edge workers.
- All `NEXT_PUBLIC_*` env vars are inlined at build time and shipped in the JS bundle. The team accepts this as a tradeoff for not running servers.
- No `app/api/`, no server actions, no middleware, no edge runtime. The browser does everything.

## Route group `(public)`

The marketing pages live under `app/(public)/...`. Parentheses mean the segment is a Next.js route group, **not** a URL segment. URLs are `/services`, `/pricing`, etc., not `/(public)/services`.

This group:

- Has its own `layout.tsx` that wraps every public page with the navbar, footer, floating CTA, cookie consent, announcement bar, gradient background, and other chrome.
- Renders the same JSON-LD `ProfessionalService` block on every page.

## Admin section

The admin section lives under `app/admin/...` (no route group — `/admin` is in the URL).

`app/admin/layout.tsx` implements a **client-side password gate**:

1. On mount, reads `localStorage.co_admin_auth`.
2. Compares it to `process.env.NEXT_PUBLIC_ADMIN_PASSWORD`.
3. If matching, renders the admin shell with a header and `Logout` button.
4. If not matching, renders a password input. On submit, writes the password back into `localStorage` and re-renders.

This is **not** a security boundary. The password env var is in the static bundle; anyone can read the source and bypass the gate by setting the same `localStorage` value. The gate exists to keep the admin out of casual view, not to protect it.

## Data flow

### Public form submissions

Every public form posts to `NEXT_PUBLIC_N8N_WEBHOOK_URL`:

| Form | Source field |
|---|---|
| Quote | `source: "quote_request"` |
| Contact | (no source field) |
| Booking | `type: "booking"` |
| Newsletter | `source: "newsletter"` |

The single webhook must distinguish these by payload shape. There is no server-side schema enforcement. See `INTEGRATION_NOTES.md`.

### Booking persistence

Booking submissions write to Supabase in addition to the webhook:

1. `lib/booking-actions.ts` `createBooking` inserts a row into `bookings`.
2. It then sets `available_slots.is_booked = true` for the chosen `(date, time)`.

The UI calendar in `components/booking-calendar-custom.tsx` does **not** read `available_slots`. Its `isAvailable(day)` only blocks past dates and weekends. This is a known double-book risk. See `docs/ROADMAP.md`.

### Admin proposal generation

1. Owner completes the 5-section intake form at `/admin/onboarding`.
2. Form data is serialized to `localStorage` under `co_onboarding_data`.
3. Owner is redirected to `/admin/proposal`.
4. The proposal page reads the intake, calls `lib/proposal-generator.ts` which calls `https://api.anthropic.com/v1/messages` with `claude-sonnet-4-6`, and renders the parsed 11-section response.
5. The generated proposal is also written to `localStorage` under `co_last_proposal`.

The "Recent Proposals" tile on `/admin` is wired to `co_last_proposal` only — it shows the most recently generated one in the current browser, not a server-side history. The tile is currently marked **Coming soon**.

## Styling system

- Tailwind v4 via `@tailwindcss/postcss`. No `tailwind.config.js`; tokens live in `app/globals.css` `:root` and `@theme inline`.
- shadcn/ui config exists in `components.json` but no shadcn components have been generated into `components/ui/`. Treat that file as a future scaffold.
- Brand colors: emerald `#2A6B5A`, gold accent `#C8A96E`, off-white background `#FAFAF7`, sand surface `#F5F0EB`.
- Inter font loaded via `next/font/google` in `app/layout.tsx`.

## Animation system

Three overlapping systems exist:

- **AOS** — `data-aos` attributes on many components, initialized in `components/aos-provider.tsx`.
- **Framer Motion** — used for component-level enter/exit transitions.
- **GSAP + ScrollTrigger** — used in `components/gsap-provider.tsx` and `lib/animations/useScrollReveal.ts`. Paired with **Lenis** for smooth scroll.

Reduced-motion is honored: AOS does not auto-handle it, but the GSAP hooks check `prefers-reduced-motion: reduce` and exit early.

## Future motion / design direction (owner-stated, not yet implemented)

The owner has stated a premium animation and design-taste direction (D-011, D-012) targeting a non-AI-slop, agency-grade feel inspired by `befluence.pro` (reference only, do not copy). Implementation is gated behind a future **UIX0 / MOTION0** phase, not part of this architecture.

Architectural constraints that the future phase must respect:

- The animation stack already includes GSAP, ScrollTrigger, `@gsap/react`, Framer Motion, AOS, and Lenis. **No new animation libraries may be added without TS0 / RDG0 approval.**
- All animations must remain GPU-friendly (transform / opacity only), must not cause layout shift, and must respect `prefers-reduced-motion`.
- Admin motion stays lighter and faster than the public site.
- Any new external endpoint required by an animation must be added to `public/_headers` CSP at the same time.
- Any visual / motion QA must use the approved browser tooling (Playwright MCP and / or Chrome DevTools MCP) — also gated.

## SEO surface

- Per-page `metadata` exports in every page file.
- `app/sitemap.ts` lists 7 public URLs.
- `app/robots.ts` disallows `/admin`.
- `public/_redirects` provides SPA fallback.
- `public/_headers` sets strict CSP, HSTS, frame denial, and a tight `connect-src` allowing only Supabase, n8n, Anthropic, and Tawk.

## What is not in the architecture

- No backend service, no API routes, no server actions, no middleware.
- No analytics, no error tracking, no uptime monitoring.
- No CI configuration.
- No test framework, no test files.
- No lint configuration file (only an `npm run lint` script in `package.json`).
- No database migration tooling; the SQL file is run manually.
