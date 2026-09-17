import { beforeEach, describe, expect, it, vi } from "vitest";

const exchange = vi.hoisted(() => vi.fn(async () => ({ accessToken: "opaque-session", expiresAt: "2026-08-24T00:00:00.000Z", userId: "u", workspaceId: "w" })));
vi.mock("@/lib/extension-auth/server", () => ({ exchangeAuthorizationCode: exchange, safeExtensionAuthResponse: (input: { accessToken: string; expiresAt: string }) => ({ accessToken: input.accessToken, expiresAt: input.expiresAt, scope: "meeting_capture" }) }));

import { POST } from "./route";

describe("POST /api/extension/auth/token", () => {
  beforeEach(() => exchange.mockClear());
  it("exchanges only the code and PKCE verifier into a scoped opaque session", async () => {
    const response = await POST(new Request("http://localhost:3005/api/extension/auth/token", { method: "POST", body: JSON.stringify({ code: "code", verifier: "verifier", redirectUri: "https://abc.chromiumapp.org/extension-auth" }), headers: { "content-type": "application/json" } }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, accessToken: "opaque-session", expiresAt: "2026-08-24T00:00:00.000Z", scope: "meeting_capture" });
    expect(JSON.stringify(body)).not.toContain("refresh_token");
  });

  it("rejects incomplete requests", async () => {
    const response = await POST(new Request("http://localhost:3005/api/extension/auth/token", { method: "POST", body: "{}" }));
    expect(response.status).toBe(422);
    expect(exchange).not.toHaveBeenCalled();
  });
});
