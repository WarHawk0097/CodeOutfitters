import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { openTestDatabase, resetSchema } from "@/test/pglite-schema";

// Proves supabase/migrations/20260813000000_leads_pipeline_stage.sql — change_lead_stage()
// and lead_stage_history — against a real embedded Postgres running the unmodified
// migrations. No local Docker/Supabase instance is available in this environment, so this
// is the "real local Postgres" verification described in supabase/migrations/README.md's
// sibling *.pglite.test.ts files: it applies the actual migration SQL, not a mock.
const MIGRATIONS = [
  "../../supabase/migrations/20260723_inquiry_backend.sql",
  "../../supabase/migrations/20260727_command_center_workspaces.sql",
  "../../supabase/migrations/20260812000000_leads_update.sql",
  "../../supabase/migrations/20260812020000_leads_workspace_ingestion_fix.sql",
  "../../supabase/migrations/20260812030000_leads_insert.sql",
  "../../supabase/migrations/20260813000000_leads_pipeline_stage.sql",
  "../../supabase/migrations/20260814010000_lead_stage_history_grant_hardening.sql",
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

async function createLead(workspace: string, status = "New"): Promise<string> {
  const lead = await db.query<{ id: string }>(
    `insert into public.leads (workspace_id, first_name, business_name, work_email, workflow_description, status)
     values ($1, 'Ada', 'Acme', $2, 'wants a quote', $3)
     returning id`,
    [workspace, `${randomUUID()}@example.test`, status],
  );
  return lead.rows[0]!.id;
}

async function signIn(userId: string | null) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? ""]);
  if (userId) await db.exec("set role authenticated");
}

/** Supabase's actual unauthenticated role — distinct from `signIn(null)`, which leaves the
 *  connection on its bootstrap role. Privilege checks below run as `anon` for real, so a
 *  missing GRANT fails here exactly as it would against hosted Postgres. */
async function signInAsAnon() {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', '', false)");
  await db.exec("set role anon");
}

type StageChangeResult = {
  lead_id: string;
  history_id?: string;
  from_stage: string;
  to_stage: string;
  changed: boolean;
};

