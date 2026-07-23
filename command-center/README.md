# Command Center

Internal CodeOutfitters Dashboard/backend system. Separate, isolated pnpm workspace — not part of the public marketing site at the repo root.

Canonical design authority: `../Dashboard` (read-only, never imported at runtime).

## Structure

```
apps/
  web/      Next.js frontend (Command Center UI)
  api/      NestJS + Fastify backend API
  worker/   Background worker (async jobs)
packages/
  contracts/         Shared Zod schemas (frontend/backend contract)
  database/          Drizzle ORM schema + migrations (Postgres)
  ui/                Shared UI primitives for apps/web
  config/            Shared TypeScript/lint config
  provider-adapters/ Mock-first external provider interfaces
infrastructure/
  docker/            Local Postgres/Redis compose (authored, not run in Phase 1)
  local/             Local dev config
tests/                Cross-package integration tests
```

## Status

Phase 1 (Scaffolding and Tooling Setup) — see `../work/PHASE-1-IMPLEMENTATION-REPORT.md`.

No providers are wired. No database is running. All 8 provider categories are `NOT_CONFIGURED` per `../work/PHASE0-DECISION-CLOSURE.md`.

## Commands

```
pnpm install
pnpm dev:web       # Next.js dev server
pnpm dev:api       # NestJS dev server
pnpm dev:worker    # worker boot
pnpm build         # build all apps
pnpm typecheck     # typecheck all workspaces
pnpm lint          # lint all workspaces
pnpm test          # test all workspaces
```
