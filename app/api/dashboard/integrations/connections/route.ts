// GET integrations/connections — list the caller's workspace's connections. Never
// includes credential_ciphertext: listConnections() selects a fixed safe-column list,
// and the authenticated-role client it uses is column-grant-blocked from that field
// even if the select list were ever widened by mistake.
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { IntegrationError, listConnections } from "@/lib/integrations/store";

export const runtime = "nodejs";

const NOT_AVAILABLE = "Integrations are not available.";

function statusForCode(code: IntegrationError["code"]): number {
  switch (code) {
    case "invalid":
      return 422;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "conflict":
      return 409;
    case "provider_error":
      return 502;
    case "unavailable":
      return 503;
  }
}

export async function GET(): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  try {
    const connections = await listConnections(context.workspaceId);
    return jsonOk({ connections }, correlationId);
  } catch (error) {
    if (error instanceof IntegrationError) {
      return jsonError(statusForCode(error.code), error.code, error.message, correlationId);
    }
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}
