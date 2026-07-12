# 05 — Interaction & Motion Spec

All durations/easings below are taken directly from the approved `.dc.html` design files — implement exactly, do not restyle motion "to taste."

## Global easing tokens
```css
--ease-premium: cubic-bezier(.16,1,.3,1);
--ease-soft: cubic-bezier(.22,1,.36,1);
--ease-spring: cubic-bezier(.34,1.56,.64,1);
```

## Section reveal
- Every major section wrapper reveals on scroll-into-view: `opacity 0→1`, `translateY(22–24px)→0`, 600–700ms `--ease-premium`.
- Trigger threshold: element top < 92% of viewport height.
- Implement via `IntersectionObserver` (not scroll-event polling) in the real React build; the HTML reference uses scroll-event polling only because it predates the React port.
- Respect `prefers-reduced-motion`: skip transform/opacity animation, render final state immediately.

## Card stagger
- Bento/grid cards stagger their reveal by 50–60ms per index (`i * 60ms` delay on the transition).
- Applies to: Services grid, Industries grid, About beliefs, Case Studies grid.

## Bento hover reveal
- Card: `translateY(-6px)` + border tint shift to `rgba(23,160,99,.34)` + shadow bloom, 500ms `--ease-premium`.
- Bottom accent bar (enhancement pass): 3px green→gold gradient bar pinned to card bottom, `scaleX(0)→scaleX(1)` from the left, 550ms `--ease-premium` on hover.
- Featured services card (Services grid card 01 only): permanent gold ring `rgba(217,179,106,.55)` + `0 0 0 3px rgba(217,179,106,.14)` outer glow.
- Icon tile inside card: `translateY(-2px) rotate(-3deg)`, 500ms `--ease-spring`.
- Spotlight glow: radial gradient positioned at cursor via `--sx`/`--sy` CSS custom properties set on `mousemove`; opacity 0→1 on `mouseenter`/`mouseleave`, 350ms ease.

## Timeline progress animation
- Spine fill: `scaleY(0)→scaleY(1)`, `transform-origin: top`, 1.8–1.9s `--ease-premium`, triggered ~150ms after mount (Process page) or on scroll-into-view (Homepage preview).
- Card hover: `translateY(-4px)`, border tint shift, 500ms `--ease-premium`.

## Accordion open/close
- `max-height` 0→content height (cap ~340–520px depending on content), 450–500ms `--ease-premium`; `opacity` 0→1, 350–400ms ease, in parallel.
- Chevron badge: rotate 180deg, 350ms `--ease-spring`, plus a brief `chevronPop` scale-down/up flourish (scale .82 at 40%) on toggle.
- Only one item open at a time within a given accordion instance.

## Filter/search transitions
- Case Studies filter pills: instant client-side re-filter; existing card-reveal stagger re-runs on the new filtered set (no page reload, no hard cut).
- Services ⌘K search: dropdown fades+slides in 200ms; results list filters on every keystroke (debounce not required at this data size); Escape clears query and blurs input; empty-state message shown when zero matches.

## Testimonial carousel
- Case Studies (rotating): crossfade `opacity` + `translateY(16px→0)`, 600ms `--ease-premium`; auto-advance every 5.2s; manual dot click jumps + resets the auto-advance timer; active dot widens to 26px, inactive dots stay 9px circles.
- Homepage (marquee): two rows drift via `translate3d`, 52s and 60s linear infinite in opposite directions; pause both rows on container `mouseenter`.

## Integrations marquee (Services + Security)
- Rows: 38s / 44s linear infinite, opposite directions; both pause on container hover (`animation-play-state: paused`).
- Tool chip hover: `translateY(-2px)`, border → `rgba(43,212,131,.55)`, text → white, 350ms.

## Hero background gradient animation (all 8 heroes)
- Two absolutely positioned radial-gradient blob layers (`inset:-20%` and `inset:-24%`), drifting counter-phased: 16s and 22s ease-in-out infinite. Purely decorative; `pointer-events:none`; clipped by the hero's `overflow:hidden`.

## CTA hover sweep
- `.cta-sweep`: a skewed (-18deg) semi-transparent white gradient bar sits off-screen left (`left:-60%`) and sweeps to `left:120%` over 650ms `--ease-premium` on hover. Applies to every "Book a Call" / final-CTA button and the nav CTA.

## Contact success animation
- On submit: swap the form for a success panel; checkmark badge pops in via `scale(.5)→scale(1.12)→scale(1)` with `opacity 0→1`, 500ms `--ease-spring`.
- "Send another message" resets all fields and returns to the form view.
- No real backend is implemented at this stage — Claude Code should wire the submit handler to whatever backend/service the team specifies later; the UI/motion contract above must hold regardless of backend.

## Live console / hero demo (Homepage only)
- Tabbed mock (WhatsApp / Email / Support) — plain `useState` tab switch, no transition library required beyond a simple crossfade.
- Task list rows animate in with a subtle rise (`v3Rise`), staggered.
- A slow "hrs saved" counter and small looping progress-bar accents are decorative — implement with CSS `@keyframes`, not JS timers, to keep this section cheap to render.

## Reduced motion fallback

Apply globally, once, in the root layout:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

Additionally, under reduced motion: reveal-on-scroll elements must render in their final (visible) state immediately rather than staying hidden waiting for a transition that no longer visibly plays; timeline spine renders fully filled; marquees/testimonial carousels stop looping (marquee: freeze at position 0; rotating testimonial: show item 0 statically, dots remain clickable without animated crossfade).
