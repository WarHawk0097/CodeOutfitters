# 03 — Component Blueprints

## File structure Claude Code must create

```text
components/ui/
  button.tsx
  card.tsx
  badge.tsx
  accordion.tsx              (Radix-based, drives faq-accordion.tsx)
  bento-grid.tsx
  background-gradient-animation.tsx
  testimonial-carousel.tsx
  process-timeline.tsx
  book-a-call-button.tsx
  integrations-marquee.tsx
  command-search.tsx         (Services ⌘K search)

components/layout/
  site-header.tsx
  site-footer.tsx

components/sections/home/
  announcement-bar.tsx, hero.tsx, services-bento.tsx, cost-calculator.tsx,
  process-preview.tsx, case-studies-preview.tsx, testimonials-marquee.tsx,
  faq.tsx, final-cta.tsx

components/sections/services/
  hero-search.tsx, services-bento.tsx, integrations-marquee.tsx, faq.tsx, final-cta.tsx

components/sections/industries/
  hero.tsx, industries-bento.tsx, common-needs.tsx, example-workflows.tsx,
  proof-stats.tsx, faq.tsx, final-cta.tsx

components/sections/process/
  hero.tsx, timeline.tsx, why-no-packages.tsx, faq.tsx, final-cta.tsx

components/sections/about/
  hero.tsx, mission.tsx, principles-bento.tsx, how-we-work.tsx,
  quality-mindset.tsx, trust-cards.tsx, final-cta.tsx

components/sections/security/
  hero.tsx, access-bento.tsx, ai-guardrails.tsx, reliability-bento.tsx,
  integrations-marquee.tsx, faq.tsx, final-cta.tsx

components/sections/case-studies/
  hero.tsx, filter-bar.tsx, case-grid.tsx, testimonials-carousel.tsx, final-cta.tsx

components/sections/contact/
  hero-form.tsx, whats-next.tsx, other-ways.tsx, faq.tsx

data/
  site.ts, services.ts, industries.ts, process.ts, security.ts,
  case-studies.ts, faqs.ts, testimonials.ts, about.ts, integrations.ts
```

Design tokens (do not invent new values — pull all colors/type/radii/easing from these):

- Colors: ink `#0A120E`, deep emerald `#0E2A1D` / `#10301F`, brand green `#17A063`, bright green `#2BD483`, link green `#128A54`, gold `#D9B36A` (hover `#E7C57E`), paper `#F7F2EA`, card cream gradient `#FBF7EE → #F6F1E4`, dark band `#0E241A`, footer `#070D0A`.
- Type: `Space Grotesk` 500–700 (headings/numbers), `Instrument Sans` 400–700 (body/UI), both via Google Fonts.
- Easing: premium `cubic-bezier(.16,1,.3,1)`, spring `cubic-bezier(.34,1.56,.64,1)`.
- Radii: cards 20–22px, buttons 10–13px, pills 999px.

---

## `components/ui/bento-grid.tsx`

**Purpose:** 12-column responsive bento grid + spotlight card, used on Services, Industries, About, Security, Homepage, Case Studies.
**Used on:** Services grid, Industries grid, About beliefs, Security practice cards, Homepage services preview, Case Studies grid.
**Source 21st pattern:** `bento-grid.tsx` (BentoGrid/BentoCard) + `feature-section-with-bento-grid.tsx` (asymmetric span layout) merged into one flexible primitive — not the literal file-drop demo (that demo's fixed `lg:row-start` layout doesn't fit this content shape).
**Props:**
```ts
interface BentoGridProps { className?: string; children: ReactNode; }
interface BentoCardProps {
  span?: "full" | "half" | "third"; // maps to col-span classes at each breakpoint
  className?: string;
  onMouseMove?: (e: MouseEvent) => void; // drives spotlight glow position
  children: ReactNode;
}
```
**Data:** whatever the section passes as children (ServiceItem, IndustryItem, etc — see `04-DATA-MODELS.md`).
**States:** default, hover (lift -6px, spotlight radial glow follows cursor via CSS custom properties `--sx`/`--sy`, border tint shift), focus-visible (visible outline for keyboard nav).
**Motion:** hover transform/box-shadow at 500ms `cubic-bezier(.16,1,.3,1)`; spotlight opacity fade 350ms; icon tile rotates -3deg + lifts 2px on card hover, 500ms spring easing.
**Desktop layout:** 12-col grid, cards span 7/5 or 5/7 alternating (never uniform equal columns) — see exact spans per page in `01-FRONTEND-IMPLEMENTATION-MAP.md`.
**Tablet layout:** spans collapse to 6/6 or stay asymmetric down to ~900px depending on section.
**Mobile layout:** ≤820px — single column, `grid-column: auto` on every card.
**Do not:** render a plain equal-width card grid; that fails services/industries acceptance criteria explicitly.

