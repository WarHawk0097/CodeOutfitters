# 01 — Frontend Implementation Map

Source of truth: the 8 HTML design files in `/design-preview/`. Every row below maps a live section in those files to a specific 21st.dev component pattern, the React component Claude Code must create, its data file, and acceptance criteria. No pricing components appear anywhere in this map — pricing components from the source prompt file are permanently excluded (see `07-CLAUDE-CODE-BUILD-PROMPT.md`).

Legend: **Pattern used** = the 21st.dev source component this section must be implemented as (component logic/behavior, not literal copy-paste of the demo). **Component to create** = the actual file Claude Code writes.

## Homepage (`/`)

| Section | Pattern used | Source prompt | React component | Data file | Interaction | Responsive | Acceptance |
|---|---|---|---|---|---|---|---|
| Announcement bar | — (plain banner) | — | `components/sections/home/announcement-bar.tsx` | `data/site.ts` | Dismissible, links to `#cta` | Full width, wraps on mobile | Dismiss persists in session |
| Hero | Background Gradient Animation (behind), custom live console mock | `background-gradient-animation.tsx` | `components/sections/home/hero.tsx` + `components/ui/background-gradient-animation.tsx` | `data/site.ts` | Tabbed live demo (WhatsApp/Email/Support), animated task list | Stacks to 1 col ≤900px, console below copy | Gradient behind hero only, subtle, reduced-motion safe |
| Services preview (bento) | Feature Section with Bento Grid / Bento Grid | `feature-section-with-bento-grid.tsx`, `bento-grid.tsx` | `components/sections/home/services-bento.tsx` | `data/services.ts` | Hover reveal CTA, metric strip | 12-col → 1-col ≤900px | Real bento spans, not equal-size cards |
| ROI / manual-labor-cost calculator | Custom (slider-driven result panel; no 21st pricing component used) | — | `components/sections/home/cost-calculator.tsx` | inline calc constants in `data/site.ts` | Sliders update live result panel with pulse animation | 2-col → 1-col ≤760px | No currency tiers/plans; framed as "your current cost", not a price for our services |
| Process preview | Process Timeline | `process-timeline.tsx` | `components/sections/home/process-preview.tsx` | `data/process.ts` (first 3–4 steps) | Scroll-linked progress fill | Center spine → left rail ≤760px | Links to `/process` for full timeline |
| Case studies / proof preview | Bento case cards | `bento-grid.tsx` | `components/sections/home/case-studies-preview.tsx` | `data/case-studies.ts` | Hover lift, metric band | 2-col → 1-col ≤820px | "Sample project" labels retained |
| Testimonials | Customer Testimonials (marquee variant) | `testimonial.tsx` | `components/sections/home/testimonials-marquee.tsx` | `data/testimonials.ts` | Two counter-scrolling rows, pause on hover | Card width shrinks ≤640px | "Illustrative feedback" disclosure retained |
| FAQ | FAQ Accordion | `faq-accordion.tsx` | `components/sections/home/faq.tsx` | `data/faqs.ts` (homepage subset) | Single-open accordion, rotating chevron | Full width, stacks naturally | Only one item open at a time |
| Final CTA | Book A Call / CTA pattern | `book-a-call-button.tsx` | `components/sections/home/final-cta.tsx` | `data/site.ts` | Shine-sweep hover on button | 2-col → 1-col ≤860px | Links to `/contact` |

## Services (`/services`) — **first implementation gate, see gate `CODEOUTFITTERS_SERVICES_NATIVE_REACT_PARITY0`**

| Section | Pattern used | Source prompt | React component | Data file | Interaction | Responsive | Acceptance |
|---|---|---|---|---|---|---|---|
| Services hero + search | Background Gradient Animation (subtle) + custom command palette | `background-gradient-animation.tsx` | `components/sections/services/hero-search.tsx` | `data/services.ts` | ⌘K focuses search input, live-filters dropdown of services | Search bar full width, dropdown scrolls | ⌘K and Escape both work; no-results state shown |
| Services bento grid | Feature Section with Bento Grid / Bento Grid | `feature-section-with-bento-grid.tsx`, `bento-grid.tsx` | `components/sections/services/services-bento.tsx` | `data/services.ts` | Cursor-tracking spotlight glow per card, hover lift, expandable "How it works" per card | 7/5/5/7/7/5-span 12-col grid → 1-col ≤820px | Real bento spans (not uniform grid); expand/collapse works independently per card |
| Integrations marquee | Integrations Section / Integration Hero | `integrations-section.tsx`, `integration-hero.tsx` | `components/sections/services/integrations-marquee.tsx` | `data/integrations.ts` | Two rows, counter-scrolling, edge fade masks | Rows shrink chip size ≤640px | Visually impressive: two independent speeds, not a single static row |
| FAQ | FAQ Accordion | `faq-accordion.tsx` | `components/sections/services/faq.tsx` | `data/faqs.ts` (services subset) | Single-open accordion | Stacks naturally | Matches homepage FAQ interaction exactly |
| Final CTA | Book A Call / CTA pattern | `book-a-call-button.tsx` | `components/sections/services/final-cta.tsx` | `data/site.ts` | Shine-sweep hover | 2-col → 1-col ≤860px | Links to `/contact` |

