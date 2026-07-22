# PHASE 0 DECISION CLOSURE
TASK_ID: CODEOUTFITTERS_PHASE0_DECISION_CLOSURE0

## 1. Implementation workspace path
`F:\CodeOutfitters\command-center` — new, isolated pnpm workspace: `apps/web`, `apps/api`, `apps/worker`, `packages/{contracts,database,ui,config,provider-adapters}`, `infrastructure/{docker,local}`, `tests/`, own `package.json`/`pnpm-workspace.yaml`/`README.md`. Not created yet (Phase 1 not authorized). Full detail: work/ADR-COMMAND-CENTER-LOCATION.md.

## 2. Protected public frontend boundary
`F:\CodeOutfitters` root Next.js app (public marketing site, `app/(public)/*`) stays untouched. Not converted to a monorepo. Its package manager/lockfile not modified to support Command Center. Baseline commit `e9ebbeed34e03be0e219f6579ea137eefe8f4f26`, unchanged.

## 3. Canonical Dashboard read-only rule
`F:\CodeOutfitters\Dashboard` remains read-only and authoritative. No implementation files placed inside it. No application imports runtime code from it at runtime. Canonical content is translated to implementation code by humans/agents reading it, never loaded/parsed live. SHA-256 of `Command Center Final.dc.html` verified unchanged: `758c8ae303cb89747e9835b658dc5ce05132fd3c30a072416961e6d0bcf9f522`.

## 4. Backend/API/worker separation
Three deployable services: Command Center web app (Next.js), backend API (NestJS + Fastify), background worker (separate TypeScript app). Long-running transcription, AI analysis, email delivery, PDF generation, retry processing never run inside Next.js request handlers.

## 5. PostgreSQL/Drizzle decision
Primary database: PostgreSQL 16+. Access via Drizzle ORM, SQL-visible migrations, owned by `packages/database`. Vendor-neutral — schema/migrations portable across standard Postgres providers. Production DB vendor: DEFERRED (no Supabase/Neon/Railway/RDS/other chosen in Phase 0). Development target: local Postgres via isolated Docker Compose; no container or schema created until the database phase is separately approved.

## 6. Provider-deferral decision
No external providers approved or contracted. All 8 provider categories DEFERRED_PENDING_SELECTION: EmailProvider, CalendarProvider, MeetingPlatformProvider, TranscriptionProvider, LanguageModelProvider, ObjectStorageProvider, PdfRenderingProvider, ProposalAcceptanceProvider. No SDKs installed, no accounts created, no API keys entered, no secrets created, no live calls, no connectivity claims.

## 7. Mock-first requirement
Frontend scaffolding, contract creation, mocks, component development, and provider-neutral backend architecture are not blocked by provider deferral. Use deterministic fixtures, contract-backed mocks, local fake adapters, explicit NOT_CONFIGURED / CONFIGURED_UNVERIFIED states, and provider failure simulations until real vendors are selected per-category.

## 8. Legacy-stub disposition
`app/admin`, `app/admin/onboarding`, `app/admin/proposal` and related routes: LEGACY_NON_AUTHORITATIVE_STUBS. Preserved untouched. Not reused without a written reuse audit (see work/LEGACY-STUB-DISPOSITION.md). No deletion authorized now.

## 9. Database safety requirements
- No destructive SQL without explicit human approval.
- No table or column deletion by autonomous subagents.
- Migrations must expose generated SQL for review before applying.
- Every destructive migration requires backup, rollback, and impact plans.
- The primary agent runs approved SQL — not delegated to subagents.
- Production migrations never run automatically from an unreviewed deploy.
- Tenant isolation tested using the real application database role, not a superuser/owner role.
- Integration tests must prove cross-workspace reads and writes are blocked.

## 10. RLS-owner-bypass risk
Table owners and superuser roles bypass standard row-level security in PostgreSQL by default. If the application's database role is ever granted table-ownership or superuser privileges (e.g., via a careless migration-runner configuration), RLS policies silently stop applying, and workspace/tenant isolation silently fails without any error. Mitigation: application runtime role must be a distinct, non-owning role; `FORCE ROW LEVEL SECURITY` used where the approved security design requires RLS to apply even to the table owner; this must be covered by an explicit integration test (cross-workspace read/write blocked) before any tenant-facing table goes live. Recorded as an open risk to re-verify at the database-phase approval gate, not resolved by this document alone.

## 11. Phase 0 status
APPROVED_DECISIONS_RECORDED

## 12. Phase 1 authorization status
NOT_AUTHORIZED — no scaffolding, no workspace creation, no dependency install until a separate, explicit Phase 1 authorization is given.

## 13. Human approval gates preserved
All state-machine-level human approval gates from the original intake remain binding and unaffected by these architecture decisions: STATE_CRM_RECOMMENDATION_REVIEW (batch confirm, per-item rollback), STATE_PROPOSAL_DELIVERY (explicit confirm/send, idempotent), STATE_PROPOSAL_INTERNAL_REVIEW (approver != owner), STATE_MEETING_SESSION (consent before transcription), STATE_AI_INSIGHT_GENERATION (approval before downstream use), STATE_PIPELINE_MOVE (reason required on terminal stages, rollback-with-toast on 409/422). None of DECISION 1-4 relaxes or bypasses any of these.
