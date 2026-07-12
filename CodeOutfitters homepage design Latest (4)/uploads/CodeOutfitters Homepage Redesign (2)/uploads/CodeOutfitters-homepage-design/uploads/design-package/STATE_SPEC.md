# CodeOutfitters — Finalized Reference Handoff

Source of truth: `reference/desktop.png`.

Important: all measurements, colors, spacing, typography sizes, shadows, glows, and dimensions are estimated from the provided reference image unless explicitly marked otherwise.

Non-negotiable: do not redesign, do not invent sections, do not flatten editable UI into full-section images, and do not drift from the approved visual reference.


# STATE_SPEC.md

## Primary button
- Default: teal gradient, white text, soft shadow.
- Hover: translateY(-1px), slightly brighter, stronger shadow.
- Active: translateY(1px), darker teal.
- Focus: 2px teal outline with 3px offset.
- Disabled: opacity .55, no shadow, cursor not-allowed.
- Loading: spinner left or text opacity .7.
- Success: optional check icon.

## Secondary button
- Default: cream background, teal text, light warm border.
- Hover: teal border, faint teal background.
- Active: slight press.
- Focus: teal outline.
- Disabled: opacity .55.

## Links
- Default: dark text.
- Hover: teal text.
- Active: teal.
- Focus: visible outline.

## Cards
- Default: cream/white card, border, soft shadow.
- Hover: slight lift and border tint if clickable.
- Focus: teal outline if interactive.
- Loading: skeleton only for dynamic areas.
- Empty: muted message inside card.
- Error: subtle red inline message, do not change layout dramatically.

## Dropdown/mobile menu
- Closed: hamburger.
- Open: warm card/dropdown, links stacked.
- Focus: trapped if overlay.
- Escape: closes menu.

## Tabs
No tabs in reference. Do not add.

## Animated asset fallback
All animated graphics have static states. Use static SVG/PNG when motion disabled.

## Reduced motion state
No looping float, no radar spin, no line draw. Use static final state.
