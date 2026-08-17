import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  demoMode: false,
  context: { userId: "user-1", email: "a@example.test", workspaceId: "ws-1", workspaceName: "Acme", role: "owner" } as
    | { userId: string; email: string; workspaceId: string; workspaceName: string; role: string }
    | null,
  consumeOAuthState: vi.fn(),
  connect: vi.fn(),
}));

vi.mock("@/lib/command-center/mode", () => ({ isDemoMode: () => state.demoMode }));
vi.mock("@/lib/dashboard/server", () => ({ getDashboardContext: async () => state.context }));
vi.mock("@/lib/integrations/oauth-state", () => ({
  consumeOAuthState: (...args: unknown[]) => state.consumeOAuthState(...args),
}));
vi.mock("@/lib/integrations/store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/integrations/store")>("@/lib/integrations/store");
  return { ...actual, connect: (...args: unknown[]) => state.connect(...args) };
});

import { GET, POST } from "./route";

function postReq(body: unknown): Request {
  return new Request("https://example.test/api/dashboard/integrations/connections/callback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getReq(query: string): Request {
  return new Request(`https://example.test/api/dashboard/integrations/connections/callback${query}`);
}

function redirectStatus(res: Response): { google: string | null; detail: string | null } {
  const location = res.headers.get("location")!;
  const url = new URL(location);
  return { google: url.searchParams.get("google"), detail: url.searchParams.get("google_detail") };
}

describe("integrations/connections/callback", () => {
  beforeEach(() => {
    state.demoMode = false;
    state.context = { userId: "user-1", email: "a@example.test", workspaceId: "ws-1", workspaceName: "Acme", role: "owner" };
    state.consumeOAuthState.mockReset();
    state.connect.mockReset();
  });

  describe("POST", () => {
    it("rejects google_calendar — it may only complete through GET's state/code exchange", async () => {
      const res = await POST(postReq({ provider: "google_calendar", code: "whatever" }));
      expect(res.status).toBe(422);
      expect(state.connect).not.toHaveBeenCalled();
    });

    it("still completes local_test", async () => {
      state.connect.mockResolvedValue({ id: "conn-1" });
      const res = await POST(postReq({ provider: "local_test", code: "acct-1" }));
      expect(res.status).toBe(200);
    });
  });

  describe("GET (Google's redirect)", () => {
    it("F: access_denied is handled — redirects to a safe status, no raw provider text", async () => {
      const res = await GET(getReq("?error=access_denied"));
      expect(res.status).toBe(302);
      expect(redirectStatus(res)).toEqual({ google: "error", detail: "access_denied" });
      expect(state.consumeOAuthState).not.toHaveBeenCalled();
    });

    it("a provider error other than access_denied is generalized, not echoed", async () => {
      const res = await GET(getReq("?error=server_error%3A+internal+detail"));
      expect(redirectStatus(res).detail).toBe("provider_error");
    });

    it("missing state or code is rejected", async () => {
      const res = await GET(getReq("?code=abc"));
      expect(redirectStatus(res)).toEqual({ google: "error", detail: "invalid_request" });
      expect(state.consumeOAuthState).not.toHaveBeenCalled();
    });

    it("D: a state that doesn't consume (tampered/unknown/reused) is rejected", async () => {
      state.consumeOAuthState.mockResolvedValue(null);
      const res = await GET(getReq("?code=abc&state=bad-nonce"));
      expect(redirectStatus(res)).toEqual({ google: "error", detail: "invalid_state" });
      expect(state.connect).not.toHaveBeenCalled();
    });

    it("Q: the callback cannot attach to an arbitrary workspace — session must match the state's own binding", async () => {
      state.consumeOAuthState.mockResolvedValue({ workspaceId: "ws-1", userId: "user-1" });
      state.context = { userId: "user-1", email: "a@example.test", workspaceId: "someone-elses-workspace", workspaceName: "Other", role: "owner" };

      const res = await GET(getReq("?code=abc&state=nonce-1"));

      expect(redirectStatus(res)).toEqual({ google: "error", detail: "session_mismatch" });
      expect(state.connect).not.toHaveBeenCalled();
    });

    it("no session at callback time is rejected", async () => {
      state.consumeOAuthState.mockResolvedValue({ workspaceId: "ws-1", userId: "user-1" });
      state.context = null;

      const res = await GET(getReq("?code=abc&state=nonce-1"));

      expect(redirectStatus(res)).toEqual({ google: "error", detail: "session_mismatch" });
    });

    it("H: exchange failure is handled safely", async () => {
      state.consumeOAuthState.mockResolvedValue({ workspaceId: "ws-1", userId: "user-1" });
      state.connect.mockRejectedValue(new Error("raw provider detail"));

      const res = await GET(getReq("?code=abc&state=nonce-1"));

      expect(redirectStatus(res)).toEqual({ google: "error", detail: "exchange_failed" });
    });

    it("success redirects to the settings UI with a connected status, never the code/state/tokens", async () => {
      state.consumeOAuthState.mockResolvedValue({ workspaceId: "ws-1", userId: "user-1" });
      state.connect.mockResolvedValue({ id: "conn-1" });

      const res = await GET(getReq("?code=auth-code-1&state=nonce-1"));

      expect(res.status).toBe(302);
      const location = res.headers.get("location")!;
      expect(redirectStatus(res)).toEqual({ google: "connected", detail: null });
      expect(location).not.toMatch(/auth-code-1|nonce-1/);
      expect(state.connect).toHaveBeenCalledWith("ws-1", "google_calendar", "auth-code-1");
    });

    it("404s (as a safe redirect) in demo mode", async () => {
      state.demoMode = true;
      const res = await GET(getReq("?code=abc&state=nonce-1"));
      expect(redirectStatus(res)).toEqual({ google: "error", detail: "not_available" });
      expect(state.consumeOAuthState).not.toHaveBeenCalled();
    });
  });
});
