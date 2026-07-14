# Industries visual specification

## Global geometry

- Page background: `#F7F2EA`; dark ink: `#0A120E`; common-needs dark: `#0E241A`.
- Content maximum: 1180px; FAQ maximum: 820px; hero maximum: 780px; CTA panel maximum: 1060px.
- Standard horizontal padding: `clamp(20px, 3vw, 32px)`.
- Display face: Space Grotesk, weight 600. Body face: Instrument Sans.

## Hero

- Dark radial field with green glow positioned near the upper-right.
- Vertical padding: `clamp(56px,8vw,88px)` top and `clamp(44px,6vw,64px)` bottom.
- Gold outlined eyebrow, 22px stack gap, centered copy.
- H1: `600 clamp(34px,4.6vw,54px)/1.1`; highlight “how your industry” in `#2BD483`.
- Body: 18px/1.65, maximum 560px.

## Industry grid

- Cream dotted field, section padding `clamp(56px,8vw,92px)`.
- Heading treatment uses green uppercase text between two 38×2 gold rules.
- Twelve-column spans: `7/5, 5/7, 7/5, 12`; 22px gaps; all cards stack at 820px.
- Cards: 22px radius, warm white gradient, green border, deep soft shadow, 24–30px padding.
- Each card contains a 50px gradient icon tile, exact problem copy, three green chips, tools line, and a separated contact link.
- Full motion: viewport rise plus pointer spotlight and 6px hover lift. Reduced motion: static readable cards with no movement.

## Common needs, workflows, and proof

- Common needs: `#0E241A`, centered heading/body, four equal translucent cells; two columns at 760px and one at 560px.
- Workflows: three columns with 20px gaps, stacking below 900px; 20px-radius warm cards, gold category chip, numbered green steps.
- Proof: four equal dark cells divided by 1px translucent rules; green 30px figures over muted labels.

## FAQ

- Cream field, maximum 820px, 12px gaps.
- Closed cards use `#FCFAF4`; open cards become white with green border and deeper shadow.
- Toggle is a 30px circle with rotating chevron; body expands/collapses and remains keyboard accessible.

## CTA and responsive behavior

- Dark radial section containing a 1060px green-black gradient panel with 28px radius.
- Panel uses `1.1fr/.9fr` columns and collapses at 860px.
- Left column: gold eyebrow, 30–46px heading, exact paragraph, three promise chips.
- Right column: translucent action card, three deliverables, full-width gold CTA with sweep hover.
- At 640px panel padding becomes 24px 20px and CTA typography/buttons tighten without horizontal overflow.
