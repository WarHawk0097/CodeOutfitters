begin;

create table if not exists public.extension_auth_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  state text not null,
  redirect_uri text not null,
  code_challenge text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.extension_auth_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  scope text not null check (scope = 'meeting_capture'),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.extension_auth_codes enable row level security;
alter table public.extension_auth_sessions enable row level security;
revoke all on public.extension_auth_codes from public, anon, authenticated;
revoke all on public.extension_auth_sessions from public, anon, authenticated;

create index if not exists extension_auth_codes_expiry_idx on public.extension_auth_codes(expires_at);
create index if not exists extension_auth_sessions_expiry_idx on public.extension_auth_sessions(expires_at);

commit;
