import { resolveDashboardContext } from "@/lib/command-center/data";
import { TranscriptView } from "./transcript-view";

export const metadata = { title: "Meeting transcript — Command Center" };

// M-D14/M-D15 transcript detail as a deep-linkable route. Like the prepare/live/review
// screens this is a demo-presentation island backed by the client demo store, but the
// page is still gated exactly like every other dashboard route: resolveDashboardContext
// enforces Work Order F authentication and workspace authorization in live mode and is a
// no-op in demo — so the transcript auth boundary is preserved and never bypassed.
export default async function MeetingTranscriptPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  await resolveDashboardContext(`/dashboard/meetings/${meetingId}/transcript`);
  return <TranscriptView meetingId={meetingId} />;
}
