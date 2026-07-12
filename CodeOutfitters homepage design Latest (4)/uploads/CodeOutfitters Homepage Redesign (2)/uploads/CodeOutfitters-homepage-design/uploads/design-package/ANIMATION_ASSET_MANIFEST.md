# CodeOutfitters — Finalized Reference Handoff

Source of truth: `reference/desktop.png`.

Important: all measurements, colors, spacing, typography sizes, shadows, glows, and dimensions are estimated from the provided reference image unless explicitly marked otherwise.

Non-negotiable: do not redesign, do not invent sections, do not flatten editable UI into full-section images, and do not drift from the approved visual reference.


# ANIMATION_ASSET_MANIFEST.md

| Animation asset | Filename | Format | Section | Purpose | Trigger | Loop | Duration | Easing | Fallback | Mobile | Reduced motion |
|---|---|---|---|---|---|---|---:|---|---|---|---|
| Hero glow pulse | `hero/hero-center-glow-beam.png` | CSS opacity transform | Hero | soft energy | page load | yes | 3.5s | ease-in-out | static glow | reduce | static |
| Hero panel float | hero panel PNGs | CSS transform | Hero | depth | page load | yes | 5–7s | ease-in-out | static | reduce | static |
| Hero rods twinkle | `hero/hero-light-rods.svg` | CSS/SVG opacity | Hero | subtle detail | load | yes | 2–4s | ease-in-out | static rods | hide optional | static |
| Floor line draw | `decorative/hero-floor-linework.svg` | SVG path | Hero | technical polish | load | no | .9s | ease-out | static lines | static | static |
| Ticket gauge draw | `features/ticket-resolution-gauge.svg` | SVG path | Feature | metric reveal | scroll | no | .85s | ease-out | static gauge | same | static |
| Analytics line draw | `features/analytics-line-chart.svg` | SVG path | Feature | metric reveal | scroll | no | .9s | ease-out | static chart | same | static |
| Radar pulse | `features/hermes-radar-visual.png` + CSS overlay | CSS opacity/rotate | Feature | deployment scan | scroll/idle | yes | 4–6s | linear/ease | static radar | reduce | static |
| Process line draw | `process/process-line.svg` / CSS | SVG/CSS | Process | reveal sequence | scroll | no | .7s | ease-out | static line | vertical static | static |