async function changeStage(
  leadId: string,
  expectedFromStage: string,
  toStage: string,
  reason: string | null = null,
  source = "pipeline",
): Promise<StageChangeResult> {
  const result = await db.query<{ change_lead_stage: StageChangeResult }>(
    `select public.change_lead_stage($1, $2, $3, $4, $5) as change_lead_stage`,
    [leadId, expectedFromStage, toStage, reason, source],
  );
  return result.rows[0]!.change_lead_stage;
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

describe("change_lead_stage() — atomic move + history (20260813000000_leads_pipeline_stage.sql)", () => {
  it("moves the lead and writes exactly one history row, atomically", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);

    const result = await changeStage(lead, "New", "Contacted");
    expect(result.changed).toBe(true);
    expect(result.from_stage).toBe("New");
    expect(result.to_stage).toBe("Contacted");

    const leadRow = await db.query<{ status: string }>(`select status from public.leads where id = $1`, [lead]);
    expect(leadRow.rows[0]!.status).toBe("Contacted");

    const history = await db.query(`select * from public.lead_stage_history where lead_id = $1`, [lead]);
    expect(history.rows).toHaveLength(1);
  });

  it("a fresh read after the move (simulating page refresh) sees the new stage, not the pre-move one", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);
    await changeStage(lead, "New", "Contacted");

    // A distinct query, not the RPC's own return value — this is the persistence the UI's
    // GET /api/leads relies on after a reload.
    const fresh = await db.query<{ status: string }>(`select status from public.leads where id = $1`, [lead]);
    expect(fresh.rows[0]!.status).toBe("Contacted");
  });

  it("records from_stage as the prior stage, not the target, across a multi-hop move", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);

    await changeStage(lead, "New", "Contacted");
    const second = await changeStage(lead, "Contacted", "Appt Pending");
    expect(second.from_stage).toBe("Contacted");
    expect(second.to_stage).toBe("Appt Pending");

    const history = await db.query<{ from_stage: string; to_stage: string }>(
      `select from_stage, to_stage from public.lead_stage_history where lead_id = $1 order by occurred_at`,
      [lead],
    );
    expect(history.rows.map((r) => [r.from_stage, r.to_stage])).toEqual([
      ["New", "Contacted"],
      ["Contacted", "Appt Pending"],
    ]);
  });

  it("a no-op move (same stage) changes nothing and writes no history row", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);

    const result = await changeStage(lead, "New", "New");
    expect(result.changed).toBe(false);

    const history = await db.query(`select id from public.lead_stage_history where lead_id = $1`, [lead]);
    expect(history.rows).toHaveLength(0);
  });

  it("rejects a gated stage (Won/Lost/FUL) with no reason", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "Negotiation");
    await signIn(owner);

    await expect(changeStage(lead, "Negotiation", "Won", null)).rejects.toThrow(/reason_required/);
    await expect(changeStage(lead, "Negotiation", "Lost", "  ")).rejects.toThrow(/reason_required/);

    const leadRow = await db.query<{ status: string }>(`select status from public.leads where id = $1`, [lead]);
    expect(leadRow.rows[0]!.status).toBe("Negotiation");
  });

  it("accepts a gated stage once a reason is given, and records it", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "Negotiation");
    await signIn(owner);

    const result = await changeStage(lead, "Negotiation", "Won", "Signed contract");
    expect(result.changed).toBe(true);

    const history = await db.query<{ reason: string }>(
      `select reason from public.lead_stage_history where lead_id = $1`,
      [lead],
    );
    expect(history.rows[0]!.reason).toBe("Signed contract");
  });

  it("rejects a stage value outside the canonical set", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);

    await expect(changeStage(lead, "New", "Deleted")).rejects.toThrow(/invalid_stage/);
  });

  it("rejects a move for a lead that does not exist", async () => {
    const owner = await createUser();
    await createWorkspace(owner);
    await signIn(owner);

    await expect(changeStage(randomUUID(), "New", "Contacted")).rejects.toThrow(/lead_not_found/);
  });

  it("rejects an unauthenticated call", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(null);

    await expect(changeStage(lead, "New", "Contacted")).rejects.toThrow(/unauthorized/);
  });

  it("a member of another workspace cannot move a lead that is not theirs", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");

    const stranger = await createUser();
    await createWorkspace(stranger);
    await signIn(stranger);

    await expect(changeStage(lead, "New", "Contacted")).rejects.toThrow(/forbidden/);

    await signIn(owner);
    const leadRow = await db.query<{ status: string }>(`select status from public.leads where id = $1`, [lead]);
    expect(leadRow.rows[0]!.status).toBe("New");
  });

  it("a member of another workspace cannot read the first workspace's stage history", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    const stranger = await createUser();
    await createWorkspace(stranger);

    await signIn(owner);
    await changeStage(lead, "New", "Contacted");

    await signIn(stranger);

    const history = await db.query(`select id from public.lead_stage_history where lead_id = $1`, [lead]);
    expect(history.rows).toHaveLength(0);
  });

  it("authenticated cannot write lead_stage_history directly — only change_lead_stage() can", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);

    await expect(
      db.query(
        `insert into public.lead_stage_history (workspace_id, lead_id, from_stage, to_stage, actor_user_id)
         values ($1, $2, 'New', 'Won', $3)`,
        [workspace, lead, owner],
      ),
    ).rejects.toThrow();
  });

  it("stamps actor_user_id from the session, never a client-supplied value", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);
    await changeStage(lead, "New", "Contacted");

    const history = await db.query<{ actor_user_id: string }>(
      `select actor_user_id from public.lead_stage_history where lead_id = $1`,
      [lead],
    );
    expect(history.rows[0]!.actor_user_id).toBe(owner);
  });

  it("stamps workspace_id from the lead, never a client-supplied value, and occurred_at from the DB clock", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);
    const before = await db.query<{ now: string }>(`select now() as now`);
    await changeStage(lead, "New", "Contacted");

    const history = await db.query<{ workspace_id: string; occurred_at: string }>(
      `select workspace_id, occurred_at from public.lead_stage_history where lead_id = $1`,
      [lead],
    );
    expect(history.rows[0]!.workspace_id).toBe(workspace);
    expect(new Date(history.rows[0]!.occurred_at).getTime()).toBeGreaterThanOrEqual(
      new Date(before.rows[0]!.now).getTime(),
    );
  });

  it("rejects a forged change_source outside the canonical set", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);

    await expect(changeStage(lead, "New", "Contacted", null, "ai_recommendation_accepted")).rejects.toThrow();

    const leadRow = await db.query<{ status: string }>(`select status from public.leads where id = $1`, [lead]);
    expect(leadRow.rows[0]!.status).toBe("New");
    const history = await db.query(`select id from public.lead_stage_history where lead_id = $1`, [lead]);
    expect(history.rows).toHaveLength(0);
  });

  it("rejects a direct UPDATE of a history row by an authenticated member", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);
    await changeStage(lead, "New", "Contacted");

    await expect(
      db.query(`update public.lead_stage_history set reason = 'forged' where lead_id = $1`, [lead]),
    ).rejects.toThrow();
  });

  it("rejects a direct DELETE of a history row by an authenticated member", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);
    await changeStage(lead, "New", "Contacted");

    await expect(db.query(`delete from public.lead_stage_history where lead_id = $1`, [lead])).rejects.toThrow();

    const history = await db.query(`select id from public.lead_stage_history where lead_id = $1`, [lead]);
    expect(history.rows).toHaveLength(1);
  });

  it("invalid_stage and lead_not_found rejections leave no history row behind", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);

    await expect(changeStage(lead, "New", "Deleted")).rejects.toThrow();
    const history = await db.query(`select id from public.lead_stage_history where lead_id = $1`, [lead]);
    expect(history.rows).toHaveLength(0);
  });
});

