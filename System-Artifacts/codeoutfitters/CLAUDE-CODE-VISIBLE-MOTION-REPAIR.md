# CodeOutfitters — Visible Motion Repair

## Fix

`components/hero.tsx:60` — one-line change:

```diff
-        <motion.div className="hp-hero-grid items-center" variants={cont} initial={false} animate="show">
+        <motion.div className="hp-hero-grid items-center" variants={cont} initial="hidden" animate="show">
```

No other files touched. No duration/easing/distance values changed — existing `cont`/`itemV` variant definitions (`components/hero.tsx:18-19`) were already correct and untouched.

## Verification sequence

1. Typecheck: `npx tsc --noEmit` — clean, no errors.
2. Build: `npx next build` — 17/17 static routes generated successfully.
3. Local production server (`next start -p 3999`): sampled `.hp-hero-grid` first-child wrapper's computed `opacity`/`transform` every 40ms for 2s post-navigation. Result: clean interpolation opacity 0→1, translateY 20px→0px, settling ~t=872ms — matches designed `staggerChildren:0.08` + `delayChildren:0.1` + `duration:0.6` timing.
4. Committed (new commit, not amended): `e0c324c` — `fix: restore visible production animations`.
5. Pushed: `git push origin main` → `9276414..e0c324c main -> main`. No force push.

## Scope discipline

- No redesign, no visual styling change (fix targets an animation initialization flag only, resting/final visual state unchanged — `show` state is identical to what was already rendered).
- No other `initial={false}` instances found repo-wide (single match via grep across all `.tsx`).
- Unused/dead components (`newsletter.tsx`, `portfolio-placeholder.tsx`, `quote-form.tsx`, `about-values.tsx`, `contact.tsx`, `trust-bar.tsx`) also use Framer Motion `whileInView` patterns but are not imported by any route in `app/` — confirmed via grep, explicitly out of scope, not modified.
