# CodeOutfitters — Finalized Reference Handoff

Source of truth: `reference/desktop.png`.

Important: all measurements, colors, spacing, typography sizes, shadows, glows, and dimensions are estimated from the provided reference image unless explicitly marked otherwise.

Non-negotiable: do not redesign, do not invent sections, do not flatten editable UI into full-section images, and do not drift from the approved visual reference.


# ASSET_MANIFEST.md

## Export principles
- Do not export full sections as images.
- Do not export cards, buttons, navbars, forms, or CTA panels as flat images.
- Use SVG for logos, icons, line art, process lines, chart paths, and simple UI shapes.
- Use PNG/WebP only for complex 3D illustration pieces, glow overlays, avatars, and soft decorative image effects.

## Brand/logo assets

| Asset | Filename | Type | Format | Section | Dimensions | Transparent | Editable | Variant | Animation | Priority | Fallback |
|---|---|---|---|---|---:|---|---|---|---|---|---|
| Logo mark | `logos/codeoutfitters-mark.svg` | vector logo | SVG | Navbar | 32×32 | yes | yes | no | no | required | text logo remains |
| Wordmark | `logos/codeoutfitters-wordmark.svg` | optional logo text | SVG | Navbar | 140×28 | yes | yes/no | no | no | optional | editable text |

## Hero assets

| Asset | Filename | Type | Format | Section | Dimensions | Transparent | Editable | Variant | Animation | Priority | Fallback |
|---|---|---|---|---|---:|---|---|---|---|---|---|
| Hero pedestal base | `hero/hero-pedestal-base-light.png` | complex 3D | PNG/WebP | Hero | 720×460 | yes | no | mobile crop no | subtle float no loop optional | required | simplified CSS card base |
| Hero teal glow beam | `hero/hero-center-glow-beam.png` | glow overlay | PNG | Hero | 360×420 | yes | no | no | pulse yes | required | CSS radial gradient |
| Hero tall glass panel | `hero/hero-panel-ai-agent-glass.png` | glass panel | PNG/WebP | Hero | 340×420 | yes | no | no | float yes | required | CSS glass card |
| Hero workflow glass panel | `hero/hero-panel-workflow-glass.png` | glass panel | PNG/WebP | Hero | 360×260 | yes | no | no | float yes | required | CSS glass card |
| Hero data glass panel | `hero/hero-panel-data-glass.png` | glass panel | PNG/WebP | Hero | 320×250 | yes | no | no | float yes | required | CSS glass card |
| Hero decorative rods | `hero/hero-light-rods.svg` | decorative line set | SVG | Hero | 620×430 | yes | yes | no | pulse yes | decorative | hide on mobile |
| AI agent face icon | `icons/icon-ai-agent-face.svg` | icon | SVG | Hero panel | 64×64 | yes | yes | no | no | required | simple robot icon |
| Workflow nodes icon | `icons/icon-workflow-nodes.svg` | icon | SVG | Hero panel | 64×64 | yes | yes | no | no | required | simple node icon |
| Database stack icon | `icons/icon-database-stack.svg` | icon | SVG | Hero panel | 64×64 | yes | yes | no | no | required | simple database icon |

## Feature assets

| Asset | Filename | Type | Format | Section | Dimensions | Transparent | Editable | Variant | Animation | Priority | Fallback |
|---|---|---|---|---|---:|---|---|---|---|---|---|
| Ticket gauge | `features/ticket-resolution-gauge.svg` | chart | SVG | AI Helpdesk card | 160×120 | yes | yes | no | draw yes | required | CSS conic gradient |
| Calendar mini widget shapes | `features/calendar-mini-widget.svg` | UI vector | SVG | Booking card | 210×155 | yes | yes | no | no | optional | native HTML grid |
| CRM workflow icons | `features/crm-workflow-icons.svg` | icon set | SVG | CRM card | 260×80 | yes | yes | no | path animate optional | required | individual SVG icons |
| Analytics line chart | `features/analytics-line-chart.svg` | chart | SVG | Analytics card | 280×135 | yes | yes | no | draw yes | required | CSS/SVG path |
| Hermes radar visual | `features/hermes-radar-visual.png` | complex radar | PNG/WebP | Hermes card | 190×190 | yes | no | no | pulse/spin optional | required | SVG radar |
| Hermes shield badge | `features/hermes-shield-check.svg` | icon/badge | SVG | Hermes card | 54×70 | yes | yes | no | pulse optional | required | simple shield |

## Workflow/process assets

| Asset | Filename | Type | Format | Section | Dimensions | Transparent | Editable | Variant | Animation | Priority | Fallback |
|---|---|---|---|---|---:|---|---|---|---|---|---|
| Process connecting line | `process/process-line.svg` | line | SVG/CSS | Process | 900×2 | yes | yes | mobile variant yes | draw yes | required | CSS border line |
| Process node circle | `process/process-node.svg` | icon shape | SVG/CSS | Process | 34×34 | yes | yes | no | scale yes | optional | CSS circle |

## CTA assets

| Asset | Filename | Type | Format | Section | Dimensions | Transparent | Editable | Variant | Animation | Priority | Fallback |
|---|---|---|---|---|---:|---|---|---|---|---|---|
| CTA dotted radial pattern | `cta/cta-dotted-radial-pattern.svg` | decorative pattern | SVG | CTA | 260×220 | yes | yes | no | no | required | hide |
| Avatar cluster | `avatars/cta-avatar-cluster.webp` | avatar image set | WebP/PNG | CTA | 230×56 | yes | no | no | no | optional | CSS placeholder initials |
| Star icon | `icons/icon-star-filled.svg` | icon | SVG | CTA | 18×18 | yes | yes | no | no | required | unicode star only if approved |

## Background/decorative assets

| Asset | Filename | Type | Format | Section | Dimensions | Transparent | Editable | Variant | Animation | Priority | Fallback |
|---|---|---|---|---|---:|---|---|---|---|---|---|
| Page grain/noise | `backgrounds/subtle-warm-noise.webp` | texture | WebP | Global | 1024×1024 | no | no | no | no | optional | none |
| Hero floor linework | `decorative/hero-floor-linework.svg` | line art | SVG | Hero | 700×340 | yes | yes | no | draw optional | required | CSS lines |
| Small sparkle icon | `icons/icon-sparkle.svg` | icon | SVG | Hero badge | 16×16 | yes | yes | no | twinkle optional | required | simple asterisk |

## Mobile-specific assets
No unique mobile-only image assets required. Use the same assets with scaling, cropping, and hiding decorative rods if needed.

## Animation-ready assets
- `hero/hero-center-glow-beam.png`
- `hero/hero-light-rods.svg`
- `decorative/hero-floor-linework.svg`
- `features/ticket-resolution-gauge.svg`
- `features/analytics-line-chart.svg`
- `features/hermes-radar-visual.png`
- `process/process-line.svg`
