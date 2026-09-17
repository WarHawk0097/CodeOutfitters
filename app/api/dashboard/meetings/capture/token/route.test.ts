import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  demoMode: false,
  context: { userId: "server-user", workspaceId: "server-workspace", role: "owner" } as { userId: string; workspaceId: string; role: string } | null,
}));

vi.mock("@/lib/dashboard/server", () => ({ getDashboardContext: async () => state.context }));

import { POST } from "./route";

describe("POST meetings/capture/token", () => {
  beforeEach(() => {
    state.demoMode = false;
    process.env.MEETING_CAPTURE_TOKEN_SECRET = "test-only-meeting-capture-secret-32-bytes";
    state.context = { userId: "server-user", workspaceId: "server-workspace", role: "owner" };
  });

  it("remains intentionally unavailable in demo mode", async () => {
    state.demoMode = true;
    const response = await POST(new Request("http://localhost:3005/api/dashboard/meetings/capture/token", { method: "POST" }));
    expect(response.status).toBe(404);
  });

  it("issues only a no-store capture credential for an active member", async () => {
    const response = await POST(new Request("http://localhost:3005/api/dashboard/meetings/capture/token", { method: "POST", headers: { origin: "http://localhost:3005" }, body: "{}" }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.token).toEqual(expect.any(String));
    expect(body.expiresAt).toEqual(expect.any(String));
    expect(JSON.stringify(body)).not.toContain("access_token");
    expect(JSON.stringify(body)).not.toContain("refresh_token");
  });

  it("rejects unauthenticated and inactive members", async () => {
    state.context = null;
    const response = await POST(new Request("http://localhost:3005/api/dashboard/meetings/capture/token", { method: "POST" }));
    expect(response.status).toBe(401);
  });

  it("ignores forged identity in the extension request", async () => {
    const response = await POST(new Request("http://localhost:3005/api/dashboard/meetings/capture/token", {
      method: "POST",
      body: JSON.stringify({ userId: "attacker", workspaceId: "other-workspace" }),
      headers: { "content-type": "application/json" },
    }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.token).not.toContain("attacker");
    expect(body.token).not.toContain("other-workspace");
  });
});
vi.mock("@/lib/command-center/mode", () => ({ isDemoMode: () => state.demoMode }));
