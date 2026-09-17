import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/command-center/mode";
import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { getDashboardContext } from "@/lib/dashboard/server";
import { issueMeetingCaptureToken } from "@/lib/supabase/meeting-capture-token";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", "Meetings are not available.", correlationId);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return jsonError(403, "forbidden", "Capture handoff is not available from this origin.", correlationId);
  }
  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);
  const issued = issueMeetingCaptureToken(context);
  if (!issued) return jsonError(503, "unavailable", "Capture authentication is not configured.", correlationId);
  const response = jsonOk(issued, correlationId);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
