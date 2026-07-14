# Services Fidelity Repair Report

## Result

PASSED against `CodeOutfitters Services.dc.html` at 1440×1000, 820×1180, and 390×844.

## Implementation

- Replaced the mismatched route with a native React/TypeScript rendering of the approved hero search, six service cards, integration rows, FAQ, and Services CTA.
- Restored exact source copy, card spans `7/5, 5/7, 7/5`, icon sizes, tags, metrics, three-step expansions, colors, borders, radii, shadows, and breakpoints.
- Repaired the shared native header/footer to match the approved multipage shell while preserving the Homepage announcement and Homepage footer variant.
- No iframe, standalone HTML dependency, runtime parser, generated preview runtime, or DOM mutation engine is used.

## Interactions

- Search works repeatedly (`chat` → one result, `invoice` → one result); Escape clears.
- Cmd/Ctrl+K focus and result links are implemented.
- All six “How it works” controls open/close and rotate their chevrons.
- Five FAQ controls open/close with height/opacity transitions.
- Keyboard-native buttons/links and mobile touch controls remain available.

## Marquee proof

- Viewport: `.services-marquee`
- Track: `.services-marquee-row.is-left`
- Animation: `servicesMarqueeL`, 38s, flex, nowrap, width 2401.31px
- Sequences: 2 (one original, one aria-hidden duplicate); 9 chips each
- T0: `matrix(1,0,0,1,-18.9563,0)`
- T+2: `matrix(1,0,0,1,-82.6732,0)`
- T+4: `matrix(1,0,0,1,-145.866,0)`
- Hover start: `matrix(1,0,0,1,-146.918,0)`
- Hover +2: `matrix(1,0,0,1,-146.918,0)`
- Post-hover: `matrix(1,0,0,1,-149.552,0)` → after 1s `matrix(1,0,0,1,-181.145,0)`
- Movement, real pointer pause, and resume passed. Reduced mode hides animated tracks and displays one readable static set.

## Runtime

- Three viewports: no horizontal overflow, broken images, console errors, or hydration errors.
- Content counts: 6 service cards, 5 FAQ rows, 2 marquee rows.
- Stable initial document height verified; expected accordion height changes occur only after user interaction.
- `?motion=full` and `?motion=reduced` passed.
- Homepage shared-shell regression: 1440, 820, and 390 passed with stable heights (8920/9970/12097), no overflow, errors, or broken assets.

## Remaining differences

- Browser font antialiasing, SVG rasterization, subpixel wrapping, and dynamic marquee capture phase only.
