# 06 — Responsive & QA Spec

## Breakpoints in use (from approved design files)
- **Mobile:** ≤560–640px
- **Small tablet:** ≤760–820px
- **Tablet:** ≤900–1020px
- **Desktop:** >1020px (nav links visible from here up)

## Per-component responsive rules

| Component | Desktop | Tablet | Mobile |
|---|---|---|---|
| Bento grids (Services/Industries/About/Security/Case Studies) | 12-col, asymmetric 7/5 spans | same down to ~900px, some sections collapse spans at 820px | single column, `grid-column:auto` on every card |
| Nav links | full inline row | hidden ≤1020px (Industries/Process/About/Security/Case Studies) or ≤960px (Services/Contact); logo + Book a Call button remain | same as tablet |
| Final CTA panel (`cta-v7`) | 2-col (copy + action card) | 2-col down to 860px | 1-col stack ≤860px; button full width, font drops to 15px ≤640px |
| Process timeline | center spine, alternating 3-col (`1fr 104px 1fr`) | same to 760px | left rail spine (31px), single column of cards, node shrinks to 52px |
| Contact grid (copy + form) | 2-col (`1fr 1.05fr`) | 2-col to 900px | 1-col stack ≤900px |
| Integrations marquee chips | full padding | full padding | chip padding/font shrinks ≤640px |
| Testimonial marquee cards | 400px card width | 400px | `min(300px, 84vw)` ≤640px |
| Common-needs / How-we-work strips | 4-col | 2-col ≤760px | 1-col ≤560px |
| Example workflows / trust cards | 3-col | 3-col to 900px | 1-col ≤900px |
| Reach pills (Contact "other ways") | 3-col | 3-col | 1-col ≤640px |

## Global responsive rules
- All root containers set `overflow-x: hidden` and `img { max-width: 100% }` (the `.mobile-safe-v7` pattern) to guard against any single element blowing out horizontal scroll.
- All grid/flex children must not overflow: apply `min-width: 0` recursively inside safe containers (the `.overflow-safe-v6/.overflow-safe-site` pattern) — required for text truncation and flex children to behave inside narrow columns.
- Text sizes use `clamp()` for hero headings and section titles — do not hardcode a single px value for any `h1`/`h2` that currently uses `clamp()`.
- Minimum tap target on mobile: 44×44px for any interactive element (nav CTA, accordion trigger, filter pill, dot indicator) — audit each before sign-off.

## Cross-page QA checklist (run per page, then site-wide)

1. **No dead links.** Every `<a>` resolves to one of the 8 approved routes, a valid `#anchor` on the same page, or an external `mailto:`/`https://wa.me/` link. Zero `href="#"`.
2. **No pricing leakage.** Search rendered output for: "pricing", "plans", "packages", "Starter", "Growth", "Pro", "/month", "per month", "monthly", "/pricing". All must return zero matches outside of explicit negations (e.g. "no pricing tiers").
3. **No blocked compliance claims.** Search for: "SOC 2 certified", "HIPAA compliant", "ISO certified", "GDPR compliant", "bank-level security", "guaranteed uptime", "official partner", "zero risk". Zero matches — the Security page's FAQ answer must explicitly say certifications are *not* currently held.
4. **Sample-data labeling intact.** Every case study card shows "Sample project"; the Case Studies testimonial section shows "Illustrative feedback based on the sample projects above."
5. **FAQ accordion behavior.** Only one item open at a time, per page; keyboard-operable (Enter/Space toggles a focused trigger).
6. **Bento acceptance.** Services and Industries grids use real asymmetric spans (verify computed `grid-column` values differ across cards) — a uniform equal-width grid fails QA.
7. **Search/filter preserved.** Services ⌘K search filters live and clears on Escape; Case Studies filter pills re-filter without a page reload.
8. **Motion respects reduced-motion.** Toggle OS-level "reduce motion" and confirm marquees freeze, timeline spine renders filled, and reveal-on-scroll elements are visible without needing to scroll-trigger them.
9. **Footer parity.** Footer nav includes all 8 routes (Home, Services, Industries, Process, Security & Reliability, Case Studies, About, Contact) on every page, in that order.
10. **Type scale minimum.** No body text below 13px anywhere; no heading below 18px; hero `h1` never smaller than the `clamp()` floor already defined per page.
11. **Color contrast.** Body copy on cream/paper backgrounds uses `#5B6355`/`#68705F` (already AA-compliant against `#F7F2EA`/`#FBF7EE`); body copy on dark backgrounds uses `rgba(245,240,232,.55–.85)` — do not lighten/darken outside these ranges without a contrast re-check.
12. **Mobile nav.** Below the nav-links breakpoint, confirm logo + primary CTA remain visible and tappable (44px min height) — a hamburger/drawer pattern is acceptable if Claude Code needs one for the hidden links, but is not mocked in the design files and should be scoped with the team before building.
