import { getDashboardContext } from "@/lib/dashboard/server";
import { createAuthorizationCode, isAllowedExtensionRedirect } from "@/lib/extension-auth/server";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const redirectUri = url.searchParams.get("redirect_uri") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const codeChallenge = url.searchParams.get("code_challenge") ?? "";
  const expectedOrigin = new URL(request.url).origin;
  if (!state || state.length > 256 || !codeChallenge || codeChallenge.length > 256 || !isAllowedExtensionRedirect(redirectUri, expectedOrigin)) return new Response("Invalid extension authorization request.", { status: 400 });
  const context = await getDashboardContext();
  if (!context) {
    // launchWebAuthFlow must receive a real interactive page when the browser
    // has no dashboard session. A bare 401 is surfaced by Chromium as the
    // misleading "Authorization page could not be loaded" error. Returning
    // through the existing same-origin login flow lets the user authenticate
    // normally; after sign-in, login redirects back to this exact request.
    const login = new URL("/login", expectedOrigin);
    login.searchParams.set("returnTo", `${url.pathname}${url.search}`);
    return Response.redirect(login.toString(), 302);
  }
  const code = await createAuthorizationCode(context, { state, redirectUri, codeChallenge });
  const callback = new URL(redirectUri);
  callback.searchParams.set("code", code);
  callback.searchParams.set("state", state);
  callback.searchParams.set("status", "approved");
  return Response.redirect(callback.toString(), 302);
}
