// Copilot's meeting grounding. The rendering is the whole security-relevant surface:
// what this function emits is what a model is later allowed to answer from, so anything
// it invents becomes something Copilot will say.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { renderMeetingChunkText } from "./knowledge";
import { emptyMeetingIntelligence, type AIFieldValue, type PresentationIntelligence } from "./ai/schema";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const knowledgeSrc = readFileSync(`${repo}lib/meetings/knowledge.ts`, "utf8");

function field(value: string | null, confidence: AIFieldValue["confidence"] = "confirmed"): AIFieldValue {
  return { value, confidence, evidence: [] };
}

const PRESENTATION: PresentationIntelligence = {
  recommendedObjective: field("Agree the scope"),
  recommendedAgenda: [],
  whatToPresent: [field("Partial-save flow")],
  whatNotToPresent: [],
  demoPriorities: [
    { priority: "P1", item: field("Partial-save form") },
    { priority: "P2", item: field(null, "unknown") },
  ],
  keyMessages: [],
  questionsToAsk: [],
  objectionsToPrepareFor: [],
  proposedSolutionShape: field(null, "unknown"),
  nextCommercialStep: field("Send a written scope", "inferred"),
};

describe("renderMeetingChunkText", () => {
  it("returns nothing for a meeting that was never analysed", () => {
    // Empty means "contribute no context", which is what makes Copilot answer "I don't
    // know" instead of filling the gap.
    expect(renderMeetingChunkText(undefined, undefined)).toBe("");
    expect(renderMeetingChunkText({ not: "an insight" }, null)).toBe("");
  });

  it("marks every line with the confidence it was stored under", () => {
    const text = renderMeetingChunkText(
      { ...emptyMeetingIntelligence(), requirements: [field("Save partial answers")] },
      PRESENTATION,
    );
    expect(text).toContain("Requirement [CONFIRMED]: Save partial answers");
    expect(text).toContain("Next commercial step [INFERRED]: Send a written scope");
  });

  it("omits unknown fields entirely rather than emitting an empty label", () => {
    const text = renderMeetingChunkText(emptyMeetingIntelligence(), PRESENTATION);
    expect(text).not.toContain("Budget signal");
    expect(text).not.toContain("Timeline");
    expect(text).not.toContain("Proposed solution shape");
    expect(text).not.toMatch(/Demo P2/);
  });

  it("keeps a demo priority's rank attached to its item", () => {
    expect(renderMeetingChunkText(emptyMeetingIntelligence(), PRESENTATION)).toContain(
      "Demo P1 [CONFIRMED]: Partial-save form",
    );
  });

  it("rejects a payload written by an older schema version instead of half-rendering it", () => {
    const stale = { ...emptyMeetingIntelligence(), requirements: ["a bare string"] };
    expect(renderMeetingChunkText(stale, null)).toBe("");
  });
});

describe("MeetingKnowledgeSource (source surface)", () => {
  it("scopes every read to the query's workspace in SQL, not by RLS alone", () => {
    const eqWorkspace = knowledgeSrc.match(/\.eq\("workspace_id", query\.workspaceId\)/g) ?? [];
    // Two reads happen: meetings, then their insights. Both must be scoped.
    expect(eqWorkspace.length).toBe(2);
  });

  it("reads through the session client, never the service role", () => {
    expect(knowledgeSrc).toContain('from "@/lib/supabase/server"');
    expect(knowledgeSrc).not.toContain("getServiceClient");
  });

  it("never reads a transcript — only what the extraction already grounded", () => {
    expect(knowledgeSrc).not.toContain("transcript_entries");
    expect(knowledgeSrc).not.toContain("generateMeetingIntelligence");
  });

  it("is bounded, so one workspace's history cannot fill a prompt", () => {
    expect(knowledgeSrc).toMatch(/MAX_MEETINGS = \d+/);
    expect(knowledgeSrc).toContain(".limit(MAX_MEETINGS)");
  });
});
