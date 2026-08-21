// POST meetings/[id]/sync — pulls the conference record/artifacts/transcript from the
// provider and writes an honest status. Runs the service-role orchestration in
// lib/meetings/sync.ts; the session client never touches sync-only columns directly.
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { getMeeting } from "@/lib/meetings/store";
import { syncMeeting } from "@/lib/meetings/sync";

export const runtime = "nodejs";

const NOT_AVAILABLE = "Meetings are not available.";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  const { id } = await params;

  // Confirm the meeting exists and belongs to this workspace under RLS before handing
  // off to the service-role sync — the same "session client checks, service-role client
  // acts" split as lib/integrations/store.ts's refreshConnection.
  const before = await getMeeting(context.workspaceId, id);
  if (!before) return jsonError(404, "not_found", "That meeting does not exist.", correlationId);

  await syncMeeting(context.workspaceId, id);

  const meeting = await getMeeting(context.workspaceId, id);
  return jsonOk({ meeting }, correlationId);
}
