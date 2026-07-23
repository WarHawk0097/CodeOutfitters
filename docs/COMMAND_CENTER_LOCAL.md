# Command Center — local development

The Command Center is the authenticated owner dashboard at `/dashboard`. It reads
the real inquiry tables (Work Order E) filtered by workspace membership. This doc
covers running it against the **local Docker Supabase stack only**. No production
credentials, users, or data are involved.

## 1. Start the local stack

```
node scripts/start-local-inquiry-platform.mjs
```

Endpoints (local): Supabase API `127.0.0.1:54521`, DB `127.0.0.1:54522`,
ClamAV `127.0.0.1:3310`.

Apply migrations (includes `20260727_command_center_workspaces.sql`):

```
npx supabase db reset   # or db push, per your local workflow
```

## 2. Export local env

Grab the local keys:

```
npx supabase status -o env
```

Set (PowerShell example; values from the command above):

```
$env:NEXT_PUBLIC_SUPABASE_URL   = 'http://127.0.0.1:54521'
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = '<ANON_KEY>'
$env:SUPABASE_SECRET_KEY        = '<SECRET_KEY>'
$env:INQUIRY_STORAGE_MODE       = 'supabase'
$env:INQUIRY_STORAGE_BUCKET     = 'inquiry-attachments'
```

Shell-set vars take precedence over `.env.local`, so this pins the dashboard to
the local stack even if `.env.local` points elsewhere.

## 3. Bootstrap seed data

```
node scripts/bootstrap-command-center.mjs
```

Idempotent and local-only (it refuses any non-localhost URL). It creates two
workspaces, two owner accounts, seed leads, seed attachments (clean / rejected /
unassociated), a real storage object for the clean attachment, and backfills any
workspace-less lead into the primary workspace.

### Local dev accounts (throwaway — NOT production credentials)

| Account | Email | Default password (override via env) | Workspace |
|---------|-------|-------------------------------------|-----------|
| Owner   | `owner@codeoutfitters.local`  | `localdev-owner-pass`  | `primary` |
| Second  | `second@codeoutfitters.local` | `localdev-second-pass` | `isolation` |

Override with `BOOTSTRAP_OWNER_EMAIL` / `BOOTSTRAP_OWNER_PASSWORD` /
`BOOTSTRAP_SECOND_EMAIL` / `BOOTSTRAP_SECOND_PASSWORD` before running the script.
These accounts exist only in the local GoTrue instance. Do not reuse these
credentials anywhere real.

## 4. Run the dashboard

```
npm run dev   # next dev --port 3005 --webpack
```

Sign in at `http://localhost:3005/login` with the owner account. Unauthenticated
requests to `/dashboard/**` redirect to `/login?returnTo=…`.

### Isolation check

Signed in as **owner** (`primary`), you can see the Ada/Grace seed leads but never
the `Foreign Prospect` lead (it lives in `isolation`). The rejected and
unassociated seed attachments never expose a Download button, and hitting the
download endpoint for them returns `404`.
