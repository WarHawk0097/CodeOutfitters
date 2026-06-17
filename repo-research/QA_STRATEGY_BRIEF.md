# QA STRATEGY BRIEF

> The repo has no tests and no CI. `docs/QA_CHECKLIST.md` documents a manual checklist. This brief is input for PM1. **Do not install any test tool, framework, or MCP server in the current batch. Do not add test files.**

## 1. Current QA State

- **No tests.** No `*.test.*` or `*.spec.*` files anywhere. `@playwright/test` is a transitive dep in both lockfiles, not a direct dep.
- **No CI.** No `.github/`, `.gitlab-ci.yml`, etc. No automated checks.
- **No typecheck script.** TypeScript is configured strict; the `tsconfig.tsbuildinfo` artifact is committed, suggesting `tsc` has been run locally, but there is no `npm run typecheck` script.
- **Lint script exists, no config.** `package.json` has `npm run lint` but no `eslint.config.*` or `.eslintrc.*` file in the repo.
- **Manual QA checklist exists.** `docs/QA_CHECKLIST.md` covers visual, responsive, booking, form webhook, admin, and security smoke.
- **No visual regression.** All visual checks are manual.
- **No monitoring.** No error tracking, no uptime, no form delivery monitor.
- **No reduced-motion coverage today.** AOS does not opt out. GSAP hooks do, but coverage is partial.

## 2. Manual QA Required Now

The full manual checklist is in `docs/QA_CHECKLIST.md`. The minimum bar for any release is:

- Home page renders.
- `/pricing`, `/contact`, `/book` all load and submit.
- `/admin` gate works for the intended single operator.
- Reduced-motion variant does not break the layout.
- No console errors on any public page.
- Mobile responsive at 375 / 768 / 1024 / 1440.
- Cloudflare CSP is in effect on the deployed site (check response headers).
- `robots.txt` disallows `/admin`.

## 3. Future Automated QA Candidates

| Candidate | Purpose | Cost | Gate required | Notes |
|---|---|---|---|---|
| `tsc --noEmit` as a CI step | Type errors fail the build. | zero | none | Add a `typecheck` script to `package.json`. |
| `npm run lint` (with a real ESLint config) | Lint errors fail the build. | zero | none | First add a config (R-026). |
| Playwright MCP smoke flows | Reproduce the manual checklist in a browser. | zero (free tier) | TS0 / RDG0 | Use MCP form, not a local install. |
| Playwright as a real test runner | `npx playwright test` in CI. | zero (free) | TS0 / RDG0 | Better for CI than MCP-only. |
| Chrome DevTools MCP | Performance, console, network introspection. | zero | TS0 / RDG0 | Pairs with Playwright. |
| Lighthouse CI | LCP, CLS, INP, TBT budgets. | zero (free) | none | Add to CI in a tooling-approved phase. |
| Visual regression (Playwright screenshots) | Detect pixel-level changes. | zero (free) | TS0 / RDG0 | Same approval as Playwright MCP. |
| Form contract tests | Verify the n8n payload shape per form. | zero | none | Could be a unit test, no browser needed. |
| Booking flow tests | Verify slot reservation correctness. | zero | none | Needs the booking fix first. |
| Admin proposal flow tests | Mock Anthropic, verify 11 sections. | zero | none | Needs a test-friendly proposal module. |
| Accessibility (axe-core) | WCAG 2.1 AA scan. | zero | none | Can run via Playwright. |
| Mobile / responsive | Device emulation in Playwright. | zero | TS0 / RDG0 | Same approval. |
| Bundle size guard | Fails the build if JS / CSS grows past budget. | zero | none | Add a `size-limit` or similar. |

## 4. Playwright MCP Future Use

When approved:

- AI opens the page in a real browser.
- AI captures screenshots at 375 / 768 / 1024 / 1440.
- AI runs through the smoke flow: home → click "Get a Custom Quote" → fill quote form → submit → expect success.
- AI runs through the admin flow: `/admin` → fill password → complete intake → click Generate → expect 11 sections.
- AI diffs against the previous run; flags pixel changes.
- AI critiques the result with Impeccable + Emil Kowalski rules.

## 5. Chrome DevTools MCP Future Use

When approved:

- Inspect the runtime console for errors.
- Inspect the network tab for failed requests or CORS issues.
- Inspect the performance trace for INP / LCP regressions.
- Toggle `prefers-reduced-motion: reduce` and verify the page.
- Toggle the throttling profile and verify the page on a slow CPU.

## 6. No-Install Rule Until Approved

Until the owner approves tooling:

- No `npm install` of any test or QA package.
- No `npx playwright install`.
- No MCP server config in any file.
- No `package.json` `devDependencies` change.
- No CI config file (`.github/workflows/*`, etc.).

The only QA-related change that can happen without tooling approval is:

- Adding a `typecheck` script to `package.json` (no new dep).
- Adding a `lint` config (no new dep, just config files).
- Writing the strategy in this brief and in `docs/QA_CHECKLIST.md`.

## 7. Recommended First QA Slice

**Recommendation: the smallest slice that catches the most breakage.**

1. Add `typecheck` script (`tsc --noEmit`). Zero new deps. Catches all type regressions.
2. Add a minimal `eslint.config.mjs` (flat config) that extends `next/core-web-vitals`. Zero new deps beyond what `next` already provides. Catches a wide range of regressions.
3. Add a CI workflow (`.github/workflows/ci.yml`) that runs `npm run typecheck` and `npm run lint` on every PR. Catches regressions before merge.

The first slice does not require any new tooling approval. It is a config-only change, gated on PM1 and Control Room.

After the first slice, the next slice is:

4. Install Playwright as a real test runner. Add a small `tests/smoke.spec.ts` that covers home, services, pricing, contact, book, admin gate. CI runs it. This slice does need TS0 / RDG0 approval for the dev dep.

## 8. Acceptance Criteria

A future QA phase is complete when:

1. `tsc --noEmit` is run on every PR and fails the build on type errors.
2. `npm run lint` runs against a real ESLint config and fails the build on lint errors.
3. The Playwright smoke spec covers the most important flows.
4. The CI workflow is the single source of truth for "is this PR green."
5. The reduced-motion variant passes in Chrome DevTools.
6. The manual checklist in `docs/QA_CHECKLIST.md` is updated to reflect the new automated layer.
7. `repo-research/RISK_REGISTER.md` R-008 and R-009 are moved to a "Closed" section.
