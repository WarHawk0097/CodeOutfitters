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
import type { RecordingEventsSnapshot } from "@/lib/meetings/capture/events";

function req(): Request {
  return new Request("https://codeoutfitters.vercel.app/api/dashboard/meetings/11111111-1111-4111-8111-111111111111/capture-events");
}

// What the route now returns: the DERIVED snapshot, exactly what useCaptureEvents
// consumes (the route↔client integration itself is proven by route.contract.test.ts
// against the real loadCaptureEvents; here the loader is the mocked boundary).
const SNAPSHOT: RecordingEventsSnapshot = {
  phase: "recording",
  recording: true,
  entryCount: 2,
  lastSequence: 1,
  startedAt: "2026-09-18T10:00:00.000Z",
  lastError: null,
  events: [
    { id: "transcript-entries-received", type: "transcript_entries_received", label: "Transcribing audio", status: "active", timestamp: "2026-09-18T10:01:00.000Z", description: "2 transcript entries captured", sequence: 0 },
    { id: "capture-session-started", type: "capture_session_started", label: "Capture session started", status: "success", timestamp: "2026-09-18T10:00:00.000Z", description: null, sequence: 1 },
  ],
};

describe("GET meetings/[id]/capture-events", () => {
  beforeEach(() => {
    state.demoMode = false;
    state.context = { workspaceId: "ws-1" };
    state.load.mockReset();
    state.load.mockResolvedValue({ meeting: { id: "m-1", status: "pending_sync", lastError: null }, snapshot: SNAPSHOT });
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

  it("returns the derived snapshot with ok:true — the shape useCaptureEvents consumes", async () => {
    const res = await GET(req(), { params: Promise.resolve({ id: "m-1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.phase).toBe("recording");
    expect(body.recording).toBe(true);
    expect(body.entryCount).toBe(2);
    expect(body.lastSequence).toBe(1);
    expect(body.startedAt).toBe("2026-09-18T10:00:00.000Z");
    expect(body.lastError).toBeNull();
    expect(body.events[0]).toMatchObject({ type: "transcript_entries_received", sequence: 0 });
  });

  it("returns the loader's snapshot verbatim as the body — raw input is barred at the type level", async () => {
    // loadCaptureEvents is typed to return the DERIVED RecordingEventsSnapshot; the
    // route serializes it unchanged. That a real snapshot (not raw CaptureEventsInput)
    // flows end to end is proven by route.contract.test.ts against the real loader —
    // this mocked-boundary suite just pins the route's own behavior: no reshaping,
    // no enrichment, no field dropping between loader and response.
    state.load.mockResolvedValue({ meeting: { id: "m-1", status: "pending_sync", lastError: null }, snapshot: SNAPSHOT });
    const res = await GET(req(), { params: Promise.resolve({ id: "m-1" }) });
    const body = await res.json();
    expect(body.phase).toBe(SNAPSHOT.phase);
    expect(body.events).toEqual(SNAPSHOT.events);
    for (const raw of ["meetingStatus", "artifactState", "transcriptState", "hasInsights"]) {
      expect(body).not.toHaveProperty(raw);
    }
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
      meeting: { id: "m-1", status: "pending_sync", lastError: "capture-state-code-only" },
      snapshot: { ...SNAPSHOT, lastError: "capture-state-code-only" },
    });
    const res = await GET(req(), { params: Promise.resolve({ id: "m-1" }) });
    const body = await res.json();
    const text = JSON.stringify(body);
    for (const forbidden of ["service_role", "apikey", "Bearer", "authorization", "credential", "ciphertext"]) {
      expect(text.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});
