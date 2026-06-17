# DOCUMENTATION CONSISTENCY AUDIT

## 1. Status

**Repair needed**

The foundation docs and memory files are internally consistent. The contradictions are concentrated between the project files and the legacy root files (`README.md`, `DEPLOY.md`), plus one structural redundancy that should be resolved in a future cleanup phase.

## 2. Contradictions Found

| # | Area | File A | File B | Conflict | Recommended Fix |
|---|---|---|---|---|---|
| C-01 | Local port | `README.md` says `http://localhost:3000` | `package.json` script: `next dev --port 3005 --webpack`. `docs/SETUP.md` correctly says 3005. | README tells the operator to use the wrong port. | Repair README in a future approved phase. Spec in `repo-research/README_REPAIR_SPEC.md`. |
| C-02 | Default commands | `README.md` says `npm run dev` is correct | `docs/SETUP.md` notes the dual-lockfile issue and prefers `npm` until resolution. | README treats the three commands as interchangeable. | Repair README. |
| C-03 | Edit-the-page hint | `README.md` says modify `app/page.tsx` | Actual home page is at `app/(public)/page.tsx`. | Operator is pointed at the wrong file. | Repair README. |
| C-04 | Deployment doc location | `DEPLOY.md` (root) is the live doc | `docs/DEPLOYMENT.md` exists and supersedes it. | Two deploy docs. | Delete `DEPLOY.md` in a future cleanup phase. |
| C-05 | Supabase seed step | `DEPLOY.md` says "Add available_slots rows for your available dates/times" | `lib/booking-schema.sql` and `docs/DATABASE.md` say the seed is shipped in the SQL file and runs automatically. | Operator would do redundant work. | Repair `DEPLOY.md` to point at the SQL seed, or delete the file (preferred). |
| C-06 | Sample vs real portfolio | `app/(public)/portfolio/page.tsx` metadata says "Real case studies" | `components/portfolio.tsx` cards display "Sample Project" badges. | Visitor-facing contradiction. | Reconcile in PM1 / implementation. See `docs/FEATURES.md` and `docs/ROADMAP.md` R-4.3. |
| C-07 | Testimonials rendered? | `docs/FEATURES.md` lists the carousel as "defined but not currently rendered" | No code in any page imports `components/testimonials.tsx`. | Internal state of FEATURES doc is correct. No contradiction between docs, but a codebase ↔ doc gap. | Add a `repo-research/UNUSED_COMPONENTS.md` note in a future cleanup. |
| C-08 | Admin proposal persistence | `docs/FEATURES.md` says proposals live in `localStorage` only | `app/admin/page.tsx` "Recent Proposals" tile copy says "view and manage all generated proposals... currently stored in your browser only". | Docs and code agree. No contradiction. Listed for completeness. | None. |
| C-09 | Three GSAP entry points | `lib/gsap.ts`, `lib/animations/gsap-setup.ts`, `lib/animations/gsap-config.ts` | All three are used in different files. | Not a doc contradiction, but a refactor candidate. | Add to roadmap in PM1. |
| C-10 | Two `useScrollReveal` hooks | `hooks/useScrollReveal.ts` vs `lib/animations/useScrollReveal.ts` | Both exist; only the `lib/animations/` one is referenced by `components/animated-text.tsx` and `components/testimonials.tsx`. | Not a doc contradiction, but a cleanup candidate. | Add to roadmap in PM1. |
| C-11 | Dual lockfile | Both `package-lock.json` and `pnpm-lock.yaml` present | `docs/SETUP.md` flags this and recommends `npm` until resolution. | Internal state OK. | Resolve in PM1. Brief in `repo-research/LOCKFILE_DECISION_BRIEF.md`. |
| C-12 | BeFluence rule | D-011 says reference only, no copy | No existing code references `befluence.pro`. | Consistent. Listed for verification. | None. |
| C-13 | Impeccable / Emil install | D-012 says no install | No `npx skills add`, no `npx impeccable install` was run. | Consistent. | None. |
| C-14 | Tooling not approved | Multiple files say "not approved" | No tooling was installed. | Consistent. | None. |
| C-15 | Runtime memory | `memory/IMPORTANT_DECISIONS.md` D-001 says no | No runtime-memory infrastructure exists in code. | Consistent. | None. |
| C-16 | n8n contact form source | `INTEGRATION_NOTES.md` says contact form sends no `source` field | `components/contact.tsx` JSON.stringifies the form only — no `source` added. | Consistent. | None. |
| C-17 | Reduced motion | D-011 / D-012 say respect it | `lib/animations/useScrollReveal.ts`, `lib/animations/useParallaxFloat.ts`, `lib/animations/gsap-config.ts` check `prefers-reduced-motion`. `components/aos-provider.tsx` does **not** pass a `disable` option to AOS init. | Partial coverage. | Roadmap item: AOS reduced-motion opt-out. |
| C-18 | Recent Proposals "Coming soon" | `app/admin/page.tsx` shows the tile but labels it coming soon | `docs/FEATURES.md` mirrors this. | Consistent. | None. |
| C-19 | Booking double-book | `docs/DATABASE.md`, `docs/SECURITY.md`, `docs/ROADMAP.md` all flag the risk | `components/booking-calendar-custom.tsx` does not call `getAvailableSlots`. | Consistent. | None. |
| C-20 | Static export + secrets | `docs/ARCHITECTURE.md` and `docs/SECURITY.md` explain `NEXT_PUBLIC_*` are in the bundle | `next.config.mjs` sets `output: 'export'`. | Consistent. | None. |

