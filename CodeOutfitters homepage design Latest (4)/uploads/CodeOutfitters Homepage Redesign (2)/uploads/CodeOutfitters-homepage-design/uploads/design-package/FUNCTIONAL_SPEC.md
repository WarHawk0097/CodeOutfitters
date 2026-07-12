# CodeOutfitters — Finalized Reference Handoff

Source of truth: `reference/desktop.png`.

Important: all measurements, colors, spacing, typography sizes, shadows, glows, and dimensions are estimated from the provided reference image unless explicitly marked otherwise.

Non-negotiable: do not redesign, do not invent sections, do not flatten editable UI into full-section images, and do not drift from the approved visual reference.


# FUNCTIONAL_SPEC.md

## Navbar behavior
- Desktop: nav links visible, audit button visible.
- Mobile: nav collapses into hamburger; menu slides/fades down.
- Header can remain static; sticky behavior optional but not visible in reference.

## Dropdown behavior
No dropdowns visible. If nav categories later require dropdowns, implement only after explicit approval.

## CTA button behavior
All `Book a Free Audit` buttons should link to the same scheduling/audit route or modal.
Recommended href: `/book-audit` or scheduling URL configured in environment.

## Secondary CTA behavior
`See How It Works` should scroll to process section using smooth scroll.

## Form behavior
No form visible. Do not invent a form.

## Tab behavior
No tabs visible.

## Card hover behavior
Service cards may lift 2–4px, shadow increases slightly, border shifts toward teal. Cards should not rearrange or open unless explicitly implemented.

## Scroll behavior
Standard vertical scroll. Optional subtle scroll reveal for sections.

## Mobile menu behavior
States:
- closed: hamburger icon.
- open: nav links stacked, CTA button below.
- focus trapped if full-screen overlay; simple dropdown acceptable.

## Link behavior
Nav links route or scroll to visible sections.
- Services → What We Build
- Solutions → What We Build or relevant section
- Process → Process timeline
- Resources/About → routes or placeholders

## Dashboard/widget behavior
All feature card widgets are visual/demo only unless connected to live data. Mark metrics as static demo content.

## Loading states
- Buttons: show spinner or text fade if async.
- Page: use skeleton only if dynamic content loads.

## Error states
No forms in reference. For audit modal/form later, use inline error text and red accessible border.

## Empty states
Not visible. For future dashboard data, use empty card messaging.

## Success states
Audit booking success should show confirmation modal or toast.

## Accessibility behavior
- Keyboard focus ring visible.
- Buttons have accessible names.
- SVG icons either decorative `aria-hidden=true` or have labels when meaningful.
- Color contrast must pass WCAG AA for text.
- Motion respects `prefers-reduced-motion`.

## Keyboard/focus behavior
- Tab order follows visual order.
- Mobile menu can be opened/closed with keyboard.
- Escape closes mobile menu/modal.
