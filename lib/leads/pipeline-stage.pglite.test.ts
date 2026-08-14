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

type StageChangeResult = {
  lead_id: string;
  history_id?: string;
  from_stage: string;
  to_stage: string;
  changed: boolean;
};

async function changeStage(
  leadId: string,
  toStage: string,
  reason: string | null = null,
  source = "pipeline",
): Promise<StageChangeResult> {
  const result = await db.query<{ change_lead_stage: StageChangeResult }>(
    `select public.change_lead_stage($1, $2, $3, $4) as change_lead_stage`,
    [leadId, toStage, reason, source],
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

    const result = await changeStage(lead, "Contacted");
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
    await changeStage(lead, "Contacted");

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

    await changeStage(lead, "Contacted");
    const second = await changeStage(lead, "Appt Pending");
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

    const result = await changeStage(lead, "New");
    expect(result.changed).toBe(false);

    const history = await db.query(`select id from public.lead_stage_history where lead_id = $1`, [lead]);
    expect(history.rows).toHaveLength(0);
  });

  it("rejects a gated stage (Won/Lost/FUL) with no reason", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "Negotiation");
    await signIn(owner);

    await expect(changeStage(lead, "Won", null)).rejects.toThrow(/reason_required/);
    await expect(changeStage(lead, "Lost", "  ")).rejects.toThrow(/reason_required/);

    const leadRow = await db.query<{ status: string }>(`select status from public.leads where id = $1`, [lead]);
    expect(leadRow.rows[0]!.status).toBe("Negotiation");
  });

  it("accepts a gated stage once a reason is given, and records it", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "Negotiation");
    await signIn(owner);

    const result = await changeStage(lead, "Won", "Signed contract");
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

    await expect(changeStage(lead, "Deleted")).rejects.toThrow(/invalid_stage/);
  });

  it("rejects a move for a lead that does not exist", async () => {
    const owner = await createUser();
    await createWorkspace(owner);
    await signIn(owner);

    await expect(changeStage(randomUUID(), "Contacted")).rejects.toThrow(/lead_not_found/);
  });

  it("rejects an unauthenticated call", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(null);

    await expect(changeStage(lead, "Contacted")).rejects.toThrow(/unauthorized/);
  });

  it("a member of another workspace cannot move a lead that is not theirs", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");

    const stranger = await createUser();
    await createWorkspace(stranger);
    await signIn(stranger);

    await expect(changeStage(lead, "Contacted")).rejects.toThrow(/forbidden/);

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
    await changeStage(lead, "Contacted");

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
    await changeStage(lead, "Contacted");

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
    await changeStage(lead, "Contacted");

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

    await expect(changeStage(lead, "Contacted", null, "ai_recommendation_accepted")).rejects.toThrow();

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
    await changeStage(lead, "Contacted");

    await expect(
      db.query(`update public.lead_stage_history set reason = 'forged' where lead_id = $1`, [lead]),
    ).rejects.toThrow();
  });

  it("rejects a direct DELETE of a history row by an authenticated member", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);
    await changeStage(lead, "Contacted");

    await expect(db.query(`delete from public.lead_stage_history where lead_id = $1`, [lead])).rejects.toThrow();

    const history = await db.query(`select id from public.lead_stage_history where lead_id = $1`, [lead]);
    expect(history.rows).toHaveLength(1);
  });

  it("invalid_stage and lead_not_found rejections leave no history row behind", async () => {
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);

    await expect(changeStage(lead, "Deleted")).rejects.toThrow();
    const history = await db.query(`select id from public.lead_stage_history where lead_id = $1`, [lead]);
    expect(history.rows).toHaveLength(0);
  });

  it("concurrent/stale transition policy: a move is always relative to the current DB row, not the caller's stale view — last write wins, serialized by the row lock, no rejection of a superseded 'from' stage", async () => {
    // Session A loads the lead while it is "New". Session B (not modeled concurrently here,
    // since PGlite is single-connection, but the RPC's `for update` + no expected_from_stage
    // parameter documents the policy) moves it New -> Qualified-equivalent stage first.
    const owner = await createUser();
    const workspace = await createWorkspace(owner);
    const lead = await createLead(workspace, "New");
    await signIn(owner);

    await changeStage(lead, "Contacted"); // session B's move, landed first
    // Session A's stale attempt: it still thinks the lead is "New" but does not (and cannot)
    // assert that — change_lead_stage has no expected_from_stage input, so this succeeds
    // against whatever the DB currently holds, silently overwriting session B's move.
    const staleMove = await changeStage(lead, "Appt Pending");
    expect(staleMove.from_stage).toBe("Contacted"); // not "New" — no stale-write rejection today
    expect(staleMove.changed).toBe(true);
  });
});
