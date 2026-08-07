-- Copilot ACL hardening: explicitly close off anon/public access on the
-- conversation-history tables and function, regardless of what the live
-- database currently holds. The 20260802000000 migration's GRANTs already
-- state the intended authenticated-only surface; this migration additionally
-- REVOKEs from anon/public first, so it self-heals drift (e.g. a schema-wide
-- default-privilege grant applied outside migration history) rather than
-- only re-stating the target state on top of it.
--
-- Runtime evidence (lib/ai/conversation/supabase-store.ts): authenticated
-- callers only ever SELECT/INSERT/DELETE ai_conversations and SELECT/INSERT
-- ai_messages — no .update() call exists on either table anywhere in the
-- store. service_role is not used by the app for these tables; its grants
-- below are precautionary parity with the rest of this schema (see
-- 20260616_booking_a_get_available_slots.sql's service_role EXECUTE grants).

revoke all on public.ai_conversations from anon, public;
revoke all on public.ai_messages      from anon, public;

grant select, insert, delete on public.ai_conversations to authenticated;
grant select, insert          on public.ai_messages      to authenticated;
grant all on public.ai_conversations, public.ai_messages to service_role;

revoke all on function public.can_use_ai_conversation(uuid) from anon, public;
grant execute on function public.can_use_ai_conversation(uuid) to authenticated, service_role;

-- pg_catalog is always searched first regardless; stating it explicitly here
-- only satisfies the linter's function_search_path_mutable check, it does not
-- change resolution behavior.
alter function public.can_use_ai_conversation(uuid) set search_path = pg_catalog, public;

-- Rollback (local only):
--   alter function public.can_use_ai_conversation(uuid) set search_path = public;
--   revoke execute on function public.can_use_ai_conversation(uuid) from authenticated, service_role;
--   grant execute on function public.can_use_ai_conversation(uuid) to authenticated, service_role;
--   revoke all on public.ai_conversations, public.ai_messages from service_role;
--   grant select, insert, delete on public.ai_conversations to authenticated;
--   grant select, insert on public.ai_messages to authenticated;
