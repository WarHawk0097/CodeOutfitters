# 08 — Page Enhancement Changelog (Fable enhancement pass)

Baseline: `CodeOutfitters-frontend-ready-21st-implementation/` (previous package). This pass upgrades the `design-preview/` HTML and the docs. Every change below is live in the preview files — Claude Code implements what it sees.

## Package-wide changes

1. **Dead-link repair.** All internal nav/footer/anchor links in `design-preview/` previously pointed at old filenames (`CodeOutfitters%20*.dc.html`) and were broken. Every link (165 total across 8 pages) now resolves to the numbered preview files — the 8-page preview is fully click-navigable.
2. **Bento hover reveal (21st `bento-grid.tsx` BentoCard pattern).** Every `.spot-card` now has a bottom accent bar (green→gold gradient) that sweeps in on hover (`scaleX(0)→scaleX(1)`, 550ms premium easing), in addition to the existing lift + cursor-tracking spotlight. This is the visible "hover reveal action" on all bento cards: Services grid, Industries grid, About beliefs, Case Studies cards.
3. **Background Gradient Animation on every hero (21st `background-gradient-animation.tsx` pattern, simplified).** All 8 page heroes now carry two independently drifting radial-gradient blob layers (16s and 22s counter-phased ease-in-out loops) — previously only Services and Contact had one layer. Homepage keeps its grid-line layer underneath.
4. **Integrations marquee polish (21st `integrations-section.tsx` / `integration-hero.tsx`).** Tool chips now have a hover state (lift + green border + white text) and both marquee rows pause on container hover (Services + Security).
5. **Reduced-motion fallback baked in.** The exact `prefers-reduced-motion` rule from `05-INTERACTION-MOTION-SPEC.md` is now in every preview file, not just the spec.
6. **CTA press state.** `.cta-button-v7:active` scale-down added everywhere the gold CTA appears.

## Per-page proof of component use

### Homepage (`/`)
- **Section:** Hero. **Pattern:** Background Gradient Animation. **Visible as:** two drifting blob layers over the grid-line hero. **React component:** `components/ui/background-gradient-animation.tsx` inside `sections/home/hero.tsx`. **Data:** none. **Motion:** 16s/22s counter-phased drift. **Mobile:** identical, clipped by hero.
- **Section:** Services preview. **Pattern:** Feature Bento / Bento Grid. **Visible as:** asymmetric spans + spotlight + new hover accent bar. **Component:** `sections/home/services-bento.tsx`. **Data:** `data/services.ts`. **Motion:** stagger reveal, hover lift/bar. **Mobile:** 1-col.
- **Sections:** Testimonials (marquee), FAQ (single-open accordion), Final CTA (gold sweep button) — unchanged patterns from baseline, now with press state + reduced-motion support.

### Services (`/services`)
- **Section:** Featured service bento. **Pattern:** Feature Section with Bento Grid. **Visible as:** card 01 (WhatsApp, "Most popular") now carries a gold featured ring + outer glow, making the featured span visually distinct from the other five; spans remain 7/5/5/7/7/5. **Component:** `sections/services/services-bento.tsx`. **Data:** `data/services.ts`. **Motion:** spotlight, lift, accent bar, expand/collapse "How it works". **Mobile:** 1-col, featured ring retained.
- **Section:** Hero + search. **Pattern:** Background Gradient Animation + command search. **Visible as:** second blob layer added; ⌘K search unchanged. 
- **Section:** Integrations. **Pattern:** Integrations Section. **Visible as:** chips now hover-respond and rows pause on hover. **Motion:** 38s/44s counter-scroll, pause on hover.
- **Sections:** FAQ accordion, final CTA — baseline patterns + press/reduced-motion.

### Industries (`/industries`)
- **Section:** Hero. **Pattern:** Background Gradient Animation — blob layers added (was static).
- **Section:** Industry bento. **Pattern:** Bento Grid. **Visible as:** 7/5/5/7/7/5/12 spans + spotlight + new hover accent bar on all 7 cards; every card keeps problems + automation chips + tools line. **Mobile:** 1-col.

### Process (`/process`)
- **Section:** Hero. **Pattern:** Background Gradient Animation — blob layers added.
- **Section:** 7-step timeline. **Pattern:** Process Timeline. **Visible as:** center spine with scroll-fill progress (baseline), alternating cards; unchanged structurally — already met the acceptance bar. Reduced-motion now renders spine filled.

### About (`/about`)
- **Section:** Hero. **Pattern:** Background motion (required "background motion in one hero/CTA area") — blob layers added.
- **Sections:** Principles bento + trust cards. **Pattern:** Feature Bento — hover accent bar added to all `.spot-card`s.

### Security & Reliability (`/security`)
- **Section:** Hero. **Pattern:** Background Gradient Animation — blob layers added.
- **Section:** Integrations marquee. **Pattern:** Integrations Section — chip hover + pause-on-hover added.
- No compliance claims added or altered; the "no formal certifications today" FAQ answer is untouched.

### Case Studies (`/case-studies`)
- **Section:** Hero. **Pattern:** Background Gradient Animation — blob layers added.
- **Section:** Case grid. **Pattern:** Bento case cards — hover accent bar added; filter pills, expandable stories, "Sample project" labels unchanged.
- **Section:** Testimonial carousel — rotating crossfade + dots, unchanged; reduced-motion freezes on slide 0.

### Contact (`/contact`)
- **Section:** Hero + form. **Pattern:** Background Gradient Animation + Contact/Form. **Visible as:** second blob layer added behind the form; form validation + success state unchanged.

## Not changed (deliberately)
- No copy rewrites — all approved copy is verbatim from the baseline.
- No pricing content introduced anywhere; the homepage calculator's "Per month" label refers to the visitor's own manual-labor cost (explicitly allowed).
- No new pages, routes, or footer links.
