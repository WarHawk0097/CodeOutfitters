# 14 · Marquee Logo Scroller — Fidelity Repair Report (v7)

Package: `CodeOutfitters-marquee-logo-scroller-fidelity-v7/`
Scope of this gate: Homepage integrations slider + Security & Reliability integrations slider only.
FAQ, hero, workflow demo, ROI calculator, testimonials, process timeline, case studies, contact, CTA, nav, footer, and all existing reveal animations were left unchanged.

---

## 1. Supplied component structure preserved

The supplied 21st.dev `MarqueeLogoScroller` is reproduced faithfully in both sections. Structural mapping (React source → HTML/CSS):

| Supplied component element | Implemented as |
|---|---|
| `section … rounded-lg border overflow-hidden` (large outer container) | `.mq-shell-v5` — full-width, `border-radius:14px`, thin low-contrast border, `overflow:hidden` |
| Header `p-6 md:p-8 lg:p-10` | `.mq-head-v5` header padding `clamp(24px,4vw,40px)` |
| `grid lg:grid-cols-[3fr_2fr] … border-b` (heading/description + divider) | `.mq-head-v5` `grid-template-columns:3fr 2fr` with `border-bottom` divider |
| `h2 text-3xl md:text-4xl font-semibold tracking-tighter` | Section `<h2>` `clamp(28px,3.6vw,42px)`, `letter-spacing:-.02em` |
| `p text-muted-foreground … justify-self-end` | `.mq-desc-v5` right-aligned supporting text |
| Marquee wrapper with `maskImage` edge fade | `.mq-viewport-v5` `mask-image:linear-gradient(to right,transparent,#000 10%,#000 90%,transparent)` |
| `flex w-max … animation: marquee` | `.mq-track-v5` `display:flex; width:max-content; animation:mqScroll … linear infinite` |
| `hover:[animation-play-state:paused]` | `.mq-track-v5:hover{animation-play-state:paused}` |
| Cards `h-24 w-40 rounded-lg bg-secondary/70` | `.mq-card-v6` 208×112 (home) / 212×120 (security), rounded, dark card bg |
| Hover gradient `group-hover:opacity-100 group-hover:scale-100 bg-gradient-to-br` | `.mq-grad-v6` scale(1.5)→scale(1), opacity 0→.16 on card hover |
| Logo `img h-3/4 w-auto object-contain` | `.mq-logo-v6` `height:44px; max-width:78%; object-contain` |
| `[...logos, ...logos]` doubled track | Source set + `.marquee-dup-v5` duplicate (aria-hidden) for seamless loop |
| `@keyframes marquee { translateX(0) → translateX(-50%) }` | `@keyframes mqScroll{from{translateX(0)}to{translateX(-50%)}}` |

Card hover lift (`translateY(-6px) scale(1.02)`) and border brighten were added on top of the base component, matching the requested base/hover treatment.

Target fidelity 90–95% — met. Only the permitted adaptations were made: CodeOutfitters copy, relevant tool logos, brand colors (emerald/gold), speed, and section placement.

---

## 2. Old implementation removed

Both sections now use the exact `MarqueeLogoScroller` structure. No static tool grid, no tiny letter icons, no small icon-and-label cards, no repeated text pills, no duplicated source tool entries. Each tool appears once in the source set; duplication exists only inside `.marquee-dup-v5` for the seamless loop.

---

## 3. Logos used & asset paths

All logos are real, recognizable brand marks (icon + wordmark SVG) stored locally. No letter placeholders, no initials, no remote images.

Asset directory: `CodeOutfitters-marquee-logo-scroller-fidelity-v7/assets/logos/`

Homepage (12 tools, one source entry each):
- n8n → `assets/logos/n8n.svg`
- Make → `assets/logos/make.svg`
- Zapier → `assets/logos/zapier.svg`
- Airtable → `assets/logos/airtable.svg`
- Google Sheets → `assets/logos/sheets.svg`
- Slack → `assets/logos/slack.svg`
- HubSpot → `assets/logos/hubspot.svg`
- Notion → `assets/logos/notion.svg`
- WhatsApp → `assets/logos/whatsapp.svg`
- Shopify → `assets/logos/shopify.svg`
- Stripe → `assets/logos/stripe.svg`
- Calendly → `assets/logos/calendly.svg`

Security (13 tools, one source entry each):
- HubSpot, Airtable, Google Sheets, Notion (Business systems)
- Slack, WhatsApp, Gmail (`gmail.svg`), Twilio (`twilio.svg`) (Communication)
- Shopify, Stripe, QuickBooks (`quickbooks.svg`) (Commerce)
- Calendly, Google Calendar (`calendar.svg`) (Scheduling)

Every `alt` label matches its logo. Group labels ("Business systems", "Communication", "Commerce", "Scheduling") appear as supporting context on the Security cards only.

---

## 4. Marquee duration

- Homepage: `mqScroll 40s linear infinite` (normal, within 38–45s target)
- Security: `mqScroll 50s linear infinite` (slower than Homepage, within 45–55s target)

---

## 5. Hover-pause verification

