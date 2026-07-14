# Industries approved-source map

- Route: `/industries`
- Active approved source: `# CodeOutfitters Project Audit)/CodeOutfitters-complete-motion-enhancement-v1/CodeOutfitters Industries.dc.html`
- Manifest authority: `OPUS-ACTIVE-SOURCE-MANIFEST.md`
- Native target: `app/(public)/industries/page.tsx`

## Section order

1. Shared sticky navigation
2. Centered dark hero
3. Dotted-cream seven-industry card grid
4. Dark four-gap common-needs strip
5. Three example workflow cards
6. Four-cell dark proof strip
7. Four-item industry FAQ
8. Industry-specific two-column CTA
9. Shared footer

## Content/state sources

- Seven industry objects, four common needs, three workflows, four proof stats, and four FAQs are defined in the source `DCLogic` arrays.
- Industry cards use pointer-position spotlight variables (`--sx`, `--sy`, `--sglow`) plus lift/border/shadow hover states.
- FAQ owns a single `openFaq` index; clicking the open item closes it and clicking another transfers the open state.
- Full-motion entrance treatment is represented natively with viewport reveal animation.
- Reduced motion must preserve all readable content and interaction state while suppressing movement.

## Shared-shell mapping

- Approved header maps to `components/navbar.tsx`.
- Approved footer maps to `components/footer.tsx`.
- The route body remains a native React/TypeScript implementation; the `.dc.html` source is evidence only and is never loaded at runtime.
