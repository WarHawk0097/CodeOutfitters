# Command Center authentication — environment and provider contract

Covers live authentication for `/login`, `/auth/callback`, `/access-pending` and
`/dashboard`. The public marketing site is unaffected by everything here.

## 1. Authorization model in one paragraph

Authenticated is **not** authorized. A session only proves identity; access is
decided by rows in `public.workspace_memberships` and enforced by RLS in the
database. There is no "first user to sign in becomes owner" path, no
email-domain shortcut, and no browser-controlled role assignment. An
authenticated user with no active membership lands on `/access-pending` and sees
nothing else.

Flow:

```
public site -> /login -> Google | Apple | email+password
            -> provider -> /auth/callback
            -> exchangeCodeForSession -> getUser() (server-side)
            -> workspace membership check
                 member      -> validated same-origin returnTo (default /dashboard)
                 no membership -> /access-pending
                 anything else -> /login?error=auth  (one generic message)
```

Auth states used by the UI and the callback: `loading`, `signed_out`,
`authenticating`, `authenticated_without_membership`, `authenticated_member`,
`access_pending`, `auth_error` (`lib/auth/auth-state.ts`). Raw provider or
Supabase error text is never rendered or logged; every failure collapses to
`GENERIC_AUTH_ERROR`.

## 2. Application environment variables

| Var | Scope | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | live only | Supabase project URL. Listed in `LIVE_REQUIRED_ENV`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | live only | Supabase anon key. Listed in `LIVE_REQUIRED_ENV`. |
| `SUPABASE_SECRET_KEY` | **server only** | live only | Service-role key. Used by the inquiry/storage server path. Never referenced from a client component; must never be given a `NEXT_PUBLIC_` name. |
| `COMMAND_CENTER_MODE` | **server only** | yes in production | `demo` (default) or `live`. Live mode never silently falls back to demo — missing config raises `CommandCenterConfigError`. |
| `NEXT_PUBLIC_SITE_URL` | browser + server | live only | Canonical site origin. Used to build the OAuth `redirectTo`, so a crafted `returnTo` cannot become an open redirect. |
| `AUTH_GOOGLE_ENABLED` | **server only** | live only | `true` \| `1` \| `enabled` turns the real Google button on. Anything else keeps it disabled with an accessible reason. |
| `AUTH_APPLE_ENABLED` | **server only** | live only | Same, for Apple. |

Required production values once the go-live checklist below is green:

```
COMMAND_CENTER_MODE=live
NEXT_PUBLIC_SITE_URL=https://codeoutfitters.vercel.app
```

Google and Apple credentials are **not** application environment variables. They
live in the Supabase Auth dashboard. `AUTH_GOOGLE_ENABLED` / `AUTH_APPLE_ENABLED`
are server-only booleans that declare "this provider has been configured over
there" — they are never `NEXT_PUBLIC_*`, so a browser value cannot enable a
button, and the server action re-checks the same flag before starting OAuth.

## 3. Google provider — external configuration checklist

Performed in the Google Cloud console and the Supabase dashboard. Nothing below
is committed to this repository.

1. Google Cloud project for CodeOutfitters.
2. OAuth consent screen published (app name, support email, logo, scopes
   `email`, `profile`, `openid`).
3. Web application OAuth client.
4. Authorized JavaScript origin: `https://codeoutfitters.vercel.app`
5. Authorized redirect URI: `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
6. Google Client ID entered in Supabase → Authentication → Providers → Google.
7. Google Client Secret entered in the same place.
8. Supabase → Authentication → URL Configuration → Site URL
   `https://codeoutfitters.vercel.app`, redirect allow-list entry
   `https://codeoutfitters.vercel.app/auth/callback`.
9. Set `AUTH_GOOGLE_ENABLED=true` in the target Vercel environment and redeploy.

Do not commit the Client ID or the Client Secret.

## 4. Apple provider — external configuration checklist

1. Active Apple Developer Program membership.
2. App ID with the **Sign in with Apple** capability.
3. Services ID for CodeOutfitters web authentication (this is the Apple
   "client id").
