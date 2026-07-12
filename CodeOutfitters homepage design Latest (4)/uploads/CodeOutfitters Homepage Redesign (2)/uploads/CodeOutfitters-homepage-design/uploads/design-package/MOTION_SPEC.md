# CodeOutfitters — Finalized Reference Handoff

Source of truth: `reference/desktop.png`.

Important: all measurements, colors, spacing, typography sizes, shadows, glows, and dimensions are estimated from the provided reference image unless explicitly marked otherwise.

Non-negotiable: do not redesign, do not invent sections, do not flatten editable UI into full-section images, and do not drift from the approved visual reference.


# MOTION_SPEC.md

Motion should be tasteful and subtle. The reference image is static, so these animations are inferred and optional.

## Page load sequence
- Trigger: page load.
- Header fades down 0.4s.
- Hero copy fades/slides up 0.45s.
- Hero visual fades/scales in 0.65s.
- Trust row fades in after hero 0.25s.
- Easing: cubic-bezier(.22,.61,.36,1).

## Hero animation
### `hero-float`
- Section: Hero.
- Purpose: make the illustration feel alive without becoming distracting.
- Initial/final: translateY 0 → -6px → 0.
- Duration: 5–7s.
- Easing: ease-in-out.
- Loop: yes.
- Mobile: reduce to 3px or disable.
- Reduced motion: disabled.

### `hero-glow-pulse`
- Section: Hero.
- Purpose: subtle center glow activity.
- Opacity: .55 → .85 → .55.
- Duration: 3.5s.
- Loop: yes.
- Reduced motion: static opacity.

## Card entrance
- Trigger: scroll into view.
- Cards fade up 16px.
- Duration: .45s.
- Stagger: 70ms.
- Mobile: smaller translate 10px.

## Button hover
- TranslateY: -1px.
- Shadow increase.
- Duration: 180ms.

## Icon hover
- Teal stroke brightens.
- Optional 1.03 scale.
- Duration: 180ms.

## Process line animation
- Trigger: process section enters view.
- Draw line left-to-right with nodes scaling in.
- Duration: 700ms line, 180ms nodes.
- Reduced motion: line static.

## Chart animation
- Analytics line draws left-to-right.
- Duration: 900ms.
- Reduced motion: static chart.

## Gauge animation
- Gauge arc draws from 0 to target.
- Duration: 850ms.
- Reduced motion: static.

## Radar animation
- Do not bake sweep line into PNG.
- Implement optional CSS/SVG sweep separately.
- Duration: 4–6s loop.
- Reduced motion: static rings.
