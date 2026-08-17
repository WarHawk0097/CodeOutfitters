import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { openTestDatabase, resetSchema } from "@/test/pglite-schema";

// Proves supabase/migrations/20260819000000_oauth_states.sql's grants/RLS and the
// atomic one-time-use + expiry semantics lib/integrations/oauth-state.ts's
// consumeOAuthState() relies on, against real embedded Postgres — same pattern as
// integration-connections.pglite.test.ts. Covers Section 19's C/D/E: state generated
// and validated, a tampered (wrong) nonce rejected, an expired nonce rejected.
const MIGRATIONS = [
  "../../supabase/migrations/20260723_inquiry_backend.sql",
  "../../supabase/migrations/20260727_command_center_workspaces.sql",
  "../../supabase/migrations/20260818000000_integration_connections.sql",
  "../../supabase/migrations/20260819000000_oauth_states.sql",
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
let userA: string;

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

beforeAll(async () => {
  db = await openTestDatabase();
}, 60_000);

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await resetSchema(db, { migrations: MIGRATIONS, authStub: AUTH_STUB });
  await asVerifier();

  const ws = await db.query<{ id: string }>(
    `insert into public.workspaces (name, slug) values ('Workspace A', 'workspace-a-${randomUUID()}') returning id`,
  );
  workspaceA = ws.rows[0]!.id;

  userA = randomUUID();
  await db.query(`insert into auth.users (id, email) values ($1, 'a@example.test')`, [userA]);
  await db.query(
    `insert into public.workspace_memberships (workspace_id, user_id, role, status) values ($1, $2, 'owner', 'active')`,
    [workspaceA, userA],
  );
}, 60_000);

async function insertState(nonce: string, expiresAt: string) {
  return db.query<{ id: string }>(
    `insert into public.oauth_states (workspace_id, user_id, provider, nonce, expires_at)
     values ($1, $2, 'google_calendar', $3, $4)
     returning id`,
    [workspaceA, userA, nonce, expiresAt],
  );
}

const FUTURE = new Date(Date.now() + 10 * 60 * 1000).toISOString();
const PAST = new Date(Date.now() - 10 * 60 * 1000).toISOString();

describe("oauth_states grants + RLS", () => {
  it("authenticated has no access at all — every read/write goes through the service-role client", async () => {
    await insertState("nonce-1", FUTURE);
    await asUser(userA);
    await expect(db.query(`select id from public.oauth_states`)).rejects.toThrow(/permission denied/i);
    await expect(
      db.query(
        `insert into public.oauth_states (workspace_id, user_id, provider, nonce, expires_at)
         values ($1, $2, 'google_calendar', 'nonce-2', $3)`,
        [workspaceA, userA, FUTURE],
      ),
    ).rejects.toThrow(/permission denied/i);
  });

  it("anon has no access at all", async () => {
    await insertState("nonce-1", FUTURE);
    await asAnon();
    await expect(db.query(`select id from public.oauth_states`)).rejects.toThrow(/permission denied/i);
  });

  it("C: a matching, unexpired, unconsumed nonce is found and consumable — the state-validation path", async () => {
    await insertState("nonce-1", FUTURE);
    await asVerifier();
    const consumed = await db.query<{ workspace_id: string; user_id: string }>(
      `update public.oauth_states set consumed_at = now()
       where nonce = $1 and provider = 'google_calendar' and consumed_at is null and expires_at > now()
       returning workspace_id, user_id`,
      ["nonce-1"],
    );
    expect(consumed.rows).toHaveLength(1);
    expect(consumed.rows[0]!.workspace_id).toBe(workspaceA);
    expect(consumed.rows[0]!.user_id).toBe(userA);
  });

  it("D: a tampered (wrong) nonce matches no row — rejected, not a signature failure", async () => {
    await insertState("nonce-1", FUTURE);
    await asVerifier();
    const consumed = await db.query(
      `update public.oauth_states set consumed_at = now()
       where nonce = $1 and provider = 'google_calendar' and consumed_at is null and expires_at > now()
       returning id`,
      ["nonce-does-not-exist"],
    );
    expect(consumed.rows).toHaveLength(0);
  });

  it("a nonce can only ever be consumed once — the second use finds no row, not a race", async () => {
    await insertState("nonce-1", FUTURE);
    await asVerifier();
    const first = await db.query(
      `update public.oauth_states set consumed_at = now()
       where nonce = $1 and provider = 'google_calendar' and consumed_at is null and expires_at > now()
       returning id`,
      ["nonce-1"],
    );
    expect(first.rows).toHaveLength(1);

    const second = await db.query(
      `update public.oauth_states set consumed_at = now()
       where nonce = $1 and provider = 'google_calendar' and consumed_at is null and expires_at > now()
       returning id`,
      ["nonce-1"],
    );
    expect(second.rows).toHaveLength(0);
  });

  it("E: an expired nonce is rejected even though it was never consumed", async () => {
    await insertState("nonce-1", PAST);
    await asVerifier();
    const consumed = await db.query(
      `update public.oauth_states set consumed_at = now()
       where nonce = $1 and provider = 'google_calendar' and consumed_at is null and expires_at > now()
       returning id`,
      ["nonce-1"],
    );
    expect(consumed.rows).toHaveLength(0);
  });

  it("a nonce issued for one provider cannot be consumed for another", async () => {
    await insertState("nonce-1", FUTURE);
    await asVerifier();
    const consumed = await db.query(
      `update public.oauth_states set consumed_at = now()
       where nonce = $1 and provider = 'gmail' and consumed_at is null and expires_at > now()
       returning id`,
      ["nonce-1"],
    );
    expect(consumed.rows).toHaveLength(0);
  });
});
