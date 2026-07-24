import { resolveDashboardContext } from "@/lib/command-center/data";
import { CreateView } from "./create-view";

export const metadata = { title: "Create proposal — Command Center" };

// P-D02 create-proposal (source picker) as a deep-linkable route. Like the meeting screens
// this is a demo-presentation island, but the page is still gated exactly like every other
// dashboard route: resolveDashboardContext enforces Work Order F authentication and workspace
// authorization in live mode and is a no-op in demo — so the auth boundary is preserved and
// never bypassed.
export default async function ProposalCreatePage() {
  await resolveDashboardContext("/dashboard/proposals/new");
  return <CreateView />;
}
