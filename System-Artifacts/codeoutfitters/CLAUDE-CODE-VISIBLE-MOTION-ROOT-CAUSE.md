# CodeOutfitters — Visible Motion Root Cause

Status prior to this repair: **PRODUCTION MOTION: FAILED — USER-OBSERVED**. Prior motion QA (computed transform matrices, PASS labels) was not trusted as sufficient evidence per explicit instruction; user report of "no visible animations" was treated as authoritative.

## Reproduction

Live production (`https://codeoutfitters.vercel.app/`, commit `9276414`) sampled every ~50ms for 2.5s immediately after navigation, reading `getComputedStyle` on `document.querySelector('h1')`. Result: `opacity:1, transform:none` at every sample from t=22ms onward — never transitions, not merely "too fast to see."

This first probe measured the wrong element: the `<h1>` itself carries no motion styling — its parent wrapper does. First-pass conclusion (no animation exists) was provisional pending correct target verification, per systematic-debugging Phase 1/2.

## Root cause

`components/hero.tsx:60`:

```tsx
<motion.div className="hp-hero-grid items-center" variants={cont} initial={false} animate="show">
```

`cont` variant (`components/hero.tsx:18`) defines `hidden: { opacity: 0 }` and `show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }`. Child `itemV` (`components/hero.tsx:19`) defines `hidden: { opacity: 0, y: 20 }` → `show: { opacity: 1, y: 0, duration: 0.6 }`.

`initial={false}` instructs Framer Motion to **skip the initial variant entirely** and mount the component already in whatever `animate` resolves to (`"show"`). No transition from `hidden` ever plays, for the container or any staggered child — including the wrapper around the `<h1>` and every other hero element under `cont`/`itemV`. This is the sole cause of "no visible animation" for hero staging; it is a single, correctly-defined variant system with the entry point disabled.

No other component in the repo used `initial={false}` (repo-wide grep for `.tsx` confirmed 1 match, this line). Marquees (`hpToolsL`, `secDriftL` CSS keyframe animations), Process scroll-fill, and reduced-motion CSS gating were independently verified as functioning correctly on production before this fix — the failure was isolated to Framer Motion entrance/stagger animations rooted at this one line, not a systemic CSS or motion-provider failure.

## Verified NOT the cause

- `components/motion-mode-provider.tsx`: resolves `data-motion`/`reducedMotion` correctly for normal/`?motion=full`/`?motion=reduced`, confirmed via runtime inspection on production (see PRODUCTION-QA report).
- `app/globals.css` `@media (prefers-reduced-motion: reduce)` blocks: correctly scoped against `data-motion="full"` exclusion; not engaged for a non-OS-reduced user.
- No console/page errors on production load.
- CSS-driven marquee/pulse animations (`hpToolsL`, `badgeGlow`, `shimmerSweep`) run correctly independent of Framer Motion.
