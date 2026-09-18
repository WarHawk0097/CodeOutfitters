// Route ↔ client CONTRACT test — the integration proof the unit tests could not give.
//
// The Recording Events defect this file pins: the route returned the RAW
// CaptureEventsInput (meetingStatus/artifactState/…), while useCaptureEvents only
// accepts the DERIVED RecordingEventsSnapshot shape (phase/recording/events/…)
// produced by deriveRecordingEvents(). Both sides "passed" their own unit tests while
// the real runtime 200 was unusable by the panel ("phase" never in the body → the hook
// took its error path). So this test runs the REAL route handler through the REAL
// loadCaptureEvents → store reads → deriveRecordingEvents, and asserts the JSON body
// carries exactly the fields the client hook consumes — no raw rows, no internal keys.
//
// Only the process boundaries are faked: the dashboard session context (auth is
// separately covered by route.test.ts + RLS pglite suites) and the Supabase driver
// (a minimal select-path query builder holding snake_case rows, exactly what the
// session-bound store reads would receive from Postgres).
import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";

// The fake session-bound Supabase client. Implements ONLY the select-path chain the
// capture-events read actually issues (store.ts + events-server.ts); anything else is
// a loud 42P01-style failure so a refactor that adds a table read updates this file.
const rows = vi.hoisted(() => ({
  meetings: [] as Record<string, unknown>[],
  meeting_artifacts: [] as Record<string, unknown>[],
  transcripts: [] as Record<string, unknown>[],
  transcript_entries: [] as Record<string, unknown>[],
  ai_meeting_insights: [] as Record<string, unknown>[],
  failTable: null as string | null,
}));

