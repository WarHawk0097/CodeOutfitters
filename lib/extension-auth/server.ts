import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getServiceClient } from "@/lib/integrations/store";

export const EXTENSION_AUTH_SCOPE = "meeting_capture" as const;
export const EXTENSION_AUTH_TTL_SECONDS = 30 * 24 * 60 * 60;
export const EXTENSION_AUTH_CODE_TTL_SECONDS = 5 * 60;
export const EXTENSION_AUTH_REQUEST_TTL_SECONDS = 3 * 60;

export type ExtensionAuthContext = { userId: string; workspaceId: string; name?: string; workspaceName?: string };

export type ExtensionAuthExchangeErrorCode =
  | "EXCHANGE_REQUEST_NOT_FOUND" | "EXCHANGE_NOT_AUTHORIZED" | "EXCHANGE_ALREADY_CONSUMED"
  | "EXCHANGE_EXPIRED" | "EXCHANGE_PKCE_MISMATCH" | "EXCHANGE_SESSION_CREATE_FAILED";

export class ExtensionAuthExchangeError extends Error {
  constructor(public readonly code: ExtensionAuthExchangeErrorCode) {
    super(code);
    this.name = "ExtensionAuthExchangeError";
  }
}

function digest(value: string): string { return createHash("sha256").update(value).digest("base64url"); }

function randomOpaqueId(): string { return randomBytes(32).toString("base64url"); }

export function createPkceChallenge(verifier: string): string { return digest(verifier); }

export function isValidPkce(verifier: string, challenge: string): boolean {
  if (!verifier || !challenge) return false;
  const actual = Buffer.from(createPkceChallenge(verifier));
  const expected = Buffer.from(challenge);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export type ExtensionAuthRequestStatus = "pending" | "authorized" | "denied" | "expired";

export async function createExtensionAuthRequest(input: { state: string; codeChallenge: string }): Promise<{ requestId: string; expiresAt: string }> {
  const requestId = randomOpaqueId();
  const expiresAt = new Date(Date.now() + EXTENSION_AUTH_REQUEST_TTL_SECONDS * 1000).toISOString();
  const { error } = await getServiceClient().from("extension_auth_requests").insert({
    request_hash: digest(requestId), state_hash: digest(input.state), code_challenge: input.codeChallenge,
    expires_at: expiresAt,
  });
  if (error) throw new Error("Extension authorization is unavailable.");
  return { requestId, expiresAt };
}

export async function getExtensionAuthRequestStatus(requestId: string): Promise<{ status: ExtensionAuthRequestStatus }> {
  const { data } = await getServiceClient().from("extension_auth_requests").select("status, expires_at").eq("request_hash", digest(requestId)).maybeSingle();
  if (!data) return { status: "expired" };
  if (Date.parse(data.expires_at) <= Date.now() && data.status === "pending") return { status: "expired" };
  return { status: data.status as ExtensionAuthRequestStatus };
}

export async function authorizeExtensionAuthRequest(context: ExtensionAuthContext, input: { requestId: string; state: string; codeChallenge: string }): Promise<boolean> {
  const supabase = getServiceClient();
  const { data: row } = await supabase.from("extension_auth_requests").select("id, state_hash, code_challenge, status, expires_at").eq("request_hash", digest(input.requestId)).is("consumed_at", null).maybeSingle();
  if (!row || row.status !== "pending" || Date.parse(row.expires_at) <= Date.now() || row.state_hash !== digest(input.state) || row.code_challenge !== input.codeChallenge) return false;
  const { data } = await supabase.from("extension_auth_requests").update({
    status: "authorized", user_id: context.userId, workspace_id: context.workspaceId,
    account_name: context.name ?? null, workspace_name: context.workspaceName ?? null, authorized_at: new Date().toISOString(),
  }).eq("id", row.id).eq("status", "pending").is("consumed_at", null).select("id").maybeSingle();
  return Boolean(data);
}

export async function exchangeExtensionAuthRequest(input: { requestId: string; verifier: string }): Promise<{ accessToken: string; expiresAt: string; accountName?: string; workspaceName?: string }> {
  if (!input.requestId || input.requestId.length > 256 || !input.verifier) throw new ExtensionAuthExchangeError("EXCHANGE_REQUEST_NOT_FOUND");
  const supabase = getServiceClient();
  const { data: row, error: lookupError } = await supabase.from("extension_auth_requests").select("id, user_id, workspace_id, account_name, workspace_name, code_challenge, status, expires_at, consumed_at").eq("request_hash", digest(input.requestId)).maybeSingle();
  if (lookupError) throw new ExtensionAuthExchangeError("EXCHANGE_REQUEST_NOT_FOUND");
  if (!row) throw new ExtensionAuthExchangeError("EXCHANGE_REQUEST_NOT_FOUND");
  if (row.consumed_at) throw new ExtensionAuthExchangeError("EXCHANGE_ALREADY_CONSUMED");
  if (Date.parse(row.expires_at) <= Date.now()) throw new ExtensionAuthExchangeError("EXCHANGE_EXPIRED");
  if (row.status !== "authorized") throw new ExtensionAuthExchangeError("EXCHANGE_NOT_AUTHORIZED");
  if (!isValidPkce(input.verifier, row.code_challenge)) throw new ExtensionAuthExchangeError("EXCHANGE_PKCE_MISMATCH");
  const accessToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + EXTENSION_AUTH_TTL_SECONDS * 1000).toISOString();
  const { error: sessionError } = await supabase.from("extension_auth_sessions").insert({ token_hash: digest(accessToken), user_id: row.user_id, workspace_id: row.workspace_id, scope: EXTENSION_AUTH_SCOPE, expires_at: expiresAt });
  if (sessionError) throw new ExtensionAuthExchangeError("EXCHANGE_SESSION_CREATE_FAILED");
  const { data: consumed, error: consumeError } = await supabase.from("extension_auth_requests").update({ consumed_at: new Date().toISOString() }).eq("id", row.id).eq("status", "authorized").is("consumed_at", null).select("id").maybeSingle();
  if (consumeError || !consumed) {
    await supabase.from("extension_auth_sessions").delete().eq("token_hash", digest(accessToken));
    throw new ExtensionAuthExchangeError("EXCHANGE_ALREADY_CONSUMED");
  }
  return { accessToken, expiresAt, accountName: row.account_name ?? undefined, workspaceName: row.workspace_name ?? undefined };
}

