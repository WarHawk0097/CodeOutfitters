# Services Source Map

- Approved source: `F:\CodeOutfitters\# CodeOutfitters Project Audit)\CodeOutfitters-complete-motion-enhancement-v1\CodeOutfitters Services.dc.html`
- Native route: `F:\CodeOutfitters\app\(public)\services\page.tsx`
- Shared native shell: `components/navbar.tsx`, `components/footer.tsx`
- Existing shared primitives before repair: `components/faq.tsx`, `components/cta-banner.tsx`, `components/ui/bento-grid.tsx`
- Approved styles: inline `<style>` block in the source page.
- Approved behavior: source logic class in lines 280–427; `motion.js` is reference-only and `support.js` is prohibited in production.
- Assets: `assets/logo-mark.svg`, six service icon SVGs, `assets/icon-arrow-right.svg`, and integration names rendered as text chips.

## Approved section order

1. Header
2. Hero with command-palette search
3. Six-card services bento
4. Two-row integrations marquee
5. Five-item Services FAQ
6. Discovery-call CTA
7. Footer

## Responsive and motion map

- Navigation links hide at 960px; no mobile drawer is approved.
- Hero is centered in an 820px shell and retains its ambient 16-second gradient motion.
- Service cards use a 12-column `7/5, 5/7, 7/5` span pattern and stack at 820px.
- Integrations use two nowrap rows (38s left, 44s right), each with one original and one aria-hidden duplicate; real pointer hover pauses.
- Search supports repeated typing, Cmd/Ctrl+K focus, Escape clear, matching results, and empty results.
- Every service card has one exclusive expandable “How it works” area.
- FAQ rows animate independently and remain keyboard operable.
- Reduced mode keeps all content visible and shows one readable static integration set.

## Native mismatches before repair

- Hero lacked the approved command-palette search and used different copy, padding, type weight, and atmosphere.
- Search was separated onto the cream card section and filtered the visible grid rather than showing the approved dark dropdown.
- Service copy, IDs, tags, metrics, icon geometry, span pattern, and expandable step hierarchy differed.
- FAQ used the Homepage FAQ geometry and the CTA used Homepage-specific copy.
- Shared non-Homepage header/footer had an unapproved mobile drawer and different footer columns/copy.

## Reuse decisions and risk

- Safe to reuse: native motion-mode provider, Next links, approved SVG assets, typography tokens.
- Replace: Services route composition, service data, search/results, card hierarchy, page FAQ, page CTA, marquee shell.
- Repair shared shell with route-aware active state; Homepage variant must remain unchanged and be reverified at all three target viewports.
