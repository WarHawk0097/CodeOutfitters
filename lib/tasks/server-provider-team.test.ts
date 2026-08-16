// Regression: listWorkspaceTeam() / assertOwnerInWorkspace() PostgREST embed fix.
//
// workspace_memberships and profiles both FK to auth.users independently — there is no direct FK
// between them, so `.select("user_id, role, profiles(full_name, email)")` is not a valid
// PostgREST embed and fails at query time (the reported GET /api/leads 503). The fix replaces the
// embed with two explicit queries joined in application code (see displayNamesByUserId in
// ./server-provider.ts). PGlite has no PostgREST layer, so this can't be proven against a real
// embedded Postgres the way the *.pglite.test.ts suites do — instead this stubs the supabase-js
// query builder just enough to drive the real listWorkspaceTeam/assertOwnerInWorkspace code paths
// and observe exactly which queries they issue.
import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
type Filter = { type: "eq"; col: string; val: unknown } | { type: "in"; col: string; vals: readonly unknown[] };
type Call = { table: string; select: string; filters: Filter[] };

function applyFilters(rows: readonly Row[], filters: readonly Filter[]): Row[] {
  return rows.filter((row) =>
    filters.every((f) => (f.type === "eq" ? row[f.col] === f.val : f.vals.includes(row[f.col]))),
  );
}

/** A minimal thenable stand-in for the supabase-js query builder: enough of
 *  from().select().eq().eq()/.in() to drive listWorkspaceTeam and assertOwnerInWorkspace exactly
 *  as they call it, and to record what each call asked for. */
function makeSupabaseStub(tables: Record<string, Row[]>) {
  const calls: Call[] = [];
  const from = (table: string) => {
    const filters: Filter[] = [];
    let select = "";
    const finish = () => {
      calls.push({ table, select, filters: [...filters] });
      return { data: applyFilters(tables[table] ?? [], filters), error: null };
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
      async maybeSingle() {
        const { data, error } = finish();
        return { data: data[0] ?? null, error };
      },
      then(resolve: (result: { data: Row[]; error: null }) => void) {
        resolve(finish());
      },
    };
    return builder;
  };
  return { from, calls };
}

const createClientMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

let stub: ReturnType<typeof makeSupabaseStub>;

function seed(tables: Record<string, Row[]>) {
  stub = makeSupabaseStub(tables);
  createClientMock.mockResolvedValue(stub);
}

beforeEach(() => {
  createClientMock.mockReset();
});

