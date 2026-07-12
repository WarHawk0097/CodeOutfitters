# CodeOutfitters Homepage — Asset & Fidelity QA Report

## Deliverable
`CodeOutfitters Homepage.dc.html` — Mobile (390px) / Tablet (768px) / Desktop (1440px) frames, stacked on a pannable canvas. All copy, cards, buttons, nav, and stats are live editable text/components (not images).

## Fidelity vs reference/desktop.png
| Area | Status | Note |
|---|---|---|
| Section order | Pass | Navbar → Hero → Trust → What We Build → Process → CTA, unchanged |
| Hero 2-col structure (desktop) | Pass | Text left, 3D glass visual right |
| Hero 3-line headline, teal 3rd line | Pass | Serif (Fraunces), teal "Outcomes that matter." |
| Hero visual composition | Pass (CSS approximation) | Pedestal + glow beam + 3 glass panels built with the documented CSS fallbacks (gradients, blur, soft shadows) rather than generated PNGs — no image-generation tool was available in this session |
| Trust strip placement/style | Pass | Grayscale wordmarks, centered overline |
| 6 service cards, varied per-card layout | Pass | Gauge, calendar, CRM icon row, lead rows, line chart, radar+shield — not a uniform icon grid |
| Process: 5-node horizontal line | Pass (desktop/tablet); vertical on mobile per RESPONSIVE_SPEC |
| CTA: headline/avatars/stars/button/stats/dotted pattern | Pass | Dotted pattern generated as a deterministic SVG dot field |
| Color system (ivory/teal/gold) | Pass | Sourced directly from TOKENS.md hex values |
| Border radius / shadow softness | Pass | Matches TOKENS.md scale |

## Assets generated (individual files, `assets/`)
SVG, transparent, no text nodes, single-purpose each:
logo-mark, icon-sparkle(-badge), icon-automate, icon-orchestrate, icon-scale, icon-chevron-right, icon-star-filled, icon-live-dot, icon-confirmed-dot, icon-lead-user, icon-ai-agent-face, icon-workflow-nodes, icon-database-stack, icon-check-square, icon-arrow-right, icon-chat-square, icon-edit-square, hermes-shield-check.

## Deviations / fallback decisions (flagged per ASSET_MANIFEST fallback column)
- **Hero pedestal, glass panels (×3), glow beam** — manifest lists these as PNG/WebP "complex 3D" assets but explicitly names a CSS fallback for each ("CSS glass card", "CSS radial gradient"). No image-generation tool was available this session, so the documented CSS fallback was used instead of a rasterized illustration. Recommend generating the real PNG illustrations separately and swapping them into the panel containers when available — layout/sizing is already reserved for a drop-in swap.
- **Hermes radar** — used the documented "SVG radar" fallback (concentric circles + crosshair) instead of the PNG.
- **CTA avatar cluster** — used the documented "CSS placeholder initials" fallback instead of real headshots (avoids any identifiable-person risk).
- **Page grain/noise texture** — omitted (marked optional priority in manifest).
- **Trust logos** — kept as neutral placeholder wordmarks matching the reference's apparent placeholder names (Northwind, summit, Pivotly, Lumina, atlas, Vertex); flagged in manifest as needing rights confirmation before production use of any real customer logo.

## Banned patterns check
No generic SaaS hero, no dark sci-fi, no random gradient blobs, no same-size icon grid, no emoji, no full-section/card rasterization, no baked button text in assets. Pass.

## Remaining risks
1. Hero illustration is CSS-approximated, not a generated 3D render — closest achievable without image generation; swap-in path is ready.
2. Trust-strip names are placeholders pending legal clearance for real logos.
3. Responsive frames are fixed-width artboards (390/768/1440) per the handoff's artboard approach, not fluid breakpoints — matches how the reference package itself is scoped (three explicit widths in RESPONSIVE_SPEC.md).
