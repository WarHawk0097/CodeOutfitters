# UIX0 / MOTION0 BRIEF

> The owner has stated a premium animation and design-taste direction (D-011, D-012). This brief is input for PM1 and for the future UIX0 / MOTION0 phase. **Do not implement any UI change in the current batch. Do not install any design skill or MCP server.**

## 1. Owner Direction

- **Heavy premium agency-grade animations** inspired by `befluence.pro`. Reference only. Do not copy. Do not scrape. Do not clone assets.
- **Impeccable** as a possible frontend design review layer. Helps avoid AI-generated generic UI.
- **Emil Kowalski / Agents with Taste** as a possible motion / animation taste reference. Helps keep motion purposeful, not decorative.

## 2. Desired Feel

- Premium AI automation agency. Modern, bold, high-energy.
- Smooth scroll-driven storytelling.
- More animated than a normal SaaS site, but not childish.
- Professional enough for US small-business clients.
- Cool enough to feel like a high-end AI agency.
- Animations have purpose. No decorative-only motion. No random parallax. No "showy" easing curves that delay the user.

## 3. Animation Inventory Candidate List

Public site:

- Hero entrance animation
- Animated headline reveal
- Scroll-triggered section reveals
- Smooth parallax layers
- Floating cards
- Animated service cards
- Horizontal marquee / moving logo strips (already partially in place via `components/tools-strip.tsx`)
- Animated statistics counters
- Interactive hover / magnetic buttons
- Smooth page transitions (already partially in place via `components/page-transition.tsx`)
- Portfolio cards with motion depth
- Process timeline animation
- ROI calculator micro-interactions
- Contact / booking form transitions

Admin:

- Lighter and faster than the public site.
- No parallax, no floating cards, no marquees.
- Page transitions ≤ 200ms.
- Form sections do not have entrance animations that delay the user.

## 4. Existing Animation Stack

Detected in `package.json` and the repo:

- GSAP 3.15
- ScrollTrigger (from `gsap/ScrollTrigger`)
- `@gsap/react` 2.1
- Framer Motion 12
- AOS 2.3
- Lenis 1.3 (smooth scroll)
- Tailwind v4 transitions (used implicitly via classes)

Three GSAP entry points exist (`lib/gsap.ts`, `lib/animations/gsap-setup.ts`, `lib/animations/gsap-config.ts`) and two `useScrollReveal` hooks exist (`hooks/useScrollReveal.ts`, `lib/animations/useScrollReveal.ts`). This is a refactor candidate; see R-021.

## 5. Animation Architecture Risks

- **Too many libraries.** GSAP, Framer Motion, and AOS overlap. Each adds bundle weight. Pick a primary per use-case.
- **Duplicate GSAP entry points.** Three files configure the same library differently. Risky for "is `ScrollTrigger` registered here or there" questions.
- **Duplicate `useScrollReveal` hooks.** Same name, different behavior. Easy to import the wrong one.
- **Mobile performance risk.** Smooth scroll + GSAP + AOS + Framer Motion on a low-end device will jank.
- **Bundle size risk.** All six libraries total roughly 80-120 KB gzipped. Adding any new library needs a justification.
- **Reduced motion risk.** AOS does not auto-handle `prefers-reduced-motion`. R-015.
- **Layout shift risk.** Scroll-triggered transforms that change layout (not just transform / opacity) cause CLS. Avoid.
- **Generic AI look risk.** If the team copies `befluence.pro` layouts, the site loses its own identity.
- **Over-animation risk.** Animations on every section feel busy and reduce the impact of the hero.

## 6. First Slice Recommendation

**Recommendation: a small, deliberate slice that proves the model without ballooning.**

First slice:

1. **Hero entrance + animated headline reveal.** Single component, owned by the home page. Uses GSAP for the timeline, AOS for the rest of the section if any, or replaces AOS for that section.
2. **Scroll-triggered section reveals.** One canonical hook. Replaces `useScrollReveal` duplicates. Respects `prefers-reduced-motion`.
3. **ROI calculator micro-interactions.** Sliders already work; add value-update animation and a subtle "settle" on stop.
4. **Reduced-motion coverage.** AOS opt-out, GSAP opt-out, Framer Motion opt-out. The site must pass the media-query test.

