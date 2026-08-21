// GET meetings/[id] — one meeting plus its artifacts and (for the first transcript
// artifact) transcript entries. PATCH meetings/[id] — the two fields authenticated
// actually has an UPDATE grant on; see lib/meetings/store.ts's updateMeeting header.
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import {
  MeetingError,
  getMeeting,
  getTranscriptForArtifact,
  listArtifacts,
  listTranscriptEntries,
  updateMeeting,
} from "@/lib/meetings/store";

export const runtime = "nodejs";

const NOT_AVAILABLE = "Meetings are not available.";

function statusForCode(code: MeetingError["code"]): number {
  switch (code) {
    case "invalid":
      return 422;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "conflict":
      return 409;
  }
}

const UpdateMeetingSchema = z.object({
  title: z.string().trim().min(1).nullable().optional(),
  leadId: z.string().uuid().nullable().optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  const { id } = await params;

  try {
    const meeting = await getMeeting(context.workspaceId, id);
    if (!meeting) return jsonError(404, "not_found", "That meeting does not exist.", correlationId);

    const artifacts = await listArtifacts(context.workspaceId, id);
    const transcriptArtifact = artifacts.find((a) => a.artifactType === "transcript") ?? null;
    const transcript = transcriptArtifact ? await getTranscriptForArtifact(context.workspaceId, transcriptArtifact.id) : null;
    const entries = transcript ? await listTranscriptEntries(context.workspaceId, transcript.id) : [];

    return jsonOk({ meeting, artifacts, transcript, entries }, correlationId);
  } catch (error) {
    if (error instanceof MeetingError) {
      return jsonError(statusForCode(error.code), error.code, error.message, correlationId);
    }
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateMeetingSchema.safeParse(body);
  if (!parsed.success) return jsonError(422, "invalid", "That request is not valid.", correlationId);

  try {
    const meeting = await updateMeeting(context.workspaceId, id, parsed.data);
    return jsonOk({ meeting }, correlationId);
  } catch (error) {
    if (error instanceof MeetingError) {
      return jsonError(statusForCode(error.code), error.code, error.message, correlationId);
    }
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}
