import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/integrations/store";
import type { AIMeetingInsight, AIMeetingInsightType, TranscriptEntry } from "../types";
import { MeetingIntelligenceError, generateMeetingIntelligence, generatePresentationIntelligence, type GenerateDeps, type LeadContextFacts } from "./generate";
import type { MeetingIntelligence } from "./schema";

// Reads run as the session (RLS is the boundary); writes to ai_meeting_insights run as
// the service role, because `authenticated` has SELECT and nothing else on that table —
// see the migration. Same split as lib/meetings/store.ts vs. lib/meetings/sync.ts.

type InsightRow = {
  id: string;
  meeting_id: string;
  workspace_id: string;
  transcript_id: string | null;
  insight_type: AIMeetingInsightType;
  model: string;
  payload: unknown;
  generated_at: string;
  created_at: string;
};

function toInsight(row: InsightRow): AIMeetingInsight {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    workspaceId: row.workspace_id,
    transcriptId: row.transcript_id,
    insightType: row.insight_type,
    model: row.model,
    payload: row.payload,
    generatedAt: row.generated_at,
    createdAt: row.created_at,
  };
}

/** Shape of the transcript_entries select below. Declared rather than inferred because
 *  the generated database types do not yet include this table's row type. */
type EntryRow = {
  id: string;
  transcript_id: string;
  workspace_id: string;
  provider_entry_id: string;
  speaker_label: string | null;
  sequence: number;
  start_time: string | null;
  end_time: string | null;
  language_code: string | null;
  text: string;
  created_at: string;
};

const INSIGHT_COLUMNS =
  "id, meeting_id, workspace_id, transcript_id, insight_type, model, payload, generated_at, created_at";

/** The most recent insight of each type for a meeting. Older rows are kept — an
 *  extraction is evidence of what the product said at a point in time, so it is
 *  superseded, never overwritten. */
