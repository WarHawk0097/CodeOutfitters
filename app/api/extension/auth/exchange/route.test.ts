import { describe, expect, it, vi } from "vitest";

const exchange = vi.hoisted(() => vi.fn(async () => ({ accessToken: "opaque-session", expiresAt: "2026-08-24T00:00:00.000Z", accountName: "T. Samuel", workspaceName: "Workspace" })));
const ExchangeError = vi.hoisted(() => class extends Error { constructor(public readonly code: string) { super(code); } });
vi.mock("@/lib/extension-auth/server", () => ({ ExtensionAuthExchangeError: ExchangeError, exchangeExtensionAuthRequest: exchange, safeExtensionAuthResponse: (input: Record<string, unknown>) => ({ ...input, scope: "meeting_capture" }) }));

import { POST } from "./route";

describe("POST /api/extension/auth/exchange", () => {
  it("exchanges one authorized request with the PKCE verifier", async () => {
    const response = await POST(new Request("http://localhost:3005/api/extension/auth/exchange", { method: "POST", body: JSON.stringify({ requestId: "request", verifier: "verifier" }), headers: { "content-type": "application/json" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, accessToken: "opaque-session", expiresAt: "2026-08-24T00:00:00.000Z", accountName: "T. Samuel", workspaceName: "Workspace", scope: "meeting_capture" });
  });

  it.each([
    ["EXCHANGE_REQUEST_NOT_FOUND", 404], ["EXCHANGE_NOT_AUTHORIZED", 409], ["EXCHANGE_ALREADY_CONSUMED", 409],
    ["EXCHANGE_EXPIRED", 410], ["EXCHANGE_PKCE_MISMATCH", 409], ["EXCHANGE_SESSION_CREATE_FAILED", 503],
  ])("returns safe status for %s", async (code, status) => {
    exchange.mockRejectedValueOnce(new ExchangeError(code));
    const response = await POST(new Request("http://localhost:3005/api/extension/auth/exchange", { method: "POST", body: JSON.stringify({ requestId: "request", verifier: "verifier" }), headers: { "content-type": "application/json" } }));
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ ok: false, error: { code } });
  });

  it("uses the exact requestId/verifier JSON contract", async () => {
    exchange.mockClear();
    await POST(new Request("http://localhost:3005/api/extension/auth/exchange", { method: "POST", body: JSON.stringify({ requestId: "opaque-request", verifier: "persisted-verifier" }), headers: { "content-type": "application/json" } }));
    expect(exchange).toHaveBeenCalledWith({ requestId: "opaque-request", verifier: "persisted-verifier" });
  });
});
