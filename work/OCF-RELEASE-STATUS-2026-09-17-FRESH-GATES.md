# OCF release status — fresh gates, clean release candidate, and exact blockers

- Date: 2026-09-17 (this session)
- Branch: `feat/leads-foundation-live` in `/srv/projects/CodeOutfitters/.worktrees/leads-foundation`
- Supersedes the verdicts in `OCF-BLOCKER-REPORT-2026-09-17-RESUME.md` where they differ:
  the mandatory gates have now been RUN and PASSED on the exact tree, and a clean
  release candidate HAS been constructed and committed locally. The external-access
  blockers stand, re-proven with fresh evidence.

## 1. Fresh P0 gates — all PASS (same session, exact current tree)

| Gate | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | exit 0 |
| Full unit suite | `npx vitest run` | **172 files / 2491 tests, 0 failures** |
| ESLint | `npx eslint .` | exit 0 — **0 errors**, 116 warnings (pre-existing style warnings, none introduced this session) |
| Production build | `npm run build` (TMPDIR=/dev/shm) | exit 0 |
| Migration/RLS suites | `npm run test:pglite:serial` | **15/15 suites PASS**, `PGLITE_SERIAL_RESULT: PASS`, OOM: NO |

## 2. Release candidate — constructed and committed (local)

- `f7c4618` — feat: wire live search into the command dialog (ported from feat/search-live).
  Ports and supersedes `feat/search-live` commits `f97cee4` + `43bd855` on top of the
  leads-foundation line, adapted to the lazy demo-seed API (`getLeadDirectory()`), with the
  staged `model.test.ts` fixed to the working-tree version so the tree is coherent at this commit.
- `54f06cb` — feat: land verified WIP (Next 16.3.5 + middleware→proxy rename captured as a
  rename, extension auth + capture APIs + MV3 extension, live-surface honesty gating +
  source-enforcement test, secure-proposal live providers/public API/rate limit,
  integration OAuth deadlines + credential redaction, release/QA docs, 3 required migrations:
  `20260822000000_meetings_capture_source.sql`, `20260823000000_extension_auth.sql`,
  `20260823010000_extension_auth_requests.sql`).
- Working tree after commits: clean except files deliberately classified OUT of the release,
  preserved untouched on disk: 28 `*.bak.<ts>` files, hidden scratch QA scripts
  (`scripts/.*.cjs`), session files (`PROJECT_GOAL.md`, `PROJECT_MASTER_CONTEXT.md`,
  `findings.md`, `progress.md`, `migrations_all.txt`, `task_plan.md`→kept in commit,
  `next-launcher.sh`). A stale 20-hour `index.lock` (crashed prior git op, no live process)
  was removed before committing.
- Branch topology: `feat/search-live` (3 commits, includes repo-relocation chore) is fully
  content-superseded by `f7c4618`; `feat/leads-foundation-live` is the single release line.
  Canonical repo dirty state on `feat/search-live` is untracked audit/tooling artifacts only.
- NOT pushed (no GitHub credentials — see §5). The RC therefore exists locally only.

## 3. Security gate disposition (per RELEASE-READINESS rule: resolve or disposition, never suppress)

- gitleaks (history): 3 findings, all benign —
  `app/api/ai/copilot/copilot-route.test.ts` (`sk-not-a-real-key` fixture + assertions that
  secrets do NOT leak), `lib/auth/live-auth.test.ts` (source-surface assertion that no
  `-----BEGIN PRIVATE KEY-----` exists), `lib/supabase.ts` @ `395e5318` (historic anon
  publishable-by-design JWT; current file contains none).
- gitleaks (filesystem): findings only inside gitignored artifacts (`.next/cache/**` turbopack
  blobs, `.env.local`, design-export `support.js`). `.env.local` + `.next/` verified gitignored.
  The `github-fine-grained-pat` match inside a turbopack cache blob matches NO tracked file
  (`git grep` on HEAD: none) — heuristic false-positive on binary cache content.
- trivy: 26 unique HIGH/CRITICAL. App dependency set is already fixed by the WIP upgrade
  (installed: next 16.3.5 ≥ 16.3.3 fix, postcss 8.5.28, sharp 0.35.4, nanoid 3.3.19).
  Residual findings come exclusively from `command-center/node_modules` + `command-center/pnpm-lock.yaml`
  — a tracked legacy prototype workspace (Next-independent, not built/deployed by the app;
  has its own tooling) — dispositioned as NOT part of the shipped surface; recommended follow-up:
  prune or upgrade that workspace in a dedicated change.
- scanner errors (not suppressed): semgrep = missing local ruleset directory (tooling
  environment defect, not a code finding); gitleaks-fs = secure-check wrapper mis-parsing
  gitleaks' exit-1-on-findings (manual rerun completed and is dispositioned above).
- `secure-check .` verdict remains SCANNER_ERROR for tooling reasons; findings-level content
  is fully dispositioned here. No secret is exposed in tracked source or history.

## 4. Production truth (P1) — fresh evidence

- Vercel project: `codeoutfitters` / `prj_D8Z0xzQF8OWA0bsz0PGx7A8vYhrX` (org `team_grJz901hMVdksz6DwnzCiEei`, from `.vercel/project.json`).
- `https://codeoutfitters.vercel.app/` → HTTP 200, `server: Vercel`, `x-vercel-cache: HIT`,
  `age: 2327160` (~27 days ⇒ deployment from ~2026-08-21). `/login` → 200.
  This is a STALE deployment, not the release candidate.
