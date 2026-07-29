-- Command Center operations — secure client proposal access, behind
-- lib/proposals/access/provider.ts.
--
-- NOT APPLIED by this change. The live secure-proposal plane resolves to `provider_required`
-- until this migration is deployed and a ProposalAccessAdminProvider / ProposalPublicProvider
-- pair is wired to it. The demo plane never touches this table, or any Supabase request.
--
-- This schema is different in kind from everything before it, because for the first time a
-- person with no account, no session and no membership reads a row. Everything below follows
-- from that.
--
-- The boundary, stated once:
--
--   * anon is granted NOTHING. No select, no insert, no execute. A public reader never issues
--     a query; the Next.js server does, on their behalf, through the three security-definer
--     functions at the end of this file. There is no PostgREST path to any of these tables.
--
--   * The raw token never arrives here. The application hashes it (lib/proposals/access/
--     token.ts, SHA-256, server-only) and passes the hash. So a database log, a slow-query
--     log, a backup, an `EXPLAIN` capture or a leaked dump contains hashes and nothing a
--     person could paste into a browser. This is why the functions below take
--     `p_token_hash`, which reads awkwardly, rather than `p_token`, which would read well
--     and would put every client's proposal into the query log.
--
--   * A token is looked up by an equality match on an indexed unique column. That is a hash
--     lookup, not a scan, so it does not leak timing information about which prefixes exist.
--
--   * Publication content is an immutable snapshot. Editing a proposal after publishing does
--     not edit what a client was sent — there is no update grant on the snapshot at all.
--
-- Deliberately NOT created here:
--
--   * A foreign key from proposal_publications to a proposals table. There is still no
--     proposals table in this schema; internal_proposal_id is carried as text exactly as
--     activity_events carries related_id, and gains a real reference in the release that
--     lands proposals themselves. Inventing a FK to a table that does not exist would fail
--     on deploy; inventing the table here would be a second, unreviewed schema.
--
--   * Any signature table, certificate, audit seal or signer identity record. Acceptance
--     here is a recorded decision with a typed name. It is not a certified electronic
--     signature and this schema does not model one.
--
--   * Any column holding a full IP address. Open tracking records that an open happened and
--     when, against a link that already identifies its recipient by name. A full IP would be
--     personal data with no retention policy to govern it and no question it answers that
--     open_count does not.
--
--   * Any modification of 20260730_command_center_activity.sql. The one thing this release
--     needs from it — a way to say an event came from a client rather than a colleague — is
--     added below as a new column with a default, so every existing row and every existing
--     insert keeps working unchanged.

