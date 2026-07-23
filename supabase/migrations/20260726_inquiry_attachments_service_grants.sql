-- Work Order E Step 10/13 — service_role DML grants on inquiry_attachments.
--
-- WO-C locked every inquiry table so the only write path was the SECURITY
-- DEFINER submit_inquiry function. The attachment lifecycle that WO-E adds
-- (authorize an upload, complete/verify/scan it, remove an unassociated one)
-- happens OUTSIDE that single function, from the trusted server using the
-- service-role key. Those operations need direct table DML.
--
-- Least privilege: grant ONLY the four DML verbs the upload service uses to
-- service_role (the server-only, RLS-bypassing identity). anon / authenticated
-- get nothing — they still cannot touch this table. No column-level widening,
-- no grants to PUBLIC.
grant select, insert, update, delete on public.inquiry_attachments to service_role;

-- Rollback (local only):
--   revoke select, insert, update, delete on public.inquiry_attachments from service_role;
