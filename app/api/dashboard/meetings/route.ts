// GET meetings — list the caller's workspace's meetings, optionally filtered to one
// Lead. POST meetings — link an existing Google Meet space (never creates one; see
// lib/meetings/provider.ts's capabilities.conferenceCreation).
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { MeetingError, linkMeeting, listMeetings } from "@/lib/meetings/store";

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

const LinkMeetingSchema = z.object({
  provider: z.literal("google_meet"),
  connectionId: z.string().uuid(),
  providerSpaceId: z.string().trim().min(1),
  leadId: z.string().uuid().optional(),
  title: z.string().trim().min(1).optional(),
});

export async function GET(request: Request): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  const leadId = new URL(request.url).searchParams.get("leadId") ?? undefined;

  try {
    const meetings = await listMeetings(context.workspaceId, leadId);
    return jsonOk({ meetings }, correlationId);
  } catch (error) {
    if (error instanceof MeetingError) {
      return jsonError(statusForCode(error.code), error.code, error.message, correlationId);
    }
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}

export async function POST(request: Request): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  const body = await request.json().catch(() => null);
  const parsed = LinkMeetingSchema.safeParse(body);
  if (!parsed.success) return jsonError(422, "invalid", "That request is not valid.", correlationId);

  try {
    const meeting = await linkMeeting(context.workspaceId, parsed.data);
    return jsonOk({ meeting }, correlationId);
  } catch (error) {
    if (error instanceof MeetingError) {
      return jsonError(statusForCode(error.code), error.code, error.message, correlationId);
    }
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}
