// POST integrations/connections/callback — completes a connection started elsewhere.
// Exists as its own route because Section 8's contract names connect/start and
// callback as distinct steps (a real OAuth provider redirects here with its own
// code/state), even though Phase 2's only adapter (local_test) has no redirect and so
// this behaves identically to connect/start today. Kept as a thin, separate wrapper
// around the same store.connect() rather than merged into connect/route.ts, so a real
// provider's callback-specific handling (state/CSRF check, error query params) has
// somewhere to go without touching the connect/start route.
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { IntegrationError, connect } from "@/lib/integrations/store";
import type { IntegrationProviderId } from "@/lib/integrations/types";

export const runtime = "nodejs";

const NOT_AVAILABLE = "Integrations are not available.";
const PROVIDER_IDS: readonly IntegrationProviderId[] = ["local_test", "google_calendar", "gmail"];

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

export async function POST(request: Request): Promise<Response> {
  const correlationId = randomUUID();
  if (isDemoMode()) return jsonError(404, "not_found", NOT_AVAILABLE, correlationId);

  const context = await getDashboardContext();
  if (!context) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(422, "validation", "That request was not valid JSON.", correlationId);
  }
  if (typeof body !== "object" || body === null) {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId);
  }
  const candidate = body as Record<string, unknown>;

  if (!PROVIDER_IDS.includes(candidate.provider as IntegrationProviderId)) {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      provider: "That is not a supported provider.",
    });
  }
  if (typeof candidate.code !== "string" || candidate.code.trim() === "") {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      code: "A connect code is required.",
    });
  }

  try {
    const connection = await connect(context.workspaceId, candidate.provider as IntegrationProviderId, candidate.code);
    return jsonOk({ connection }, correlationId);
  } catch (error) {
    if (error instanceof IntegrationError) {
      return jsonError(statusForCode(error.code), error.code, error.message, correlationId);
    }
    return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
  }
}
