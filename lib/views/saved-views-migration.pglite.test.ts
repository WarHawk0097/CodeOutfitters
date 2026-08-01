import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { openTestDatabase, resetSchema } from "@/test/pglite-schema";

// Real-database proof of the Saved View migration (tests 109-120).
//
// The migration file is loaded UNMODIFIED into an embedded Postgres and driven as a real
// `authenticated` role, because the superuser that applies a migration bypasses every policy it
// declares and therefore proves nothing about it. The questions asked are the ones a Saved View
// table can get wrong in a way nobody notices until it matters: can a member read a colleague's
// personal view, can somebody publish a shared view without the role, can a row be moved to
// another workspace or another owner by UPDATE, and can an unauthenticated caller reach any of
// it.
//
// The connection is opened once for the file and the schema is rebuilt per test — see
// test/pglite-schema.ts. A PGlite instance per test exhausts the worker's WASM heap and kills
// the run with no failing assertion to point at.
const MIGRATIONS = [
  "../../supabase/migrations/20260723_inquiry_backend.sql",
  "../../supabase/migrations/20260724_inquiry_attachments_upload.sql",
  "../../supabase/migrations/20260727_command_center_workspaces.sql",
  "../../supabase/migrations/20260801000000_command_center_saved_views.sql",
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

async function createWorkspace(ownerId: string): Promise<string> {
  const workspace = randomUUID();
  await db.query(`insert into public.workspaces (id, name, slug) values ($1, $2, $3)`, [
    workspace,
    "W",
    `w-${workspace.slice(0, 8)}`,
  ]);
  await db.query(
    `insert into public.workspace_memberships (workspace_id, user_id, role, status)
     values ($1, $2, 'owner', 'active')`,
    [workspace, ownerId],
  );
  return workspace;
}

async function addMember(workspace: string, userId: string, role: "admin" | "member") {
  await db.query(
    `insert into public.workspace_memberships (workspace_id, user_id, role, status)
     values ($1, $2, $3, 'active')`,
    [workspace, userId, role],
  );
}

async function signIn(userId: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  await db.exec("set role authenticated");
}

async function asAnon() {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', '', false)");
  await db.exec("set role anon");
}

async function asSuperuser() {
  await db.exec("reset role");
}

/** Insert a view the way the provider would: naming neither owner nor timestamps. */
async function saveView(
  workspace: string,
  scope: string,
  name: string,
  options: { visibility?: "personal" | "shared"; filters?: string; isDefault?: boolean } = {},
) {
  return db.query<{ id: string; owner_user_id: string }>(
    `insert into public.saved_views (workspace_id, scope, name, filters, visibility, is_default)
     values ($1, $2, $3, $4::jsonb, $5, $6)
     returning id, owner_user_id`,
    [
      workspace,
      scope,
      name,
      options.filters ?? '{"status":"Contacted"}',
      options.visibility ?? "personal",
      options.isDefault ?? false,
    ],
  );
}

beforeAll(async () => {
  db = await openTestDatabase();
});

afterAll(async () => {
  await db?.close();
});

beforeEach(async () => {
  await resetSchema(db, { migrations: MIGRATIONS, authStub: AUTH_STUB });
});

describe("saved views migration (tests 109-120)", () => {
  // 109
  it("applies cleanly to an empty database, twice", async () => {
    // Re-running this migration is what a re-deploy does. The guards (`if not exists`, the
    // duplicate_object catch, `drop policy if exists`) exist for exactly this. Only the Saved
    // View file is re-applied: the ones underneath it are this release's dependencies, not this
    // release's subject.
    await db.exec(readFileSync(MIGRATIONS.at(-1)!, "utf8"));
    const table = await db.query<{ relrowsecurity: boolean }>(
      `select relrowsecurity from pg_class where oid = 'public.saved_views'::regclass`,
    );
    expect(table.rows[0]?.relrowsecurity).toBe(true);
  });

  // 110
  it("declares the columns and types the provider contract names", async () => {
    const columns = await db.query<{ column_name: string; data_type: string; is_nullable: string }>(
      `select column_name, data_type, is_nullable
         from information_schema.columns
        where table_schema = 'public' and table_name = 'saved_views'
        order by column_name`,
    );
    const byName = new Map(columns.rows.map((row) => [row.column_name, row]));
    expect([...byName.keys()]).toEqual([
      "column_state",
      "created_at",
      "filters",
      "id",
      "is_default",
      "name",
      "owner_user_id",
      "scope",
      "search_text",
      "sort_state",
      "updated_at",
      "visibility",
      "workspace_id",
    ]);
    // Everything except the optional search term is NOT NULL, so a half-written row is a
    // rejection rather than a view that applies unpredictably.
    for (const [name, row] of byName) {
      expect(row.is_nullable, name).toBe(name === "search_text" ? "YES" : "NO");
    }
    expect(byName.get("filters")?.data_type).toBe("jsonb");
    expect(byName.get("sort_state")?.data_type).toBe("jsonb");
    expect(byName.get("column_state")?.data_type).toBe("jsonb");
    expect(byName.get("is_default")?.data_type).toBe("boolean");
    expect(byName.get("created_at")?.data_type).toBe("timestamp with time zone");
  });

  // 111
  it("uses the same scope and visibility vocabularies as the application", async () => {
    const enums = await db.query<{ typname: string; labels: string[] }>(
      `select t.typname, array_agg(e.enumlabel order by e.enumsortorder) as labels
         from pg_type t join pg_enum e on e.enumtypid = t.oid
        where t.typname in ('saved_view_scope', 'saved_view_visibility')
        group by t.typname order by t.typname`,
    );
    const byName = new Map(enums.rows.map((row) => [row.typname, row.labels]));
    expect(byName.get("saved_view_scope")).toEqual([
      "myWork",
      "leads",
      "pipeline",
      "meetings",
      "proposals",
      "followUps",
      "emailActivity",
    ]);
    // Exactly two visibilities: an audience model that does not exist is not implied here.
    expect(byName.get("saved_view_visibility")).toEqual(["personal", "shared"]);

    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    await signIn(owner);
    await expect(saveView(workspace, "notAScope", "Nowhere")).rejects.toThrow(/invalid input value for enum/);
  });

  // 112
  it("rejects a nameless, over-long or wrongly-shaped view", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    await signIn(owner);

    await expect(saveView(workspace, "leads", "   ")).rejects.toThrow(/saved_views_name_present/);
    await expect(saveView(workspace, "leads", "x".repeat(61))).rejects.toThrow(/saved_views_name_length/);
    // A JSON array satisfies `jsonb not null` and then fails somewhere much further away.
    await expect(saveView(workspace, "leads", "Array", { filters: "[]" })).rejects.toThrow(
      /saved_views_filters_object/,
    );
    await expect(
      db.query(
        `insert into public.saved_views (workspace_id, scope, name, search_text)
         values ($1, 'leads', 'Long search', $2)`,
        [workspace, "x".repeat(121)],
      ),
    ).rejects.toThrow(/saved_views_search_length/);
    // The boundary values are accepted, so the limit is the limit and not one short of it.
    await expect(saveView(workspace, "leads", "x".repeat(60))).resolves.toBeDefined();
  });

  // 113
  it("takes the owner from the session, not from the insert", async () => {
    const owner = await createUser();
    const impostorTarget = await createUser();
    const workspace = await createWorkspace(owner);
    await addMember(workspace, impostorTarget, "member");

    await signIn(owner);
    const saved = await saveView(workspace, "leads", "Mine");
    expect(saved.rows[0]?.owner_user_id).toBe(owner);

    // Naming somebody else as the owner is refused by the insert policy rather than accepted
    // and quietly corrected.
    await expect(
      db.query(
        `insert into public.saved_views (workspace_id, owner_user_id, scope, name)
         values ($1, $2, 'leads', 'Theirs')`,
        [workspace, impostorTarget],
      ),
    ).rejects.toThrow(/row-level security/);
  });

  // 114
  it("keeps a personal view private from every colleague, including an admin and the owner", async () => {
    const author = await createUser();
    const admin = await createUser();
    const workspaceOwner = await createUser();
    const workspace = await createWorkspace(workspaceOwner);
    await addMember(workspace, author, "member");
    await addMember(workspace, admin, "admin");

    await signIn(author);
    const saved = await saveView(workspace, "leads", "My arrangement");
    const id = saved.rows[0]!.id;

    for (const colleague of [admin, workspaceOwner]) {
      await signIn(colleague);
      const seen = await db.query(`select id from public.saved_views where id = $1`, [id]);
      expect(seen.rows).toEqual([]);
      // Not merely invisible: not writable either.
      const updated = await db.query(`update public.saved_views set name = 'Taken' where id = $1 returning id`, [id]);
      expect(updated.rows).toEqual([]);
      const deleted = await db.query(`delete from public.saved_views where id = $1 returning id`, [id]);
      expect(deleted.rows).toEqual([]);
    }

    await signIn(author);
    expect((await db.query(`select id from public.saved_views where id = $1`, [id])).rows.length).toBe(1);
  });

  // 115
  it("lets every member read a shared view, and only an admin publish one", async () => {
    const member = await createUser();
    const admin = await createUser();
    const workspaceOwner = await createUser();
    const workspace = await createWorkspace(workspaceOwner);
    await addMember(workspace, member, "member");
    await addMember(workspace, admin, "admin");

    await signIn(member);
    await expect(saveView(workspace, "leads", "Closing soon", { visibility: "shared" })).rejects.toThrow(
      /row-level security/,
    );

    await signIn(admin);
    const shared = await saveView(workspace, "leads", "Closing soon", { visibility: "shared" });
    const id = shared.rows[0]!.id;

    await signIn(member);
    expect((await db.query(`select id from public.saved_views where id = $1`, [id])).rows.length).toBe(1);
    // Readable, not writable.
    expect((await db.query(`update public.saved_views set name = 'Mine now' where id = $1 returning id`, [id])).rows)
      .toEqual([]);
    expect((await db.query(`delete from public.saved_views where id = $1 returning id`, [id])).rows).toEqual([]);

    await signIn(admin);
    expect((await db.query(`delete from public.saved_views where id = $1 returning id`, [id])).rows.length).toBe(1);
  });

  // 116
  it("refuses to let a member promote their own view to shared", async () => {
    const member = await createUser();
    const workspaceOwner = await createUser();
    const workspace = await createWorkspace(workspaceOwner);
    await addMember(workspace, member, "member");

    await signIn(member);
    const saved = await saveView(workspace, "leads", "Mine");
    const id = saved.rows[0]!.id;
    // The USING half passes — it is their own view — and the WITH CHECK half is what stops it.
    await expect(
      db.query(`update public.saved_views set visibility = 'shared' where id = $1`, [id]),
    ).rejects.toThrow(/row-level security/);
  });

  // 117
  it("cannot be moved to another workspace or another owner by UPDATE", async () => {
    const author = await createUser();
    const outsider = await createUser();
    const workspace = await createWorkspace(author);
    const otherWorkspace = await createWorkspace(outsider);
    await addMember(otherWorkspace, author, "member");

    await signIn(author);
    const saved = await saveView(workspace, "leads", "Mine");
    const id = saved.rows[0]!.id;

    // The trigger puts both back, so the row stays where it was even though the author is a
    // member of both workspaces and the policy would otherwise permit the write.
    await db.query(`update public.saved_views set workspace_id = $1, owner_user_id = $2 where id = $3`, [
      otherWorkspace,
      outsider,
      id,
    ]);
    const after = await db.query<{ workspace_id: string; owner_user_id: string }>(
      `select workspace_id, owner_user_id from public.saved_views where id = $1`,
      [id],
    );
    expect(after.rows[0]?.workspace_id).toBe(workspace);
    expect(after.rows[0]?.owner_user_id).toBe(author);
  });

  // 118
  it("gives nothing to an anonymous caller — no grant and no policy", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    await signIn(owner);
    await saveView(workspace, "leads", "Mine");

    await asAnon();
    await expect(db.query(`select id from public.saved_views`)).rejects.toThrow(/permission denied/);
    await expect(
      db.query(`insert into public.saved_views (workspace_id, scope, name) values ($1, 'leads', 'Anon')`, [workspace]),
    ).rejects.toThrow(/permission denied/);

    await asSuperuser();
    const grants = await db.query<{ grantee: string; privilege_type: string }>(
      `select grantee, privilege_type from information_schema.role_table_grants
        where table_schema = 'public' and table_name = 'saved_views' order by grantee, privilege_type`,
    );
    expect(grants.rows.some((row) => row.grantee === "anon")).toBe(false);
    expect(grants.rows.some((row) => row.grantee === "public")).toBe(false);
    expect(
      grants.rows.filter((row) => row.grantee === "authenticated").map((row) => row.privilege_type).sort(),
    ).toEqual(["DELETE", "INSERT", "SELECT", "UPDATE"]);
  });

  // 119
  it("holds one name per scope per person, and one default per scope per person", async () => {
    const author = await createUser();
    const colleague = await createUser();
    const workspace = await createWorkspace(author);
    await addMember(workspace, colleague, "member");

    await signIn(author);
    await saveView(workspace, "leads", "Overdue");
    await expect(saveView(workspace, "leads", "overdue")).rejects.toThrow(/saved_views_personal_name_idx/);
    // The same name on a different list is a different view.
    await expect(saveView(workspace, "proposals", "Overdue")).resolves.toBeDefined();

    // And a colleague's identical name is their own business.
    await signIn(colleague);
    await expect(saveView(workspace, "leads", "Overdue")).resolves.toBeDefined();

    await signIn(author);
    await saveView(workspace, "meetings", "Opens here", { isDefault: true });
    await expect(saveView(workspace, "meetings", "Also opens here", { isDefault: true })).rejects.toThrow(
      /saved_views_one_default_idx/,
    );
    // One person's default is not a setting applied to a colleague.
    await signIn(colleague);
    await expect(saveView(workspace, "meetings", "My own default", { isDefault: true })).resolves.toBeDefined();
  });

  // 120
  it("gives a non-member nothing, and keeps its helper off the public role", async () => {
    const author = await createUser();
    const outsider = await createUser();
    const workspace = await createWorkspace(author);
    await createWorkspace(outsider);

    await signIn(author);
    await saveView(workspace, "leads", "Mine", { visibility: "personal" });
    await signIn(author);
    // A shared view is still workspace-bounded, not workspace-agnostic.
    await saveView(workspace, "leads", "Ours", { visibility: "shared" });

    await signIn(outsider);
    expect((await db.query(`select id from public.saved_views`)).rows).toEqual([]);
    await expect(
      db.query(`insert into public.saved_views (workspace_id, scope, name) values ($1, 'leads', 'Theirs')`, [
        workspace,
      ]),
    ).rejects.toThrow(/row-level security/);

    await asSuperuser();
    const helper = await db.query<{ prosecdef: boolean; proconfig: string[] | null; acl: string | null }>(
      `select p.prosecdef, p.proconfig, array_to_string(p.proacl, ',') as acl
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'can_manage_shared_views'`,
    );
    const row = helper.rows[0];
    expect(row?.prosecdef).toBe(true);
    // A security definer function without a fixed search_path is a privilege escalation waiting
    // for somebody to create a schema in front of it.
    expect(row?.proconfig).toContain("search_path=public");
    expect(row?.acl ?? "").not.toMatch(/(^|,)=X\//);
    expect(row?.acl ?? "").toContain("authenticated=X/");
    expect(row?.acl ?? "").toContain("service_role=X/");
  });
});
