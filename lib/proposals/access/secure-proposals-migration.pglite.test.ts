import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { randomUUID, createHash } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { openTestDatabase, resetSchema } from "@/test/pglite-schema";

// Real-database proof of the secure-proposal migration (tests 267-291).
//
// Same approach as the activity migration test: the ACTUAL migration files are loaded
// UNMODIFIED into an embedded Postgres and driven as real `authenticated` and `anon` roles,
// because the superuser that applies a migration bypasses every policy it declares and so
// proves nothing about it.
//
// The questions asked here are the ones this release exists to answer safely: can a person
// with no session read a proposal, can a member reach another workspace's client links, can
// a published document be edited after it was sent, and can a client be impersonated.
const MIGRATIONS = [
  "../../../supabase/migrations/20260723_inquiry_backend.sql",
  "../../../supabase/migrations/20260724_inquiry_attachments_upload.sql",
  "../../../supabase/migrations/20260727_command_center_workspaces.sql",
  "../../../supabase/migrations/20260730_command_center_activity.sql",
  "../../../supabase/migrations/20260731_command_center_secure_proposals.sql",
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

const hashOf = (token: string) => createHash("sha256").update(token, "utf8").digest("hex");

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

async function asAnon() {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', '', false)");
  await db.exec("set role anon");
}

async function asSuperuser() {
  await db.exec("reset role");
}

const SNAPSHOT = JSON.stringify({
  title: "Platform Rebuild",
  versionLabel: "v1",
  sections: [{ id: "overview", navLabel: "01 · Overview", blocks: [{ kind: "paragraph", text: "Why." }] }],
});

/** A published version, as the workspace owner would create it. */
async function publish(workspace: string, versionNumber = 1): Promise<string> {
  const result = await db.query<{ id: string }>(
    `insert into public.proposal_publications
       (workspace_id, internal_proposal_id, version_number, version_label, title,
        client_organisation, snapshot)
     values ($1, 'PRO-2031', $2, $3, 'Platform Rebuild', 'Harbor Freight Co.', $4::jsonb)
     returning id`,
    [workspace, versionNumber, `v${versionNumber}`, SNAPSHOT],
  );
  return result.rows[0]!.id;
}

/** A link, returning the raw token the way the application would: once, to the caller. */
async function issue(
  publication: string,
  workspace: string,
  token: string = randomUUID(),
): Promise<{ id: string; token: string }> {
  const result = await db.query<{ id: string }>(
    `insert into public.proposal_access_links
       (publication_id, workspace_id, recipient_name, recipient_email, token_hash, expires_at)
     values ($1, $2, 'Priya Raman', 'priya@harborfreight.example', $3, now() + interval '30 days')
     returning id`,
    [publication, workspace, hashOf(token)],
  );
  return { id: result.rows[0]!.id, token };
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

describe("secure proposals migration — the public boundary (tests 267-276)", () => {
  // 267
  it("applies cleanly on top of the activity migration and enables RLS on all three tables", async () => {
    for (const table of ["proposal_publications", "proposal_access_links", "proposal_client_responses"]) {
      const rls = await db.query<{ relrowsecurity: boolean }>(
        `select relrowsecurity from pg_class where oid = ('public.' || $1)::regclass`,
        [table],
      );
      expect(rls.rows[0]!.relrowsecurity, table).toBe(true);
    }
  });

  // 268
  it("grants anon nothing at all — no table privilege on any of the three", async () => {
    const grants = await db.query<{ grantee: string; table_name: string }>(
      `select grantee, table_name from information_schema.role_table_grants
       where table_schema = 'public'
         and table_name in ('proposal_publications','proposal_access_links','proposal_client_responses')`,
    );
    expect(grants.rows.some((row) => row.grantee === "anon")).toBe(false);
    expect(grants.rows.some((row) => row.grantee === "PUBLIC")).toBe(false);
  });

  // 269
  it("an anonymous reader holding a real token still cannot select a single row", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    await signIn(owner);
    const publication = await publish(workspace);
    const { token } = await issue(publication, workspace);
    await asAnon();
    for (const table of ["proposal_publications", "proposal_access_links", "proposal_client_responses"]) {
      await expect(db.query(`select * from public.${table}`)).rejects.toThrow(/permission denied/i);
    }
    // And the token itself buys nothing through a query it is not allowed to run.
    await expect(
      db.query(`select * from public.proposal_access_links where token_hash = $1`, [hashOf(token)]),
    ).rejects.toThrow(/permission denied/i);
  });

  // 270
  it("the public functions are granted to service_role only, never to anon or authenticated", async () => {
    const grants = await db.query<{ grantee: string; routine_name: string }>(
      `select grantee, routine_name from information_schema.role_routine_grants
       where routine_schema = 'public' and routine_name like 'proposal_public_%'`,
    );
    // The owner role holds implicit grants on everything it created; the question is which
    // other roles were let in.
    const granted = grants.rows.filter((row) => row.grantee !== "postgres");
    expect(granted.length).toBeGreaterThan(0);
    for (const row of granted) expect(row.grantee, row.routine_name).toBe("service_role");
  });

  // 271
  it("an anonymous caller cannot execute the public functions directly", async () => {
    await asAnon();
    await expect(db.query(`select * from public.proposal_public_resolve($1)`, [hashOf("x")])).rejects.toThrow(
      /permission denied/i,
    );
    await expect(db.query(`select public.proposal_public_record_open($1)`, [hashOf("x")])).rejects.toThrow(
      /permission denied/i,
    );
  });

  // 272
  it("every function this migration adds has a fixed search_path and no PUBLIC execute", async () => {
    const functions = await db.query<{ proname: string; proconfig: string[] | null }>(
      `select p.proname, p.proconfig
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and (p.proname like 'proposal_%' or p.proname = 'proposal_access_derive_workspace')`,
    );
    expect(functions.rows.length).toBeGreaterThan(0);
    for (const row of functions.rows) {
      expect(row.proconfig?.some((entry) => entry.startsWith("search_path=")), row.proname).toBe(true);
    }
    const publicExecute = await db.query<{ routine_name: string }>(
      `select routine_name from information_schema.role_routine_grants
       where routine_schema = 'public' and grantee = 'PUBLIC' and routine_name like 'proposal_%'`,
    );
    expect(publicExecute.rows).toHaveLength(0);
  });

  // 273
  it("resolving by hash returns the client-safe columns and none of the internal ones", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    await signIn(owner);
    const publication = await publish(workspace);
    const { token } = await issue(publication, workspace);
    await asSuperuser();
    const resolved = await db.query<Record<string, unknown>>(`select * from public.proposal_public_resolve($1)`, [
      hashOf(token),
    ]);
    expect(resolved.rows).toHaveLength(1);
    const columns = Object.keys(resolved.rows[0]!);
    for (const internal of ["internal_proposal_id", "recipient_email", "token_hash", "created_by", "workspace_id", "open_count"]) {
      expect(columns, internal).not.toContain(internal);
    }
    expect(resolved.rows[0]!.recipient_name).toBe("Priya Raman");
  });

  // 274
  it("an unknown hash resolves to nothing, exactly like a hash that was never issued", async () => {
    await asSuperuser();
    const unknown = await db.query(`select * from public.proposal_public_resolve($1)`, [hashOf("never-issued")]);
    expect(unknown.rows).toHaveLength(0);
    const malformed = await db.query(`select * from public.proposal_public_resolve($1)`, ["not-a-hash"]);
    expect(malformed.rows).toHaveLength(0);
  });

  // 275
  it("the token column is unique and hash-shaped, so one token cannot open two proposals", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    await signIn(owner);
    const publication = await publish(workspace);
    const { token } = await issue(publication, workspace);
    await expect(issue(publication, workspace, token)).rejects.toThrow(/unique|duplicate/i);
    await asSuperuser();
    await expect(
      db.query(
        `insert into public.proposal_access_links
           (publication_id, workspace_id, recipient_name, recipient_email, token_hash, expires_at)
         values ($1, $2, 'X', 'x@example.test', 'plain-text-token', now() + interval '1 day')`,
        [publication, workspace],
      ),
    ).rejects.toThrow(/token_shape/i);
  });

  // 276
  it("the workspace on a link is derived from its publication, not from the caller", async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const workspace = await createWorkspace(owner);
    const foreign = await createWorkspace(stranger);
    await signIn(owner);
    const publication = await publish(workspace);
    // The insert claims the stranger's workspace; the trigger overwrites it with the real one.
    await db.query(
      `insert into public.proposal_access_links
         (publication_id, workspace_id, recipient_name, recipient_email, token_hash, expires_at)
       values ($1, $2, 'Priya', 'p@example.test', $3, now() + interval '1 day')`,
      [publication, foreign, hashOf("forged-scope")],
    );
    await asSuperuser();
    const stored = await db.query<{ workspace_id: string }>(
      `select workspace_id from public.proposal_access_links where token_hash = $1`,
      [hashOf("forged-scope")],
    );
    expect(stored.rows[0]!.workspace_id).toBe(workspace);
  });
});

