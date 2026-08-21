// Synthetic meeting fixtures. Every word below was written for this file — no customer
// transcript, no real name, no real company, no real deal. They exist so the six states
// the product has to render honestly can be exercised without a Google account, a
// Workspace licence, or anybody's actual conversation.
//
// The six states, and why each one is a separate fixture rather than a variant:
//   transcript_ready       — the ordinary success path.
//   multiple_speakers      — speaker attribution and ordering, which single-speaker data
//                            cannot catch.
//   transcript_processing  — the artifact exists but Google has not produced the file
//                            (Transcript.state ENDED). Must NOT read as "no transcript".
//   transcript_unavailable — the conference happened and nobody ever started
//                            transcription. Also not an error.
//   insufficient_permission— the Meet scope was never granted. Distinct from revoked.
//   revoked                — the connection's credential no longer works at all.
//
// The last two are separate because the fix differs: one is "grant the permission", the
// other is "reconnect the account", and telling a user the wrong one wastes their time.

import type {
  MeetingProviderAdapter,
  MeetingProviderCredentials,
  ProviderArtifactRef,
  ProviderConferenceRecord,
  ProviderTranscriptEntry,
} from "../provider";
import { MeetingProviderError } from "../provider";

export const FIXTURE_SCENARIOS = [
  "transcript_ready",
  "multiple_speakers",
  "transcript_processing",
  "transcript_unavailable",
  "insufficient_permission",
  "revoked",
] as const;

export type FixtureScenario = (typeof FIXTURE_SCENARIOS)[number];

export const FIXTURE_SPACE_ID = "spaces/fixture-space";
export const FIXTURE_CONFERENCE_RECORD_ID = "conferenceRecords/fixture-conference";
export const FIXTURE_TRANSCRIPT_ID = `${FIXTURE_CONFERENCE_RECORD_ID}/transcripts/fixture-transcript`;

function entry(
  index: number,
  speaker: string | null,
  minute: number,
  text: string,
): ProviderTranscriptEntry {
  return {
    providerEntryId: `${FIXTURE_TRANSCRIPT_ID}/entries/${index}`,
    speakerLabel: speaker,
    sequence: index,
    startTime: `2026-08-18T14:${String(minute).padStart(2, "0")}:00.000Z`,
    endTime: `2026-08-18T14:${String(minute).padStart(2, "0")}:40.000Z`,
    languageCode: "en-GB",
    text,
  };
}

/** One speaker from each side. Deliberately contains a clear requirement, a clear
 *  objection, and an explicitly undecided budget — so a test can prove the extraction
 *  reports UNKNOWN for budget instead of inventing a number. */
export const READY_TRANSCRIPT: readonly ProviderTranscriptEntry[] = [
  entry(1, "Rowan Blake", 2, "Thanks for making time. The short version is our booking form loses people at the last step."),
  entry(2, "Sam Ortiz", 3, "How many enquiries a week are you seeing come through it at the moment?"),
  entry(3, "Rowan Blake", 4, "Around forty. Maybe half of those never finish. We need the form to save partial answers."),
  entry(4, "Rowan Blake", 6, "The other thing is we cannot go live before the trade show in November."),
  entry(5, "Sam Ortiz", 7, "Understood. Have you set a budget for this piece of work?"),
  entry(6, "Rowan Blake", 8, "Not yet. I would need to take a number to my board before I could commit to one."),
  entry(7, "Rowan Blake", 9, "I will say the last agency we used disappeared for three weeks, so I am wary of that."),
  entry(8, "Sam Ortiz", 11, "Fair. I will send a written scope this week and we can review it together."),
];

/** Four participants including one Meet could not attribute — speakerLabel null is a
 *  real state, not a bug, and must survive normalisation rather than being backfilled. */
export const MULTI_SPEAKER_TRANSCRIPT: readonly ProviderTranscriptEntry[] = [
  entry(1, "Rowan Blake", 1, "I have brought Priya in from finance and Dan who runs the warehouse."),
  entry(2, "Priya Nandi", 2, "My concern is only the migration. We cannot lose the historic orders."),
  entry(3, "Dan Whitlow", 3, "And the scanners on the floor have to keep working during the switchover."),
  entry(4, null, 4, "Can we come back to the reporting question before we finish?"),
  entry(5, "Sam Ortiz", 5, "Yes. Priya, would a read-only export of the historic orders settle the migration worry?"),
  entry(6, "Priya Nandi", 6, "It would, provided we can still search it."),
];

type ScenarioShape = {
  artifacts: readonly ProviderArtifactRef[];
  entries: readonly ProviderTranscriptEntry[];
  /** Thrown from every method when set — the credential/permission failures. */
  failure?: { kind: "insufficient_scope" | "revoked"; message: string };
};

const TRANSCRIPT_ARTIFACT = (state: string): ProviderArtifactRef => ({
  artifactType: "transcript",
  providerArtifactId: FIXTURE_TRANSCRIPT_ID,
  state,
  docsUrl: null,
});

export const FIXTURES: Record<FixtureScenario, ScenarioShape> = {
  transcript_ready: { artifacts: [TRANSCRIPT_ARTIFACT("FILE_GENERATED")], entries: READY_TRANSCRIPT },
  multiple_speakers: { artifacts: [TRANSCRIPT_ARTIFACT("FILE_GENERATED")], entries: MULTI_SPEAKER_TRANSCRIPT },
  // ENDED: the session finished, the file has not been produced. Entries are genuinely
  // not there yet — an empty list here is the truth, and the caller must say "processing".
  transcript_processing: { artifacts: [TRANSCRIPT_ARTIFACT("ENDED")], entries: [] },
  transcript_unavailable: { artifacts: [], entries: [] },
  insufficient_permission: {
    artifacts: [],
    entries: [],
    failure: { kind: "insufficient_scope", message: "Grant the Google Meet permission to read transcripts." },
  },
  revoked: { artifacts: [], entries: [], failure: { kind: "revoked", message: "Reconnect the Google account." } },
};

/** A MeetingProviderAdapter backed by the fixtures. Same interface the Google adapter
 *  satisfies, so sync.ts and the AI pipeline run unmodified against it. */
export function createFixtureAdapter(scenario: FixtureScenario): MeetingProviderAdapter {
  const shape = FIXTURES[scenario];

  function guard(): void {
    if (shape.failure) {
      throw new MeetingProviderError("google_meet", shape.failure.kind, shape.failure.message);
    }
  }

  return {
    id: "google_meet",
    capabilities: { conferenceCreation: false, transcript: true, recording: false },

    async getConferenceRecord(_credentials: MeetingProviderCredentials, providerSpaceId: string): Promise<ProviderConferenceRecord> {
      guard();
      if (providerSpaceId !== FIXTURE_SPACE_ID) {
        throw new MeetingProviderError("google_meet", "not_found", "No conference record for that space.");
      }
      return {
        providerConferenceRecordId: FIXTURE_CONFERENCE_RECORD_ID,
        startTime: "2026-08-18T14:00:00.000Z",
        endTime: "2026-08-18T14:45:00.000Z",
        joinUrl: null,
      };
    },

    async listArtifacts(): Promise<readonly ProviderArtifactRef[]> {
      guard();
      return shape.artifacts;
    },

    async getTranscriptEntries(): Promise<readonly ProviderTranscriptEntry[]> {
      guard();
      return shape.entries;
    },
  };
}