// Optimistic concurrency: a move is only applied if the caller's expected_from_stage
// matches the DB's current status under the row lock; otherwise the whole call is
// rejected as `stage_conflict` — no Lead update, no history row, no partial effect.
describe("optimistic concurrency — expected_from_stage (cases A–H)", () => {
  it("A) valid transition: expected matches current, to differs — succeeds with exactly one history row", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);

    const result = await changeStage(lead, "New", "Contacted");
    expect(result.changed).toBe(true);
    expect(result.from_stage).toBe("New");
    expect(result.to_stage).toBe("Contacted");

    const history = await db.query(`select id from public.lead_stage_history where lead_id = $1`, [lead]);
    expect(history.rows).toHaveLength(1);
  });

  it("B) stale expected + different to — rejected as stage_conflict, DB unchanged, no history written", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);

    await changeStage(lead, "New", "Contacted"); // DB is now "Contacted"

    await expect(changeStage(lead, "New", "Discovery Done")).rejects.toThrow(/stage_conflict/);

    const leadRow = await db.query<{ status: string }>(`select status from public.leads where id = $1`, [lead]);
    expect(leadRow.rows[0]!.status).toBe("Contacted");
    const history = await db.query(`select id from public.lead_stage_history where lead_id = $1`, [lead]);
    expect(history.rows).toHaveLength(1); // only the first, real move
  });

  it("C) expected === current === to — a true no-op, zero history rows", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);

    const result = await changeStage(lead, "New", "New");
    expect(result.changed).toBe(false);

    const history = await db.query(`select id from public.lead_stage_history where lead_id = $1`, [lead]);
    expect(history.rows).toHaveLength(0);
  });

  it("D) expected !== current even though to === current — still a conflict, not a disguised no-op", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);

    await changeStage(lead, "New", "Contacted"); // DB is now "Contacted"

    // The caller still believes the lead is "New" and asks to move it to "Contacted" —
    // which happens to already be the DB's current stage. Must still reject: the caller's
    // belief was wrong, and a coincidentally-matching target does not make that safe.
    await expect(changeStage(lead, "New", "Contacted")).rejects.toThrow(/stage_conflict/);

    const history = await db.query(`select id from public.lead_stage_history where lead_id = $1`, [lead]);
    expect(history.rows).toHaveLength(1); // still only the first, real move
  });

  it("E) two-session race: the first move wins, the stale second is rejected — exactly one history row", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);

    // Both sessions loaded the lead at "New" and independently chose where to move it.
    const first = await changeStage(lead, "New", "Contacted");
    expect(first.changed).toBe(true);

    await expect(changeStage(lead, "New", "Appt Pending")).rejects.toThrow(/stage_conflict/);

    const leadRow = await db.query<{ status: string }>(`select status from public.leads where id = $1`, [lead]);
    expect(leadRow.rows[0]!.status).toBe("Contacted");
    const history = await db.query(`select id from public.lead_stage_history where lead_id = $1`, [lead]);
    expect(history.rows).toHaveLength(1);
  });

  it("F) after refetch, the second session succeeds with the corrected expected value — a second history row is recorded", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);

    await changeStage(lead, "New", "Contacted"); // first session wins
    await expect(changeStage(lead, "New", "Appt Pending")).rejects.toThrow(/stage_conflict/); // second session, stale

    // Second session refetches, sees "Contacted", and retries with the corrected value —
    // this is a fresh, user-initiated decision, not an automatic retry of the stale one.
    const retried = await changeStage(lead, "Contacted", "Appt Pending");
    expect(retried.changed).toBe(true);
    expect(retried.from_stage).toBe("Contacted");

    const history = await db.query<{ from_stage: string; to_stage: string }>(
      `select from_stage, to_stage from public.lead_stage_history where lead_id = $1 order by occurred_at`,
      [lead],
    );
    expect(history.rows).toEqual([
      { from_stage: "New", to_stage: "Contacted" },
      { from_stage: "Contacted", to_stage: "Appt Pending" },
    ]);
  });

  it("G) authorization is unaffected by expected_from_stage — a correct guess does not grant cross-workspace or unauthenticated access", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");

    const stranger = await createUser();
    await createWorkspace(stranger);
    await signIn(stranger);
    await expect(changeStage(lead, "New", "Contacted")).rejects.toThrow(/forbidden/);

    await signIn(null);
    await expect(changeStage(lead, "New", "Contacted")).rejects.toThrow(/unauthorized/);

    await signIn(owner);
    const leadRow = await db.query<{ status: string }>(`select status from public.leads where id = $1`, [lead]);
    expect(leadRow.rows[0]!.status).toBe("New");
  });

  it("H) reason-required rules are enforced independently of expected_from_stage — a correct expected value does not bypass the reason gate", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "Negotiation");
    await signIn(owner);

    await expect(changeStage(lead, "Negotiation", "Won", null)).rejects.toThrow(/reason_required/);

    const leadRow = await db.query<{ status: string }>(`select status from public.leads where id = $1`, [lead]);
    expect(leadRow.rows[0]!.status).toBe("Negotiation");

    const result = await changeStage(lead, "Negotiation", "Won", "Signed contract");
    expect(result.changed).toBe(true);
  });
});

