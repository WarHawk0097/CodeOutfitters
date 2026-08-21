import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  demoMode: false,
  context: { userId: "user-1", email: "a@example.test", workspaceId: "ws-1", workspaceName: "Acme", role: "owner" } as
    | { userId: string; email: string; workspaceId: string; workspaceName: string; role: string }
    | null,
  createOAuthState: vi.fn(),
  buildGoogleAuthorizationUrl: vi.fn(),
  connect: vi.fn(),
}));

vi.mock("@/lib/command-center/mode", () => ({ isDemoMode: () => state.demoMode }));
vi.mock("@/lib/dashboard/server", () => ({ getDashboardContext: async () => state.context }));
vi.mock("@/lib/integrations/oauth-state", () => ({ createOAuthState: (...args: unknown[]) => state.createOAuthState(...args) }));
// Only the URL builder is stubbed. isGoogleCapability stays real on purpose — it IS the
// capability allowlist, and a test that mocked it would prove nothing about what this
// route will accept.
vi.mock("@/lib/integrations/providers/google", async () => {
  const actual = await vi.importActual<typeof import("@/lib/integrations/providers/google")>(
    "@/lib/integrations/providers/google",
  );
  return { ...actual, buildGoogleAuthorizationUrl: (...args: unknown[]) => state.buildGoogleAuthorizationUrl(...args) };
});
vi.mock("@/lib/integrations/store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/integrations/store")>("@/lib/integrations/store");
  return { ...actual, connect: (...args: unknown[]) => state.connect(...args) };
});

import { POST } from "./route";

function req(body: unknown): Request {
  return new Request("https://example.test/api/dashboard/integrations/connections/connect", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST integrations/connections/connect", () => {
  beforeEach(() => {
    state.demoMode = false;
    state.context = { userId: "user-1", email: "a@example.test", workspaceId: "ws-1", workspaceName: "Acme", role: "owner" };
    state.createOAuthState.mockReset();
    state.buildGoogleAuthorizationUrl.mockReset();
    state.connect.mockReset();
  });

  it("404s in demo mode", async () => {
    state.demoMode = true;
    const res = await POST(req({ provider: "google_calendar" }));
    expect(res.status).toBe(404);
  });

  it("401s when there is no session", async () => {
    state.context = null;
    const res = await POST(req({ provider: "google_calendar" }));
    expect(res.status).toBe(401);
  });

  it("google_calendar: returns an authorization URL, no code required, no token material in the body", async () => {
    state.createOAuthState.mockResolvedValue("nonce-abc");
    state.buildGoogleAuthorizationUrl.mockReturnValue("https://accounts.google.com/o/oauth2/v2/auth?mock=1");

    const res = await POST(req({ provider: "google_calendar" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true, authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?mock=1" });
    expect(JSON.stringify(body)).not.toMatch(/access_token|refresh_token|credential/i);
    expect(state.createOAuthState).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      userId: "user-1",
      provider: "google_calendar",
    });
  });

  it("P: state is bound to the session's own workspace — a client-supplied workspace_id is ignored (cross-workspace connect denial)", async () => {
    state.createOAuthState.mockResolvedValue("nonce-abc");
    state.buildGoogleAuthorizationUrl.mockReturnValue("https://accounts.google.com/mock");

    await POST(req({ provider: "google_calendar", workspace_id: "someone-elses-workspace" }));

    expect(state.createOAuthState).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: "ws-1" }),
    );
  });

  it("S: fails closed (503) when Google OAuth is not configured, without a raw error body", async () => {
    state.createOAuthState.mockResolvedValue("nonce-abc");
    state.buildGoogleAuthorizationUrl.mockImplementation(() => {
      throw new Error("Google OAuth is not configured on this server.");
    });

    const res = await POST(req({ provider: "google_calendar" }));
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(JSON.stringify(body)).not.toMatch(/GOOGLE_OAUTH_CLIENT/i);
  });

  it("rejects an unsupported provider", async () => {
    const res = await POST(req({ provider: "not_a_provider" }));
    expect(res.status).toBe(422);
  });

  it("local_test still requires a code and never touches the Google state path", async () => {
    const res = await POST(req({ provider: "local_test" }));
    expect(res.status).toBe(422);
    expect(state.createOAuthState).not.toHaveBeenCalled();
  });

  // Incremental authorization: the caller may name a capability, and the route decides
  // which ones exist. A client that could name an arbitrary capability would be a client
  // that could widen its own Google grant.
  it("passes a named capability through to the authorization URL builder", async () => {
    state.createOAuthState.mockResolvedValue("nonce-abc");
    state.buildGoogleAuthorizationUrl.mockReturnValue("https://accounts.google.com/mock");

    const res = await POST(req({ provider: "google_calendar", capability: "meet" }));

    expect(res.status).toBe(200);
    expect(state.buildGoogleAuthorizationUrl).toHaveBeenCalledWith("nonce-abc", ["meet"]);
  });

  it("asks for no extra scope when no capability is named", async () => {
    state.createOAuthState.mockResolvedValue("nonce-abc");
    state.buildGoogleAuthorizationUrl.mockReturnValue("https://accounts.google.com/mock");

    await POST(req({ provider: "google_calendar" }));

    expect(state.buildGoogleAuthorizationUrl).toHaveBeenCalledWith("nonce-abc", []);
  });

  it("422s on a capability that is not on the allowlist, and starts no OAuth flow", async () => {
    for (const capability of ["gmail", "drive", "meetings.space.created", "toString", 7]) {
      const res = await POST(req({ provider: "google_calendar", capability }));
      expect(res.status).toBe(422);
    }
    expect(state.createOAuthState).not.toHaveBeenCalled();
    expect(state.buildGoogleAuthorizationUrl).not.toHaveBeenCalled();
  });
});
