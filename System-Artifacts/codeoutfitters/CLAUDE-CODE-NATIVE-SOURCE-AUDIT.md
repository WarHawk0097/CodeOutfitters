# CLAUDE-CODE-NATIVE-SOURCE-AUDIT
Generated: 2026-07-14

## Git baseline
HEAD: 315d67a887a406827cf323977c157b8494d50b2b
Branch: main, upstream origin/main, +0/-0
Rollback point for this implementation pass: 315d67a.

CORRECTED BASELINE STATEMENT: the working tree is NOT clean and must never be described as clean.
Current `git status --short` (this session, post-continuation):
```
 M .gitignore
 M app/(public)/about/about-page-client.tsx
 M app/(public)/case-studies/case-studies-page-client.tsx
 M app/(public)/contact/contact-page-client.tsx
 M app/(public)/industries/page.tsx
 M app/(public)/layout.tsx
 M app/(public)/security/security-page-client.tsx
 M components/announcement-bar.tsx
 M components/hero.tsx
 M components/motion-mode-provider.tsx
 M components/navbar.tsx
 M components/process-preview.tsx
 M components/process-timeline.tsx
 M components/process.tsx
 M components/services-bento.tsx
?? System-Artifacts/codeoutfitters/CLAUDE-CODE-NATIVE-SOURCE-AUDIT.md
?? repo-research/HANDOFF_AUDIT_RESULT.md
```

File provenance (best-available reconstruction; authorship of pre-existing diffs not claimed as known):
- **Pre-existing before this continuation, unmodified further** (in-progress implementation changes of unknown/unclaimed authorship, already matching canonical source on inspection): `.gitignore`, `app/(public)/layout.tsx`, `components/announcement-bar.tsx`, `components/hero.tsx`, `components/motion-mode-provider.tsx`, `components/services-bento.tsx`.
- **Pre-existing before this continuation, then edited further in this continuation** (reduced-motion gate completed/added): `app/(public)/about/about-page-client.tsx`, `app/(public)/case-studies/case-studies-page-client.tsx` (verified only, no edit needed), `app/(public)/contact/contact-page-client.tsx`, `app/(public)/industries/page.tsx`, `app/(public)/security/security-page-client.tsx`, `components/process-timeline.tsx`, `components/process.tsx` (both verified as orphaned/unused, no edit needed).
- **Edited fresh in this continuation** (genuine defects found and fixed): `components/navbar.tsx` (removed duplicate non-dismissible announcement bar + dead `#cta` anchor, duplicating the already-correct `AnnouncementBar` in layout.tsx), `components/process-preview.tsx` (fixed dead `useInView` result — spine fill and step entrance were not actually scroll-gated; added `data-process-timeline`/`data-process-fill`/`data-process-stage` attributes for future measurement).
- **Prior-session evidence files** (not modified this session): `repo-research/HANDOFF_AUDIT_RESULT.md`.
- **This audit file**: untracked, created/updated across sessions, intended for eventual commit.
- **Untracked, gitignored, not for commit**: `CODEOUTFITTERS-FINAL-HANDOFF/` (verified ignored via `git check-ignore`).
- **Excluded from any commit at the stop point**: nothing else identified; no unrelated files touched.

## Lint status
`package.json` defines `"lint": "eslint ."`. No ESLint binary exists in `node_modules/.bin`, no `eslint.config.js` in repo. `npx eslint .` silently resolves an unrelated global eslint@10.7.0 and fails on missing config — not valid project evidence. Per explicit instruction: no dependency was installed and no config was authored to manufacture a lint pass.
**LINT = BLOCKED_BY_MISSING_PROJECT_TOOLING.** Never to be reported as passed.

## Build gate
`npx next build` — re-run after every source edit this session. Final state: compiles clean, TypeScript passes, all 17 routes statically generated, zero errors. Last confirmed after the process-preview.tsx and navbar.tsx fixes.

