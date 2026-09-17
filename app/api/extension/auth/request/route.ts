import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { createExtensionAuthRequest } from "@/lib/extension-auth/server";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const correlationId = crypto.randomUUID();
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (typeof body?.state !== "string" || body.state.length < 16 || body.state.length > 256 || typeof body.codeChallenge !== "string" || body.codeChallenge.length < 16 || body.codeChallenge.length > 256) return jsonError(422, "EXTENSION_AUTH_INVALID_REQUEST", "That authorization request is not valid.", correlationId);
  const created = await createExtensionAuthRequest({ state: body.state, codeChallenge: body.codeChallenge });
  return jsonOk(created, correlationId);
}
