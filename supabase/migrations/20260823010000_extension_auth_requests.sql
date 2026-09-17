begin;

create table if not exists public.extension_auth_requests (
  id uuid primary key default gen_random_uuid(),
  request_hash text not null unique,
  state_hash text not null,
  code_challenge text not null,
  status text not null default 'pending' check (status in ('pending', 'authorized', 'denied')),
  user_id uuid references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  account_name text,
  workspace_name text,
  expires_at timestamptz not null,
  authorized_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.extension_auth_requests enable row level security;
revoke all on table public.extension_auth_requests from public, anon, authenticated;
create index if not exists extension_auth_requests_expiry_idx on public.extension_auth_requests(expires_at);

commit;
