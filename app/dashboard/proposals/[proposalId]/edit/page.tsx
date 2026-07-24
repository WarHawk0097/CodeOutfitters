import { resolveDashboardContext } from "@/lib/command-center/data";
import { ProposalBuilderView } from "./builder-view";

export const metadata = { title: "Proposal builder — Command Center" };

// SCREEN_PROPOSAL_BUILDER (P-D03..P-D09) as a deep-linkable route. Like the other proposal
// screens this is a demo-presentation island backed by the client demo store, but the page is
// still gated exactly like every other dashboard route: resolveDashboardContext enforces Work
// Order F authentication and workspace authorization in live mode (allowedRoles admin/sales in
// routes.json) and is a no-op in demo — so the builder auth boundary is preserved and never
// bypassed.
export default async function ProposalBuilderPage({
  params,
}: {
  params: Promise<{ proposalId: string }>;
}) {
  const { proposalId } = await params;
  await resolveDashboardContext(`/dashboard/proposals/${proposalId}/edit`);
  return <ProposalBuilderView proposalId={proposalId} />;
}
