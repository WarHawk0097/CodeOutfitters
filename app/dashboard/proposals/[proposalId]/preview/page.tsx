import { resolveDashboardContext } from "@/lib/command-center/data";
import { ProposalPreviewView } from "./preview-view";

export const metadata = { title: "Proposal preview — Command Center" };

// SCREEN_PROPOSAL_PREVIEW (P-D12 / P-D15..P-D17 + PDF-01..15) as a deep-linkable route. This is the
// internal, read-only assembled preview of a proposal — the same page-for-page content the PDF and the
// client secure view render. Like every proposal screen it is a demo-presentation island backed by the
// client demo store, but the page is still gated exactly like every other dashboard route:
// resolveDashboardContext enforces Work Order F authentication and workspace authorization in live mode
// (allowedRoles admin/sales in routes.json) and is a no-op in demo — so the auth boundary is preserved
// and never bypassed.
export default async function ProposalPreviewPage({
  params,
}: {
  params: Promise<{ proposalId: string }>;
}) {
  const { proposalId } = await params;
  await resolveDashboardContext(`/dashboard/proposals/${proposalId}/preview`);
  return <ProposalPreviewView proposalId={proposalId} />;
}
