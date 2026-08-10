import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { openTestDatabase, resetSchema } from "@/test/pglite-schema";

// PART 6 end-to-end proof: a disposable member drives the real sequence a live session would —
// create a saved view, create a task, complete the task, rename the saved view — against a real
// embedded Postgres running the unmodified migrations, and the feed reads the four resulting
// rows back newest-first.
//
// This exercises the database layer the producers depend on (RLS, FKs, ordering), not the
// TypeScript call sites themselves — createClient() is a PostgREST client and PGlite has no
// PostgREST server to point it at, which is why every *.pglite.test.ts file in this repo drives
// SQL directly instead of importing the provider module (see activity-migration.pglite.test.ts's
// header). The INSERT/UPDATE shapes below are kept identical to the ones
// lib/tasks/server-provider.ts, lib/views/server-provider.ts and lib/activity/server-provider.ts
// actually issue; the TypeScript-level proof that those files issue exactly these shapes lives in
// their own *.test.ts files (source-surface assertions) alongside this one.
const MIGRATIONS = [
  "../../supabase/migrations/20260723_inquiry_backend.sql",
  "../../supabase/migrations/20260724_inquiry_attachments_upload.sql",
  "../../supabase/migrations/20260727_command_center_workspaces.sql",
  "../../supabase/migrations/20260729020000_command_center_tasks.sql",
  "../../supabase/migrations/20260801000000_command_center_saved_views.sql",
  "../../supabase/migrations/20260730000000_command_center_activity.sql",
].map((rel) => fileURLToPath(new URL(rel, import.meta.url)));

const AUTH_STUB = `
  create schema if not exists auth;
  create table auth.users (
    id                 uuid primary key,
    email              text,
    email_confirmed_at timestamptz,
    raw_app_meta_data  jsonb not null default '{}'::jsonb
  );
  create or replace function auth.uid() returns uuid language sql stable as $fn$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  $fn$;
  grant usage on schema auth to authenticated;
  grant select on auth.users to authenticated;
`;

let db: PGlite;

async function createUser(): Promise<string> {
  const id = randomUUID();
  await db.query(`insert into auth.users (id, email, email_confirmed_at) values ($1, $2, now())`, [
    id,
    `${id}@example.test`,
  ]);
  return id;
}

async function createWorkspace(userId: string): Promise<string> {
  const workspace = randomUUID();
  await db.query(`insert into public.workspaces (id, name, slug) values ($1, $2, $3)`, [
    workspace,
    "W",
    `w-${workspace.slice(0, 8)}`,
  ]);
  await db.query(
    `insert into public.workspace_memberships (workspace_id, user_id, role, status)
     values ($1, $2, 'owner', 'active')`,
    [workspace, userId],
  );
  return workspace;
}

async function signIn(userId: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  await db.exec("set role authenticated");
}

beforeAll(async () => {
  db = await openTestDatabase();
}, 60_000);

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await resetSchema(db, { migrations: MIGRATIONS, authStub: AUTH_STUB });
}, 60_000);

describe("activity producers — real end-to-end sequence (PART 6)", () => {
  it("Saved View + Task activity from one member reads back newest-first, workspace-isolated", async () => {
    const user = await createUser();
    const workspace = await createWorkspace(user);
    await signIn(user);

    // 1. Create a saved view — mirrors lib/views/server-provider.ts's create() insert.
    const view = await db.query<{ id: string; name: string }>(
      `insert into public.saved_views (workspace_id, name, scope, filters, sort_state, visibility)
       values ($1, 'My leads', 'leads', '{}'::jsonb, '{}'::jsonb, 'personal')
       returning id, name`,
      [workspace],
    );
    const viewId = view.rows[0]!.id;
    await db.query(
      `insert into public.activity_events
         (workspace_id, event_type, category, related_kind, related_id, related_label, summary, metadata)
       values ($1, 'saved_view_created', 'system', 'workspace', $2, 'My leads', 'Saved view created — My leads', '[{"label":"List","value":"leads"}]'::jsonb)`,
      [workspace, viewId],
    );

    // 2. Create a task — mirrors lib/tasks/server-provider.ts's create() insert.
    const task = await db.query<{ id: string; title: string }>(
      `insert into public.tasks (workspace_id, title, owner_id)
       values ($1, 'Send recap', $2)
       returning id, title`,
      [workspace, user],
    );
    const taskId = task.rows[0]!.id;
    await db.query(
      `insert into public.activity_events
         (workspace_id, event_type, category, related_kind, related_id, related_label, summary)
       values ($1, 'task_created', 'task', 'task', $2, 'Send recap', 'Task created — Send recap')`,
      [workspace, taskId],
    );

    // 3. Complete the task — mirrors update()'s COMPLETED branch.
    await db.query(
      `update public.tasks set state = 'COMPLETED', completed_on = current_date where id = $1`,
      [taskId],
    );
    await db.query(
      `insert into public.activity_events
         (workspace_id, event_type, category, related_kind, related_id, related_label, summary)
       values ($1, 'task_completed', 'task', 'task', $2, 'Send recap', 'Task completed — Send recap')`,
      [workspace, taskId],
    );

    // 4. Rename the saved view — mirrors update().
    await db.query(`update public.saved_views set name = 'My hot leads' where id = $1`, [viewId]);
    await db.query(
      `insert into public.activity_events
         (workspace_id, event_type, category, related_kind, related_id, related_label, summary, metadata)
       values ($1, 'saved_view_updated', 'system', 'workspace', $2, 'My hot leads', 'Saved view updated — My hot leads', '[{"label":"List","value":"leads"}]'::jsonb)`,
      [workspace, viewId],
    );

    // Read back — mirrors lib/activity/server-provider.ts's list() ordering.
    const feed = await db.query<{ event_type: string; actor_id: string; occurred_at: string }>(
      `select event_type, actor_id, occurred_at from public.activity_events
       where workspace_id = $1 order by occurred_at desc`,
      [workspace],
    );
    expect(feed.rows.map((row) => row.event_type)).toEqual([
      "saved_view_updated",
      "task_completed",
      "task_created",
      "saved_view_created",
    ]);
    // The trigger derived every actor from the session — none of the four inserts set it.
    expect(feed.rows.every((row) => row.actor_id === user)).toBe(true);
  });

  it("a second workspace's member sees none of the first workspace's activity", async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const workspace = await createWorkspace(owner);
    const otherWorkspace = await createWorkspace(stranger);

    await signIn(owner);
    await db.query(
      `insert into public.activity_events
         (workspace_id, event_type, category, related_kind, related_id, related_label, summary)
       values ($1, 'task_created', 'task', 'task', 'task-1', 'Send recap', 'Task created — Send recap')`,
      [workspace],
    );

    await signIn(stranger);
    const feed = await db.query(`select id from public.activity_events where workspace_id = $1`, [
      otherWorkspace,
    ]);
    expect(feed.rows).toHaveLength(0);
    const crossRead = await db.query(`select id from public.activity_events where workspace_id = $1`, [
      workspace,
    ]);
    expect(crossRead.rows).toHaveLength(0);
  });
});
