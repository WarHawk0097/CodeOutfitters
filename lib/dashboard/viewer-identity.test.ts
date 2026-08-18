// Regression: getDashboardContext() now also resolves the signed-in person's
// display name/initials (see lib/identity/display-name.ts), so the sidebar/
// header no longer read the hardcoded demo CURRENT_USER for a live session.
// Same supabase-js query-builder stub as lib/tasks/server-provider-team.test.ts,
// extended with .auth.getUser() since getDashboardContext calls it directly.
import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
type Filter = { type: "eq"; col: string; val: unknown };
type Call = { table: string; select: string; filters: Filter[] };

function applyFilters(rows: readonly Row[], filters: readonly Filter[]): Row[] {
  return rows.filter((row) => filters.every((f) => row[f.col] === f.val));
}

type StubUser = { id: string; email?: string; user_metadata?: Record<string, unknown> } | null;

function makeSupabaseStub(user: StubUser, tables: Record<string, Row[]>) {
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
  return {
    auth: { getUser: async () => ({ data: { user } }) },
    from,
    calls,
  };
}

const createClientMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

beforeEach(() => {
  createClientMock.mockReset();
});

function seed(user: StubUser, tables: Record<string, Row[]>) {
  const stub = makeSupabaseStub(user, tables);
  createClientMock.mockResolvedValue(stub);
  return stub;
}

const MEMBERSHIP = (userId: string, workspaceId = "ws-1") => ({
  workspace_id: workspaceId,
  user_id: userId,
  role: "owner",
  status: "active",
  workspaces: { name: "QA Workspace" },
});

describe("getDashboardContext viewer identity", () => {
  it("resolves the real signed-in name/initials, not the demo CURRENT_USER identity", async () => {
    const { getDashboardContext } = await import("./server");
    seed(
      { id: "u-tsamuel", email: "tsamuel@souvenirphotograph.com", user_metadata: { full_name: "Tay Samuel" } },
      { workspace_memberships: [MEMBERSHIP("u-tsamuel")], profiles: [] },
    );
    const ctx = await getDashboardContext();
    expect(ctx?.name).toBe("Tay Samuel");
    expect(ctx?.initials).toBe("TS");
    expect(ctx?.name).not.toBe("Marc Bryce");
  });

  it("two different signed-in users never inherit each other's name", async () => {
    const { getDashboardContext } = await import("./server");

    seed(
      { id: "u-tsamuel", email: "tsamuel@souvenirphotograph.com", user_metadata: { full_name: "Tay Samuel" } },
      { workspace_memberships: [MEMBERSHIP("u-tsamuel")], profiles: [] },
    );
    const first = await getDashboardContext();

    seed(
      { id: "u-mbryce", email: "mbryce@souvenirphotograph.com", user_metadata: { given_name: "Mark", family_name: "Bryce" } },
      { workspace_memberships: [MEMBERSHIP("u-mbryce")], profiles: [] },
    );
    const second = await getDashboardContext();

    expect(first?.name).toBe("Tay Samuel");
    expect(second?.name).toBe("Mark Bryce");
    expect(first?.name).not.toBe(second?.name);
  });

  it("the profiles lookup is scoped to the caller's own id, not any other row", async () => {
    const { getDashboardContext } = await import("./server");
    const stub = seed(
      { id: "u-tsamuel", email: "tsamuel@souvenirphotograph.com" },
      {
        workspace_memberships: [MEMBERSHIP("u-tsamuel")],
        profiles: [
          { id: "u-tsamuel", full_name: "Real Profile Name" },
          { id: "someone-else", full_name: "Should Never Be Read" },
        ],
      },
    );
    const ctx = await getDashboardContext();
    expect(ctx?.name).toBe("Real Profile Name");
    const profilesCall = stub.calls.find((c) => c.table === "profiles");
    expect(profilesCall?.filters).toEqual([{ type: "eq", col: "id", val: "u-tsamuel" }]);
  });

  it("falls back to the email local-part when there is no profile row and no provider name", async () => {
    const { getDashboardContext } = await import("./server");
    seed(
      { id: "u-noname", email: "your-real-email+codeoutfitters-qa@gmail.com", user_metadata: {} },
      { workspace_memberships: [MEMBERSHIP("u-noname")], profiles: [] },
    );
    const ctx = await getDashboardContext();
    expect(ctx?.name).toBe("your-real-email+codeoutfitters-qa");
    expect(ctx?.initials).not.toBe("?");
  });

  it("no session: returns null rather than a demo/placeholder identity", async () => {
    const { getDashboardContext } = await import("./server");
    seed(null, { workspace_memberships: [], profiles: [] });
    const ctx = await getDashboardContext();
    expect(ctx).toBeNull();
  });
});
