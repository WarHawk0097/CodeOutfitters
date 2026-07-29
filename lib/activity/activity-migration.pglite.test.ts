import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";

// Real-database proof of the activity migration (tests 150-159).
//
// Asserting on the SQL text would prove nothing about behaviour, so this loads the ACTUAL
// migration files UNMODIFIED into an embedded Postgres (PGlite, no Docker) and drives them
// as a real `authenticated` role — which is the only way RLS is exercised at all, since the
// superuser that runs the migrations bypasses every policy.
//
// PGlite has no GoTrue, so the two things Supabase supplies are stubbed with the same shapes
// the migration reads: an auth.users table and an auth.uid() that resolves the current
// request's subject. Everything under test is the unmodified migration.
const MIGRATIONS = [
  "../../supabase/migrations/20260723_inquiry_backend.sql",
  "../../supabase/migrations/20260724_inquiry_attachments_upload.sql",
  "../../supabase/migrations/20260727_command_center_workspaces.sql",
  "../../supabase/migrations/20260730_command_center_activity.sql",
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
  await db.query(
    `insert into auth.users (id, email, email_confirmed_at) values ($1, $2, now())`,
    [id, `${id}@example.test`],
  );
  return id;
}

/** A workspace with one active member. */
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

/** Run the following statements as this authenticated user, under RLS. */
async function signIn(userId: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  await db.exec("set role authenticated");
}

async function asSuperuser() {
  await db.exec("reset role");
}

const insertEvent = `
  insert into public.activity_events
    (workspace_id, event_type, category, related_kind, related_id, related_label, summary)
  values ($1, 'task_completed', 'task', 'task', 'task-1', 'Send recap', 'Task completed')
  returning id, actor_id, occurred_at`;

// A fresh in-memory database per test for full isolation. Booting PGlite and applying four
// migrations takes longer than the 10s default hook timeout when the suite runs in parallel,
// so the budget is stated rather than left to flake.
beforeEach(async () => {
  db = new PGlite({ extensions: { citext } });
  await db.exec("create role anon; create role authenticated; create role service_role;");
  await db.exec(AUTH_STUB);
  for (const path of MIGRATIONS) await db.exec(readFileSync(path, "utf8"));
}, 60_000);

