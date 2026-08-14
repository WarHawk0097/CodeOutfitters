-- Post-deployment verification of 20260813000000_leads_pipeline_stage.sql found that its new
-- objects never had the project's default privileges (ALTER DEFAULT PRIVILEGES for role
-- `postgres`, which auto-grants broad access to `anon`/`authenticated` on every new table and
-- function in `public`) explicitly stripped — unlike public.leads, whose own migration does
-- revoke them. Confirmed on hosted via `supabase db query --linked`:
--
--   - lead_stage_history: `anon` and `authenticated` both still hold base INSERT/UPDATE/DELETE/
--     TRUNCATE grants. RLS (no INSERT/UPDATE/DELETE policy exists) blocks the first three, but
--     TRUNCATE bypasses RLS entirely — a real excess privilege on an append-only history table.
--   - change_lead_stage: `anon` still holds EXECUTE (the original migration's
--     `revoke all on function ... from public` does not touch a role-specific default grant).
--     Mitigated today by the function's own `auth.uid() is null -> unauthorized` check, but it
--     is still a stated-intent violation (the original migration's own comment says
--     "no insert, update or delete grant is given to `authenticated`" / EXECUTE is
--     authenticated-only).
--
-- This closes both gaps. No table/function body change — grants only.

begin;

revoke all on table public.lead_stage_history from public, anon, authenticated;
grant select on public.lead_stage_history to authenticated;

revoke all on function public.change_lead_stage(uuid, text, text, text, text) from public, anon;
grant execute on function public.change_lead_stage(uuid, text, text, text, text) to authenticated;

commit;

-- Rollback (local only, restores the prior — insecure — default-ACL state, not recommended):
--   begin;
--   grant insert, update, delete, truncate on public.lead_stage_history to anon, authenticated;
--   grant execute on function public.change_lead_stage(uuid, text, text, text, text) to anon;
--   commit;
