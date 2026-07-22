// ProposalAcceptanceProvider — work/PROVIDER-ADAPTER-PLAN.md row 8
// Shape: sendForSignature, getStatus. Mock strategy: fixture-based signed/pending/declined states.
// NOTE: this is an internal acknowledgement record, never represented as a full legal
// e-signature platform until a real vendor is contracted and confirmed (plan note, line 19).
import type { ProviderStatus } from "./types";

export type AcceptanceStatus = "pending" | "signed" | "declined";

export interface ProposalAcceptanceProvider {
  status: ProviderStatus;
  sendForSignature(proposalId: string): Promise<{ proposalId: string; status: AcceptanceStatus }>;
  getStatus(proposalId: string): Promise<{ proposalId: string; status: AcceptanceStatus }>;
}

export class MockProposalAcceptanceProvider implements ProposalAcceptanceProvider {
  status: ProviderStatus = "NOT_CONFIGURED";

  async sendForSignature(proposalId: string): Promise<{ proposalId: string; status: AcceptanceStatus }> {
    return { proposalId, status: "pending" };
  }

  async getStatus(proposalId: string): Promise<{ proposalId: string; status: AcceptanceStatus }> {
    if (proposalId === "proposal-mock-declined") {
      return { proposalId, status: "declined" };
    }
    return { proposalId, status: "signed" };
  }
}
