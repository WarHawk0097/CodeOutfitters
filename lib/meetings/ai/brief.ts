import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  MeetingIntelligenceSchema,
  PresentationIntelligenceSchema,
  type AIFieldValue,
  type MeetingIntelligence,
  type PresentationIntelligence,
} from "./schema";

// The pre-meeting brief. Deliberately NOT a third AI extraction: every line in it was
// already generated, grounded and stored when a previous meeting was analysed, so
// re-asking a model would only add a second chance to drift from the evidence. This is
// composition — CRM facts plus the stored insights for this Lead's earlier meetings —
// which is why it is a pure function with a thin loader in front of it.
//
// Nothing is invented here. A Lead with no analysed meeting gets an empty brief that says
// so; it does not get plausible-looking suggestions.

export type BriefItem = AIFieldValue & {
  /** Which meeting this line came from, so the UI can link back to the transcript. */
  meetingId: string;
  meetingTitle: string | null;
};

export type PreMeetingBrief = {
  leadId: string;
  /** CRM state, not a model output — these are recorded fields, shown as recorded. */
  dealState: { label: string; value: string | null }[];
  goals: BriefItem[];
  unresolvedQuestions: BriefItem[];
  objections: BriefItem[];
  commitments: BriefItem[];
  whatToPresent: BriefItem[];
  whatNotToRepeat: BriefItem[];
  suggestedAgenda: BriefItem[];
  desiredOutcome: BriefItem | null;
  /** The meetings that fed this brief. Empty means the brief is empty on purpose. */
  sourceMeetings: { meetingId: string; title: string | null; scheduledStart: string | null }[];
};

export type BriefSource = {
  meetingId: string;
  title: string | null;
  scheduledStart: string | null;
  intelligence: MeetingIntelligence | null;
  presentation: PresentationIntelligence | null;
};

function items(source: BriefSource, fields: readonly AIFieldValue[] | undefined): BriefItem[] {
  return (fields ?? [])
    // An unknown line carries no information into a briefing — the brief says "nothing
    // recorded" by being short, not by listing blanks.
    .filter((field) => field.confidence !== "unknown" && field.value)
    .map((field) => ({ ...field, meetingId: source.meetingId, meetingTitle: source.title }));
}

export function buildPreMeetingBrief(
  leadId: string,
  lead: Record<string, string | null> | null,
  sources: readonly BriefSource[],
): PreMeetingBrief {
  const usable = sources.filter((source) => source.intelligence ?? source.presentation);

  const brief: PreMeetingBrief = {
    leadId,
    dealState: [
      { label: "Stage", value: lead?.status ?? null },
      { label: "Service interest", value: lead?.service_interest ?? null },
      { label: "Timeline on file", value: lead?.timeline ?? null },
      { label: "Budget on file", value: lead?.budget_range ?? null },
    ],
    goals: [],
    unresolvedQuestions: [],
    objections: [],
    commitments: [],
    whatToPresent: [],
    whatNotToRepeat: [],
    suggestedAgenda: [],
    desiredOutcome: null,
    sourceMeetings: usable.map((source) => ({
      meetingId: source.meetingId,
      title: source.title,
      scheduledStart: source.scheduledStart,
    })),
  };

  for (const source of usable) {
    brief.goals.push(...items(source, source.intelligence?.businessGoals));
    brief.unresolvedQuestions.push(...items(source, source.intelligence?.openQuestions));
    brief.objections.push(...items(source, source.intelligence?.objections));
    brief.commitments.push(...items(source, source.intelligence?.nextActions));
    brief.whatToPresent.push(...items(source, source.presentation?.whatToPresent));
    brief.whatNotToRepeat.push(...items(source, source.presentation?.whatNotToPresent));
    brief.suggestedAgenda.push(...items(source, source.presentation?.recommendedAgenda));
  }

  // The newest meeting's next commercial step is the one that is still live; earlier ones
  // have been overtaken by the meetings that followed them.
  const newest = usable[0];
  const step = newest?.presentation?.nextCommercialStep;
  if (step && step.confidence !== "unknown" && step.value) {
    brief.desiredOutcome = { ...step, meetingId: newest.meetingId, meetingTitle: newest.title };
  }

  return brief;
}

/** Loads the Lead, its meetings and their latest stored insights, then composes. */
export async function getPreMeetingBrief(workspaceId: string, leadId: string): Promise<PreMeetingBrief> {
  const supabase = await createClient();

  const { data: leadRow } = await supabase
    .from("leads")
    .select("status, service_interest, timeline, budget_range")
    .eq("id", leadId)
    .maybeSingle();

  const { data: meetingRows } = await supabase
    .from("meetings")
    .select("id, title, scheduled_start, created_at")
    .eq("workspace_id", workspaceId)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  const meetings = (meetingRows ?? []) as { id: string; title: string | null; scheduled_start: string | null }[];
  if (meetings.length === 0) {
    return buildPreMeetingBrief(leadId, (leadRow as Record<string, string | null> | null) ?? null, []);
  }

  const { data: insightRows } = await supabase
    .from("ai_meeting_insights")
    .select("meeting_id, insight_type, payload, generated_at")
    .eq("workspace_id", workspaceId)
    .in(
      "meeting_id",
      meetings.map((meeting) => meeting.id),
    )
    .order("generated_at", { ascending: false });

  const latest = new Map<string, unknown>();
  for (const row of (insightRows ?? []) as { meeting_id: string; insight_type: string; payload: unknown }[]) {
    const key = `${row.meeting_id}:${row.insight_type}`;
    if (!latest.has(key)) latest.set(key, row.payload);
  }

  const sources: BriefSource[] = meetings.map((meeting) => {
    // Re-validated on the way out, not trusted because it is ours: a payload written by
    // an older schema version must degrade to "no insight" rather than render half a
    // brief from fields that no longer mean what they did.
    const intelligence = MeetingIntelligenceSchema.safeParse(latest.get(`${meeting.id}:meeting_intelligence`));
    const presentation = PresentationIntelligenceSchema.safeParse(
      latest.get(`${meeting.id}:presentation_intelligence`),
    );
    return {
      meetingId: meeting.id,
      title: meeting.title,
      scheduledStart: meeting.scheduled_start,
      intelligence: intelligence.success ? intelligence.data : null,
      presentation: presentation.success ? presentation.data : null,
    };
  });

  return buildPreMeetingBrief(leadId, (leadRow as Record<string, string | null> | null) ?? null, sources);
}