export async function getLatestInsights(workspaceId: string, meetingId: string): Promise<AIMeetingInsight[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_meeting_insights")
    .select(INSIGHT_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("meeting_id", meetingId)
    .order("generated_at", { ascending: false });

  const rows = (data ?? []) as InsightRow[];
  const seen = new Set<AIMeetingInsightType>();
  return rows
    .filter((row) => (seen.has(row.insight_type) ? false : (seen.add(row.insight_type), true)))
    .map(toInsight);
}

/** Every meeting's latest meeting_intelligence for one Lead, newest meeting first.
 *  The input to the pre-meeting brief and to Copilot grounding. */
export async function getLeadMeetingIntelligence(
  workspaceId: string,
  leadId: string,
): Promise<{ meetingId: string; title: string | null; scheduledStart: string | null; payload: unknown }[]> {
  const supabase = await createClient();
  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, scheduled_start, created_at")
    .eq("workspace_id", workspaceId)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  const rows = (meetings ?? []) as { id: string; title: string | null; scheduled_start: string | null }[];
  if (rows.length === 0) return [];

  const { data: insights } = await supabase
    .from("ai_meeting_insights")
    .select(INSIGHT_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("insight_type", "meeting_intelligence")
    .in(
      "meeting_id",
      rows.map((row) => row.id),
    )
    .order("generated_at", { ascending: false });

  const latest = new Map<string, InsightRow>();
  for (const row of (insights ?? []) as InsightRow[]) {
    if (!latest.has(row.meeting_id)) latest.set(row.meeting_id, row);
  }

  return rows
    .filter((row) => latest.has(row.id))
    .map((row) => ({
      meetingId: row.id,
      title: row.title,
      scheduledStart: row.scheduled_start,
      payload: latest.get(row.id)!.payload,
    }));
}

async function loadLeadFacts(leadId: string | null): Promise<LeadContextFacts | null> {
  if (!leadId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("first_name, last_name, business_name, status, service_interest, timeline, budget_range, industry")
    .eq("id", leadId)
    .maybeSingle();
  if (!data) return null;
  const row = data as Record<string, string | null>;
  const name = [row.first_name, row.last_name].filter(Boolean).join(" ");
  return {
    name: name || null,
    company: row.business_name ?? null,
    status: row.status ?? null,
    serviceInterest: row.service_interest ?? null,
    timeline: row.timeline ?? null,
    budgetRange: row.budget_range ?? null,
    industry: row.industry ?? null,
  };
}

/** The transcript entries for a meeting, in order, as the session may read them. */
export async function loadTranscriptForMeeting(
  workspaceId: string,
  meetingId: string,
): Promise<{ transcriptId: string | null; entries: TranscriptEntry[] }> {
  const supabase = await createClient();
  const { data: artifacts } = await supabase
    .from("meeting_artifacts")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("meeting_id", meetingId)
    .eq("artifact_type", "transcript")
    .order("created_at", { ascending: true });

  const artifactIds = ((artifacts ?? []) as { id: string }[]).map((row) => row.id);
  if (artifactIds.length === 0) return { transcriptId: null, entries: [] };

  const { data: transcripts } = await supabase
    .from("transcripts")
    .select("id")
    .eq("workspace_id", workspaceId)
    .in("meeting_artifact_id", artifactIds)
    .order("fetched_at", { ascending: false });

  const transcriptId = ((transcripts ?? []) as { id: string }[])[0]?.id ?? null;
  if (!transcriptId) return { transcriptId: null, entries: [] };

  const { data: entries } = await supabase
    .from("transcript_entries")
    .select(
      "id, transcript_id, workspace_id, provider_entry_id, speaker_label, sequence, start_time, end_time, language_code, text, created_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("transcript_id", transcriptId)
    .order("sequence", { ascending: true });

  return {
    transcriptId,
    entries: ((entries ?? []) as unknown as EntryRow[]).map((row) => ({
      id: row.id,
      transcriptId: row.transcript_id,
      workspaceId: row.workspace_id,
      providerEntryId: row.provider_entry_id,
      speakerLabel: row.speaker_label,
      sequence: row.sequence,
      startTime: row.start_time,
      endTime: row.end_time,
      languageCode: row.language_code,
      text: row.text,
      createdAt: row.created_at,
    })),
  };
}

async function persist(
  meetingId: string,
  transcriptId: string | null,
  insightType: AIMeetingInsightType,
  model: string,
  payload: unknown,
): Promise<void> {
  // workspace_id is denormalized by the table's own trigger from the meeting, so it can
  // never be set to a workspace the meeting does not belong to.
  const { error } = await getServiceClient().from("ai_meeting_insights").insert({
    meeting_id: meetingId,
    transcript_id: transcriptId,
    insight_type: insightType,
    model,
    payload,
  });
  if (error) throw new MeetingIntelligenceError("provider_error", "The analysis could not be saved.");
}

/**
 * Runs both extractions for one meeting and stores them.
 *
 * Meeting Intelligence first, then Next Presentation Intelligence grounded in it — the
 * second reads the first's already-grounded output, so a citation the transcript does not
 * support cannot be laundered into a recommendation.
 */
export async function analyzeMeeting(
  workspaceId: string,
  meetingId: string,
  leadId: string | null,
  deps: GenerateDeps = {},
): Promise<{ intelligence: MeetingIntelligence; hasTranscript: boolean }> {
  const { transcriptId, entries } = await loadTranscriptForMeeting(workspaceId, meetingId);
  const lead = await loadLeadFacts(leadId);

  const intelligence = await generateMeetingIntelligence(entries, lead, deps);
  await persist(meetingId, transcriptId, "meeting_intelligence", intelligence.model, intelligence.payload);

  if (entries.length > 0) {
    const presentation = await generatePresentationIntelligence(entries, intelligence.payload, lead, deps);
    await persist(meetingId, transcriptId, "presentation_intelligence", presentation.model, presentation.payload);
  }

  return { intelligence: intelligence.payload, hasTranscript: entries.length > 0 };
}