describe("activity migration — workspace isolation and server-derived identity (tests 150-159)", () => {
  // 150
  it("applies cleanly and enables row level security on the log", async () => {
    const rls = await db.query<{ relrowsecurity: boolean }>(
      `select relrowsecurity from pg_class where oid = 'public.activity_events'::regclass`,
    );
    expect(rls.rows[0]!.relrowsecurity).toBe(true);
  });

  // 151
  it("grants authenticated select and insert only — never update or delete", async () => {
    const grants = await db.query<{ grantee: string; privilege_type: string }>(
      `select grantee, privilege_type from information_schema.role_table_grants
       where table_schema = 'public' and table_name = 'activity_events'`,
    );
    const authenticated = grants.rows
      .filter((row) => row.grantee === "authenticated")
      .map((row) => row.privilege_type)
      .sort();
    expect(authenticated).toEqual(["INSERT", "SELECT"]);
    expect(grants.rows.some((row) => row.grantee === "anon")).toBe(false);
    expect(grants.rows.some((row) => row.grantee === "PUBLIC")).toBe(false);
  });

  // 152
  it("a member can record history in their own workspace and read it back", async () => {
    const user = await createUser();
    const workspace = await createWorkspace(user);
    await signIn(user);
    const written = await db.query<{ id: string }>(insertEvent, [workspace]);
    expect(written.rows).toHaveLength(1);
    const read = await db.query<{ id: string }>(`select id from public.activity_events`);
    expect(read.rows.map((row) => row.id)).toEqual([written.rows[0]!.id]);
  });

  // 153
  it("a cross-workspace insert is rejected", async () => {
    const member = await createUser();
    const stranger = await createUser();
    await createWorkspace(member);
    const foreign = await createWorkspace(stranger);
    await signIn(member);
    await expect(db.query(insertEvent, [foreign])).rejects.toThrow(/row-level security/i);
  });

  // 154
  it("a cross-workspace read returns nothing rather than someone else's history", async () => {
    const member = await createUser();
    const stranger = await createUser();
    await createWorkspace(member);
    const foreign = await createWorkspace(stranger);

    await signIn(stranger);
    await db.query(insertEvent, [foreign]);

    await signIn(member);
    const read = await db.query(`select id from public.activity_events`);
    expect(read.rows).toHaveLength(0);
  });

  // 155
  it("a forged actor_id is discarded — the actor is the session", async () => {
    const user = await createUser();
    const impostor = await createUser();
    const workspace = await createWorkspace(user);
    await signIn(user);
    const written = await db.query<{ actor_id: string }>(
      `insert into public.activity_events
         (workspace_id, event_type, category, related_kind, related_id, related_label, summary, actor_id)
       values ($1, 'task_completed', 'task', 'task', 'task-1', 'Send recap', 'Task completed', $2)
       returning actor_id`,
      [workspace, impostor],
    );
    expect(written.rows[0]!.actor_id).toBe(user);
  });

  // 156
  it("a backdated occurred_at is discarded — the instant is the database clock", async () => {
    const user = await createUser();
    const workspace = await createWorkspace(user);
    await signIn(user);
    const written = await db.query<{ occurred_at: Date }>(
      `insert into public.activity_events
         (workspace_id, event_type, category, related_kind, related_id, related_label, summary, occurred_at)
       values ($1, 'task_completed', 'task', 'task', 'task-1', 'Send recap', 'Task completed', '1999-01-01T00:00:00Z')
       returning occurred_at`,
      [workspace],
    );
    expect(new Date(written.rows[0]!.occurred_at).getUTCFullYear()).toBeGreaterThan(2020);
  });

  // 157
  it("history cannot be rewritten or erased by a member", async () => {
    const user = await createUser();
    const workspace = await createWorkspace(user);
    await signIn(user);
    await db.query(insertEvent, [workspace]);
    await expect(
      db.query(`update public.activity_events set summary = 'Nothing happened'`),
    ).rejects.toThrow(/permission denied/i);
    await expect(db.query(`delete from public.activity_events`)).rejects.toThrow(
      /permission denied/i,
    );
  });

  // 158
  it("metadata must be labelled pairs, never an arbitrary blob", async () => {
    const user = await createUser();
    const workspace = await createWorkspace(user);
    await signIn(user);
    const write = (metadata: string) =>
      db.query(
        `insert into public.activity_events
           (workspace_id, event_type, category, related_kind, related_id, related_label, summary, metadata)
         values ($1, 'task_completed', 'task', 'task', 'task-1', 'Send recap', 'Task completed', $2::jsonb)`,
        [workspace, metadata],
      );
    await expect(write('[{"label":"New stage","value":"Negotiation"}]')).resolves.toBeTruthy();
    await expect(write('{"stage":"Negotiation"}')).rejects.toThrow(/metadata_pairs/i);
    await expect(write('["Negotiation"]')).rejects.toThrow(/metadata_pairs/i);
  });

  // 159
  it("every function this migration adds has a fixed search_path and no PUBLIC execute", async () => {
    await asSuperuser();
    const functions = await db.query<{ proname: string; proconfig: string[] | null; acl: string | null }>(
      `select p.proname, p.proconfig, array_to_string(p.proacl, ',') as acl
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname in ('activity_events_derive_actor', 'can_view_activity_event', 'activity_metadata_is_pairs')`,
    );
    expect(functions.rows).toHaveLength(3);
    for (const row of functions.rows) {
      expect(row.proconfig?.join(","), row.proname).toMatch(/search_path=public/);
      expect(row.acl ?? "", row.proname).not.toMatch(/(^|,)=X\//);
    }
  });
});
