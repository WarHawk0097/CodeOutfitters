# CodeOutfitters — Motion Mode QA

Run date: 2026-07-15 (supersedes 2026-07-14 version's Process section, which reported un-scroll-linked values 0.925/0.996/1.0 as if scroll-driven — rejected and repaired this run).

Route tested: `/` (Homepage). Server: production (port 3999).

| Mode | URL | `html[data-motion]` | Permanently-hidden elements (`.hp-hero-grid`, `.hp-step`, `.services-card`) |
|---|---|---|---|
| normal (no query, no OS preference) | `/` | `full` | 0 |
| `?motion=full` | `/?motion=full` | `full` | 0 |
| `?motion=reduced` | `/?motion=reduced` | `reduced` | 0 |

Precedence: explicit `?motion=` query correctly sets `data-motion` attribute; no elements left with `visibility:hidden` or `display:none` in any mode — content stays reachable under reduced motion.

## Process timeline — scroll-driven fill (repaired this run)

Prior report claimed genuine scroll-driven progress (`0.925 -> 0.996 -> 1.0`) but the underlying implementation (`app/(public)/process/page.tsx`) used a one-time `setTimeout(150ms)` + fixed 1.8s CSS transition, entirely independent of scroll position. Root cause and full diagnostic protocol: `CLAUDE-CODE-PROCESS-MEASUREMENTS.json`.

Fix: rewrote to framer-motion `useScroll` bound to the timeline section's own bounding rect, `useSpring`-smoothed, driving `motion.i style={{scaleY}}` directly; marker activation via a single top-level `useMotionValueEvent` + `activeCount` state (no per-step hooks).

Re-measured with corrected protocol (fresh nav, scroll restoration disabled, scrollY/bounds/selectors recorded, targets relative to `#timeline`'s own rect): `atTop=0.1697` (1 marker) -> `atMiddle=0.5247` (3 markers) -> `atEnd=0.9934` (6 markers). Monotonic, materially differentiated, genuinely scroll-linked. PASS.

## Marquee reduced-motion — runtime-verified this run (previously source-only)

All 3 marquees (`/` `.hp-tool-row`, `/services` `.services-marquee-row`, `/security` `.sec-tool-row`) tested live under `reducedMotion:'reduce'` context + `?motion=reduced`:

| Route | Static (no movement over 1.5s) | Duplicate not visibly duplicated |
|---|---|---|
| `/` | true | true (duplicate node hidden) |
| `/services` | true | true (parent `.services-marquee` swapped to `display:none`, `.services-static-tools` shown instead — different mechanism, same visible outcome) |
| `/security` | true | true (duplicate node hidden) |

## Marquee full-contract runtime result (this run)

3/3 marquees pass the shared contract (continuous CSS-driven movement, genuine pointer hover-pause, resume on leave, single duplicate sequence properly `aria-hidden` and non-tabbable). Full field-by-field data: `CLAUDE-CODE-MARQUEE-MEASUREMENTS.json`. Security marquee's duplicate `aria-hidden` gap (found this run) was fixed in `security-page-client.tsx`.
