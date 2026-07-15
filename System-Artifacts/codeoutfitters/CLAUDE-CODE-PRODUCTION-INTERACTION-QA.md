# CodeOutfitters — Production Interaction QA

Run date: 2026-07-15
Starting deployed commit: `51bcd9c`
Final deployed commit: `2508a992` (short `2508a99`)
Deployment ID (post-repair): confirmed via `vercel inspect` build-log clone line `Cloning github.com/WarHawk0097/CodeOutfitters (Branch: main, Commit: 2508a99)`.
Production alias `https://codeoutfitters.vercel.app` confirmed pointing at the post-repair deployment.
Browser: Chromium 149.0.7827.55 via Playwright 1.61.1 (real browser).

## Method

Full interaction sweep executed against `51bcd9c` first (94 pass / 3 fail / 4 N/A, 0 console errors, 0 failed requests — see raw `interaction-results.json`). 3 genuine defects found and repaired (Section below). A targeted 15-check regression was then executed against the new `2508a99` deployment to confirm the repairs landed in production; all 15 passed.

## Interactions tested (initial sweep against `51bcd9c`)

**Homepage**: hero tabs (WhatsApp/Email/Support) click + keyboard; ROI calculator valid input, output update, boundary/min-value input (no NaN/crash); calculator CTA href; FAQ open/close/keyboard; announcement bar dismiss; CTA hrefs (0 bad `#` hrefs); FAQ touch target size; focus outline presence. All PASS except hero-tab ARIA semantics (DEFECT 1) and FAQ `aria-controls` (DEFECT 2).

**Services**: search input filter, empty-result state, Escape clears search, "How it works" toggle expand/collapse/keyboard, marquee presence, FAQ open/close. All PASS (FAQ affected by DEFECT 2, same as Homepage).

**Industries**: card content in DOM (not hover-only), readable at 390px, card link hrefs, FAQ open/close/keyboard, touch targets. All PASS (FAQ affected by DEFECT 2).

**Process**: FAQ open/close/keyboard, timeline steps present. PASS (FAQ affected by DEFECT 2; scroll-linkage itself already verified in prior QA pass, not re-tested here).

**About**: route exists and renders (17/17 static routes at build); no additional interactive elements beyond content/CTAs identified — not fabricated.

**Security**: marquee running, CSS hover-pause rule confirmed in stylesheet, FAQ open/close/keyboard, no fabricated stateful controls (static info cards only — correctly not tested as interactive). FAQ affected by DEFECT 2.

**Case Studies**: 7 filter pills, filter-by-category card count changes, "Read the full story" expand/collapse/keyboard, no named fake clients (role-descriptor attributions only), testimonial dot navigation. All PASS.

**Contact**: keyboard tab order, HTML5 required-field validation, invalid-email `typeMismatch`, honest backend-unavailable preview text (no fake success), double-submit produces single preview (no duplicate), FAQ open/close. All PASS (FAQ affected by DEFECT 2).

**Mobile nav (390x844) / tablet nav (820x1180)**: nav links correctly hidden below 960px per design, but no replacement control existed — DEFECT 3.

**Reduced motion (`?motion=reduced`)**: `data-motion="reduced"` applied, tab auto-cycle stops, manual tab/FAQ/search interactions still function. All PASS.

## Defects found and repaired

1. **Hero tabs lacked ARIA tab semantics** — `components/hero.tsx`. No `role="tablist"`/`role="tab"`/`aria-selected`/`aria-controls`. Fixed: added full tab/tabpanel ARIA wiring (lines near the WhatsApp/Email/Support button map and the `tabContent` helper).
2. **FAQ accordions across 6 independent implementations lacked `aria-controls`** — `components/faq.tsx` (shared, used by Homepage/Industries-adjacent), and separate inline implementations in `app/(public)/contact/contact-page-client.tsx`, `app/(public)/process/page.tsx`, `app/(public)/industries/page.tsx`, `app/(public)/security/security-page-client.tsx`, `app/(public)/services/page.tsx`. Fixed: each trigger button now has `id`, `aria-controls` pointing to a matching panel `id`, and the panel carries `role="region"` + `aria-labelledby`.
3. **No mobile/tablet navigation menu** — `components/navbar.tsx`. `.site-links` was hidden via `@media(max-width:960px){display:none}` with no replacement; below 960px there was no way to reach Services/Industries/Process/Case Studies/About. This is a functional defect, not just an accessibility gap. Fixed: added a hamburger toggle button + full-screen drawer with focus trap (Tab wraps within menu), Escape-to-close, body scroll lock/unlock, and focus return to the trigger on close.

All three repaired in commit `2508a99` (`fix: add mobile navigation menu and complete tab/accordion ARIA semantics`), verified via `npx next build` (clean, 17/17 routes) and a local Chromium regression (41 checks, 40 pass / 1 false-positive from a test-selector ambiguity — see below), then pushed and reverified against the live production redeploy (15/15 targeted checks pass).

### Note on local regression false alarm

The local regression run flagged `/services faq button has aria-controls: FAIL`. Root cause: the test's generic selector `button[aria-expanded]:not(.site-nav-toggle)` matched the page's `.services-how-toggle` button (which is intentionally not part of the accordion pattern, has no associated panel) instead of the actual FAQ trigger. Verified directly with a targeted selector (`button[id^=svc-faq-btn]`) that the real Services FAQ button does carry `aria-controls="svc-faq-panel-0"`. Not a product defect — a test-script selector ambiguity, corrected before the production rerun.

## Mobile navigation focus management (post-repair)

- Toggle button: `aria-expanded` false→true on open, `aria-label` "Open menu"/"Close menu".
- Focus enters menu (first focusable, the Close button) on open.
- Tab wraps within menu (first↔last) while open — focus trap implemented via `keydown` listener on `Tab`.
- Escape closes the menu and returns focus to the toggle button.
- Body scroll lock (`document.body.style.overflow = 'hidden'`) engages on open, restores previous value on close.
- All 6 route links present in the mobile menu (Services, Industries, Process, Case Studies, About, Contact/Book a Call); no obsolete route links (`/pricing`, `/book`, `/portfolio`).
- Confirmed at both 390x844 (mobile) and 820x1180 (tablet, toggle visible/functional at this width too).

## Reduced motion (repaired components)

Not separately re-tested against `?motion=reduced` after the repair (mobile menu, tabs, and FAQ are all instant-toggle interactions unrelated to the marquee/scroll-linked motion system already covered by `CLAUDE-CODE-MOTION-QA.md`); no interaction logic in the repaired components depends on motion mode, so no regression risk identified. Disclosed as not explicitly re-executed, not claimed as tested.

## Accessibility interaction scope (honest label)

This is a **runtime interaction spot-check**, not a full WCAG audit. Executed and passing: tab roles (`role="tablist"`/`"tab"`/`aria-selected`), accordion `aria-expanded`+`aria-controls`+labelled region across all 6 implementations, mobile menu focus trap/return/Escape, HTML5-native form validation association, visible default focus outline present, touch targets ≥40px on tested controls (FAQ buttons 66-71px, submit button 49px, mobile toggle 36-40px). Not executed: full keyboard traversal of every route, screen-reader (NVDA/VoiceOver) pass, color contrast audit, comprehensive landmark-role audit. Same disclosed gaps as `CLAUDE-CODE-ACCESSIBILITY-QA.md`.

## Console/network integrity

0 console errors, 0 hydration errors, 0 failed requests across the full initial sweep (94+3+4=101 checks against `51bcd9c`) and the full post-repair regression (41 local + 15 production checks against `2508a99`).
