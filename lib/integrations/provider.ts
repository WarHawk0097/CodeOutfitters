import "server-only";
import type { IntegrationProviderId } from "./types";

// The provider contract. Same role as lib/ai/provider/types.ts's AIProvider: the seam
// that keeps Calendar and Email from each writing their own OAuth/token-refresh logic.
// Nothing above this file may branch on which vendor is in use — a fifth provider means
// one module satisfying IntegrationProviderAdapter and one registry.ts line.

/** Secret material, in memory only — never a return type, never a logged value, never
 *  a field on IntegrationConnection. The only two places a value of this type may exist
 *  are inside an adapter method and as the plaintext argument to encryptCredential(). */
export type ProviderCredentials = {
  accessToken: string;
  refreshToken?: string;
  /** Provider-reported expiry, when the provider gives one. Advisory for a health
   *  check; the source of truth for "can I still use this" is always a live call. */
  expiresAt?: string;
};

export type ExchangeResult = {
  providerAccountId: string;
  providerAccountEmail?: string;
  grantedScopes: readonly string[];
  credentials: ProviderCredentials;
};

export type RefreshResult = {
  credentials: ProviderCredentials;
};

/** What "is this connection still good" means, independent of the stored status —
 *  the adapter is the one place that can actually ask the provider. */
export type ConnectionHealth = "healthy" | "expired" | "revoked" | "error";

export type ConnectionInspection = {
  health: ConnectionHealth;
  /** Safe to store in integration_connections.last_error / show in a UI — never a raw
   *  provider response body, which can echo request parameters back. */
  detail?: string;
};

export class IntegrationProviderError extends Error {
  constructor(
    public readonly provider: IntegrationProviderId,
    message: string,
  ) {
    super(message);
    this.name = "IntegrationProviderError";
  }
}

export interface IntegrationProviderAdapter {
  readonly id: IntegrationProviderId;

  /** Turns whatever the connect flow collected (an authorization code for a real OAuth
   *  provider; a fixture id for local_test) into a connected account + first credential
   *  set. Never called with anything from a request body the caller hasn't itself
   *  produced — see lib/integrations/store.ts's beginConnect/completeConnect split. */
  exchangeCode(code: string): Promise<ExchangeResult>;

  /** Trades a refresh token for a new access token. Adapters that received no refresh
   *  token (nothing to refresh) throw IntegrationProviderError rather than returning a
   *  reused access token — a caller must not be able to mistake "no-op" for "renewed". */
  refresh(credentials: ProviderCredentials): Promise<RefreshResult>;

  /** Best-effort tells the provider the credential is no longer wanted. Adapters must
   *  still succeed (from the caller's point of view) if the provider is unreachable —
   *  local state moving to 'disconnected' must never depend on a network call finishing;
   *  see store.ts's disconnect(), which clears the local credential regardless. */
  revoke(credentials: ProviderCredentials): Promise<void>;

  /** A cheap, read-only "is this still usable" check — not a full API call to Calendar
   *  or Gmail, which Phase 2 does not implement. */
  inspect(credentials: ProviderCredentials): Promise<ConnectionInspection>;
}
