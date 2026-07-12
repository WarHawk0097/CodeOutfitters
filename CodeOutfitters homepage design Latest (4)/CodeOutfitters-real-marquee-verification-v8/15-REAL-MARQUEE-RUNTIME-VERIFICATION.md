# 15 · Real Marquee — Runtime Verification (v8)

Package: `CodeOutfitters-real-marquee-verification-v8/`
Scope: Homepage integrations marquee + Security & Reliability integrations marquee only. FAQ, hero, workflow demo, calculator, testimonials, process timeline, case-study interactions, contact form, navigation, footer, and all other page animations are untouched.

---

## 1. Root cause of the rejected result

The marquee was always a single horizontal `width:max-content` flex track — the static multi-row grids in the previous screenshots were the `prefers-reduced-motion: reduce` fallback, which is force-enabled in this preview environment at OS level. Two real defects were also found and fixed:

1. **No QA path around reduced motion.** Fixed by shipping the spec's normal-motion test mode: `<html data-motion="full">`. A helmet bootstrap script also honors `?motion=full` / `?motion=reduce` URL params. The reduced-motion fallback CSS is now gated on `html:not([data-motion="full"])`, so OS reduced-motion support is fully preserved while QA can verify real motion.
2. **Hover pause was dead code.** The track's `animation` was declared as an inline style, which outranks any stylesheet `animation-play-state:paused` rule (the shorthand resets play-state). Fixed by moving the animation declaration into the stylesheet:
   - Homepage: `.mq-track-v5{…;will-change:transform;animation:mqScroll 40s linear infinite}`
   - Security: `…animation:mqScroll 50s linear infinite`
   - Pause rules: `.mq-track-v5:hover, .mq-viewport-v5:hover .mq-track-v5, .mq-viewport-v5.qa-hover .mq-track-v5 { animation-play-state:paused }` (`.qa-hover` is a test-only mirror of `:hover`, since synthetic events cannot trigger CSS `:hover`).

Keyframes hardened to GPU-composited form:

```css
@keyframes mqScroll{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}
```

## 2. Shipped structure (both sections)

```
section shell (.mq-shell-v5 — large bordered rounded container)
├─ header (.mq-head-v5 — 3fr/2fr title + description, border-bottom divider)
└─ viewport (.mq-viewport-v5 — overflow:hidden, linear-gradient edge masks 10%/90%)
   └─ track (.mq-track-v5 — display:flex, width:max-content, will-change:transform,
             animation mqScroll 40s/50s linear infinite, hover ⇒ paused)
      ├─ original sequence — 12 (home) / 13 (security) large logo cards, one per tool
      └─ duplicated sequence (.marquee-dup-v5, aria-hidden="true") — identical copy for the seamless −50% loop
```

Cards: 208×112 (home), 212×120 (security), `flex-shrink:0`, dark surface, restrained border, centered real logo SVG, hover gradient reveal + −6px lift. No grid, no flex-wrap, no multi-row layout in normal motion.

## 3. Runtime measurements (unmodified shipped files, `data-motion="full"`)

Transforms read via `getComputedStyle(track).transform` — **no transform, translateX, animation-delay, or play-state was ever set manually**. Pause was engaged through the shipped `.qa-hover` mirror of the `:hover` rule.

Homepage (40s duration):
- T0 transform: `matrix(1, 0, 0, 1, -538.112, 0)`
- T+2.2s transform: `matrix(1, 0, 0, 1, -740.304, 0)` — moving: **yes**
- hover start transform: `matrix(1, 0, 0, 1, -740.304, 0)`
- hover +2.2s transform: `matrix(1, 0, 0, 1, -740.304, 0)` — paused: **yes** (bit-identical)
- after hover ends (+1.2s): `matrix(1, 0, 0, 1, -807.701, 0)` — resumed: **yes**

Security (50s duration):
- T0 transform: `matrix(1, 0, 0, 1, -21.7956, 0)`
- T+2.2s transform: `matrix(1, 0, 0, 1, -152.57, 0)` — moving: **yes**
- hover start transform: `matrix(1, 0, 0, 1, -159.506, 0)`
- hover +2.2s transform: `matrix(1, 0, 0, 1, -159.506, 0)` — paused: **yes** (bit-identical)
- resumed after hover: **yes**

Web Animations API cross-check (Homepage): one `mqScroll` CSSAnimation on the track, `playState:"running"`, `playbackRate:1`, keyframes `translate3d(0,0,0) → translate3d(-50%,0,0)`, observed at progress 0.908 with transform −2447.81px of the 2696px half-track — consistent with 40s linear timing.

## 4. Reduced-motion verification

With `data-motion` absent under `prefers-reduced-motion: reduce` (this environment's default): animation disabled, duplicated sequence hidden (`display:none`), track wraps into a centered static grid, edge masks removed, all 12/13 tools visible, nothing clipped. Verified live; see screenshots 07–08. The static grid exists **only** in this fallback — normal mode is one horizontal animated row.

## 5. Screenshot evidence (`comparison-screenshots/`)

All captured from the unmodified shipped previews; motion shots show genuinely different logo positions:

1. `01-homepage-marquee-timestamp-A.png` — WhatsApp/Shopify/Stripe in frame
2. `02-homepage-marquee-timestamp-B-plus-2s.png` — Stripe/Calendly/n8n/Make in frame (track crossed the loop seam — no jump, no gap)
3. `03-homepage-marquee-hover-paused.png` — paused at n8n/Make/Zapier/Airtable
4. `04-security-marquee-timestamp-A.png` — WhatsApp/Gmail/Twilio
5. `05-security-marquee-timestamp-B-plus-2s.png` — Gmail/Twilio/Shopify
6. `06-security-marquee-hover-paused.png` — paused at Twilio/Shopify/Stripe
7. `07-homepage-reduced-motion-fallback.png` — static wrapped grid, single sequence
8. `08-security-reduced-motion-fallback.png` — static wrapped grid, single sequence

## 6. Files changed in v8 (vs v7)

- `01-Homepage.dc.html` — marquee CSS block + helmet bootstrap script only
- `06-Security-Reliability.dc.html` — marquee CSS block + helmet bootstrap script only

No other files, sections, or animations were modified. The ZIP is built from exactly the tested files.
