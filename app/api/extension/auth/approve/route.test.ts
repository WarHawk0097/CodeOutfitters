import { describe, expect, it, vi } from "vitest";

const approve = vi.hoisted(() => vi.fn(async () => true));
const context = vi.hoisted(() => vi.fn(async () => ({ userId: "server-user", workspaceId: "server-workspace", name: "T. Samuel", workspaceName: "Workspace" })));
vi.mock("@/lib/extension-auth/server", () => ({ authorizeExtensionAuthRequest: approve }));
vi.mock("@/lib/dashboard/server", () => ({ getDashboardContext: context }));

import { POST } from "./route";

describe("POST /api/extension/auth/approve", () => {
  it("authorizes from the server dashboard context", async () => {
    const response = await POST(new Request("http://localhost:3005/api/extension/auth/approve", { method: "POST", body: JSON.stringify({ requestId: "request", state: "state", codeChallenge: "challenge" }), headers: { "content-type": "application/json" } }));
    expect(response.status).toBe(303);
    expect(approve).toHaveBeenCalledWith({ userId: "server-user", workspaceId: "server-workspace", name: "T. Samuel", workspaceName: "Workspace" }, { requestId: "request", state: "state", codeChallenge: "challenge" });
  });
});