vi.hoisted(() => {
  type Row = Record<string, unknown>;
  class FakeQuery {
    private filters: ((row: Row) => boolean)[] = [];
    private sort: { column: string; ascending: boolean } | null = null;
    private max: number | null = null;
    private single = false;
    constructor(private table: string) {}
    select(): this {
      return this;
    }
    eq(column: string, value: unknown): this {
      this.filters.push((row) => row[column] === value);
      return this;
    }
    order(column: string, options?: { ascending?: boolean }): this {
      this.sort = { column, ascending: options?.ascending !== false };
      return this;
    }
    limit(count: number): this {
      this.max = count;
      return this;
    }
    maybeSingle(): this {
      this.single = true;
      return this;
    }
    private run(): { data: unknown; error: { code: string; message: string } | null } {
      if (rows.failTable === this.table) {
        return { data: null, error: { code: "XX000", message: "internal driver failure" } };
      }
      let out = rows[this.table as keyof typeof rows] as Row[];
      out = out.filter((row) => this.filters.every((keep) => keep(row)));
      if (this.sort) {
        const { column, ascending } = this.sort;
        out = [...out].sort((a, b) => {
          const l = a[column] as string | number;
          const r = b[column] as string | number;
          return ascending ? (l < r ? -1 : l > r ? 1 : 0) : l < r ? 1 : l > r ? -1 : 0;
        });
      }
      if (this.max !== null) out = out.slice(0, this.max);
      return { data: this.single ? (out[0] ?? null) : out, error: null };
    }
    then<TResult1 = { data: unknown; error: { code: string; message: string } | null }, TResult2 = never>(
      onfulfilled?: ((value: { data: unknown; error: { code: string; message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
      return Promise.resolve(this.run()).then(onfulfilled, onrejected);
    }
  }
  (globalThis as Record<string, unknown>).__captureEventsFakeFrom = (table: string) => new FakeQuery(table);
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: (globalThis as Record<string, unknown>).__captureEventsFakeFrom as (table: string) => unknown }),
}));
vi.mock("@/lib/command-center/mode", () => ({ isDemoMode: () => false }));
vi.mock("@/lib/dashboard/server", () => ({
  getDashboardContext: async () => ({ workspaceId: "ws-1", userId: "user-1" }),
}));

import { GET } from "./route";

const WORKSPACE = "ws-1";
const MEETING = "11111111-1111-4111-8111-111111111111";

function seedActiveCaptureSession(): void {
  rows.meetings = [
    {
      id: MEETING,
      workspace_id: WORKSPACE,
      status: "pending_sync",
      last_error: null,
    },
  ];
  rows.meeting_artifacts = [
    {
      id: "artifact-1",
      meeting_id: MEETING,
      workspace_id: WORKSPACE,
      artifact_type: "transcript",
      provider_artifact_id: "codeoutfitters-capture:sess-1",
      state: "capture_active",
      created_at: "2026-09-18T10:00:00.000Z",
    },
  ];
  rows.transcripts = [
    {
      id: "transcript-1",
      meeting_artifact_id: "artifact-1",
      workspace_id: WORKSPACE,
      state: "capture_active",
    },
  ];
  rows.transcript_entries = [
    {
      id: "entry-1",
      transcript_id: "transcript-1",
      workspace_id: WORKSPACE,
      sequence: 0,
      created_at: "2026-09-18T10:00:30.000Z",
    },
    {
      id: "entry-2",
      transcript_id: "transcript-1",
      workspace_id: WORKSPACE,
      sequence: 1,
      created_at: "2026-09-18T10:01:00.000Z",
    },
  ];
  rows.ai_meeting_insights = [];
}

function req(): Request {
  return new Request(`https://codeoutfitters.test/api/dashboard/meetings/${MEETING}/capture-events`);
}

async function bodyOf(): Promise<Record<string, unknown>> {
  const res = await GET(req(), { params: Promise.resolve({ id: MEETING }) });
  expect(res.status).toBe(200);
  return (await res.json()) as Record<string, unknown>;
}

beforeEach(() => {
  rows.meetings = [];
  rows.meeting_artifacts = [];
  rows.transcripts = [];
  rows.transcript_entries = [];
  rows.ai_meeting_insights = [];
  rows.failTable = null;
  seedActiveCaptureSession();
});

describe("capture-events route ↔ useCaptureEvents contract", () => {
  // The exact shape lib/meetings/capture/use-capture-events.ts dereferences after a
  // 200: ok, phase, recording, entryCount, lastSequence, startedAt, lastError, events.
  it("returns the DERIVED snapshot (phase/recording/events), not the raw persisted input", async () => {
    const body = await bodyOf();

    expect(body.ok).toBe(true);
    // The fields the client hook requires — and that only deriveRecordingEvents
    // produces. Their absence was the defect: a 200 the panel had to reject.
    expect(body).toHaveProperty("phase", "recording");
    expect(body).toHaveProperty("recording", true);
    expect(body).toHaveProperty("entryCount", 2);
    expect(body).toHaveProperty("lastSequence", 1);
    expect(body).toHaveProperty("startedAt", "2026-09-18T10:00:00.000Z");
    expect(body).toHaveProperty("lastError", null);
    expect(Array.isArray(body.events)).toBe(true);
  });

  it("exposes ONLY the consumer-approved keys — no raw row fields leak into the body", async () => {
    const body = await bodyOf();
    const allowed = new Set([
      "ok",
      "phase",
      "recording",
      "entryCount",
      "lastSequence",
      "startedAt",
      "lastError",
      "events",
    ]);
    expect(Object.keys(body).sort()).toEqual([...allowed].sort());
    // The raw CaptureEventsInput keys must NOT appear — they are the shape the broken
    // route used to return.
    for (const raw of ["meetingStatus", "meetingLastError", "artifactState", "artifactCreatedAt", "transcriptState", "hasInsights"]) {
      expect(body).not.toHaveProperty(raw);
    }
    const text = JSON.stringify(body);
    for (const forbidden of ["workspace_id", "ws-1", "provider_artifact_id", "codeoutfitters-capture", "artifact-1", "transcript-1", "entry-1"]) {
      expect(text).not.toContain(forbidden);
    }
  });

  it("events array is derived state — newest first, safe labels only", async () => {
    const body = await bodyOf();
    const events = body.events as { id: string; type: string; sequence: number }[];
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]!.sequence).toBe(0); // newest first for the panel's slice(0, 6)
    for (const event of events) {
      expect(typeof event.id).toBe("string");
      expect(typeof event.type).toBe("string");
    }
    expect(events.map((e) => e.type)).toContain("transcript_entries_received");
  });

  it("a terminal session derives completed — the client's terminal-phase stop is meaningful", async () => {
    rows.meetings = [{ ...rows.meetings[0]!, status: "transcript_ready" }];
    rows.meeting_artifacts = [{ ...rows.meeting_artifacts[0]!, state: "capture_complete" }];
    rows.transcripts = [{ ...rows.transcripts[0]!, state: "capture_complete" }];
    const body = await bodyOf();
    expect(body.phase).toBe("completed");
    expect(body.recording).toBe(false);
  });

  it("not_started derives phase not_started with zero events (the hook's bounded-probe phase)", async () => {
    rows.meeting_artifacts = [];
    rows.transcripts = [];
    const body = await bodyOf();
    expect(body.phase).toBe("not_started");
    expect(body.events).toEqual([]);
    expect(body.startedAt).toBeNull();
  });

  it("a failed read yields a safe 503 — never a 200 pretending success", async () => {
    rows.failTable = "transcript_entries";
    const res = await GET(req(), { params: Promise.resolve({ id: MEETING }) });
    expect(res.status).toBe(503);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(false);
  });

  it("the client hook fetches exactly this route path (contract tied to the real consumer)", async () => {
    const hookSrc = readFileSync("lib/meetings/capture/use-capture-events.ts", "utf8");
    expect(hookSrc).toContain("/api/dashboard/meetings/${encodeURIComponent(meetingId)}/capture-events");
    // The hook rejects any 200 that does not carry the derived phase.
    expect(hookSrc).toContain('!("phase" in body)');
  });
});