## Browser/QA gate
No Playwright/Chromium/browser-automation tool is available in this session (checked via ToolSearch; only WebFetch — HTTP fetch + text extraction, no rendering — exists). All items in message 2's spec requiring actual rendering, hover simulation, computed-style/transform sampling, or screenshots are:
**NOT EXECUTABLE — no browser automation tool in this session.**
Only source-level static verification was performed (line-by-line diff/read against canonical `.dc.html` sources, grep-based forbidden-string sweep, CSS reduced-motion gate inspection, build/typecheck).

## Dead/orphaned files found (not deleted — no delete authorization given, zero runtime risk since unrendered)
- `components/process.tsx`, `components/process-timeline.tsx` — byte-identical six-step timeline duplicate of each other; zero importers repo-wide. The live `/process` route has its own inline copy in `app/(public)/process/page.tsx`; the homepage uses the separate `components/process-preview.tsx` (4-step, distinct component). These two files render nowhere.
- `components/hero-workflow-visual.tsx` — GSAP-animated SVG workflow diagram, correctly built (accepts `comfort` prop, both effects gated `if (comfort) return`, proper `ctx.revert()`/`tl.kill()` cleanup, `aria-hidden`), but has zero importers — not wired into `hero.tsx` or anywhere else.

## Forbidden-string sweep (this session, full token list including message-2 additions)
Searched: Maple St, private viewing, lead qualified, "Handled end-to-end in 26 seconds", "312 tasks automated", "1,284.2", href="#", .dc.html, support.js, dangerouslySetInnerHTML, MutationObserver, motion=full, motion=reduced, motion-ready, opacity-0, opacity: 0, iframe — across app/ and components/.
Result: only expected/classified hits —
- Maple St chat content in `components/services-bento.tsx` (canonical, Homepage-Services-section-sourced, PRESERVE — re-verified this session against `CodeOutfitters Homepage v8.dc.html` lines 497-507, exact string match).
- "Lead Qualified" in `components/hero-workflow-visual.tsx:22` — generic workflow-step label, not the rejected chat's "★ Lead qualified · 9/10" score string; different context, not a violation; file is unrendered regardless.
- `opacity: 0` / `opacity: 0,` — expected framer-motion `initial`/`animate` object values across ~15 components, all governed by the single `MotionConfig` resolver in `motion-mode-provider.tsx`.
- `motion-ready` — the one correct, intended usage in `motion-mode-provider.tsx:37`.
No unclassified or unexpected matches. No `motion=full`/`motion=reduced` literal strings in source (read dynamically from URL query params, as designed).

## Forbidden-route re-check
`/pricing`, `/book`, `/portfolio` — no page files exist under `app/(public)` (confirmed via directory listing: about, case-studies, contact, industries, layout.tsx, page.tsx, privacy, process, security, services, terms). Compliant, unchanged from prior audit.

## Handoff audit result
HANDOFF_AUDIT = PASSED (see repo-research/HANDOFF_AUDIT_RESULT.md, full per-item evidence).

## Canonical approved source
F:\CodeOutfitters\# CodeOutfitters Project Audit)\CodeOutfitters-fable-final-animation-repair-v1\
(named explicitly in FABLE-FINAL-SOURCE-AND-MOTION-AUDIT.md line 5; other archive copies exist
under "# CodeOutfitters Project Audit)" and are NOT canonical — do not port from them.)
This directory is already gitignored (.gitignore, "Local approved design-source archive (not used
by the native production build)").

## Repository conventions decision
- CODEOUTFITTERS-FINAL-HANDOFF/ is NOT committed wholesale. Read in place as implementation guidance
  per instruction. Adding to .gitignore alongside the existing archive-source entry (same rationale:
  design/handoff material, not part of the native production build) — additive, documented change,
  not a silent hide.
- repo-research/HANDOFF_AUDIT_RESULT.md and this file (System-Artifacts/codeoutfitters/) both match
  established tracked-evidence conventions already in the repo. No relocation needed.

