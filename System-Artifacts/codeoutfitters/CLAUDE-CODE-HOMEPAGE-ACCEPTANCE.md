# CodeOutfitters — Homepage Content Acceptance

Route: `/`. Server: production (port 3999), post-fix rebuild.

## Required content — 5/5 PASS

| String | Present |
|---|---|
| `app.codeoutfitters.ai/live` | true |
| `Built in 7 days` | true |
| `Running` | true |
| `tasks automated` | true |
| `$0 payroll spent` | true |

Live ticking value at capture time: `328 tasks automated` (client-side counter starting at 328, `components/hero.tsx:31`).

## Forbidden content — DEFECT FOUND, FIXED, RE-VERIFIED

Initial pass (pre-fix) found forbidden fabricated-scenario strings live in DOM, sourced from `components/services-bento.tsx` (WhatsApp demo widget):

| String | Present (before fix) | Present (after fix) |
|---|---|---|
| `Maple St` | true | false |
| `private viewing` | true | false |
| `Handled end-to-end in 26 seconds` | true | false |
| `lead qualified` | false | false |
| `booking confirmation` | false | false |

### Fix applied

`components/services-bento.tsx`: rewrote WhatsApp demo chat copy from a fabricated real-estate scenario ("2-bed on Maple St", "private viewing", "12 Maple St · calendar invites sent", "Handled end-to-end in 26 seconds") to generic, non-address, non-fake-metric copy ("book a call", "Call booked — Thu 4:00 PM", "Calendar invite sent automatically", "Handled automatically — no human needed"). No named clients, no fabricated addresses, no fabricated timing claims.

Rebuilt via `npx next build` — clean. Production server restarted on port 3999 with fresh build. Re-ran full content-acceptance check: all 3 forbidden strings now absent.

## Not yet independently verified this run

- WhatsApp-tab-active-initial-state and "Running task progress" specific interactive-state assertions from the original spec were not scripted as discrete checks; the fixed widget still renders and animates without console errors across all 3 viewports (confirmed via responsive matrix), but the specific tab-state assertion was not isolated. Not claimed as passed.
