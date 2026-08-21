// POST integrations/connections/connect — starts (and, for a provider with no real
// redirect step, completes) a connection. For local_test — the only local/test
// provider Phase 2 named — there is no OAuth redirect: the "code" is a fixture string
// a dev/test constructs directly (see lib/integrations/providers/local-test.ts).
// google_calendar is real Google OAuth (Master Goal Phase 2.5): this route only
// starts it — creates a CSRF-bound state and hands back Google's authorization URL,
// no code, no token material. gmail remains a reserved id with no adapter, so a
// connect attempt against it still fails closed with provider_error.
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { IntegrationError, connect } from "@/lib/integrations/store";
import { createOAuthState } from "@/lib/integrations/oauth-state";
import { buildGoogleAuthorizationUrl, isGoogleCapability } from "@/lib/integrations/providers/google";
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

  // Real, redirect-based OAuth: no code from the caller — this route only starts the
  // flow. The state nonce is bound to the CURRENT session's workspace/user, never a
  // client-supplied value, so the callback can prove later that a redirect belongs to
  // the request that started it (Section 5).
  if (candidate.provider === "google_calendar") {
    // Incremental authorization: an optional capability name (never a raw scope) adds
    // scopes to the SAME connection. Anything not in the allowlist is rejected outright
    // rather than ignored, so a caller cannot discover which strings are meaningful by
    // watching which ones succeed — and Gmail is not in the allowlist at all.
    if (candidate.capability !== undefined && !isGoogleCapability(candidate.capability)) {
      return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
        capability: "That is not a supported capability.",
      });
    }
    const capabilities = isGoogleCapability(candidate.capability) ? [candidate.capability] : [];
    try {
      const nonce = await createOAuthState({
        workspaceId: context.workspaceId,
        userId: context.userId,
        provider: "google_calendar",
      });
      const authorizationUrl = buildGoogleAuthorizationUrl(nonce, capabilities);
      return jsonOk({ authorizationUrl }, correlationId);
    } catch {
      // Owner has not configured GOOGLE_OAUTH_CLIENT_ID/SECRET yet, or state creation
      // failed — either way, fail closed rather than leak which one.
      return jsonError(503, "unavailable", NOT_AVAILABLE, correlationId);
    }
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