Defer to a later slice:

- Smooth parallax layers (mobile performance risk; needs a separate benchmark)
- Magnetic buttons (small but additive; better as part of the design-taste pass)
- Portfolio cards with motion depth (refactor of `components/portfolio.tsx`)
- Process timeline animation (refactor of `components/process.tsx`)
- Contact / booking form transitions (refactor of multiple forms)
- Marquee polish (already exists; needs design pass)

This is a recommendation, not a decision.

## 7. Performance Budget Proposal

- **LCP:** unchanged or improved after motion is added. The hero must not be slowed by its own entrance.
- **CLS:** 0. No layout-shifting animations. Use transform / opacity only.
- **INP:** stays in the "good" range on a Moto G Power class device.
- **JS bundle:** +0 KB net from new libraries. The first slice reuses existing libraries.
- **CSS:** no new CSS framework. Use Tailwind transitions where applicable.
- **Network:** no new external assets. The first slice does not load new fonts, scripts, or images.
- **Verification:** Lighthouse mobile audit before and after, in the Playwright MCP + Chrome DevTools MCP loop.

## 8. Accessibility Requirements

- All non-essential motion must opt out when `prefers-reduced-motion: reduce` is set.
- Focus state must be visible at all times, even during transitions.
- Keyboard navigation must not be broken by enter/exit animations.
- Animations must not delay interaction. The hero entrance can be 600-1000ms, but it must not block scroll or click.
- `aria-live` regions are unaffected by motion.
- Color contrast is unaffected by motion.
- `motion` + `vestibular` accessibility is a hard requirement, not a nice-to-have.

## 9. Browser QA Loop Later

After tooling approval, the desired loop is:

1. AI generates motion / UI change.
2. AI opens the page in browser using Playwright MCP and / or Chrome DevTools MCP.
3. AI visually critiques the result using Impeccable + Emil Kowalski rules.
4. AI improves weak sections.
5. AI repeats until the page feels premium and polished.

In parallel, the team runs:

- Lighthouse mobile audit (LCP, CLS, INP, TBT).
- Real-device test on at least one mid-tier Android.
- Reduced-motion variant capture (AOS, GSAP, Framer Motion opt-outs visible).

## 10. Acceptance Criteria

A future UIX0 / MOTION0 first-slice phase is complete when:

1. The hero entrance, animated headline, scroll-triggered section reveals, ROI micro-interactions, and reduced-motion coverage ship together in one PR.
2. LCP, CLS, and INP are within the agreed budget on a real device.
3. The site passes `prefers-reduced-motion: reduce` testing in Chrome DevTools.
4. Impeccable + Emil Kowalski review has been run, and the team can point to specific before / after.
5. The duplicate GSAP and `useScrollReveal` paths are removed (or at least the unused ones are).
6. A `repo-research/MOTION_QA_LOG.md` captures the Lighthouse + reduced-motion + taste review.
7. `docs/FEATURES.md`, `docs/ARCHITECTURE.md`, `docs/QA_CHECKLIST.md`, and `repo-research/RISK_REGISTER.md` are updated to reflect what shipped.

## 11. Required Gate Before Implementation

- PM1 to recommend the first slice and the performance budget.
- ChatGPT Control Room to approve the slice, the budget, and the tooling list.
- A dedicated UIX0 / MOTION0 phase (post-PM1, post-approval) to perform the work.
- The browser-QA tooling (Playwright MCP, Chrome DevTools MCP) must be approved (TS0 / RDG0) before the QA loop can run.
- The design skills (Impeccable, Emil Kowalski) must be approved before they can be installed or invoked.

**No UI change in this batch. No animation code change. No package edit. No skill install. No MCP setup.**
