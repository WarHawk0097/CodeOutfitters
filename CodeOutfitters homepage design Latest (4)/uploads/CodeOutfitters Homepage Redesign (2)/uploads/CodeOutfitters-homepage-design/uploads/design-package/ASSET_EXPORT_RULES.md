# CodeOutfitters — Finalized Reference Handoff

Source of truth: `reference/desktop.png`.

Important: all measurements, colors, spacing, typography sizes, shadows, glows, and dimensions are estimated from the provided reference image unless explicitly marked otherwise.

Non-negotiable: do not redesign, do not invent sections, do not flatten editable UI into full-section images, and do not drift from the approved visual reference.


# ASSET_EXPORT_RULES.md

## SVG export rules
- Use clean `viewBox`.
- No embedded raster images unless explicitly required.
- No text nodes for icons unless wordmark asset.
- Convert decorative shape text to editable UI text, not SVG.
- Use `currentColor` where practical.
- Keep strokes consistent.
- Keep layer names readable.
- Export individual files, not only a sprite.

## PNG/WebP export rules
- Export complex 3D/glow assets at 2x.
- True alpha transparency for isolated objects.
- No checkerboard backgrounds.
- No white matte edges.
- No clipped shadows/glows.
- Keep 24–64px transparent padding around glows when needed.
- WebP for production, PNG for source/alpha-safe handoff.

## Transparent background rules
Transparent for:
- hero complex parts
- glass panels
- glows
- radar
- avatar cluster
- decorative overlays

Not transparent for:
- subtle warm noise tile if used.

## 1x/2x rules
- Icons SVG no 2x needed.
- PNG/WebP export 1x and 2x if used directly in production.
- Hero assets minimum 1400px wide for large desktop if single combined asset.

## Naming rules
Lowercase kebab-case. Use section prefix. Example:
`hero/hero-pedestal-base-light.png`.

## Folder rules
Use:
- `assets/logos`
- `assets/icons`
- `assets/hero`
- `assets/features`
- `assets/process`
- `assets/cta`
- `assets/avatars`
- `assets/backgrounds`
- `assets/decorative`
- `assets/animation`

## What must remain editable
Navbar, text, buttons, cards, stats, trust labels, process text, charts when possible, card containers, CTA panel.

## Never export as flat image
Full page, full hero section, full cards, full trust strip, full CTA, full feature grid, buttons, forms, navbars.

## Animation-ready SVGs
Keep animated paths separate. Do not merge all paths. Avoid excessive filters.

## Fallbacks
Every animation-ready asset must have a static final-state export.
