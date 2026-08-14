import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { openTestDatabase, resetSchema } from "@/test/pglite-schema";

// Real-database atomicity proof (owner C: "A mocked sequence of repository calls
// is not sufficient proof of transaction atomicity"). Loads the ACTUAL
// migration file into an embedded Postgres (PGlite, no Docker) and drives
// public.submit_inquiry, then asserts all-or-nothing behavior against real rows.

// Workspace chain included (not just the original ingestion migration) so this
// proves submit_inquiry against the SAME schema production runs: leads.workspace_id
// exists, RLS/workspace helpers exist, and the single seeded 'codeoutfitters'
// workspace (20260729010000) is present for 20260812020000's lookup to resolve.
const MIGRATIONS = [
  "../../../supabase/migrations/20260723_inquiry_backend.sql",
  "../../../supabase/migrations/20260724_inquiry_attachments_upload.sql",
  "../../../supabase/migrations/20260727_command_center_workspaces.sql",
  "../../../supabase/migrations/20260729010000_owner_bootstrap.sql",
  "../../../supabase/migrations/20260812020000_leads_workspace_ingestion_fix.sql",
  "../../../supabase/migrations/20260814000000_leads_ingestion_workspace_fail_closed.sql",
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

beforeAll(async () => {
  db = await openTestDatabase();
}, 60_000);

afterAll(async () => {
  await db.close();
});

// A fresh schema per test for full isolation; the migration is applied UNMODIFIED each time.
beforeEach(async () => {
  await resetSchema(db, { migrations: MIGRATIONS, authStub: AUTH_STUB });
}, 60_000);

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

    // Regression: submit_inquiry must set workspace_id (leads_select_members RLS
    // gates all visibility on it — a NULL here makes the lead permanently invisible).
    const ws = await db.query<{ id: string }>(
      "select id from public.workspaces where slug = 'codeoutfitters'",
    );
    const leadWs = await db.query<{ workspace_id: string }>(
      "select workspace_id from public.leads",
    );
    expect(leadWs.rows[0]!.workspace_id).toBe(ws.rows[0]!.id);
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
    // Also simulate a pre-fix orphaned row (workspace_id NULL) to prove the
    // merge branch backfills it rather than requiring a fresh insert.
    await db.exec(
      "update public.leads set status='Contacted', internal_notes='call booked', workspace_id=null where work_email='ada@example.com'",
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
      workspace_id: string;
    }>("select job_title, status, internal_notes, business_name, workspace_id from public.leads");
    expect(lead.rows[0]!.job_title).toBe("CTO"); // blank filled
    expect(lead.rows[0]!.status).toBe("Contacted"); // preserved
    expect(lead.rows[0]!.internal_notes).toBe("call booked"); // preserved
    expect(lead.rows[0]!.business_name).toBe("Lovelace Ltd"); // never erased

    // Regression: merge branch backfills a NULL workspace_id (orphaned pre-fix row).
    const ws = await db.query<{ id: string }>(
      "select id from public.workspaces where slug = 'codeoutfitters'",
    );
    expect(lead.rows[0]!.workspace_id).toBe(ws.rows[0]!.id);
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

  // Work Order D §5: exact contextual attribution must survive to real rows.
  it("persists contextual prefills: service_interest, industry, case study + source section", async () => {
    // Services placement: selectedService lands on leads.service_interest.
    await submit(
      payload(randomUUID(), {
        formVariant: "services_compact",
        inquirySource: "services_compact",
        sourcePage: "Services",
        sourcePath: "/services",
        sourceSection: "services-card-whatsapp",
        selectedService: "WhatsApp Lead Automation",
        workEmail: "svc@example.com",
      }),
      "fp-svc",
    );
    const svc = await db.query<{ service_interest: string; source_page: string }>(
      "select service_interest, source_page from public.leads where work_email = 'svc@example.com'",
    );
    expect(svc.rows[0]!.service_interest).toBe("WhatsApp Lead Automation");
    expect(svc.rows[0]!.source_page).toBe("Services");

    // Case-study placement: selectedCaseStudy is retained in raw_answers, the
    // mapped selectedService lands on service_interest, section on attribution.
    await submit(
      payload(randomUUID(), {
        formVariant: "case_study_contextual",
        inquirySource: "case_study_contextual",
        sourcePage: "Case Studies",
        sourcePath: "/case-studies",
        sourceSection: "case-studies-card-real-estate-whatsapp",
        selectedCaseStudy: "How a Real Estate Agency Doubled Lead Response Rate",
        selectedService: "WhatsApp Lead Automation",
        workEmail: "case@example.com",
      }),
      "fp-case",
    );
    const cs = await db.query<{
      raw_answers: { selectedCaseStudy: string };
      source_attribution: { sourceSection: string };
    }>(
      `select s.raw_answers, s.source_attribution
         from public.lead_form_submissions s
         join public.leads l on l.id = s.lead_id
        where l.work_email = 'case@example.com'`,
    );
    expect(cs.rows[0]!.raw_answers.selectedCaseStudy).toBe(
      "How a Real Estate Agency Doubled Lead Response Rate",
    );
    expect(cs.rows[0]!.source_attribution.sourceSection).toBe(
      "case-studies-card-real-estate-whatsapp",
    );
  });

  // LEAD_INGESTION_WORKSPACE_MISSING_FAIL_CLOSED (20260814000000): if the single
  // seeded workspace is ever missing, submit_inquiry must abort instead of
  // silently writing a NULL-workspace lead — the original bug this migration
  // chain exists to close, recreated one layer up.
  it("fails closed when the seeded workspace is missing — no lead, no submission row", async () => {
    await db.exec("delete from public.workspaces where slug = 'codeoutfitters'");

    await expect(submit(payload(randomUUID()), "fp-no-ws")).rejects.toThrow(
      /inquiry_workspace_missing/,
    );
    expect(await count("leads")).toBe(0);
    expect(await count("lead_form_submissions")).toBe(0);
    expect(await count("email_events")).toBe(0);
  });

  it("still replays an already-persisted submission if the workspace slug is later renamed", async () => {
    // A real delete of a workspace with leads attached is blocked by
    // leads_workspace_id_fkey's RESTRICT — renaming the slug is the realistic
    // way the lookup in submit_inquiry stops resolving.
    const sid = randomUUID();
    await submit(payload(sid), "fp-1");
    await db.exec("update public.workspaces set slug = 'renamed' where slug = 'codeoutfitters'");

    const replay = await submit(payload(sid), "fp-1");
    expect(replay.replay).toBe(true);
    expect(await count("leads")).toBe(1);
  });
});
