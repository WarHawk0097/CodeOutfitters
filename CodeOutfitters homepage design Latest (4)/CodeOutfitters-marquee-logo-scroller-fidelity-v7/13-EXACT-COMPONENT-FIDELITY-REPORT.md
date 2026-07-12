# 13 · EXACT 21ST.DEV COMPONENT FIDELITY REPORT (v6)

Two supplied 21st.dev components were recreated with high structural/visual parity, adapted only in wording, logo data, brand accent colors, and destination links.

## Comparison screenshots
Stored in `comparison-screenshots/`:
- `02-…-new-homepage-slider` — new Homepage MarqueeLogoScroller (bordered shell, two-col header, separator, large logo cards).
- `03-…-new-security-slider` + `03b-new-security-cards` — new Security MarqueeLogoScroller with control band + grouped logo cards.
- Homepage/Security FAQ captures — dark FAQAccordionBlock (badge → centered heading → centered paragraph → dark accordion cards → same-card expansion).
Reference images 1 (logo slider) and 5 (FAQ) supplied by the user were used as the visual source of truth during build.

---

## A. Homepage MarqueeLogoScroller

**Old component removed:** the letter-mark chip cards / earlier hub are gone.

**Supplied geometry preserved:**
- bordered outer section, thin rounded border, dark surface.
- header grid `[3fr_2fr]`: large heading upper-left, muted description right, with a full-width bottom separator (`border-b`).
- masked marquee viewport (`linear-gradient(to right, transparent, black 10%, black 90%, transparent)`).
- single flex `w-max` track, logos rendered **twice** for a seamless loop, `translateX(0 → -50%)` keyframe, 40s, `hover → animation-play-state:paused`.
- **large logo cards** (208×112) with dark neutral surface, restrained border, rounded corners; the **real logo dominates the card** (44px tall, up to 78% width); per-card gradient reveal + lift on hover.

**Real logo assets:** local SVG brand lockups in `assets/logos/` — n8n, Make, Zapier, Airtable, Google Sheets, Slack, HubSpot, Notion, WhatsApp, Shopify, Stripe, Calendly. Correct logo↔name match + alt text; transparent background; no remote/broken assets; no letter-in-a-box placeholders; no unrelated logos; no "Trusted by"/partner wording.

**Copy:** heading "Connect the tools your business already uses." · description as specified.

**Motion:** seamless ~40s loop, pause on hover, per-card gradient + lift, edge fade. Reduced-motion → static wrapped grid (all 12 logos visible, duplicate hidden, mask off).

## B. Security MarqueeLogoScroller

**Old component removed:** the tiny letter-icon grid is gone.

**Same supplied geometry** as Homepage (bordered shell, two-col header, masked track, twice-rendered logos, pause-on-hover, large cards 212×120), 44s.

**Security-specific presentation (distinct from Homepage):**
- eyebrow "SECURE INTEGRATIONS" with shield glyph; darker controlled palette (#0A1B12 section / #101915 cards).
- a **control band** above the marquee: Scoped access · Server-side secrets · Human approval · Activity logging · Rollback path (each with lock/shield/check icon + pulsing checkpoint dot).
- each logo card carries its **security group tag** (Business systems / Communication / Commerce / Scheduling).
- the marquee itself remains the main visual — controls are supporting content, not a replacement grid.

**Real logos (unique):** HubSpot, Airtable, Google Sheets, Notion, Slack, WhatsApp, Gmail, Twilio, Shopify, Stripe, QuickBooks, Calendly, Google Calendar.

**No fake compliance claims:** no SOC 2/HIPAA/ISO/GDPR/bank-level/partner/uptime/zero-risk wording. (The FAQ item "Are you SOC 2 or HIPAA certified?" honestly states there are no formal certifications — a disclaimer, not a claim.)

**Motion:** loop + hover pause + checkpoint-dot pulse; reduced-motion → static grid, pulses off.

## C. FAQ — dark FAQAccordionBlock (all pages)

**Ivory FAQ removed everywhere.** Applied to: Homepage, Services, Industries, Process, Security & Reliability, Contact. (About and Case Studies have no FAQ/question content.)

**Supplied dark structure preserved:**
- near-black emerald-black section background (#0A140F).
- small FAQ badge (icon + label) at top, large centered heading, centered supporting paragraph, medium-width (max ~820px) accordion container.
- separate **dark charcoal accordion cards** (#111A16), thin low-contrast neutral border, compact closed rows (~62px desktop).
- answer expands **inside the same card** under a thin divider; question warm white / semibold, answer muted light gray, **small restrained chevron** (rotates 180° on open, turns teal); subtle teal border + shadow on open.
- one item open at a time; height + opacity transition; card hover border/shadow; keyboard-accessible `<button>`; `:focus-visible` teal ring.
- **dark CTA card** at the bottom on Homepage + Services ("Still have a workflow question?" → "Talk to Us" → Contact). Omitted on Contact (form already present). No "Contact Support"/"View Documentation".

**Content:** each page keeps its own CodeOutfitters Q&A; all plan/pricing/refund/SLA/documentation demo copy removed. Homepage cost answer = "Every build is scoped individually after the discovery call…"; "low four figures" removed. Page-specific eyebrows/titles retained (Common Questions / Services FAQ / Industry Questions / Process FAQ / Security FAQ / Before You Reach Out).

## D. Navigation
Contact is a normal desktop nav item on all 8 pages (Home · Services · Industries · Process · Case Studies · About · Contact) and inside the mobile hamburger menu; Contact → `08-Contact.dc.html` (`/contact`). No clipping/wrapping/dead links.

## E. Motion preserved (unchanged)
Homepage hero, workflow/demo, calculator, testimonials, section reveals, process timeline, case-study filters/expansions, contact-form states, CTA animations.

## Remaining differences from the selected components
- Logos are hand-built local SVG lockups (icon + wordmark) rather than the exact official brand SVGs, to guarantee offline rendering with no broken remote assets; swap in official SVGs at build time if licensing is cleared.
- The preview environment forces `prefers-reduced-motion`, so screenshots show the static wrapped-grid fallback; the marquee scrolls in a normal browser (verified: track overflows viewport, duplicated content, translateX keyframe).
