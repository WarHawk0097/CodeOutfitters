-- Leads insert path — manual lead creation from the dashboard (goal: Leads Foundation
-- item 3, "Manual Add Lead" was FULLY_MISSING before this migration: public.leads granted
-- select (20260727_command_center_workspaces.sql) and a status/owner update
-- (20260812000000_leads_update.sql), but never insert to `authenticated` — the only way a
-- row could exist was the public.submit_inquiry() SECURITY DEFINER RPC.
--
-- Column-restricted grant, same shape as the update migration: a rep can create a lead in
-- their own workspace with exactly the fields the manual-add form captures. status and
-- appointment_status are deliberately NOT in the grant — they keep the table's defaults
-- ('New' / 'not_started'), so a manually created lead always starts at the front of the
-- pipeline, the same as an inquiry-sourced one.

begin;

grant insert (
  first_name, last_name, business_name, work_email, phone,
  service_interest, workflow_description, source_page, workspace_id
) on public.leads to authenticated;

-- Same both-sides shape as tasks_insert_members (20260729020000_command_center_tasks.sql):
-- a rep may create a lead in their own workspace only, never plant one in another.
drop policy if exists leads_insert_members on public.leads;
create policy leads_insert_members on public.leads
  for insert to authenticated
  with check (workspace_id is not null and public.is_workspace_member(workspace_id));

commit;

-- Rollback (local only):
--   begin;
--   drop policy leads_insert_members on public.leads;
--   revoke insert (first_name, last_name, business_name, work_email, phone, service_interest, workflow_description, source_page, workspace_id) on public.leads from authenticated;
--   commit;
