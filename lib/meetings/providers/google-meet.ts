import "server-only";
import type {
  MeetingProviderAdapter,
  MeetingProviderCapabilities,
  MeetingProviderCredentials,
  ProviderArtifactRef,
  ProviderConferenceRecord,
  ProviderTranscriptEntry,
} from "../provider";
import { MeetingProviderError } from "../provider";

// Google Meet REST API v2 (meet.googleapis.com), read-only. Reuses the existing
// "google_calendar" integration_connections row's access token — there is no separate
// Meet identity connection; see lib/integrations/providers/google.ts's header for the
// same "one Google identity" rule Gmail already follows.
//
// Scope: MEET_SCOPES is re-exported from lib/integrations/providers/google.ts, which owns
// it — one definition, requested through that module's `meet` capability on the existing
// Google connection (incremental authorization, refresh token preserved). The request
// path is wired; whether Google GRANTS it depends on three owner actions no code here can
// perform: (1) enabling the "Google Meet API" on the Google Cloud project backing
// GOOGLE_OAUTH_CLIENT_ID, (2) adding meetings.space.readonly to the OAuth consent screen
// (may require Google's re-verification), and (3) a Workspace admin enabling meeting
// transcription for the organization (Business Standard+; transcription is still started
// per-meeting even once enabled). Until those are confirmed, granted_scopes will simply
// not contain the scope, Settings says "permission required", and everything downstream is
// exercised against lib/meetings/__fixtures__ — no live call reaches Google.
export { GOOGLE_MEET_SCOPES as MEET_SCOPES } from "@/lib/integrations/providers/google";

const API_ROOT = "https://meet.googleapis.com/v2";
// Defends against an adapter bug or a provider bug returning an unbounded pageToken
// chain from ever looping forever — not a real page count any real meeting approaches.
const MAX_PAGES = 50;

type GoogleErrorBody = { error?: { status?: string; message?: string } };

async function meetFetch(
  path: string,
  credentials: MeetingProviderCredentials,
  query?: Record<string, string>,
): Promise<unknown> {
  const url = new URL(`${API_ROOT}/${path}`);
  for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, value);

  const response = await fetch(url, {
    headers: { authorization: `Bearer ${credentials.accessToken}` },
  });
  if (response.ok) return response.json();

  let body: GoogleErrorBody = {};
  try {
    body = (await response.json()) as GoogleErrorBody;
  } catch {
    // Non-JSON error body — fall through with an empty one.
  }
  const detail = body.error?.message ?? `Google Meet API returned ${response.status}.`;
  if (response.status === 404) {
    throw new MeetingProviderError("google_meet", "not_found", detail);
  }
  if (response.status === 401 || body.error?.status === "UNAUTHENTICATED") {
    throw new MeetingProviderError("google_meet", "revoked", detail);
  }
  if (response.status === 403 || body.error?.status === "PERMISSION_DENIED") {
    throw new MeetingProviderError("google_meet", "insufficient_scope", detail);
  }
  throw new MeetingProviderError("google_meet", "provider_error", detail);
}

type ConferenceRecordResource = {
  name: string;
  startTime?: string;
  endTime?: string;
  space?: string;
};

type TranscriptResource = {
  name: string;
  state?: string;
  docsDestination?: { document?: string; exportUri?: string };
};

type RecordingResource = {
  name: string;
  state?: string;
  driveDestination?: { file?: string; exportUri?: string };
};

type TranscriptEntryResource = {
  name: string;
  participant?: string;
  text?: string;
  languageCode?: string;
  startTime?: string;
  endTime?: string;
};

type ParticipantResource = {
  signedinUser?: { displayName?: string };
  anonymousUser?: { displayName?: string };
  phoneUser?: { displayName?: string };
};

function participantDisplayName(resource: ParticipantResource): string | null {
  return (
    resource.signedinUser?.displayName ?? resource.anonymousUser?.displayName ?? resource.phoneUser?.displayName ?? null
  );
}

export class GoogleMeetProviderAdapter implements MeetingProviderAdapter {
  readonly id = "google_meet" as const;

  readonly capabilities: MeetingProviderCapabilities = {
    // No meetings.space.created scope requested — see header. A meeting is linked to an
    // existing space, never created by this adapter, this phase.
    conferenceCreation: false,
    transcript: true,
    recording: true,
  };

