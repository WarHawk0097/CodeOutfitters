-- Work Order E Step 7/8 — private inquiry-attachments Storage bucket + policies.
--
-- LOCAL Docker Supabase infrastructure as code. Applying to production Storage
-- is NOT authorized by this work order; this migration only ever runs against
-- the local stack (supabase db reset / supabase start).
--
-- Security model:
--   * Bucket is PRIVATE (public = false): no unauthenticated object URLs.
--   * Object keys are server-generated: inquiries/{submissionId}/{attachmentId}/
--     {sanitizedFilename}. The browser never chooses a key; no PII in keys.
--   * All access is via short-lived SIGNED upload/download URLs minted by the
--     server-side service role. anon / authenticated roles get NO policy on
--     this bucket, so RLS denies them by default (deny-by-default, no
--     USING(true) / WITH CHECK(true) anywhere).
--   * The explicit policies below are scoped to the service_role AND to
--     bucket_id = 'inquiry-attachments' — they document intent and never widen
--     access beyond this one private bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'inquiry-attachments',
  'inquiry-attachments',
  false,
  10485760, -- 10 MiB hard cap, mirrors INQUIRY_UPLOAD_MAX_FILE_BYTES
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- RLS is already enabled on storage.objects by Supabase. We add ONLY narrowly
-- scoped service_role policies for this bucket. No anon/authenticated/public
-- policy exists, so those roles are denied by default.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'inquiry_attachments_service_role_select'
  ) then
    create policy inquiry_attachments_service_role_select
      on storage.objects for select to service_role
      using (bucket_id = 'inquiry-attachments');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'inquiry_attachments_service_role_insert'
  ) then
    create policy inquiry_attachments_service_role_insert
      on storage.objects for insert to service_role
      with check (bucket_id = 'inquiry-attachments');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'inquiry_attachments_service_role_update'
  ) then
    create policy inquiry_attachments_service_role_update
      on storage.objects for update to service_role
      using (bucket_id = 'inquiry-attachments')
      with check (bucket_id = 'inquiry-attachments');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'inquiry_attachments_service_role_delete'
  ) then
    create policy inquiry_attachments_service_role_delete
      on storage.objects for delete to service_role
      using (bucket_id = 'inquiry-attachments');
  end if;
end $$;

-- Rollback (manual, local only):
--   delete from storage.objects where bucket_id = 'inquiry-attachments';
--   delete from storage.buckets where id = 'inquiry-attachments';
--   drop policy if exists inquiry_attachments_service_role_select on storage.objects;
--   drop policy if exists inquiry_attachments_service_role_insert on storage.objects;
--   drop policy if exists inquiry_attachments_service_role_update on storage.objects;
--   drop policy if exists inquiry_attachments_service_role_delete on storage.objects;