4. Website domain: `codeoutfitters.vercel.app`
5. Return URL: `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
6. Apple Team ID.
7. Apple Key ID for a **Sign in with Apple** key.
8. The `.p8` private key file — downloadable exactly once, stored in the team
   password manager. `.gitignore` refuses `*.p8`; never place one in this repo.
9. Generated Apple OAuth client secret (an ES256 JWT signed with the `.p8`).
10. Apple provider enabled in Supabase with the Services ID + generated secret.
11. Set `AUTH_APPLE_ENABLED=true` in the target Vercel environment and redeploy.

### Apple client-secret rotation

Apple client secrets are JWTs with a maximum lifetime of **6 months**
(`exp` ≤ issue time + 15777000 seconds). They expire silently: Apple sign-in
simply starts failing.

- Rotation window: regenerate no later than **14 days before `exp`**.
- If the secret is first generated on the Apple enablement date `D`, it expires
  at `D + 6 months`; the rotation deadline is `D + 6 months - 14 days`. For an
  enablement on 2026-07-29 that is an expiry of 2027-01-29 and a rotation
  deadline of **2027-01-15**.
- Record the actual issue date and both dates in the team calendar when the
  provider is enabled — a generated secret's `exp` is the only authority.

Procedure:

1. Sign a new ES256 JWT with the same `.p8` key: `iss` = Team ID, `iat` = now,
   `exp` = now + 6 months, `aud` = `https://appleid.apple.com`,
   `sub` = Services ID, header `kid` = Key ID.
2. Paste the new secret into Supabase → Authentication → Providers → Apple.
3. Test a real Apple sign-in against a preview deployment.
4. Only then discard the previous secret value.
5. If the `.p8` key itself is rotated, revoke the old key in the Apple developer
   portal after step 3 succeeds.

### Apple account handling

- Apple may return a private-relay address (`…@privaterelay.appleid.com`).
- The owner bootstrap expects provider `google`, so an Apple sign-in can never
  consume it — neither by relay address nor by display name.
- New authenticated Apple users without a membership go to `/access-pending`.
- Identities are never merged on an unverified email. Linking an Apple identity
  to an existing member account is a future, explicitly-authenticated flow.

## 5. Owner bootstrap

`supabase/migrations/20260729010000_owner_bootstrap.sql` adds:

- `public.profiles` — display identity, written only by SECURITY DEFINER code.
- `public.workspace_owner_bootstrap` — a server-controlled allowlist. RLS on, no
  grants and no policies for `anon` or `authenticated`: invisible to the browser.
  Seeded with one row: workspace `codeoutfitters`, `normalized_email`
  `marc@gmail.com`, `expected_name` `Marc Bryce`, `expected_provider` `google`.
- `public.bootstrap_initial_workspace_owner()` — SECURITY DEFINER, fixed
  `search_path`, `execute` revoked from `public`/`anon` and granted only to
  `authenticated` and `service_role`.

The function enforces all ten preconditions in one transaction: authenticated
user exists; email confirmed; normalized email matches the allowlist; provider
matches; workspace exists; no active owner already exists; allowlist entry
exists; entry not consumed; server-side execution; atomic. It is idempotent for
the same authenticated UUID and raises one generic `owner_bootstrap_denied` for
everyone else. `/auth/callback` calls it only when the user has no membership.

After Marc owns the workspace, additional people require an explicit membership
row; the bootstrap cannot create a second owner.

## 6. Go-live checklist

Do not set `COMMAND_CENTER_MODE=live` in production until every line is true:

- [ ] Production Supabase project exists.
- [ ] Work Order F schema (`20260727_command_center_workspaces.sql`) applied.
- [ ] `20260729010000_owner_bootstrap.sql` applied.
- [ ] RLS verified against the production project.
- [ ] Google provider works end to end.
- [ ] Apple provider works end to end, or `AUTH_APPLE_ENABLED` is left off so the
      button is honestly disabled.
- [ ] Marc's owner bootstrap tested (Google, verified `marc@gmail.com`).
- [ ] `/access-pending` verified with a non-member account.
- [ ] Rollback ready: unset `COMMAND_CENTER_MODE` (or set `demo`) and redeploy;
      SQL rollback statements are at the foot of each migration.

## 7. Preview testing

Use a preview deployment with its own isolated Supabase project. Do not point
preview integration tests at production data unless an explicitly isolated,
production-safe test account and workspace exist.