  async getConferenceRecord(
    credentials: MeetingProviderCredentials,
    providerSpaceId: string,
  ): Promise<ProviderConferenceRecord> {
    const data = (await meetFetch("conferenceRecords", credentials, {
      filter: `space.name = "${providerSpaceId}"`,
    })) as { conferenceRecords?: ConferenceRecordResource[] };

    const records = data.conferenceRecords ?? [];
    if (records.length === 0) {
      throw new MeetingProviderError("google_meet", "not_found", `No conference record for ${providerSpaceId}.`);
    }
    // Most recent meeting in this space — filter does not guarantee order, so it is
    // picked here rather than assumed from response order.
    const latest = [...records].sort((a, b) => (b.startTime ?? "").localeCompare(a.startTime ?? ""))[0]!;

    let joinUrl: string | null = null;
    try {
      const space = (await meetFetch(providerSpaceId, credentials)) as { meetingUri?: string };
      joinUrl = space.meetingUri ?? null;
    } catch {
      // A space lookup failure (e.g. the space itself was later deleted) must not fail
      // the conference-record resolution that already succeeded — joinUrl merely stays
      // null rather than fabricated.
    }

    return {
      providerConferenceRecordId: latest.name,
      startTime: latest.startTime ?? null,
      endTime: latest.endTime ?? null,
      joinUrl,
    };
  }

  async listArtifacts(
    credentials: MeetingProviderCredentials,
    providerConferenceRecordId: string,
  ): Promise<readonly ProviderArtifactRef[]> {
    const [transcripts, recordings] = await Promise.all([
      this.listPaged<TranscriptResource>(`${providerConferenceRecordId}/transcripts`, credentials, "transcripts"),
      this.listPaged<RecordingResource>(`${providerConferenceRecordId}/recordings`, credentials, "recordings"),
    ]);

    return [
      ...transcripts.map(
        (t): ProviderArtifactRef => ({
          artifactType: "transcript",
          providerArtifactId: t.name,
          state: t.state ?? null,
          docsUrl: t.docsDestination?.exportUri ?? null,
        }),
      ),
      ...recordings.map(
        (r): ProviderArtifactRef => ({
          artifactType: "recording",
          providerArtifactId: r.name,
          state: r.state ?? null,
          docsUrl: r.driveDestination?.exportUri ?? null,
        }),
      ),
    ];
  }

  async getTranscriptEntries(
    credentials: MeetingProviderCredentials,
    providerArtifactId: string,
  ): Promise<readonly ProviderTranscriptEntry[]> {
    const entries = await this.listPaged<TranscriptEntryResource>(
      `${providerArtifactId}/entries`,
      credentials,
      "entries",
    );

    const participantCache = new Map<string, string | null>();
    const speakerFor = async (participant: string | undefined): Promise<string | null> => {
      if (!participant) return null;
      if (participantCache.has(participant)) return participantCache.get(participant)!;
      let name: string | null = null;
      try {
        const resource = (await meetFetch(participant, credentials)) as ParticipantResource;
        name = participantDisplayName(resource);
      } catch {
        // A participant that can no longer be resolved leaves speakerLabel null — never
        // fabricated, never fails the whole transcript fetch.
      }
      participantCache.set(participant, name);
      return name;
    };

    const result: ProviderTranscriptEntry[] = [];
    for (const [index, entry] of entries.entries()) {
      result.push({
        providerEntryId: entry.name,
        speakerLabel: await speakerFor(entry.participant),
        sequence: index,
        startTime: entry.startTime ?? null,
        endTime: entry.endTime ?? null,
        languageCode: entry.languageCode ?? null,
        text: entry.text ?? "",
      });
    }
    return result;
  }

  private async listPaged<T>(
    path: string,
    credentials: MeetingProviderCredentials,
    field: string,
  ): Promise<T[]> {
    const items: T[] = [];
    let pageToken: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const data = (await meetFetch(path, credentials, pageToken ? { pageToken } : undefined)) as Record<
        string,
        unknown
      > & { nextPageToken?: string };
      items.push(...((data[field] as T[] | undefined) ?? []));
      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }
    return items;
  }
}

export default function createGoogleMeetProviderAdapter(): MeetingProviderAdapter {
  return new GoogleMeetProviderAdapter();
}
