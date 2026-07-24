import { resolveDashboardContext } from "@/lib/command-center/data";
import { PrepareView } from "./prepare-view";

export const metadata = { title: "Prepare meeting — Command Center" };

// M-D02 pre-call preparation as a deep-linkable route. The meeting record itself
// lives in the client demo store (this screen is a demo-presentation island, like
// the Meetings directory), but the page is still gated exactly like every other
// dashboard route: resolveDashboardContext enforces Work Order F authentication and
// workspace authorization in live mode and is a no-op in demo mode — so the live
// auth boundary is preserved and never bypassed.
export default async function MeetingPreparePage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  await resolveDashboardContext(`/dashboard/meetings/${meetingId}/prepare`);
  return <PrepareView meetingId={meetingId} />;
}