---

## `components/ui/background-gradient-animation.tsx`

**Purpose:** Slow drifting radial-gradient atmosphere layer behind hero/CTA sections.
**Used on:** Homepage hero, Services hero, Contact hero, About hero (one hero each, not stacked pages of it).
**Source 21st pattern:** `background-gradient-animation.tsx`, simplified — CodeOutfitters uses it as a subtle background layer (2–3 low-opacity blobs drifting), not the full interactive mouse-following version with 5 colors + blend-mode gooeyness. Keep the interactive pointer-follow blob OUT unless a hero specifically calls for it; default to the simpler `heroBlob` 16s ease-in-out drift already proven in the design files.
**Props:**
```ts
interface BackgroundGradientProps {
  className?: string;
  colors?: string[]; // defaults to brand green/gold blobs
}
```
**Data:** none (visual only).
**States:** always-on ambient animation; must respect `prefers-reduced-motion`.
**Motion:** `translate3d` + `scale` drift, 16s ease-in-out infinite, `will-change: transform`.
**Desktop/tablet/mobile:** identical, purely absolutely positioned within its hero container (`position:absolute;inset:-20%`), clipped by `overflow:hidden` on the parent.
**Do not:** let it bleed outside its hero section, or apply it to more than one section per page.

---

## `components/ui/process-timeline.tsx`

**Purpose:** Center-spine, alternating-card process timeline with scroll-progress fill.
**Used on:** Process page (7-step full timeline), Homepage (3–4 step preview).
**Source 21st pattern:** `process-timeline.tsx` (ContainerScroll/ProcessCard), adapted from its horizontal-scroll-card version to a **vertical center-spine alternating** layout (matches the approved design; the horizontal drag-scroll variant is not used).
**Props:**
```ts
interface TimelineStep { n: number; label: string; title: string; desc: string; isSupportStep?: boolean; }
interface ProcessTimelineProps { steps: TimelineStep[]; }
```
**Data:** `data/process.ts` → `processSteps`.
**States:** spine unfilled → filled (scroll-triggered), card default → hover (lift -4px).
**Motion:** spine fill `scaleY(0)→scaleY(1)`, `transform-origin: top`, 1.8–1.9s premium easing, triggered on mount/in-view; final "30-day support" node uses a distinct gradient fill + label.
**Desktop layout:** center spine, cards alternate left/right in a 3-col grid (`1fr 104px 1fr`).
**Tablet:** same as desktop down to 760px.
**Mobile (≤760px):** spine moves to left rail (31px), all cards align right of it in single column, node shrinks to 52px.
**Do not:** use the horizontal drag-scroll interaction from the raw 21st demo; do not add generic "funding round" timeline copy — steps are fixed to Discovery → Audit → Proposal → Build → Testing → Handoff → Support.

---

## `components/ui/testimonial-carousel.tsx`

**Purpose:** Two variants — (a) auto-rotating single-slide crossfade (Case Studies), (b) counter-scrolling marquee (Homepage).
**Used on:** Case Studies (rotating), Homepage (marquee).
**Source 21st pattern:** `testimonial.tsx` card visual style, re-implemented with two layout modes.
**Props:**
```ts
interface TestimonialCarouselProps {
  items: TestimonialItem[];
  variant: "rotating" | "marquee";
  intervalMs?: number; // default 5200, rotating variant only
}
```
**Data:** `data/testimonials.ts`.
**States:** rotating — active/inactive slide (opacity+translateY crossfade), dot active/inactive; marquee — running/paused-on-hover.
**Motion:** rotating crossfade 600ms premium easing, auto-advance every 5.2s, resets timer on manual dot click; marquee two rows at differing speeds (52s / 60s) with edge-fade mask, `animation-play-state:paused` on container hover.
**Desktop/tablet/mobile:** rotating variant shrinks quote font via `clamp()`; marquee variant shrinks card width to `min(300px, 84vw)` ≤640px.
**Do not:** present testimonials as verified real customers — must carry "Illustrative feedback based on the sample projects above" disclosure.

---

## `components/ui/accordion.tsx` (drives FAQ Accordion sections)

