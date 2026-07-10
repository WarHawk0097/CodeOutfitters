# CodeOutfitters — 8-Page Design Package (21st-Inspired Aggressive Pass)

Final standalone design package. Open `CodeOutfitters Homepage v8.dc.html` in a browser; all 8 pages cross-link with relative file links.

## Pages
1. CodeOutfitters Homepage v8.dc.html — hero w/ live product demos, manual-labor-cost calculator, bento services, case marquee, FAQ, CTA
2. CodeOutfitters Services.dc.html — command-palette search (⌘K), bento services grid, expandable "how it works", integrations marquee, FAQ, CTA
3. CodeOutfitters Industries.dc.html — bento industry grid (7 industries), common-needs strip, example workflows, proof stats, FAQ, CTA
4. CodeOutfitters Process.dc.html — animated 6-step center-spine timeline w/ scroll progress, "why no packages", FAQ, CTA
5. CodeOutfitters About.dc.html — mission, bento beliefs grid, how-we-work, quality principles, trust cards, CTA
6. CodeOutfitters Security Reliability.dc.html — access/secrets bento, AI guardrails, reliability & handoff bento, scoped-integrations marquee, FAQ, CTA
7. CodeOutfitters Case Studies.dc.html — industry filters, expandable sample case stories w/ metric strips, animated rotating testimonials, CTA
8. CodeOutfitters Contact.dc.html — working form UI w/ success state, animated hero gradient, other-ways-to-reach, mini FAQ

## 21st.dev-inspired patterns applied
- Bento/Grid + Feature Bento → Services (7/5–5/7–7/6 spans), Industries (7-card bento + full-width closer), About beliefs, Security (feature rows + span cards)
- Process Timeline / Modern Timeline → Process (center spine, animated progress fill, alternating cards)
- FAQ Accordion → Services, Industries, Process, Security, Contact (+ Homepage)
- Integrations / Integration Hero → Services + Security (counter-scrolling tool marquees with edge fades)
- Animated Testimonials → Case Studies (auto-rotating quotes, 5.2s cadence, clickable dots)
- Background Gradient Animation → Services + Contact heroes (slow drifting radial blobs, subtle)
- Book A Call Button → nav CTAs and primary CTAs use shine-sweep hover treatment; all CTAs link to Contact

## Deliberate exclusions (per brief)
- No pricing page, tables, tiers, plan cards, or per-month pricing anywhere. Pricing is handled as: custom quote after discovery, fixed scope after audit.
- No unverifiable security claims (no SOC 2 / HIPAA / ISO / uptime guarantees). Security page states practices honestly, incl. a direct "no formal certifications today" FAQ answer.
- Case studies and testimonials are labeled as sample/illustrative work.

## Brand
Dark emerald + cream: #0A120E / #0E2A1D / #17A063 / #2BD483 accents, gold #D9B36A, paper #F7F2EA. Type: Space Grotesk (display) + Instrument Sans (body), Google Fonts.

## Notes
- Pages are self-contained `.dc.html` design files running on the included `support.js` runtime + `motion.js` reveal helper. Keep both files and `assets/` next to the HTML files.
- Responsive: bento grids collapse to 1 column ≤820px; nav links hide ≤960–1020px (logo + Book a Call remain); CTA panels stack ≤860px.