## Actual native architecture (verified by listing, not assumed)
- No src/ variant — app/ and components/ live at repo root.
- Router: app/(public)/{about,case-studies,contact,industries,privacy,process,security,services,terms}
  each with page.tsx (+ *-page-client.tsx for about/case-studies/contact/security).
- app/admin/{onboarding,proposal}/page.tsx — separate admin surface, out of scope for this pass.
- No middleware.ts anywhere in repo root.
- No /pricing, /book, /portfolio route files exist (grep confirmed zero matches under app/).
- Motion libraries in package.json: framer-motion 12.38, gsap 3.15 + @gsap/react, aos 2.3.4 — THREE
  motion systems coexist natively vs. the single motion.js resolver model in the approved source.
  Architecture divergence to reconcile, not necessarily a defect — MotionModeProvider already bridges
  preference to framer-motion's MotionConfig; gsap/aos usage needs individual audit per component.
- components/motion-mode-provider.tsx ALREADY implements the resolver contract close to spec:
  ?motion=full/reduced precedence, system prefers-reduced-motion fallback, writes
  data-motion/data-motionReduced attrs to <html>. Gap vs contract: spec names html.motion-ready
  class + html[data-motion="full|reduced"]; native uses data-motion (preference value, can be
  "system") and a separate data-motionReduced boolean — same information, different shape. Fixable
  by adapting attribute/class names rather than a rewrite.
- No test harness: no Playwright config, no vitest, no *.test.* files anywhere in the repo.
  .playwright / .playwright-cli dirs exist at root but no committed config found at depth 2.
- package.json scripts: dev (--port 3005 --webpack), build, start, lint (eslint .). No "test" script.

## Test-gate definition (required before commit, since no test harness exists)
"Run tests" in the implementation order is defined as:
  1. next build type-checks (tsc via next build) passes with zero errors
  2. eslint . passes with zero errors
  3. next build completes clean
  4. Local Chromium QA manually driven against FRONTEND-INTEGRATION-TEST-PLAN.md acceptance
     checklist (Homepage gate: rejected chat UI absent, task-list demo present, address
     app.codeoutfitters.ai/live, Built in 7 days pill, Automation Engine heading, Running state,
     hours-saved metric, WhatsApp active + Email/Support present, 4 required tasks with correct
     statuses, 328 tasks automated, $0 payroll spent, no cropped rows/overflow, faithful scaling).
This is the green bar the commit/push step is conditioned on. Partial pass (e.g. non-behavioral lint
warnings) is not silently upgraded to a full pass — noted explicitly if it occurs.

## Route map (native vs canonical)
| Route | Native file(s) | Canonical source | Status |
|---|---|---|---|
| / | app/(public)/page.tsx + components/hero.tsx, stats-strip, tools-marquee, services-bento, process-preview, roi-calculator, case-studies-preview, testimonials, faq, cta-banner | CodeOutfitters Homepage v8.dc.html | MAJOR MISMATCH — hero.tsx is the rejected real-estate chat |
| /services | app/(public)/services/page.tsx | CodeOutfitters Services.dc.html | featured-card demo PRESERVED per corrected decision below, verify copy alignment; rest diffed during implementation |
| /industries | app/(public)/industries/page.tsx | CodeOutfitters Industries.dc.html | diffed during implementation |
| /process | app/(public)/process/page.tsx + components/process-timeline.tsx | CodeOutfitters Process.dc.html | diffed during implementation |
| /about | app/(public)/about/{page.tsx,about-page-client.tsx} | CodeOutfitters About.dc.html | diffed during implementation |
| /security | app/(public)/security/{page.tsx,security-page-client.tsx} | CodeOutfitters Security Reliability.dc.html | diffed during implementation |
| /case-studies | app/(public)/case-studies/{page.tsx,case-studies-page-client.tsx} | CodeOutfitters Case Studies.dc.html | diffed during implementation |
| /contact | app/(public)/contact/{page.tsx,contact-page-client.tsx} | CodeOutfitters Contact.dc.html | diffed during implementation, verbatim form fields/validation copy required |