export function isAllowedExtensionRedirect(raw: string, expectedOrigin: string): boolean {
  try {
    const url = new URL(raw);
    return (url.protocol === "https:" && url.hostname.endsWith(".chromiumapp.org") && url.pathname.startsWith("/extension-auth")) ||
      (url.origin === expectedOrigin && url.pathname === "/extension-auth/callback");
  } catch { return false; }
}

export async function createAuthorizationCode(context: ExtensionAuthContext, input: { state: string; redirectUri: string; codeChallenge: string }): Promise<string> {
  const code = randomBytes(32).toString("base64url");
  const supabase = getServiceClient();
  const { error } = await supabase.from("extension_auth_codes").insert({
    code_hash: digest(code), user_id: context.userId, workspace_id: context.workspaceId,
    state: input.state, redirect_uri: input.redirectUri, code_challenge: input.codeChallenge,
    expires_at: new Date(Date.now() + EXTENSION_AUTH_CODE_TTL_SECONDS * 1000).toISOString(),
  });
  if (error) throw new Error("Extension authorization is unavailable.");
  return code;
}

export async function exchangeAuthorizationCode(input: { code: string; verifier: string; redirectUri: string }): Promise<{ accessToken: string; expiresAt: string; userId: string; workspaceId: string } | null> {
  if (!input.code || input.code.length > 256 || !input.verifier || !input.redirectUri) return null;
  const supabase = getServiceClient();
  const { data: row } = await supabase.from("extension_auth_codes").select("id, user_id, workspace_id, code_challenge, redirect_uri, expires_at").eq("code_hash", digest(input.code)).is("consumed_at", null).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (!row || row.redirect_uri !== input.redirectUri || !isValidPkce(input.verifier, row.code_challenge)) return null;
  const { data: consumed } = await supabase.from("extension_auth_codes").update({ consumed_at: new Date().toISOString() }).eq("id", row.id).is("consumed_at", null).select("id").maybeSingle();
  if (!consumed) return null;
  const accessToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + EXTENSION_AUTH_TTL_SECONDS * 1000).toISOString();
  const { error } = await supabase.from("extension_auth_sessions").insert({ token_hash: digest(accessToken), user_id: row.user_id, workspace_id: row.workspace_id, scope: EXTENSION_AUTH_SCOPE, expires_at: expiresAt });
  if (error) throw new Error("Extension authorization is unavailable.");
  return { accessToken, expiresAt, userId: row.user_id, workspaceId: row.workspace_id };
}

export async function resolveExtensionSession(accessToken: string): Promise<ExtensionAuthContext | null> {
  if (!accessToken || accessToken.length > 256) return null;
  const supabase = getServiceClient();
  const { data } = await supabase.from("extension_auth_sessions").select("user_id, workspace_id").eq("token_hash", digest(accessToken)).eq("scope", EXTENSION_AUTH_SCOPE).is("revoked_at", null).gt("expires_at", new Date().toISOString()).maybeSingle();
  return data ? { userId: data.user_id, workspaceId: data.workspace_id } : null;
}

export async function revokeExtensionSession(accessToken: string): Promise<void> {
  if (!accessToken) return;
  const supabase = getServiceClient();
  await supabase.from("extension_auth_sessions").update({ revoked_at: new Date().toISOString() }).eq("token_hash", digest(accessToken)).is("revoked_at", null);
}

export function safeExtensionAuthResponse(input: { accessToken: string; expiresAt: string; accountName?: string; workspaceName?: string }) {
  return { accessToken: input.accessToken, expiresAt: input.expiresAt, ...(input.accountName ? { accountName: input.accountName } : {}), ...(input.workspaceName ? { workspaceName: input.workspaceName } : {}), scope: EXTENSION_AUTH_SCOPE };
}
