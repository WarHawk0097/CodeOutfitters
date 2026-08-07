import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import type { PGlite } from "@electric-sql/pglite";
import { openTestDatabase, resetSchema } from "@/test/pglite-schema";

// Real-database proof of the reserve_slot fix in
// 20260802030000_fix_reserve_slot_date_assignment.sql.
//
// Before the fix, a malformed p_booking.preferredDate hit an implicit PL/pgSQL
// assignment cast (text -> date) and raised Postgres's raw 22007
// "invalid input syntax for type date" instead of this function's own 22023
// validation contract. These tests prove the controlled error is now raised,
// that a matching/missing preferredDate still behaves exactly as before, and
// that removing the unread v_slot_id variable did not change locking or the
// slot-flip behavior.
const MIGRATIONS = [
  "../supabase/migrations/20260615_booking_base_schema.sql",
  "../supabase/migrations/20260616_booking_a_get_available_slots.sql",
  "../supabase/migrations/20260617_booking_b_reserve_slot.sql",
  "../supabase/migrations/20260618_security3_rls.sql",
  "../supabase/migrations/20260802030000_fix_reserve_slot_date_assignment.sql",
].map((rel) => fileURLToPath(new URL(rel, import.meta.url)));

let db: PGlite;

async function asServiceRole() {
  await db.exec("reset role");
  await db.exec("set role service_role");
}

async function asSuperuser() {
  await db.exec("reset role");
}

const SLOT_DATE = "2027-03-15";
const SLOT_TIME = "9:00 AM";

async function seedSlot() {
  await asSuperuser();
  await db.query(
    `insert into public.available_slots (date, time) values ($1, $2)
     on conflict (date, time) do update set is_booked = false`,
    [SLOT_DATE, SLOT_TIME],
  );
}

const BOOKING = { name: "Ada", email: "ada@example.test" };

beforeAll(async () => {
  db = await openTestDatabase();
}, 60_000);

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await resetSchema(db, { migrations: MIGRATIONS });
  await seedSlot();
}, 60_000);

describe("reserve_slot preferredDate fix", () => {
  it("still succeeds with no preferredDate at all", async () => {
    await asServiceRole();
    await expect(
      db.query(`select public.reserve_slot($1, $2, $3::jsonb)`, [SLOT_DATE, SLOT_TIME, BOOKING]),
    ).resolves.toBeTruthy();
  });

  it("still succeeds when preferredDate matches p_date", async () => {
    await asServiceRole();
    await expect(
      db.query(`select public.reserve_slot($1, $2, $3::jsonb)`, [
        SLOT_DATE,
        SLOT_TIME,
        { ...BOOKING, preferredDate: SLOT_DATE },
      ]),
    ).resolves.toBeTruthy();
  });

  it("still raises 22023 when preferredDate disagrees with p_date", async () => {
    await asServiceRole();
    await expect(
      db.query(`select public.reserve_slot($1, $2, $3::jsonb)`, [
        SLOT_DATE,
        SLOT_TIME,
        { ...BOOKING, preferredDate: "2027-03-16" },
      ]),
    ).rejects.toThrow(/does not match p_date/);
  });

  it("raises the controlled 22023 error, not a raw cast error, on a malformed preferredDate", async () => {
    await asServiceRole();
    await expect(
      db.query(`select public.reserve_slot($1, $2, $3::jsonb)`, [
        SLOT_DATE,
        SLOT_TIME,
        { ...BOOKING, preferredDate: "not-a-date" },
      ]),
    ).rejects.toThrow(/p_booking\.preferredDate \(not-a-date\) is not a valid date/);
  });

  it("raises the controlled 22023 error, not a raw cast error, on an impossible calendar date", async () => {
    // "2027-02-30" is syntactically ISO-shaped (passes the Worker's format-only
    // regex) but Postgres rejects it at cast time with a different exception
    // (datetime_field_overflow rather than invalid_datetime_format). Both must
    // land on the same controlled 22023 contract.
    await asServiceRole();
    await expect(
      db.query(`select public.reserve_slot($1, $2, $3::jsonb)`, [
        SLOT_DATE,
        SLOT_TIME,
        { ...BOOKING, preferredDate: "2027-02-30" },
      ]),
    ).rejects.toThrow(/p_booking\.preferredDate \(2027-02-30\) is not a valid date/);
  });

  it("still succeeds with a blank preferredDate, same as a missing one", async () => {
    await asServiceRole();
    await expect(
      db.query(`select public.reserve_slot($1, $2, $3::jsonb)`, [
        SLOT_DATE,
        SLOT_TIME,
        { ...BOOKING, preferredDate: "" },
      ]),
    ).resolves.toBeTruthy();
  });

  it("still raises slot_not_found for a date/time with no available_slots row", async () => {
    await asServiceRole();
    await expect(
      db.query(`select public.reserve_slot($1, $2, $3::jsonb)`, ["2027-03-16", SLOT_TIME, BOOKING]),
    ).rejects.toThrow(/slot_not_found/);
  });

  it("still flips is_booked and still blocks a second reservation of the same slot", async () => {
    await asServiceRole();
    await db.query(`select public.reserve_slot($1, $2, $3::jsonb)`, [SLOT_DATE, SLOT_TIME, BOOKING]);

    await asSuperuser();
    const slot = await db.query<{ is_booked: boolean }>(
      `select is_booked from public.available_slots where date = $1 and time = $2`,
      [SLOT_DATE, SLOT_TIME],
    );
    expect(slot.rows[0]?.is_booked).toBe(true);

    await asServiceRole();
    await expect(
      db.query(`select public.reserve_slot($1, $2, $3::jsonb)`, [SLOT_DATE, SLOT_TIME, BOOKING]),
    ).rejects.toThrow(/slot_already_booked/);
  });
});