-- ---------------------------------------------------------------------------
-- 1. Enums — the same value sets as lib/proposals/access/model.ts
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.proposal_publication_status as enum ('published', 'superseded', 'withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.proposal_access_decision as enum ('none', 'accepted', 'declined');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.proposal_client_response_type as enum ('question', 'comment', 'acceptance', 'decline');
exception when duplicate_object then null; end $$;

-- Who acted. Added for the activity log below: a client has no auth.uid(), and an event with
-- a null actor_id previously meant "the system did it", which is a different fact.
do $$ begin
  create type public.activity_actor_kind as enum ('team_member', 'client', 'system');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. Publications — what a client was sent, frozen
-- ---------------------------------------------------------------------------
create table if not exists public.proposal_publications (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid not null references public.workspaces(id) on delete cascade,
  -- Text, not a foreign key: see the header. The internal id never leaves this table.
  internal_proposal_id text not null,
  version_number       integer not null,
  version_label        text not null,
  title                text not null,
  client_organisation  text not null,
  status               public.proposal_publication_status not null default 'published',
  published_at         timestamptz not null default now(),
  published_by         uuid references auth.users(id) on delete set null,
  published_by_label   text not null default '',
  superseded_by        uuid references public.proposal_publications(id) on delete set null,
  -- The client-safe document: sections and text blocks, already stripped of internal notes,
  -- validation state and owner. Whatever is in here is what the public route renders, so a
  -- field that is not in here cannot be leaked by a rendering mistake.
  snapshot             jsonb not null,

  constraint proposal_publications_version_positive check (version_number > 0),
  constraint proposal_publications_title_present check (length(btrim(title)) > 0),
  constraint proposal_publications_snapshot_object check (jsonb_typeof(snapshot) = 'object'),
  -- A version number is claimed once per proposal per workspace. Two rows claiming to be v3
  -- of the same proposal is a question with no honest answer.
  constraint proposal_publications_version_unique unique (workspace_id, internal_proposal_id, version_number),
  constraint proposal_publications_not_self_superseded check (superseded_by is distinct from id)
);

create index if not exists proposal_publications_proposal_idx
  on public.proposal_publications(workspace_id, internal_proposal_id, version_number desc);

-- ---------------------------------------------------------------------------
-- 3. Access links — one per recipient, addressed by a hash
-- ---------------------------------------------------------------------------
create table if not exists public.proposal_access_links (
  id                   uuid primary key default gen_random_uuid(),
  publication_id       uuid not null references public.proposal_publications(id) on delete cascade,
  -- Denormalized from the publication so RLS can check membership without a join, and so a
  -- link can never end up scoped to a different workspace than the document it opens. The
  -- trigger below sets it; it is not taken from the caller.
  workspace_id         uuid not null references public.workspaces(id) on delete cascade,
  recipient_name       text not null,
  recipient_email      text not null,
  -- SHA-256 of the token, lowercase hex. The token itself exists exactly twice: in the
  -- response that created this row, and in the recipient's address bar.
  token_hash           text not null,
  expires_at           timestamptz not null,
  created_at           timestamptz not null default now(),
  created_by           uuid references auth.users(id) on delete set null,
  revoked_at           timestamptz,
  revoked_by           uuid references auth.users(id) on delete set null,
  first_opened_at      timestamptz,
  last_opened_at       timestamptz,
  open_count           integer not null default 0,
  decision             public.proposal_access_decision not null default 'none',
  decided_at           timestamptz,
  -- Only an acceptance asks for a typed name. A decline records none rather than borrowing
  -- the recipient's name for a signature-shaped field nobody filled in.
  decided_by_name      text,
  replaces_link_id     uuid references public.proposal_access_links(id) on delete set null,
  replaced_by_link_id  uuid references public.proposal_access_links(id) on delete set null,

  -- Globally unique, not per workspace: a token that resolves to two links is a token that
  -- opens the wrong client's proposal.
  constraint proposal_access_links_token_unique unique (token_hash),
  constraint proposal_access_links_token_shape check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint proposal_access_links_recipient_present check (length(btrim(recipient_name)) > 0),
  constraint proposal_access_links_open_count_sane check (open_count >= 0),
  constraint proposal_access_links_opens_consistent check (
    (open_count = 0 and first_opened_at is null and last_opened_at is null)
    or (open_count > 0 and first_opened_at is not null and last_opened_at is not null
        and last_opened_at >= first_opened_at)
  ),
  -- A decision is dated or it did not happen.
  constraint proposal_access_links_decision_dated check (
    (decision = 'none' and decided_at is null and decided_by_name is null)
    or (decision <> 'none' and decided_at is not null)
  ),
  constraint proposal_access_links_revocation_dated check (
    (revoked_at is null and revoked_by is null) or revoked_at is not null
  ),
  constraint proposal_access_links_not_self_replacing check (
    replaces_link_id is distinct from id and replaced_by_link_id is distinct from id
  )
);

create index if not exists proposal_access_links_publication_idx
  on public.proposal_access_links(publication_id, created_at desc);
create index if not exists proposal_access_links_workspace_idx
  on public.proposal_access_links(workspace_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 4. Client responses — questions, comments and decisions
-- ---------------------------------------------------------------------------
create table if not exists public.proposal_client_responses (
  id                       uuid primary key default gen_random_uuid(),
  access_link_id           uuid not null references public.proposal_access_links(id) on delete cascade,
  publication_id           uuid not null references public.proposal_publications(id) on delete cascade,
  workspace_id             uuid not null references public.workspaces(id) on delete cascade,
  response_type            public.proposal_client_response_type not null,
  message                  text not null default '',
  typed_name               text not null default '',
  authorization_confirmed  boolean not null default false,
  -- A double-submitted form, a retried request or an impatient second click must record one
  -- response, not two. The key is generated per submission by the server.
  idempotency_key          text not null,
  responded_at             timestamptz not null default now(),
  created_at               timestamptz not null default now(),

  constraint proposal_client_responses_idempotent unique (access_link_id, idempotency_key),
  constraint proposal_client_responses_message_bounded check (length(message) <= 4000),
  constraint proposal_client_responses_typed_name_bounded check (length(typed_name) <= 120),
  -- A question or a comment with nothing in it is not a response.
  constraint proposal_client_responses_text_present check (
    response_type in ('acceptance', 'decline') or length(btrim(message)) > 0
  ),
  -- An acceptance is only an acceptance if somebody typed a name and confirmed they may
  -- accept. This is the same rule as validateResponseDraft, restated here because the
  -- application is not the only thing that can write to this table.
  constraint proposal_client_responses_acceptance_complete check (
    response_type <> 'acceptance'
    or (authorization_confirmed and length(btrim(typed_name)) >= 2)
  )
);

create index if not exists proposal_client_responses_link_idx
  on public.proposal_client_responses(access_link_id, responded_at desc);
create index if not exists proposal_client_responses_workspace_idx
  on public.proposal_client_responses(workspace_id, responded_at desc);

-- ---------------------------------------------------------------------------
-- 5. Server-derived workspace scoping
--
-- The workspace on a link and on a response is taken from the publication it belongs to, on
-- every insert and every update. A caller cannot file a link into another workspace by
-- sending a different workspace_id, because the value they sent is discarded.
-- ---------------------------------------------------------------------------
create or replace function public.proposal_access_derive_workspace()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select p.workspace_id into new.workspace_id
  from public.proposal_publications p
  where p.id = new.publication_id;
  if new.workspace_id is null then
    raise exception 'publication % does not exist', new.publication_id;
  end if;
  return new;
end;
$$;

revoke all on function public.proposal_access_derive_workspace() from public;

drop trigger if exists proposal_access_links_derive_workspace on public.proposal_access_links;
create trigger proposal_access_links_derive_workspace
  before insert or update on public.proposal_access_links
  for each row execute function public.proposal_access_derive_workspace();

drop trigger if exists proposal_client_responses_derive_workspace on public.proposal_client_responses;
create trigger proposal_client_responses_derive_workspace
  before insert or update on public.proposal_client_responses
  for each row execute function public.proposal_access_derive_workspace();

-- A published snapshot is immutable. Superseding, withdrawing and pointing at a successor are
-- allowed; changing the document, the version or the client is not.
create or replace function public.proposal_publications_freeze()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.snapshot is distinct from old.snapshot
     or new.internal_proposal_id is distinct from old.internal_proposal_id
     or new.version_number is distinct from old.version_number
     or new.version_label is distinct from old.version_label
     or new.client_organisation is distinct from old.client_organisation
     or new.published_at is distinct from old.published_at
     or new.workspace_id is distinct from old.workspace_id then
    raise exception 'a published proposal version is immutable; publish a new version instead';
  end if;
  return new;
end;
$$;

revoke all on function public.proposal_publications_freeze() from public;

drop trigger if exists proposal_publications_freeze on public.proposal_publications;
create trigger proposal_publications_freeze before update on public.proposal_publications
  for each row execute function public.proposal_publications_freeze();

-- ---------------------------------------------------------------------------
-- 6. RLS — the internal side
--
-- Reuses public.is_workspace_member from 20260727_command_center_workspaces.sql. Membership
-- logic is not restated here: a second copy is a second thing to get wrong.
-- ---------------------------------------------------------------------------
alter table public.proposal_publications     enable row level security;
alter table public.proposal_access_links     enable row level security;
alter table public.proposal_client_responses enable row level security;

-- anon is granted nothing on any of the three. This is the whole public-access posture: a
-- reader with a valid token still has no database identity and no table privileges.
grant select, insert on public.proposal_publications to authenticated;
grant update (status, superseded_by) on public.proposal_publications to authenticated;
grant select, insert on public.proposal_access_links to authenticated;
grant update (revoked_at, revoked_by, replaced_by_link_id) on public.proposal_access_links to authenticated;
-- Members read client responses. They never write them: a response is the client's word, and
-- a colleague who can insert one can put words in a client's mouth.
grant select on public.proposal_client_responses to authenticated;

drop policy if exists proposal_publications_select_members on public.proposal_publications;
create policy proposal_publications_select_members on public.proposal_publications
  for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists proposal_publications_insert_members on public.proposal_publications;
create policy proposal_publications_insert_members on public.proposal_publications
  for insert to authenticated with check (public.is_workspace_member(workspace_id));

drop policy if exists proposal_publications_update_members on public.proposal_publications;
create policy proposal_publications_update_members on public.proposal_publications
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

drop policy if exists proposal_access_links_select_members on public.proposal_access_links;
create policy proposal_access_links_select_members on public.proposal_access_links
  for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists proposal_access_links_insert_members on public.proposal_access_links;
create policy proposal_access_links_insert_members on public.proposal_access_links
  for insert to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and exists (
      select 1 from public.proposal_publications p
      where p.id = publication_id and public.is_workspace_member(p.workspace_id)
    )
  );

drop policy if exists proposal_access_links_update_members on public.proposal_access_links;
create policy proposal_access_links_update_members on public.proposal_access_links
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

drop policy if exists proposal_client_responses_select_members on public.proposal_client_responses;
create policy proposal_client_responses_select_members on public.proposal_client_responses
  for select to authenticated using (public.is_workspace_member(workspace_id));

-- No delete anywhere. A revoked link stays on the record, a client's question stays on the
-- record, and a withdrawn version stays on the record: this is the history of a commercial
-- negotiation, and a party who can delete their half of it can rewrite what was agreed.

-- ---------------------------------------------------------------------------
-- 7. The public side — three functions, service_role only
--
-- The public route never queries a table. It calls one of these, from the server, with a
-- token hash. Each returns only client-safe values, and each returns the same empty answer
-- for an unknown hash as for a revoked, expired or withdrawn one: a public response that
-- varied by reason would be a probing oracle.
-- ---------------------------------------------------------------------------

-- What a client may see. Note what is not selected: internal_proposal_id, recipient_email,
-- token_hash, created_by, workspace_id, open_count.
create or replace function public.proposal_public_resolve(p_token_hash text)
returns table (
  link_id              uuid,
  recipient_name       text,
  expires_at           timestamptz,
  revoked_at           timestamptz,
  decision             public.proposal_access_decision,
  decided_at           timestamptz,
  decided_by_name      text,
  publication_status   public.proposal_publication_status,
  has_newer_version    boolean,
  version_label        text,
  title                text,
  client_organisation  text,
  snapshot             jsonb
)
language sql stable security definer set search_path = public as $$
  select l.id, l.recipient_name, l.expires_at, l.revoked_at,
         l.decision, l.decided_at, l.decided_by_name,
         p.status, p.superseded_by is not null,
         p.version_label, p.title, p.client_organisation, p.snapshot
  from public.proposal_access_links l
  join public.proposal_publications p on p.id = l.publication_id
  where l.token_hash = p_token_hash;
$$;

-- Record that the client opened it. The instant is the database clock, not the payload, so a
-- browser cannot claim it read the proposal last week. Returns nothing: an open is not a
-- question, and a caller that learns whether the update matched has learned whether the
-- token exists.
create or replace function public.proposal_public_record_open(p_token_hash text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.proposal_access_links l
  set first_opened_at = coalesce(l.first_opened_at, now()),
      last_opened_at  = now(),
      open_count      = l.open_count + 1
  from public.proposal_publications p
  where p.id = l.publication_id
    and l.token_hash = p_token_hash
    and l.revoked_at is null
    and l.expires_at > now()
    and p.status <> 'withdrawn';
end;
$$;

-- Record a question, comment, acceptance or decline. Every gate is re-evaluated here against
-- current rows: the form's checks are a courtesy to the person filling it in, and this is the
-- boundary. A conflicting second decision is refused rather than applied.
create or replace function public.proposal_public_submit_response(
  p_token_hash       text,
  p_response_type    public.proposal_client_response_type,
  p_message          text,
  p_typed_name       text,
  p_authorized       boolean,
  p_idempotency_key  text
)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_link public.proposal_access_links%rowtype;
  v_status public.proposal_publication_status;
begin
  -- Locked for the duration: two submissions racing must not both find `decision = 'none'`
  -- and both write a decision.
  select l.* into v_link
  from public.proposal_access_links l
  where l.token_hash = p_token_hash
  for update;

  if not found then return false; end if;

  select p.status into v_status
  from public.proposal_publications p
  where p.id = v_link.publication_id;

  if v_link.revoked_at is not null or v_link.expires_at <= now() or v_status = 'withdrawn' then
    return false;
  end if;
  -- A decided link takes no further input at all, including a repeat of the same decision.
  if v_link.decision <> 'none' then return false; end if;

  insert into public.proposal_client_responses (
    access_link_id, publication_id, workspace_id, response_type,
    message, typed_name, authorization_confirmed, idempotency_key, responded_at
  ) values (
    v_link.id, v_link.publication_id, v_link.workspace_id, p_response_type,
    coalesce(btrim(p_message), ''), coalesce(btrim(p_typed_name), ''),
    coalesce(p_authorized, false), p_idempotency_key, now()
  )
  on conflict (access_link_id, idempotency_key) do nothing;

  if p_response_type in ('acceptance', 'decline') then
    update public.proposal_access_links
    set decision = case when p_response_type = 'acceptance' then 'accepted' else 'declined' end::public.proposal_access_decision,
        decided_at = now(),
        decided_by_name = case when p_response_type = 'acceptance' then btrim(p_typed_name) else null end
    where id = v_link.id;
  end if;

  return true;
end;
$$;

revoke all on function public.proposal_public_resolve(text) from public;
revoke all on function public.proposal_public_record_open(text) from public;
revoke all on function public.proposal_public_submit_response(
  text, public.proposal_client_response_type, text, text, boolean, text) from public;

-- service_role only. These run from the Next.js server, which has already applied rate
-- limiting; granting them to anon would put an unauthenticated caller one PostgREST request
-- away from a token-guessing loop against the database itself.
grant execute on function public.proposal_public_resolve(text) to service_role;
grant execute on function public.proposal_public_record_open(text) to service_role;
grant execute on function public.proposal_public_submit_response(
  text, public.proposal_client_response_type, text, text, boolean, text) to service_role;

-- ---------------------------------------------------------------------------
-- 8. Activity: distinguishing a client from a colleague
--
-- Additive only. 20260730_command_center_activity.sql is not modified: the column has a
-- default, so every row that exists and every insert already written keeps working, and an
-- event whose actor_id is null no longer has to mean "the system did it".
-- ---------------------------------------------------------------------------
alter table public.activity_events
  add column if not exists actor_kind public.activity_actor_kind not null default 'team_member';

comment on column public.activity_events.actor_kind is
  'Whether the actor was a workspace member, a client acting through a secure proposal link, or the system. Client events carry actor_id = null and actor_label = the recipient name recorded on the link.';

-- ---------------------------------------------------------------------------
-- Rollback (local only). Reverse order; drops the actor_kind column last because the
-- activity table predates this migration and must survive its removal.
--
--   revoke execute on function public.proposal_public_submit_response(
--     text, public.proposal_client_response_type, text, text, boolean, text) from service_role;
--   revoke execute on function public.proposal_public_record_open(text) from service_role;
--   revoke execute on function public.proposal_public_resolve(text) from service_role;
--   drop function public.proposal_public_submit_response(
--     text, public.proposal_client_response_type, text, text, boolean, text);
--   drop function public.proposal_public_record_open(text);
--   drop function public.proposal_public_resolve(text);
--   drop policy proposal_client_responses_select_members on public.proposal_client_responses;
--   drop policy proposal_access_links_update_members on public.proposal_access_links;
--   drop policy proposal_access_links_insert_members on public.proposal_access_links;
--   drop policy proposal_access_links_select_members on public.proposal_access_links;
--   drop policy proposal_publications_update_members on public.proposal_publications;
--   drop policy proposal_publications_insert_members on public.proposal_publications;
--   drop policy proposal_publications_select_members on public.proposal_publications;
--   drop trigger proposal_publications_freeze on public.proposal_publications;
--   drop function public.proposal_publications_freeze();
--   drop trigger proposal_client_responses_derive_workspace on public.proposal_client_responses;
--   drop trigger proposal_access_links_derive_workspace on public.proposal_access_links;
--   drop function public.proposal_access_derive_workspace();
--   drop table public.proposal_client_responses;
--   drop table public.proposal_access_links;
--   drop table public.proposal_publications;
--   alter table public.activity_events drop column actor_kind;
--   drop type public.activity_actor_kind;
--   drop type public.proposal_client_response_type;
--   drop type public.proposal_access_decision;
--   drop type public.proposal_publication_status;
--
-- Dropping the tables discards every published version, every issued link and every client
-- response. On a deployed database, revoke the grants and leave the tables in place instead;
-- a rollback that erases what a client agreed to is not a rollback.
