# 07 — Claude Code Build Prompt

Copy everything below this line into Claude Code as the build instruction.

---

You are implementing the CodeOutfitters marketing website as a native Next.js (App Router) + Tailwind CSS + TypeScript + shadcn-style codebase, using the frontend-ready spec package in `CodeOutfitters-fable-enhanced-21st-frontend-ready/`. This package is the single source of truth — ignore any earlier package or older components.

Read, in this order, before writing any code:
1. `01-FRONTEND-IMPLEMENTATION-MAP.md` — the section-by-section component map for all 8 pages.
2. `02-PAGE-BY-PAGE-SPEC.md` — exact section order and copy per page.
3. `03-COMPONENT-BLUEPRINTS.md` — exact file structure, props, states, and motion per component.
4. `04-DATA-MODELS.md` — exact TypeScript interfaces and real sample data to seed `data/*.ts`.
5. `05-INTERACTION-MOTION-SPEC.md` — exact animation timings/easings.
6. `06-RESPONSIVE-QA-SPEC.md` — breakpoints and the QA checklist you must pass before calling any page done.
7. `08-PAGE-ENHANCEMENT-CHANGELOG.md` — what the latest enhancement pass added on top of the baseline (hover accent bars, hero blob layers, marquee pause, featured ring, reduced-motion rule); all of it is live in the previews and must be implemented.
8. `design-preview/*.dc.html` — these are **HTML design references**, not code to copy-paste. They show exact layout, spacing, color, and copy. Recreate their look and behavior in real React components using this codebase's conventions — do not literally serialize the HTML into JSX.

## Hard rules

