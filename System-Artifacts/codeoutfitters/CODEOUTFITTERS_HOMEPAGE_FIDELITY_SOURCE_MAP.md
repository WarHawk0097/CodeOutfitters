# CodeOutfitters Homepage Fidelity Source Map

## Active approved source

- Manifest-selected package: `F:\CodeOutfitters\# CodeOutfitters Project Audit)\CodeOutfitters-complete-motion-enhancement-v1`
- Exact Homepage: `F:\CodeOutfitters\# CodeOutfitters Project Audit)\CodeOutfitters-complete-motion-enhancement-v1\CodeOutfitters Homepage v8.dc.html`
- Motion reference: `motion.js`
- Generated preview runtime (reference only; prohibited in production): `support.js`
- Approved visual styles: inline CSS in `CodeOutfitters Homepage v8.dc.html`
- Approved assets: `assets/` and `assets/integrations/`

The standalone legacy Homepage and sibling v2/Opus/Claude packages are not active sources.

## Native route and component graph

- Route: `F:\CodeOutfitters\app\(public)\page.tsx`
- Homepage sections:
  - `components/hero.tsx`
  - `components/stats-strip.tsx`
  - `components/tools-marquee.tsx`
  - `components/services-bento.tsx`
  - `components/process-preview.tsx`
  - `components/roi-calculator.tsx`
  - `components/case-studies-preview.tsx`
  - `components/testimonials.tsx`
  - `components/faq.tsx`
  - `components/cta-banner.tsx`
- Shared shell:
  - `components/navbar.tsx`
  - `components/footer.tsx`

## Approved section map

| Order | Approved section | Native owner before repair | Approved visible structure |
|---:|---|---|---|
| 1 | Announcement | `navbar.tsx` | Single dark-green announcement row |
| 2 | Global header | `navbar.tsx` | Sticky cream navigation; logo, five links, Book a Call |
| 3 | Hero | `hero.tsx` | Two-column copy and Automation Engine browser demo |
| 4 | Proof metrics | `stats-strip.tsx` | Four equal metric cells |
| 5 | Integration marquee | `tools-marquee.tsx` | Dark shell and two counter-moving logo rows |
| 6 | Services bento | `services-bento.tsx` | One full-width featured card and two half-width cards |
| 7 | Process preview | `process-preview.tsx` | Four-step alternating center-spine timeline |
| 8 | Cost calculator | `roi-calculator.tsx` | Three sliders left, results panel right |
| 9 | Case studies | `case-studies-preview.tsx` | Full-width featured proof plus two support cards |
| 10 | Testimonials | `testimonials.tsx` | Featured testimonial, controls, two moving rows |
| 11 | FAQ | `faq.tsx` | Intro, five one-open-at-a-time rows, bottom CTA |
| 12 | Final CTA | `cta-banner.tsx` | Two-column discovery-call card |
| 13 | Footer | `footer.tsx` | Brand, Services, Company, lower legal/status row |

No approved sections may be merged, omitted, or supplemented for this gate.

## Runtime behaviors to preserve natively

- Hero staged entrance, ambient grid/path motion, and three repeating workflow tabs.
- Scroll-triggered section/card reveals and numeric count-up.
- Four-step process progression.
- Calculator value/output feedback using the approved formula.
- Continuous integration and testimonial movement, pointer pause, and reduced-motion fallback.
- Featured testimonial rotation with manual dots.
- FAQ one-open-at-a-time height/opacity animation and chevron rotation.
- URL overrides `?motion=full` and `?motion=reduced`.

## Production constraints

The native route remains React and TypeScript. It must not depend on the `.dc.html`, `support.js`, an iframe, runtime HTML parsing, `dangerouslySetInnerHTML`, or the old standalone DOM mutation engine.
