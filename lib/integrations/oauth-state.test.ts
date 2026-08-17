import { describe, it, expect, vi, beforeEach } from "vitest";

// Chainable stub matching exactly the .from().insert() and
// .from().update().eq().eq().is().gt().select().maybeSingle() call shapes
// oauth-state.ts issues — proves it builds the right filters, not Postgres's atomicity
// (that's oauth-state.pglite.test.ts's job).
const state = { insertResult: { error: null as unknown }, updateResult: { data: null as unknown, error: null as unknown } };
const calls: { method: string; args: unknown[] }[] = [];

function chain(methods: string[], terminal: () => unknown) {
  const obj: Record<string, (...args: unknown[]) => unknown> = {};
  for (const method of methods) {
    obj[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return obj;
    };
  }
  obj.maybeSingle = () => {
    calls.push({ method: "maybeSingle", args: [] });
    return terminal();
  };
  return obj;
}

const mockSupabase = {
  from: (table: string) => {
    calls.push({ method: "from", args: [table] });
    return {
      insert: (...args: unknown[]) => {
        calls.push({ method: "insert", args });
        return Promise.resolve(state.insertResult);
      },
      update: (...args: unknown[]) => {
        calls.push({ method: "update", args });
        return chain(["eq", "is", "gt", "select"], () => Promise.resolve(state.updateResult));
      },
    };
  },
};

vi.mock("./store", () => ({ getServiceClient: () => mockSupabase }));

import { createOAuthState, consumeOAuthState } from "./oauth-state";

describe("integrations/oauth-state", () => {
  beforeEach(() => {
    calls.length = 0;
    state.insertResult = { error: null };
    state.updateResult = { data: null, error: null };
  });

  it("createOAuthState inserts a nonce scoped to workspace, user, and provider with a future expiry", async () => {
    const nonce = await createOAuthState({ workspaceId: "ws-1", userId: "user-1", provider: "google_calendar" });

    expect(nonce).toMatch(/^[\w-]{20,}$/);
    const insertCall = calls.find((c) => c.method === "insert");
    const row = insertCall!.args[0] as Record<string, unknown>;
    expect(row).toMatchObject({ workspace_id: "ws-1", user_id: "user-1", provider: "google_calendar", nonce });
    expect(new Date(row.expires_at as string).getTime()).toBeGreaterThan(Date.now());
  });

  it("createOAuthState throws when the insert fails", async () => {
    state.insertResult = { error: { message: "boom" } };
    await expect(
      createOAuthState({ workspaceId: "ws-1", userId: "user-1", provider: "google_calendar" }),
    ).rejects.toThrow();
  });

  it("C: consumeOAuthState returns the bound workspace/user on a valid, unconsumed, unexpired nonce", async () => {
    state.updateResult = { data: { workspace_id: "ws-1", user_id: "user-1" }, error: null };

    const result = await consumeOAuthState("nonce-1", "google_calendar");

    expect(result).toEqual({ workspaceId: "ws-1", userId: "user-1" });
    const updateCall = calls.find((c) => c.method === "eq" && c.args[0] === "nonce");
    expect(updateCall!.args).toEqual(["nonce", "nonce-1"]);
    const providerCall = calls.find((c) => c.method === "eq" && c.args[0] === "provider");
    expect(providerCall!.args).toEqual(["provider", "google_calendar"]);
    expect(calls.some((c) => c.method === "is" && c.args[0] === "consumed_at" && c.args[1] === null)).toBe(true);
    expect(calls.some((c) => c.method === "gt" && c.args[0] === "expires_at")).toBe(true);
  });

  it("D: consumeOAuthState returns null when no row matches (tampered/unknown nonce)", async () => {
    state.updateResult = { data: null, error: null };
    const result = await consumeOAuthState("wrong-nonce", "google_calendar");
    expect(result).toBeNull();
  });

  it("consumeOAuthState returns null on a query error rather than throwing", async () => {
    state.updateResult = { data: null, error: { message: "db error" } };
    const result = await consumeOAuthState("nonce-1", "google_calendar");
    expect(result).toBeNull();
  });

  it("consumeOAuthState returns null immediately for an empty nonce, without querying", async () => {
    const result = await consumeOAuthState("", "google_calendar");
    expect(result).toBeNull();
    expect(calls).toHaveLength(0);
  });
});
