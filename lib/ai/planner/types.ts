// Intents and plans.
//
// The planner is what makes this an operating system rather than a chat box: a
// request is classified, a plan is produced, and the plan — not the model — sets
// the budget, decides whether tools are offered at all, and decides whether
// knowledge is retrieved. Those are policy decisions, and policy that lives in a
// prompt cannot be tested or bounded.
//
// A plan is data. It can be logged, asserted against, and shown to a user before
// anything runs.

import type { PermissionId, PermissionSubject } from "../permissions/types";

/**
 * What the user is trying to do.
 *
 * Coarse on purpose. The categories that matter are the ones that change the
 * plan — whether tools are needed, whether retrieval is worth its latency,
 * whether a write may be attempted — not a fine-grained taxonomy of phrasing.
 */
export type IntentId =
  | "conversation"
  | "question"
  | "retrieval"
  | "read_action"
  | "write_action"
  | "summarize"
  | "unsupported";

export const INTENT_IDS: readonly IntentId[] = [
  "conversation",
  "question",
  "retrieval",
  "read_action",
  "write_action",
  "summarize",
  "unsupported",
];

export type Intent = {
  id: IntentId;
  /** 0–1. A low score makes the planner conservative, never wrong-but-confident. */
  confidence: number;
  /** Which rule or model produced this. Logged so misclassifications are traceable. */
  rationale: string;
};

export type IntentInput = {
  text: string;
  subject: PermissionSubject;
  /** Whether this is a follow-up. Short replies read differently mid-conversation. */
  hasHistory: boolean;
};

export interface IntentClassifier {
  classify(input: IntentInput): Promise<Intent>;
}

/** What the plan says should happen at each stage. */
export type PlanStep =
  | { kind: "retrieve"; limit: number }
  | { kind: "tools"; allowed: readonly string[]; maxIterations: number }
  | { kind: "respond" };

export type Plan = {
  intent: Intent;
  steps: readonly PlanStep[];
  /** Catalog model id, when the intent warrants overriding the configured default. */
  model?: string;
  /** Capabilities this plan may consume. Checked once, before anything runs. */
  requiredPermissions: readonly PermissionId[];
  /**
   * Set when a plan would change data or contact a third party. The orchestrator
   * surfaces it; a human decides. The model never clears this flag itself.
   */
  requiresConfirmation: boolean;
};

export type PlanRequest = {
  text: string;
  subject: PermissionSubject;
  hasHistory: boolean;
  /** Tool names the subject may use, already permission-filtered by the registry. */
  availableTools: readonly string[];
  /** Whether any knowledge source is configured. A plan never retrieves from nothing. */
  knowledgeAvailable: boolean;
};

export interface Planner {
  plan(request: PlanRequest): Promise<Plan>;
}
