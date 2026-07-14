# Process approved-source map

- Route: `/process`
- Approved source: `# CodeOutfitters Project Audit)/CodeOutfitters-complete-motion-enhancement-v1/CodeOutfitters Process.dc.html`
- Native target: `app/(public)/process/page.tsx`

## Section order

1. Shared sticky navigation
2. Dark centered process hero with three promise chips
3. Six-step alternating timeline and animated progress spine
4. Dark “Why we don't sell generic packages” statement and three principles
5. Five-item Process FAQ
6. Process-specific discovery CTA
7. Shared footer

## Behavior

- Timeline progress fills top-to-bottom after mount in full motion and is fully filled without animation in reduced mode.
- Timeline cards alternate left/right on wide screens and collapse to node/card rows below 760px.
- FAQ uses one open index with open, transfer, and close behavior.
- Native route may not load `support.js`, source HTML, or a generic DOM mutation runtime.
