# CodeOutfitters — Finalized Reference Handoff

Source of truth: `reference/desktop.png`.

Important: all measurements, colors, spacing, typography sizes, shadows, glows, and dimensions are estimated from the provided reference image unless explicitly marked otherwise.

Non-negotiable: do not redesign, do not invent sections, do not flatten editable UI into full-section images, and do not drift from the approved visual reference.


# RESPONSIVE_SPEC.md

## Desktop 1440px
- Use centered max-width shell around 1120–1200px.
- Hero remains two-column.
- Feature cards remain 3×2.
- Process timeline remains horizontal.
- CTA remains horizontal with left copy and right proof/stats.

## Laptop 1280px
- Slightly reduce hero headline and hero visual.
- Maintain 3-column card grid if card width remains above 280px.
- Reduce horizontal padding to 48px.

## Tablet 768px
- Navbar: logo left, hamburger right; CTA inside menu or retained if room.
- Hero: stack with text above visual or keep compressed two-column only if visual remains readable.
- Hero visual: scale to 80–90%, center.
- Trust logos: wrap to 2 rows.
- Feature cards: 2-column grid.
- Process: can wrap or become compact vertical timeline.
- CTA: stack headline/proof/button/stats.

## Mobile 390px
- Page shell radius reduces or becomes full-width.
- Navbar: logo + hamburger only.
- Hero: single column.
- Hero headline: 36–42px.
- Hero buttons stack full-width or 1-column.
- Hero feature chips wrap.
- Hero visual: scale down; hide decorative rods if cluttered.
- Trust logos: 2-column grid or horizontal scroll.
- Feature cards: 1-column.
- Process: vertical timeline with line left and steps stacked.
- CTA: stack; stat cells 2×2 or vertical.
- Avatar cluster and stars remain visible but compact.

## What stacks
Hero columns, feature grid, process nodes, CTA proof/stats.

## What stays horizontal
Hero chips can wrap but remain inline groups; trust logos can wrap; stat cells can be 2×2.

## What hides
Decorative rods and some tiny hero particles may hide below 480px.

## What scales
Hero illustration, radar, charts, gauge, CTA dotted pattern.

## Image crop rules
Never crop important visual content. Use contain for hero assets. Crop only decorative patterns.

## Minimum readable sizes
- Body text: 15px.
- Small UI labels: 11px minimum.
- Buttons: 44px min height.
- Touch targets: 44×44px minimum.

## Mobile spacing
Use 20–24px outer padding, 20px card padding, 32–48px section vertical spacing.
