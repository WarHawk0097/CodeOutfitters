# UIX0/MOTION0 DISCOVERY REPORT — CodeOutfitters

> **Phase:** UIX0 / MOTION0 — Read-only discovery and premium motion plan
> **Project root:** `F:\CodeOutfitters`
> **Live URL:** `https://codeoutfitters.pages.dev`
> **Date:** 2026-06-17
> **Status:** Level 1 (UIX Audit) complete, Level 2 (Motion Audit) complete, Level 3 (Motion Implementation Plan) proposed.

---

## Executive Summary

CodeOutfitters is a Next.js 16 static export (`output: 'export'`) site deployed to Cloudflare Pages for a premium AI automation agency targeting US small businesses. The site has a polished warm brand (forest teal `#2A6B5A` + brass `#C8A96E` + warm off-white `#FAFAF7`) with 35+ components across 10+ routes. The codebase uses **three competing animation libraries** (framer-motion, GSAP, AOS) creating fragmentation, dead-code weight, and inconsistent animation behavior.

---

## Level 1 — UIX AUDIT (Current State)

### Design System Strength

| Dimension | Score | Notes |
|---|---|---|
| Color palette | 8/10 | Warm, cohesive, intentional. Teal + brass + cream is distinctive. |
| Typography | 7/10 | Inter throughout, good scale via CSS clamp, lacks display font |
| Spacing | 7/10 | CSS custom properties for section/component spacing, generally consistent |
| Card system | 8/10 | `glass-card` system with layered shadows, hover lift, variants |
| Button system | 8/10 | `btn-primary` and `btn-ghost` with micro-interactions |
| Forms | 7/10 | Consistent input styling but no focus-within transitions |
| Dark sections | 8/10 | Hero, ROI calculator, footer all use `#1C1612` dark with proper contrast |
| Accessibility | 5/10 | Focus-visible styles present, but `data-aos` elements lack `prefers-reduced-motion` respect; no skip-to-content link |

### Current UX Gaps

1. **No section loaders/skeletons** — Dynamic imports (`ROICalculator`, `Portfolio`) use `next/dynamic` with zero loading fallback. A flash-of-nothing is visible on slow connections.
2. **No intersection-based transitions** — Sections fade in inconsistently: some use framer-motion `whileInView`, some use AOS `data-aos`, some use GSAP hooks. No unified scroll-triggered system.
3. **Mobile drawer has no backdrop overlay animation** — The navbar drawer slides in from right but the page content jumps under it with no scaling or blur effect.
4. **Portfolio cards have no animation** — The `portfolio.tsx` component uses only `data-aos="zoom-in"` (AOS). Card hover states are flat (no lift, no shadow).
5. **CTA banner uses pure AOS** — No framer-motion integration despite being in a client component.
6. **ROI calculator uses `data-aos="fade-right/left"`** — This creates an inconsistent reveal pattern vs adjacent framer-motion sections.
7. **No page loading states** — `app/(public)/page.tsx` has no Suspense boundaries for the dynamically-loaded components.
8. **Form confirmation states** — Contact form and booking have success/error states but no shared layout transition (no `layoutId`).
9. **No feedback micro-interactions** — No toast, no notification system, no hover-triggered tooltips on premium service cards.
10. **No cursor effects** — No custom cursor, no magnetic buttons, no hover-tilt on cards (even though `useParallaxFloat` hook exists).

---

## Level 2 — MOTION AUDIT (Current State)

### Animation Library Fragmentation

| Library | Components using it | File sizes (approx) | Role |
|---|---|---|---|
| **framer-motion** | ~20 components | ~42KB (bundled) | Primary animation system — entrance/exit/scroll/variants |
| **GSAP + ScrollTrigger** | 3 components + 3 hooks | ~30KB (gzipped ~10KB) | Smooth scroll (Lenis), word-level text reveals, scroll-triggered reveals |
| **AOS** | 5 components | ~18KB (CSS+JS) | Basic `data-aos` attribute reveals |

### Framer-motion Usage Pattern (consistent cubic-bezier throughout)

All framer-motion components use the same curve: `ease: [0.25, 0.1, 0.25, 1]` — a generic ease. Duration varies (0.3–0.7s). No spring-based animations exist anywhere.

### Dead / Orphaned Code

