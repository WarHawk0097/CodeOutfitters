# CodeOutfitters Meeting Copilot P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace bridge authentication with a dedicated extension session and deliver restart-safe Google Meet caption capture with a persistent widget and server transcript persistence.

**Architecture:** A PKCE-bound browser authorization flow creates an opaque scoped extension session. A background capture coordinator writes normalized Meet events to IndexedDB before syncing ordered idempotent batches; content.js renders the persistent widget and provider-specific DOM observation.

**Tech Stack:** Next.js route handlers, TypeScript/Zod, Supabase server data access, Manifest V3 service worker, vanilla extension JavaScript, IndexedDB, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-23-codeoutfitters-meeting-copilot-p0-design.md`

## Global Constraints

- Work only in the canonical CodeOutfitters worktree.
- Preserve all existing WIP; do not reset, stash, clean, commit, push, deploy, or modify unrelated repositories.
- Do not use dashboard DOM injection or cookie scraping for extension authentication.
- Do not store Supabase credentials, service secrets, Authorization headers, or refresh tokens in the extension.
- Do not show `CAPTURING` before a caption event is durably retained.
- Do not implement P1–P5 features before P0 automated acceptance is green.

### Task 1: Define shared P0 contracts and auth threat boundary

**Files:**
- Create: `lib/meetings/capture/contracts.ts`
- Create: `extensions/codeoutfitters-capture/contracts.js`
- Test: `lib/meetings/capture/contracts.test.ts`
- Test: `extensions/codeoutfitters-capture/contracts.test.js`

- [ ] Define provider IDs, acquisition strategies, normalized caption events, extension session payload, capture state, and sync batch types.
- [ ] Test exact field names and reject credentials, headers, and forged workspace/user fields.
- [ ] Run the focused contract tests.

### Task 2: Implement server-side extension authorization

**Files:**
- Create: `lib/extension-auth/server.ts`
- Create: `app/api/extension/auth/authorize/route.ts`
- Create: `app/api/extension/auth/token/route.ts`
- Create: `app/api/extension/auth/revoke/route.ts`
- Test: `lib/extension-auth/server.test.ts`
- Test: `app/api/extension/auth/extension-auth.test.ts`

- [ ] Add state and PKCE challenge validation, redirect allowlisting, one-time code expiry, opaque session issuance, rotation, revocation, and server-derived workspace/user context.
- [ ] Return only safe auth responses and never expose Supabase session material.
- [ ] Test replay, wrong verifier, wrong redirect, expiry, revocation, workspace isolation, and safe response shape.

### Task 3: Replace extension bridge auth with extension session client

**Files:**
- Modify: `extensions/codeoutfitters-capture/manifest.json`
- Modify: `extensions/codeoutfitters-capture/config.js`
- Modify: `extensions/codeoutfitters-capture/popup.html`
- Modify: `extensions/codeoutfitters-capture/popup.js`
- Modify: `extensions/codeoutfitters-capture/background.js`
- Create: `extensions/codeoutfitters-capture/auth.js`
- Test: `extensions/codeoutfitters-capture/auth.test.js`
- Test: `extensions/codeoutfitters-capture/popup.test.js`

- [ ] Add the minimum identity/API permissions and explicit auth UI.
- [ ] Implement state/verifier generation, `launchWebAuthFlow`, local fallback, code exchange, opaque session storage, expiry handling, logout/revoke, and popup-close persistence.
- [ ] Remove bridge/token acquisition from the normal start path while preserving legacy tests until replacement coverage is complete.
- [ ] Test that start works without dashboard tabs, no cookie/refresh/service credential is handled, and logout prevents capture.

### Task 4: Build IndexedDB local transcript queue

**Files:**
- Create: `extensions/codeoutfitters-capture/local-store.js`
- Test: `extensions/codeoutfitters-capture/local-store.test.js`

- [ ] Implement versioned IndexedDB stores for sessions, ordered caption entries, sync batches, and settings with bounded entry count/bytes and TTL cleanup.
- [ ] Provide deterministic session IDs, atomic enqueue/ack operations, recovery listing, and safe migration behavior.
- [ ] Test popup closure equivalence, worker restart reload, ordering, deduplication, bounded retention, and cleanup only after confirmed synchronization.

### Task 5: Normalize Google Meet provider events

**Files:**
- Modify: `extensions/codeoutfitters-capture/providers.js`
- Modify: `extensions/codeoutfitters-capture/content.js`
- Modify: `lib/meetings/capture/assembler.ts`
- Test: `extensions/codeoutfitters-capture/providers.test.js`
- Test: `extensions/codeoutfitters-capture/content.test.js`
- Test: `lib/meetings/capture/assembler.test.ts`

- [ ] Emit `providerMeetingId`, not the stale `meetingId` field, with provider, speaker, text, observedAt, isFinal, and source.
- [ ] Keep provider DOM discovery in the Meet adapter and shared partial/final correction/deduplication in the assembler.
- [ ] Test speaker changes, partial replacement, finalization, duplicate suppression, sequence assignment, and browser-caption-only behavior.

### Task 6: Refactor background lifecycle and idempotent sync

**Files:**
- Modify: `extensions/codeoutfitters-capture/background.js`
- Modify: `app/api/dashboard/meetings/capture/entries/route.ts`
- Modify: `app/api/dashboard/meetings/capture/stop/route.ts`
- Modify: `lib/meetings/capture/server.ts`
- Test: `extensions/codeoutfitters-capture/background.test.js`
- Test: `app/api/dashboard/meetings/capture/entries/route.test.ts`
- Test: `lib/meetings/capture/server.test.ts`

- [ ] Make the worker coordinator local-first: enqueue before acknowledgement, then sync ordered batches with bounded retry/backoff.
- [ ] Restore sessions and unsynced entries on worker startup; reject duplicate Start for the same active meeting.
- [ ] Make entry ingestion idempotent by session/event/sequence identity and make Stop flush and transition once.
- [ ] Ensure browser_captions never opens the browser_audio path.
- [ ] Test outage recovery, retry order, duplicate batches, duplicate starts, stop flush, and worker restart.

### Task 7: Make the Meet widget persistent and honest

**Files:**
- Modify: `extensions/codeoutfitters-capture/content.js`
- Modify: `extensions/codeoutfitters-capture/background.js`
- Test: `extensions/codeoutfitters-capture/content.test.js`
- Test: `extensions/codeoutfitters-capture/background.test.js`

- [ ] Render original LIVE/NOTES/AI/INSIGHTS shell with LIVE controls, state, sync status, count, timestamps, speaker labels, collapse/reopen, and manual-scroll preservation.
- [ ] Persist widget state independently from popup visibility and rehydrate it from worker/local-store state.
- [ ] Keep AI/notes/insights visibly unavailable or minimal until their P0-safe data contracts exist; never fabricate results.
- [ ] Test no false Capturing state, close/reopen continuity, start/pause/resume/stop, and transcript rendering.

### Task 8: Verify post-meeting transcript persistence and P0 gates

**Files:**
- Modify: `app/dashboard/meetings/[meetingId]/page.tsx`
- Test: `app/dashboard/meetings/[meetingId]/page.test.tsx` or existing route/page test location
- Modify: `extensions/codeoutfitters-capture/README.md`

- [ ] Verify the post-meeting page renders the server-confirmed transcript and sync state without relying on the popup.
- [ ] Document extension auth setup and the one human P0 acceptance flow.
- [ ] Run targeted P0 tests, full Vitest, `npx tsc --noEmit`, changed-file ESLint, Next build, and `secure-check .`; record exact outcomes and pre-existing findings.
- [ ] Stop before P1–P5 and report Git as uncommitted, unpushed, and undeployed.
