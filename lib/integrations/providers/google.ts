import "server-only";
import { OAuth2Client } from "google-auth-library";
import { publicOrigin } from "@/lib/routing/public-origin";
import type {
  ConnectionInspection,
  ExchangeResult,
  IntegrationProviderAdapter,
  ProviderCredentials,
  RefreshResult,
} from "../provider";
import { IntegrationProviderError } from "../provider";

// Real Google OAuth (Master Goal Phase 2.5). Reuses the reserved "google_calendar"
// identifier as the single canonical Google identity connection — Calendar is this
// connection's first real future consumer, and Gmail can extend the same row via
// incremental authorization (re-run the auth request with added scopes against the
// existing connection) rather than force a second, redundant Google sign-in.
//
// Only identity scopes here — see GOOGLE_SCOPES. Calendar/Gmail scopes are Phase
// 3/4's job, added later by requesting them against this same OAuth2Client, not by
// building a second adapter or connection.

export const GOOGLE_SCOPES = ["openid", "email", "profile"] as const;

/** The one canonical Google redirect URI — same route Google calls back on in both
 *  local dev and production, resolved from publicOrigin() rather than the request's
 *  own host so it can never be steered by a forwarded header. */
export function googleRedirectUri(): string {
  return `${publicOrigin()}/api/dashboard/integrations/connections/callback`;
}

function requireCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new IntegrationProviderError("google_calendar", "Google OAuth is not configured on this server.");
  }
  return { clientId, clientSecret };
}

function client(): OAuth2Client {
  const { clientId, clientSecret } = requireCredentials();
  return new OAuth2Client(clientId, clientSecret, googleRedirectUri());
}

/** Fails closed (throws IntegrationProviderError) the same way exchangeCode does if
 *  GOOGLE_OAUTH_CLIENT_ID/SECRET are not configured — the connect route must not
 *  hand back an authorization URL built from an empty client id. */
export function buildGoogleAuthorizationUrl(state: string): string {
  return client().generateAuthUrl({
    access_type: "offline",
    scope: [...GOOGLE_SCOPES],
    state,
    include_granted_scopes: true,
  });
}

export class GoogleProviderAdapter implements IntegrationProviderAdapter {
  readonly id = "google_calendar" as const;

  async exchangeCode(code: string): Promise<ExchangeResult> {
    const { clientId } = requireCredentials();
    const oauth2Client = client();

    let tokens;
    try {
      ({ tokens } = await oauth2Client.getToken(code));
    } catch (error) {
      throw new IntegrationProviderError(
        "google_calendar",
        error instanceof Error ? error.message : "Google did not accept that authorization code.",
      );
    }
    if (!tokens.access_token) {
      throw new IntegrationProviderError("google_calendar", "Google did not return an access token.");
    }
    if (!tokens.id_token) {
      throw new IntegrationProviderError("google_calendar", "Google did not return an identity token.");
    }

    let payload;
    try {
      const ticket = await oauth2Client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
      payload = ticket.getPayload();
    } catch (error) {
      throw new IntegrationProviderError(
        "google_calendar",
        error instanceof Error ? error.message : "Google's identity token could not be verified.",
      );
    }
    // sub, not email: a stable, provider-verified identity key that survives an email
    // change on the Google account — see Section 8.
    if (!payload?.sub) {
      throw new IntegrationProviderError("google_calendar", "Google did not return a verified account id.");
    }

    return {
      providerAccountId: payload.sub,
      // Only a Google-verified email is trusted as account metadata — an unverified
      // one is not stored at all rather than stored-but-flagged.
      providerAccountEmail: payload.email_verified ? (payload.email ?? undefined) : undefined,
      grantedScopes: tokens.scope ? tokens.scope.split(" ").filter(Boolean) : [...GOOGLE_SCOPES],
      credentials: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : undefined,
      },
    };
  }

  async refresh(credentials: ProviderCredentials): Promise<RefreshResult> {
    if (!credentials.refreshToken) {
      throw new IntegrationProviderError("google_calendar", "No refresh token on this connection.");
    }
    const oauth2Client = client();
    oauth2Client.setCredentials({ refresh_token: credentials.refreshToken });

    let refreshed;
    try {
      ({ credentials: refreshed } = await oauth2Client.refreshAccessToken());
    } catch (error) {
      throw new IntegrationProviderError(
        "google_calendar",
        error instanceof Error ? error.message : "Google could not refresh this connection.",
      );
    }
    if (!refreshed.access_token) {
      throw new IntegrationProviderError("google_calendar", "Google did not return a refreshed access token.");
    }
    return {
      credentials: {
        accessToken: refreshed.access_token,
        // Google does not always re-issue a refresh token on refresh — preserve the
        // one it was refreshed with, same rule store.ts applies on reconnect.
        refreshToken: refreshed.refresh_token ?? credentials.refreshToken,
        expiresAt: refreshed.expiry_date ? new Date(refreshed.expiry_date).toISOString() : undefined,
      },
    };
  }

  async revoke(credentials: ProviderCredentials): Promise<void> {
    const token = credentials.refreshToken ?? credentials.accessToken;
    if (!token) return;
    try {
      await client().revokeToken(token);
    } catch {
      // Best-effort — see the interface note: local disconnect must not depend on
      // Google's revoke endpoint succeeding or being reachable.
    }
  }

  async inspect(credentials: ProviderCredentials): Promise<ConnectionInspection> {
    if (!credentials.accessToken) {
      return { health: "error", detail: "No access token on this connection." };
    }
    if (credentials.expiresAt && new Date(credentials.expiresAt).getTime() <= Date.now()) {
      return { health: credentials.refreshToken ? "expired" : "revoked", detail: "Access token expired." };
    }
    return { health: "healthy" };
  }
}

export default function createGoogleProviderAdapter(): IntegrationProviderAdapter {
  return new GoogleProviderAdapter();
}