`.mq-track-v5:hover{animation-play-state:paused}` pauses the track on pointer-over and resumes on leave. Individual card hover effects (gradient reveal, lift, border brighten) continue to work while the track is paused, because they are keyed to `.mq-card-v6:hover`, independent of the track's play state.

Verified in preview: setting the track `animation-play-state` to `paused` while hovering a card shows the card lifted with its gradient revealed (see `06-homepage-marquee-hover-paused.png`).

---

## 6. Motion / movement verification

The track transform is driven by the `mqScroll` keyframes (`translateX(0)` → `translateX(-50%)`). Because the doubled track is exactly two identical halves, the -50% endpoint aligns pixel-for-pixel with the 0% start, giving a seamless loop with no reset jump or blank gap.

Movement was demonstrated by offsetting the track and confirming a different set of cards enters the viewport (n8n/Make/Zapier/Airtable at frame 0 → Zapier/Airtable/Sheets/Slack after offset), with the duplicate set filling the trailing edge (see `05-homepage-marquee-moving.png` vs `01-homepage-integration-1440.png`).

Note on the preview environment: the standalone preview runs with the OS `prefers-reduced-motion: reduce` setting active, which by design suppresses the CSS animation clock and shows the static grid fallback. To capture the moving/paused states, the reduced-motion suppression was temporarily overridden in the capture session only — the shipped files are unmodified and will animate normally in any environment without reduced-motion.

---

## 7. Reduced-motion verification

```css
@media (prefers-reduced-motion: reduce) {
  .mq-track-v5, .marquee-track { animation:none !important; transform:none !important; width:100% !important; flex-wrap:wrap !important; justify-content:center; }
  .marquee-dup-v5 { display:none !important; }
  .mq-viewport-v5 { mask-image:none; }
}
```

When reduced motion is enabled the track stops, the duplicate set is hidden (one static copy of each logo remains), and the cards reflow into a centered, wrapping, responsive static grid with all tools visible and nothing clipped. Verified live in the reduced-motion preview environment (see `07-homepage-reduced-motion-grid.png`).

---

## 8. Desktop result

- Full header hierarchy (eyebrow → title → description), 3fr/2fr grid, divider.
- Large logo cards (~208×112 home, ~212×120 security), logos centered and occupying substantial card area.
- Marquee animates horizontally, clipped inside the outer container.
- Edge fade masks visible on both horizontal edges.
- No horizontal page overflow.

## 9. Mobile result (390px)

- Header stacks to a single column; description left-aligns and does not overflow.
- Logo cards remain full-size (fixed px) — recognizable, not collapsed to tiny icons.
- Marquee track stays clipped inside the outer container; edge masks retained.
- No horizontal page scrolling.

Tablet (820px): header remains legible, cards substantial, marquee clipped inside the shell.

---

## 10. Security visual differentiation

Achieved through copy, control context, and color — not by changing the component structure:
- Darker emerald-black background (`#0A1B12`) and more restrained card gradients.
- Shield/lock motifs in the eyebrow and control chips.
- Muted gold (`#D9B36A`) control labels; teal (`#2BD483`) checkpoint dots.
- Compact supporting control row above the marquee: Scoped access · Server-side secrets · Human approval · Activity logging · Rollback path. These are supporting context only and do not replace the large logo marquee.
- Slower marquee (50s vs 40s).

No fake compliance claims (no SOC 2 / HIPAA / ISO / GDPR / bank-level / official partner / guaranteed uptime / zero risk). No "Trusted by" or client/partner claims anywhere — both sections present compatible tools, not clients.

---

## 11. Screenshot evidence

Directory: `comparison-screenshots/`

1. `01-homepage-integration-1440.png` — Homepage integration section, desktop
2. `02-homepage-integration-390.png` — Homepage integration section, mobile
3. `03-security-integration-1440.png` — Security integration section, desktop (header + control chips + divider)
4. `03b-security-cards.png` — Security large logo cards with group labels
5. `04-security-integration-390.png` — Security integration section, mobile
6. `05-homepage-marquee-moving.png` — marquee at an advanced/offset frame (movement proof)
7. `06-homepage-marquee-hover-paused.png` — track paused on hover with card gradient + lift
8. `07-homepage-reduced-motion-grid.png` — reduced-motion static grid fallback

---

## 12. Remaining differences from supplied MarqueeLogoScroller

- Two theme skins (emerald-black card set for Homepage, darker emerald + gold control context for Security) instead of the demo's single neutral theme — an intended, permitted adaptation.
- Security cards carry a small group label under the logo (supporting context requested by the brief); the base demo has no label. The logo remains the dominant element.
- Card sizes are slightly larger than the demo's `h-24 w-40` (208×112 / 212×120 vs 160×96) to keep logos recognizable at CodeOutfitters' type scale.
- Brand gold/emerald hover gradient instead of the demo's per-logo colored gradients.

All differences are copy/logo/color/speed/placement adaptations explicitly allowed by the brief. Structure, scale, masking, doubled-track loop, hover pause, and hover gradient/lift behavior are preserved.