## 3. Weak / Missing Explanations

| # | Area | File | Weakness | Recommended Fix |
|---|---|---|---|---|
| W-01 | Admin | `docs/ARCHITECTURE.md` | Does not explain how `/admin/onboarding` reads the saved intake across a route change (relies on `localStorage` write then `router.push`). | Add 2 sentences in a future pass. |
| W-02 | Booking | `docs/DATABASE.md` | Does not explicitly list the seed horizon (12 weeks from 2026-05-18). | Already in `docs/ROADMAP.md` R-2.2. Cross-link from DATABASE. |
| W-03 | Deployment | `docs/DEPLOYMENT.md` | Does not mention that `public/_headers` is only enforced by Cloudflare at the edge, not in `next dev`. | Add note. |
| W-04 | Environment | `docs/ENVIRONMENT.md` | Does not call out the ordering: build-time inlining of `NEXT_PUBLIC_*` requires redeploy to change. | Add a sentence. |
| W-05 | Security | `docs/SECURITY.md` | Does not call out that the admin `localStorage` value is the password itself, not a hash. | Add note. |
| W-06 | Architecture | `docs/ARCHITECTURE.md` | Does not list the 4 distinct form types that share one n8n webhook. | Cross-link to `INTEGRATION_NOTES.md`. |
| W-07 | Roadmap | `docs/ROADMAP.md` | Phase 3.5 items do not yet have explicit acceptance criteria. | Add in PM1. |
| W-08 | QA | `docs/QA_CHECKLIST.md` | The motion + taste checklist is gated, not used today. Make the gate more prominent. | Add a "GATED" stamp. |
| W-09 | State | `memory/WORKING_MEMORY.md` | Open questions are growing. Some duplicate `repo-research/OPEN_QUESTIONS.md`. | Consolidate. |
| W-10 | AI contracts | `ai/AI_CONTRACTS.md` | Does not reference the new OVERNIGHT batch. | Append a contract for overnight batches. |

## 4. Duplicated / Overlapping Docs

| Topic | Files | Recommendation |
|---|---|---|
| Deployment | `DEPLOY.md` (root), `docs/DEPLOYMENT.md` | Keep `docs/DEPLOYMENT.md`. Delete `DEPLOY.md` in a future cleanup phase. |
| Setup | `README.md` (incorrect), `docs/SETUP.md` (correct) | Repair `README.md` to point at `docs/SETUP.md` and to a one-paragraph summary. |
| Animation setup | `lib/gsap.ts` + `lib/animations/gsap-setup.ts` + `lib/animations/gsap-config.ts` (3 GSAP entry points) | Refactor in PM1 / implementation. One canonical client-side setup. |
| Scroll-reveal hook | `hooks/useScrollReveal.ts` + `lib/animations/useScrollReveal.ts` | Delete `hooks/useScrollReveal.ts` after verifying no consumer. |
| Port + commands | `README.md` says 3000, `package.json` says 3005 | Repair `README.md`. |
| Sitemap | `app/sitemap.ts` and the sitemap list in `docs/ARCHITECTURE.md` | Keep both; they are not duplicates. |

## 5. Safe Fixes Applied

In PASS 2, only documentation-level consistency corrections were made. Listed below:

- Cross-references between the new strategy briefs in `repo-research/` and the existing `docs/`, `memory/`, and `ai/` trees will be tightened as the briefs are written. See per-brief entries in the handoff log.
- No source files were modified.
- No package files were modified.
- No `README.md` or `DEPLOY.md` was modified — those repairs are deferred to a Control-Room-approved phase. The README repair is fully specified in `repo-research/README_REPAIR_SPEC.md`.

## 6. Fixes Deferred

These cannot be fixed in the safe docs / memory band:

- README repair → `repo-research/README_REPAIR_SPEC.md`, deferred to PM1 / implementation.
- `DEPLOY.md` deletion → deferred.
- `app/(public)/portfolio/page.tsx` metadata copy → deferred (requires source edit).
- AOS reduced-motion opt-out → deferred (requires source edit and design verification).
- Three-GSAP / duplicate-`useScrollReveal` refactor → deferred.
- Lockfile resolution → deferred per `repo-research/LOCKFILE_DECISION_BRIEF.md`.
- All security hardening → deferred per `repo-research/SECURITY_HARDENING_BRIEF.md`.
- All booking correctness fixes → deferred per `repo-research/BOOKING_CORRECTNESS_BRIEF.md`.
- All UIX0 / MOTION0 implementation → deferred per `repo-research/UIX0_MOTION0_BRIEF.md`.
- All tooling installs → deferred per `repo-research/TOOLING_APPROVAL_BRIEF.md`.
