# DEPENDENCY PLAN
Status: PLANNING ONLY. No dependency has been installed. No lockfile has been created or modified. This document records what will be added, at which phase, once each phase is separately authorized — it is not an installation log.

## Workspace tooling (Phase 1, not yet authorized)
- pnpm workspace (`pnpm-workspace.yaml`), root `package.json` for `command-center/`.
- Shared TypeScript/lint/build config in `packages/config`.

## apps/web (Next.js Command Center frontend)
- next, react, react-dom (versions to match or intentionally diverge from root app — decided at Phase 1, since this is a fully separate workspace per ADR-COMMAND-CENTER-LOCATION.md, not required to match root versions).
- tailwindcss, shadcn/radix primitives.
- @tanstack/react-table (LEADS_DATA_TABLE).
- dnd-kit/core, dnd-kit/sortable + keyboard sensor (PIPELINE_BOARD — Row 6 override, native build).
- react-aria (DATETIME_PICKER, EVENT_CALENDAR).
- date-fns.
- react-hook-form (+ Zod resolver, matching shared contracts).
- cmdk or equivalent (COMMAND_PALETTE) — confirm need at Phase 1 dependency audit before adding.
- msw (dev-only, Phase 2 mock layer).

## apps/api (NestJS + Fastify backend)
- @nestjs/core, @nestjs/platform-fastify.
- Zod-compatible validation (nestjs-zod or equivalent) matching packages/contracts.
- BullMQ (queue producer side) — added when asynchronous phases begin, not before.

## apps/worker (background worker)
- BullMQ (consumer side), ioredis or equivalent Redis client.
- Same provider-adapter package as apps/api, so job handlers call the same adapter interfaces.

## packages/database
- drizzle-orm, drizzle-kit.
- postgres driver (node-postgres or equivalent) — vendor-neutral, no vendor-specific SDK.

## packages/contracts
- zod (shared schema source of truth for both frontend and backend validation).

## packages/provider-adapters
- No provider SDKs installed until a specific provider's real-wiring phase (PHASE 15) is separately authorized per vendor. Mock implementations depend only on internal fixtures, no external SDK.

## Infrastructure (local dev only)
- Docker Compose services: PostgreSQL 16+, Redis (for BullMQ) — not started until the database/queue phases are approved; compose file may be authored in Phase 1 scaffolding but containers are not run as part of Phase 0 or by this task.

## Explicit non-additions during Phase 0 and this task
- No provider SDKs (Resend/Postmark, calendar SDK, transcription SDK, AI SDK, e-signature SDK) — all DEFERRED_PENDING_SELECTION per DECISION 3.
- No production DB driver/vendor-specific package — production vendor DEFERRED per DECISION 2.
- No analytics SDK — TBD, PHASE 16 of the phased plan.
- No PDF rendering library selected yet — evaluated at PHASE 10, not chosen here.

## Version-pinning and lockfile policy (once Phase 1 is authorized)
- `command-center/` gets its own lockfile (pnpm-lock.yaml), fully independent of root `package-lock.json`.
- No dependency is added to the root app's `package.json`/`package-lock.json` to support Command Center, per PUBLIC-FRONTEND-PROTECTION-MAP.md.