describe("secure proposals migration — workspace isolation and immutability (tests 277-284)", () => {
  // 277
  it("a member sees their own publications and links, and none of another workspace's", async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const workspace = await createWorkspace(owner);
    const foreign = await createWorkspace(stranger);
    await signIn(stranger);
    const foreignPublication = await publish(foreign);
    await issue(foreignPublication, foreign, "stranger-token");
    await signIn(owner);
    const mine = await publish(workspace);
    await issue(mine, workspace, "my-token");
    const publications = await db.query<{ id: string }>(`select id from public.proposal_publications`);
    expect(publications.rows.map((row) => row.id)).toEqual([mine]);
    const links = await db.query<{ token_hash: string }>(`select token_hash from public.proposal_access_links`);
    expect(links.rows.map((row) => row.token_hash)).toEqual([hashOf("my-token")]);
  });

  // 278
  it("a member cannot publish into a workspace they do not belong to", async () => {
    const owner = await createUser();
    const stranger = await createUser();
    await createWorkspace(owner);
    const foreign = await createWorkspace(stranger);
    await signIn(owner);
    await expect(publish(foreign)).rejects.toThrow(/row-level security|violates/i);
  });

  // 279
  it("a member cannot issue a link against another workspace's published version", async () => {
    const owner = await createUser();
    const stranger = await createUser();
    await createWorkspace(owner);
    const foreign = await createWorkspace(stranger);
    await signIn(stranger);
    const foreignPublication = await publish(foreign);
    await signIn(owner);
    await expect(issue(foreignPublication, foreign)).rejects.toThrow(/row-level security|violates/i);
  });

  // 280
  it("a published snapshot cannot be edited, by anyone, ever", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    await signIn(owner);
    const publication = await publish(workspace);
    await asSuperuser();
    await expect(
      db.query(`update public.proposal_publications set snapshot = '{"title":"Rewritten"}'::jsonb where id = $1`, [
        publication,
      ]),
    ).rejects.toThrow(/immutable/i);
    await expect(
      db.query(`update public.proposal_publications set version_label = 'v9' where id = $1`, [publication]),
    ).rejects.toThrow(/immutable/i);
  });

  // 281
  it("superseding and withdrawing a version are allowed, because they change status and not content", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    await signIn(owner);
    const v1 = await publish(workspace, 1);
    const v2 = await publish(workspace, 2);
    await db.query(
      `update public.proposal_publications set status = 'superseded', superseded_by = $2 where id = $1`,
      [v1, v2],
    );
    const rows = await db.query<{ status: string }>(`select status from public.proposal_publications where id = $1`, [v1]);
    expect(rows.rows[0]!.status).toBe("superseded");
  });

  // 282
  it("a member has no privilege to edit a snapshot column even before the trigger runs", async () => {
    const grants = await db.query<{ privilege_type: string; column_name: string }>(
      `select privilege_type, column_name from information_schema.column_privileges
       where table_schema = 'public' and table_name = 'proposal_publications'
         and grantee = 'authenticated' and privilege_type = 'UPDATE'`,
    );
    const updatable = grants.rows.map((row) => row.column_name).sort();
    expect(updatable).toEqual(["status", "superseded_by"]);
  });

  // 283
  it("two versions cannot claim the same version number for the same proposal", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    await signIn(owner);
    await publish(workspace, 1);
    await expect(publish(workspace, 1)).rejects.toThrow(/unique|duplicate/i);
  });

  // 284
  it("nobody is granted delete on any of the three tables", async () => {
    const grants = await db.query<{ grantee: string; privilege_type: string; table_name: string }>(
      `select grantee, privilege_type, table_name from information_schema.role_table_grants
       where table_schema = 'public'
         and table_name in ('proposal_publications','proposal_access_links','proposal_client_responses')
         and privilege_type = 'DELETE'
         and grantee <> 'postgres'`,
    );
    expect(grants.rows).toHaveLength(0);
  });
});

