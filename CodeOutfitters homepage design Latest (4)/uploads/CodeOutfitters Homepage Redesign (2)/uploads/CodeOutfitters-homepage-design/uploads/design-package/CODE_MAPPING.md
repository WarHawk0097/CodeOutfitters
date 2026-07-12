# CodeOutfitters — Finalized Reference Handoff

Source of truth: `reference/desktop.png`.

Important: all measurements, colors, spacing, typography sizes, shadows, glows, and dimensions are estimated from the provided reference image unless explicitly marked otherwise.

Non-negotiable: do not redesign, do not invent sections, do not flatten editable UI into full-section images, and do not drift from the approved visual reference.


# CODE_MAPPING.md

## Section-to-component mapping
```txt
app/page.tsx
components/site/Navbar.tsx
components/home/HeroSection.tsx
components/home/TrustStrip.tsx
components/home/WhatWeBuildSection.tsx
components/home/ServiceCard.tsx
components/home/ProcessTimeline.tsx
components/home/CtaSection.tsx
components/site/Footer.tsx
```

## Component-to-file mapping
- Navbar: logo, links, CTA, mobile menu.
- HeroSection: hero copy, chips, CTAs, layered hero visual.
- TrustStrip: overline + logos.
- WhatWeBuildSection: header + six service cards.
- ServiceCard: reusable base with variant-specific inner content.
- ProcessTimeline: five-step responsive timeline.
- CtaSection: final panel, avatars, stats, dotted pattern.

## Asset-to-component mapping
- Hero assets → `HeroSection`.
- Logo SVG → `Navbar`.
- Trust logos → `TrustStrip`.
- Feature chart/gauge/radar assets → service-card variants.
- Process line/node assets → `ProcessTimeline`.
- CTA dotted pattern/avatar cluster/star icon → `CtaSection`.

## Animation-to-component mapping
- Hero float/glow → HeroSection.
- Card reveal → WhatWeBuildSection.
- Gauge/chart draw → ServiceCard variants.
- Process draw → ProcessTimeline.
- CTA reveal → CtaSection.

## CSS token mapping
Use CSS custom properties from `TOKENS.md`, likely in:
```txt
src/styles/tokens.css
src/styles/globals.css
```

## Responsive breakpoint mapping
```ts
sm: 390
md: 768
lg: 1024
xl: 1280
2xl: 1440
```

## State mapping
Use `STATE_SPEC.md` for buttons, cards, menu, links, loading, error, success.

## Likely React/Next/Tailwind structure
```txt
app/
  page.tsx
components/
  site/
    Navbar.tsx
    Footer.tsx
  home/
    HeroSection.tsx
    HeroVisual.tsx
    TrustStrip.tsx
    WhatWeBuildSection.tsx
    ServiceCard.tsx
    ProcessTimeline.tsx
    CtaSection.tsx
styles/
  globals.css
  tokens.css
public/
  assets/
```

## Files not to touch unless scoped
Authentication, API routes, database, unrelated pages, deployment config.
