# CodeOutfitters — Accessibility QA (Partial)

This is NOT a full WCAG audit. Only the checks explicitly listed below were executed via Playwright/Chromium against the production server.

## Executed

- Reduced-motion respect (Homepage): confirmed 0 elements left with `visibility:hidden`/`display:none` under `?motion=reduced`; content remains in the DOM and readable. PASS.
- Marquee duplicate-sequence accessibility: all 3 marquees (`/`, `/services`, `/security`) mark their duplicate row with `data-marquee-sequence="duplicate"` and now all 3 carry `aria-hidden="true"` on duplicate items (security fixed 2026-07-15 — previously only hidden via reduced-mode CSS, not aria-hidden in normal mode); 0 tabbable elements found inside any duplicate sequence at runtime. Duplicates hidden entirely under reduced motion (all 3, source+runtime confirmed). PASS.
- Console/runtime errors across full 24-check matrix: 0 errors, 0 failed requests. PASS.
- 404 routes (`/pricing`, `/book`, `/portfolio`): render genuine Next.js not-found page with "Back to Home" link, not a blank/broken response. PASS.

## Executed (2026-07-15, production interaction pass — see CLAUDE-CODE-PRODUCTION-INTERACTION-QA.md)

- Hero channel tabs: `role="tablist"`/`role="tab"`/`aria-selected`/`aria-controls` — added this run (previously missing), runtime-confirmed on production.
- FAQ/accordion `aria-controls` + labelled region: added across all 6 independent FAQ implementations (Homepage/Industries shared `faq.tsx`, plus separate inline implementations in Contact, Process, Industries, Security, Services) — previously only `aria-expanded` existed, now trigger↔panel is programmatically associated. Runtime-confirmed on production.
- Mobile navigation menu: added (previously did not exist below 960px — a functional defect). Focus enters menu on open, Tab wraps within menu, Escape closes and returns focus to trigger, body scroll locks/unlocks correctly. Runtime-confirmed at 390x844 and 820x1180.
- Form label/error programmatic association (Contact): implicit label nesting + HTML5 native validity (`valueMissing`, `typeMismatch`) confirmed functional.
- Visible focus outline: confirmed present (browser-default) on FAQ trigger buttons.
- Touch target sizing: FAQ buttons 66-71px, Contact submit button 49px, mobile nav toggle 36-40px — all ≥40px, spot-checked not exhaustively audited.

## Not executed (do not treat as passed)

- Skip-nav link presence/functionality
- Full landmark roles (header/nav/main/footer) audit
- Heading order (h1→h2→h3) audit per route
- Full keyboard navigation / focus-visible traversal of every route (only a representative subset tested: tabs, FAQ, mobile menu, contact form)
- Live-region (`aria-live`) correctness for the WhatsApp demo widget's async message reveals
- Full touch target minimum-size audit (44x44) across every control on every route
- Color contrast audit
- Screen reader (NVDA/VoiceOver) pass

These require either a dedicated axe-core/Lighthouse integration or manual keyboard/AT testing not performed in this run. Reported as NOT_EXECUTED, not as passed. This remains a partial runtime spot-check, not a full WCAG audit.