**Purpose:** Single-open accordion with rotating chevron badge.
**Used on:** every page's FAQ section, and each service card's "How it works" expandable + each case study's "Read the full story" expandable.
**Source 21st pattern:** `faq-accordion.tsx` (Radix Accordion wrapper), restyled to brand (icon-free trigger row, not the HelpCircle/MessageCircle icon treatment from the raw demo — CodeOutfitters uses a plain chevron badge instead).
**Props:**
```ts
interface AccordionItemData { q: string; a: string; }
interface FaqAccordionProps { items: AccordionItemData[]; }
```
**Data:** `data/faqs.ts`, filtered by `page`.
**States:** closed/open per item, only one open at a time (`type="single" collapsible` in Radix terms).
**Motion:** `max-height` + `opacity` transition 450ms premium easing (or Radix's built-in `accordion-down`/`accordion-up` keyframes if using native Radix animation); chevron rotates 180deg with a small pop (`cubic-bezier(.34,1.56,.64,1)`).
**Desktop/tablet/mobile:** identical single-column stack at all sizes.
**Do not:** allow multiple items open simultaneously; do not use the raw demo's HelpCircle/MessageCircle iconography — brand uses a plain circular chevron toggle only.

---

## `components/ui/integrations-marquee.tsx`

**Purpose:** Two counter-scrolling rows of tool chips with edge-fade masks.
**Used on:** Services page, Security page.
**Source 21st pattern:** `integrations-section.tsx` / `integration-hero.tsx`, merged — CodeOutfitters uses text chips (tool name + colored dot), not the raw demo's clipped-hexagon logo tiles (no third-party logo assets are licensed for this build).
**Props:**
```ts
interface IntegrationsMarqueeProps { rowOne: string[]; rowTwo: string[]; }
```
**Data:** `data/integrations.ts`.
**States:** running / paused (not required to pause on hover, but acceptable).
**Motion:** `translate3d` drift, row 1 at 38s linear infinite, row 2 at 44s reverse, both loop seamlessly (duplicate the list once, translate -50%).
**Desktop/tablet/mobile:** chip padding/font shrinks slightly ≤640px; edge-fade gradient masks stay fixed width (80px) at all sizes.
**Do not:** use real third-party logo images without a licensing review — text+dot chips only.

---

## `components/ui/book-a-call-button.tsx`

**Purpose:** Primary CTA button with shine-sweep hover.
**Used on:** every nav bar, every page's final CTA panel, hero primary actions.
**Source 21st pattern:** `book-a-call-button.tsx`, restyled — brand uses a gold gradient (full CTA card variant) or solid green (nav/hero variant), not the blue gradient from the raw demo; icon swapped to a simple arrow (no phone icon swap animation required, though it's an acceptable optional embellishment).
**Props:**
```ts
interface BookACallButtonProps {
  variant?: "gold" | "green" | "nav";
  href: string; // always resolves to /contact
  children: ReactNode;
}
```
**Data:** none (label passed as children per usage).
**States:** default / hover (lift -2 to -3px + shadow bloom + shine sweep) / active (scale .97).
**Motion:** shine sweep — skewed white gradient bar sweeps left→right over 650ms premium easing on hover.
**Desktop/tablet/mobile:** full width on mobile inside CTA cards; auto width in nav/hero.
**Do not:** point anywhere except `/contact`; do not add a pricing tooltip.

---

## `components/sections/services/hero-search.tsx` (Command search)

**Purpose:** ⌘K-focusable live search over services.
**Used on:** Services page hero only.
**Source 21st pattern:** custom (no direct 21st command-palette component was in the source prompt file; built to match the command-palette *pattern* referenced generally in the brief as part of the Services acceptance criteria "search/filter services area").
**Props:** none external — reads `services` from `data/services.ts` directly, or accepts `items: ServiceItem[]`.
**Data:** `data/services.ts`.
**States:** empty / typing (dropdown open) / no-results.
**Motion:** dropdown fade+slide in 200ms; ⌘K focuses input from anywhere on the page; Escape clears + blurs.
**Desktop/tablet/mobile:** search bar full width up to 520px max; dropdown scrolls internally past 280px height.
**Do not:** replace this with a page-reload search — must be instant client-side filtering.

---

## `components/sections/case-studies/filter-bar.tsx`

**Purpose:** Industry filter pills that drive the case grid below.
**Used on:** Case Studies page only.
**Props:** `{ industries: string[]; active: string; onSelect: (v: string) => void }`.
**Data:** derived from `data/case-studies.ts` (unique industries + "All").
**States:** active pill (filled dark), inactive (light), hover lift.
**Motion:** pill hover lift 1px; grid re-renders with the existing card stagger-reveal, not a hard cut.
**Do not:** navigate/reload on filter — client-side state only.
