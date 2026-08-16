// Regression: a THIRD instance of the same PostgREST-embed bug fixed in
// lib/tasks/server-provider.ts (Regression 2). updateLead() unconditionally ran
// `.from("workspace_memberships").select("user_id, profiles(full_name, email)")` at the top of
// every PATCH — owner-only or status-only alike — which has no direct FK and therefore failed on
// every real request, surfacing as a 422 "invalid" indistinguishable from a genuine bad-payload
// rejection (both map through the same LeadError("invalid", ...) -> statusForCode -> 422 path).
// This is why the hosted QA run's owner-update AND status-transition PATCHes both failed despite
// sending schema-valid bodies: neither ever reached the schema-valid business logic that would
// have succeeded. The fix reuses displayNamesByUserId (two explicit queries) instead of the embed.
import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
type Filter = { type: "eq"; col: string; val: unknown } | { type: "in"; col: string; vals: readonly unknown[] };
type Call = { table: string; select: string; filters: Filter[] };

function applyFilters(rows: readonly Row[], filters: readonly Filter[]): Row[] {
  return rows.filter((row) =>
    filters.every((f) => (f.type === "eq" ? row[f.col] === f.val : f.vals.includes(row[f.col]))),
  );
}

vi.mock("../activity/emit", () => ({ recordActivity: vi.fn().mockResolvedValue(undefined) }));

/** Extends the tasks-test stub with .update() (mutates the in-memory table) and .rpc(), the two
 *  extra shapes updateLead's write path needs beyond the read-only queries listWorkspaceTeam and
 *  assertOwnerInWorkspace exercise. */
function makeSupabaseStub(
  tables: Record<string, Row[]>,
  rpcHandlers: Record<string, (args: Row, tables: Record<string, Row[]>) => Row>,
) {
  const calls: Call[] = [];
  const from = (table: string) => {
    const filters: Filter[] = [];
    let select = "";
    let pendingUpdate: Row | null = null;
    const matched = () => applyFilters(tables[table] ?? [], filters);
    const finish = () => {
      calls.push({ table, select, filters: [...filters] });
      if (pendingUpdate) {
        const rows = matched();
        for (const row of rows) Object.assign(row, pendingUpdate);
        return { data: rows, error: null };
      }
      return { data: matched(), error: null };
    };
    const builder = {
      select(cols: string) {
        select = cols;
        return builder;
      },
      eq(col: string, val: unknown) {
        filters.push({ type: "eq", col, val });
        return builder;
      },
      in(col: string, vals: readonly unknown[]) {
        filters.push({ type: "in", col, vals });
        return builder;
      },
      update(cols: Row) {
        pendingUpdate = cols;
        return builder;
      },
      async maybeSingle() {
        const { data, error } = finish();
        return { data: (data as Row[])[0] ?? null, error };
      },
      then(resolve: (result: { data: Row[]; error: null }) => void) {
        resolve(finish());
      },
    };
    return builder;
  };
  const rpc = async (name: string, args: Row) => {
    const handler = rpcHandlers[name];
    if (!handler) throw new Error(`no rpc handler for ${name}`);
    return { data: handler(args, tables), error: null };
  };
  return { from, rpc, calls };
}

const createClientMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

const LEAD: Row = {
  id: "lead-1",
  workspace_id: "ws-1",
  first_name: "Ada",
  last_name: "Lovelace",
  business_name: "Analytical Engines Co",
  status: "New",
  service_interest: null,
  source_page: null,
  assigned_owner: null,
  appointment_status: "not_started",
  next_follow_up_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const MEMBERSHIP = { workspace_id: "ws-1", user_id: "u-2", role: "member", status: "active" };
const PROFILE = { id: "u-2", full_name: "Grace Hopper", email: "grace@example.test" };

beforeEach(() => {
  createClientMock.mockReset();
});

describe("updateLead (Regression 2, third site — PostgREST embed on workspace_memberships)", () => {
  it("status-only PATCH never issues an embedded profiles(...) select on workspace_memberships", async () => {
    const stub = makeSupabaseStub(
      { leads: [{ ...LEAD }], workspace_memberships: [{ ...MEMBERSHIP }], profiles: [{ ...PROFILE }] },
      {
        change_lead_stage: (_args, tables) => {
          tables.leads![0]!.status = "Contacted";
          return { lead_id: "lead-1", changed: true, from_stage: "New", to_stage: "Contacted" };
        },
      },
    );
    createClientMock.mockResolvedValue(stub);
    const { updateLead } = await import("./server-provider");

    const result = await updateLead({
      workspaceId: "ws-1",
      leadId: "lead-1",
      patch: { status: "Contacted", expectedStatus: "New" },
    });

    expect(result.status).toBe("Contacted");
    const membershipCall = stub.calls.find((c) => c.table === "workspace_memberships");
    expect(membershipCall?.select).not.toContain("profiles(");
    expect(stub.calls.map((c) => c.table)).toContain("profiles");
  });

  it("owner-only PATCH never issues an embedded profiles(...) select on workspace_memberships", async () => {
    const stub = makeSupabaseStub(
      { leads: [{ ...LEAD }], workspace_memberships: [{ ...MEMBERSHIP }], profiles: [{ ...PROFILE }] },
      {},
    );
    createClientMock.mockResolvedValue(stub);
    const { updateLead } = await import("./server-provider");

    const result = await updateLead({
      workspaceId: "ws-1",
      leadId: "lead-1",
      patch: { owner: "u-2" },
    });

    expect(result.owner).toBe("u-2");
    expect(result.ownerName).toBe("Grace Hopper");
    for (const call of stub.calls) expect(call.select).not.toContain("profiles(");
  });
});
