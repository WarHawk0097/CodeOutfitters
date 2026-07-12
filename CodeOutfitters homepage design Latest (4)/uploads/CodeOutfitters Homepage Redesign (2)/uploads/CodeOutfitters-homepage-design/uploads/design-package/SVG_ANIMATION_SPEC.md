# CodeOutfitters — Finalized Reference Handoff

Source of truth: `reference/desktop.png`.

Important: all measurements, colors, spacing, typography sizes, shadows, glows, and dimensions are estimated from the provided reference image unless explicitly marked otherwise.

Non-negotiable: do not redesign, do not invent sections, do not flatten editable UI into full-section images, and do not drift from the approved visual reference.


# SVG_ANIMATION_SPEC.md

## SVG assets needing path animation
- `features/ticket-resolution-gauge.svg`
- `features/analytics-line-chart.svg`
- `process/process-line.svg`
- `decorative/hero-floor-linework.svg`
- `hero/hero-light-rods.svg`

## Stroke widths
- Icons: 1.75–2px.
- Chart lines: 2.25–3px.
- Process line: 1.25–1.5px.
- Decorative linework: 0.75–1px.

## Stroke colors
- Teal: `#078A7B`.
- Light teal: `#13B6A2`.
- Warm line: `#D8CBB5`.
- Gold accent: `#D9A441`.

## Stroke dash behavior
Use:
```css
stroke-dasharray: var(--path-length);
stroke-dashoffset: var(--path-length);
```
Animate to:
```css
stroke-dashoffset: 0;
```

## Line draw direction
- Charts: left to right.
- Process: left to right desktop, top to bottom mobile.
- Floor lines: center outward or left to right.
- Gauge: clockwise.

## Glow/filter requirements
Use subtle SVG filters only:
```svg
<filter id="tealGlow">
  <feGaussianBlur stdDeviation="2.5" result="blur"/>
  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
```

## Pulse rules
Pulse opacity between 0.55 and 0.9. Do not scale more than 1.04.

## Gradient strokes
For hero/floor linework, use teal-to-transparent or gold-to-transparent linear gradients. Keep gradients subtle.

## ViewBox recommendations
- Icons: 0 0 24 24.
- Charts: fit exact visual, e.g. 0 0 280 140.
- Hero rods: use larger artboard matching placement, e.g. 0 0 620 430.

## Fallback static SVG
All animated SVGs must look correct without animation.

## Export/layering
Keep paths named/grouped:
- `base`
- `animated-path`
- `glow`
- `markers`
