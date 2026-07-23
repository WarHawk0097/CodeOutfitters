# Work Order E — Local Docker Supabase Runbook

Authoritative local infrastructure for the inquiry attachment platform. Postgres,
Storage, Auth, and migrations run in the local Supabase Docker stack; ClamAV runs
in a sibling compose file. **Nothing here touches production Supabase.**

## Prerequisites

- Docker Desktop running
- Supabase CLI ≥ 2.109 (`supabase --version`)
- Node ≥ 20, project deps installed (`npm ci`)

## 1. Start the stack

```powershell
npm run supabase:start        # supabase start — Postgres/Storage/Auth/Studio/Mailpit
docker compose -f docker/local-security.compose.yml up -d   # ClamAV on 127.0.0.1:3310
```

Local ports (see `supabase/config.toml`, shifted to a private block so they never
collide with other local projects):

| Service | URL |
|---------|-----|
| API     | http://127.0.0.1:54521 |
| DB      | postgresql://postgres:postgres@127.0.0.1:54522/postgres |
| Studio  | http://127.0.0.1:54523 |
| Mailpit | http://127.0.0.1:54524 |
| ClamAV  | 127.0.0.1:3310 |

## 2. Apply migrations

`supabase start` applies everything in `supabase/migrations/` on a clean volume.
To re-apply from scratch:

```powershell
npm run supabase:reset        # supabase db reset — drops, recreates, re-migrates, re-seeds
```

Migration order (leading digits are the CLI version key — duplicates collide with
`schema_migrations_pkey` 23505, so each is unique):

- `20260615_booking_base_schema.sql` — promotes `bookings` + `available_slots`
- `20260617_booking_b_reserve_slot.sql`, `20260618_security3_rls.sql`
- (existing inquiry + attachment foundation migrations)
- `20260725_inquiry_storage_bucket.sql` — private `inquiry-attachments` bucket + 4 service_role-only Storage policies
- `20260726_inquiry_attachments_service_grants.sql` — service_role DML grants (WO-C had revoked them)

## 3. Environment

The app and tests read env NAMES only — values come from `supabase status`. Never
commit populated values. See `WORK-ORDER-E-LOCAL-SUPABASE-ENV-CONTRACT.md` for the
exact owner command that writes `.env.local` from `supabase status -o json`.

Required names: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SECRET_KEY`, `INQUIRY_STORAGE_MODE=supabase`,
`INQUIRY_STORAGE_BUCKET=inquiry-attachments`, `INQUIRY_FILE_SCANNER_MODE=clamav`,
`INQUIRY_CLAMAV_HOST=127.0.0.1`, `INQUIRY_CLAMAV_PORT=3310`.

## 4. Tests

```powershell
npm test                 # 91 unit tests (PGlite atomic + route + validation). No stack needed.
npm run test:integration # 8 integration tests against the REAL stack + ClamAV. Fails loud if env absent.
```

The integration config (`vitest.integration.config.ts`) refuses any non-local
Supabase URL and never falls back to a mock.

## 5. Orphan cleanup

`cleanupInquiryOrphans()` (`lib/inquiry/server/storage/inquiry-orphan-cleanup.ts`)
reclaims storage objects + rows that never became part of a submitted Lead:
expired authorizations, and failed / completed-but-unsubmitted uploads older than
`INQUIRY_ORPHAN_RETENTION_HOURS` (default 24). It never touches an associated
attachment (`submission_id` or `token_consumed_at` set) and is idempotent. Run it
on a schedule the owner controls; this repo installs no cron.

## 6. Stop

```powershell
docker compose -f docker/local-security.compose.yml down
npm run supabase:stop
```

Never run `docker system/volume/network/container prune`, `git clean`, or
`git reset --hard` in this workspace.

## 7. Browser QA against this stack

`node scripts/start-local-inquiry-platform.mjs` reads this stack's endpoints and
dev keys from `supabase status -o env` in memory and launches Next on :3005;
`node scripts/edge-qa.mjs` then drives the upload workflows through Microsoft
Edge (35/35 pass). The launcher never writes `.env.local`, never prints full
secrets, and refuses any non-`127.0.0.1` Supabase URL. Back-end assertions read
through `docker exec supabase_db_CodeOutfitters psql` because `service_role` has
least-privilege grants. See `WORK-ORDER-E-BROWSER-QA.md`.
