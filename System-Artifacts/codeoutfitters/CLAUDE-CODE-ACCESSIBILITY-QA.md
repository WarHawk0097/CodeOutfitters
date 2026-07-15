# CodeOutfitters — Accessibility QA (Partial)

This is NOT a full WCAG audit. Only the checks explicitly listed below were executed via Playwright/Chromium against the production server.

## Executed

- Reduced-motion respect (Homepage): confirmed 0 elements left with `visibility:hidden`/`display:none` under `?motion=reduced`; content remains in the DOM and readable. PASS.
- Marquee duplicate-sequence accessibility: all 3 marquees (`/`, `/services`, `/security`) mark their duplicate row with `data-marquee-sequence="duplicate"` and now all 3 carry `aria-hidden="true"` on duplicate items (security fixed 2026-07-15 — previously only hidden via reduced-mode CSS, not aria-hidden in normal mode); 0 tabbable elements found inside any duplicate sequence at runtime. Duplicates hidden entirely under reduced motion (all 3, source+runtime confirmed). PASS.
- Console/runtime errors across full 24-check matrix: 0 errors, 0 failed requests. PASS.
- 404 routes (`/pricing`, `/book`, `/portfolio`): render genuine Next.js not-found page with "Back to Home" link, not a blank/broken response. PASS.

## Not executed (do not treat as passed)

- Skip-nav link presence/functionality
- Landmark roles (header/nav/main/footer) audit
- Heading order (h1→h2→h3) audit per route
- Full keyboard navigation / focus-visible traversal per route
- `aria-expanded` state correctness on FAQ/accordion/tab components
- Live-region (`aria-live`) correctness for the WhatsApp demo widget's async message reveals
- Touch target minimum-size audit (44x44) on mobile viewport
- Color contrast audit
- Screen reader (NVDA/VoiceOver) pass

These require either a dedicated axe-core/Lighthouse integration or manual keyboard/AT testing not performed in this run. Reported as NOT_EXECUTED, not as passed.
