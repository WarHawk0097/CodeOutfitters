// integrations/connections/callback — two distinct handlers on one route:
//
// POST completes a connection started with no real redirect step (local_test's
// fixture-code flow). It explicitly rejects google_calendar — that provider's state
// mechanism (see GET below) is the only valid way to complete it; a POST with a
// caller-supplied code would bypass the CSRF/state check entirely.
//
// GET is Google's real OAuth redirect: ?code&state, or ?error on denial. It never
// renders a raw provider error or token to the browser — every outcome is a redirect
// to the settings UI carrying a short, safe status code.
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { IntegrationError, connect } from "@/lib/integrations/store";
import { consumeOAuthState } from "@/lib/integrations/oauth-state";
import { publicOrigin } from "@/lib/routing/public-origin";
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
  if (candidate.provider === "google_calendar") {
    // Real OAuth for this provider only completes through GET's state/code exchange
    // below — a caller-supplied code here would skip the CSRF/state check entirely.
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

// Safe status codes only — never a raw provider error string or any token material.
function redirectToSettings(status: "connected" | "error", detail?: string): Response {
  const url = new URL("/dashboard/settings", publicOrigin());
  url.searchParams.set("google", status);
  if (detail) url.searchParams.set("google_detail", detail);
  return Response.redirect(url.toString(), 302);
}

export async function GET(request: Request): Promise<Response> {
  if (isDemoMode()) return redirectToSettings("error", "not_available");

  const url = new URL(request.url);
  const providerError = url.searchParams.get("error");
  if (providerError) {
    return redirectToSettings("error", providerError === "access_denied" ? "access_denied" : "provider_error");
  }

  const stateParam = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!stateParam || !code) {
    return redirectToSettings("error", "invalid_request");
  }

  const consumed = await consumeOAuthState(stateParam, "google_calendar");
  if (!consumed) {
    return redirectToSettings("error", "invalid_state");
  }

  // Defense in depth beyond the state row itself: the session completing the flow
  // must still be the same workspace/user that started it.
  const context = await getDashboardContext();
  if (!context || context.workspaceId !== consumed.workspaceId || context.userId !== consumed.userId) {
    return redirectToSettings("error", "session_mismatch");
  }

  try {
    await connect(context.workspaceId, "google_calendar", code);
  } catch {
    return redirectToSettings("error", "exchange_failed");
  }

  return redirectToSettings("connected");
}
