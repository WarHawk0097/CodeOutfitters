import { describe, it, expect, vi, beforeEach } from "vitest";
import { CaptureError } from "@/lib/meetings/capture/server";

const state = vi.hoisted(() => ({
  demoMode: false,
  auth: { userId: "user-1", workspaceId: "ws-1", role: "owner" } as
    | { userId: string; workspaceId: string; role: string }
    | null,
  session: {} as unknown,
  start: vi.fn(),
}));

vi.mock("@/lib/supabase/capture-auth", () => ({ resolveCaptureAuth: async () => state.auth }));
vi.mock("@/lib/integrations/store", () => ({ getServiceClient: () => state.session }));
vi.mock("@/lib/meetings/capture/server", async () => {
  const actual = await vi.importActual<typeof import("@/lib/meetings/capture/server")>(
    "@/lib/meetings/capture/server",
  );
  return { ...actual, startCapture: (...args: unknown[]) => state.start(...args) };
});

import { POST } from "./route";

function req(body: unknown, token?: string): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  return new Request("https://codeoutfitters.vercel.app/api/dashboard/meetings/capture", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST meetings/capture", () => {
  beforeEach(() => {
    state.demoMode = false;
    state.auth = { userId: "user-1", workspaceId: "ws-1", role: "owner" };
    state.start.mockReset();
  });

  it("404s in intentional demo mode", async () => {
    state.demoMode = true;
    const res = await POST(req({ provider: "google_meet", providerSpaceId: "abc-defg-hij", acquisitionStrategy: "browser_captions" }, "token"));
    expect(res.status).toBe(404);
  });

  it("401s without a bearer token", async () => {
    state.auth = null;
    const res = await POST(req({ providerSpaceId: "abc-defg-hij" }));
    expect(res.status).toBe(401);
  });

  it("passes the providerSpaceId through to the store (normalization is the store's job)", async () => {
    state.start.mockResolvedValue({
      meetingId: "m-1",
      sessionId: "s-1",
      artifactId: "codeoutfitters-capture:s-1",
      transcriptId: "t-1",
      resume: false,
      status: "capture_active",
    });
    const res = await POST(req({ provider: "google_meet", providerSpaceId: "https://meet.google.com/abc-defg-hij", acquisitionStrategy: "browser_captions" }, "token"));
    expect(res.status).toBe(200);
    expect(state.start).toHaveBeenCalledWith(
      "ws-1",
      "user-1",
      expect.objectContaining({ providerSpaceId: "https://meet.google.com/abc-defg-hij" }),
      expect.anything(),
    );
  });

  it("accepts the browser_audio acquisition source", async () => {
    state.start.mockResolvedValue({
      meetingId: "m-1",
      sessionId: "s-1",
      artifactId: "a",
      transcriptId: "t-1",
      resume: false,
      status: "capture_active",
    });
    const res = await POST(req({ provider: "google_meet", providerSpaceId: "abc-defg-hij", acquisitionStrategy: "browser_audio" }, "token"));
    expect(res.status).toBe(200);
    expect(state.start).toHaveBeenCalledWith(
      "ws-1",
      "user-1",
      expect.objectContaining({ acquisitionStrategy: "browser_audio" }),
      expect.anything(),
    );
  });

  it("rejects an empty space id", async () => {
    const res = await POST(req({ provider: "google_meet", providerSpaceId: "   ", acquisitionStrategy: "browser_captions" }, "token"));
    expect(res.status).toBe(422);
  });

  it("rejects explicit null for optional title so clients omit absent fields", async () => {
    const res = await POST(req({ provider: "google_meet", providerSpaceId: "abc-defg-hij", acquisitionStrategy: "browser_captions", title: null }, "token"));
    expect(res.status).toBe(422);
  });

  it("never accepts a browser-supplied workspace_id (server derives it)", async () => {
    state.start.mockResolvedValue({
      meetingId: "m-1",
      sessionId: "s-1",
      artifactId: "a",
      transcriptId: "t-1",
      resume: false,
      status: "capture_active",
    });
    const res = await POST(req({ provider: "google_meet", providerSpaceId: "abc-defg-hij", acquisitionStrategy: "browser_captions", workspaceId: "ws-evil" } as never, "token"));
    expect(res.status).toBe(200);
    expect(state.start).toHaveBeenCalledWith("ws-1", "user-1", expect.not.objectContaining({ workspaceId: "ws-evil" }), expect.anything());
  });

  it("maps capture errors to status codes", async () => {
    state.start.mockRejectedValue(new CaptureError("conflict", "dup"));
    const res = await POST(req({ provider: "google_meet", providerSpaceId: "abc-defg-hij", acquisitionStrategy: "browser_captions" }, "token"));
    expect(res.status).toBe(409);
  });

  it("returns a safe branch code for a 422 start failure", async () => {
    state.start.mockRejectedValue(new CaptureError("invalid", "The meeting could not be created.", "CAPTURE_START_MEETING_SCHEMA_MISMATCH"));
    const res = await POST(req({ provider: "google_meet", providerSpaceId: "hhf-hmtr-ons", acquisitionStrategy: "browser_captions" }, "token"));
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ ok: false, error: { code: "CAPTURE_START_MEETING_SCHEMA_MISMATCH" } });
  });

  it("accepts Meet browser captions without leadId or connectionId", async () => {
    state.start.mockResolvedValue({ meetingId: "m-1", sessionId: "s-1", artifactId: "a", transcriptId: "t-1", resume: false, status: "capture_active" });
    const res = await POST(req({ provider: "google_meet", providerSpaceId: "hhf-hmtr-ons", acquisitionStrategy: "browser_captions" }, "token"));
    expect(res.status).toBe(200);
    expect(state.start).toHaveBeenCalledWith("ws-1", "user-1", expect.objectContaining({ provider: "google_meet", acquisitionStrategy: "browser_captions" }), expect.anything());
  });

  it.each([
    [{ provider: "zoom", providerSpaceId: "hhf-hmtr-ons", acquisitionStrategy: "browser_captions" }, "CAPTURE_START_PROVIDER_INVALID"],
    [{ provider: "google_meet", providerSpaceId: "hhf-hmtr-ons", acquisitionStrategy: "provider_transcript" }, "CAPTURE_START_STRATEGY_INVALID"],
    [{ provider: "google_meet", acquisitionStrategy: "browser_captions" }, "CAPTURE_START_SPACE_REQUIRED"],
  ])("rejects invalid Start contract with safe code", async (body, code) => {
    const res = await POST(req(body, "token"));
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ error: { code } });
  });
});
vi.mock("@/lib/command-center/mode", () => ({ isDemoMode: () => state.demoMode }));
