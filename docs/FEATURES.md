# Features

A flat inventory of what the product actually does. Marketing copy is not relied on; only behavior verifiable in the source.

## Public site

### Marketing pages

- **`/`** — Home. Hero, tools strip, services preview (3 of 6), 4-step process, ROI calculator, sample portfolio, CTA banner.
- **`/services`** — All six services. CTA banner.
- **`/pricing`** — Quote request form, FAQ, CTA banner. **No published prices.** Every engagement is scoped.
- **`/portfolio`** — Three hardcoded sample case studies. Tag "Sample Project" on each card. Copy claims "real case studies" in metadata — a known copy contradiction. See `docs/ROADMAP.md`.
- **`/about`** — Process section + values section + CTA banner.
- **`/contact`** — Contact form + booking CTA.
- **`/book`** — 3-step booking calendar.
- **`/privacy`** — Static privacy policy. Last updated May 2026.
- **`/terms`** — Static terms of service. Last updated May 2026.
- **`/404`** — Custom not-found page.

### Interactive components

- **ROI Calculator** — three sliders (employees, hours wasted, hourly rate) → weekly / monthly / yearly loss in dollars. On the home page.
- **Quote Form** — name, email, company, business type, automation goal, current tools, timeline. Honeypot. POSTs to n8n.
- **Contact Form** — first/last name, email, business type, message. Honeypot. POSTs to n8n.
- **Booking Calendar** — 3 steps: date → time → details. Honeypot. POSTs to n8n and writes to Supabase. **Does not currently read `available_slots.is_booked`.** See `docs/DATABASE.md`.
- **Newsletter** — email only. Honeypot. POSTs to n8n with `source: "newsletter"`.
- **FAQ accordion** — 4 questions on the pricing page.
- **Cookie consent** — accept/decline banner. Gates the optional Tawk live chat.
- **Live chat (Tawk)** — optional, loads only when `NEXT_PUBLIC_TAWK_PROPERTY_ID` is set to a real value.
- **Tools strip** — scrolling logo marquee.
- **Testimonials carousel** — defined in `components/testimonials.tsx` but **not currently rendered** anywhere on the public site.
- **Floating CTA** — mobile-only "Book Free Call" button after the first 400px of scroll.
- **Back-to-top** — appears after 600px of scroll, desktop only.
- **Scroll progress** — fixed top progress bar.
- **Announcement bar** — dismissible top banner promoting the free workflow audit.
- **Page transitions** — framer-motion enter/exit on route change.
- **Gradient canvas** — fixed full-screen background of slow-moving color blobs.
- **Smooth scroll** — Lenis + GSAP, with reduced-motion respect.
- **AOS scroll animations** — `data-aos` attributes on most sections.

### SEO and meta

- Per-page `metadata` exports.
- `sitemap.xml` lists 7 URLs.
- `robots.txt` disallows `/admin`.
- Open Graph and Twitter card defaults in `app/layout.tsx`.
- JSON-LD `ProfessionalService` block on every public page.

## Admin tool

- **`/admin`** — Password-gated dashboard. Two tiles: "New Client Intake" (active) and "Recent Proposals" (coming soon).
- **`/admin/onboarding`** — 5-section intake form:
  1. **Prospect Details** — name, email, company, business type, size, source, website, LinkedIn, meeting date
  2. **Their Pain** — biggest headache, manual tasks, hours/week, team structure, fear
  3. **Tech Stack** — CRM, communication, marketing, scheduling, project management, e-commerce, other software, current automation usage, willingness to switch
  4. **Their Vision** — dream scenario, what they'd stop doing, key metric, budget, timeline, decision makers
  5. **Internal Notes** — fit assessment, red flags, strongest pain point, recommended automation, estimated effort
  - Saves to `localStorage.co_onboarding_data`.
  - "Save Draft" button available on every section.
- **`/admin/proposal`** — Reads the intake. "Generate Proposal" button. Calls Anthropic `claude-sonnet-4-6` directly. Renders 11 sections:
  - Executive Summary
  - We Understand Your Challenge
  - What We Recommend
  - What This Looks Like in Practice
  - The Technical Approach
  - What We Need From You
  - Timeline (4 milestones)
  - Investment
  - Why CodeOutfitters
  - Next Steps
  - What Else Is Possible
  - Per-section copy buttons.
  - "Copy All" / "Print / PDF" / "Send to Client" actions.
  - Internal notes (fit, red flags, lead with, pitch, effort) shown in a collapsible panel hidden from print.
  - Generated proposal is also saved to `localStorage.co_last_proposal`.

## What is intentionally not built

- No published prices anywhere on the site. Pricing requires a quote request.
- No blog or content management.
- No client portal. Once an engagement starts, it is managed outside the site.
- No user accounts, no login, no password reset, no email verification.
- No analytics. No A/B testing. No heatmaps.
- No multi-language. English only.
- No dark mode toggle. The brand is single-tone warm off-white + emerald + gold.
- No CMS. The site is fully hand-coded.

## Design and motion direction (owner-stated, not yet implemented)

The owner wants a premium, agency-grade animation and design feel inspired by `befluence.pro` (reference only, no copy). Captured in D-011 and D-012 in `memory/IMPORTANT_DECISIONS.md`. Implementation belongs in a future approved **UIX0 / MOTION0** phase.

Target animation types (no code yet):

- Hero entrance animation
- Animated headline reveal
- Scroll-triggered section reveals
- Smooth parallax layers
- Floating cards
- Animated service cards
- Horizontal marquee / moving logo strips
- Animated statistics counters
- Interactive hover / magnetic buttons
- Smooth page transitions
- Portfolio cards with motion depth
- Process timeline animation
- ROI calculator micro-interactions
- Contact / booking form transitions

Admin motion stays lighter and faster than the public site (D-011).

Taste target (D-012): non-AI-slop, premium AI-agency feel. Avoid generic SaaS gradients, same-y cards, weak typography hierarchy, random icons above headings, unmotivated motion, childish over-effects. Prefer strong typography, clear hierarchy, confident spacing, purposeful animation, fast feedback, scroll-based storytelling, US small-business trust, beautiful-but-operational UI.

No new animation libraries until TS0 / RDG0 approval. No Impeccable or Emil Kowalski install until approved.

## What looks built but is not wired

- `components/testimonials.tsx` — carousel exists, is not rendered anywhere.
- `components/portfolio-placeholder.tsx` — "more coming soon" panel exists, is not rendered anywhere.
- "Recent Proposals" tile on `/admin` — UI is rendered, but the feature is marked "Coming soon" in copy. The "last proposal in localStorage" is accessible to anyone with admin access, but there is no list view.
- `lib/booking-actions.ts:getAvailableSlots` — function exists, is not called by any UI component.
