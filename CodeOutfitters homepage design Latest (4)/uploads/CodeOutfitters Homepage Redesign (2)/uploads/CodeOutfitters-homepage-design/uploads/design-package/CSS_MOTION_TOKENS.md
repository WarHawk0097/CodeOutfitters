# CodeOutfitters — Finalized Reference Handoff

Source of truth: `reference/desktop.png`.

Important: all measurements, colors, spacing, typography sizes, shadows, glows, and dimensions are estimated from the provided reference image unless explicitly marked otherwise.

Non-negotiable: do not redesign, do not invent sections, do not flatten editable UI into full-section images, and do not drift from the approved visual reference.


# CSS_MOTION_TOKENS.md

```css
:root {
  --duration-instant: 90ms;
  --duration-fast: 160ms;
  --duration-base: 220ms;
  --duration-slow: 450ms;
  --duration-reveal: 700ms;
  --duration-hero-float: 6200ms;
  --duration-glow-pulse: 3500ms;

  --delay-xs: 40ms;
  --delay-sm: 80ms;
  --delay-md: 140ms;
  --delay-lg: 220ms;

  --stagger-cards: 70ms;
  --stagger-process: 110ms;

  --ease-out-premium: cubic-bezier(.22,.61,.36,1);
  --ease-in-out-soft: cubic-bezier(.45,0,.25,1);
  --ease-spring-soft: cubic-bezier(.2,.8,.2,1);

  --reveal-y: 16px;
  --reveal-y-mobile: 10px;
  --hover-y: -2px;
  --press-y: 1px;

  --scale-hover: 1.015;
  --scale-icon-hover: 1.04;
  --scale-active: .985;

  --opacity-hidden: 0;
  --opacity-muted: .65;
  --opacity-visible: 1;

  --blur-reveal: 8px;
  --glow-hover: 0 0 24px rgba(19,182,162,.18);
  --glow-active: 0 0 32px rgba(19,182,162,.25);
}
```

## Reduced motion override
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```