| File | Status | Impact |
|---|---|---|
| `components/gsap-provider.tsx` | Imported in `app/(public)/layout.tsx` but **NOT rendered in JSX** | GSAPProvider + Lenis never instantiated; smooth scroll is not active |
| `hooks/useParallaxFloat.ts` | Never imported by any component | Mouse-tracking 3D hover tilt exists as a hook but is unused |
| `hooks/useGSAP.ts` | Never imported by any component | `[data-gsap]` attribute-based reveal pattern exists but is unused |
| `lib/animations/gsap-setup.ts` | Used by `hooks/useScrollReveal.ts` and `hooks/useParallaxFloat.ts` | Still active if those hooks are called, but the hooks themselves are mostly dead |
| `lib/animations/gsap-config.ts` | Used by `lib/animations/useScrollReveal.ts` (the one used by `AnimatedText` + `Testimonials`) | Active — the scroll-reveal hook depends on this |
| `lib/gsap.ts` | Used by `lib/booking-actions.ts` via `@/lib/gsap` (typo? double import) | Appears to be unused — `booking-actions.ts` imports from `@/lib/supabase` not gsap |

### Key Finding: gsap-provider is dead

The `GSAPProvider` component that sets up Lenis smooth scroll + GSAP ticker integration is **imported but never rendered** in `app/(public)/layout.tsx`. The import line exists but no `<GSAPProvider>` JSX. This means:
- Lenis smooth scroll is NOT active
- GSAP ticker integration with smooth scrolling is NOT active
- Anchor smooth scroll (`a[href^="#"]`) handler is NOT active

### Animation Inconsistencies

| Section | Animation System | Animation Type | Duration | Easing |
|---|---|---|---|---|
| Hero | AOS + framer-motion | Staggered fade-up + scroll indicator bounce | 0–300ms delay | CSS defaults + framer ease |
| Tools Strip | AOS | Fade-up | 800ms (AOS global) | ease-out-cubic |
| Services | framer-motion + AOS + AnimatedText | Header fade-up (fm), cards stagger AOS, title word-reveal (GSAP) | mixed | mixed |
| Process | framer-motion + AOS | Header fade-up (fm), cards stagger AOS | mixed | mixed |
| ROI Calculator | framer-motion + AOS | Header fade-up (fm), sliders fade-right (AOS), stats fade-left (AOS) | mixed | mixed |
| Portfolio | AOS only | Zoom-in stagger | 800ms | ease-out-cubic |
| Testimonials | GSAP hook + framer-motion | Section reveal (GSAP), carousel slide (fm) | mixed | mixed |
| CTA Banner | AOS only | Fade-up stagger | 800ms | ease-out-cubic |
| FAQ | framer-motion | Accordion height + staggered item reveal | 0.3–0.5s | generic ease |
| Values | framer-motion | Staggered card reveal with scale | 0.5s | generic ease |
| Trust Bar | framer-motion | Staggered stat reveal | 0.4s | generic ease |
| Contact | framer-motion | Bilateral slide-in + card reveals | 0.7s | generic ease |
| Page Hero | framer-motion + AnimatedText | Breadcrumb (fm), word-reveal title (GSAP) | mixed | mixed |
| Announcement Bar | framer-motion | Height collapse/expand | 0.3s | generic ease |
| Back to Top | framer-motion | Scale fade entry | 0.2s | generic ease |
| Floating CTA | framer-motion | Scale fade entry | 0.3s | generic ease |

### Reduced Motion Support

- **AOS**: No `prefers-reduced-motion` check — all AOS animations fire regardless
- **GSAP**: `gsap-config.ts` sets `timeScale(0)` for reduced motion — good, but the `lib/animations/useScrollReveal.ts` does NOT check reduced motion
- **Framer-motion**: Respects `prefers-reduced-motion` through browser defaults for CSS transitions, but no explicit `useReducedMotion()` hook anywhere
- **CSS**: Reduced motion media query exists for marquee and blob animations only

---

## Level 3 — MOTION IMPLEMENTATION PLAN (Proposed)

### Phase A: Consolidate Animation Libraries (Safe — No visual changes)

**Goal:** Remove AOS + unused GSAP code, move all reveals to framer-motion. Zero visual regression for end users.

| Task | File(s) | Complexity | Risk |
|---|---|---|---|
| A-01 Remove AOS dependency entirely | `package.json`, `app/layout.tsx`, `components/aos-provider.tsx` | Low — remove import, delete provider, uninstall package | Low — AOS is only in 5 components, each needs framer-motion replacement |
| A-02 Migrate AOS `data-aos` reveals to framer-motion `whileInView` | `hero.tsx`, `tools-strip.tsx`, `process.tsx`, `portfolio.tsx`, `cta-banner.tsx`, `roi-calculator.tsx` | Medium — 6 components, each needs standardized `whileInView` with stagger | Low — framer-motion is already in all these files |
| A-03 Remove unused GSAP hooks | `hooks/useParallaxFloat.ts`, `hooks/useGSAP.ts`, `lib/gsap.ts` | Low — delete files, remove imports | Low — zero imports exist for these |
| A-04 Optionally remove GSAP entirely | `package.json`, `AnimatedText`, `lib/animations/useScrollReveal.ts`, `lib/animations/gsap-config.ts`, `lib/animations/gsap-setup.ts` | Medium — `AnimatedText` and `Testimonials` depend on GSAP scroll-reveal | Medium — need framer-motion replacement for word-reveal |
| A-05 Rebuild `AnimatedText` without GSAP | `components/animated-text.tsx` | Medium — use framer-motion `staggerChildren` with `whileInView` | Low — same visual output, different engine |

