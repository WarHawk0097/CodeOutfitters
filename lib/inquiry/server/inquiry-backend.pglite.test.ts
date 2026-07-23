import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";

// Real-database atomicity proof (owner C: "A mocked sequence of repository calls
// is not sufficient proof of transaction atomicity"). Loads the ACTUAL
// migration file into an embedded Postgres (PGlite, no Docker) and drives
// public.submit_inquiry, then asserts all-or-nothing behavior against real rows.

const MIGRATION = fileURLToPath(
  new URL("../../../supabase/migrations/20260723_inquiry_backend.sql", import.meta.url),
);

let db: PGlite;

async function count(table: string): Promise<number> {
  const r = await db.query<{ n: number }>(`select count(*)::int as n from public.${table}`);
  return r.rows[0]!.n;
}

function payload(submissionId: string, overrides: Record<string, unknown> = {}) {
  return {
    submissionId,
    formVariant: "contact_full",
    inquirySource: "contact_full",
    sourcePage: "Contact",
    sourcePath: "/contact",
    firstName: "Ada",
    lastName: "Lovelace",
    workEmail: "ada@example.com",
    businessName: "Lovelace Ltd",
    workflowDescription: "Automate the weekly reporting pipeline end to end.",
    consent: { privacyAccepted: true, marketingOptIn: false },
    ...overrides,
  };
}

async function submit(p: object, fingerprint: string) {
  const r = await db.query<{ result: { lead_id: string; replay: boolean } }>(
    "select public.submit_inquiry($1::jsonb, $2) as result",
    [JSON.stringify(p), fingerprint],
  );
  return r.rows[0]!.result;
}

beforeEach(async () => {
  // Fresh in-memory database per test for full isolation.
  db = new PGlite({ extensions: { citext } });
  // Supabase roles the migration's GRANT/REVOKE reference. They do not exist in
  // a bare Postgres, so create them before applying the migration UNMODIFIED.
  await db.exec("create role anon; create role authenticated; create role service_role;");
  await db.exec(readFileSync(MIGRATION, "utf8"));
});

describe("submit_inquiry — atomic persistence", () => {
  it("creates a new lead with server-owned defaults and queued emails", async () => {
    const res = await submit(payload(randomUUID()), "fp-1");
    expect(res.replay).toBe(false);
    expect(await count("leads")).toBe(1);
    expect(await count("lead_form_submissions")).toBe(1);
    expect(await count("lead_timeline_events")).toBe(1);
    expect(await count("email_events")).toBe(2);

    const lead = await db.query<{ status: string }>("select status from public.leads");
    expect(lead.rows[0]!.status).toBe("New");
    const emails = await db.query<{ status: string }>("select status from public.email_events");
    expect(emails.rows.every((e) => e.status === "queued")).toBe(true);
  });

  it("idempotent replay: same submissionId + fingerprint returns original, no duplicates", async () => {
    const sid = randomUUID();
    await submit(payload(sid), "fp-1");
    const replay = await submit(payload(sid), "fp-1");
    expect(replay.replay).toBe(true);
    expect(await count("leads")).toBe(1);
    expect(await count("lead_form_submissions")).toBe(1);
    expect(await count("lead_timeline_events")).toBe(1);
    expect(await count("email_events")).toBe(2); // not 4
  });

  it("idempotency conflict: same submissionId, different fingerprint is rejected, original preserved", async () => {
    const sid = randomUUID();
    await submit(payload(sid), "fp-1");
    await expect(submit(payload(sid, { firstName: "Grace" }), "fp-DIFFERENT")).rejects.toThrow(
      /inquiry_idempotency_conflict/,
    );
    // Original untouched.
    const lead = await db.query<{ first_name: string }>("select first_name from public.leads");
    expect(lead.rows[0]!.first_name).toBe("Ada");
    expect(await count("lead_form_submissions")).toBe(1);
  });

  it("existing lead: second inquiry attaches submission, fills blanks, preserves authoritative fields", async () => {
    // First inquiry with no job_title.
    await submit(payload(randomUUID(), { jobTitle: "" }), "fp-1");
    // Operator advances the lead + adds a note (authoritative internal state).
    await db.exec(
      "update public.leads set status='Contacted', internal_notes='call booked' where work_email='ada@example.com'",
    );
    // Second inquiry, same email, now WITH a job title and a blanked business
    // name should never erase the existing one.
    const res = await submit(
      payload(randomUUID(), { jobTitle: "CTO", businessName: "Lovelace Ltd" }),
      "fp-2",
    );
    expect(res.replay).toBe(false);
    expect(await count("leads")).toBe(1); // merged, not duplicated
    expect(await count("lead_form_submissions")).toBe(2);

    const lead = await db.query<{
      job_title: string;
      status: string;
      internal_notes: string;
      business_name: string;
    }>("select job_title, status, internal_notes, business_name from public.leads");
    expect(lead.rows[0]!.job_title).toBe("CTO"); // blank filled
    expect(lead.rows[0]!.status).toBe("Contacted"); // preserved
    expect(lead.rows[0]!.internal_notes).toBe("call booked"); // preserved
    expect(lead.rows[0]!.business_name).toBe("Lovelace Ltd"); // never erased
  });

  it("ATOMICITY: a late failure rolls back the whole transaction — no partial lead, no orphan submission", async () => {
    // Inject a failure at the LAST step (email_events insert), after lead +
    // submission + timeline have already been written inside the function.
    await db.exec(`
      create function public._boom() returns trigger language plpgsql as $$
      begin raise exception 'injected email_events failure'; end $$;
      create trigger t_boom before insert on public.email_events
        for each row execute function public._boom();
    `);

    await expect(submit(payload(randomUUID()), "fp-1")).rejects.toThrow(/injected email_events failure/);

    // Everything the function wrote before the failure must be gone.
    expect(await count("leads")).toBe(0);
    expect(await count("lead_form_submissions")).toBe(0);
    expect(await count("lead_timeline_events")).toBe(0);
    expect(await count("email_events")).toBe(0);
  });
});
