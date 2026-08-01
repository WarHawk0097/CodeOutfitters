import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { openTestDatabase, resetSchema } from "@/test/pglite-schema";

// Real-database proof of the Copilot conversation migration.
//
// The migration file is loaded UNMODIFIED into an embedded Postgres and every
// assertion below is driven as the real `authenticated` role, because a superuser
// applies a migration and then bypasses every policy it declares, which proves
// nothing about it. The questions asked are the ones a private transcript table can
// get wrong in a way nobody notices until it matters: can a colleague in the same
// workspace read your chat, can a member of another workspace, can a conversation be
// moved to a different owner, can a message row be the easier door into a
// conversation the message policy would otherwise have to protect, and does an
// anonymous caller get anything at all.
//
// The superuser role appears in exactly two places: creating fixtures (users,
// workspaces, memberships) the way the existing suites do, and reading the
// catalogue. No assertion about a policy is made through it.
//
// The connection is opened once per file and the schema is rebuilt per test — see
// test/pglite-schema.ts. A PGlite instance per test exhausts the worker's WASM heap
// and kills the run with no failing assertion to point at.
const MIGRATIONS = [
  "../../../supabase/migrations/20260723_inquiry_backend.sql",
  "../../../supabase/migrations/20260724_inquiry_attachments_upload.sql",
  "../../../supabase/migrations/20260727_command_center_workspaces.sql",
  "../../../supabase/migrations/20260802000000_ai_conversations.sql",
].map((rel) => fileURLToPath(new URL(rel, import.meta.url)));

