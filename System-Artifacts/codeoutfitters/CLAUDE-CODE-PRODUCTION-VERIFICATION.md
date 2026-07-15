# CodeOutfitters — Production Verification

Run date: 2026-07-15 (updated after production interaction QA found and repaired 3 defects — see CLAUDE-CODE-PRODUCTION-INTERACTION-QA.md; this document's Sections 1-11 describe the `51bcd9c` pass, superseded on commit identity by the `2508a99` repair below.)
Production URL: `https://codeoutfitters.vercel.app`
Original commit verified in this document: `51bcd9c0dc2131c81cd3910ca3e42b3eb2faed35` (short `51bcd9c`)
**Superseding commit (current production): `2508a99261005f99b95947501967fab3db2001e2` (short `2508a99`)** — see Section 12 update below.
Vercel deployment ID (original): `dpl_EuvatyVGCMrgC4dJKJqjcjADMHXm`
Deployment status at test time: Ready
Commit identity proof: build-log line `Cloning github.com/WarHawk0097/CodeOutfitters (Branch: main, Commit: 51bcd9c)` — not inferred from visual similarity or timing.
Browser: Chromium 149.0.7827.55 via Playwright 1.61.1 (real browser)
Cache-busting: all URLs carry `?verify=51bcd9c`.
Raw data: `claude-code-production-browser-evidence/raw-results.json`

## Section 1 — Commit-range safety audit (pre-push)

Actual commit count ahead of `origin/main` at audit time: **3** (`c84ff32`, `47f39e2`, `51bcd9c`), not 5 as stated in the request premise. This discrepancy was verified, not assumed away. All 3 commits audited individually: no unrelated work, no secrets/env files, no `node_modules`, no build output, no archive contents, no fabricated QA, no destructive changes. `repo-research/HANDOFF_AUDIT_RESULT.md` remained untracked and did not block push.

## Section 2 — Local gate artifact verification

All 9 required artifacts present, non-empty, current (dated 2026-07-15). All 3 JSON files (`CLAUDE-CODE-MARQUEE-MEASUREMENTS.json`, `CLAUDE-CODE-PROCESS-MEASUREMENTS.json`, `CLAUDE-CODE-LOCAL-RUNTIME-RESULT.json`) parsed valid via `node -e "JSON.parse(...)"`.

## Section 3 — Final pre-push static check

- Typecheck: PASS (`next build`'s tsc step, clean at HEAD `51bcd9c`)
- Build: PASS (17/17 static routes, no errors)
- Lint: `BLOCKED_BY_MISSING_PROJECT_TOOLING` — no eslint binary/config in repo; not manufactured, no new tooling installed.
- Tests: `NOT AVAILABLE — NO TEST FRAMEWORK CONFIGURED`

## Section 4 — Push

`git push origin main` → exit 0 → `315d67a..51bcd9c main -> main`. Post-push `git fetch origin` confirmed `HEAD == origin/main == 51bcd9c0dc2131c81cd3910ca3e42b3eb2faed35`. No force push. `repo-research/HANDOFF_AUDIT_RESULT.md` remained uncommitted, did not block push.

## Section 5 — Deployment identification

`DEPLOYED_COMMIT_VERIFICATION = PASSED`. Deployment `dpl_EuvatyVGCMrgC4dJKJqjcjADMHXm`, `Ready`, production alias `codeoutfitters.vercel.app` points to it, exact commit confirmed via build-log clone statement (see above), not visual inference.

## Sections 6–13 — Production QA matrix

### Responsive matrix: 24/24 PASS

All 8 routes (`/`, `/services`, `/industries`, `/process`, `/about`, `/security`, `/case-studies`, `/contact`) × 3 viewports (1440x1000, 820x1180, 390x844): HTTP 200, `loadOk: true`, correct title, `horizontalOverflow: false`, `consoleErrors: []`, `failedRequests: []`. Full per-check data in `raw-results.json`.

### Homepage acceptance: 3/3 viewports PASS

Per viewport: 15/16 required strings present (`Running task status` — same spec-vs-source naming mismatch as local run, underlying behavior confirmed via adjacent "Running"/progress checks); 7/7 forbidden strings absent (`Maple St`, `private viewing`, `lead qualified`, `booking confirmation`, `Handled end-to-end in 26 seconds`, `312 tasks automated`, `real-estate chat bubbles` — all `present: false`). `whatsappActive: true`, `rowsVisible: 4/4`, `horizontalOverflow: false` at all 3 viewports. **No forbidden content rendered — no automatic production failure triggered.**

### Motion-mode gate: PASS

3 checks (normal, `?motion=full`, `?motion=reduced`) each recorded 0 permanently-hidden elements. Full-motion forces motion under emulated reduced-motion; reduced-motion stops decorative motion while keeping content visible.

### Marquee gate: 3/3 PASS

| Route | Selector | Animation | Duration | Movement | Hover-pause | Resume | Duplicate aria-hidden | Duplicate tabbable | Reduced-mode static |
|---|---|---|---|---|---|---|---|---|---|
| / | .hp-tool-row | hpToolsL | 60s | true | true | true | true | 0 | true |
| /services | .services-marquee-row | (recorded) | — | true | true | true | true | 0 | true |
| /security | .sec-tool-row | secDriftL | 38s | true | true | true | true | 0 | true |

All 3 pass the full shared runtime contract on production, fresh-measured (not reused from local).

### Process gate: PASS

Route `/process`: 1 timeline, 1 fill, 6 stages, 6 unique stages. Fresh production measurements (not reused from local): atTop scrollY=0, scaleY≈0.1697, 1 marker active; atMiddle scrollY=778, scaleY≈0.5247, 3 markers active; atEnd scrollY=1798, scaleY≈0.9934, 6 markers active. Monotonic, materially differentiated, genuinely scroll-linked.

### Obsolete routes: 3/3 PASS

`/pricing`, `/book`, `/portfolio` all return HTTP 404 with genuine Next.js not-found render on production.

## Section 12 — Production interactions (executed 2026-07-15, follow-up pass)

**EXECUTED.** Full interaction sweep run against `51bcd9c`: 94/101 checks pass, 3 genuine defects found (hero tabs missing ARIA tab semantics, FAQ accordions across 6 implementations missing `aria-controls`, no mobile/tablet navigation menu below 960px). All 3 repaired in commit `2508a99`, verified via local build + Chromium regression (40/41, 1 test-selector false positive), pushed, new deployment confirmed Ready with alias pointing to it (build-log commit proof: `Cloning github.com/WarHawk0097/CodeOutfitters (Branch: main, Commit: 2508a99)`), and a targeted 15-check production regression against `2508a99` passed 15/15. Full detail: `CLAUDE-CODE-PRODUCTION-INTERACTION-QA.md` and `CLAUDE-CODE-PRODUCTION-INTERACTION-RESULT.json`.

Contact form: confirmed honest no-backend behavior (`"Preview form — no backend connected. Your details were not sent..."`), no fake success, duplicate-submit produces a single preview only. No live message sent to a real recipient.

## Runtime quality

0 console errors, 0 hydration errors, 0 failed requests, 0 broken assets across all 27 checks executed.

## Accessibility

Same status as local run: PARTIAL, see `CLAUDE-CODE-ACCESSIBILITY-QA.md`. No new full audit executed against production.
