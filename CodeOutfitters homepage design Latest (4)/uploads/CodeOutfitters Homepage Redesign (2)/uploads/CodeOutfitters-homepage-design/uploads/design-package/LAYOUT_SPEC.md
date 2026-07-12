# CodeOutfitters — Finalized Reference Handoff

Source of truth: `reference/desktop.png`.

Important: all measurements, colors, spacing, typography sizes, shadows, glows, and dimensions are estimated from the provided reference image unless explicitly marked otherwise.

Non-negotiable: do not redesign, do not invent sections, do not flatten editable UI into full-section images, and do not drift from the approved visual reference.


# LAYOUT_SPEC.md

## Page width
Reference image is portrait desktop screenshot. Approximate design canvas: 1086 × 1448px. Browser/page shell has a rounded outer border.

## Max content width
Estimated: 980–1040px within the page shell.

## Desktop layout
Single-page stacked homepage:
1. Navbar
2. Hero
3. Trust strip
4. What We Build
5. Process timeline
6. CTA panel

## Tablet layout
Maintain section order. Hero becomes stacked or two-column with reduced visual size. Cards become 2-column. Process timeline can wrap or become stepped vertical.

## Mobile layout
Navbar collapses to hamburger. Hero stacks text first then illustration. Cards stack 1-column. Process becomes vertical. CTA stacks headline, button, proof, stats.

## Section order
Same as desktop reference. Do not add or remove sections.

## Section heights estimated
| Section | Height |
|---|---:|
| Navbar | 76px |
| Hero | 520–560px |
| Trust strip | 90–105px |
| What We Build | 520–590px |
| Process | 150–180px |
| CTA | 210–260px |

## Grid system
- Desktop: 12-column page grid.
- Hero: 5.2 columns text / 6.8 columns visual.
- Feature cards: 3-column grid × 2 rows.
- Process: 5 equal columns.
- CTA: two main zones: left proof copy, right button + stats.

## Background treatment per section
Same warm ivory background throughout with subtle section dividers.
Feature and CTA cards are warmer white with shadows.

## Hero composition
Left:
- pill label
- 3-line headline
- body paragraph
- feature chips row
- two CTA buttons

Right:
- large floating 3D hero automation visual aligned slightly above center
- pedestal sits lower-right, not too low
- decorative rods around visual

## Feature section composition
Centered overline and headline. Six cards in 3 columns:
1. AI Helpdesk — mini two-column card with gauge.
2. Booking Automation — text + calendar.
3. CRM Workflow — text + icon flow.
4. Lead Capture — lead rows.
5. Analytics Dashboard — line chart.
6. Hermes Agent Deployment — radar visual.

## Process/workflow section
Horizontal numbered timeline with five equal nodes:
01 Discover, 02 Design, 03 Build, 04 Deploy, 05 Optimize.

## CTA composition
Large rounded panel. Left: headline, subtext, avatars, stars. Right/top: button. Bottom/right: stat strip with four stat cells. Decorative dotted radial pattern at far-right.

## Footer
Not visible in reference. Do not invent unless implementation requires a minimal footer after the shown CTA.

## Section details

### Navbar
- Approx height: 72–80px.
- Layout: logo left, nav center, CTA right.
- Background: same as page, no solid contrasting bar.
- Responsive: logo + hamburger + CTA hidden/inside menu.

### Hero
- Approx height: 520–560px.
- Layout: two-column.
- Text placement: left, vertically centered.
- Asset placement: right, large, top-heavy but balanced.
- CTA placement: below chips, horizontal buttons.
- Responsive: stack text then visual, shrink visual to fit.

### Trust strip
- Approx height: 92px.
- Layout: centered small heading, then logo row.
- Background: same warm surface with top/bottom dividers.
- Responsive: wrap logos to 2 rows or horizontal scroll.

### What We Build
- Approx height: 540px.
- Layout: centered header, 3×2 card grid.
- Asset placement: inside individual editable cards.
- Responsive: 2 columns tablet, 1 column mobile.

### Process
- Approx height: 160px.
- Layout: horizontal line with five equal nodes.
- Responsive: vertical timeline on mobile.

### CTA
- Approx height: 240px.
- Layout: large rounded panel, left text/proof, right CTA/stats.
- Responsive: stack all content vertically; stats in 2×2 or 1-column.
