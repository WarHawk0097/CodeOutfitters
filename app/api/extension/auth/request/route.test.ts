import { beforeEach, describe, expect, it, vi } from "vitest";

const createRequest = vi.hoisted(() => vi.fn(async () => ({ requestId: "opaque-request", expiresAt: "2026-08-23T01:00:00.000Z" })));
vi.mock("@/lib/extension-auth/server", () => ({ createExtensionAuthRequest: createRequest }));

import { POST } from "./route";

describe("POST /api/extension/auth/request", () => {
  beforeEach(() => createRequest.mockClear());
  it("returns only the opaque request handle and expiry", async () => {
    const response = await POST(new Request("http://localhost:3005/api/extension/auth/request", { method: "POST", body: JSON.stringify({ state: "state-that-is-long-enough", codeChallenge: "challenge-that-is-long-enough" }), headers: { "content-type": "application/json" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, requestId: "opaque-request", expiresAt: "2026-08-23T01:00:00.000Z" });
  });

  it("rejects incomplete transaction input", async () => {
    const response = await POST(new Request("http://localhost:3005/api/extension/auth/request", { method: "POST", body: "{}" }));
    expect(response.status).toBe(422);
    expect(createRequest).not.toHaveBeenCalled();
  });
});
