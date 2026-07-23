// LanguageModelProvider — work/PROVIDER-ADAPTER-PLAN.md row 5
// Shape: generateInsight(context) -> {output, requiresApproval: true}
// Mock strategy: fixture responses matching AI-SAFETY-AND-REVIEW-SPEC.md constraints
// (no invented pricing/case studies/sentiment %). Output lands unreviewed (reviewStatus "pending").
import type { ProviderStatus } from "./types";

export type LanguageModelProviderError = "unavailable" | "limit";

export interface GenerateInsightResult {
  output: string;
  requiresApproval: true;
  reviewStatus: "pending";
  confidence: number;
}

export interface LanguageModelProvider {
  status: ProviderStatus;
  generateInsight(context: string): Promise<GenerateInsightResult | { error: LanguageModelProviderError }>;
}

// ponytail: single static fixture string, deliberately generic (no numbers/prices/names)
// so it can never violate the no-invented-facts rule. Real prompts land with a real provider.
export class MockLanguageModelProvider implements LanguageModelProvider {
  status: ProviderStatus = "NOT_CONFIGURED";

  async generateInsight(context: string): Promise<GenerateInsightResult | { error: LanguageModelProviderError }> {
    if (context === "trigger-provider-unavailable") {
      return { error: "unavailable" };
    }
    if (context === "trigger-provider-limit") {
      return { error: "limit" };
    }
    return {
      output: "Client expressed interest in scheduling a follow-up meeting.",
      requiresApproval: true,
      reviewStatus: "pending",
      confidence: 0.82,
    };
  }
}
