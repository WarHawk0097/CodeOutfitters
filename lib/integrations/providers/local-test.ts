import "server-only";
import type {
  ConnectionInspection,
  ExchangeResult,
  IntegrationProviderAdapter,
  ProviderCredentials,
  RefreshResult,
} from "../provider";
import { IntegrationProviderError } from "../provider";

// The local/test provider Master Goal Phase 2 names explicitly ("local/test providers",
// not "Google"). Same role as lib/ai/provider/mock.ts: every Integration Foundation test
// and every local dev "connect" flow runs against this and nothing else — no network, no
// client secret, no real OAuth consent screen — while still exercising the full
// exchange → refresh → revoke → inspect lifecycle the adapter interface declares.
//
// "Code" here is not a real OAuth authorization code; it is a small pipe-delimited
// fixture string a test or a local /connect UI constructs directly:
//
//   accountId|email|scope1,scope2
//
// email and scopes are optional (`accountId`, `accountId|email`, or `accountId||scopes`
// all parse). There is nothing to keep secret about this format — it is the whole point
// that a local_test "credential" is not a real one.

const REFRESH_TOKEN_PREFIX = "local-test-refresh:";
const ACCESS_TOKEN_PREFIX = "local-test-access:";

function isRevokedToken(token: string): boolean {
  return token.startsWith("revoked:");
}

export class LocalTestProviderAdapter implements IntegrationProviderAdapter {
  readonly id = "local_test" as const;

  async exchangeCode(code: string): Promise<ExchangeResult> {
    const [accountId, email, scopeList] = code.split("|");
    if (!accountId || accountId.trim() === "") {
      throw new IntegrationProviderError("local_test", "local_test exchange code has no account id.");
    }
    const grantedScopes = scopeList ? scopeList.split(",").filter(Boolean) : ["local_test:profile"];
    return {
      providerAccountId: accountId,
      providerAccountEmail: email && email.trim() !== "" ? email : undefined,
      grantedScopes,
      credentials: {
        accessToken: `${ACCESS_TOKEN_PREFIX}${accountId}:1`,
        refreshToken: `${REFRESH_TOKEN_PREFIX}${accountId}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
    };
  }

  async refresh(credentials: ProviderCredentials): Promise<RefreshResult> {
    if (!credentials.refreshToken) {
      throw new IntegrationProviderError("local_test", "No refresh token on this connection.");
    }
    if (isRevokedToken(credentials.refreshToken)) {
      throw new IntegrationProviderError("local_test", "Refresh token has been revoked.");
    }
    // Deterministic "new" access token: the generation counter suffix increments so a
    // test can assert refresh actually produced a different credential rather than
    // echoing the old one back.
    const [, generationRaw] = credentials.accessToken.split(":").slice(-2);
    const generation = Number.parseInt(generationRaw ?? "1", 10) || 1;
    const accountId = credentials.refreshToken.slice(REFRESH_TOKEN_PREFIX.length);
    return {
      credentials: {
        accessToken: `${ACCESS_TOKEN_PREFIX}${accountId}:${generation + 1}`,
        refreshToken: credentials.refreshToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
    };
  }

  async revoke(_credentials: ProviderCredentials): Promise<void> {
    // Nothing to call — see the interface note on revoke() about not depending on a
    // network round-trip. store.ts's disconnect() clears local state regardless.
  }

  async inspect(credentials: ProviderCredentials): Promise<ConnectionInspection> {
    if (isRevokedToken(credentials.refreshToken ?? "")) {
      return { health: "revoked", detail: "Credential was revoked." };
    }
    if (credentials.expiresAt && new Date(credentials.expiresAt).getTime() <= Date.now()) {
      return { health: "expired", detail: "Access token expired." };
    }
    if (!credentials.accessToken) {
      return { health: "error", detail: "No access token on this connection." };
    }
    return { health: "healthy" };
  }
}

export default function createLocalTestProviderAdapter(): IntegrationProviderAdapter {
  return new LocalTestProviderAdapter();
}
