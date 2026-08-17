// DELETE integrations/connections/[id] — disconnect. Always ends with the connection's
// status at 'disconnected' and its credential cleared, whether or not the provider's
// own revoke call succeeded — see store.ts's disconnect().
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { IntegrationError, disconnect } from "@/lib/integrations/store";

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

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  const { id } = await params;
  if (!id) return jsonError(422, "validation", "A connection id is required.", correlationId);

  try {
    const connection = await disconnect(context.workspaceId, id);
    return jsonOk({ connection }, correlationId);
  } catch (error) {
    if (error instanceof IntegrationError) {
      return jsonError(statusForCode(error.code), error.code, error.message, correlationId);
    }
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}
