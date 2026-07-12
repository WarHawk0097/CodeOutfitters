# CodeOutfitters — Finalized Reference Handoff

Source of truth: `reference/desktop.png`.

Important: all measurements, colors, spacing, typography sizes, shadows, glows, and dimensions are estimated from the provided reference image unless explicitly marked otherwise.

Non-negotiable: do not redesign, do not invent sections, do not flatten editable UI into full-section images, and do not drift from the approved visual reference.


# OPENDESIGN_OR_CLAUDE_DESIGN_PROMPT.md

```text
ROLE
You are OpenDesign / Claude Design acting as a senior product designer and production-ready web design implementer.

SOURCE OF TRUTH
Use:
1. reference/desktop.png
2. all markdown files inside design-package/

The attached reference image is the approved final visual direction. Do not redesign.

MISSION
Create a high-fidelity responsive web design/prototype for the CodeOutfitters homepage and create/export the required asset library.

STRICT RULES
- Do not create a new concept.
- Do not change section order.
- Do not change colors, typography mood, card style, button style, glow/shadow style, or CTA hierarchy.
- Do not export full sections as flat images.
- Do not export cards, buttons, navbars, CTAs, tabs, or forms as flat images.
- Keep UI text editable.
- Keep cards editable.
- Keep buttons editable.
- Use assets only for complex 3D visuals, icons, decorative overlays, avatars, and patterns.
- Generate assets from ASSET_MANIFEST.md.
- Use exact prompts from ASSET_PROMPTS.md.
- Preserve the exact warm ivory + teal + gold premium automation style.

REQUIRED DESIGN FRAMES
- Desktop 1440px
- Laptop 1280px if supported
- Tablet 768px
- Mobile 390px

REQUIRED COMPONENTS
- Editable navbar
- Editable hero text/buttons/chips
- Layered hero visual using exported assets
- Editable trust strip
- Editable What We Build cards
- Editable process timeline
- Editable CTA panel
- Reusable button, card, stat, chip, icon, and service-card components

REQUIRED EXPORTS
1. Desktop screenshot
2. Tablet screenshot
3. Mobile screenshot
4. PNG/WebP asset exports
5. SVG asset exports
6. Asset QA table
7. Changed files list or design layer list
8. Mismatch report

QA BEFORE FINAL
Confirm:
- matches reference image
- no redesign
- all text editable
- no full-section image slices
- assets individually exported
- no wrong color family
- no random dashboard replacements
- responsive layout faithful to reference
```
