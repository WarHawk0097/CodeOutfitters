import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { getExtensionAuthRequestStatus } from "@/lib/extension-auth/server";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const correlationId = crypto.randomUUID();
  const requestId = new URL(request.url).searchParams.get("requestId") ?? "";
  if (!requestId || requestId.length > 256) return jsonError(422, "EXTENSION_AUTH_INVALID_REQUEST", "That authorization request is not valid.", correlationId);
  return jsonOk(await getExtensionAuthRequestStatus(requestId), correlationId);
}
