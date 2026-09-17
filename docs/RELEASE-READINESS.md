# Release readiness

This runbook applies to the `feat/leads-foundation-live` worktree. It is a handoff
record, not a release certification.

## Current verified local gates

- Full Vitest: 172 files, 2,491 tests, exit 0. Use `TMPDIR=/dev/shm` on hosts where
  temporary writes under `/srv/projects` return system error `-122`.
- TypeScript: `npx tsc --noEmit`, exit 0.
- ESLint: `npx eslint .`, exit 0.
- Build: `TMPDIR=/dev/shm npm run build`, exit 0; 63/63 static pages generated.
- Public proposal invalid-token smoke: passed without a probing POST.
- Meeting Capture and extension-auth focused tests: passing; do not redesign the
  verified capture path without new failure evidence.

## Required before release

1. Obtain authorized, read-only access to the correct hosted Supabase project and
   verify migrations, tables, columns, enums, grants, and RLS policies.
2. Resolve or formally disposition all Gitleaks and Trivy findings; do not suppress
   findings merely to make the gate green.
3. Complete and evidence the provider matrix for every live dashboard surface.
4. Complete secure-proposal browser E2E and authenticated preview QA.
5. Classify the dirty worktree and produce a clean, exact-SHA release candidate.
6. Only after those gates pass, perform the separately authorized commit, push,
   preview/production deployment, and exact-SHA production smoke.

## Prohibitions during recovery

Do not reset, stash, clean, discard WIP, apply migrations, run `supabase db push`,
commit, push, deploy, or print environment secret values. Preserve the intentional
Meeting Capture and extension-auth WIP.
