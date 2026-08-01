import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { openTestDatabase, resetSchema } from "@/test/pglite-schema";

// Real-database proof of the controlled owner bootstrap (Phase 11, tests 24-35).
// Asserting on the SQL text would prove nothing about behaviour, so this loads
// the ACTUAL migration files UNMODIFIED into an embedded Postgres (PGlite, no
// Docker) and drives public.bootstrap_initial_workspace_owner() as a real
// authenticated user.
//
// PGlite has no GoTrue, so the two things Supabase supplies are stubbed with the
// same shapes the function reads: an auth.users table and an auth.uid() that
// resolves the current request's subject. Everything under test — the allowlist,
// the preconditions, the single-use consumption, the membership row — is the
// unmodified production migration.

const MIGRATIONS = [
  "../../supabase/migrations/20260723_inquiry_backend.sql",
  "../../supabase/migrations/20260724_inquiry_attachments_upload.sql",
  "../../supabase/migrations/20260727_command_center_workspaces.sql",
  "../../supabase/migrations/20260729010000_owner_bootstrap.sql",
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
`;

let db: PGlite;

type NewUser = {
  email: string | null;
  provider?: string;
  confirmed?: boolean;
};

async function createUser({ email, provider = "google", confirmed = true }: NewUser) {
  const id = randomUUID();
  await db.query(
    `insert into auth.users (id, email, email_confirmed_at, raw_app_meta_data)
     values ($1, $2, $3, $4::jsonb)`,
    [id, email, confirmed ? new Date().toISOString() : null, JSON.stringify({ provider })],
  );
  return id;
}

/** Run the next statements as this authenticated user (auth.uid() resolves to it). */
async function signIn(userId: string | null) {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? ""]);
}

async function bootstrap() {
  return db.query("select * from public.bootstrap_initial_workspace_owner()");
}

async function activeOwners(): Promise<number> {
  const r = await db.query<{ n: number }>(
    `select count(*)::int as n from public.workspace_memberships
     where role = 'owner' and status = 'active'`,
  );
  return r.rows[0]!.n;
}

async function memberships(): Promise<number> {
  const r = await db.query<{ n: number }>(
    "select count(*)::int as n from public.workspace_memberships",
  );
  return r.rows[0]!.n;
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

describe("owner bootstrap — seed", () => {
  it("arms exactly one allowlist entry for the CodeOutfitters workspace", async () => {
    const r = await db.query<{
      normalized_email: string;
      expected_name: string;
      expected_provider: string;
      consumed_at: string | null;
      slug: string;
    }>(
      `select b.normalized_email, b.expected_name, b.expected_provider, b.consumed_at, w.slug
       from public.workspace_owner_bootstrap b
       join public.workspaces w on w.id = b.workspace_id`,
    );
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]).toMatchObject({
      normalized_email: "marc@gmail.com",
      expected_name: "Marc Bryce",
      expected_provider: "google",
      consumed_at: null,
      slug: "codeoutfitters",
    });
    // Nobody owns the workspace until the bootstrap is actually consumed.
    expect(await memberships()).toBe(0);
  });

  // 24
  it("stores the owner email already normalized, and the check constraint enforces it", async () => {
    await expect(
      db.query(
        `insert into public.workspace_owner_bootstrap
           (workspace_id, normalized_email, expected_name, expected_provider)
         select id, '  Marc@Gmail.com ', 'Marc Bryce', 'google' from public.workspaces limit 1`,
      ),
    ).rejects.toThrow();
  });
});

describe("owner bootstrap — who may consume it", () => {
  // 25, 33, 34
  it("lets a verified Google identity for Marc claim owner, with the allowlisted name", async () => {
    const marc = await createUser({ email: "marc@gmail.com" });
    await signIn(marc);

    const result = await bootstrap();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ role: "owner", status: "active", user_id: marc });

    const profile = await db.query<{ full_name: string; email: string }>(
      "select full_name, email from public.profiles where id = $1",
      [marc],
    );
    expect(profile.rows[0]).toMatchObject({
      full_name: "Marc Bryce",
      email: "marc@gmail.com",
    });
    expect(await activeOwners()).toBe(1);
  });

  // 24
  it("normalizes the authenticated email before comparing (case and surrounding space)", async () => {
    const marc = await createUser({ email: "  MARC@Gmail.COM " });
    await signIn(marc);
    const result = await bootstrap();
    expect(result.rows[0]).toMatchObject({ role: "owner", user_id: marc });
  });

  // 26
  it("rejects an unverified email", async () => {
    const marc = await createUser({ email: "marc@gmail.com", confirmed: false });
    await signIn(marc);
    await expect(bootstrap()).rejects.toThrow(/owner_bootstrap_denied/);
    expect(await memberships()).toBe(0);
  });

  // 27, 35
  it("rejects a different email, and grants that user no membership at all", async () => {
    const other = await createUser({ email: "someone@codeoutfitters.com" });
    await signIn(other);
    await expect(bootstrap()).rejects.toThrow(/owner_bootstrap_denied/);
    expect(await memberships()).toBe(0);
  });

  // 28
  it("rejects the right email arriving through the wrong provider", async () => {
    const marc = await createUser({ email: "marc@gmail.com", provider: "apple" });
    await signIn(marc);
    await expect(bootstrap()).rejects.toThrow(/owner_bootstrap_denied/);
    expect(await memberships()).toBe(0);
  });

  // 29
  it("rejects an Apple private-relay identity", async () => {
    const relay = await createUser({
      email: "k2m9x7q4rt@privaterelay.appleid.com",
      provider: "apple",
    });
    await signIn(relay);
    await expect(bootstrap()).rejects.toThrow(/owner_bootstrap_denied/);
    expect(await memberships()).toBe(0);
  });

  it("rejects an anonymous caller", async () => {
    await signIn(null);
    await expect(bootstrap()).rejects.toThrow(/owner_bootstrap_denied/);
    expect(await memberships()).toBe(0);
  });
});

describe("owner bootstrap — single use", () => {
  // 30, 35
  it("cannot be consumed a second time by anyone else", async () => {
    const marc = await createUser({ email: "marc@gmail.com" });
    await signIn(marc);
    await bootstrap();

    const impostor = await createUser({ email: "marc@gmail.com" });
    await signIn(impostor);
    await expect(bootstrap()).rejects.toThrow(/owner_bootstrap_denied/);

    expect(await activeOwners()).toBe(1);
    expect(await memberships()).toBe(1);
  });

  // 32
  it("is idempotent for Marc's own authenticated UUID", async () => {
    const marc = await createUser({ email: "marc@gmail.com" });
    await signIn(marc);
    const first = await bootstrap();
    const second = await bootstrap();

    expect((second.rows[0] as { id: string }).id).toBe((first.rows[0] as { id: string }).id);
    expect(await memberships()).toBe(1);
    expect(await activeOwners()).toBe(1);
  });

  // 31
  it("refuses to run once an active owner exists, even with the entry re-armed", async () => {
    const marc = await createUser({ email: "marc@gmail.com" });
    await signIn(marc);
    await bootstrap();

    // Simulate an operator wrongly re-arming the allowlist row.
    await db.exec(
      "update public.workspace_owner_bootstrap set consumed_at = null, consumed_by_user_id = null",
    );

    const second = await createUser({ email: "marc@gmail.com" });
    await signIn(second);
    await expect(bootstrap()).rejects.toThrow(/owner_bootstrap_denied/);
    expect(await activeOwners()).toBe(1);
  });
});

describe("owner bootstrap — exposure", () => {
  // 36
  it("keeps the allowlist unreadable to anon and authenticated, and the function closed to anon", async () => {
    const table = await db.query<{ grantee: string }>(
      `select grantee from information_schema.role_table_grants
       where table_schema = 'public' and table_name = 'workspace_owner_bootstrap'`,
    );
    expect(table.rows.map((r) => r.grantee)).not.toContain("anon");
    expect(table.rows.map((r) => r.grantee)).not.toContain("authenticated");

    const rls = await db.query<{ relrowsecurity: boolean }>(
      "select relrowsecurity from pg_class where relname = 'workspace_owner_bootstrap'",
    );
    expect(rls.rows[0]!.relrowsecurity).toBe(true);

    const acl = await db.query<{ can_run: boolean }>(
      `select has_function_privilege('anon', 'public.bootstrap_initial_workspace_owner()', 'execute') as can_run`,
    );
    expect(acl.rows[0]!.can_run).toBe(false);

    const authed = await db.query<{ can_run: boolean }>(
      `select has_function_privilege('authenticated', 'public.bootstrap_initial_workspace_owner()', 'execute') as can_run`,
    );
    expect(authed.rows[0]!.can_run).toBe(true);
  });

  // 36
  it("takes no arguments, so no email or role can be supplied by a caller", async () => {
    const r = await db.query<{ nargs: number; prosecdef: boolean; config: string[] | null }>(
      `select pronargs as nargs, prosecdef, proconfig as config
       from pg_proc where proname = 'bootstrap_initial_workspace_owner'`,
    );
    expect(r.rows[0]!.nargs).toBe(0);
    expect(r.rows[0]!.prosecdef).toBe(true);
    expect(r.rows[0]!.config).toContain("search_path=public");
  });
});