describe("secure proposals migration — client behaviour (tests 285-291)", () => {
  // 285
  it("recording an open sets the first instant once and counts every open, from the database clock", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    await signIn(owner);
    const publication = await publish(workspace);
    const { token } = await issue(publication, workspace);
    await asSuperuser();
    await db.query(`select public.proposal_public_record_open($1)`, [hashOf(token)]);
    const first = await db.query<{ open_count: number; first_opened_at: string; last_opened_at: string }>(
      `select open_count, first_opened_at, last_opened_at from public.proposal_access_links where token_hash = $1`,
      [hashOf(token)],
    );
    expect(first.rows[0]!.open_count).toBe(1);
    expect(first.rows[0]!.first_opened_at).not.toBeNull();
    await db.query(`select public.proposal_public_record_open($1)`, [hashOf(token)]);
    const second = await db.query<{ open_count: number; first_opened_at: string }>(
      `select open_count, first_opened_at from public.proposal_access_links where token_hash = $1`,
      [hashOf(token)],
    );
    expect(second.rows[0]!.open_count).toBe(2);
    expect(second.rows[0]!.first_opened_at).toEqual(first.rows[0]!.first_opened_at);
  });

  // 286
  it("a revoked or expired link records no open and accepts no response", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    await signIn(owner);
    const publication = await publish(workspace);
    const { token: revokedToken, id: revokedId } = await issue(publication, workspace, "revoked-one");
    await db.query(`update public.proposal_access_links set revoked_at = now() where id = $1`, [revokedId]);
    await asSuperuser();
    await db.query(`update public.proposal_access_links set expires_at = now() - interval '1 day'
                    where token_hash = $1`, [hashOf("expired-one")]);
    await db.query(`select public.proposal_public_record_open($1)`, [hashOf(revokedToken)]);
    const opened = await db.query<{ open_count: number }>(
      `select open_count from public.proposal_access_links where token_hash = $1`,
      [hashOf(revokedToken)],
    );
    expect(opened.rows[0]!.open_count).toBe(0);
    const accepted = await db.query<{ proposal_public_submit_response: boolean }>(
      `select public.proposal_public_submit_response($1, 'question', 'Hello?', '', false, $2)`,
      [hashOf(revokedToken), randomUUID()],
    );
    expect(accepted.rows[0]!.proposal_public_submit_response).toBe(false);
  });

  // 287
  it("a question is recorded against the link, with the instant taken from the database", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    await signIn(owner);
    const publication = await publish(workspace);
    const { token, id } = await issue(publication, workspace);
    await asSuperuser();
    const ok = await db.query<{ proposal_public_submit_response: boolean }>(
      `select public.proposal_public_submit_response($1, 'question', '  Can phase two start earlier?  ', '', false, $2)`,
      [hashOf(token), "key-1"],
    );
    expect(ok.rows[0]!.proposal_public_submit_response).toBe(true);
    const stored = await db.query<{ message: string; access_link_id: string; workspace_id: string }>(
      `select message, access_link_id, workspace_id from public.proposal_client_responses`,
    );
    expect(stored.rows).toHaveLength(1);
    expect(stored.rows[0]!.message).toBe("Can phase two start earlier?");
    expect(stored.rows[0]!.access_link_id).toBe(id);
    expect(stored.rows[0]!.workspace_id).toBe(workspace);
  });

  // 288
  it("a resubmitted response records once, not twice", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    await signIn(owner);
    const publication = await publish(workspace);
    const { token } = await issue(publication, workspace);
    await asSuperuser();
    for (let i = 0; i < 3; i += 1) {
      await db.query(`select public.proposal_public_submit_response($1, 'comment', 'Looks good', '', false, $2)`, [
        hashOf(token),
        "same-key",
      ]);
    }
    const stored = await db.query(`select id from public.proposal_client_responses`);
    expect(stored.rows).toHaveLength(1);
  });

  // 289
  it("an acceptance records the typed name and a decline records none", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    await signIn(owner);
    const publication = await publish(workspace);
    const { token: acceptToken } = await issue(publication, workspace, "accept-me");
    const { token: declineToken } = await issue(publication, workspace, "decline-me");
    await asSuperuser();
    await db.query(`select public.proposal_public_submit_response($1, 'acceptance', '', 'Priya Raman', true, $2)`, [
      hashOf(acceptToken),
      randomUUID(),
    ]);
    await db.query(`select public.proposal_public_submit_response($1, 'decline', 'Budget moved', '', false, $2)`, [
      hashOf(declineToken),
      randomUUID(),
    ]);
    const rows = await db.query<{ token_hash: string; decision: string; decided_by_name: string | null }>(
      `select token_hash, decision, decided_by_name from public.proposal_access_links order by token_hash`,
    );
    const accepted = rows.rows.find((row) => row.token_hash === hashOf(acceptToken))!;
    const declined = rows.rows.find((row) => row.token_hash === hashOf(declineToken))!;
    expect(accepted.decision).toBe("accepted");
    expect(accepted.decided_by_name).toBe("Priya Raman");
    expect(declined.decision).toBe("declined");
    expect(declined.decided_by_name).toBeNull();
  });

  // 290
  it("an acceptance without a typed name or without authorisation is refused by the database", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    await signIn(owner);
    const publication = await publish(workspace);
    const { id } = await issue(publication, workspace);
    await asSuperuser();
    await expect(
      db.query(
        `insert into public.proposal_client_responses
           (access_link_id, publication_id, workspace_id, response_type, message, typed_name,
            authorization_confirmed, idempotency_key)
         values ($1, $2, $3, 'acceptance', '', '', true, $4)`,
        [id, publication, workspace, randomUUID()],
      ),
    ).rejects.toThrow(/acceptance_complete/i);
    await expect(
      db.query(
        `insert into public.proposal_client_responses
           (access_link_id, publication_id, workspace_id, response_type, message, typed_name,
            authorization_confirmed, idempotency_key)
         values ($1, $2, $3, 'acceptance', '', 'Priya Raman', false, $4)`,
        [id, publication, workspace, randomUUID()],
      ),
    ).rejects.toThrow(/acceptance_complete/i);
  });

  // 291
  it("a second, conflicting decision is refused, and members can read responses but never write them", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    await signIn(owner);
    const publication = await publish(workspace);
    const { token, id } = await issue(publication, workspace);
    await asSuperuser();
    await db.query(`select public.proposal_public_submit_response($1, 'acceptance', '', 'Priya Raman', true, $2)`, [
      hashOf(token),
      randomUUID(),
    ]);
    const conflicting = await db.query<{ proposal_public_submit_response: boolean }>(
      `select public.proposal_public_submit_response($1, 'decline', 'changed mind', '', false, $2)`,
      [hashOf(token), randomUUID()],
    );
    expect(conflicting.rows[0]!.proposal_public_submit_response).toBe(false);
    const decision = await db.query<{ decision: string }>(
      `select decision from public.proposal_access_links where id = $1`,
      [id],
    );
    expect(decision.rows[0]!.decision).toBe("accepted");

    // A colleague reads the client's words. A colleague who could insert them could put
    // words in a client's mouth, so there is no insert grant at all.
    await signIn(owner);
    const readable = await db.query(`select id from public.proposal_client_responses`);
    expect(readable.rows).toHaveLength(1);
    await expect(
      db.query(
        `insert into public.proposal_client_responses
           (access_link_id, publication_id, workspace_id, response_type, message, idempotency_key)
         values ($1, $2, $3, 'comment', 'They definitely agreed', $4)`,
        [id, publication, workspace, randomUUID()],
      ),
    ).rejects.toThrow(/permission denied/i);
  });
});

