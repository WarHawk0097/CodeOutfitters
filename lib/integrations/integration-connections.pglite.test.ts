import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { openTestDatabase, resetSchema } from "@/test/pglite-schema";

// Proves supabase/migrations/20260818000000_integration_connections.sql's RLS and
// column-grant hardening against real embedded Postgres — same pattern as
// lib/booking-lead-linkage.pglite.test.ts. Covers Section 11's A, B, C, E, F, I:
// cross-workspace read/write denial, authorized create/read, deterministic
// duplicate-connection dedup, disconnect state transition, and the credential column
// staying unreadable/unwritable-by-value to `authenticated`.
const MIGRATIONS = [
  "../../supabase/migrations/20260723_inquiry_backend.sql",
  "../../supabase/migrations/20260727_command_center_workspaces.sql",
  "../../supabase/migrations/20260818000000_integration_connections.sql",
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
let workspaceA: string;
let workspaceB: string;
let userA: string;
let userB: string;

async function asUser(userId: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  await db.exec("set role authenticated");
}

async function asAnon() {
  await db.exec("reset role");
  await db.exec("set role anon");
}

async function asVerifier() {
  await db.exec("reset role");
}

async function seedUser(id: string, email: string) {
  await asVerifier();
  await db.query(`insert into auth.users (id, email) values ($1, $2)`, [id, email]);
}

async function seedMembership(workspaceId: string, userId: string) {
  await asVerifier();
  await db.query(
    `insert into public.workspace_memberships (workspace_id, user_id, role, status) values ($1, $2, 'owner', 'active')`,
    [workspaceId, userId],
  );
}

beforeAll(async () => {
  db = await openTestDatabase();
}, 60_000);

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await resetSchema(db, { migrations: MIGRATIONS, authStub: AUTH_STUB });
  await asVerifier();

  const wsA = await db.query<{ id: string }>(
    `insert into public.workspaces (name, slug) values ('Workspace A', 'workspace-a-${randomUUID()}') returning id`,
  );
  const wsB = await db.query<{ id: string }>(
    `insert into public.workspaces (name, slug) values ('Workspace B', 'workspace-b-${randomUUID()}') returning id`,
  );
  workspaceA = wsA.rows[0]!.id;
  workspaceB = wsB.rows[0]!.id;

  userA = randomUUID();
  userB = randomUUID();
  await seedUser(userA, "a@example.test");
  await seedUser(userB, "b@example.test");
  await seedMembership(workspaceA, userA);
  await seedMembership(workspaceB, userB);
}, 60_000);

async function insertConnection(workspaceId: string, accountId: string, createdBy: string) {
  return db.query<{ id: string }>(
    `insert into public.integration_connections
       (workspace_id, provider, provider_account_id, credential_ciphertext, connected_at, created_by)
     values ($1, 'local_test', $2, 'v1.iv.tag.ct', now(), $3)
     returning id`,
    [workspaceId, accountId, createdBy],
  );
}

