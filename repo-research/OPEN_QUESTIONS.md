# OPEN QUESTIONS

The questions that need the owner or ChatGPT Control Room to answer. Some duplicate `memory/WORKING_MEMORY.md`; both files stay in sync.

## Q-01 — Package manager

Should `npm` or `pnpm` be the canonical package manager? Recommendation: `npm` (matches `package.json` scripts and `docs/DEPLOYMENT.md`). See `repo-research/LOCKFILE_DECISION_BRIEF.md`.

## Q-02 — Real business site or portfolio demo first

Is CodeOutfitters intended to be a real business site (collecting leads, doing engagements) or a portfolio demo first? Affects how aggressively the security and booking risks are addressed before public launch.

## Q-03 — Admin tool audience

Is the admin tool internal-only for now, or will it become client-facing later? Affects the auth model choice.

## Q-04 — Anthropic proposal protection timing

Should the Anthropic proposal call be protected (Worker proxy) before any non-internal launch? Default: yes, before any non-internal audience.

## Q-05 — Admin auth hardening timing

Should admin auth be fixed before any non-internal launch? Default: yes.

## Q-06 — Booking double-book prevention timing

Should booking double-book prevention ship before any non-internal launch? Default: yes, but the MVP fix is small.

## Q-07 — Supabase RLS as a launch gate

Should Supabase RLS be mandatory before any non-internal launch? Default: yes.

## Q-08 — Motion vs first-load speed

Is heavy motion a higher priority than strict first-load speed, or should there be a strict performance budget? D-011 implies yes-to-motion; the UIX0 / MOTION0 plan needs the budget spelled out.

## Q-09 — BeFluence inspiration scope

Should `befluence.pro` be treated only as motion/interaction inspiration, with no direct layout cloning? Default: yes (D-011 already states this).

## Q-10 — Impeccable / Emil install scope

Should Impeccable and Emil Kowalski skills be installed globally, per-project, or used only as reference? D-012 currently says: per-project, only after TS0 / RDG0 approval.

## Q-11 — Tooling order

Which tooling should be approved first: Playwright MCP, Chrome DevTools MCP, Graphify, Repomix, Context7, Tree-sitter, or codebase-memory? Recommended order in `repo-research/TOOLING_APPROVAL_BRIEF.md`.

## Q-12 — Recent proposals viewer scope

Should the "Recent Proposals" tile on the admin dashboard be part of MVP stabilization, or deferred to a later admin-feature phase?

## Q-13 — DEPLOY.md cleanup

Acceptable to delete the legacy `DEPLOY.md` at the repo root in a future cleanup phase, or keep it and reconcile with `docs/DEPLOYMENT.md`?

## Q-14 — Contact form source field

Should the contact form add a `source: "contact"` field for symmetry with the other forms? This makes the n8n contract more uniform.

## Q-15 — Auth model choice

Which auth model? Cloudflare Access (preferred, no code), Auth.js, Supabase Auth / magic link, or a basic-auth-style proxy? See `repo-research/SECURITY_HARDENING_BRIEF.md`.

## Q-16 — Performance budget

What is the agreed performance budget for the UIX0 / MOTION0 first slice? LCP, CLS, INP, bundle size.

## Q-17 — Taste acceptance rubric

What is the minimum "premium agency feel" bar before the UIX0 / MOTION0 first slice is considered shipped? The avoid/prefer list in D-012 is the contract; the team needs a concrete acceptance rubric.

## Q-18 — Test runner form

For the QA phase: should Playwright be installed as a real test runner (CI) or used only via the Playwright MCP? Or both?

## Q-19 — Observability vendor

For the observability phase: which free vendor? Sentry vs GlitchTip, UptimeRobot vs Better Stack free tier, etc.

## Q-20 — Brand status footer

Replace the hard-coded "All systems operational" footer badge with a live status source, or keep it static and document it as a known limitation?