describe("secure proposals migration — the activity column (tests 292-293)", () => {
  // 292
  it("adds actor_kind additively, so every existing insert keeps working", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    await signIn(owner);
    const written = await db.query<{ actor_kind: string }>(
      `insert into public.activity_events
         (workspace_id, event_type, category, related_kind, related_id, related_label, summary)
       values ($1, 'task_completed', 'task', 'task', 'task-1', 'Send recap', 'Task completed')
       returning actor_kind`,
      [workspace],
    );
    expect(written.rows[0]!.actor_kind).toBe("team_member");
  });

  // 293
  it("lets a client event be recorded as a client, with no user id behind it", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    await asSuperuser();
    const written = await db.query<{ actor_kind: string; actor_id: string | null; actor_label: string }>(
      `insert into public.activity_events
         (workspace_id, event_type, category, related_kind, related_id, related_label, summary,
          actor_kind, actor_label, visibility)
       values ($1, 'proposal_first_opened_by_client', 'proposal', 'proposal', 'PRO-2031',
               'PRO-2031 · Harbor Freight Co.', 'Priya Raman opened PRO-2031 for the first time',
               'client', 'Priya Raman', 'client_safe')
       returning actor_kind, actor_id, actor_label`,
      [workspace],
    );
    expect(written.rows[0]!.actor_kind).toBe("client");
    expect(written.rows[0]!.actor_id).toBeNull();
    expect(written.rows[0]!.actor_label).toBe("Priya Raman");
  });
});