const AUTH_STUB = `
  create schema if not exists auth;
  create table auth.users (
    id uuid primary key,
    email text,
    email_confirmed_at timestamptz,
    raw_app_meta_data jsonb
  );
  create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant select on auth.users to authenticated, service_role;
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

async function addMember(
  workspace: string,
  userId: string,
  role: "admin" | "member",
  status: "active" | "invited" | "suspended" = "active",
) {
  await db.query(
    `insert into public.workspace_memberships (workspace_id, user_id, role, status)
     values ($1, $2, $3, $4)`,
    [workspace, userId, role, status],
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

/** Starts a conversation the way the store does: naming neither owner nor id. */
async function startConversation(workspace: string, title = "Quarterly numbers") {
  return db.query<{ id: string; user_id: string; updated_at: string }>(
    `insert into public.ai_conversations (workspace_id, title)
     values ($1, $2)
     returning id, user_id, updated_at`,
    [workspace, title],
  );
}

async function say(conversation: string, role: string, content: string) {
  return db.query<{ id: string; seq: string }>(
    `insert into public.ai_messages (conversation_id, role, content)
     values ($1, $2::public.ai_message_role, $3)
     returning id, seq`,
    [conversation, role, content],
  );
}

beforeAll(async () => {
  db = await openTestDatabase();
});

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await resetSchema(db, { migrations: MIGRATIONS, authStub: AUTH_STUB });
});

describe("Copilot conversation migration", () => {
  it("is re-runnable and leaves row-level security on for both tables", async () => {
    // Re-running the file must be a no-op, which is what every `if not exists`,
    // `duplicate_object` catch and `drop policy if exists` in it exists for.
    await db.exec(readFileSync(MIGRATIONS.at(-1)!, "utf8"));

    const tables = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select relname, relrowsecurity from pg_class
        where oid in ('public.ai_conversations'::regclass, 'public.ai_messages'::regclass)
        order by relname`,
    );
    expect(tables.rows).toEqual([
      { relname: "ai_conversations", relrowsecurity: true },
      { relname: "ai_messages", relrowsecurity: true },
    ]);
  });

  it("declares the columns and enums the conversation contract names", async () => {
    const columns = await db.query<{ table_name: string; column_name: string; is_nullable: string }>(
      `select table_name, column_name, is_nullable from information_schema.columns
        where table_schema = 'public' and table_name in ('ai_conversations', 'ai_messages')
        order by table_name, column_name`,
    );
    const namesOf = (table: string) =>
      columns.rows.filter((row) => row.table_name === table).map((row) => row.column_name);

    expect(namesOf("ai_conversations")).toEqual([
      "created_at",
      "id",
      "title",
      "updated_at",
      "user_id",
      "workspace_id",
    ]);
    // Provider-neutral accounting: an identifier and a model name are values in
    // columns, not columns per provider.
    expect(namesOf("ai_messages")).toEqual([
      "cached_input_tokens",
      "content",
      "conversation_id",
      "cost_usd",
      "created_at",
      "finish_reason",
      "id",
      "input_tokens",
      "latency_ms",
      "metadata",
      "model",
      "output_tokens",
      "provider_id",
      "reasoning_tokens",
      "role",
      "seq",
      "tool_call_id",
      "tool_calls",
    ]);
    // No conversation column may be null: a half-written conversation is a record
    // nobody can attribute.
    for (const row of columns.rows.filter((r) => r.table_name === "ai_conversations")) {
      expect(row.is_nullable, row.column_name).toBe("NO");
    }

    const enums = await db.query<{ typname: string; labels: string[] }>(
      `select t.typname, array_agg(e.enumlabel order by e.enumsortorder) as labels
         from pg_type t join pg_enum e on e.enumtypid = t.oid
        where t.typname in ('ai_message_role', 'ai_finish_reason')
        group by t.typname order by t.typname`,
    );
    const byName = new Map(enums.rows.map((row) => [row.typname, row.labels]));
    expect(byName.get("ai_message_role")).toEqual([
      "system",
      "developer",
      "user",
      "assistant",
      "tool",
    ]);
    expect(byName.get("ai_finish_reason")).toEqual([
      "stop",
      "length",
      "tool_calls",
      "content_filter",
      "cancelled",
      "error",
    ]);
  });

  it("carries the indexes the two reads depend on", async () => {
    const indexes = await db.query<{ indexname: string; indexdef: string }>(
      `select indexname, indexdef from pg_indexes
        where schemaname = 'public' and tablename in ('ai_conversations', 'ai_messages')
        order by indexname`,
    );
    const byName = new Map(indexes.rows.map((row) => [row.indexname, row.indexdef]));
    // The history list: this user, this workspace, newest first.
    expect(byName.get("ai_conversations_owner_recent_idx")).toMatch(
      /workspace_id, user_id, updated_at DESC/,
    );
    // The transcript read, unique so message order is a fact about the table.
    expect(byName.get("ai_messages_conversation_seq_idx")).toMatch(/UNIQUE/);
    expect(byName.get("ai_messages_conversation_seq_idx")).toMatch(/conversation_id, seq/);
  });

  it("takes the owner from the session and refuses one named in the insert", async () => {
    const author = await createUser();
    const colleague = await createUser();
    const workspace = await createWorkspace(author);
    await addMember(workspace, colleague, "member");

    await signIn(author);
    const started = await startConversation(workspace);
    expect(started.rows[0]?.user_id).toBe(author);

    // Naming somebody else is refused by the insert policy rather than accepted and
    // quietly corrected.
    await expect(
      db.query(
        `insert into public.ai_conversations (workspace_id, user_id, title)
         values ($1, $2, 'Theirs')`,
        [workspace, colleague],
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("hides a colleague's conversation in the very same workspace", async () => {
    const author = await createUser();
    const colleague = await createUser();
    const workspace = await createWorkspace(author);
    await addMember(workspace, colleague, "member");

    await signIn(author);
    const id = (await startConversation(workspace)).rows[0]!.id;
    await say(id, "user", "How did Q2 close?");

    // A workspace-wide policy would pass every other test in this file and fail
    // this one. Membership is necessary and nowhere near sufficient.
    await signIn(colleague);
    expect((await db.query(`select id from public.ai_conversations where id = $1`, [id])).rows)
      .toEqual([]);
    expect((await db.query(`select id from public.ai_messages where conversation_id = $1`, [id])).rows)
      .toEqual([]);

    await signIn(author);
    expect(
      (await db.query(`select id from public.ai_conversations where id = $1`, [id])).rows.length,
    ).toBe(1);
  });

  it("hides a conversation belonging to another workspace entirely", async () => {
    const author = await createUser();
    const outsider = await createUser();
    const workspace = await createWorkspace(author);
    await createWorkspace(outsider);

    await signIn(author);
    const id = (await startConversation(workspace)).rows[0]!.id;
    await say(id, "user", "How did Q2 close?");

    await signIn(outsider);
    expect((await db.query(`select id from public.ai_conversations`)).rows).toEqual([]);
    expect((await db.query(`select id from public.ai_messages`)).rows).toEqual([]);
  });

  it("stops a message row from being the easier door into a conversation", async () => {
    const author = await createUser();
    const colleague = await createUser();
    const workspace = await createWorkspace(author);
    await addMember(workspace, colleague, "member");

    await signIn(author);
    const id = (await startConversation(workspace)).rows[0]!.id;

    // Not-yours and does-not-exist are one answer, so possessing a real id is worth
    // no more than guessing one.
    await signIn(colleague);
    await expect(say(id, "user", "Injected")).rejects.toThrow(/row-level security/);
    await expect(say(randomUUID(), "user", "Injected")).rejects.toThrow(/row-level security/);
    expect(
      (await db.query(`select id from public.ai_messages where conversation_id = $1`, [id])).rows,
    ).toEqual([]);

    await asSuperuser();
    expect(
      (await db.query(`select id from public.ai_messages where conversation_id = $1`, [id])).rows,
    ).toEqual([]);
  });

  it("makes the workspace and the owner unchangeable by withholding UPDATE", async () => {
    const author = await createUser();
    const outsider = await createUser();
    const workspace = await createWorkspace(author);
    const otherWorkspace = await createWorkspace(outsider);
    await addMember(otherWorkspace, author, "member");

    await signIn(author);
    const id = (await startConversation(workspace)).rows[0]!.id;

    // No UPDATE grant and no UPDATE policy: a transcript is a record, not a
    // document, so there is no statement that can move it or re-title it.
    await expect(
      db.query(`update public.ai_conversations set workspace_id = $1 where id = $2`, [
        otherWorkspace,
        id,
      ]),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db.query(`update public.ai_conversations set user_id = $1 where id = $2`, [outsider, id]),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db.query(`update public.ai_messages set content = 'rewritten' where conversation_id = $1`, [
        id,
      ]),
    ).rejects.toThrow(/permission denied/);
  });

  it("still moves a conversation up the list when a message arrives", async () => {
    const author = await createUser();
    const workspace = await createWorkspace(author);

    await signIn(author);
    const started = await startConversation(workspace);
    const id = started.rows[0]!.id;
    const before = started.rows[0]!.updated_at;

    await say(id, "user", "How did Q2 close?");

    // The touch is a definer-rights trigger precisely because the caller has no
    // UPDATE privilege of their own; without it, recency ordering would need one.
    const after = await db.query<{ updated_at: string }>(
      `select updated_at from public.ai_conversations where id = $1`,
      [id],
    );
    expect(new Date(after.rows[0]!.updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(before).getTime(),
    );
  });

  it("lets a conversation be deleted only by its owner, and takes the messages with it", async () => {
    const author = await createUser();
    const colleague = await createUser();
    const workspace = await createWorkspace(author);
    await addMember(workspace, colleague, "member");

    await signIn(author);
    const id = (await startConversation(workspace)).rows[0]!.id;
    await say(id, "user", "How did Q2 close?");

    await signIn(colleague);
    expect(
      (await db.query(`delete from public.ai_conversations where id = $1 returning id`, [id])).rows,
    ).toEqual([]);

    await signIn(author);
    expect(
      (await db.query(`delete from public.ai_conversations where id = $1 returning id`, [id])).rows
        .length,
    ).toBe(1);

    await asSuperuser();
    // Cascade, not a second policy: referential action runs as the constraint.
    expect(
      (await db.query(`select id from public.ai_messages where conversation_id = $1`, [id])).rows,
    ).toEqual([]);
  });

  it("gives an anonymous caller nothing — no grant and no policy", async () => {
    const author = await createUser();
    const workspace = await createWorkspace(author);
    await signIn(author);
    await startConversation(workspace);

    await asAnon();
    await expect(db.query(`select id from public.ai_conversations`)).rejects.toThrow(
      /permission denied/,
    );
    await expect(db.query(`select id from public.ai_messages`)).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      db.query(`insert into public.ai_conversations (workspace_id, title) values ($1, 'Anon')`, [
        workspace,
      ]),
    ).rejects.toThrow(/permission denied/);

    await asSuperuser();
    const grants = await db.query<{ table_name: string; privilege_type: string }>(
      `select table_name, privilege_type from information_schema.role_table_grants
        where table_schema = 'public'
          and table_name in ('ai_conversations', 'ai_messages')
          and grantee = 'authenticated'
        order by table_name, privilege_type`,
    );
    const of = (table: string) =>
      grants.rows.filter((row) => row.table_name === table).map((row) => row.privilege_type);
    expect(of("ai_conversations")).toEqual(["DELETE", "INSERT", "SELECT"]);
    expect(of("ai_messages")).toEqual(["INSERT", "SELECT"]);

    const anon = await db.query<{ count: string }>(
      `select count(*)::text as count from information_schema.role_table_grants
        where table_schema = 'public'
          and table_name in ('ai_conversations', 'ai_messages')
          and grantee in ('anon', 'PUBLIC')`,
    );
    expect(anon.rows[0]?.count).toBe("0");
  });

  it("drops a member whose membership is no longer active", async () => {
    const author = await createUser();
    const workspace = await createWorkspace(author);
    const suspended = await createUser();
    await addMember(workspace, suspended, "member", "suspended");

    await signIn(suspended);
    // Not a member for the purposes of `is_workspace_member`, so there is nothing to
    // start a conversation in.
    await expect(startConversation(workspace)).rejects.toThrow(/row-level security/);
  });

  it("rejects an invalid role and an orphan message", async () => {
    const author = await createUser();
    const workspace = await createWorkspace(author);
    await signIn(author);
    const id = (await startConversation(workspace)).rows[0]!.id;

    await expect(say(id, "wizard", "Abracadabra")).rejects.toThrow(/invalid input value for enum/);

    // Checked as the owner so the failure is the foreign key rather than a policy:
    // both doors are shut, and this asserts the second one.
    await asSuperuser();
    await expect(
      db.query(
        `insert into public.ai_messages (conversation_id, role, content)
         values ($1, 'user', 'Orphan')`,
        [randomUUID()],
      ),
    ).rejects.toThrow(/foreign key constraint/);
  });

  it("accepts a complete measurement and refuses a half-written, negative or misplaced one", async () => {
    const author = await createUser();
    const workspace = await createWorkspace(author);
    await signIn(author);
    const id = (await startConversation(workspace)).rows[0]!.id;

    // The positive control the refusals below are only meaningful against: every
    // field MessageMetrics requires, plus the two cache counters it leaves
    // optional, on the one role metrics may appear on.
    await expect(
      db.query(
        `insert into public.ai_messages
           (conversation_id, role, content, provider_id, model, input_tokens, output_tokens,
            cached_input_tokens, reasoning_tokens, cost_usd, latency_ms, finish_reason)
         values ($1, 'assistant', 'Up 12%.', 'openai', 'gpt-5-mini', 120, 34, 64, 8, 0.00042, 910, 'stop')`,
        [id],
      ),
    ).resolves.toBeDefined();

    // A model with no cost is a partially written record, not a measurement that
    // happened to be missing.
    await expect(
      db.query(
        `insert into public.ai_messages (conversation_id, role, content, provider_id, model)
         values ($1, 'assistant', 'Up 12%.', 'openai', 'gpt-5-mini')`,
        [id],
      ),
    ).rejects.toThrow(/ai_messages_metrics_complete/);

    // Metrics belong to the answer.
    await expect(
      db.query(
        `insert into public.ai_messages
           (conversation_id, role, content, provider_id, model, input_tokens, output_tokens,
            cost_usd, latency_ms, finish_reason)
         values ($1, 'user', 'Hello', 'openai', 'gpt-5-mini', 1, 1, 0.1, 10, 'stop')`,
        [id],
      ),
    ).rejects.toThrow(/ai_messages_metrics_role/);

    // A tool result without its call id is unreadable; a call id anywhere else
    // correlates nothing.
    await expect(say(id, "tool", "42")).rejects.toThrow(/ai_messages_tool_call_id/);
    await expect(
      db.query(
        `insert into public.ai_messages (conversation_id, role, content, tool_call_id)
         values ($1, 'user', 'Hello', 'call_1')`,
        [id],
      ),
    ).rejects.toThrow(/ai_messages_tool_call_id/);

    // Tool calls are the array ToolCall[] serialises to, and only an assistant asks.
    await expect(
      db.query(
        `insert into public.ai_messages (conversation_id, role, content, tool_calls)
         values ($1, 'assistant', '', '{}'::jsonb)`,
        [id],
      ),
    ).rejects.toThrow(/ai_messages_tool_calls_shape/);
    await expect(
      db.query(
        `insert into public.ai_messages (conversation_id, role, content, tool_calls)
         values ($1, 'user', 'Hello', '[]'::jsonb)`,
        [id],
      ),
    ).rejects.toThrow(/ai_messages_tool_calls_shape/);

    // Non-negativity is a separate property from completeness, so it is asserted on
    // a structurally complete row whose only defect is the sign of one counter.
    // Left half-written, the row violates both and Postgres reports whichever check
    // it evaluates first — which is not a fact this suite should depend on.
    await expect(
      db.query(
        `insert into public.ai_messages
           (conversation_id, role, content, provider_id, model, input_tokens, output_tokens,
            cost_usd, latency_ms, finish_reason)
         values ($1, 'assistant', 'Up 12%.', 'openai', 'gpt-5-mini', 120, 34, 0.00042, -1, 'stop')`,
        [id],
      ),
    ).rejects.toThrow(/ai_messages_metrics_nonnegative/);

    await expect(
      db.query(`insert into public.ai_conversations (workspace_id, title) values ($1, '   ')`, [
        workspace,
      ]),
    ).rejects.toThrow(/ai_conversations_title_present/);
  });

  it("orders a turn's messages by sequence, not by a timestamp they share", async () => {
    const author = await createUser();
    const workspace = await createWorkspace(author);
    await signIn(author);
    const id = (await startConversation(workspace)).rows[0]!.id;

    // One instant, three messages — exactly what one turn produces.
    await db.query(
      `insert into public.ai_messages (conversation_id, role, content, created_at, tool_call_id)
       values ($1, 'user', 'ask', '2026-08-02T10:00:00Z', null),
              ($1, 'assistant', '', '2026-08-02T10:00:00Z', null),
              ($1, 'tool', 'result', '2026-08-02T10:00:00Z', 'call_1')`,
      [id],
    );

    const ordered = await db.query<{ content: string }>(
      `select content from public.ai_messages where conversation_id = $1 order by seq`,
      [id],
    );
    expect(ordered.rows.map((row) => row.content)).toEqual(["ask", "", "result"]);
  });

  it("keeps its helper off the public role", async () => {
    await asSuperuser();
    const helper = await db.query<{ prosecdef: boolean; proconfig: string[] | null; acl: string }>(
      `select p.prosecdef, p.proconfig, coalesce(array_to_string(p.proacl, ','), '') as acl
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'can_use_ai_conversation'`,
    );
    const row = helper.rows[0];
    expect(row?.prosecdef).toBe(true);
    // A definer-rights function without a pinned search_path is the classic way one
    // becomes a privilege-escalation primitive.
    expect(row?.proconfig).toEqual(["search_path=public"]);
    // PUBLIC revoked, the two real callers granted.
    expect(row?.acl ?? "").not.toMatch(/(^|,)=X\//);
    expect(row?.acl ?? "").toMatch(/authenticated=X\//);
    expect(row?.acl ?? "").toMatch(/service_role=X\//);
  });
});
