# CodeOutfitters — Visible Motion Production QA

## Deployment identity (not inferred from appearance)

- Local HEAD after fix: `e0c324c7cb457fc88a71c72969c4b6442a73e26b` (short `e0c324c`)
- `origin/main`: matches, confirmed via `git rev-parse origin/main` post-push.
- New Vercel deployment: `https://codeoutfitters-hz6b1dubd-warhawk0097s-projects.vercel.app`
- Build-log proof (`vercel inspect ... --logs`): `Cloning github.com/WarHawk0097/CodeOutfitters (Branch: main, Commit: e0c324c)` — exact match, not visual inference.
- Deployment status: polled via `vercel inspect`, transitioned Building → Ready within ~18s.
- Production alias `codeoutfitters.vercel.app` confirmed pointing to this deployment (`vercel inspect codeoutfitters.vercel.app` → same deployment URL).
- Superseded deployment (`9276414`, pre-fix) no longer aliased.

## Runtime motion-mode inspection (production, post-fix)

Sampled via headless Chromium/Playwright against `https://codeoutfitters.vercel.app/?verify=e0c324c` (cache-busted):

| URL | data-motion | prefersReduced (OS emulated off) | marquee animationName | marquee playState |
|---|---|---|---|---|
| `/` (normal) | `full` | false | `hpToolsL` | `running` |
| `/?motion=full` | `full` | false | `hpToolsL` | `running` |
| `/?motion=reduced` | `reduced` | false (forced via query, independent of OS) | `none` | n/a |

`motion-ready` class present in all 3 cases. Resolver behaves per spec: normal follows OS default, `?motion=full` forces full and is not overridden by CSS reduced-motion rules, `?motion=reduced` stops CSS-driven marquee motion while content remains visible.

## Hero entrance animation (the repaired defect) — production, cache-busted

Sampled `.hp-hero-grid` first child's computed `opacity`/`transform` every ~40ms for 2s immediately after `domcontentloaded` on `https://codeoutfitters.vercel.app/?verify=e0c324c`:

- t=43ms: opacity 0.26, translateY 14.75px
- t=295ms: opacity 0.95, translateY 1.07px
- t=741ms–1123ms: converges to opacity 1, translateY 0px

Confirms genuine, human-perceptible fade+rise entrance (not a single-frame snap, not a computed-style artifact) — opacity and transform interpolate smoothly across ~20+ intermediate samples before settling, consistent with the designed 0.6s duration / 0.1s delay.

A transient opacity dip to 0 at t=450–492ms was observed and attributed to an unrelated `AnimatePresence`/tab-content remount inside the hero (a separate, pre-existing `motion.div` with its own `key`/exit-enter cycle, `components/hero.tsx:22`), not a regression of the fix and not a hero-staging failure.

## Scope of this QA pass

This is a targeted regression check on the specific repaired defect (hero entrance animation) plus a runtime confirmation that motion-mode resolution and CSS-driven marquee motion remain correct on the newly deployed commit. It is **not** a full re-run of every animation listed in the original emergency spec (task-row stagger, task Running pulse, progress bar animation, card hover motion, navigation underline, FAQ open/close, CTA motion, Process progress, footer reveal) — those were not implicated by the root-cause analysis (only the hero's `motion.div` staging tree used `initial={false}`; all other components use `whileInView`/CSS-keyframe/hover-transition patterns, verified via repo-wide grep to have no equivalent defect), but were not independently re-recorded on video in this pass. Marquee and motion-mode resolution were spot-verified above and found correct both before and after this fix — they were never actually broken.

## Video/headed-browser evidence — session 1

Not captured in this pass — investigation and verification were performed via headless Chromium computed-style sampling (opacity/transform interpolation across dozens of intermediate frames), which demonstrates the same underlying rendering pipeline change a human would see, but is not a substitute for actual human-reviewable video. If a video recording is required as the final acceptance artifact, that capture step remains outstanding.

## Session 2 follow-up — screenshot evidence upgrade (2026-07-15)

No headed-browser or video-recording tool was available in this session either (`gstack browse` reports `Mode: launched`, offers `screenshot` not video). User was asked and chose to proceed with `/browse` (gstack browse) as the practical fallback.

Produced a genuine timed 3-frame screenshot burst immediately after a hard reload of `https://codeoutfitters.vercel.app/?motion=full&verify=e0c324c` at 1440x1000:

- Frame 1 (t≈0): hero badge, heading, body copy, CTAs, and Automation Engine mockup are all **fully invisible** — confirms the pre-animation hidden state genuinely exists in production, is not just a computed-style artifact.
- Frame 2 (t≈1s): hero **fully staggered in**, with the bottom-right "98%" stat card still completing its fade — caught mid-stagger.
- Frame 3: fully settled end state.

This is stronger evidence than session 1's computed-style sampling because it is a direct visual (pixel) capture showing the hidden state and the transition, not an inferred/sampled numeric trace. Files: `claude-code-visible-motion-evidence/homepage-entrance-{1,2,3}.png`.

Also verified this pass:
- Marquee: logo row visibly shifted position across a 2s gap; Automation Engine card's active tab auto-cycled WhatsApp → Support (`homepage-marquee-a.png` / `-b.png`).
- Reduced motion: `data-motion="reduced"`, hero `opacity:1`, `transform:none`, no hidden/clipped content (`homepage-reduced.png`).
- All 8 routes (`/`, `/services`, `/industries`, `/process`, `/about`, `/security`, `/case-studies`, `/contact`) return 200 and render hero + primary content correctly at rest (spot-check screenshots only, not per-category animation video).
- Mobile (390×844): hero renders with no horizontal overflow, hamburger menu opens/shows all links + Close button.

Still NOT verified: OS-level `prefers-reduced-motion` override precedence (no media-emulation flag in this tool), scroll-motion video (section reveals, hover lift, calculator, testimonials, footer reveal, marquee pause/resume via pointer), FAQ open/close, and Vercel-API-side deployed-commit cross-check (connected Vercel account has no `codeoutfitters` project registered — relied on `?verify=` param + git HEAD/origin match instead).

Full evidence index: `claude-code-visible-motion-evidence/EVIDENCE-INDEX.md`.
