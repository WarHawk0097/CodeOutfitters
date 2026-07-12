# 09 · VISUAL / MOTION QA REPORT (v3 repair pass)

Test widths: 1440 / 820 / 390.

| Check | 1440 | 820 | 390 |
|---|---|---|---|
| Horizontal overflow | none | none | none |
| Homepage integrations | hub canvas, 12 unique nodes, pulses | hub banner + tile grid | tile grid, 2-up |
| Duplicate integration chips | 0 | 0 | 0 |
| FAQ row height | compact (~56px closed) | compact | compact, no clipped text |
| FAQ open state | in-card answer, chevron rotates | same | same |
| Security architecture | 5-col: groups→checkpoint→hub | stacked chain, vertical connectors | single-col groups |
| Contact in nav | desktop link | hamburger menu | hamburger menu |
| Nav clipping/wrap | none | none | none |
| Reduced motion | hub float/pulse/breath disabled; accordion still functional (instant states) | — | — |

Motion inventory added this pass: `intFloat`, `intBreath`, `pathFlow6` (reused), SMIL pulse dots, `secPulseR/L/D`, `secCheckGlow`, `secBreath`, `mnavIn`, FAQ grid-rows expansion + chevron spring. All gated behind `prefers-reduced-motion` where continuous.

Protected motion re-verified: hero (blobs, paths, typewriter), workflow demo (chat/email/terminal loops), calculator pulse, testimonial marquee, section reveals, CTA sweep, card hovers — all untouched.
