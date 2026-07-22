# DATA AND MIGRATION PLAN
Status: PLANNING ONLY. No database has been created, started, or modified. No migration has been written or run. This document defines how migrations will be governed once the database phase is separately authorized.

## Database target (per PHASE0-DECISION-CLOSURE.md §5)
PostgreSQL 16+, accessed via Drizzle ORM, schema/migrations owned by `command-center/packages/database`. Production vendor DEFERRED — schema must stay portable across standard Postgres providers (no vendor-specific extensions/features without explicit later approval).

## Tenant model
Workspace/organization isolation designed from the start (per DECISION 2). Every tenant-scoped table carries a workspace/organization identifier from its first migration, not retrofitted later.

## Migration governance rules (binding, from DECISION 2 database safety requirements)
1. No destructive SQL without explicit human approval.
2. No table or column deletion by autonomous subagents — a subagent may propose a migration, but the primary agent runs approved SQL.
3. Every migration must expose its generated SQL for human review before it is applied to any environment.
4. Every destructive migration (drop table/column, truncate, irreversible type change) requires a written backup plan, rollback plan, and impact plan before approval.
5. Production migrations never run automatically as part of an unreviewed deploy pipeline.
6. Tenant isolation must be tested using the real application database role — not the migration-runner or table-owner role.
7. Integration tests must prove cross-workspace reads and writes are blocked, using that real application role.

## Row-level security policy
- `FORCE ROW LEVEL SECURITY` used on tenant-scoped tables where the approved security design requires RLS to apply even to the table owner.
- Application runtime role must be a distinct, non-owning, non-superuser role. Table ownership/superuser bypasses RLS silently — this is treated as a standing risk, tracked in RISK-REGISTER.md, re-verified at the database-phase approval gate before any tenant-facing table goes live.
- Application roles must never silently bypass row-level security; any such bypass discovered in testing blocks that migration's approval.

## Local development
Local PostgreSQL runs through an isolated Docker Compose environment inside `command-center/infrastructure/docker`. No container or schema is created until the database phase is separately approved — this plan authorizes writing the compose file at Phase 1, not running it.

## Sequencing
No migrations exist before PHASE 15 of the phased implementation plan (real backend/provider wiring). Phases 1-14 build entirely against Phase 2's mock/fixture layer — no schema is needed until real persistence is authorized.

## Backup and rollback baseline
Once any real database exists, every destructive migration's approval record must include: what is being backed up, how the backup is verified restorable, and the exact rollback SQL or procedure — recorded before the migration runs, not reconstructed after an incident.

## Status at Phase 0 closure
No database created. No migration created. No database modified. This plan is a governance document only, to be applied when the database phase is separately authorized.
