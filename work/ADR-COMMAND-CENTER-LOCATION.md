# ADR: Where does Command Center implementation live?
Status: ACCEPTED — resolved by user decision, TASK_ID CODEOUTFITTERS_PHASE0_DECISION_CLOSURE0.

## Context
Command Center Final.dc.html defines 22-route internal app (Overview, Leads, Pipeline, Meeting Intelligence, Proposals, etc.) with its own canonical design tokens (IBM Plex Sans/Mono + Geist, #14130E sidebar, #2F7D4F primary, #EDF0F2 canvas — see work/CANONICAL-DC-DIRECT-INSPECTION.md).

F:\CodeOutfitters (see work/REPO-AUDIT.md) is a single Next.js 16 app, npm, no workspace tooling, one Vercel project, hosting the public marketing site (`app/(public)/*`, protected/out of scope) and a thin `app/admin/*` stub (onboarding + proposal, localStorage-only, ~91 lines).

## Decision — APPROVED
**Separate self-contained workspace**, not an extension of `app/admin/`:

```
F:\CodeOutfitters\
├── Dashboard\                     # Read-only canonical design authority
├── command-center\                # New implementation workspace
│   ├── apps\
│   │   ├── web\                   # Next.js Command Center frontend
│   │   ├── api\                   # NestJS/Fastify backend API
│   │   └── worker\                # Asynchronous/background worker
│   ├── packages\
│   │   ├── contracts\
│   │   ├── database\
│   │   ├── ui\
│   │   ├── config\
│   │   └── provider-adapters\
│   ├── infrastructure\
│   │   ├── docker\
│   │   └── local\
│   ├── tests\
│   ├── package.json
│   ├── pnpm-workspace.yaml
│   └── README.md
├── work\                          # Planning, audit, phase reports
└── (existing public frontend files, untouched)
```

Rules binding from this decision:
- `command-center/` has its own package manifest, lockfile, workspace config, tests, build config. Independent pnpm workspace.
- Do not convert the existing public frontend root into a monorepo.
- Do not modify the root public app's package manager or lockfile to support Command Center.
- No implementation files placed inside `F:\CodeOutfitters\Dashboard`. Dashboard stays read-only/authoritative.
- No application may import runtime code directly from Dashboard. Canonical content (`.dc.html`, Markdown, JSON) is translated into implementation code at build/dev time by humans/agents reading it — never loaded or parsed by the running application.

## Why this supersedes the prior "extend app/admin/" recommendation
The original recommendation (A: extend app/admin/) favored reuse of the existing Cloudflare Access boundary and single-Vercel-project simplicity. The user's approved decision trades that simplicity for isolation: Command Center becomes a genuinely separate multi-service system (web + api + worker, own Postgres, own queue) that does not fit inside a single Next.js app's request-handler model per DECISION 2 (NestJS/Fastify/worker separation). Extending `app/admin/` was only viable for a Next.js-only frontend-plus-mocks build; it is not viable once a real NestJS API and background worker are in scope. This is not a reversal of judgment — it is the natural consequence of DECISION 2 being resolved toward a multi-service backend.

## Existing app/admin/ stub disposition
See work/LEGACY-STUB-DISPOSITION.md. Stubs are preserved untouched, classified LEGACY_NON_AUTHORITATIVE_STUBS, not reused without a written reuse audit.

## Not resolved here
Production deployment topology for the three new services (web/api/worker) — separate Vercel project(s) vs other host, whether they share a domain/subdomain structure with the public site — is not decided by this ADR and is deferred to a later phase, since DECISION 2 explicitly defers production DB vendor and this workspace has not yet been scaffolded (Phase 1 remains NOT_AUTHORIZED).
