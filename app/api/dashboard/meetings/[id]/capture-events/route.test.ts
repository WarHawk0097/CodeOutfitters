import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  demoMode: false,
  context: null as { workspaceId: string } | null,
  load: vi.fn(),
}));

vi.mock("@/lib/command-center/mode", () => ({ isDemoMode: () => state.demoMode }));
vi.mock("@/lib/dashboard/server", () => ({ getDashboardContext: async () => state.context }));
vi.mock("@/lib/meetings/capture/events-server", () => ({ loadCaptureEvents: (...args: unknown[]) => state.load(...args) }));

import { GET } from "./route";

function req(): Request {
  return new Request("https://codeoutfitters.vercel.app/api/dashboard/meetings/11111111-1111-4111-8111-111111111111/capture-events");
}

const SNAPSHOT = {
  meetingStatus: "pending_sync",
  meetingLastError: null,
  artifactState: "capture_active",
  artifactCreatedAt: "2026-09-18T10:00:00.000Z",
  transcriptState: "capture_active",
  entryCount: 2,
  lastSequence: 1,
  lastEntryAt: "2026-09-18T10:01:00.000Z",
  hasInsights: false,
};

describe("GET meetings/[id]/capture-events", () => {
  beforeEach(() => {
    state.demoMode = false;
    state.context = { workspaceId: "ws-1" };
    state.load.mockReset();
    state.load.mockResolvedValue({ meeting: { id: "m-1", status: "pending_sync", lastError: null }, events: SNAPSHOT });
  });

  it("404s in intentional demo mode", async () => {
    state.demoMode = true;
    const res = await GET(req(), { params: Promise.resolve({ id: "m-1" }) });
    expect(res.status).toBe(404);
  });

  it("401s when unauthenticated", async () => {
    state.context = null;
    const res = await GET(req(), { params: Promise.resolve({ id: "m-1" }) });
    expect(res.status).toBe(401);
  });

  it("404s for a meeting outside the workspace (RLS null)", async () => {
    state.load.mockResolvedValue(null);
    const res = await GET(req(), { params: Promise.resolve({ id: "m-1" }) });
    expect(res.status).toBe(404);
  });

  it("returns the derived snapshot with ok:true", async () => {
    const res = await GET(req(), { params: Promise.resolve({ id: "m-1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.artifactState).toBe("capture_active");
    expect(body.entryCount).toBe(2);
  });

  it("returns 503 when the read fails, without leaking error details", async () => {
    state.load.mockRejectedValue(new Error("internal-detail-should-not-escape"));
    const res = await GET(req(), { params: Promise.resolve({ id: "m-1" }) });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("internal-detail-should-not-escape");
  });

  it("never includes secrets or internal payloads in the body", async () => {
    state.load.mockResolvedValue({
      meeting: { id: "m-1", status: "pending_sync", lastError: null },
      events: { ...SNAPSHOT, meetingLastError: "capture-state-code-only" },
    });
    const res = await GET(req(), { params: Promise.resolve({ id: "m-1" }) });
    const body = await res.json();
    const text = JSON.stringify(body);
    for (const forbidden of ["service_role", "apikey", "Bearer", "authorization", "credential", "ciphertext"]) {
      expect(text.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});