describe("listWorkspaceTeam (Regression 2 — PostgREST embed fix)", () => {
  it("issues two separate queries, never an embedded profiles(...) select on workspace_memberships", async () => {
    const { listWorkspaceTeam } = await import("./server-provider");
    seed({
      workspace_memberships: [{ workspace_id: "ws-1", user_id: "u-1", role: "owner", status: "active" }],
      profiles: [{ id: "u-1", full_name: "Ada Lovelace", email: "ada@example.test" }],
    });
    await listWorkspaceTeam("ws-1");
    expect(stub.calls.map((c) => c.table)).toEqual(["workspace_memberships", "profiles"]);
    expect(stub.calls[0]!.select).not.toContain("profiles(");
  });

  it("multiple workspace members: returns id/name/role for each, workspace-scoped and active-only", async () => {
    const { listWorkspaceTeam } = await import("./server-provider");
    seed({
      workspace_memberships: [
        { workspace_id: "ws-1", user_id: "u-1", role: "owner", status: "active" },
        { workspace_id: "ws-1", user_id: "u-2", role: "member", status: "active" },
        { workspace_id: "ws-1", user_id: "u-3", role: "member", status: "invited" },
      ],
      profiles: [
        { id: "u-1", full_name: "Ada Lovelace", email: "ada@example.test" },
        { id: "u-2", full_name: "Grace Hopper", email: "grace@example.test" },
      ],
    });
    const team = await listWorkspaceTeam("ws-1");
    // u-3 is excluded by the .eq("status", "active") filter, exactly as before the fix.
    expect(team).toEqual([
      { id: "u-1", name: "Ada Lovelace", role: "owner" },
      { id: "u-2", name: "Grace Hopper", role: "member" },
    ]);
  });

  it("zero members: returns [] and never queries profiles", async () => {
    const { listWorkspaceTeam } = await import("./server-provider");
    seed({ workspace_memberships: [], profiles: [{ id: "u-1", full_name: "Ada", email: "a@x.test" }] });
    const team = await listWorkspaceTeam("ws-empty");
    expect(team).toEqual([]);
    expect(stub.calls.map((c) => c.table)).toEqual(["workspace_memberships"]);
  });

  it("member with a profile row missing full_name falls back to email, then to Unnamed", async () => {
    const { listWorkspaceTeam } = await import("./server-provider");
    seed({
      workspace_memberships: [
        { workspace_id: "ws-1", user_id: "u-1", role: "member", status: "active" },
        { workspace_id: "ws-1", user_id: "u-2", role: "member", status: "active" },
      ],
      profiles: [
        { id: "u-1", full_name: null, email: "only-email@example.test" },
        { id: "u-2", full_name: null, email: null },
      ],
    });
    const team = await listWorkspaceTeam("ws-1");
    expect(team).toEqual([
      { id: "u-1", name: "only-email@example.test", role: "member" },
      { id: "u-2", name: "Unnamed", role: "member" },
    ]);
  });

  it("member with no profiles row at all resolves to Unnamed rather than throwing", async () => {
    const { listWorkspaceTeam } = await import("./server-provider");
    seed({
      workspace_memberships: [{ workspace_id: "ws-1", user_id: "ghost", role: "member", status: "active" }],
      profiles: [],
    });
    const team = await listWorkspaceTeam("ws-1");
    expect(team).toEqual([{ id: "ghost", name: "Unnamed", role: "member" }]);
  });

  it("workspace isolation: a member of another workspace never appears", async () => {
    const { listWorkspaceTeam } = await import("./server-provider");
    seed({
      workspace_memberships: [
        { workspace_id: "ws-1", user_id: "u-1", role: "owner", status: "active" },
        { workspace_id: "ws-2", user_id: "u-2", role: "owner", status: "active" },
      ],
      profiles: [
        { id: "u-1", full_name: "Ada Lovelace", email: "ada@example.test" },
        { id: "u-2", full_name: "Outsider", email: "outsider@example.test" },
      ],
    });
    const team = await listWorkspaceTeam("ws-1");
    expect(team.map((m) => m.id)).toEqual(["u-1"]);
  });
});

describe("assertOwnerInWorkspace (same embed fix)", () => {
  it("resolves the display name of a valid active member without an embedded select", async () => {
    const { assertOwnerInWorkspace } = await import("./server-provider");
    seed({
      workspace_memberships: [{ workspace_id: "ws-1", user_id: "u-1", role: "member", status: "active" }],
      profiles: [{ id: "u-1", full_name: "Ada Lovelace", email: "ada@example.test" }],
    });
    const name = await assertOwnerInWorkspace(stub as never, "ws-1", "u-1");
    expect(name).toBe("Ada Lovelace");
    expect(stub.calls[0]!.select).not.toContain("profiles(");
  });

  it("throws for a user who is not an active member of the workspace, without querying profiles", async () => {
    const { assertOwnerInWorkspace, TaskError } = await import("./server-provider");
    seed({
      workspace_memberships: [{ workspace_id: "ws-1", user_id: "u-1", role: "member", status: "invited" }],
      profiles: [{ id: "u-1", full_name: "Ada Lovelace", email: "ada@example.test" }],
    });
    await expect(assertOwnerInWorkspace(stub as never, "ws-1", "u-1")).rejects.toBeInstanceOf(TaskError);
    expect(stub.calls.map((c) => c.table)).toEqual(["workspace_memberships"]);
  });
});
