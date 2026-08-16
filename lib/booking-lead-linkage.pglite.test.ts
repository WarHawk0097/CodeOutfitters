import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { openTestDatabase, resetSchema } from "@/test/pglite-schema";

// Proves supabase/migrations/20260817000000_booking_lead_linkage.sql — reserve_slot() now
// resolves-or-creates a public.leads row (mirroring submit_inquiry()'s dedup/merge shape) in
// the same transaction as the slot reservation. Real embedded Postgres, unmodified migrations
// — same pattern as booking-privileges.pglite.test.ts and lib/leads/pipeline-stage.pglite.test.ts.
const MIGRATIONS = [
  "../supabase/migrations/20260615_booking_base_schema.sql",
  "../supabase/migrations/20260616_booking_a_get_available_slots.sql",
  "../supabase/migrations/20260617_booking_b_reserve_slot.sql",
  "../supabase/migrations/20260618_security3_rls.sql",
  "../supabase/migrations/20260723_inquiry_backend.sql",
  "../supabase/migrations/20260727_command_center_workspaces.sql",
  "../supabase/migrations/20260817000000_booking_lead_linkage.sql",
].map((rel) => fileURLToPath(new URL(rel, import.meta.url)));

// 20260727_command_center_workspaces.sql's RLS helper functions reference auth.uid() /
// auth.users at CREATE FUNCTION time (check_function_bodies) — same stub
// lib/leads/pipeline-stage.pglite.test.ts uses.
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
let workspaceId: string;

async function asServiceRole() {
  await db.exec("reset role");
  await db.exec("set role service_role");
}

async function asAnon() {
  await db.exec("reset role");
  await db.exec("set role anon");
}

async function asAuthenticated() {
  await db.exec("reset role");
  await db.exec("set role authenticated");
}

function booking(overrides: Partial<Record<string, string>> = {}) {
  return {
    name: "Ada Lovelace",
    email: "ada@example.test",
    company: "Acme",
    phone: "+15551234567",
    message: "Need a quote",
    ...overrides,
  };
}

async function reserve(date: string, time: string, payload: Record<string, unknown>) {
  return db.query<{ reserve_slot: string }>(`select public.reserve_slot($1, $2, $3::jsonb) as reserve_slot`, [
    date,
    time,
    JSON.stringify(payload),
  ]);
}

// Real Supabase grants service_role BYPASSRLS at the platform level (see
// 20260618_security3_rls.sql's header comment); PGlite's plain `create role
// service_role` has no such attribute, so direct verification reads must run
// as the (superuser) bootstrap role, same as the `asSuperuser()` pattern in
// booking-privileges.pglite.test.ts. reserve_slot() itself is unaffected —
// it is SECURITY DEFINER and always runs as the function owner.
async function asVerifier() {
  await db.exec("reset role");
}

async function leadsForEmail(email: string) {
  await asVerifier();
  return db.query<{
    id: string;
    status: string;
    assigned_owner: string | null;
    workspace_id: string | null;
    source_page: string | null;
    phone: string | null;
  }>(`select id, status, assigned_owner, workspace_id, source_page, phone from public.leads where work_email = $1`, [
    email.toLowerCase(),
  ]);
}

beforeAll(async () => {
  db = await openTestDatabase();
}, 60_000);

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await resetSchema(db, { migrations: MIGRATIONS, authStub: AUTH_STUB });
  await db.exec("reset role");
  const ws = await db.query<{ id: string }>(
    `insert into public.workspaces (name, slug) values ('CodeOutfitters', 'codeoutfitters') returning id`,
  );
  workspaceId = ws.rows[0]!.id;
}, 60_000);