describe("integration_connections RLS + grants", () => {
  it("C: an authorized member can create and read a connection through the authenticated role", async () => {
    await asUser(userA);
    const inserted = await db.query<{ id: string }>(
      `insert into public.integration_connections
         (workspace_id, provider, provider_account_id, credential_ciphertext, connected_at)
       values ($1, 'local_test', 'acct-1', 'v1.iv.tag.ct', now())
       returning id, status`,
      [workspaceA],
    );
    expect(inserted.rows).toHaveLength(1);

    const read = await db.query<{ id: string; status: string }>(
      `select id, status from public.integration_connections where workspace_id = $1`,
      [workspaceA],
    );
    expect(read.rows).toHaveLength(1);
    expect(read.rows[0]!.status).toBe("connected");
  });

  it("A: Workspace A cannot read Workspace B's connection", async () => {
    await insertConnection(workspaceB, "acct-b", userB);
    await asUser(userA);
    const read = await db.query(`select id from public.integration_connections where workspace_id = $1`, [
      workspaceB,
    ]);
    expect(read.rows).toHaveLength(0);
  });

  it("B: Workspace A cannot modify Workspace B's connection", async () => {
    const created = await insertConnection(workspaceB, "acct-b", userB);
    const connectionId = created.rows[0]!.id;

    await asUser(userA);
    const updated = await db.query(`update public.integration_connections set status = 'error' where id = $1`, [
      connectionId,
    ]);
    expect(updated.affectedRows ?? 0).toBe(0);

    await asVerifier();
    const row = await db.query<{ status: string }>(`select status from public.integration_connections where id = $1`, [
      connectionId,
    ]);
    expect(row.rows[0]!.status).toBe("connected");
  });

  it("D: credential_ciphertext is never selectable by the authenticated role", async () => {
    await insertConnection(workspaceA, "acct-1", userA);
    await asUser(userA);
    await expect(
      db.query(`select credential_ciphertext from public.integration_connections where workspace_id = $1`, [
        workspaceA,
      ]),
    ).rejects.toThrow(/permission denied/i);
  });

  it("E: a duplicate (workspace, provider, account) insert is rejected — dedup is an application-level update, not a second row", async () => {
    await asUser(userA);
    await db.query(
      `insert into public.integration_connections
         (workspace_id, provider, provider_account_id, credential_ciphertext, connected_at)
       values ($1, 'local_test', 'acct-1', 'v1.iv.tag.ct', now())`,
      [workspaceA],
    );
    await expect(
      db.query(
        `insert into public.integration_connections
           (workspace_id, provider, provider_account_id, credential_ciphertext, connected_at)
         values ($1, 'local_test', 'acct-1', 'v1.iv.tag.ct', now())`,
        [workspaceA],
      ),
    ).rejects.toThrow(/duplicate key|unique constraint/i);
  });

  it("F: disconnect (status -> disconnected) clears the credential and requires disconnected_at", async () => {
    const created = await insertConnection(workspaceA, "acct-1", userA);
    const connectionId = created.rows[0]!.id;

    await asUser(userA);
    await expect(
      db.query(`update public.integration_connections set status = 'disconnected' where id = $1`, [connectionId]),
    ).rejects.toThrow(/check constraint|integration_connections_disconnected_has_/i);

    await db.query(
      `update public.integration_connections
         set status = 'disconnected', credential_ciphertext = null, disconnected_at = now()
       where id = $1`,
      [connectionId],
    );
    const row = await db.query<{ status: string; disconnected_at: string | null }>(
      `select status, disconnected_at from public.integration_connections where id = $1`,
      [connectionId],
    );
    expect(row.rows[0]!.status).toBe("disconnected");
    expect(row.rows[0]!.disconnected_at).not.toBeNull();
  });

  it("I: anon has no access to integration_connections or its events", async () => {
    await insertConnection(workspaceA, "acct-1", userA);
    await asAnon();
    await expect(db.query(`select id from public.integration_connections`)).rejects.toThrow(/permission denied/i);
    await expect(db.query(`select id from public.integration_connection_events`)).rejects.toThrow(
      /permission denied/i,
    );
  });

  it("authenticated cannot DELETE or TRUNCATE integration_connections — the table-level revoke covers authenticated, not just public/anon", async () => {
    const created = await insertConnection(workspaceA, "acct-1", userA);
    await asUser(userA);
    await expect(
      db.query(`delete from public.integration_connections where id = $1`, [created.rows[0]!.id]),
    ).rejects.toThrow(/permission denied/i);
    await expect(db.query(`truncate public.integration_connections`)).rejects.toThrow(/permission denied/i);
  });

  it("authenticated cannot DELETE or TRUNCATE integration_connection_events", async () => {
    await insertConnection(workspaceA, "acct-1", userA);
    await asUser(userA);
    await expect(db.query(`delete from public.integration_connection_events`)).rejects.toThrow(
      /permission denied/i,
    );
    await expect(db.query(`truncate public.integration_connection_events`)).rejects.toThrow(
      /permission denied/i,
    );
  });

  it("I: an event's workspace_id is trigger-derived, not caller-supplied, and cross-workspace event writes are denied", async () => {
    const created = await insertConnection(workspaceA, "acct-1", userA);
    const connectionId = created.rows[0]!.id;

    await asUser(userA);
    await db.query(
      `insert into public.integration_connection_events (connection_id, workspace_id, event_type)
       values ($1, $2, 'connected')`,
      [connectionId, workspaceB],
    );
    const event = await db.query<{ workspace_id: string }>(
      `select workspace_id from public.integration_connection_events where connection_id = $1`,
      [connectionId],
    );
    expect(event.rows[0]!.workspace_id).toBe(workspaceA);

    await asUser(userB);
    await expect(
      db.query(`insert into public.integration_connection_events (connection_id, workspace_id, event_type)
                 values ($1, $2, 'connected')`, [connectionId, workspaceB]),
    ).rejects.toThrow(/permission denied|new row violates row-level security/i);
  });
});
