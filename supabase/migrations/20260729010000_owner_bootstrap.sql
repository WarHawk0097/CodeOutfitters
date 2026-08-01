-- Controlled single-use owner bootstrap for the CodeOutfitters workspace.
--
-- "The first person who signs in becomes owner" is NOT implemented anywhere.
-- Instead a server-controlled allowlist row (workspace_owner_bootstrap) names
-- exactly one normalized email and one expected provider; a SECURITY DEFINER
-- function consumes that row once, inside one transaction, only for an
-- authenticated user whose confirmed email and provider both match. Every other
-- user is rejected with one generic error, so the function leaks nothing about
-- who is allowed. The browser never submits an owner email or a role.

-- ---------------------------------------------------------------------------
-- 1. Profiles — display identity for workspace members.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
grant select on public.profiles to authenticated;

-- A user reads their own profile, plus profiles of people in their workspaces.
drop policy if exists profiles_select_self_or_ws on public.profiles;
create policy profiles_select_self_or_ws on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.workspace_memberships mine
      join public.workspace_memberships theirs
        on theirs.workspace_id = mine.workspace_id
      where mine.user_id = auth.uid()
        and mine.status = 'active'
        and theirs.user_id = public.profiles.id
        and theirs.status = 'active'
    )
  );

-- No insert/update/delete policy: profiles are written only by SECURITY DEFINER
-- server code, never directly by the browser.

-- ---------------------------------------------------------------------------
-- 2. The bootstrap allowlist. Server-controlled; not readable by the browser.
-- ---------------------------------------------------------------------------
create table if not exists public.workspace_owner_bootstrap (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  normalized_email    text not null unique,
  expected_name       text not null,
  expected_provider   text not null default 'google',
  consumed_at         timestamptz,
  consumed_by_user_id uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  constraint workspace_owner_bootstrap_email_normalized
    check (normalized_email = lower(btrim(normalized_email)))
);

alter table public.workspace_owner_bootstrap enable row level security;
-- No grants and no policies for anon or authenticated: the allowlist is
-- invisible to the browser. Only service_role (RLS-exempt) and the SECURITY
-- DEFINER function below can read it.
revoke all on table public.workspace_owner_bootstrap from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Seed: the CodeOutfitters workspace and its single owner bootstrap entry.
--    Idempotent — re-running the migration never re-arms a consumed bootstrap.
-- ---------------------------------------------------------------------------
insert into public.workspaces (name, slug)
values ('CodeOutfitters', 'codeoutfitters')
on conflict (slug) do nothing;

insert into public.workspace_owner_bootstrap
  (workspace_id, normalized_email, expected_name, expected_provider)
select w.id, 'marc@gmail.com', 'Marc Bryce', 'google'
from public.workspaces w
where w.slug = 'codeoutfitters'
on conflict (normalized_email) do nothing;

-- ---------------------------------------------------------------------------
-- 4. bootstrap_initial_workspace_owner()
--
--    All ten preconditions are enforced here, server-side, in one transaction:
--      1 authenticated user exists          6 no active owner already exists
--      2 email is verified                  7 allowlist entry exists
--      3 email matches, normalized          8 entry not yet consumed
--      4 provider is the expected one       9 runs server-side (definer, no anon)
--      5 workspace exists (FK)             10 atomic (single function call)
-- ---------------------------------------------------------------------------
create or replace function public.bootstrap_initial_workspace_owner()
returns public.workspace_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user       auth.users%rowtype;
  v_email      text;
  v_provider   text;
  v_boot       public.workspace_owner_bootstrap%rowtype;
  v_membership public.workspace_memberships%rowtype;
begin
  -- (1) An authenticated user must exist. auth.uid() is null for anon.
  select * into v_user from auth.users u where u.id = auth.uid();
  if not found then
    raise exception 'owner_bootstrap_denied' using errcode = '42501';
  end if;

  -- (2) The email must be verified by the provider, not merely claimed.
  if v_user.email_confirmed_at is null or v_user.email is null then
    raise exception 'owner_bootstrap_denied' using errcode = '42501';
  end if;

  v_email := lower(btrim(v_user.email));

  -- Provider actually used for this identity. Apple returns 'apple' (and often a
  -- private-relay address), so an Apple sign-in can never consume a Google entry.
  v_provider := coalesce(v_user.raw_app_meta_data ->> 'provider', '');

  -- (3)(5)(7) Allowlist entry for this exact normalized email; the row lock makes
  -- concurrent bootstrap attempts serialize instead of racing.
  select * into v_boot
  from public.workspace_owner_bootstrap b
  where b.normalized_email = v_email
  for update;

  if not found then
    raise exception 'owner_bootstrap_denied' using errcode = '42501';
  end if;

  -- (4) Expected provider.
  if v_provider is distinct from v_boot.expected_provider then
    raise exception 'owner_bootstrap_denied' using errcode = '42501';
  end if;

  -- (8) Single use — with idempotent replay for the same authenticated UUID.
  if v_boot.consumed_at is not null then
    if v_boot.consumed_by_user_id = v_user.id then
      select * into v_membership
      from public.workspace_memberships m
      where m.workspace_id = v_boot.workspace_id
        and m.user_id = v_user.id;
      return v_membership;
    end if;
    raise exception 'owner_bootstrap_denied' using errcode = '42501';
  end if;

  -- (6) Never create a second owner.
  if exists (
    select 1
    from public.workspace_memberships m
    where m.workspace_id = v_boot.workspace_id
      and m.role = 'owner'
      and m.status = 'active'
  ) then
    raise exception 'owner_bootstrap_denied' using errcode = '42501';
  end if;

  -- The name comes from the server-controlled allowlist row, never from the
  -- browser and never from a provider display name.
  insert into public.profiles (id, email, full_name)
  values (v_user.id, v_user.email, v_boot.expected_name)
  on conflict (id) do update
    set email      = excluded.email,
        full_name  = excluded.full_name,
        updated_at = now();

  insert into public.workspace_memberships (workspace_id, user_id, role, status)
  values (v_boot.workspace_id, v_user.id, 'owner', 'active')
  on conflict (workspace_id, user_id) do update
    set role       = 'owner',
        status     = 'active',
        updated_at = now()
  returning * into v_membership;

  update public.workspace_owner_bootstrap
  set consumed_at         = now(),
      consumed_by_user_id = v_user.id
  where id = v_boot.id;

  return v_membership;
end;
$$;

revoke all on function public.bootstrap_initial_workspace_owner() from public, anon;
grant execute on function public.bootstrap_initial_workspace_owner() to authenticated, service_role;

-- Rollback (local only):
--   drop function public.bootstrap_initial_workspace_owner();
--   drop table public.workspace_owner_bootstrap;
--   drop policy profiles_select_self_or_ws on public.profiles;
--   drop table public.profiles;
--   delete from public.workspaces where slug = 'codeoutfitters';
