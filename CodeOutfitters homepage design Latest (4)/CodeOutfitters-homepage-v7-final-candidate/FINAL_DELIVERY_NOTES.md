# CodeOutfitters Homepage — Final Delivery Notes (v7)

- Final file: CodeOutfitters Homepage v7.dc.html
- Delivery type: standalone .dc.html export
- Real React/Tailwind/shadcn app: no
- Real /components/ui installation: no
- 21st.dev-inspired standalone implementation: yes
- support.js uses unpkg: yes (React 18.3.1, ReactDOM, Babel standalone)
- runtime self-contained/offline-ready: no — an internet connection is required on first load
- Sections included:
  - hero/nav
  - services bento
  - process timeline
  - split-panel calculator
  - editorial case studies
  - testimonial marquee
  - FAQ/CTA/footer
  - responsive CSS (mobile-safe down to 390px)
  - reduced-motion support

## How to open
Keep `CodeOutfitters Homepage v7.dc.html`, `support.js`, and `assets/` together in one folder and open the .dc.html in a browser.

## v7 changes vs v6
- CTA section rebuilt (`cta-v7` classes): two-column premium conversion card, one-line non-wrapping button, legible trust chips, single-column at ≤640px, no rotating glow (subtle hover sweep only).
- `mobile-safe-v7` overflow guards on the page root.
