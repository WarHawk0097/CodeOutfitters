# 09 — VISUAL + MOTION QA REPORT (v2 non-regression repair)

Date: July 10, 2026
Package: CodeOutfitters-fable-enhanced-21st-frontend-ready-v2
Baseline compared against: CodeOutfitters-fable-enhanced-21st-frontend-ready (rejected) and root working set (Homepage v8 + 7 pages).
Method: every page rendered and visually inspected in a live browser (desktop ~1440 CSS px flow), interactions exercised by scripted DOM probes, horizontal-overflow measured in real 390px and 820px iframes. Not judged from source code alone.

## Root causes of the rejected package (both fixed)

1. **Component-lifecycle motion was fragile.** Homepage reveals/count-ups/timeline/progress lived in `componentDidMount` and captured stale node lists; after the runtime's remount cycle the check loop died, leaving 13–14 of 14 `[data-reveal]` sections primed to `opacity:0` **forever** (verified live: whole sections rendered blank). Services and Case Studies had the same fragile `.spot-card` mount-reveal.
   **Fix:** motion moved to a document-level engine in `motion.js` (live queries + MutationObserver + interval safety net; no cached node lists). It now handles `.fm-rv`, `.spot-card`, `[data-reveal]` group stagger, `[data-count]` count-ups, `.tl-node-v6` / `.tl-progress-v6` activation, and `[data-scroll-progress]`. Elements scrolled past are revealed instead of staying hidden (old `bottom > 0` bug).

2. **Blanket `prefers-reduced-motion` kill rules froze ALL animation** (`animation-duration:.001ms` on `*`) in any environment with reduce enabled — which includes the client's review environment (verified live: every keyframe reported duration `1e-06s`). This is why "animations are missing" on every page.
   **Fix:** full motion is now the default for everyone. The reduced fallback is explicit opt-in: `<html data-motion="reduced">` (site-wide) or the Homepage `motion="Reduced"` prop. Under the fallback, all content is fully visible and static — nothing is hidden.

3. Homepage conveyor/testimonial timers are now window-keyed with a heartbeat and self-heal on re-render, so a remount can never orphan or kill them.

---

## Page: 01 Homepage (PROTECTED — not rebuilt)
- Previous baseline used: root `CodeOutfitters Homepage v8.dc.html` + enhanced package version (superset; all baseline markup/CSS preserved byte-for-byte except the repaired logic block).
- Design problems found: "HOT LEAD" pill in the chatbot terminal wrapped its text outside the pill (fixed: nowrap + ellipsis). Blank sections (reveal bug, fixed).
- Animations preserved: hero rise + underline sweep, hero atmosphere paths/orbs, console conveyor (live task queue, hrs-saved counter), marquee rows, shimmer/badge glow, CTA shine/press, testimonial autoplay + dots, timeline node/spine activation, calculator live math, scroll-progress bar.
- Animations added: none removed, none replaced; reveal system made remount-proof; count-ups now re-armable.
- Interactions tested: hero tabs, calculator sliders (50 × 10 × $25 → $600,000 live), FAQ open/close (accent state), CTA hover, featured-testimonial dots — all pass.
- Desktop: pass · Tablet 820: pass (overflow 0) · Mobile 390: pass (overflow 0, h 12847)
- Console errors: none.
- Remaining issues: none known.

## Page: 02 Services
- Baseline: package version (superset of root Services).
- Problems found: entire bento grid stayed invisible (stale mount reveal — fixed); hero badge fine; CTA verified non-overlapping by DOM measurement.
- Animations: hero blob ×2 running, bento card reveal stagger, spotlight hover + gradient underline sweep, integration marquee (verified moving), marquee pause-on-hover (CSS `animation-play-state`), FAQ motion, CTA shine/press.
- Interactions tested: ⌘K search ("invoice" → 1 result), expandable "How it works" (expands), FAQ open/close — all pass.
- Desktop: pass · 820: pass (ov 0) · 390: pass (ov 0)
- Console errors: none. Remaining issues: none known.

## Page: 03 Industries
- Problems found: hero badge "WHO WE BUILD FOR" wrapped to two lines inside the pill — fixed (nowrap).
- Animations: hero blobs, card stagger via fm-rv, hover reveal on industry cards, gap-cards reveal, FAQ motion, CTA motion.
- Desktop: pass · 820: pass (ov 0) · 390: pass (ov 0, h 8523). Console: none.

## Page: 04 Process
- Problems found: timeline spine fill depended on a mount race — now also driven by motion.js (`.tl-progress-v6` fills when the spine enters the viewport). Badge nowrap fixed.
- Animations: hero blobs, spine progress fill (verified filled on scroll), step reveals (fm-rv stagger), FAQ motion, CTA motion.
- Desktop: pass · 820: pass (ov 0) · 390: pass (ov 0, h 5061). Console: none.

## Page: 05 About
- Problems found: badge nowrap fixed; otherwise clean.
- Animations: hero background motion (blobs), belief-bento hover behavior, trust-card reveals, CTA motion.
- Desktop: pass · 820: pass (ov 0) · 390: pass (ov 0, h 5706). Console: none.

## Page: 06 Security & Reliability
- Problems found: badge nowrap fixed.
- Animations: bento reveals, integrations/tool drift rows (toolDriftL/R running), FAQ motion, CTA motion.
- Desktop: pass · 820: pass (ov 0) · 390: pass (ov 0, h 5226). Console: none.

## Page: 07 Case Studies
- Problems found: card reveals used the fragile mount pattern — moved to motion.js.
- Animations/interactions tested live: filter transitions (Healthcare → 6→1 cards; All restores), expandable full stories (Read/Hide full story), testimonial carousel **autoplay verified advancing** (slide opacities 1,0,0 → 0,1,0 over 6s), dots switch slides and restart the timer, quote-mark pulse.
- Desktop: pass · 820: pass (ov 0) · 390: pass (ov 0, h 5630). Console: none.

## Page: 08 Contact
- Problems found: hero atmosphere was frozen by the reduce-kill rule (fixed — heroBlob/heroBlob2 verified running).
- Interactions tested live: form focus states, empty-submit validation (error borders), filled submit → **"Message sent" success state with checkPop animation** replacing the form, FAQ open/close.
- Desktop: pass · 820: pass (ov 0, h 2363) · 390: pass (ov 0, h 3084). Console: none.

---

## Runtime QA (all pages)
- `./support.js` and `./motion.js` load from the package folder with relative paths: pass
- Animations initialize after DOM load, independent of component lifecycle: pass
- No missing selectors block initialization (engine queries live, tolerates absence): pass
- Console errors: none on any of the 8 pages
- Animations visible for normal-motion users **including environments with OS-level reduce enabled**: pass
- Reduced-motion fallback: opt-in via `<html data-motion="reduced">` → everything visible, static: pass
- Interactive controls verified working after animation init (search, filters, dots, FAQ, calculator, form): pass
- Horizontal overflow at 390/820: 0px on all 8 pages

## Non-regression statement
No section, animation, interaction, or content block present in the strongest previous approved set was removed or simplified. All changes are additive (engine hardening) or corrective (bugs that made existing motion invisible). The same fixes were applied to the root working files so live previews match the package.
