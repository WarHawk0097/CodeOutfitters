import { resolveDashboardContext } from "@/lib/command-center/data";
import { LiveView } from "./live-view";

export const metadata = { title: "Live meeting — Command Center" };

// M-D03 live meeting workspace as a deep-linkable route. The meeting record lives in
// the client demo store (this is a demo-presentation island, like the Meetings
// directory and the prepare screen), but the page is still gated exactly like every
// other dashboard route: resolveDashboardContext enforces Work Order F authentication
// and workspace authorization in live mode and is a no-op in demo — so the live auth
// boundary is preserved and never bypassed.
export default async function MeetingLivePage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  await resolveDashboardContext(`/dashboard/meetings/${meetingId}/live`);
  return <LiveView meetingId={meetingId} />;
}
