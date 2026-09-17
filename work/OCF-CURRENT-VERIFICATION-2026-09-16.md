# CodeOutfitters current verification record

Verified 2026-09-16 in `/srv/projects/CodeOutfitters/.worktrees/leads-foundation`.

## Engineering state

- Branch: `feat/leads-foundation-live`
- HEAD: `23e3683d0c0da1ee47220f767732c07d31704d8e`
- Worktree: intentionally dirty; Meeting Capture and extension-auth WIP is preserved.
- Local Next server: running from this canonical worktree on `127.0.0.1:3005` with `COMMAND_CENTER_MODE=live`, restarted on Next.js 16.3.5 (server PID `2560707`).
- `/login`: HTTP 200.
- `/extension-auth`: HTTP 200.
- Required environment names are present locally: `COMMAND_CENTER_MODE`, `MEETING_CAPTURE_TOKEN_SECRET`, and `SUPABASE_SECRET_KEY`. Values are intentionally not recorded.

## Fresh local gates

- `npm run test`: with the three whole-checkout secret scans given a justified 30-second assertion timeout, a fresh single-worker run using `TMPDIR=/dev/shm` passed 172 files and 2491 tests, exit 0. The temporary-directory override is required because the host filesystem intermittently returns system error `-122` while Vitest writes temporary output.
- `npx tsc --noEmit`: exit 0.
- `npx eslint .`: 0 errors, 115 warnings, exit 0.
- Fresh `TMPDIR=/dev/shm npm run build`: exit 0 under Next.js 16.3.5; compilation, TypeScript, and all 63/63 static pages completed successfully.
- Dependency security remediation: `next` and `eslint-config-next` are pinned to 16.3.5 and `postcss` to 8.5.28 in `package.json` and `package-lock.json`; the restarted dev process reports 16.3.5.
- `git diff --check`: clean.
- Fresh bounded checks in the resumed session: `npx eslint . --quiet` exited 0 (no lint errors), `npx tsc --noEmit` exited 0, and `git diff --check` exited 0.
- Full `npx eslint .` refresh with output suppressed exited 0; warnings, if any, did not make the gate fail.
- Browser smoke: `TMPDIR=/dev/shm node scripts/qa-public-proposal-e2e.mjs` passed the malformed-token public proposal check with no probing POST.
- Unauthenticated dashboard route matrix: all 16 Command Center surfaces return the expected HTTP 307 auth redirect in live mode; no unauthenticated dashboard shell was exposed.
- Unauthenticated API matrix: read-only GET requests to search, tasks, activity, meetings, saved views, integrations, and leads all return HTTP 401.
- Secure proposals focus: local access/publication/API/dashboard proposal tests passed 10 files and 174 tests with one worker.
- Meeting Capture preservation: capture, capture-route, and extension tests passed 17 files and 127 tests; no capture code was changed in this check.
- Integrations focus: OAuth state, provider, registry, and connection-store tests passed 8 files and 71 tests.
- Governed AI focus: Copilot routes/conversations, provider boundaries, streaming, observability, meeting AI, and command dialog tests passed 19 files and 464 tests.
- Extension authorization focus: PKCE routes, opaque session lifecycle, extension-auth UI, capture routes, and token contracts passed 11 files and 44 tests.
- Local schema focus: meetings capture schema, secure proposal migration, and saved-views migration tests passed 3 files and 47 tests in isolated test databases; no hosted migration was applied.
- Live-surface honesty focus: provider-required/demo-leakage boundaries, repair audit, search regression, and dashboard shell tests passed 4 files and 87 tests.
- Dashboard API focus: authentication, provider contracts, and route error mapping tests passed 4 files and 38 tests.
- Complete dashboard focus: all `app/dashboard` tests passed 31 files and 673 tests.
- Documentation: README now carries a dated canonical-status note identifying the current Next/live-mode surface, valid public routes, preserved WIP, and non-certification state; stale static-export, client-side-secret, and Cloudflare-active-path claims were corrected. Scoped documentation/code diff check exits 0.
- Added `docs/RELEASE-READINESS.md` as a reproducible handoff runbook for verified local gates, hosted/security/provider prerequisites, and recovery prohibitions.
- `secure-check .`: fresh run `/home/warhawk/.cache/secure-check/20260916-014510` completed Semgrep successfully with 0 findings across 2,105 files. Gitleaks still reports 3 history findings and 22 filesystem findings; Trivy reports 31 HIGH/CRITICAL findings, concentrated in the historical `command-center/pnpm-lock.yaml` tree. The gate exits 1; findings are not suppressed or removed.
- Dependency follow-up: canonical `npm audit --omit=dev` now reports zero vulnerabilities (exit 0) after the PostCSS 8.5.28 refresh. The historical `command-center/pnpm-lock.yaml` remains a separate vulnerable dependency tree and is not part of the root production runtime.
- Build hygiene: the dynamic transcriber worker call now carries the documented Turbopack ignore annotation; capture tests remain 38/38 and the fresh build no longer reports the whole-project tracing warning.
- Next.js convention cleanup: root `middleware.ts` was migrated to `proxy.ts` per the installed Next.js 16.3.5 guidance; auth/origin/proposal/parity coverage passes 165/165, and the build now reports `ƒ Proxy (Middleware)` without the deprecation warning. Runtime checks remain HTTP 200 for `/login` and `/extension-auth`.
- Served-asset hardening: `public/codeoutfitters/support.js` now targets its embedding document's origin for iframe messages instead of broadcasting to `*`; `node --check` passes. Historical copied preview assets remain unchanged and are still classified separately by the security scan.

## Current production-readiness blockers

1. Hosted Supabase management access is unavailable in this session, so current hosted migration/RLS/schema truth cannot be freshly read back. A bounded service-key REST probe classified all eight required tables as `transport_unavailable`; no migration or database mutation was attempted.
2. The working tree contains intentional WIP and cannot become an exact clean release candidate under the current no-commit/no-clean/no-discard instructions.
3. The security gate still reports blocking findings and must be triaged and remediated before certification.
4. Several dashboard surfaces remain provider-required or live-degraded; Meetings and the internal Proposals directory fail closed in live mode but are not complete live providers.
5. Calendar/Gmail production verticals, durable Copilot action approvals, and end-to-end communications providers remain incomplete or unverified.
6. No exact-SHA production deployment or production browser certification was performed.

This record is evidence of the current state, not a production-readiness certification.