## Industries (`/industries`)

| Section | Pattern used | Source prompt | React component | Data file | Interaction | Responsive | Acceptance |
|---|---|---|---|---|---|---|---|
| Industries hero | Plain hero (no motion component) | — | `components/sections/industries/hero.tsx` | `data/site.ts` | — | Centered, text wraps | — |
| Industry bento grid | Bento Grid / Feature Bento | `bento-grid.tsx` | `components/sections/industries/industries-bento.tsx` | `data/industries.ts` | Spotlight hover glow per card | 7/5/5/7/7/5/12-span grid → 1-col ≤820px | Each card shows problems + automation examples + tools, not icon-only |
| Common needs strip | Feature Bento (4-up stat cards) | `bento-grid.tsx` | `components/sections/industries/common-needs.tsx` | `data/industries.ts` | Static, reveal-on-scroll | 4-col → 2-col ≤760px → 1-col ≤560px | — |
| Example workflows | Feature Bento (3-up) | `bento-grid.tsx` | `components/sections/industries/example-workflows.tsx` | `data/industries.ts` | Numbered step list per card | 3-col → 1-col ≤900px | — |
| Proof stats strip | Custom stat strip | — | `components/sections/industries/proof-stats.tsx` | `data/industries.ts` | Reveal-on-scroll | Auto-fit grid | — |
| FAQ | FAQ Accordion | `faq-accordion.tsx` | `components/sections/industries/faq.tsx` | `data/faqs.ts` (industries subset) | Single-open accordion | Stacks naturally | — |
| Final CTA | Book A Call / CTA pattern | `book-a-call-button.tsx` | `components/sections/industries/final-cta.tsx` | `data/site.ts` | Shine-sweep hover | 2-col → 1-col ≤860px | — |

## Process (`/process`)

| Section | Pattern used | Source prompt | React component | Data file | Interaction | Responsive | Acceptance |
|---|---|---|---|---|---|---|---|
| Process hero | Plain hero | — | `components/sections/process/hero.tsx` | `data/site.ts` | — | Centered | No pricing chips |
| 7-step timeline | Process Timeline (center-spine variant, not the horizontal-scroll variant) | `process-timeline.tsx` | `components/ui/process-timeline.tsx` + `components/sections/process/timeline.tsx` | `data/process.ts` | Progress spine fills on scroll into view; card hover lift | Center spine → left rail ≤760px | Spine visibly fills top-to-bottom; steps alternate left/right on desktop |
| Why no packages | Feature Bento (3-up statement cards) | `bento-grid.tsx` | `components/sections/process/why-no-packages.tsx` | `data/process.ts` | — | 3-col → 1-col ≤820px | Explicitly states custom-quote-after-discovery model; no pricing table |
| FAQ | FAQ Accordion | `faq-accordion.tsx` | `components/sections/process/faq.tsx` | `data/faqs.ts` (process subset) | Single-open accordion | Stacks naturally | — |
| Final CTA | Book A Call / CTA pattern | `book-a-call-button.tsx` | `components/sections/process/final-cta.tsx` | `data/site.ts` | Shine-sweep hover | 2-col → 1-col ≤860px | — |

## About (`/about`)

| Section | Pattern used | Source prompt | React component | Data file | Interaction | Responsive | Acceptance |
|---|---|---|---|---|---|---|---|
| About hero | Background Gradient Animation (subtle, once) | `background-gradient-animation.tsx` | `components/sections/about/hero.tsx` | `data/site.ts` | — | Centered | No fake founder photos/names |
| Mission statement | Plain text block | — | `components/sections/about/mission.tsx` | `data/site.ts` | — | Centered, max-width | — |
| Principles bento ("What we believe") | Feature Bento | `bento-grid.tsx` | `components/sections/about/principles-bento.tsx` | `data/about.ts` | Spotlight hover glow | 7/5/5/7-span grid → 1-col ≤820px | — |
| How we work | Feature Bento (4-up) | `bento-grid.tsx` | `components/sections/about/how-we-work.tsx` | `data/about.ts` | Reveal-on-scroll | 4-col → 1-col ≤760px | — |
| Quality & tool mindset | 2-col text feature | — | `components/sections/about/quality-mindset.tsx` | `data/about.ts` | — | 2-col → 1-col ≤820px | — |
| Trust cards | Feature Bento (3-up) | `bento-grid.tsx` | `components/sections/about/trust-cards.tsx` | `data/about.ts` | Reveal-on-scroll | 3-col → 1-col ≤760px | — |
| Final CTA | Book A Call / CTA pattern | `book-a-call-button.tsx` | `components/sections/about/final-cta.tsx` | `data/site.ts` | Shine-sweep hover | 2-col → 1-col ≤860px | — |

