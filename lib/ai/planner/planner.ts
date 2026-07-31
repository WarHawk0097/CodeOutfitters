// The default planner.
//
// Maps an intent onto a bounded plan. Two properties are load-bearing and are
// asserted in the tests: a plan never offers a tool the subject cannot use, and
// every plan that offers tools carries a finite iteration budget. Together they
// mean a compromised or confused model can waste at most a known number of calls
// against a known set of capabilities.
//
// Confirmation is required for any plan that could change state. That decision is
// made here, from the intent, before the model has produced anything — not
// inferred afterwards from what it tried to call.

import { isMutating, type PermissionId } from "../permissions/types";
import type { Intent, Plan, PlanRequest, PlanStep, Planner } from "./types";
import { ruleBasedIntentClassifier } from "./intent";
import type { IntentClassifier } from "./types";

export type PlannerOptions = {
  classifier?: IntentClassifier;
  /** Ceiling on tool-loop iterations. Comes from `AIConfig.maxToolIterations`. */
  maxToolIterations: number;
  /** Chunks retrieved when a plan includes a retrieval step. */
  retrievalLimit?: number;
  /**
   * Resolves a tool name to the capability it needs. Injected rather than taking
   * the registry, so the planner stays independent of tool execution.
   */
  permissionForTool?: (name: string) => PermissionId | undefined;
};

export class DefaultPlanner implements Planner {
  private readonly classifier: IntentClassifier;

  constructor(private readonly options: PlannerOptions) {
    this.classifier = options.classifier ?? ruleBasedIntentClassifier;
  }

  async plan(request: PlanRequest): Promise<Plan> {
    const intent = await this.classifier.classify({
      text: request.text,
      subject: request.subject,
      hasHistory: request.hasHistory,
    });

    const steps: PlanStep[] = [];

    if (this.shouldRetrieve(intent) && request.knowledgeAvailable) {
      steps.push({ kind: "retrieve", limit: this.options.retrievalLimit ?? 5 });
    }

    // `availableTools` has already been filtered by the registry against this
    // subject's grants, so offering all of it cannot widen access. The planner
    // decides only whether tools are offered, never which grants exist.
    if (this.shouldUseTools(intent) && request.availableTools.length > 0) {
      steps.push({
        kind: "tools",
        allowed: request.availableTools,
        maxIterations: this.iterationsFor(intent),
      });
    }

    steps.push({ kind: "respond" });

    const requiredPermissions = this.permissionsFor(request.availableTools, steps);

    return {
      intent,
      steps,
      requiredPermissions,
      // Either the intent is a write, or the offered tools include a mutating one.
      // Both routes are checked: an intent can be misclassified, a grant cannot.
      requiresConfirmation:
        intent.id === "write_action" || requiredPermissions.some((permission) => isMutating(permission)),
    };
  }

  private shouldRetrieve(intent: Intent): boolean {
    return intent.id === "retrieval" || intent.id === "question";
  }

  private shouldUseTools(intent: Intent): boolean {
    // Small talk never gets a tool list: it is pure cost, and an unnecessary tool
    // inventory in context is an unnecessary opportunity for injection to land.
    return intent.id !== "conversation" && intent.id !== "unsupported";
  }

  /**
   * Iteration budget.
   *
   * A single lookup rarely needs more than a couple of round trips; a write may
   * need to read first, then act. Both stay under the configured ceiling — the
   * planner can be more conservative than the config, never less.
   */
  private iterationsFor(intent: Intent): number {
    const ceiling = this.options.maxToolIterations;
    if (intent.id === "read_action" || intent.id === "retrieval") return Math.min(3, ceiling);
    if (intent.id === "write_action") return Math.min(5, ceiling);
    return Math.min(2, ceiling);
  }

  private permissionsFor(
    availableTools: readonly string[],
    steps: readonly PlanStep[],
  ): readonly PermissionId[] {
    const usesTools = steps.some((step) => step.kind === "tools");
    if (!usesTools || !this.options.permissionForTool) return [];
    const permissions = new Set<PermissionId>();
    for (const name of availableTools) {
      const permission = this.options.permissionForTool(name);
      if (permission) permissions.add(permission);
    }
    return [...permissions];
  }
}
