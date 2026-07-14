# CodeOutfitters Homepage Visual Specification

Source: `F:\CodeOutfitters\# CodeOutfitters Project Audit)\CodeOutfitters-complete-motion-enhancement-v1\CodeOutfitters Homepage v8.dc.html`

## Global system

- Page colors: cream `#F7F2EA`, near-white `#FDFBF6`, dark green `#0E241A`, deepest green `#070D0A`, body base `#0A120E`.
- Display family: Space Grotesk, weights 500/600/700. Body family: Instrument Sans, weights 400/500/600/700.
- Main container: `1180px`; centered with responsive side padding `clamp(20px,3vw,32px)`.
- Typical section block padding: `clamp(56px,8vw,92px) clamp(20px,3vw,32px)`.
- Primary motion curve: `cubic-bezier(.16,1,.3,1)`; reveal curve `cubic-bezier(.22,1,.36,1)`.
- Light surfaces use `#E8DFCC` borders and warm cream shadows. Dark surfaces use translucent white borders.

## 1–2. Announcement and header

- Announcement: `#0E2A1D`; `10px 16px`; centered 13.5px copy.
- Header: sticky, minimum height `68px`; `rgba(247,242,234,.92)` with `backdrop-filter: blur(14px)` and bottom border.
- Inner width `1180px`; 28×28 logo; five desktop links; CTA at `14px`, padding `11px 18px`, radius `10px`.
- Desktop links hide at `960px` and below. No mobile drawer or substitute menu is approved.
- Preserve scroll state treatment and the thin page progress indicator.

## 3. Hero

- Dark radial-gradient atmosphere with grid and animated path accents.
- Container `1180px`; grid `1.02fr .98fr`; top padding `clamp(48px,7vw,84px)` and bottom `clamp(56px,8vw,96px)`; collapse to one column at `900px`.
- Eyebrow: “AI Automation Agency”.
- H1: “We automate the work you shouldn't be doing”; Space Grotesk 600, `clamp(36px,4.8vw,62px)/1.08`.
- Supporting copy: `19px/1.65`, maximum width `460px`.
- Buttons: “Get a Custom Quote” and “Book a Free Call”; rounded rectangular controls with the approved green/outlined treatments.
- Trust row: “No long contracts”, “Results in 7 days”, “30-day support”.
- Visual: browser-style Automation Engine, minimum height `252px`, WhatsApp/Email/Support tabs, message/status cards and connectors. Preserve tab transition, entrance, float, and path motion.

## 4. Proof metrics

- Four equal cells; padding `30px 24px`; light border dividers.
- Values/copy: `50K+` hours automated for clients; `120+` automations shipped; `12` industries served; `98%` client retention.
- Collapse cleanly on narrow screens without horizontal overflow.

## 5. Integration marquee

- Background `#0E241A`; padding `24px 0 28px`.
- Heading: “Powered by industry-leading AI infrastructure”.
- Two nowrap, clipped rows with `12px` chip gaps and approximately `140px` desktop edge fades.
- Chip icons: `34px` tile with `22px` image. Approved order: WhatsApp, Anthropic, Notion, Airtable, Google Sheets, n8n, Make, Zapier; second row reversed.
- Durations `60s` and `70s`, opposite directions. Each moving row contains one original sequence and one accessible-hidden duplicate sequence. Pointer hover pauses and lifts/highlights the chip; reduced mode shows a stable usable sequence.

## 6. Services bento

- Dotted cream `#F7F2EA` section; container `1180px`.
- Heading: “Each system is custom-built for your business — deployed in 7 days.”
- Twelve-column grid, `18px` gap. Featured WhatsApp card spans 12 columns with internal `.92fr 1.08fr` grid; two support cards each span 6. Stack at `900px`.
- Cards: radius `22px`, warm cream gradient, `#E8DFCC`-family border and soft elevated shadow; distinct approved internal layouts, not a generic card template.
- Featured demo minimum height `380px`; preserve card hover and stagger behavior.

## 7. Process preview

