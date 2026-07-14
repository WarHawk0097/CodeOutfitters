# Homepage fidelity comparison — 390 × 844

## Evidence

- Approved: `source-390.png`
- Native before repair: `native-390-before.png`
- Native after repair: `native-390-after.png`

## Before repair

- Hero content and process cards could remain hidden.
- A mobile menu control was present even though the approved Homepage has none.
- Calculator, case-study, FAQ, CTA, and footer proportions diverged materially from the approved mobile stack.

## After repair

- Announcement, compact header, single-column hero, two-by-two metrics, clipped marquees, stacked bento cards, left-rail process, stacked calculator, proof cards, testimonial rows, FAQ, CTA, and footer follow the source mobile order and behavior.
- No mobile drawer is rendered. Buttons, sliders, FAQ controls, and testimonial controls remain usable.
- Full-page height is 12,097px versus 13,084px for the source (7.5% difference), with no missing sections and no horizontal overflow.
- Runtime check: all content is visible after settling; no broken images, console/page errors, hydration errors, or height shift.

## Remaining non-blocking differences

- Long text wraps and animated demo states vary slightly from the approved browser capture.

Verdict: pass — mobile structure, card stacking, spacing rhythm, and interaction geometry closely match the approved source.