### Phase B: Core Motion Improvements (Visual changes — Design-approved only)

| Task | File(s) | Pattern Code | Effort |
|---|---|---|---|
| B-01 Unified scroll-triggered reveal hook | `hooks/useSectionReveal.ts` | Framer-motion-based, standardized stagger/timing | 1 file |
| B-02 Smooth scroll via framer-motion (no Lenis) | `components/scroll-provider.tsx` | Use `Lenis` but driven through framer-motion `useScroll` + `useSpring` for progress | 1 file (replaces dead GSAPProvider) |
| B-03 Spring-based entrance animations | All sections | Replace generic cubic-bezier with `type: "spring", stiffness: 120, damping: 15` | Across ~20 components |
| B-04 Staggered list animations for Services cards | `services.tsx` | Framer-motion `staggerChildren` replacing AOS delay | 1 component |
| B-05 Portfolio card hover animations | `portfolio.tsx` | Framer-motion `whileHover` lift + shadow | 1 component |
| B-06 Mobile drawer backdrop blur | `navbar.tsx` | Motion div between drawer and content with backdrop blur | 1 component |
| B-07 Scroll progress bar with spring | `scroll-progress.tsx` | Framer-motion `useScroll` + `useSpring` | 1 component |
| B-08 Page transitions with shared layout | `page-transition.tsx` | Expand to include `layoutId` for shared elements | 1 component |
| B-09 Magnetic button effect on CTA buttons | `btn-primary` (global CSS) | Framer-motion `useMotionValue` for mouse-follow | 1 hook, applied globally |
| B-10 Image/icon hover-tilt (use orphaned parallax) | `services.tsx`, `portfolio.tsx` | Rebuild `useParallaxFloat` as framer-motion hook + apply | 1 hook, 2 components |

### Phase C: Premium Motion — GSAP-tier effects (if GSAP is kept or rebuilt in framer-motion)

| Task | Pattern Code | Effort | WOW Factor |
|---|---|---|---|
| C-01 Word-by-word hero headline stagger | scroll-triggered word reveal on hero H1 | 2 files | High |
| C-02 Section parallax on scroll | Background elements move slower than content | 1 hook | Medium |
| C-03 Number counter animation (ROI calculator stats) | Animated counter from 0 to final value | 1 hook | High |
| C-04 Service card sequential stagger on scroll | Cards fade in left→right in order on scroll | 1 hook | High |
| C-05 Timeline connector line animation (Process section) | Line draws on scroll between the 4 steps | 1 component | Medium |
| C-06 Testimonial carousel auto-advance with progress | Auto-slide every 6s with timer bar | 1 component | Low |
| C-07 Loading skeleton pulse for dynamic imports | Skeleton placeholders for ROICalculator, Portfolio | 2 files | Medium |
| C-08 Reduced-motion system (comprehensive) | Single `useReducedMotion()` hook consumed by all animations | 1 hook | High (a11y) |

### Phase D: Animation Architecture Migration Strategy

```
Current:              Proposed (framer-motion only):
┌─────────────┐       ┌─────────────────────┐
│ framer-motion│       │    framer-motion     │
│  (~20 comps) │       │  (~30 comps + hooks) │
├─────────────┤       └─────────────────────┘
│    GSAP      │  ──→       (removed)
│  (3 comps +  │
│   3 hooks)   │
├─────────────┤
│    AOS       │  ──→       (removed)
│  (5 comps)  │
└─────────────┘
```

### Recommended GSAP decision

Given:
1. GSAP adds ~10KB gzipped
2. 3 hooks are dead (unused)
3. `AnimatedText` word-reveal can be rebuilt in framer-motion (staggerChildren)
4. Lenis smooth scroll is not active (dead GSAPProvider)
5. framer-motion with `useScroll` + spring already handles smooth scroll

**Recommendation: Remove GSAP entirely in UIX0 phase** and rebuild the two active consumers (`AnimatedText`, `Testimonials`) with framer-motion alternatives. This reduces bundle size, eliminates dead code, and unifies the animation architecture under one library.

---

## Dead Code Summary