- Implement native Next.js App Router pages and real Tailwind/shadcn-style components. Do not use `.dc.html` injection, iframes, or any non-native rendering of the design files — they are reference only.
- Do not reuse old/mismatched components from any previous implementation attempt in this codebase. If a `components/` directory already exists with components that don't match `03-COMPONENT-BLUEPRINTS.md`, replace them — do not patch around stale ones.
- Do not implement, reference, or leave scaffolding for a pricing page, pricing table, plan cards, or any `/pricing` route. The only allowed pricing language anywhere on the site is: "custom quote after discovery", "fixed scope after audit", "clear proposal", "timeline after discovery", and the homepage manual-labor-cost calculator (which computes the customer's own time cost, never a service price).
- The final site has exactly 8 public pages: `/`, `/services`, `/industries`, `/process`, `/about`, `/security`, `/case-studies`, `/contact`. No `/blog`, no `/careers`, no `/privacy`, no `/terms`, no `href="#"` placeholders.
- Never claim SOC 2, HIPAA, ISO, or GDPR certification, an official partnership, guaranteed uptime, or "bank-level security" anywhere in copy or metadata.
- All case studies and testimonials are illustrative/sample data — keep the "Sample project" and "Illustrative feedback" labels in the UI exactly as specified.

## Required workflow — one page first

Because a previous implementation attempt reused old components and produced a bad result, you must follow this sequence exactly and **stop for approval after step 1**:

1. Convert `/services` only, using `03-COMPONENT-BLUEPRINTS.md` and the Services rows of `01-FRONTEND-IMPLEMENTATION-MAP.md` exactly.
2. Compare your `/services` build against `design-preview/02-Services.dc.html` and this spec — check every acceptance criterion listed for Services in `01-FRONTEND-IMPLEMENTATION-MAP.md` and every relevant row of `06-RESPONSIVE-QA-SPEC.md`.
3. Run the build (`next build` or equivalent) and confirm it's clean.
4. Provide screenshots (desktop + mobile widths) and a short proof-notes summary: which acceptance criteria pass, and any deviations with justification.
5. **Stop.** Do not continue to any other page until the team explicitly approves the `/services` implementation.
6. Only after approval, continue with the remaining 7 pages in this order: `/`, `/industries`, `/process`, `/about`, `/security`, `/case-studies`, `/contact` — applying the same build → compare → screenshot → proof-notes discipline per page.

The approval gate for step 1 is: **`CODEOUTFITTERS_SERVICES_NATIVE_REACT_PARITY0`**

Do not proceed past this gate without explicit sign-off, even if the rest of the spec is fully read and understood.


---

## v3 REPAIR ADDENDUM — build these exactly as in the v3 previews

- **Homepage integrations hub** (`01-Homepage.dc.html`, section `#integrations`): center hub card + 12 unique tool nodes (WhatsApp, Slack, HubSpot, Notion, Airtable, Google Sheets, Stripe, Shopify, Calendly, Zapier, Make, n8n) over an SVG line layer with dashed flow + travelling pulse dots; node float + hub breathing; ≤860px falls back to hub banner + tile grid. Never render a duplicated marquee wall here.
- **FAQ accordion** (all pages with FAQ): compact trigger row (numbered marker · question · circular chevron), answer expands in the same card via `grid-template-rows 0fr→1fr`; open state = emerald border + left accent + glow ring; chevron rotates 180°; single-open; keyboard operable; keep page-specific copy.
- **Security architecture** (`06-Security-Reliability.dc.html`): grouped tool cards with per-tool scope tags → shield checkpoint badges → central control-layer hub (Scoped access / Server-side secrets / Human approval / Logging / Rollback). Do not reuse the homepage layout. Never add compliance certifications or partner claims.
- **Nav**: Home, Services, Industries, Process, Case Studies, About, Contact on every page; Contact links to `/contact`; Book a Call CTA far right; ≤960px hamburger menu containing all items + CTA.
- Preserve all existing hero / workflow demo / calculator / testimonial / reveal / CTA motion.


---

## v5 REPAIR ADDENDUM — exact component mechanics

- **MarqueeLogoScroller** (homepage `#integrations` + Security): build the supplied component exactly — bordered container, two-column [3fr/2fr] header with border-b, edge-masked viewport, one flex `w-max` track animated `translateX(0→-50%)` with the logo array rendered twice, `hover:[animation-play-state:paused]`, per-card hover gradient + lift, `speed` prop (home 40s / security 44s). Homepage logos: n8n, Make, Zapier, Airtable, Google Sheets, Slack, HubSpot, Notion, WhatsApp, Shopify, Stripe, Calendly (unique, exact alt labels; no demo logos, no "Trusted by"/partner claims). Security: same component + a control band (Scoped access / Server-side secrets / Human approval / Activity logging / Rollback path), per-card group tags, darker palette, checkpoint pulses; no compliance/partner claims.
- **FAQAccordionBlock** (Home, Services, Industries, Process, Security, Contact): supplied structure — Badge header + title + description, single-open `openIndex`, entrance animation per item, `AnimatePresence` height+opacity, rotating chevron, same-card answer under a top divider, hover border/shadow, `:focus-visible` ring. Compact rows (64–80px closed). Keep each page's own CodeOutfitters Q&A; no plan/pricing/refund demo copy. Homepage cost answer = the approved "scoped individually after the discovery call…" text. Bottom CTA ("Still have a workflow question?" → "Talk to Us" → /contact) on Home + Services only.
- **Reduced motion:** implement the provided `@media (prefers-reduced-motion: reduce)` block (marquee static wrapped grid; FAQ transitions ~0ms).
- Preserve all existing hero / workflow demo / calculator / testimonials / process timeline / case-study / CTA motion.


---

## v6 FIDELITY ADDENDUM
- Build **MarqueeLogoScroller** exactly as supplied; use real brand logo SVGs (`assets/logos/`), large logo-dominant cards, bordered shell, [3fr_2fr] header + separator, masked track, logos ×2, translateX(0→-50%), pause-on-hover, gradient+lift. Homepage 40s / Security 44s. Security wraps it with a control band (Scoped access / Server-side secrets / Human approval / Activity logging / Rollback path) + per-card group tags + darker palette. No letter placeholders, no remote logo deps, no partner/compliance claims.
- Build **FAQAccordionBlock** in its **dark** form on Home/Services/Industries/Process/Security/Contact: near-black emerald section, dark charcoal cards, thin neutral borders, small chevron, same-card expansion, dark CTA card (Home + Services only). Keep each page's own copy; no plan/pricing/refund/SLA demo content.
