# Services Visual Specification

Source: `CodeOutfitters Services.dc.html`

## Global shell

- Fonts: Space Grotesk 500/600/700; Instrument Sans 400/500/600/700.
- Page base `#F7F2EA`; dark base `#0A120E`; dark-green section `#0E241A`.
- Primary content width `1180px`; easing `cubic-bezier(.16,1,.3,1)`.
- Header: sticky cream `rgba(247,242,234,.92)`, blur 14px, border `#E5DCCB`, minimum height 68px, 28px logo, 15px links, 14px CTA with `11px 18px` padding and 10px radius.

## Hero and search

- Background: `radial-gradient(1000px 600px at 78% -15%,rgba(23,160,99,.20),transparent 60%),#0A120E` plus two animated ambient blobs.
- Inner: max 820px; centered column; 24px gap; padding `clamp(56px,8vw,88px) clamp(20px,3vw,32px) clamp(40px,6vw,60px)`.
- Eyebrow: gold pill, 11.5px/700, `.14em` tracking.
- H1: `600 clamp(34px,4.6vw,56px)/1.1`; exact copy “Six automations. One outcome: your time back.” with “One outcome:” green.
- Body: 18px/1.65, max 560px.
- Search: max 520px; 16px input; dark translucent surface; 14px radius; 16px vertical padding; left search glyph and right Cmd+K chip.
- Results: dark `#10301F`, 14px radius, 8px padding, max height 280px, 34px icon tiles.

## Services bento

- Dotted cream background; 1180px container; section padding `clamp(56px,8vw,92px) clamp(20px,3vw,32px)`.
- 12 columns, 22px gap. Card spans: 7/5, 5/7, 7/5; one column at 820px.
- Cards: warm white gradient, 1px green-tinted border, 22px radius, shadow `0 20px 54px rgba(18,32,27,.10)`, padding `clamp(24px,2.6vw,32px)`, 16px internal gap.
- Icon tile 50×50, radius 14px; card title 22px/1.2; body 15px/1.62; chips 11.5px; metric 20px/700.
- “How it works”: cream button, 10px radius, `11px 14px`; three numbered rows; max-height/opacity expansion and rotating chevron.
- Pointer spotlight and 6px hover lift retained; touch does not hide any required content.

## Integrations

- Background `#0E241A`; 1180px shell; padding `clamp(48px,6vw,76px)`; 28px vertical gap.
- Heading 26–38px/1.15; body 16px/1.6, max 540px.
- Two rows with 12px gaps; chip padding `11px 18px`, pill radius, 14px text; edge fades 80px.
- First row 38s left; second 44s right. Pointer pause/resume and reduced static set required.

## FAQ

- Cream `#F7F2EA`; max 820px; section padding `clamp(56px,8vw,92px)`.
- Heading “Service questions.” at 28–42px/1.15.
- Five rows, 12px gaps; background `#FCFAF4`, border `#EDE6D8`, radius 16px; open row white with green border and elevated shadow.
- Question 16px/600; button padding `18px 22px`; 30px circular chevron; answer 15px/1.62.

## CTA and footer

- CTA dark radial shell; max card 1060px; columns 1.1fr/.9fr; radius 28px; responsive stack at 860px.
- Exact Services CTA eyebrow/copy/checklist/action copy from source lines 218–235.
- Footer `#070D0A`; 1180px; three columns; main padding `56px 32px 40px`, lower row `20px 32px`; exact Services and Company link order/status.

## Motion modes

- Full: hero entrance/ambient blob, card stagger/spotlight/hover, button sweep, card and FAQ expansion, marquees, CTA reveal.
- Reduced: no decorative continuous motion, no hidden reveal content, integrations show one static readable sequence, all search/expand/FAQ controls remain functional.
