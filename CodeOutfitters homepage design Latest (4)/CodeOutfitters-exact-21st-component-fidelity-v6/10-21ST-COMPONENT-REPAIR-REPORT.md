# 10 · 21ST COMPONENT REPAIR REPORT (v3)

Scope of this pass: homepage integrations, FAQ system on all applicable pages, Security & Reliability integrations, top navigation. No other section was redesigned; all previously approved motion (hero, workflow demo, calculator, testimonials marquee, section reveals, CTA sweep, card hovers) is untouched.

---

## 1. Homepage integrations

**Old problem:** flat two-row logo ticker with 8 tools duplicated across both rows (16 rendered chips), no focal point, no integration story, large empty dark band.

**Component source (exact):** hybrid of the two attached 21st.dev prompts `integration-hero.tsx` (centered eyebrow badge → headline → supporting copy above the tool layer, circular/soft tool tiles with brand marks, edge treatment) and `integrations-section.tsx` (left-content + tool-tile-field split, tile grid used as the ≤860px fallback), composed around a central hub node.

**New structure:**
- Section eyebrow ("Integrations", gold rules) → headline → one supporting paragraph — the exact content stack of `integration-hero.tsx`.
- Central **CodeOutfitters automation hub** card (logo, name, "Automation hub", live "Running 24/7" status dot).
- **12 surrounding tool nodes**, zero repeats: WhatsApp, Slack, HubSpot, Notion, Airtable, Google Sheets, Stripe, Shopify, Calendly, Zapier, Make, n8n. Each node = brand-color mark + name, matching the icon-tile treatment of both source components.
- SVG connection lines from every node to the hub with directional dashed flow.
- No marquee wall; no duplicated chips; no fake partnership claims (tool names only, no logos claimed as partners).

**Animations:** dashed connection-line flow (`pathFlow6`), 6 staggered SMIL pulse dots travelling node→hub (teal + gold), subtle node float (staggered `intFloat`), hub breathing glow (`intBreath`), node hover lift/glow. `prefers-reduced-motion` disables float, breath, line flow, and hides pulse dots.

**Responsive result:** ≥861px renders the hub canvas (540px, absolute nodes never exceed the container); ≤860px swaps to a hub banner + auto-fill tile grid (the `integrations-section.tsx` tile-field mechanic). No horizontal overflow at 1440 / 820 / 390.

---

## 2. FAQ (all pages)

**Old problem:** tall rows (18–20px padding + oversized max-height reserve), generic white rectangles, tiny text chevron glyph, weak hierarchy.

**Component source (exact):** `faq-accordion.tsx` (Radix Accordion wrapper from the attached prompt). Applied mechanics: leading icon/marker inside the trigger row (HelpCircle position → replaced by a numbered square marker per CodeOutfitters style), question text center-left, **circular chevron control on the right that rotates 180° on open** (`group-data-[state=open]:rotate-180` mechanic reproduced via inline transform), answer expanding inside the same card below the trigger, single-open behavior.

**Pages updated:** Homepage, Services, Industries, Process, Security & Reliability, Contact (mini FAQ). About and Case Studies have no FAQ section (none existed; none invented). All CodeOutfitters-specific Q&A copy preserved verbatim — no demo copy from the component file.

**Closed state:** compact 13/16px padding row, warm ivory `#FCFAF4`, thin `#EAE2D2` border, subtle shadow, numbered marker (01…), outlined circular chevron.

**Open state:** white card, emerald border, left emerald accent line (inset shadow), soft glow ring, elevated shadow, marker inverts to deep emerald/teal, chevron circle fills emerald and rotates 180°, answer flows directly under the question inside the same card.

**Animation:** height via `grid-template-rows 0fr→1fr` + opacity (450ms premium easing — no reserved empty space, exact-height expansion), chevron spring rotation. Hover: border tint; focus-visible: emerald outline ring.

---

## 3. Security & Reliability integrations

**Old problem:** duplicate of the homepage tool marquee — same chips, same motion, no security meaning.

**Component source (exact):** `integrations-section.tsx` tool-tile/grouping mechanic, re-architected around a control-plane composition (grouped tool tiles instead of a flat tile field), with the connection/checkpoint layer expressing the page's "Connected carefully, with scoped access" concept.

**Security controls represented:** central **CodeOutfitters control layer** hub listing Scoped access per tool · Secrets stay server-side · Human approval gates · Every run logged · Rollback path ready. Every tool group connects to the hub **through a shield "Checkpoint" badge** on the connection line. Each tool carries a scope tag (e.g. Stripe "Restricted key", Shopify "Orders read", Gmail "Send-as only") — access labels, not just tool labels. No compliance badges, no certification or partner claims (existing honest FAQ answer untouched).

**Tool groups (no repeats):** Business systems (HubSpot, Airtable, Google Sheets, Notion) · Commerce (Shopify, Stripe, QuickBooks) · Communication (Slack, WhatsApp, Gmail, Twilio) · Scheduling (Calendly, Google Calendar).

**Animations:** pulse dots travelling along both connectors into the hub, checkpoint gold glow, hub breathing glow, group-card hover lift. Reduced-motion fallback disables all three.

**Responsive result:** desktop = 5-column architecture (groups | checkpoint | hub | checkpoint | groups); ≤960px stacks vertically with vertical dashed connectors and downward pulses so the chain stays readable; ≤540px groups go single-column. Distinct layout from the homepage section by design: homepage = capability, security page = controlled access.

---

## 4. Navigation

- **Desktop:** Home · Services · Industries · Process · Case Studies · About · **Contact** now on all 8 pages; current page highlighted; "Book a Call" CTA stays far right and still links to the Contact page.
- **Mobile/tablet (≤960px):** new hamburger menu (native `<details>` — no JS dependency) with all 7 items incl. Contact + Book a Call CTA; animated open/close icon; no clipping, wrapping, or dead links.
- **Contact link target:** `08-Contact.dc.html` in the preview package (maps to `/contact` in production — see build prompt addendum).
- All links resolve to the 8 approved routes.

---

## 5. Motion preservation checklist

Unchanged and verified present: homepage hero blob/path/typewriter animation, live workflow demo tabs (chat/email/terminal), calculator pulse + value bump, testimonial counter-marquee, `data-reveal`/`fm-rv` section reveals, CTA gold sweep, card hover lifts.
