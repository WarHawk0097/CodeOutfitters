import { getDashboardContext } from "@/lib/dashboard/server";
import { authorizeExtensionAuthRequest } from "@/lib/extension-auth/server";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const requestId = typeof body?.requestId === "string" ? body.requestId : "";
  const state = typeof body?.state === "string" ? body.state : "";
  const codeChallenge = typeof body?.codeChallenge === "string" ? body.codeChallenge : "";
  if (!requestId || !state || !codeChallenge) return new Response("Invalid authorization request.", { status: 422 });
  const context = await getDashboardContext();
  if (!context) return Response.redirect(new URL(`/login?returnTo=${encodeURIComponent(`/extension-auth?requestId=${encodeURIComponent(requestId)}&state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(codeChallenge)}`)}`, request.url), 303);
  const authorized = await authorizeExtensionAuthRequest(context, { requestId, state, codeChallenge });
  if (!authorized) return new Response("Authorization request expired or invalid.", { status: 409 });
  const page = new URL("/extension-auth", request.url);
  page.searchParams.set("requestId", requestId);
  page.searchParams.set("state", state);
  page.searchParams.set("code_challenge", codeChallenge);
  page.searchParams.set("approved", "1");
  return Response.redirect(page.toString(), 303);
}
