-- Leads write path — the update grant + RLS policy PATCH /api/leads/[id] needs. Until now
-- public.leads granted `select` only (20260727_command_center_workspaces.sql); this adds
-- exactly the write surface lib/command-center/contracts/leads.ts's LeadsPatchRequestSchema
-- uses (status, assigned_owner) — nothing else is client-writable.
--
-- Column-restricted grant, not a blanket table grant: a status/owner change should not be
-- able to also rewrite work_email or internal_notes through the same endpoint.

begin;

create or replace function public.leads_touch_updated_at()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists leads_touch_updated_at on public.leads;
create trigger leads_touch_updated_at before update on public.leads
  for each row execute function public.leads_touch_updated_at();

-- anon gets nothing (no grant, no policy). service_role bypasses RLS server-side.
grant update (status, assigned_owner) on public.leads to authenticated;

-- Same both-sides shape as tasks_update_members (20260729020000_command_center_tasks.sql):
-- a lead cannot be moved out of a workspace the caller belongs to into one they do not.
drop policy if exists leads_update_members on public.leads;
create policy leads_update_members on public.leads
  for update to authenticated
  using (workspace_id is not null and public.is_workspace_member(workspace_id))
  with check (workspace_id is not null and public.is_workspace_member(workspace_id));

commit;

-- Rollback (local only):
--   begin;
--   drop policy leads_update_members on public.leads;
--   revoke update (status, assigned_owner) on public.leads from authenticated;
--   drop trigger leads_touch_updated_at on public.leads;
--   drop function public.leads_touch_updated_at();
--   commit;
