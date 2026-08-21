// The fixtures exist so the six states can be exercised without a Google account. This
// file checks they actually are six distinct states — a fixture set where "processing"
// and "unavailable" look the same would let the product collapse them and nobody would
// notice.
import { describe, expect, it } from "vitest";
import { MeetingProviderError } from "../provider";
import {
  createFixtureAdapter,
  FIXTURE_SCENARIOS,
  FIXTURE_SPACE_ID,
  MULTI_SPEAKER_TRANSCRIPT,
  READY_TRANSCRIPT,
} from "./index";

const CREDENTIALS = { accessToken: "fixture-token" };

describe("meeting fixtures", () => {
  it("covers all six states the product has to render", () => {
    expect([...FIXTURE_SCENARIOS]).toEqual([
      "transcript_ready",
      "multiple_speakers",
      "transcript_processing",
      "transcript_unavailable",
      "insufficient_permission",
      "revoked",
    ]);
  });

  it("transcript_ready returns a generated artifact and ordered entries", async () => {
    const adapter = createFixtureAdapter("transcript_ready");
    const artifacts = await adapter.listArtifacts(CREDENTIALS, "conferenceRecords/fixture-conference");
    expect(artifacts[0]).toMatchObject({ artifactType: "transcript", state: "FILE_GENERATED" });

    const entries = await adapter.getTranscriptEntries(CREDENTIALS, artifacts[0].providerArtifactId);
    expect(entries.map((entry) => entry.sequence)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    // Sequence order and timestamp order must agree, or a summary will read the meeting
    // in an order nobody spoke it in.
    const times = entries.map((entry) => Date.parse(entry.startTime!));
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it("the ready transcript contains an explicitly undecided budget", () => {
    // This is what lets a test prove the extraction reports UNKNOWN rather than inventing
    // a number: the client says out loud that there is no figure yet.
    expect(READY_TRANSCRIPT.some((entry) => /Not yet|board/.test(entry.text))).toBe(true);
    expect(READY_TRANSCRIPT.some((entry) => /£|\$|\d{4,}/.test(entry.text))).toBe(false);
  });

  it("multiple_speakers keeps an unattributed speaker null rather than backfilling one", async () => {
    const adapter = createFixtureAdapter("multiple_speakers");
    const entries = await adapter.getTranscriptEntries(CREDENTIALS, "any");
    expect(entries.filter((entry) => entry.speakerLabel === null)).toHaveLength(1);
    expect(new Set(entries.map((entry) => entry.speakerLabel)).size).toBeGreaterThan(3);
    expect(MULTI_SPEAKER_TRANSCRIPT.map((entry) => entry.sequence)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("transcript_processing has an artifact but no entries — not the same as having none", async () => {
    const adapter = createFixtureAdapter("transcript_processing");
    const artifacts = await adapter.listArtifacts(CREDENTIALS, "any");
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0].state).toBe("ENDED");
    expect(await adapter.getTranscriptEntries(CREDENTIALS, "any")).toHaveLength(0);
  });

  it("transcript_unavailable has no artifact at all", async () => {
    expect(await createFixtureAdapter("transcript_unavailable").listArtifacts(CREDENTIALS, "any")).toHaveLength(0);
  });

  it("insufficient_permission and revoked fail differently, because their fixes differ", async () => {
    for (const [scenario, kind] of [
      ["insufficient_permission", "insufficient_scope"],
      ["revoked", "revoked"],
    ] as const) {
      const adapter = createFixtureAdapter(scenario);
      await expect(adapter.listArtifacts(CREDENTIALS, "any")).rejects.toMatchObject({ kind });
      await expect(adapter.getConferenceRecord(CREDENTIALS, FIXTURE_SPACE_ID)).rejects.toBeInstanceOf(
        MeetingProviderError,
      );
    }
  });

  it("declares no conference-creation capability — the fixtures never create a Meet space", () => {
    expect(createFixtureAdapter("transcript_ready").capabilities.conferenceCreation).toBe(false);
  });

  it("an unknown space is not found, so the space id is never ignored", async () => {
    await expect(
      createFixtureAdapter("transcript_ready").getConferenceRecord(CREDENTIALS, "spaces/someone-elses"),
    ).rejects.toMatchObject({ kind: "not_found" });
  });
});
