import { describe, expect, it, vi } from "vitest";

const getStatus = vi.hoisted(() => vi.fn(async () => ({ status: "pending" as const })));
vi.mock("@/lib/extension-auth/server", () => ({ getExtensionAuthRequestStatus: getStatus }));

import { GET } from "./route";

describe("GET /api/extension/auth/status", () => {
  it("returns a narrow transaction status", async () => {
    const response = await GET(new Request("http://localhost:3005/api/extension/auth/status?requestId=opaque-request"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, status: "pending" });
  });
});