describe("reserve_slot fix — signature, security, and grants unchanged", () => {
  it("keeps its signature, SECURITY DEFINER, and pinned search_path", async () => {
    await asSuperuser();
    const fn = await db.query<{
      identity_args: string;
      prosecdef: boolean;
      proconfig: string[] | null;
    }>(
      `select pg_get_function_identity_arguments(p.oid) as identity_args, p.prosecdef, p.proconfig
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'reserve_slot'`,
    );
    expect(fn.rows).toHaveLength(1);
    expect(fn.rows[0]!.identity_args).toBe("p_date date, p_time text, p_booking jsonb");
    expect(fn.rows[0]!.prosecdef).toBe(true);
    expect(fn.rows[0]!.proconfig?.join(",")).toMatch(/search_path=pg_catalog, public/);
  });

  it("no longer declares or assigns the unused v_slot_id variable", async () => {
    await asSuperuser();
    const def = await db.query<{ src: string }>(
      `select pg_get_functiondef(p.oid) as src
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'reserve_slot'`,
    );
    expect(def.rows[0]!.src).not.toMatch(/v_slot_id/);
  });

  it("remains service-role-only: anon and authenticated denied, PUBLIC has no grant, service_role can execute", async () => {
    await asSuperuser();
    const grants = await db.query<{ grantee: string }>(
      `select grantee from information_schema.role_routine_grants
       where routine_schema = 'public' and routine_name = 'reserve_slot'`,
    );
    const others = grants.rows.map((row) => row.grantee).filter((role) => role !== "postgres");
    expect(others).toEqual(["service_role"]);

    await db.exec("reset role");
    await db.exec("set role authenticated");
    await expect(
      db.query(`select public.reserve_slot($1, $2, $3::jsonb)`, [SLOT_DATE, SLOT_TIME, BOOKING]),
    ).rejects.toThrow(/permission denied/i);

    await db.exec("reset role");
    await db.exec("set role anon");
    await expect(
      db.query(`select public.reserve_slot($1, $2, $3::jsonb)`, [SLOT_DATE, SLOT_TIME, BOOKING]),
    ).rejects.toThrow(/permission denied/i);

    await asServiceRole();
    await expect(
      db.query(`select public.reserve_slot($1, $2, $3::jsonb)`, [SLOT_DATE, SLOT_TIME, BOOKING]),
    ).resolves.toBeTruthy();
  });
});