Per-section (data-screen-label) diffs for /services through /contact happen inline during
implementation steps 5-7 (read each .dc.html once, apply fix directly) rather than a separate
duplicate read pass.

## Global sections present/missing
- AnnouncementBar: component exists (components/announcement-bar.tsx) but is NOT imported/rendered
  anywhere (grep confirmed zero usages). MISSING SECTION on all pages.
- Header/Navbar: components/navbar.tsx rendered in app/(public)/layout.tsx. Verify against
  [data-screen-label="Nav"] spec (sticky, blur, 68px min-height, .nav-links-v6 hide <960px) during
  implementation.
- Footer: components/footer.tsx rendered in layout.tsx — token diff (#070D0A bg etc.) during
  implementation.
- MobileNavigation: no standalone components/MobileNavigation.tsx found; likely inline in navbar.tsx
  — verify during Header repair step.

## Homepage rejected-demo findings (confirmed via string search)
components/hero.tsx contains the REJECTED real-estate chat interface, confirmed by exact matches:
- "Hi! Is the 2-bed on Maple St still available? Can I view it this week?" (hero.tsx:174)
- "It is! I can book you a private viewing this week — which day suits you best?" (hero.tsx:178)
- "12 Maple St · calendar invites sent to both sides" (hero.tsx:188)
- "Handled end-to-end in 26 seconds — no human needed" (hero.tsx:191)
- "312 tasks automated" (hero.tsx:136) — stale number matching approved source's initial state
  (1284.2/312), but acceptance gate requires the corrected display (1,285.8 hrs / 328 tasks) and
  this must not render attached to the rejected chat's supporting stat.
- "app.codeoutfitters.ai/live" IS present (hero.tsx:104) but attached to the wrong demo (chat, not
  Automation Engine task list).
Classification: all rejected production implementation. hero.tsx requires full replacement of the
right-column demo with the AutomationEngineDemo component tree per implementation map (BrowserFrame,
EngineHeader, ChannelTabs, AutomationTaskList, EngineMetricsFooter), keeping left-column hero
copy/layout if it matches canonical Homepage source (verify during step 3).

## Services featured-card decision (evidence-backed) — CORRECTED, supersedes prior conclusion below
- Prior finding in this doc (grepping only CodeOutfitters Services.dc.html, a different/incomplete
  source file, and concluding zero matches ⇒ remove) was WRONG and is retracted. Re-verified directly
  against the canonical CodeOutfitters Homepage v8.dc.html, which contains a `data-screen-label`
  section map confirmed by direct grep: Hero 263-397, Stats 397, Tools 419, Services 446-603 (id
  "services", class "services-v6"), Process 603, Math 655, Results 743, Testimonials 841, FAQ 909,
  CTA 939, Footer 970.
- w1-w8/wRead keyframes are defined once, generically, at lines 60-68 of the shared <style> block.
  Their MARKUP usage — the Maple St conversation itself — sits at lines 455-507, entirely inside the
  Services block (446-603), under comment "FEATURED · WhatsApp Lead Automation" (line 455) and
  heading "WhatsApp Lead Automation" (line 467). This is Services-featured-card content, not Hero
  content. Hero (263-397) contains only the consoleTasks-driven Automation Engine task list (sc-for
  at line 322) plus Email (eFlow/eOrb/eN*/eC*) and Support-console (cL1-5/cScan) tab demos — zero
  w1-w8/Maple St markup anywhere in the Hero range. Confirmed by direct read of lines 263-397.
- motion-contracts.json's mo-demo-loops entry (component: "Email/Support panels + services featured
  demo", keyframes including "w1-w8/wRead 13s") independently corroborates: the w1-w8 animation is
  named as Services-featured-demo content, grouped with Email/Support (both Hero tab demos, NOT chat),
  never described as Hero content.
- FABLE-FINAL-SOURCE-AND-MOTION-AUDIT.md's own "## Unresolved" section states verbatim: "Services
  featured-card miniature conversation demo (w1-w8 keyframes) exists in approved source as a
  service-card demo; verify with stakeholder whether it is covered by the hero-chat rejection (it is
  NOT the hero demo). Status: UNRESOLVED." This is now RESOLVED by the direct source-line evidence
  above: the demo is approved Services content, categorically separate from the Hero real-estate-chat
  rejection (that rejection concerns hero.tsx's ActiveChatMessages(), which duplicates this same
  Maple St content into the Hero section where it does NOT belong in canonical source).
- Stakeholder sign-off was requested by the handoff audit and was never obtained (no stakeholder
  response found anywhere in the handoff). Proceeding on direct-source-evidence per standing
  instruction to continue without pausing for confirmation, since keeping approved-source content
  is the non-destructive default. Flagged here as a judgment call made under an originally-UNRESOLVED
  disposition, for the user to override if a stakeholder ruling exists that is not present in the
  handoff bundle.
- DECISION (corrected): PRESERVE components/services-bento.tsx's ChatDemo() (Maple St conversation) as
  approved canonical Services-featured-card content. Do NOT remove it. Align its copy verbatim to
  canonical source lines 497-507 during implementation (diff pass, not deletion) — specifically verify/
  correct: "Handled end-to-end in 26 seconds — no human needed" (w8), "Viewing booked — Thu 4:00 PM" /
  "12 Maple St · calendar invites sent to both sides" (w6), "★ Lead qualified · 9/10" badge (w7).
  hero.tsx's ActiveChatMessages() remains correctly classified as the rejected leak (see Homepage
  rejected-demo findings above) and must still be removed from hero.tsx and replaced with the
  AutomationEngineDemo tree — that finding is unaffected by this correction.

