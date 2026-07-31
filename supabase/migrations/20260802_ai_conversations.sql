-- Copilot conversation history — the durable half of one chat, and nothing more.
--
-- This stores what was said, by whom, in which workspace, and what the answer
-- cost. It is not AI memory: nothing here is retrieved to influence a later
-- answer, there are no embeddings, no documents, no summaries and no profile.
-- A row is a transcript line, and the only reader is the person who wrote it.
--
-- Shape follows the workspace foundation in 20260727_command_center_workspaces.sql
-- and the per-user precedent in 20260801_command_center_saved_views.sql: RLS is the
-- boundary, membership is a row in workspace_memberships, and authorization never
-- reads editable JWT metadata. Workspace and owner come from the authenticated
-- session, never from a request body — see the column defaults and the WITH CHECK
-- clauses below.
--
-- Append-only by grant, not by convention. `authenticated` is given SELECT, INSERT
-- and (on conversations) DELETE, and no UPDATE at all, so a transcript line cannot
-- be rewritten and a conversation cannot be moved to another workspace or another
-- owner by any statement a signed-in user is able to issue. The one field that has
-- to change after insert — a conversation's updated_at, so the list can be ordered
-- by recency — is maintained by a SECURITY DEFINER trigger instead.

-- ---------------------------------------------------------------------------
-- 1. Enums — the same value sets lib/ai/provider/message.ts declares
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.ai_message_role as enum ('system', 'developer', 'user', 'assistant', 'tool');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ai_finish_reason as enum (
    'stop', 'length', 'tool_calls', 'content_filter', 'cancelled', 'error'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  -- Whose conversation it is. Defaulted from the session rather than accepted from
  -- the caller, and the insert policy re-states auth.uid() so a body-supplied owner
  -- is refused rather than quietly corrected.
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- Derived from the first user message by deriveTitle() in lib/ai/conversation/state.ts.
  -- Never model-generated in this slice.
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ai_conversations_title_present check (length(btrim(title)) > 0),
  -- deriveTitle caps at 60 plus an ellipsis; the ceiling is generous rather than
  -- exact so a longer title is a product decision and not a failed insert.
  constraint ai_conversations_title_length check (length(title) <= 200)
);

-- The only read the store performs without an id: this user's conversations in
-- this workspace, newest first. Ordering column included so the list is served
-- from the index rather than sorted after the fact.
create index if not exists ai_conversations_owner_recent_idx
  on public.ai_conversations(workspace_id, user_id, updated_at desc);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  -- Chronological order, not created_at. Timestamps come from an injected clock and
  -- several messages in one turn legitimately share one; a tool result read back
  -- before the assistant message that requested it is a shape providers reject.
  seq bigint generated always as identity,
  role public.ai_message_role not null,
  -- Text only. ConversationMessage.content also admits a ContentPart[], but nothing
  -- in this slice produces one — there is no upload path and no vision model — so
  -- the store rejects a non-string rather than this column speculating a shape.
  content text not null,
  -- The calls an assistant message requested, in the wire form ToolCall declares.
  -- jsonb rather than a child table because a call is only ever read back whole,
  -- alongside its message, and never queried across conversations.
  tool_calls jsonb,
  -- Set on a 'tool' message; correlates the result with the call that asked for it.
  tool_call_id text,
  -- ConversationMessage.metadata, a string map. Its one concrete use today is the
  -- tool name a 'tool' message needs to be turned back into a wire message.
  metadata jsonb not null default '{}'::jsonb,

  -- Per-message accounting. Provider-neutral: an identifier and a model name are
  -- values, not columns, so a second provider adds rows and not a migration.
  provider_id text,
  model text,
  input_tokens integer,
  output_tokens integer,
  cached_input_tokens integer,
  reasoning_tokens integer,
  cost_usd numeric(14, 8),
  latency_ms integer,
  finish_reason public.ai_finish_reason,

  created_at timestamptz not null default now(),

  -- Only an assistant message requests tools, and the payload is the array
  -- ToolCall[] serialises to. An object here passes `jsonb not null` and fails much
  -- further away, in a provider's request builder.
  constraint ai_messages_tool_calls_shape check (
    tool_calls is null or (role = 'assistant' and jsonb_typeof(tool_calls) = 'array')
  ),
  -- A tool result without its call id is unreadable, and a call id on anything else
  -- correlates nothing. Stated as an equivalence so neither half can drift.
  constraint ai_messages_tool_call_id check ((role = 'tool') = (tool_call_id is not null)),
  constraint ai_messages_metadata_object check (jsonb_typeof(metadata) = 'object'),
  -- Metrics belong to the answer, so they can only appear on an assistant message.
  constraint ai_messages_metrics_role check (provider_id is null or role = 'assistant'),
  -- All or none. MessageMetrics has no optional half except the two cache counters,
  -- so a row with a model but no cost is a partially written record rather than a
  -- measurement that happened to be missing.
  constraint ai_messages_metrics_complete check (
    (
      provider_id is null and model is null and input_tokens is null
      and output_tokens is null and cost_usd is null and latency_ms is null
      and finish_reason is null
    )
    or (
      provider_id is not null and model is not null and input_tokens is not null
      and output_tokens is not null and cost_usd is not null and latency_ms is not null
      and finish_reason is not null
    )
  ),
  -- Counters are counters. A negative one is a mapping bug, and it is cheaper to
  -- reject it here than to explain a negative month later.
  constraint ai_messages_metrics_nonnegative check (
    coalesce(input_tokens, 0) >= 0 and coalesce(output_tokens, 0) >= 0
    and coalesce(cached_input_tokens, 0) >= 0 and coalesce(reasoning_tokens, 0) >= 0
    and coalesce(cost_usd, 0) >= 0 and coalesce(latency_ms, 0) >= 0
  )
);

