# CodeOutfitters — Finalized Reference Handoff

Source of truth: `reference/desktop.png`.

Important: all measurements, colors, spacing, typography sizes, shadows, glows, and dimensions are estimated from the provided reference image unless explicitly marked otherwise.

Non-negotiable: do not redesign, do not invent sections, do not flatten editable UI into full-section images, and do not drift from the approved visual reference.


# COMPONENT_INVENTORY.md

## Navbar
- Purpose: top-level navigation and primary conversion CTA.
- Section: Navbar.
- Approx size: full width, 72–80px high.
- Content: logo mark, CodeOutfitters text, nav links, audit button.
- Styling: transparent warm background, no heavy border.
- Responsive: collapses to hamburger menu on mobile.
- States: link hover teal underline/fade; CTA hover lift; mobile open/closed; focus ring.

## Logo lockup
- Purpose: brand recognition.
- Section: Navbar.
- Approx size: 170×32px.
- Content: teal code mark + black wordmark.
- Styling: mark SVG; wordmark editable text or wordmark SVG if required.
- States: default/hover.

## Nav link
- Purpose: navigation.
- Sections: Navbar.
- Size: 44–80px width each.
- Styling: small clean sans, black text.
- States: default, hover teal, focus, active.

## Primary button
- Purpose: main CTA.
- Sections: Navbar, Hero, CTA.
- Approx size: nav 138×42px; hero 165×50px; CTA 138×42px.
- Styling: teal gradient, white text, 10–12px radius, subtle shadow.
- States: default, hover lift, active press, focus, disabled, loading.

## Secondary button
- Purpose: educational CTA.
- Section: Hero.
- Approx size: 188×50px.
- Styling: cream/white background, teal text, light border, circular arrow icon right.
- States: default, hover border teal/glow, active, focus.

## Hero badge / pill
- Purpose: category badge.
- Section: Hero.
- Size: approx 230×28px.
- Styling: pill border, teal uppercase label, small sparkle/asterisk icon.
- States: static.

## Hero headline
- Purpose: core value proposition.
- Section: Hero.
- Size: large text block.
- Styling: serif/editorial; black first two lines, teal third line.
- Editable text. Not image.

## Hero body paragraph
- Purpose: explain offer.
- Section: Hero.
- Styling: sans-serif, muted black.
- Editable text.

## Hero feature chip row
- Purpose: quick benefit markers.
- Section: Hero.
- Content: Automate, Orchestrate, Scale with small teal icons.
- Styling: inline icons/text.
- States: hover optional.

## Hero 3D visual
- Purpose: premium automation proof.
- Section: Hero.
- Structure: pedestal, glow beam, three glass panels, icons, labels.
- Styling: soft ivory glass, teal glow, gold edge.
- Best implementation: separate complex PNGs + editable text/SVG icons.

## Trust strip
- Purpose: social proof.
- Section: Trust.
- Structure: centered overline + logo row.
- Styling: light dividers; grayscale logos.
- States: static; logo hover optional.

## Section header
- Purpose: label and headline.
- Sections: What We Build, Process.
- Styling: uppercase teal overline + serif headline.
- Editable.

## Service card base
- Purpose: feature card container.
- Section: What We Build.
- Approx size: 300×185px.
- Styling: white/cream card, border, shadow, 18px radius.
- States: hover lift/shadow; focus if clickable.

## AI Helpdesk card
- Components: text column, status pill, divider, semicircle gauge, stat labels.
- Visual/demo only unless linked to real metrics.
- Editable card.

## Booking Automation card
- Components: text, calendar mini-widget, captured stat, confirmed pill, no-show stat.
- Editable; calendar may be static demo.

## CRM Workflow card
- Components: text, icon flow row, captured/qualified/nurtured metrics.
- Editable; icons SVG.

## Lead Capture card
- Components: text, lead row, avatar row.
- Visual/demo only unless connected.
- Editable.

## Analytics Dashboard card
- Components: text, opportunity metric, line chart.
- Chart can animate but remains SVG/CSS.

## Hermes Agent Deployment card
- Components: text and radar/shield visual.
- Radar is a complex asset or SVG.

## Process timeline
- Purpose: delivery method.
- Structure: horizontal line, five numbered nodes, title/body under each.
- Responsive: vertical on mobile.
- States: active node optional on scroll.

## CTA panel
- Purpose: final conversion.
- Structure: headline, subtext, avatar cluster, stars, button, stat strip, dotted pattern.
- Styling: large rounded warm card, border, subtle shadow.

## Avatar cluster
- Purpose: trust/proof.
- Section: CTA.
- Use: generic avatars or real approved headshots only.
- If generated, must be non-identifiable placeholders.

## Stat cell
- Purpose: proof metric.
- Section: CTA.
- Structure: large teal number + small label.
- Editable.
