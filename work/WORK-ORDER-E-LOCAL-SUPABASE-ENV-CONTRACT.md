# Work Order E — Local Supabase Env Contract

**Why this file exists:** the agent's write access to `.env*` is denied by the
workspace permission settings. Per the Work Order E directive, the agent must
NOT bypass that block. Instead it records the variable **names** and the exact
owner commands here. The owner runs the commands below to create
`.env.local`. No secret value is committed in this document — the local keys are
read live from `supabase status`.

> These are **LOCAL Docker Supabase** values only. Do NOT put any production
> URL, key, or bucket here. The local demo keys below are the standard
> Supabase-CLI local keys and have no production authority.

## Variables `.env.local` must define

| Variable | Meaning | Local value source |
|----------|---------|--------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Local API URL | `supabase status` → `API_URL` (e.g. `http://127.0.0.1:54521`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser anon key | `supabase status` → `ANON_KEY` |
| `SUPABASE_SECRET_KEY` | Server-only service key (never `NEXT_PUBLIC_`) | `supabase status` → `SECRET_KEY` |
| `INQUIRY_STORAGE_MODE` | Storage path selector | `supabase` |
| `INQUIRY_STORAGE_BUCKET` | Private attachment bucket | `inquiry-attachments` |
| `INQUIRY_UPLOAD_AUTH_TTL_SECONDS` | Signed-upload auth lifetime | `1800` |
| `INQUIRY_ATTACHMENT_TOKEN_TTL_SECONDS` | Opaque attachment-token lifetime | `86400` |
| `INQUIRY_UPLOAD_MAX_FILE_BYTES` | Per-file hard cap | `10485760` |
| `INQUIRY_UPLOAD_CONTACT_MAX_FILES` | Contact form file count | `5` |
| `INQUIRY_UPLOAD_CONTACT_MAX_TOTAL_BYTES` | Contact form total | `26214400` |
| `INQUIRY_UPLOAD_COMPACT_MAX_FILES` | Services/Industries count | `2` |
| `INQUIRY_UPLOAD_COMPACT_MAX_TOTAL_BYTES` | Services/Industries total | `15728640` |
| `INQUIRY_ORPHAN_RETENTION_HOURS` | Orphan cleanup grace | `24` |
| `INQUIRY_FILE_SCANNER_MODE` | `clamav` \| `deterministic` \| `disabled` | `clamav` |
| `INQUIRY_CLAMAV_HOST` | Local ClamAV host | `127.0.0.1` |
| `INQUIRY_CLAMAV_PORT` | Local ClamAV clamd port | `3310` |

## Owner command — generate `.env.local` (PowerShell, run from repo root)

```powershell
# Reads live LOCAL keys from the running stack; writes .env.local.
$status = supabase status -o json | ConvertFrom-Json
@"
NEXT_PUBLIC_SUPABASE_URL=$($status.API_URL)
NEXT_PUBLIC_SUPABASE_ANON_KEY=$($status.ANON_KEY)
SUPABASE_SECRET_KEY=$($status.SECRET_KEY)
INQUIRY_STORAGE_MODE=supabase
INQUIRY_STORAGE_BUCKET=inquiry-attachments
INQUIRY_UPLOAD_AUTH_TTL_SECONDS=1800
INQUIRY_ATTACHMENT_TOKEN_TTL_SECONDS=86400
INQUIRY_UPLOAD_MAX_FILE_BYTES=10485760
INQUIRY_UPLOAD_CONTACT_MAX_FILES=5
INQUIRY_UPLOAD_CONTACT_MAX_TOTAL_BYTES=26214400
INQUIRY_UPLOAD_COMPACT_MAX_FILES=2
INQUIRY_UPLOAD_COMPACT_MAX_TOTAL_BYTES=15728640
INQUIRY_ORPHAN_RETENTION_HOURS=24
INQUIRY_FILE_SCANNER_MODE=clamav
INQUIRY_CLAMAV_HOST=127.0.0.1
INQUIRY_CLAMAV_PORT=3310
"@ | Set-Content -Encoding utf8 .env.local
```

`.env.local` is git-ignored and must never be committed. Rotate/replace only
LOCAL keys here; production credentials never appear in this repo.

## Blocker reported

Agent could not write `.env.local` itself: `.env*` is denied by permission
settings. Owner must run the command above once before `npm run dev` / browser
QA. Integration tests inject the same LOCAL values inline from `supabase status`
and do not require `.env.local`.
