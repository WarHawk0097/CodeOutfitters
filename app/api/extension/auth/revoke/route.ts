import { jsonError, jsonOk } from "@/lib/integrations/api-response";
import { revokeExtensionSession } from "@/lib/extension-auth/server";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const correlationId = crypto.randomUUID();
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token) return jsonError(401, "unauthorized", "Sign in to continue.", correlationId);
  await revokeExtensionSession(token);
  return jsonOk({ revoked: true }, correlationId);
}
