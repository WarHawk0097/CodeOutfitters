import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { exchangeExtensionAuthRequest, ExtensionAuthExchangeError, safeExtensionAuthResponse } from "@/lib/extension-auth/server";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const correlationId = crypto.randomUUID();
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (typeof body?.requestId !== "string" || typeof body.verifier !== "string") return jsonError(422, "EXTENSION_AUTH_INVALID_REQUEST", "That authorization request is not valid.", correlationId);
  try {
    const exchanged = await exchangeExtensionAuthRequest({ requestId: body.requestId, verifier: body.verifier });
    return jsonOk(safeExtensionAuthResponse(exchanged), correlationId);
  } catch (error) {
    if (error instanceof ExtensionAuthExchangeError) {
      const status = error.code === "EXCHANGE_REQUEST_NOT_FOUND" ? 404 : error.code === "EXCHANGE_EXPIRED" ? 410 : error.code === "EXCHANGE_SESSION_CREATE_FAILED" ? 503 : 409;
      return jsonError(status, error.code, "The extension authorization could not be completed.", correlationId);
    }
    return jsonError(503, "EXCHANGE_SESSION_CREATE_FAILED", "The extension authorization could not be completed.", correlationId);
  }
}
