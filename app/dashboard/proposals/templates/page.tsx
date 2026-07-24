import { resolveDashboardContext } from "@/lib/command-center/data";
import { TemplatesView } from "./templates-view";

export const metadata = { title: "Proposal templates — Command Center" };

// SCREEN_PROPOSAL_TEMPLATES (P-D02 / P-D14) as a deep-linkable route. Like the other proposal
// screens this is a demo-presentation island, but the page is still gated exactly like every
// other dashboard route: resolveDashboardContext enforces Work Order F authentication and
// workspace authorization in live mode and is a no-op in demo — so the auth boundary is
// preserved and never bypassed.
export default async function ProposalTemplatesPage() {
  await resolveDashboardContext("/dashboard/proposals/templates");
  return <TemplatesView />;
}
