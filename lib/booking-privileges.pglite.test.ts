import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import type { PGlite } from "@electric-sql/pglite";
import { openTestDatabase, resetSchema } from "@/test/pglite-schema";

// Real-database proof of the hosted-drift correction in
// 20260802010000_revoke_authenticated_get_available_slots.sql.
//
// Hosted CodeOutfitters carried an extra `authenticated` EXECUTE grant on
// get_available_slots that 20260616_booking_a_get_available_slots.sql never grants. This
// migration revokes exactly that grant, forward-only, without touching the function itself.
// These tests prove the final privilege set: anon and service_role keep EXECUTE,
// authenticated loses it, PUBLIC never had it, and reserve_slot stays service_role-only.
const MIGRATIONS = [
  "../supabase/migrations/20260615_booking_base_schema.sql",
  "../supabase/migrations/20260616_booking_a_get_available_slots.sql",
  "../supabase/migrations/20260617_booking_b_reserve_slot.sql",
  "../supabase/migrations/20260618_security3_rls.sql",
  "../supabase/migrations/20260802010000_revoke_authenticated_get_available_slots.sql",
].map((rel) => fileURLToPath(new URL(rel, import.meta.url)));

let db: PGlite;

async function asAnon() {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', '', false)");
  await db.exec("set role anon");
}

async function asAuthenticated() {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', '', false)");
  await db.exec("set role authenticated");
}

async function asServiceRole() {
  await db.exec("reset role");
  await db.exec("set role service_role");
}

async function asSuperuser() {
  await db.exec("reset role");
}

beforeAll(async () => {
  db = await openTestDatabase();
}, 60_000);

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await resetSchema(db, { migrations: MIGRATIONS });
}, 60_000);

describe("get_available_slots privilege correction (revoke authenticated)", () => {
  it("anon can execute get_available_slots", async () => {
    await asAnon();
    await expect(db.query(`select * from public.get_available_slots(1, 2027)`)).resolves.toBeTruthy();
  });

  it("service_role can execute get_available_slots", async () => {
    await asServiceRole();
    await expect(db.query(`select * from public.get_available_slots(1, 2027)`)).resolves.toBeTruthy();
  });

  it("authenticated can no longer execute get_available_slots", async () => {
    await asAuthenticated();
    await expect(db.query(`select * from public.get_available_slots(1, 2027)`)).rejects.toThrow(
      /permission denied/i,
    );
  });

  it("PUBLIC has no implicit execute on get_available_slots", async () => {
    await asSuperuser();
    const grants = await db.query<{ grantee: string }>(
      `select grantee from information_schema.role_routine_grants
       where routine_schema = 'public' and routine_name = 'get_available_slots' and grantee = 'PUBLIC'`,
    );
    expect(grants.rows).toHaveLength(0);
  });

  it("the final grant set on get_available_slots is exactly anon and service_role", async () => {
    await asSuperuser();
    const grants = await db.query<{ grantee: string }>(
      `select grantee from information_schema.role_routine_grants
       where routine_schema = 'public' and routine_name = 'get_available_slots'`,
    );
    const others = grants.rows.map((row) => row.grantee).filter((role) => role !== "postgres");
    expect(others.sort()).toEqual(["anon", "service_role"]);
  });

  it("reserve_slot remains service-role-only", async () => {
    await asSuperuser();
    const grants = await db.query<{ grantee: string }>(
      `select grantee from information_schema.role_routine_grants
       where routine_schema = 'public' and routine_name = 'reserve_slot'`,
    );
    const others = grants.rows.map((row) => row.grantee).filter((role) => role !== "postgres");
    expect(others).toEqual(["service_role"]);

    await asAuthenticated();
    await expect(
      db.query(`select public.reserve_slot(current_date, '09:00', '{}'::jsonb)`),
    ).rejects.toThrow(/permission denied/i);

    await asAnon();
    await expect(
      db.query(`select public.reserve_slot(current_date, '09:00', '{}'::jsonb)`),
    ).rejects.toThrow(/permission denied/i);
  });

  it("the function itself is unchanged: still SECURITY DEFINER with the pinned search_path", async () => {
    await asSuperuser();
    const fn = await db.query<{ prosecdef: boolean; proconfig: string[] | null }>(
      `select prosecdef, proconfig from pg_proc
       where pronamespace = 'public'::regnamespace and proname = 'get_available_slots'`,
    );
    expect(fn.rows).toHaveLength(1);
    expect(fn.rows[0]!.prosecdef).toBe(true);
    expect(fn.rows[0]!.proconfig?.join(",")).toMatch(/search_path=pg_catalog, public/);
  });
});
