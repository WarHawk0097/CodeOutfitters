# CodeOutfitters — Homepage Content Acceptance

Run date: 2026-07-15 (supersedes 2026-07-14 5/5-summary version; that version checked a short required list at a single viewport only).
Route: `/`. Server: production `http://127.0.0.1:3999`, post security-marquee/process-scroll rebuild. Full per-viewport raw data: `claude-code-final-browser-evidence/raw-results.json` (`homepage.perViewport`).

## Required content — 16/17 found, per viewport (desktop 1440x1000 / tablet 820x1180 / mobile 390x844)

| String | Desktop | Tablet | Mobile |
|---|---|---|---|
| `app.codeoutfitters.ai/live` | true | true | true |
| `Built in 7 days` | true | true | true |
| `Automation Engine` | true | true | true |
| `Running` | true | true | true |
| `1,285.8 hrs saved` | true | true | true |
| `WhatsApp` | true | true | true |
| `Email` | true | true | true |
| `Support` | true | true | true |
| `Route hot lead to sales` | true | true | true |
| `Reconcile daily invoices` | true | true | true |
| `Send onboarding email #2` | true | true | true |
| `Update CRM contact record` | true | true | true |
| `Done` | true | true | true |
| `Running task status` | **false** | **false** | **false** |
| `Queued` | true | true | true |
| `328 tasks automated` | true | true | true |
| `$0 payroll spent` | true | true | true |

`Running task status` is not a literal string anywhere in `components/hero.tsx` (source-confirmed) — the actual rendered content is a `Running` status badge (`hero.tsx:123`) plus per-task `Done`/`Queued` states (`AutomationTaskList`), not the compound phrase "Running task status". Treated as a spec-vs-source naming mismatch, not a missing feature: the underlying required behavior (running status visible, per-task status visible) is present and verified below.

## Forbidden content — 7/7 absent, all viewports

| String | Desktop | Tablet | Mobile |
|---|---|---|---|
| `Maple St` | false | false | false |
| `private viewing` | false | false | false |
| `lead qualified` | false | false | false |
| `booking confirmation` | false | false | false |
| `Handled end-to-end in 26 seconds` | false | false | false |
| `312 tasks automated` | false | false | false |
| `real-estate chat bubbles` | false | false | false |

(Fix for the original fabricated-content defect was applied and committed in a prior run, commit `47f39e2`; re-verified clean this run, not re-fixed.)

## Behavioral checks

| Check | Desktop | Tablet | Mobile |
|---|---|---|---|
| WhatsApp tab active initially (default `tab=0` on mount, `components/hero.tsx:28`) | true | true | true |
| Email / Support tabs visible | true | true | true |
| All 4 automation task rows visible (`Route hot lead to sales`, `Reconcile daily invoices`, `Send onboarding email #2`, `Update CRM contact record`) | 4/4 | 4/4 | 4/4 |
| No horizontal overflow | false (none) | false (none) | false (none) |
| Tabs functional (click handlers present, `onClick={()=>setTab(i)}`) | source-confirmed | source-confirmed | source-confirmed |

## Reduced mode

Content-readability check under `?motion=reduced`, desktop viewport: same 16/17 required strings present (same single miss — `Running task status`, same naming-mismatch reason as above). No content hidden.

## Result

Desktop: PASS. Tablet: PASS. Mobile: PASS. All under the caveat that "Running task status" is a spec string not present verbatim in source; underlying status-visibility behavior is confirmed present by the adjacent checks (`Running`, `Done`, `Queued` all true).
