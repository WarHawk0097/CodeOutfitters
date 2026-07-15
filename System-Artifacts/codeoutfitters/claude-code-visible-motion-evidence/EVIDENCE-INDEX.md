# Visible Motion Evidence Index

Capture tool: gstack browse (headless Chromium via Playwright — see LIMITATIONS)
Capture date: 2026-07-15
Production URL base: https://codeoutfitters.vercel.app
Verify param: verify=e0c324c
Deployed source commit (local/origin, unverified against Vercel API — see LIMITATIONS): e0c324c

## LIMITATIONS (read first)

- No headed-Chromium / screen-video tool was available this session. `gstack browse` reports `Mode: launched`, not `Mode: headed`, and offers `screenshot`, not video recording. Evidence below is a **timed screenshot sequence**, not video. User was asked and selected "Use /browse" as the fallback method; this is the actual output of that method, not what the original prompt specified (real video, headed browser window).
- Vercel MCP could not confirm the deployed commit — `list_projects` under the connected team (`warhawk0097's projects`) returned only `wcss-portal`, no `codeoutfitters` project. The production alias is not reachable via this session's Vercel account. Deployed-commit confirmation rests only on `?verify=e0c324c` succeeding (200) and git local HEAD == origin/main == e0c324c, not on a direct API cross-check.
- No OS-level `prefers-reduced-motion` emulation available in this browse tool (no `--emulate-media` style flag). Section 7 (full mode overriding OS reduced motion) is **NOT VERIFIED** — not fabricated, just untested.
- Coverage below is Homepage (deep) + all 8 routes (hero/content-render spot check only, not full per-category video as originally scoped) + mobile (partial) + reduced-motion (partial). Scroll-motion, hover-motion, FAQ open/close, calculator, filters, chevron rotation, Process scroll-linked progression, and case-study story expansion were **NOT individually captured** this pass.

## Files

| File | URL | Viewport | Motion mode | What it shows | What it does not prove |
|---|---|---|---|---|---|
| homepage-full-t0.png | / | 1440x1000 | full | Stale post-paint race frame (discard — see recheck) | n/a, superseded |
| homepage-full-recheck.png | / | 1440x1000 | full | Settled hero, fully rendered, correct copy/layout | Entrance motion (this is end-state) |
| homepage-entrance-1.png | / | 1440x1000 | full | Immediately post-reload: hero badge/heading/CTA/mockup all invisible (opacity 0 pre-stagger) | — |
| homepage-entrance-2.png | / | 1440x1000 | full | ~1s later: hero fully staggered in, bottom-right stat card still completing fade | — |
| homepage-entrance-3.png | / | 1440x1000 | full | Fully settled, confirms stagger completes | — |
| homepage-marquee-a.png / -b.png | / | 1440x1000 | full | Logo marquee position shift across 2s gap + tab auto-cycle (WhatsApp→Support) in Automation Engine card | Pause/resume on hover (not tested) |
| homepage-reduced.png | /?motion=reduced | 1440x1000 | reduced | Full hero content visible immediately, opacity 1, no transform, no hidden elements | — |
| route-services.png | /services | 1440x1000 | full | Hero + service cards render post-settle | Card stagger, filter transition, expand/chevron, marquee, FAQ (not individually captured) |
| route-industries.png | /industries | 1440x1000 | full | Hero + content render post-settle | Card hover, workflow transition, FAQ (not captured) |
| route-process.png | /process | 1440x1000 | full | Hero + content render post-settle | Scroll-linked progress, marker activation (not captured) |
| route-about.png | /about | 1440x1000 | full | Hero + content render post-settle | Stagger, trust-card interaction (not captured) |
| route-security.png | /security | 1440x1000 | full | Hero + content render post-settle | Control-card motion, marquee (not captured) |
| route-case-studies.png | /case-studies | 1440x1000 | full | Hero + content render post-settle | Filter-pill transition, story expansion (not captured) |
| route-contact.png | /contact | 1440x1000 | full | Form renders, all fields present | Focus transition, validation entrance, submit feedback (not captured) |
| mobile-homepage.png | / | 390x844 | full | Hero renders clean, no horizontal overflow (`scrollWidth > clientWidth` = false) | Task-list overflow under motion, scroll reveal |
| mobile-nav-open.png | / | 390x844 | full | Hamburger menu opens, all nav links present, Close button present | Focus return on close (not tested) |

## Not applicable / not executed this pass

- Full-mode-overrides-OS-reduced-motion: NOT VERIFIED (no media emulation available)
- Homepage scroll-motion video (section reveals, hover lift, calculator, testimonials, FAQ, footer, marquee pause/resume via pointer): NOT CAPTURED
- Console error / hydration error sweep across all 8 routes: only Homepage checked (`console --errors` → none)
