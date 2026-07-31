// The planner.
//
// A plan is policy, so the tests assert policy: a plan never offers a tool the
// subject cannot use, every plan that offers tools carries a finite budget under
// the configured ceiling, and anything that could change state is flagged for
// confirmation before the model has produced a single token.

import { describe, expect, it } from "vitest";
import type { PermissionId, PermissionSubject } from "../permissions/types";
import { RuleBasedIntentClassifier } from "./intent";
import { DefaultPlanner } from "./planner";
import type { IntentId, PlanRequest, PlanStep } from "./types";

const SUBJECT: PermissionSubject = {
  userId: "user-1",
  workspaceId: "workspace-1",
  grants: ["CanReadCRM", "CanUpdateCRM"],
};

const PERMISSION_BY_TOOL: Readonly<Record<string, PermissionId>> = {
  search_crm: "CanReadCRM",
  update_crm: "CanUpdateCRM",
};

function planRequest(overrides: Partial<PlanRequest> = {}): PlanRequest {
  return {
    text: "hello",
    subject: SUBJECT,
    hasHistory: false,
    availableTools: [],
    knowledgeAvailable: false,
    ...overrides,
  };
}

function planner(maxToolIterations = 8) {
  return new DefaultPlanner({
    maxToolIterations,
    permissionForTool: (name) => PERMISSION_BY_TOOL[name],
  });
}

function stepOf<TKind extends PlanStep["kind"]>(
  steps: readonly PlanStep[],
  kind: TKind,
): Extract<PlanStep, { kind: TKind }> | undefined {
  return steps.find((step): step is Extract<PlanStep, { kind: TKind }> => step.kind === kind);
}

describe("RuleBasedIntentClassifier", () => {
  const classifier = new RuleBasedIntentClassifier();

  const cases: [string, IntentId][] = [
    ["", "unsupported"],
    ["   ", "unsupported"],
    ["thanks", "conversation"],
    ["send an email to the client", "write_action"],
    ["create an invoice for Acme", "write_action"],
    ["summarise the meeting", "summarize"],
    ["what does the handbook say about refunds", "retrieval"],
    ["list the open projects", "read_action"],
    ["why is the deployment slow?", "question"],
  ];

  it.each(cases)("classifies %j as %s", async (text, expected) => {
    const intent = await classifier.classify({ text, subject: SUBJECT, hasHistory: false });
    expect(intent.id).toBe(expected);
  });

  it("checks for a write before anything else, because that guess is the safe one", async () => {
    // Reads as a question, but it asks for a record to be changed.
    const intent = await classifier.classify({
      text: "can you update the CRM entry for Acme?",
      subject: SUBJECT,
      hasHistory: false,
    });

    expect(intent.id).toBe("write_action");
  });

  it("reads a short unmatched reply mid-conversation as a follow-up", async () => {
    const followUp = await classifier.classify({ text: "the second one", subject: SUBJECT, hasHistory: true });
    const opening = await classifier.classify({ text: "the second one", subject: SUBJECT, hasHistory: false });

    expect(followUp.id).toBe("conversation");
    expect(opening.id).toBe("question");
  });

  it("always reports a rationale and a bounded confidence", async () => {
    for (const [text] of cases) {
      const intent = await classifier.classify({ text, subject: SUBJECT, hasHistory: false });
      expect(intent.rationale).not.toBe("");
      expect(intent.confidence).toBeGreaterThan(0);
      expect(intent.confidence).toBeLessThanOrEqual(1);
    }
  });
});

describe("DefaultPlanner", () => {
  it("always ends by responding", async () => {
    const plan = await planner().plan(planRequest());
    expect(plan.steps.at(-1)).toEqual({ kind: "respond" });
  });

  it("offers no tools for small talk", async () => {
    const plan = await planner().plan(
      planRequest({ text: "thanks", availableTools: ["search_crm"] }),
    );

    expect(stepOf(plan.steps, "tools")).toBeUndefined();
  });

  it("offers only the tools it was given, which are already permission-filtered", async () => {
    const plan = await planner().plan(
      planRequest({ text: "list the open projects", availableTools: ["search_crm"] }),
    );

    expect(stepOf(plan.steps, "tools")?.allowed).toEqual(["search_crm"]);
  });

  it("offers no tool step when the subject has none available", async () => {
    const plan = await planner().plan(planRequest({ text: "list the open projects" }));
    expect(stepOf(plan.steps, "tools")).toBeUndefined();
  });

  it("bounds the tool loop and never exceeds the configured ceiling", async () => {
    const generous = await planner(8).plan(
      planRequest({ text: "send an email to the client", availableTools: ["update_crm"] }),
    );
    const tight = await planner(1).plan(
      planRequest({ text: "send an email to the client", availableTools: ["update_crm"] }),
    );

    expect(stepOf(generous.steps, "tools")?.maxIterations).toBe(5);
    expect(stepOf(tight.steps, "tools")?.maxIterations).toBe(1);
  });

  it("retrieves only when a knowledge source exists", async () => {
    const withKnowledge = await planner().plan(
      planRequest({ text: "what does the handbook say about refunds", knowledgeAvailable: true }),
    );
    const without = await planner().plan(
      planRequest({ text: "what does the handbook say about refunds" }),
    );

    expect(stepOf(withKnowledge.steps, "retrieve")?.limit).toBe(5);
    expect(stepOf(without.steps, "retrieve")).toBeUndefined();
  });

  it("does not retrieve for a request that is about records, not documents", async () => {
    const plan = await planner().plan(
      planRequest({ text: "list the open projects", knowledgeAvailable: true }),
    );

    expect(stepOf(plan.steps, "retrieve")).toBeUndefined();
  });

  it("declares the capabilities the plan may consume, deduplicated", async () => {
    const plan = await planner().plan(
      planRequest({
        text: "list the open projects",
        availableTools: ["search_crm", "search_crm", "update_crm"],
      }),
    );

    expect([...plan.requiredPermissions].sort()).toEqual(["CanReadCRM", "CanUpdateCRM"]);
  });

  it("declares no capabilities when no tools will run", async () => {
    const plan = await planner().plan(planRequest({ text: "thanks", availableTools: ["search_crm"] }));
    expect(plan.requiredPermissions).toEqual([]);
  });

  it("requires confirmation for a write intent", async () => {
    const plan = await planner().plan(planRequest({ text: "send an email to the client" }));
    expect(plan.requiresConfirmation).toBe(true);
  });

  it("requires confirmation when a mutating tool is on offer, whatever the intent", async () => {
    // The intent classifier read this as a lookup. The grant says otherwise, and
    // the grant is the one that cannot be talked out of.
    const plan = await planner().plan(
      planRequest({ text: "list the open projects", availableTools: ["update_crm"] }),
    );

    expect(plan.intent.id).toBe("read_action");
    expect(plan.requiresConfirmation).toBe(true);
  });

  it("does not require confirmation for a read-only plan", async () => {
    const plan = await planner().plan(
      planRequest({ text: "list the open projects", availableTools: ["search_crm"] }),
    );

    expect(plan.requiresConfirmation).toBe(false);
  });

  it("uses an injected classifier when one is supplied", async () => {
    const planned = await new DefaultPlanner({
      maxToolIterations: 4,
      classifier: {
        classify: async () => ({ id: "write_action", confidence: 1, rationale: "stubbed" }),
      },
    }).plan(planRequest({ text: "anything", availableTools: ["search_crm"] }));

    expect(planned.intent.rationale).toBe("stubbed");
    expect(planned.requiresConfirmation).toBe(true);
  });
});