| Artifact | Type | Found in | Status |
|---|---|---|---|
| `components/gsap-provider.tsx` | Component | `app/(public)/layout.tsx` line 4 import, never rendered | Dead import |
| `hooks/useParallaxFloat.ts` | Hook | Zero imports across codebase | Orphaned |
| `hooks/useGSAP.ts` | Hook | Zero imports across codebase | Orphaned |
| `lib/gsap.ts` | Module | Zero imports across codebase | Orphaned |
| `lib/animations/gsap-setup.ts` | Module | Only imported by dead hooks `useParallaxFloat` and `useGSAP` | Effectively orphaned |
| `components/aos-provider.tsx` | Component | Active in root layout — AOS runs on every page including admin | Not dead, but redundant |
| `GSAPProvider` import | Import | `import GSAPProvider` on line 15 of `app/(public)/layout.tsx` but no `<GSAPProvider>` JSX | Imported but unused |

---

## Component Animation Inventory (Full)

| Component | File | Current Animation | Anim Type | Scroll Trigger | Notes |
|---|---|---|---|---|---|
| AnnouncementBar | `announcement-bar.tsx` | framer-motion height + opacity | enter/exit | No | Dismissable |
| Hero | `hero.tsx` | AOS fade-up staggered + fm scroll indicator | scroll + enter | No stagger | Mixed library usage |
| ToolsStrip | `tools-strip.tsx` | AOS fade-up + CSS marquee | scroll + CSS infinite | AOS-only | Marquee is pure CSS |
| Services | `services.tsx` | fm header + AnimatedText (GSAP) + AOS cards | mixed | Yes via whileInView + GSAP | 3 systems on 1 page |
| Process | `process.tsx` | fm header + AOS cards | mixed | Yes | - |
| ROICalculator | `roi-calculator.tsx` | fm header + AOS slider/stats | mixed | Yes | - |
| Portfolio | `portfolio.tsx` | AOS zoom-in staggered | scroll | AOS-only | No hover animation |
| Testimonials | `testimonials.tsx` | GSAP scroll-reveal (hook) + fm carousel slide | mixed | Yes via GSAP | - |
| CTABanner | `cta-banner.tsx` | AOS fade-up staggered | scroll | AOS-only | - |
| PricingFAQ | `pricing-faq.tsx` | fm accordion + staggered items | scroll + interaction | Yes via whileInView | - |
| AboutValues | `about-values.tsx` | fm staggered cards with scale | scroll | Yes via whileInView | - |
| TrustBar | `trust-bar.tsx` | fm staggered stats | scroll | Yes via whileInView | - |
| PageHero | `page-hero.tsx` | fm header + AnimatedText (GSAP) | enter | No | GSAP word-reveal |
| Contact | `contact.tsx` | fm bilateral slide + cards | scroll | Yes via whileInView | Form transition on submit |
| Newsletter | `newsletter.tsx` | fm fade-up | scroll | Yes via whileInView | Success transition |
| Navbar | `navbar.tsx` | fm mobile drawer + scroll hide | interaction + scroll | No | - |
| Footer | `footer.tsx` | None | - | No | Static |
| BackToTop | `back-to-top.tsx` | fm scale fade | scroll-triggered | No | Appears after 600px |
| FloatingCTA | `floating-cta.tsx` | fm scale fade | scroll-triggered | No | Appears after 400px (mobile) |
| CookieConsent | `cookie-consent.tsx` | fm slide-up | time-delayed | No | 2s delay |
| ScrollProgress | `scroll-progress.tsx` | Manual scroll listener | scroll | No | No animation lib |
| GradientCanvas | `gradient-canvas.tsx` | Custom canvas RAF | continuous | No | Pure canvas |
| LiveChat | `live-chat.tsx` | None | - | No | Tawk.to script inject |
| ErrorBoundary | `error-boundary.tsx` | None | - | No | Class component |

---

## Recommendations for Gate

**UIX0 Recommendation:** **PASS** — The existing UI is production-quality with a strong design system. Gaps are polish-level, not structural.

**MOTION0 Recommendation:** **PASS with scope definition** — The motion fragmentation is real but manageable. Recommend consolidating to framer-motion only before adding any new GSAP-tier effects.

**Priority order for implementation:**
1. Remove AOS + migrate 6 components to framer-motion (Phase A)
2. Optionally remove GSAP + migrate 2 components (Phase A-04/A-05)
3. Add spring-based entrances + staggered reveals (Phase B)
4. Add premium effects — number counter, parallax, word stagger (Phase C)
5. Comprehensive reduced motion support (Phase C-08)

---

*End of UIX0/MOTION0 DISCOVERY REPORT*