## Motion-system findings
- motion-contracts.json resolver spec (precedence full > reduced > OS; html.motion-ready +
  html[data-motion]; kill CSS gated on class/attr only) is functionally implemented by
  motion-mode-provider.tsx already, using data-motion/data-motionReduced attributes instead of a
  motion-ready class. Adapt attribute/class naming to match contract rather than rewrite.
- Approved easings (cubic-bezier(.16,1,.3,1) premium / .22,1,.36,1 soft / .34,1.56,.64,1 spring) —
  not yet verified as CSS variables in native code; check during global-components pass.
- Native repo uses gsap + aos + framer-motion simultaneously; each route's usage needs auditing
  against the single-resolver model so ?motion=reduced actually disables all three, not just
  framer-motion (MotionConfig only governs framer animations — gsap/aos need their own
  reduced-motion gating; motion-mode-provider.tsx currently wires only MotionConfig, no gsap/aos
  gating visible). RISK — flagged for implementation step 1.
- No dangerouslySetInnerHTML, no <iframe>, no .dc.html embedding found anywhere in native source
  (grep clean) — forbidden-shortcuts list not violated on these specific items.
- setInterval/requestAnimationFrame/IntersectionObserver/useInView/whileInView/AnimatePresence
  patterns are in use across ~19 files (hero.tsx, services-bento.tsx, tools-marquee.tsx,
  testimonials.tsx, case-studies-page-client.tsx, motion-mode-provider.tsx, page-transition.tsx,
  hooks/useScrollReveal.ts, lib/animations/useScrollReveal.ts, etc.) — legitimate production
  implementation in all cases inspected; none are stale test artifacts or documentation leakage.

## Forbidden-route findings
/pricing, /book, /portfolio: no page files exist under app/ for any of the three. No middleware.ts
to redirect/rewrite them. Next.js App Router default for a non-existent route is 404 via
app/not-found.tsx. No links to these routes found in the page files inspected. Status: absent,
404 by default, not linked — matches forbidden-route requirement, no code change needed.
(components/portfolio-placeholder.tsx and components/portfolio.tsx exist but are not wired to any
route — dead/unused files, not a forbidden-route violation; see obsolete findings below.)