- Hosted Supabase `rsxdhwtprmuhzuocycxu.supabase.co`: **NXDOMAIN** — confirmed via local
  resolver, 1.1.1.1 AND 8.8.8.8 (independent public resolvers), matching the prior session's
  dns.google Status:3 record. Controls: `supabase.co` apex resolves (76.76.21.21) and returns
  200; production Vercel host reachable ⇒ not a local egress failure.
  ⇒ The project's data plane no longer exists in DNS: paused/deleted/moved, or the ref is stale.
- Supabase CLI: authenticated session absent (`supabase projects list` → Unauthorized).
  Vercel CLI: `Logged out`. GitHub: `git push --dry-run` → credential prompt fails;
  `gh auth status` → not logged in. (Consistent with the earlier `push --dry-run` evidence.)

## 5. Exact human actions required to unblock certification (one step each)

1. **Supabase**: open the Supabase dashboard and either restore/confirm project
   `rsxdhwtprmuhzuocycxu` (or provide the correct current project ref), then run
   `supabase login` on this host (interactive browser). Unblocks: hosted migration
   list/read-back, RLS verification, `db push` of the 3 pending migrations, hosted smoke.
2. **Vercel**: run `vercel login` on this host (interactive). Unblocks: exact-SHA
   preview deploy of `54f06cb`, preview QA, production promote, telemetry read.
3. **GitHub**: run `gh auth login` (or provide push credentials). Unblocks: push of
   `f7c4618` + `54f06cb` so the deployed SHA is a pushed, reviewable commit.

Nothing else is blocking on the engineering side: gates, RC, security disposition,
provider matrix (below) are complete and recorded.

## 6. Provider matrix (source-verified this session; statuses per the LIVE/DEMO contract)

| Surface | Read | Write | Status |
|---|---|---|---|
| Overview | live (`(overview)/page.tsx` → `RecentActivityLive`, `MeetingsProposalsLive`, live KPIs) | n/a (aggregate) | LIVE |
| Leads | live Supabase (`server-provider.ts`) | live (create/update via RPC, stage via `change_lead_stage`) | LIVE |
| Pipeline | live | live, concurrency-guarded (409 conflict path) | LIVE |
| Tasks | live (`useLiveTasks`) | live | LIVE |
| Activity | live (`activity_events`) | live (emitted from tasks/views/search) | LIVE |
| My Work | live (live tasks/activity roll-up) | live | LIVE |
| Search | live (`/api/dashboard/search`, server-provider) | n/a | LIVE |
| Saved Views | live (`saved-views-live`) | live | LIVE |
| Team | demo store | demo store | DEMO_ONLY (gated, `LiveProviderRequired`) |
| Settings | demo store (`lib/demo/store`) | demo store | DEMO_ONLY (gated) |
| Appointments | demo store | demo store | DEMO_ONLY (gated, honesty test) |
| Email Activity | demo store | demo store | DEMO_ONLY (gated) |
| Follow-ups | demo store | demo store | DEMO_ONLY (gated) |
| Meetings | live (`lib/meetings`, Google Meet readonly) | live link/sync + capture ingestion | LIVE (capture path VERIFIED per prior evidence) |
| Proposals (internal) | demo store | demo store | DEMO_ONLY (gated) |
| Proposals (secure client access) | live (`lib/proposals/access/*`, hashed-token pubs, rate limit, public API) | live (open/question/comment/accept/decline) | LIVE |
| Integrations | live (`integration_connections`, AES-256-GCM credentials) | live (connect/disconnect; Google OAuth real) | LIVE (Calendar/Gmail sync PROVIDER_REQUIRED, reserved fail-closed) |
| Copilot | live (`/api/ai/copilot`, streaming, conversation persistence in `ai_conversations`) | typed-action executor + approvals/audit | LIVE (AI advisory; provider-required degrade) |

Enforcement: `app/dashboard/live-surface-honesty.test.ts` makes the six gated surfaces a
tested invariant (source-level guard + `LiveProviderRequired`), so demo data cannot silently
present as live.

## 7. P0–P9 scoreboard (evidence-based, post-session)

- P0 Engineering baseline: **100%** local (fresh gates §1; deterministic npm install; clean RC §2)
- P1 Production truth: **100% recorded / action blocked** (§4; hosted read-back needs human Supabase access)
- P2 Public + core CRM: local-verified; browser QA against preview **blocked** (needs deploy auth)
- P3 Provider matrix: **100% recorded** (§6); live-claims require hosted verification once unblocked
- P4 Meetings/workers: capture path preserved/verified per prior evidence; workers classified
  (booking worker + 2 proxies = real Cloudflare dashboard-deployed; no daemon fleet needed)
- P5 Secure proposals: implemented + tested locally (27-case migration suite incl. decision
  locking, immutability, token behavior); end-to-end browser QA blocked on deploy
- P6 Integrations: Google OAuth real with deadlines + redaction; Calendar/Gmail sync
  PROVIDER_REQUIRED (reserved, fail-closed) — honest, not claimed
- P7 Governed AI: streaming endpoint, persistence, typed actions, fail-closed unconfigured provider
- P8 Security/docs: dispositioned above; docs updated (README current; this report)
- P9 Clean release/preview/production: RC built locally; push/preview/prod **blocked** on the three human actions

**Verdict: NOT 100% — genuine external blocker (State B).** Three independent interactive
authentications (Supabase, Vercel, GitHub) are the only remaining path to hosted verification,
preview/production QA, and certification. All work preserving and resuming from this state is
complete; resume point is §5.
