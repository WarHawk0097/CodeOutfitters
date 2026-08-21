import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MeetingProviderError } from "../provider";
import { GOOGLE_MEET_SCOPES } from "@/lib/integrations/providers/google";
import { GoogleMeetProviderAdapter, MEET_SCOPES } from "./google-meet";

// Mocked fetch only — no real Google call anywhere in this suite, same discipline as
// lib/integrations/providers/google.test.ts.
function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const CREDENTIALS = { accessToken: "test-token" };

describe("meetings/providers/google-meet", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("MEET_SCOPES is the minimum read scope, and is owned by the Google OAuth adapter", () => {
    expect(MEET_SCOPES).toEqual(["https://www.googleapis.com/auth/meetings.space.readonly"]);
    // Re-exported, not redeclared: the authorization URL and the API client must ask for
    // and assume the same scope, or the card would claim a permission the requests do not
    // actually hold. Requesting it is lib/integrations/providers/google.ts's job — this
    // module builds no authorization URL of its own.
    expect(MEET_SCOPES).toBe(GOOGLE_MEET_SCOPES);
  });

  it("capabilities: conferenceCreation is false — no create scope requested", () => {
    const adapter = new GoogleMeetProviderAdapter();
    expect(adapter.capabilities).toEqual({ conferenceCreation: false, transcript: true, recording: true });
  });

  it("getConferenceRecord: picks the most recent record and resolves joinUrl from the space", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          conferenceRecords: [
            { name: "conferenceRecords/older", startTime: "2026-01-01T00:00:00Z" },
            { name: "conferenceRecords/newer", startTime: "2026-02-01T00:00:00Z" },
          ],
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { meetingUri: "https://meet.google.com/abc-defg-hjk" }));

    const adapter = new GoogleMeetProviderAdapter();
    const record = await adapter.getConferenceRecord(CREDENTIALS, "spaces/abc123");

    expect(record.providerConferenceRecordId).toBe("conferenceRecords/newer");
    expect(record.joinUrl).toBe("https://meet.google.com/abc-defg-hjk");
  });

  it("getConferenceRecord: throws not_found when the space has no conference records", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { conferenceRecords: [] }));

    const adapter = new GoogleMeetProviderAdapter();
    await expect(adapter.getConferenceRecord(CREDENTIALS, "spaces/never-met")).rejects.toMatchObject({
      kind: "not_found",
    } satisfies Partial<MeetingProviderError>);
  });

  it("getConferenceRecord: joinUrl stays null if the space lookup fails, without failing the whole call", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, { conferenceRecords: [{ name: "conferenceRecords/x", startTime: "2026-02-01T00:00:00Z" }] }),
      )
      .mockResolvedValueOnce(jsonResponse(404, { error: { status: "NOT_FOUND", message: "gone" } }));

    const adapter = new GoogleMeetProviderAdapter();
    const record = await adapter.getConferenceRecord(CREDENTIALS, "spaces/abc123");
    expect(record.joinUrl).toBeNull();
  });

  it("maps 403 to insufficient_scope and 401 to revoked", async () => {
    const adapter = new GoogleMeetProviderAdapter();

    fetchMock.mockResolvedValueOnce(jsonResponse(403, { error: { status: "PERMISSION_DENIED", message: "no scope" } }));
    await expect(adapter.getConferenceRecord(CREDENTIALS, "spaces/x")).rejects.toMatchObject({
      kind: "insufficient_scope",
    } satisfies Partial<MeetingProviderError>);

    fetchMock.mockResolvedValueOnce(jsonResponse(401, { error: { status: "UNAUTHENTICATED", message: "expired" } }));
    await expect(adapter.getConferenceRecord(CREDENTIALS, "spaces/x")).rejects.toMatchObject({
      kind: "revoked",
    } satisfies Partial<MeetingProviderError>);
  });

  it("listArtifacts: combines transcripts and recordings into one array", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          transcripts: [{ name: "conferenceRecords/x/transcripts/1", state: "FILE_GENERATED" }],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, { recordings: [{ name: "conferenceRecords/x/recordings/1", state: "FILE_GENERATED" }] }),
      );

    const adapter = new GoogleMeetProviderAdapter();
    const artifacts = await adapter.listArtifacts(CREDENTIALS, "conferenceRecords/x");

    expect(artifacts).toHaveLength(2);
    expect(artifacts.map((a) => a.artifactType).sort()).toEqual(["recording", "transcript"]);
  });

  it("getTranscriptEntries: follows pageToken and caches repeated participant lookups", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          entries: [{ name: "entries/1", participant: "conferenceRecords/x/participants/p1", text: "Hi" }],
          nextPageToken: "page2",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          entries: [{ name: "entries/2", participant: "conferenceRecords/x/participants/p1", text: "Again" }],
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { signedinUser: { displayName: "Ada" } }));

    const adapter = new GoogleMeetProviderAdapter();
    const entries = await adapter.getTranscriptEntries(CREDENTIALS, "conferenceRecords/x/transcripts/1");

    expect(entries).toHaveLength(2);
    expect(entries[0]!.speakerLabel).toBe("Ada");
    expect(entries[1]!.speakerLabel).toBe("Ada");
    // Two entry pages + exactly one participant lookup (cached on the second entry).
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("getTranscriptEntries: an unresolvable participant leaves speakerLabel null, never fabricated", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          entries: [{ name: "entries/1", participant: "conferenceRecords/x/participants/gone", text: "Hi" }],
        }),
      )
      .mockResolvedValueOnce(jsonResponse(404, { error: { status: "NOT_FOUND", message: "gone" } }));

    const adapter = new GoogleMeetProviderAdapter();
    const entries = await adapter.getTranscriptEntries(CREDENTIALS, "conferenceRecords/x/transcripts/1");
    expect(entries[0]!.speakerLabel).toBeNull();
  });
});