describe("booking -> lead linkage (reserve_slot)", () => {
  it("A: new identity — creates exactly one lead, links the booking, sources it as Booking", async () => {
    await asServiceRole();
    const email = "new-person@example.test";
    const result = await reserve("2026-05-18", "9:00 AM", booking({ email }));
    const bookingId = result.rows[0]!.reserve_slot;

    const leads = await leadsForEmail(email);
    expect(leads.rows).toHaveLength(1);
    expect(leads.rows[0]!.source_page).toBe("Booking");
    expect(leads.rows[0]!.workspace_id).toBe(workspaceId);

    const row = await db.query<{ lead_id: string }>(`select lead_id from public.bookings where id = $1`, [
      bookingId,
    ]);
    expect(row.rows[0]!.lead_id).toBe(leads.rows[0]!.id);

    const timeline = await db.query<{ event_type: string }>(
      `select event_type from public.lead_timeline_events where lead_id = $1`,
      [leads.rows[0]!.id],
    );
    expect(timeline.rows.map((r) => r.event_type)).toEqual(["booking_received"]);
  });

  it("B: existing email — reuses the lead, does not duplicate, links the new booking", async () => {
    await asServiceRole();
    const email = "repeat@example.test";
    const first = await reserve("2026-05-18", "9:00 AM", booking({ email }));
    const second = await reserve("2026-05-18", "9:30 AM", booking({ email, company: "Different Co" }));

    const leads = await leadsForEmail(email);
    expect(leads.rows).toHaveLength(1);

    const bookings = await db.query<{ id: string; lead_id: string }>(
      `select id, lead_id from public.bookings where email = $1 order by preferred_time`,
      [email],
    );
    expect(bookings.rows).toHaveLength(2);
    expect(bookings.rows[0]!.id).toBe(first.rows[0]!.reserve_slot);
    expect(bookings.rows[1]!.id).toBe(second.rows[0]!.reserve_slot);
    expect(bookings.rows[0]!.lead_id).toBe(leads.rows[0]!.id);
    expect(bookings.rows[1]!.lead_id).toBe(leads.rows[0]!.id);
  });

  it("D: repeat booking of the same slot — second attempt fails, no duplicate lead or booking", async () => {
    await asServiceRole();
    const email = "retry@example.test";
    await reserve("2026-05-18", "10:00 AM", booking({ email }));
    await expect(reserve("2026-05-18", "10:00 AM", booking({ email }))).rejects.toThrow(/slot_already_booked/);

    const leads = await leadsForEmail(email);
    expect(leads.rows).toHaveLength(1);
    const bookings = await db.query(`select id from public.bookings where email = $1`, [email]);
    expect(bookings.rows).toHaveLength(1);
  });

  it("E: booking failure (unknown slot) — no lead and no booking are created", async () => {
    await asServiceRole();
    const email = "never-booked@example.test";
    await expect(reserve("2099-01-01", "9:00 AM", booking({ email }))).rejects.toThrow(/slot_not_found/);

    const leads = await leadsForEmail(email);
    expect(leads.rows).toHaveLength(0);
    const bookings = await db.query(`select id from public.bookings where email = $1`, [email]);
    expect(bookings.rows).toHaveLength(0);
  });

  it("F: the resolved lead is always attached to the single seeded workspace", async () => {
    await asServiceRole();
    const email = "workspace-check@example.test";
    await reserve("2026-05-18", "11:00 AM", booking({ email }));
    const leads = await leadsForEmail(email);
    expect(leads.rows[0]!.workspace_id).toBe(workspaceId);
  });

  it("G: existing lead's status and owner are preserved across a second booking", async () => {
    await asServiceRole();
    const email = "preserve@example.test";
    await reserve("2026-05-18", "1:00 PM", booking({ email }));
    const before = await leadsForEmail(email);
    const leadId = before.rows[0]!.id;

    // asVerifier() (superuser) is already active from leadsForEmail() above — this
    // simulates the dashboard's authenticated PATCH path, not the booking RPC.
    await db.query(`update public.leads set status = 'Contacted', assigned_owner = $1 where id = $2`, [
      randomUUID(),
      leadId,
    ]);
    const afterManualUpdate = await leadsForEmail(email);

    await asServiceRole();
    await reserve("2026-05-18", "1:30 PM", booking({ email, phone: "" }));
    const after = await leadsForEmail(email);
    expect(after.rows).toHaveLength(1);
    expect(after.rows[0]!.status).toBe("Contacted");
    expect(after.rows[0]!.assigned_owner).toBe(afterManualUpdate.rows[0]!.assigned_owner);
    // Non-destructive merge: blank phone on the retry never erases the existing value.
    expect(after.rows[0]!.phone).toBe("+15551234567");
  });

  it("reserve_slot remains service-role-only after the extension", async () => {
    await asAuthenticated();
    await expect(reserve("2026-05-18", "9:00 AM", booking())).rejects.toThrow(/permission denied/i);

    await asAnon();
    await expect(reserve("2026-05-18", "9:00 AM", booking())).rejects.toThrow(/permission denied/i);
  });
});
