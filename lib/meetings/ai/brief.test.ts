// The pre-meeting brief is composition, not generation — so it is tested as a pure
// function. The property that matters: nothing appears in a brief that was not already
// grounded in a previous meeting's stored extraction, and an unknown never becomes a
// blank line someone reads as a fact.
import { describe, expect, it } from "vitest";
import { buildPreMeetingBrief, type BriefSource } from "./brief";
import { emptyMeetingIntelligence, type AIFieldValue, type MeetingIntelligence, type PresentationIntelligence } from "./schema";

const LEAD = { status: "Qualified", service_interest: "Booking flow rebuild", timeline: null, budget_range: null };

function field(value: string | null, confidence: AIFieldValue["confidence"] = "confirmed"): AIFieldValue {
  return { value, confidence, evidence: [] };
}

function intelligence(overrides: Partial<MeetingIntelligence> = {}): MeetingIntelligence {
  return { ...emptyMeetingIntelligence(), ...overrides };
}

function presentation(overrides: Partial<PresentationIntelligence> = {}): PresentationIntelligence {
  return {
    recommendedObjective: field(null, "unknown"),
    recommendedAgenda: [],
    whatToPresent: [],
    whatNotToPresent: [],
    demoPriorities: [],
    keyMessages: [],
    questionsToAsk: [],
    objectionsToPrepareFor: [],
    proposedSolutionShape: field(null, "unknown"),
    nextCommercialStep: field(null, "unknown"),
    ...overrides,
  };
}

function source(id: string, overrides: Partial<BriefSource> = {}): BriefSource {
  return {
    meetingId: id,
    title: `Meeting ${id}`,
    scheduledStart: null,
    intelligence: null,
    presentation: null,
    ...overrides,
  };
}

describe("buildPreMeetingBrief", () => {
  it("with no analysed meeting, reports CRM state and nothing else", () => {
    const brief = buildPreMeetingBrief("lead-1", LEAD, []);
    expect(brief.sourceMeetings).toEqual([]);
    expect(brief.goals).toEqual([]);
    expect(brief.suggestedAgenda).toEqual([]);
    expect(brief.desiredOutcome).toBeNull();
    // Recorded fields are shown as recorded, including the ones that are genuinely empty.
    expect(brief.dealState).toContainEqual({ label: "Budget on file", value: null });
    expect(brief.dealState).toContainEqual({ label: "Stage", value: "Qualified" });
  });

  it("carries each line back to the meeting it came from", () => {
    const brief = buildPreMeetingBrief("lead-1", LEAD, [
      source("m1", { intelligence: intelligence({ objections: [field("The last agency went quiet")] }) }),
    ]);
    expect(brief.objections).toEqual([
      expect.objectContaining({ value: "The last agency went quiet", meetingId: "m1", meetingTitle: "Meeting m1" }),
    ]);
  });

  it("omits unknown lines instead of briefing someone with blanks", () => {
    const brief = buildPreMeetingBrief("lead-1", LEAD, [
      source("m1", {
        intelligence: intelligence({
          openQuestions: [field(null, "unknown"), field("Who signs this off?")],
          businessGoals: [field("", "confirmed")],
        }),
      }),
    ]);
    expect(brief.unresolvedQuestions.map((item) => item.value)).toEqual(["Who signs this off?"]);
    expect(brief.goals).toEqual([]);
  });

  it("takes the desired outcome from the newest meeting, not an overtaken one", () => {
    // sources arrive newest-first, matching the loader's ordering.
    const brief = buildPreMeetingBrief("lead-1", LEAD, [
      source("newest", { presentation: presentation({ nextCommercialStep: field("Send the written scope") }) }),
      source("older", { presentation: presentation({ nextCommercialStep: field("Book a discovery call") }) }),
    ]);
    expect(brief.desiredOutcome?.value).toBe("Send the written scope");
    expect(brief.desiredOutcome?.meetingId).toBe("newest");
  });

  it("leaves the desired outcome null when the newest meeting could not ground one", () => {
    const brief = buildPreMeetingBrief("lead-1", LEAD, [
      source("newest", { presentation: presentation() }),
      source("older", { presentation: presentation({ nextCommercialStep: field("Book a discovery call") }) }),
    ]);
    expect(brief.desiredOutcome).toBeNull();
  });

  it("ignores a meeting that has no stored extraction at all", () => {
    const brief = buildPreMeetingBrief("lead-1", LEAD, [source("m1"), source("m2", { intelligence: intelligence() })]);
    expect(brief.sourceMeetings.map((meeting) => meeting.meetingId)).toEqual(["m2"]);
  });

  it("separates what to present from what not to repeat", () => {
    const brief = buildPreMeetingBrief("lead-1", LEAD, [
      source("m1", {
        presentation: presentation({
          whatToPresent: [field("Partial-save flow")],
          whatNotToPresent: [field("The full platform tour again")],
        }),
      }),
    ]);
    expect(brief.whatToPresent.map((item) => item.value)).toEqual(["Partial-save flow"]);
    expect(brief.whatNotToRepeat.map((item) => item.value)).toEqual(["The full platform tour again"]);
  });
});
