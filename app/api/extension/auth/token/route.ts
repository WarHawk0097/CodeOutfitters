import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { exchangeAuthorizationCode, safeExtensionAuthResponse } from "@/lib/extension-auth/server";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const correlationId = crypto.randomUUID();
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (typeof body?.code !== "string" || typeof body.verifier !== "string" || typeof body.redirectUri !== "string") return jsonError(422, "EXTENSION_AUTH_INVALID_REQUEST", "That authorization request is not valid.", correlationId);
  const exchanged = await exchangeAuthorizationCode({ code: body.code, verifier: body.verifier, redirectUri: body.redirectUri });
  if (!exchanged) return jsonError(401, "EXTENSION_AUTH_CODE_INVALID", "That authorization code is invalid or expired.", correlationId);
  return jsonOk(safeExtensionAuthResponse(exchanged), correlationId);
}
