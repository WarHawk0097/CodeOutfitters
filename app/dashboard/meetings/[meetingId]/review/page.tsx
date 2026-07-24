import { resolveDashboardContext } from "@/lib/command-center/data";
import { ReviewView } from "./review-view";

export const metadata = { title: "Meeting review — Command Center" };

// M-D12/M-D13 post-call review as a deep-linkable route. Like the prepare and live
// screens this is a demo-presentation island backed by the client demo store, but the
// page is still gated exactly like every other dashboard route: resolveDashboardContext
// enforces Work Order F authentication and workspace authorization in live mode and is a
// no-op in demo — so the review auth boundary is preserved and never bypassed.
export default async function MeetingReviewPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  await resolveDashboardContext(`/dashboard/meetings/${meetingId}/review`);
  return <ReviewView meetingId={meetingId} />;
}