- Background `#FDFBF6`; heading “From Discovery to Deployed in 7 Days”.
- Timeline maximum width `940px`; four steps with `30px` vertical gap; centered `4px` spine.
- Alternating cards: Discovery Call, Custom Scope, We Build It, You Save Time; final marker “DAY 7 LIVE”.
- Cards radius `18px`, padding `22px 26px`, warm border/shadow.
- At `760px`, convert to a left rail with all cards on the right. Preserve staged node/spine activation.

## 8. Calculator

- Dark `#0E241A` section with radial glow.
- Heading: “How much is manual work costing you?”
- Calculator maximum width `1020px`, radius `26px`; header spans both columns; body grid `1.02fr .98fr`, stacking at `760px`.
- Input panel contains exactly three sliders: team `1–50` (default 5), hours `1–40` (default 10), hourly rate `$10–$150`, step 5 (default 25). Tracks display filled progress.
- Results show weekly, monthly, and annual loss plus the approved monthly savings/action treatment.
- Formula is `team × hours × rate`; monthly multiplier 4 and annual multiplier 48. Preserve pulse feedback and responsive stacking.

## 9. Case studies

- Dotted `#F7F2EA`; container `1180px`; heading “Real Businesses, Real Results”.
- Grid gap `18px`. Featured proof spans full width and uses `1.32fr .68fr`; two support cards below.
- Retain the approved exact labels, descriptions, metrics, icon placement, border/radius, featured treatment, hover behavior, and mobile stack.

## 10. Testimonials

- Background `#0E241A`; heading “Small teams. Big time savings.”
- Featured card maximum width `740px`, radius `24px`; quote, 46px avatar, name/role and three manual dots (active width 22px, inactive 8px).
- Two moving rows, durations `52s` and `60s`; row order reversed. Cards `min(400px,84vw)`, radius `18px`, padding `24px 26px`; 40px avatars.
- Preserve six approved testimonials, 6-second featured rotation, manual selection, pause behavior, and accessible duplicate handling.

## 11. FAQ

- Background `linear-gradient(#F7F2EA,#EFE7D6)`; inner maximum width `896px`.
- Badge “FAQ”; heading “Frequently Asked Questions”; intro “Have a question? We've got answers. If you don't find what you're looking for, feel free to contact us.”
- Exactly five approved questions/answers. Row background white, border `#E8DFCC`, radius `12px`; active border `rgba(23,160,99,.5)` and shadow `0 4px 6px -1px rgba(18,32,27,.10), 0 2px 4px -2px rgba(18,32,27,.10)`.
- One row open at a time (first initially open). Body uses animated grid rows and opacity; chevron rotates over `.4s cubic-bezier(.34,1.56,.64,1)`; keyboard focus remains visible.
- Include the approved “Still have questions?” bottom card and mobile spacing.

## 12. Final CTA

- Dark radial section. Card maximum width `1060px`, radius `28px`, grid `1.1fr .9fr`, collapsing on narrow screens.
- Heading “Book a Discovery Call”; exact approved body copy and benefit chips on the left; light action card on the right.
- Primary button “Book Free Discovery Call”; availability text “3 build slots left for July”.
- Preserve decorative glow, hover/press treatment, reveal staging, and responsive alignment.

## 13. Footer

- Background `#070D0A`; inner maximum width `1180px`; main padding `56px 32px 40px`, lower row `20px 32px`.
- Three functional columns: brand, Services, Company. Preserve approved labels and exact link order.
- Lower row includes legal/copyright content and status “All systems operational”.
- Tablet/mobile layouts stack without inventing links or controls.

## Responsive comparison targets

- `1440×1000`: full navigation, two-column hero, bento and proof grids, centered process spine, split calculator/CTA.
- `820×1180`: desktop links hidden; hero and breakpoint-controlled grids stack exactly as source; card widths and side padding follow source CSS.
- `390×844`: single-column composition, no mobile menu, left-rail process, clipped marquees, full-width buttons/cards where specified, stacked footer, and no horizontal overflow.

## Copy and motion acceptance

All headings, paragraphs, labels, buttons, card content, FAQ content, testimonial identities, CTA text, and footer text must be copied verbatim from the active approved file. Full mode preserves hero staging, tab repetition, reveals/staggers, calculator feedback, process activation, marquees, testimonials, FAQ, and CTA behavior. Reduced mode removes nonessential continuous/staged motion while leaving all content visible and interactive.