// Proves supabase/migrations/20260814010000_lead_stage_history_grant_hardening.sql — the
// corrective migration for a hosted defect where role-level default ACLs (never explicitly
// stripped by 20260813000000) left `anon`/`authenticated` holding table/EXECUTE grants beyond
// what RLS alone was assumed to cover. These are real GRANT/REVOKE checks against a real
// embedded Postgres — PGlite enforces privilege checks (including TRUNCATE, which bypasses RLS
// entirely) exactly as hosted Postgres does. What PGlite does NOT reproduce is *why* the grants
// existed on hosted: Supabase's project-level `ALTER DEFAULT PRIVILEGES` for role `postgres`
// (confirmed via `pg_default_acl` on the hosted project) has no PGlite equivalent — this suite
// never had the excess grants to begin with, so it cannot demonstrate the defect regressing.
// It proves the migration's own GRANT/REVOKE statements produce the intended final privilege
// model, which is what a local suite can faithfully check.
describe("privilege hardening — lead_stage_history & change_lead_stage grants (20260814010000)", () => {
  it("[1] authenticated can SELECT its own workspace's history", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);
    await changeStage(lead, "New", "Contacted");

    const history = await db.query(`select id from public.lead_stage_history where lead_id = $1`, [lead]);
    expect(history.rows).toHaveLength(1);
  });

  it("[3] authenticated direct INSERT into lead_stage_history is rejected", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);

    await expect(
      db.query(
        `insert into public.lead_stage_history (workspace_id, lead_id, from_stage, to_stage, actor_user_id)
         values ($1, $2, 'New', 'Won', $3)`,
        [workspace, lead, owner],
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("[4] authenticated direct UPDATE of a history row is rejected", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);
    await changeStage(lead, "New", "Contacted");

    await expect(
      db.query(`update public.lead_stage_history set reason = 'forged' where lead_id = $1`, [lead]),
    ).rejects.toThrow(/permission denied/);
  });

  it("[5] authenticated direct DELETE of a history row is rejected", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);
    await changeStage(lead, "New", "Contacted");

    await expect(db.query(`delete from public.lead_stage_history where lead_id = $1`, [lead])).rejects.toThrow(
      /permission denied/,
    );
  });

  it("[6] authenticated TRUNCATE of lead_stage_history is rejected — the grant this migration closes", async () => {
    const owner = await createUser();
    await signIn(owner);

    await expect(db.exec(`truncate public.lead_stage_history`)).rejects.toThrow(/permission denied/);
  });

  it("[7] authenticated change_lead_stage EXECUTE succeeds when otherwise authorized", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);

    const result = await changeStage(lead, "New", "Contacted");
    expect(result.changed).toBe(true);
  });

  it("[8] anon SELECT on lead_stage_history is rejected", async () => {
    await signInAsAnon();
    await expect(db.query(`select id from public.lead_stage_history limit 1`)).rejects.toThrow(/permission denied/);
  });

  it("[9] anon direct INSERT into lead_stage_history is rejected", async () => {
    await signInAsAnon();
    await expect(
      db.query(
        `insert into public.lead_stage_history (workspace_id, lead_id, from_stage, to_stage)
         values (gen_random_uuid(), gen_random_uuid(), 'New', 'Won')`,
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("[10] anon direct UPDATE of lead_stage_history is rejected", async () => {
    await signInAsAnon();
    await expect(db.query(`update public.lead_stage_history set reason = 'forged'`)).rejects.toThrow(
      /permission denied/,
    );
  });

  it("[11] anon direct DELETE of lead_stage_history is rejected", async () => {
    await signInAsAnon();
    await expect(db.query(`delete from public.lead_stage_history`)).rejects.toThrow(/permission denied/);
  });

  it("[12] anon TRUNCATE of lead_stage_history is rejected", async () => {
    await signInAsAnon();
    await expect(db.exec(`truncate public.lead_stage_history`)).rejects.toThrow(/permission denied/);
  });

  it("[13] anon has no EXECUTE privilege on change_lead_stage — rejected before the function body runs", async () => {
    await signInAsAnon();
    await expect(
      db.query(`select public.change_lead_stage($1, $2, $3, $4, $5)`, [
        randomUUID(),
        "New",
        "Contacted",
        null,
        "pipeline",
      ]),
    ).rejects.toThrow(/permission denied for function/);
  });
});

// [14]-[18] of the required privilege matrix (legitimate transition succeeds, history is
// created, stale-conflict behavior is unchanged, no-op behavior is unchanged, workspace
// isolation is unchanged) are the pre-existing "atomic move + history" and "optimistic
// concurrency" describe blocks above, now re-run with 20260814010000 in the migration chain —
// no separate cases needed; a regression in any of them would fail those tests, not these.
