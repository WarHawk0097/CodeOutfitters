# 12 · FAQ + LOGO SLIDER REPAIR REPORT (v5)

Component sources used verbatim as structural references (not loose inspiration):
- **MarqueeLogoScroller** — bordered outer container · two-column [3fr/2fr] header with bottom border · edge-masked viewport · flex `w-max` track animated `translateX(0 → -50%)` · logos rendered twice for a seamless loop · `hover:[animation-play-state:paused]` · per-card hover gradient reveal + lift · configurable speed.
- **FAQAccordionBlock** — header Badge (icon + label) → title → description · single-open `openIndex` state · per-item entrance animation · `AnimatePresence`-style height + opacity open/close · rotating chevron · card hover border/shadow · answer inside the same card under a top divider · optional bottom CTA card.

---

## Homepage logo slider

- **Old component removed:** the pill/marquee chip wall (and the interim v3 hub) is gone; section `#integrations` is now a single MarqueeLogoScroller.
- **Supplied mechanics applied:** bordered shell, two-column heading/description header with border-b, edge-mask viewport, single flex track with the 12 logos rendered twice, `translateX(0→-50%)` keyframe (`mqScroll`), pause-on-hover, per-card gold→teal gradient reveal + 6px lift, configurable duration (set to 40s).
- **Tools (12, unique, exact labels):** n8n · Make · Zapier · Airtable · Google Sheets · Slack · HubSpot · Notion · WhatsApp · Shopify · Stripe · Calendly. No demo logos, no "Trusted by", no partner/client claims, brand-mark tiles (no external image dependencies → no broken assets).
- **Copy:** eyebrow INTEGRATIONS · title "Connect the tools your business already uses." · description as specified.
- **Motion verified:** ~40s seamless loop; **hover pause verified** (`animation-play-state:paused`); card hover gradient + lift.
- **Reduced-motion fallback verified:** track `animation:none`, `flex-wrap:wrap`, `width:100%`, duplicate set hidden, mask removed → all 12 logos in a static centered grid (confirmed in-preview, which forces reduce).

## Security logo slider

- **Old component removed:** the duplicated marquee / v3 architecture grid is gone.
- **Supplied mechanics applied:** same MarqueeLogoScroller shell + two-column header + masked track + twice-rendered logos + pause-on-hover + hover gradient/lift, duration 44s.
- **Security-specific presentation added (distinct from homepage):**
  - eyebrow SECURE INTEGRATIONS with a shield glyph; darker controlled palette (#0A1B12, near-black shell).
  - a **control band** of five chips — Scoped access · Server-side secrets · Human approval · Activity logging · Rollback path — each with a lock/shield icon and a pulsing checkpoint dot.
  - each logo card carries its **security group tag** (Business systems / Communication / Commerce / Scheduling).
- **Scoped-access controls visible:** yes (control band + per-card group tags + "least access the workflow needs" shell subhead).
- **Tools by group (unique):** Business systems — HubSpot, Airtable, Google Sheets, Notion · Communication — Slack, WhatsApp, Gmail, Twilio · Commerce — Shopify, Stripe, QuickBooks · Scheduling — Calendly, Google Calendar.
- **No fake compliance claims:** no SOC 2 / HIPAA / ISO / GDPR / bank-level / partner / uptime / zero-risk wording anywhere in the section (the honest FAQ answer about "no formal certifications" is preserved unchanged).
- **Motion verified:** loop + hover pause + checkpoint-dot pulse. **Reduced-motion fallback:** static wrapped grid, pulses disabled.

## FAQ

- **Pages updated:** Homepage, Services, Industries, Process, Security & Reliability, Contact. (About and Case Studies contain no FAQ/question section — none existed, none invented.) No page still uses the previous oversized accordion.
- **Supplied accordion mechanics applied:** header Badge (HelpCircle-style pill) + title + description; single-open behavior (`openFaq` index); `fm-rv` entrance reveal per item; height (`grid-template-rows 0fr→1fr`) + opacity open/close; rotating circular chevron; card hover border/shadow; answer inside the same card under a top divider.
- **Old oversized cards removed:** compact rows (~62–64px closed on desktop, tighter on mobile), no reserved blank space.
- **Open/close tested:** in-card expansion, emerald border + gold glow ring on open, chevron fills emerald and rotates 180°.
- **Keyboard/focus tested:** native `<button>` triggers; `:focus-visible` emerald ring.
- **Reduced-motion tested:** `.faq-motion` transitions reduced to ~0ms; content fully usable, nothing starts hidden.
- **Content:** each page keeps its own CodeOutfitters Q&A; no plan/pricing/refund demo copy. Page-specific eyebrows/titles applied (Common Questions / Services FAQ / Industry Questions / Process FAQ / Security FAQ / Before You Reach Out). Homepage cost answer rewritten to the approved "scoped individually after the discovery call…" copy; the "low four figures" phrase is removed.
- **Bottom CTA:** added on Homepage and Services only ("Still have a workflow question?" → "Talk to Us" → Contact). Not added on Contact (form already present). No "Contact Support"/"View Documentation".

## Navigation

- **Contact visible on desktop:** all 8 pages — Home · Services · Industries · Process · Case Studies · About · Contact.
- **Contact visible on mobile:** hamburger `<details>` menu (≤960px) contains all 7 items + Book a Call CTA.
- **Link destinations tested:** Contact → `08-Contact.dc.html` (maps to `/contact`); Book a Call CTA → Contact. No dead links, no clipping/wrapping.

## Motion preserved (unchanged)

Homepage hero, workflow/demo, calculator, testimonials, section reveals, CTA sweep, process timeline, case-study filters/expansions, contact form behavior — all untouched.
