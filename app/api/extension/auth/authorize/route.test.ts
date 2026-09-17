import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  context: { userId: "user-1", workspaceId: "workspace-1" } as { userId: string; workspaceId: string } | null,
  allowed: true,
  create: vi.fn(async (context?: unknown, input?: unknown) => { void context; void input; return "one-time-code"; }),
}));

vi.mock("@/lib/dashboard/server", () => ({ getDashboardContext: async () => state.context }));
vi.mock("@/lib/extension-auth/server", () => ({
  isAllowedExtensionRedirect: () => state.allowed,
  createAuthorizationCode: (context: unknown, input: unknown) => state.create(context, input),
}));

import { GET } from "./route";

describe("GET /api/extension/auth/authorize", () => {
  beforeEach(() => { state.context = { userId: "user-1", workspaceId: "workspace-1" }; state.allowed = true; state.create.mockClear(); });

  it("binds the one-time code to the server-derived authenticated context", async () => {
    const response = await GET(new Request("http://localhost:3005/api/extension/auth/authorize?state=state-1&redirect_uri=https%3A%2F%2Fabc.chromiumapp.org%2Fextension-auth&code_challenge=challenge-1"));
    expect(response.status).toBe(302);
    expect(state.create).toHaveBeenCalledWith({ userId: "user-1", workspaceId: "workspace-1" }, { state: "state-1", redirectUri: "https://abc.chromiumapp.org/extension-auth", codeChallenge: "challenge-1" });
    expect(response.headers.get("location")).toContain("code=one-time-code");
  });

  it("redirects an unauthenticated browser flow through the existing login page", async () => {
    state.context = null;
    const response = await GET(new Request("http://localhost:3005/api/extension/auth/authorize?state=s&redirect_uri=https%3A%2F%2Fabc.chromiumapp.org%2Fextension-auth&code_challenge=c"));
    expect(response.status).toBe(302);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("returnTo")).toContain("/api/extension/auth/authorize");
    state.context = { userId: "u", workspaceId: "w" };
    state.allowed = false;
    expect((await GET(new Request("http://localhost:3005/api/extension/auth/authorize?state=s&redirect_uri=https%3A%2F%2Fevil.example%2F&code_challenge=c"))).status).toBe(400);
  });
});
