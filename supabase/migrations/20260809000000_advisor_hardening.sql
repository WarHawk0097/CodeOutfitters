-- Safe subset of the Supabase advisor findings (WO batch Part 3). Scope is
-- deliberately narrow: fix the 3 mutable-search_path functions, close the
-- direct RPC surface on 2 trigger-only SECURITY DEFINER functions, and
-- convert the 9 RLS policies still re-evaluating auth.uid() per row to the
-- initplan-safe form. No RLS visibility rule changes, no new indexes, no
-- extension relocation.
--
-- Deliberately NOT done here:
--   * citext relocation out of public — deferred; not proven low-risk this batch.
--   * The 14 unindexed-FK advisor findings (activity_events.actor_id,
--     ai_conversations.user_id, proposal_access_links.*, proposal_publications.*,
--     proposal_client_responses.publication_id, saved_views.owner_user_id,
--     tasks.created_by/owner_id, workspace_owner_bootstrap.*) — grepped for a
--     direct query filter on each column in lib/**; none exists outside
--     migration-shape tests. These are FK-integrity/cascade-delete columns only,
--     not a query pattern, so adding indexes here would be speculative.

begin;

-- ---------------------------------------------------------------------------
-- 1. function_search_path_mutable (3 functions)
--
-- pg_catalog is always searched first regardless; stating it explicitly only
-- satisfies the linter, it does not change resolution behavior. Matches the
-- house pattern in 20260802020000_harden_ai_conversation_privileges.sql.
-- ---------------------------------------------------------------------------
alter function public.workspace_role_rank(public.workspace_role) set search_path = pg_catalog, public;
alter function public.tasks_touch_updated_at()                    set search_path = pg_catalog, public;
alter function public.saved_views_touch_updated_at()               set search_path = pg_catalog, public;

-- ---------------------------------------------------------------------------
-- 2. anon/authenticated_security_definer_function_executable — trigger-only
--    functions. Both are wired exclusively via `create trigger ... execute
--    function ...` (confirmed: no supabase.rpc() call anywhere in lib/ or
--    app/). A trigger fires as the table owner regardless of the invoking
--    role's EXECUTE privilege on the function, so revoking direct EXECUTE
--    only closes the /rest/v1/rpc/<fn> surface and does not affect the
--    triggers (activity_events_derive_actor, ai_messages_touch_conversation).
--
--    The original migrations only revoked from `public`; that did not remove
--    an explicit direct grant to anon/authenticated, which is why the
--    advisor still flags both. Revoke explicitly from all three here.
-- ---------------------------------------------------------------------------
revoke all on function public.activity_events_derive_actor()      from anon, authenticated, public;
revoke all on function public.ai_conversations_touch_on_message() from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- 3. auth_rls_initplan (9 policies) — replace `auth.uid()` with
--    `(select auth.uid())` so it evaluates once per query instead of once per
--    row. Semantics unchanged: same boolean result for every row.
-- ---------------------------------------------------------------------------
alter policy memberships_select_self_or_ws on public.workspace_memberships
  using (user_id = (select auth.uid()) or public.is_workspace_member(workspace_id));

alter policy profiles_select_self_or_ws on public.profiles
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.workspace_memberships mine
      join public.workspace_memberships theirs
        on theirs.workspace_id = mine.workspace_id
      where mine.user_id = (select auth.uid())
        and mine.status = 'active'
        and theirs.user_id = public.profiles.id
        and theirs.status = 'active'
    )
  );

alter policy saved_views_select on public.saved_views
  using (
    public.is_workspace_member(workspace_id)
    and (owner_user_id = (select auth.uid()) or visibility = 'shared')
  );

alter policy saved_views_insert on public.saved_views
  with check (
    public.is_workspace_member(workspace_id)
    and owner_user_id = (select auth.uid())
    and (visibility = 'personal' or public.can_manage_shared_views(workspace_id))
  );

alter policy saved_views_update on public.saved_views
  using (
    public.is_workspace_member(workspace_id)
    and (
      owner_user_id = (select auth.uid())
      or (visibility = 'shared' and public.can_manage_shared_views(workspace_id))
    )
  );

alter policy saved_views_delete on public.saved_views
  using (
    public.is_workspace_member(workspace_id)
    and (
      owner_user_id = (select auth.uid())
      or (visibility = 'shared' and public.can_manage_shared_views(workspace_id))
    )
  );

alter policy ai_conversations_select on public.ai_conversations
  using (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id));

alter policy ai_conversations_insert on public.ai_conversations
  with check (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id));

alter policy ai_conversations_delete on public.ai_conversations
  using (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id));

commit;

-- Rollback (local only):
--   begin;
--   alter policy ai_conversations_delete on public.ai_conversations using (user_id = auth.uid() and public.is_workspace_member(workspace_id));
--   alter policy ai_conversations_insert on public.ai_conversations with check (user_id = auth.uid() and public.is_workspace_member(workspace_id));
--   alter policy ai_conversations_select on public.ai_conversations using (user_id = auth.uid() and public.is_workspace_member(workspace_id));
--   alter policy saved_views_delete on public.saved_views using (public.is_workspace_member(workspace_id) and (owner_user_id = auth.uid() or (visibility = 'shared' and public.can_manage_shared_views(workspace_id))));
--   alter policy saved_views_update on public.saved_views using (public.is_workspace_member(workspace_id) and (owner_user_id = auth.uid() or (visibility = 'shared' and public.can_manage_shared_views(workspace_id))));
--   alter policy saved_views_insert on public.saved_views with check (public.is_workspace_member(workspace_id) and owner_user_id = auth.uid() and (visibility = 'personal' or public.can_manage_shared_views(workspace_id)));
--   alter policy saved_views_select on public.saved_views using (public.is_workspace_member(workspace_id) and (owner_user_id = auth.uid() or visibility = 'shared'));
--   alter policy profiles_select_self_or_ws on public.profiles using (id = auth.uid() or exists (select 1 from public.workspace_memberships mine join public.workspace_memberships theirs on theirs.workspace_id = mine.workspace_id where mine.user_id = auth.uid() and mine.status = 'active' and theirs.user_id = public.profiles.id and theirs.status = 'active'));
--   alter policy memberships_select_self_or_ws on public.workspace_memberships using (user_id = auth.uid() or public.is_workspace_member(workspace_id));
--   grant execute on function public.ai_conversations_touch_on_message() to authenticated;
--   grant execute on function public.activity_events_derive_actor() to authenticated;
--   alter function public.saved_views_touch_updated_at() set search_path = public;
--   alter function public.tasks_touch_updated_at() set search_path = public;
--   alter function public.workspace_role_rank(public.workspace_role) set search_path = public;
--   commit;