## Security & Reliability (`/security`)

| Section | Pattern used | Source prompt | React component | Data file | Interaction | Responsive | Acceptance |
|---|---|---|---|---|---|---|---|
| Security hero | Plain hero | — | `components/sections/security/hero.tsx` | `data/site.ts` | — | Centered | No SOC2/HIPAA/ISO/uptime claims anywhere |
| Access & secrets bento | Feature Bento (1 full-width + 2 half) | `bento-grid.tsx` | `components/sections/security/access-bento.tsx` | `data/security.ts` | Static | 6-col spans → 1-col ≤820px | — |
| AI guardrails / testing | 2-col text feature | — | `components/sections/security/ai-guardrails.tsx` | `data/security.ts` | — | 2-col → 1-col ≤820px | Explicitly states human review of sensitive actions |
| Reliability & handoff bento | Feature Bento (2 half + 1 full-width) | `bento-grid.tsx` | `components/sections/security/reliability-bento.tsx` | `data/security.ts` | Static | 6-col spans → 1-col ≤820px | — |
| Integrations / scoped access marquee | Integrations Section | `integrations-section.tsx` | `components/sections/security/integrations-marquee.tsx` | `data/integrations.ts` | Counter-scrolling rows | Chip size shrinks ≤640px | — |
| FAQ | FAQ Accordion | `faq-accordion.tsx` | `components/sections/security/faq.tsx` | `data/faqs.ts` (security subset) | Single-open accordion | Stacks naturally | Includes explicit "no formal certifications today" answer |
| Final CTA | Book A Call / CTA pattern | `book-a-call-button.tsx` | `components/sections/security/final-cta.tsx` | `data/site.ts` | Shine-sweep hover | 2-col → 1-col ≤860px | — |

## Case Studies (`/case-studies`)

| Section | Pattern used | Source prompt | React component | Data file | Interaction | Responsive | Acceptance |
|---|---|---|---|---|---|---|---|
| Case studies hero | Plain hero | — | `components/sections/case-studies/hero.tsx` | `data/site.ts` | — | Centered | "Sample work" badge visible |
| Industry filter pills | Custom filter (not a 21st component, but drives the bento below) | — | `components/sections/case-studies/filter-bar.tsx` | `data/case-studies.ts` | Click pill → filters grid, cross-fade | Wraps to multiple rows on mobile | Filtering client-side, animated |
| Filterable case cards | Bento case cards | `bento-grid.tsx` | `components/sections/case-studies/case-grid.tsx` | `data/case-studies.ts` | Spotlight hover, expandable "Read the full story", metric band | 2-col → 1-col ≤760px | Each card labeled "Sample project"; expand reveals problem/solution |
| Testimonials carousel | Customer Testimonials (rotating single-slide variant) | `testimonial.tsx` | `components/sections/case-studies/testimonials-carousel.tsx` | `data/testimonials.ts` | Auto-advance 5.2s, clickable dots reset timer | Quote font scales down on mobile | "Illustrative feedback" disclosure retained |
| Final CTA | Book A Call / CTA pattern | `book-a-call-button.tsx` | `components/sections/case-studies/final-cta.tsx` | `data/site.ts` | Shine-sweep hover | 2-col → 1-col ≤860px | — |

## Contact (`/contact`)

| Section | Pattern used | Source prompt | React component | Data file | Interaction | Responsive | Acceptance |
|---|---|---|---|---|---|---|---|
| Contact hero + form | Background Gradient Animation (behind) + custom Contact/Form pattern | `background-gradient-animation.tsx` | `components/sections/contact/hero-form.tsx` | `data/site.ts` | Controlled form, client-side validation, success state swap | 2-col → 1-col ≤900px | Required fields enforced; no real backend claimed |
| What happens next | Numbered step list | — | `components/sections/contact/whats-next.tsx` | `data/site.ts` | — | Inline with hero copy | — |
| Trust chips | Inline chip row | — | (part of `hero-form.tsx`) | `data/site.ts` | — | Wraps | — |
| Other ways to reach | Pill link row | — | `components/sections/contact/other-ways.tsx` | `data/site.ts` | Hover lift | 3-col → 1-col ≤640px | — |
| Mini FAQ | FAQ Accordion | `faq-accordion.tsx` | `components/sections/contact/faq.tsx` | `data/faqs.ts` (contact subset) | Single-open accordion | Stacks naturally | — |

## Shared / global

| Element | Pattern used | React component | Data file |
|---|---|---|---|
| Site header/nav | Custom (not a 21st component) | `components/layout/site-header.tsx` | `data/site.ts` |
| Site footer | Custom | `components/layout/site-footer.tsx` | `data/site.ts` |
| Primary CTA button | Book A Call Button | `components/ui/book-a-call-button.tsx` | — |
