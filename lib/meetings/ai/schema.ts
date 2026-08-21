// The structured output contract for Meeting Intelligence and Next Presentation
// Intelligence. Provider-neutral by construction: nothing here names Google, and the
// same schema is used whatever adapter produced the transcript (lib/meetings/provider.ts).
//
// Two rules are enforced by the shape itself rather than by prompt wording, because a
// prompt is a request and a schema is a constraint:
//
//   1. Every meaningful field is an AIField — a value plus a confidence of
//      confirmed | inferred | unknown. There is no way to state a budget, a timeline or
//      a decision maker without also saying which of the three it is, so "the model did
//      not say" and "the model asserted" cannot collapse into the same rendering.
//   2. Every AIField carries evidence: transcript entry ids, with the timestamp and
//      speaker where the provider gave one. Evidence is verified against the real
//      entries after generation (see generate.ts's groundInsight) — a citation the
//      transcript does not contain is dropped and the field demoted, so a fabricated
//      reference degrades to "unknown" instead of reaching a user as a fact.
//
// Evidence is a pointer to what was said, never a record of how the model reasoned —
// no chain of thought is requested, produced or stored.

import { z } from "zod";

export const CONFIDENCE_VALUES = ["confirmed", "inferred", "unknown"] as const;

export const EvidenceRefSchema = z.object({
  /** A transcript_entries.provider_entry_id present in the transcript that was read. */
  transcriptEntryId: z.string(),
  timestamp: z.string().nullable(),
  speakerLabel: z.string().nullable(),
});

/** value + confidence + evidence. `unknown` is a first-class answer, not a failure. */
export function aiField<T extends z.ZodTypeAny>(value: T) {
  return z.object({
    value: value.nullable(),
    confidence: z.enum(CONFIDENCE_VALUES),
    evidence: z.array(EvidenceRefSchema),
  });
}

const TextField = aiField(z.string());
const TextList = z.array(TextField);

export const MeetingIntelligenceSchema = z.object({
  executiveSummary: TextField,
  clientProblems: TextList,
  requirements: TextList,
  businessGoals: TextList,
  stakeholders: TextList,
  painPoints: TextList,
  objections: TextList,
  buyingSignals: TextList,
  risksAndBlockers: TextList,
  timeline: TextField,
  budgetAndCommercialSignals: TextField,
  competitorsAndAlternatives: TextList,
  openQuestions: TextList,
  nextActions: TextList,
});

export const DEMO_PRIORITIES = ["P1", "P2", "P3"] as const;

export const PresentationIntelligenceSchema = z.object({
  recommendedObjective: TextField,
  recommendedAgenda: TextList,
  whatToPresent: TextList,
  /** Not the inverse of whatToPresent: things the transcript shows would land badly. */
  whatNotToPresent: TextList,
  demoPriorities: z.array(z.object({ priority: z.enum(DEMO_PRIORITIES), item: TextField })),
  keyMessages: TextList,
  questionsToAsk: TextList,
  objectionsToPrepareFor: TextList,
  proposedSolutionShape: TextField,
  nextCommercialStep: TextField,
});

export type EvidenceRefValue = z.infer<typeof EvidenceRefSchema>;
export type AIFieldValue<T = string> = { value: T | null; confidence: (typeof CONFIDENCE_VALUES)[number]; evidence: EvidenceRefValue[] };
export type MeetingIntelligence = z.infer<typeof MeetingIntelligenceSchema>;
export type PresentationIntelligence = z.infer<typeof PresentationIntelligenceSchema>;

/** What the provider is asked to conform to. z.toJSONSchema keeps the two in step —
 *  a schema edited here cannot drift from the one sent on the wire. */
export function meetingIntelligenceJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(MeetingIntelligenceSchema, { io: "output" }) as Record<string, unknown>;
}

export function presentationIntelligenceJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(PresentationIntelligenceSchema, { io: "output" }) as Record<string, unknown>;
}

/** An empty, fully-unknown insight. Used when there is no transcript to read: the UI
 *  renders the same component either way and says UNKNOWN, rather than hiding sections
 *  and implying they were considered. */
export function emptyMeetingIntelligence(): MeetingIntelligence {
  const unknown: AIFieldValue = { value: null, confidence: "unknown", evidence: [] };
  return {
    executiveSummary: unknown,
    clientProblems: [],
    requirements: [],
    businessGoals: [],
    stakeholders: [],
    painPoints: [],
    objections: [],
    buyingSignals: [],
    risksAndBlockers: [],
    timeline: unknown,
    budgetAndCommercialSignals: unknown,
    competitorsAndAlternatives: [],
    openQuestions: [],
    nextActions: [],
  };
}
