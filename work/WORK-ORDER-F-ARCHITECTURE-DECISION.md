# Work Order F — Architecture Decision

Base: accepted Work Order E head `91f5769` on
`feature/command-center-data-foundation`.

## Where the dashboard lives

The repository has two Next apps: the **root app** (`app/`, package
`codeoutfitters`, `next build`, port 3005) which is the site linked to the
Vercel project `codeoutfitters` (`.vercel/project.json`), and a separate
`command-center/` monorepo whose web app is **mock-backed** (MSW auth,
`fetchLeads` stub) and has its own `.vercel`. The Work Order E inquiry data
(`leads`, `lead_form_submissions`, `inquiry_attachments`,
`lead_timeline_events`, private `inquiry-attachments` bucket) lives in the root
`supabase/`.

**Decision:** implement the Command Center dashboard in the **root app** under
`app/dashboard/**`. It is the deployable the owner can reach via the existing
Vercel project and it can read the real WO-E tables directly with no
cross-app/cross-database wiring. The command-center monorepo's approved layout
is used as the visual reference; no WO-E control is touched.

## Authentication flow

Cookie-based Supabase SSR via `@supabase/ssr` (the official companion to the
already-installed `@supabase/supabase-js`). Three clients:
- **browser** (`lib/supabase/client.ts`) — anon key, `createBrowserClient`.
- **server** (`lib/supabase/server.ts`) — anon key + request cookies,
  `createServerClient`, used in Server Components / route handlers; auth is
  always validated server-side with `supabase.auth.getUser()` (never trust
  `getSession()` alone).
- **service** — existing WO-E server-only service-role client, unchanged, never
  imported by browser code.

`middleware.ts` refreshes the session cookie and guards `/dashboard/**`:
unauthenticated → redirect to `/login?returnTo=<safe path>`. `returnTo` is
validated to be a local path (`^/[^/]` and not `//`) to prevent open redirects.
`/auth/callback` exchanges the code and redirects to the validated `returnTo`.

## Workspace resolution & membership authorization

`workspaces` + `workspace_memberships` (roles `owner` > `admin` > `member`,
status `active|invited|suspended`, unique `(workspace_id,user_id)`). The
**database** is authoritative — authorization never relies on editable JWT
metadata. Every `leads` row gains `workspace_id`. A member sees only leads whose
workspace they actively belong to.

## RLS enforcement (primary boundary)

RLS enabled on `workspaces`, `workspace_memberships`, `leads`,
`lead_form_submissions`, `inquiry_attachments`. `authenticated` gets `SELECT`
only; RLS filters to workspace membership. `SECURITY DEFINER` helpers
(`is_workspace_member`, `has_min_workspace_role`, `can_view_lead`,
`can_view_attachment`, `can_download_attachment`) with fixed `search_path` and
`EXECUTE` revoked from `PUBLIC` (granted to `authenticated`) break the
membership-policy recursion (definer bypasses RLS). `service_role` keeps its
WO-E least-privilege grants and bypasses RLS server-side. Public inquiry
submission still flows through the existing `submit_inquiry` `SECURITY DEFINER`
function, so enabling RLS does not break it.

## Attachment authorization & secure download

`GET /api/dashboard/attachments/[attachmentId]/download` (authenticated route
handler). Server verifies, in order: valid session → active membership → lead in
the member's workspace → attachment belongs to that lead → `upload_status =
'completed'` → `scan_status = 'clean'` → object exists → then mints a
**short-lived signed URL** (60 s) from the private bucket and 302-redirects to
it. Lookup input is the **attachment UUID**, never a browser-supplied storage
path (no IDOR / path substitution). Signed URLs are generated only after
authorization, are not persisted, and are not logged.

## Local preview environment

Uses the accepted `scripts/start-local-inquiry-platform.mjs` launcher (in-memory
`supabase status -o env`, no `.env.local`, refuses non-127.0.0.1). A repeatable
`scripts/bootstrap-command-center.mjs` seeds one owner + primary workspace +
membership, a second isolation user/workspace, and seed leads/attachment
metadata against the **local** stack only. No production data is touched.

## Compatibility

No change to WO-E upload/scan/association/orphan-cleanup code paths, tables,
constraints, or grants beyond adding `SELECT`-to-`authenticated` and the new
`workspace_id` column with an idempotent local backfill.