## Obsolete/dead-link findings
- components/announcement-bar.tsx — built, never rendered. Needs wiring into app/(public)/layout.tsx.
- components/portfolio.tsx, components/portfolio-placeholder.tsx — not routed anywhere; predates
  removal of /portfolio (prior commit 75fccfd "remove obsolete routes"). Leave in place unless user
  requests deletion — out of scope for this pass, not blocking.
- _legacy-dc-backup/ at repo root — pre-existing backup directory, untouched by this pass.

## Implementation plan (this session)
1. Motion-mode foundation: adapt motion-mode-provider.tsx attribute/class naming to
   html.motion-ready + html[data-motion="full|reduced"]; audit gsap/aos call sites for
   reduced-motion gating consistent with the single-resolver contract.
2. Remove rejected Homepage chat from hero.tsx (Maple St conversation, associated w1-w8/wRead
   keyframe usage, "26 seconds" copy, stale 312 stat).
3. Implement AutomationEngineDemo component tree (BrowserFrame/TopBar, EngineHeader, ChannelTabs,
   AutomationTaskList, EngineMetricsFooter) per CLAUDE-CODE-NATIVE-IMPLEMENTATION-MAP.md; initialize
   hoursSaved=1285.8, tasksToday=328 directly (never render stale 312); tick cadence tuned so at-rest
   / first-paint value reads exactly 328/1,285.8 for QA capture.
4. Repair shared components: wire AnnouncementBar into layout, verify Header/Footer tokens.
5-7. Repair all 8 routes against canonical .dc.html sources section-by-section; repair marquees
   (tools + testimonials) and Process timeline (6-stage, single timeline per map).
8. Honest backend-ready states: confirm unimplemented endpoints remain labeled
   PROPOSED — NOT YET IMPLEMENTED; no fabricated success states without backend confirmation
   (contact form).
9. Accessibility repair per ACCESSIBILITY-INTEGRATION-SPEC.md.
10-13. Typecheck (next build) + lint (eslint .) + build clean + local Chromium QA against
   FRONTEND-INTEGRATION-TEST-PLAN.md acceptance checklist; fix failures; commit only after all four
   are genuinely green.

## Files expected to change
components/hero.tsx, components/services-bento.tsx, components/motion-mode-provider.tsx,
app/(public)/layout.tsx, new home/* component files per implementation map, components/navbar.tsx,
components/footer.tsx, per-route page.tsx/*-page-client.tsx files for all 8 public routes,
components/tools-marquee.tsx, components/testimonials.tsx, components/process-preview.tsx,
components/process-timeline.tsx, contact-page-client.tsx.

## Files/areas that must be preserved untouched
app/admin/**, lib/booking-*, lib/supabase.ts, lib/proposal-generator.ts, supabase/, workers/,
_legacy-dc-backup/, all repo-research/ and System-Artifacts/ evidence history, .env.local,
CODEOUTFITTERS-FINAL-HANDOFF/ (read-only guidance, not modified), the canonical archive source
directory itself (read-only reference).

## Risks and blockers
- No test harness exists — test-gate defined above as typecheck+lint+build+manual Chromium QA;
  flagged, not silently treated as "tests pass."
- Three coexisting motion libraries (framer-motion/gsap/aos) vs. single-resolver contract model —
  reduced-motion gating must be verified per-library, higher risk of partial compliance.
- Metrics tick cadence (1285.8/328 initial + live tick) must not drift past acceptance-gate numbers
  before/during QA capture — timing needs explicit control.
- Services featured-card conflict between handoff's own UNRESOLVED note and direct source inspection
  — resolved here with evidence (PRESERVE, not remove); documented in case of later dispute. No
  stakeholder sign-off was located in the handoff bundle for this item — proceeding on direct-source
  evidence per standing instruction; flagged for user override if a stakeholder ruling exists
  elsewhere.
- Push to origin/main is the one irreversible/shared-state action in this sequence — gated strictly
  on steps 10-13 being genuinely green, per prior authorization to proceed without re-confirmation
  once gates pass.
