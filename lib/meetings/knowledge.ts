import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { KnowledgeChunk, KnowledgeQuery, KnowledgeSource } from "@/lib/ai";
import { MeetingIntelligenceSchema, PresentationIntelligenceSchema, type AIFieldValue } from "./ai/schema";

// Copilot's meeting grounding.
//
// What this source returns is ONLY what was already extracted, validated and grounded
// when a meeting was analysed (lib/meetings/ai/generate.ts). It runs no model, invents no
// summary and reads no transcript the extraction did not already cite. A question about a
// meeting that was never analysed retrieves nothing, and Copilot answers that it does not
// know — which is the correct answer, not a gap to paper over.
//
// Every line carries its own confidence marker into the prompt, so the assistant can see
// the difference between "the client said" and "this was inferred" rather than flattening
// both into an assertion. Retrieved text is wrapped as untrusted reference material by
// formatChunksForPrompt before it reaches a model.
//
// Scoping: the query's workspaceId is applied in SQL as well as by RLS. A retriever that
// could ever read another tenant's meetings is the one failure mode that matters here.

const MAX_MEETINGS = 8;

function line(label: string, field: AIFieldValue | undefined): string | null {
  if (!field || field.confidence === "unknown" || !field.value) return null;
  return `${label} [${field.confidence.toUpperCase()}]: ${field.value}`;
}

function lines(label: string, fields: readonly AIFieldValue[] | undefined): string[] {
  return (fields ?? [])
    .filter((field) => field.confidence !== "unknown" && field.value)
    .map((field) => `${label} [${field.confidence.toUpperCase()}]: ${field.value}`);
}

/** Renders one meeting's stored insights as plain text. Unknown fields are omitted
 *  rather than rendered blank — an empty section in a prompt reads as an absence of
 *  information, which is exactly what it is. */
export function renderMeetingChunkText(intelligence: unknown, presentation: unknown): string {
  const out: string[] = [];

  const mi = MeetingIntelligenceSchema.safeParse(intelligence);
  if (mi.success) {
    const data = mi.data;
    const summary = line("Summary", data.executiveSummary);
    if (summary) out.push(summary);
    out.push(...lines("Client problem", data.clientProblems));
    out.push(...lines("Requirement", data.requirements));
    out.push(...lines("Business goal", data.businessGoals));
    out.push(...lines("Stakeholder", data.stakeholders));
    out.push(...lines("Pain point", data.painPoints));
    out.push(...lines("Objection", data.objections));
    out.push(...lines("Buying signal", data.buyingSignals));
    out.push(...lines("Risk", data.risksAndBlockers));
    const timeline = line("Timeline", data.timeline);
    if (timeline) out.push(timeline);
    const budget = line("Budget signal", data.budgetAndCommercialSignals);
    if (budget) out.push(budget);
    out.push(...lines("Competitor", data.competitorsAndAlternatives));
    out.push(...lines("Open question", data.openQuestions));
    out.push(...lines("Promised next action", data.nextActions));
  }

  const pi = PresentationIntelligenceSchema.safeParse(presentation);
  if (pi.success) {
    const data = pi.data;
    const objective = line("Recommended objective for next meeting", data.recommendedObjective);
    if (objective) out.push(objective);
    out.push(...lines("Agenda item", data.recommendedAgenda));
    out.push(...lines("Present next", data.whatToPresent));
    out.push(...lines("Do not present", data.whatNotToPresent));
    out.push(
      ...data.demoPriorities
        .filter((entry) => entry.item.confidence !== "unknown" && entry.item.value)
        .map((entry) => `Demo ${entry.priority} [${entry.item.confidence.toUpperCase()}]: ${entry.item.value}`),
    );
    out.push(...lines("Key message", data.keyMessages));
    out.push(...lines("Question to ask", data.questionsToAsk));
    out.push(...lines("Objection to prepare for", data.objectionsToPrepareFor));
    const shape = line("Proposed solution shape", data.proposedSolutionShape);
    if (shape) out.push(shape);
    const step = line("Next commercial step", data.nextCommercialStep);
    if (step) out.push(step);
  }

  return out.join("\n");
}

export class MeetingKnowledgeSource implements KnowledgeSource {
  readonly id = "meetings";

  async search(query: KnowledgeQuery): Promise<readonly KnowledgeChunk[]> {
    const supabase = await createClient();

    const { data: meetingRows } = await supabase
      .from("meetings")
      .select("id, title, lead_id, scheduled_start, created_at")
      .eq("workspace_id", query.workspaceId)
      .order("created_at", { ascending: false })
      .limit(MAX_MEETINGS);

    const meetings = (meetingRows ?? []) as { id: string; title: string | null; scheduled_start: string | null }[];
    if (meetings.length === 0) return [];

    const { data: insightRows } = await supabase
      .from("ai_meeting_insights")
      .select("meeting_id, insight_type, payload, generated_at")
      .eq("workspace_id", query.workspaceId)
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

    const chunks: KnowledgeChunk[] = [];
    meetings.forEach((meeting, index) => {
      const text = renderMeetingChunkText(
        latest.get(`${meeting.id}:meeting_intelligence`),
        latest.get(`${meeting.id}:presentation_intelligence`),
      );
      if (!text) return; // Analysed nothing yet — contribute nothing.
      chunks.push({
        id: `meeting:${meeting.id}`,
        sourceId: meeting.id,
        title: meeting.title ?? "Untitled meeting",
        text,
        // Recency, not relevance: these are whole-meeting records rather than passages,
        // so there is nothing honest to rank them by within a single result set. The
        // score is comparable only here, which is what the KnowledgeChunk contract says.
        score: 1 - index / meetings.length,
        metadata: { meetingId: meeting.id, ...(meeting.scheduled_start ? { scheduledStart: meeting.scheduled_start } : {}) },
      });
    });

    return typeof query.limit === "number" ? chunks.slice(0, query.limit) : chunks;
  }
}

export function createMeetingKnowledgeSource(): KnowledgeSource {
  return new MeetingKnowledgeSource();
}