-- The transcript read: every message of one conversation, in order. Unique so the
-- order is a fact about the table rather than a property of the query plan.
create unique index if not exists ai_messages_conversation_seq_idx
  on public.ai_messages(conversation_id, seq);

-- ---------------------------------------------------------------------------
-- 3. Recency, without an UPDATE grant
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER because `authenticated` deliberately has no UPDATE privilege on
-- ai_conversations: withholding it is what makes the workspace and the owner
-- unchangeable. The definer rights here are the narrowest thing that still works —
-- one column, on the parent of a row the caller was just allowed to insert.
create or replace function public.ai_conversations_touch_on_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.ai_conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists ai_messages_touch_conversation on public.ai_messages;
create trigger ai_messages_touch_conversation after insert on public.ai_messages
  for each row execute function public.ai_conversations_touch_on_message();

-- ---------------------------------------------------------------------------
-- 4. Authorization helper
-- ---------------------------------------------------------------------------
-- Definer rights bypass RLS, which is the point: a message policy has to ask about
-- a conversation row the caller may not select, and asking through this function
-- gives the same answer — false — for "does not exist" and "not yours". A message
-- policy that read ai_conversations directly would leak the difference.
create or replace function public.can_use_ai_conversation(p_conversation uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.ai_conversations c
    where c.id = p_conversation
      and c.user_id = auth.uid()
      and public.is_workspace_member(c.workspace_id)
  );
$$;

revoke all on function public.can_use_ai_conversation(uuid) from public;
grant execute on function public.can_use_ai_conversation(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. RLS — the boundary
-- ---------------------------------------------------------------------------
alter table public.ai_conversations enable row level security;
alter table public.ai_messages      enable row level security;

-- No UPDATE, anywhere. A transcript is a record, not a document.
grant select, insert, delete on public.ai_conversations to authenticated;
grant select, insert          on public.ai_messages      to authenticated;

-- Three conditions, all of them: your workspace, you, and an active membership.
-- `is_workspace_member` supplies the third — a suspended or merely invited member
-- is not a member here — so a departed colleague loses reach without any row in
-- these two tables being touched.
drop policy if exists ai_conversations_select on public.ai_conversations;
create policy ai_conversations_select on public.ai_conversations
  for select to authenticated
  using (user_id = auth.uid() and public.is_workspace_member(workspace_id));

drop policy if exists ai_conversations_insert on public.ai_conversations;
create policy ai_conversations_insert on public.ai_conversations
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_workspace_member(workspace_id));

-- Delete is the user clearing their own history. Messages go with it by cascade,
-- which runs as the referencing constraint and so needs no policy of its own.
drop policy if exists ai_conversations_delete on public.ai_conversations;
create policy ai_conversations_delete on public.ai_conversations
  for delete to authenticated
  using (user_id = auth.uid() and public.is_workspace_member(workspace_id));

-- A message is reachable exactly when its conversation is. Routing both policies
-- through one helper is what stops a message row from ever being the easier door.
drop policy if exists ai_messages_select on public.ai_messages;
create policy ai_messages_select on public.ai_messages
  for select to authenticated
  using (public.can_use_ai_conversation(conversation_id));

drop policy if exists ai_messages_insert on public.ai_messages;
create policy ai_messages_insert on public.ai_messages
  for insert to authenticated
  with check (public.can_use_ai_conversation(conversation_id));

-- Rollback (local only):
--   drop policy ai_messages_insert on public.ai_messages;
--   drop policy ai_messages_select on public.ai_messages;
--   drop policy ai_conversations_delete on public.ai_conversations;
--   drop policy ai_conversations_insert on public.ai_conversations;
--   drop policy ai_conversations_select on public.ai_conversations;
--   revoke select, insert on public.ai_messages from authenticated;
--   revoke select, insert, delete on public.ai_conversations from authenticated;
--   drop function public.can_use_ai_conversation(uuid);
--   drop trigger ai_messages_touch_conversation on public.ai_messages;
--   drop function public.ai_conversations_touch_on_message();
--   drop table public.ai_messages; drop table public.ai_conversations;
--   drop type public.ai_finish_reason; drop type public.ai_message_role;
