import "server-only";
import { randomBytes } from "node:crypto";
import { getServiceClient } from "./store";
import type { IntegrationProviderId } from "./types";

// CSRF/state for real (redirect-based) OAuth providers — see
// supabase/migrations/20260819000000_oauth_states.sql. Only the service-role client
// ever touches this table; a nonce lookup miss (wrong, reused, or expired) IS the
// rejection — there is no signature to verify separately.

const STATE_TTL_MS = 10 * 60 * 1000;

export type OAuthStateContext = {
  workspaceId: string;
  userId: string;
  provider: IntegrationProviderId;
};

export async function createOAuthState(ctx: OAuthStateContext): Promise<string> {
  const nonce = randomBytes(32).toString("base64url");
  const supabase = getServiceClient();
  const { error } = await supabase.from("oauth_states").insert({
    workspace_id: ctx.workspaceId,
    user_id: ctx.userId,
    provider: ctx.provider,
    nonce,
    expires_at: new Date(Date.now() + STATE_TTL_MS).toISOString(),
  });
  if (error) throw new Error("Could not start the authorization request.");
  return nonce;
}

export type ConsumedOAuthState = {
  workspaceId: string;
  userId: string;
};

// Single atomic UPDATE ... WHERE consumed_at IS NULL AND expires_at > now() makes a
// second use of the same nonce, or a use after expiry, find no row rather than race.
export async function consumeOAuthState(
  nonce: string,
  provider: IntegrationProviderId,
): Promise<ConsumedOAuthState | null> {
  if (!nonce) return null;
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("oauth_states")
    .update({ consumed_at: new Date().toISOString() })
    .eq("nonce", nonce)
    .eq("provider", provider)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("workspace_id, user_id")
    .maybeSingle();
  if (error || !data) return null;
  return { workspaceId: data.workspace_id as string, userId: data.user_id as string };
}
