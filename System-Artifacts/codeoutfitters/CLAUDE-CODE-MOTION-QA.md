# CodeOutfitters — Motion Mode QA

Route tested: `/` (Homepage). Server: production (port 3999).

| Mode | URL | `html[data-motion]` | Permanently-hidden elements (`.hp-hero-grid`, `.hp-step`, `.services-card`) |
|---|---|---|---|
| normal (no query, no OS preference) | `/` | `full` | 0 |
| `?motion=full` | `/?motion=full` | `full` | 0 |
| `?motion=reduced` | `/?motion=reduced` | `reduced` | 0 |

Precedence: explicit `?motion=` query correctly sets `data-motion` attribute; no elements left with `visibility:hidden` or `display:none` in any mode — content stays reachable under reduced motion.

## Process timeline scroll-driven animation (fixed this run)

`components/process-preview.tsx`: `useInView` result (`visible`) was computed but never read — spine fill and step cards rendered fully visible on mount instead of scroll-triggered. Fixed: `initial`/`animate` now gated on `visible`. Rebuilt clean.

Runtime-confirmed on `/process` (not `/`'s preview, which uses the same pattern): fill `scaleY` genuinely progresses with scroll position — `0.925` (top) → `0.996` (mid-scroll) → `1.0` (bottom). Not manually set by test. See CLAUDE-CODE-PROCESS-MEASUREMENTS.json.

## Marquee reduced-motion (source-verified, not runtime-toggled via OS preference in this run)

`components/tools-marquee.tsx`, `app/(public)/services/page.tsx`, `security-page-client.tsx` — all marquees have `html[data-motion='reduced'] ... {animation:none}` rules and hide `[data-marquee-sequence=duplicate]` in reduced mode. Confirmed via CSS source; not independently screenshot-verified in `?motion=reduced` for marquee-specific routes this run (homepage motion-mode screenshots captured; services/security not captured in reduced mode specifically — gap noted, not claimed as tested).
