import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  service: null as FakeClient | null,
}));

vi.mock("@/lib/integrations/store", () => ({
  getServiceClient: () => state.service,
}));

import { startCapture } from "./server";

type Row = Record<string, unknown>;

class FakeClient {
  private meeting: Row | null = null;
  public artifact: Row | null = null;
  public transcript: Row | null = null;

  from(table: string) {
    // The fake query builder closes over the owning client to mimic Supabase's fluent API.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const client = this;
    const filters: Row = {};
    let payload: Row | Row[] | null = null;
    const builder = {
      select() { return builder; },
      eq(column: string, value: unknown) { filters[column] = value; return builder; },
      maybeSingle: async () => {
        if (table === "meetings") return { data: client.meeting, error: null };
        if (table === "meeting_artifacts") return { data: client.artifact, error: null };
        return { data: client.transcript, error: null };
      },
      insert(value: Row | Row[]) {
        payload = value;
        if (table === "transcripts") {
          const row = Array.isArray(value) ? value[0]! : value;
          client.transcript = { ...row };
        }
        return builder;
      },
      single: async () => {
        const row = Array.isArray(payload) ? payload[0]! : payload!;
        if (table === "meetings") {
          client.meeting = { id: "11111111-1111-4111-8111-111111111111", ...row };
          return { data: client.meeting, error: null };
        }
        if (table === "meeting_artifacts") {
          client.artifact = { id: "22222222-2222-4222-8222-222222222222", ...row };
          return { data: client.artifact, error: null };
        }
        client.transcript = { id: row.id, ...row };
        return { data: client.transcript, error: null };
      },
    };
    void filters;
    return builder;
  }
}

describe("startCapture persistence contract", () => {
  it("uses the artifact row UUID for the transcript foreign key", async () => {
    const client = new FakeClient();
    state.service = client;

    const result = await startCapture(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      { provider: "google_meet", providerSpaceId: "mbs-zsvh-icd", acquisitionStrategy: "browser_captions" },
      { session: client as never },
    );

    expect(result.artifactId).toBe("22222222-2222-4222-8222-222222222222");
    expect(client.transcript?.meeting_artifact_id).toBe(result.artifactId);
    expect(client.transcript?.meeting_artifact_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(client.artifact).toMatchObject({ capture_source: "browser_captions", artifact_type: "transcript" });
  });
});
