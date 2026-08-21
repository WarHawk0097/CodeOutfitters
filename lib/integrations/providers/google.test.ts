import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { IntegrationProviderError } from "../provider";
import {
  GoogleProviderAdapter,
  GOOGLE_MEET_SCOPES,
  GOOGLE_SCOPES,
  buildGoogleAuthorizationUrl,
  hasGoogleCapability,
  isGoogleCapability,
} from "./google";

// Mocked google-auth-library only — no real Google call anywhere in this suite (Section
// 19: "mocked tests ... no real Google calls"). One shared mock instance per test lets
// each test configure exactly the OAuth2Client behavior it needs.
const mockClient = {
  generateAuthUrl: vi.fn(),
  getToken: vi.fn(),
  verifyIdToken: vi.fn(),
  setCredentials: vi.fn(),
  refreshAccessToken: vi.fn(),
  revokeToken: vi.fn(),
};

vi.mock("google-auth-library", () => ({
  OAuth2Client: vi.fn().mockImplementation(() => mockClient),
}));

const ORIGINAL_ENV = { ...process.env };

describe("integrations/providers/google", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_OAUTH_CLIENT_ID = "test-client-id";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "test-client-secret";
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("A: builds a Google authorization URL via OAuth2Client.generateAuthUrl", async () => {
    mockClient.generateAuthUrl.mockReturnValue("https://accounts.google.com/o/oauth2/v2/auth?mock=1");

    const url = buildGoogleAuthorizationUrl("nonce-abc");

    expect(url).toBe("https://accounts.google.com/o/oauth2/v2/auth?mock=1");
    expect(mockClient.generateAuthUrl).toHaveBeenCalledWith(
      expect.objectContaining({ state: "nonce-abc", access_type: "offline" }),
    );
  });

  it("B: requests only minimum identity scopes — no Calendar or Gmail scope", async () => {
    mockClient.generateAuthUrl.mockReturnValue("https://accounts.google.com/mock");

    buildGoogleAuthorizationUrl("nonce-abc");

    expect(GOOGLE_SCOPES).toEqual(["openid", "email", "profile"]);
    const call = mockClient.generateAuthUrl.mock.calls[0]![0];
    expect(call.scope).toEqual(["openid", "email", "profile"]);
    expect(call.scope.join(" ")).not.toMatch(/calendar|gmail/i);
  });

  it("R: buildGoogleAuthorizationUrl fails closed when client credentials are missing", async () => {
    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    expect(() => buildGoogleAuthorizationUrl("nonce-abc")).toThrow(IntegrationProviderError);
    expect(mockClient.generateAuthUrl).not.toHaveBeenCalled();
  });

  it("G: exchangeCode success stores the Google sub as provider identity (I) with granted scopes", async () => {
    mockClient.getToken.mockResolvedValue({
      tokens: {
        access_token: "access-1",
        refresh_token: "refresh-1",
        id_token: "id-token-1",
        scope: "openid email profile",
        expiry_date: Date.parse("2026-08-17T12:00:00.000Z"),
      },
    });
    mockClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: "google-sub-123", email: "user@example.test", email_verified: true }),
    });

    const result = await new GoogleProviderAdapter().exchangeCode("auth-code-1");

    expect(result.providerAccountId).toBe("google-sub-123");
    expect(result.providerAccountEmail).toBe("user@example.test");
    expect(result.grantedScopes).toEqual(["openid", "email", "profile"]);
    expect(result.credentials).toEqual({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      expiresAt: new Date(Date.parse("2026-08-17T12:00:00.000Z")).toISOString(),
    });
    expect(mockClient.verifyIdToken).toHaveBeenCalledWith(
      expect.objectContaining({ idToken: "id-token-1", audience: "test-client-id" }),
    );
  });

  it("does not trust an unverified email — stores no email at all", async () => {
    mockClient.getToken.mockResolvedValue({
      tokens: { access_token: "access-1", id_token: "id-token-1" },
    });
    mockClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: "google-sub-123", email: "unverified@example.test", email_verified: false }),
    });

    const result = await new GoogleProviderAdapter().exchangeCode("auth-code-1");

    expect(result.providerAccountEmail).toBeUndefined();
  });

  it("H: exchangeCode failure (code rejected by Google) is handled safely", async () => {
    mockClient.getToken.mockRejectedValue(new Error("invalid_grant: raw provider detail"));

    await expect(new GoogleProviderAdapter().exchangeCode("bad-code")).rejects.toThrow(IntegrationProviderError);
  });

  it("exchangeCode fails closed when Google returns no id_token to verify identity from", async () => {
    mockClient.getToken.mockResolvedValue({ tokens: { access_token: "access-1" } });

    await expect(new GoogleProviderAdapter().exchangeCode("auth-code-1")).rejects.toThrow(IntegrationProviderError);
    expect(mockClient.verifyIdToken).not.toHaveBeenCalled();
  });

  it("R: exchangeCode fails closed when client credentials are missing", async () => {
    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    await expect(new GoogleProviderAdapter().exchangeCode("auth-code-1")).rejects.toThrow(IntegrationProviderError);
    expect(mockClient.getToken).not.toHaveBeenCalled();
  });

  it("M: refresh success returns a new access token", async () => {
    mockClient.refreshAccessToken.mockResolvedValue({
      credentials: { access_token: "access-2", expiry_date: Date.parse("2026-08-17T13:00:00.000Z") },
    });

    const result = await new GoogleProviderAdapter().refresh({ accessToken: "access-1", refreshToken: "refresh-1" });

    expect(mockClient.setCredentials).toHaveBeenCalledWith({ refresh_token: "refresh-1" });
    expect(result.credentials.accessToken).toBe("access-2");
  });

  it("L: refresh preserves the existing refresh token when Google omits a new one", async () => {
    mockClient.refreshAccessToken.mockResolvedValue({ credentials: { access_token: "access-2" } });

    const result = await new GoogleProviderAdapter().refresh({ accessToken: "access-1", refreshToken: "refresh-1" });

    expect(result.credentials.refreshToken).toBe("refresh-1");
  });

  it("N: refresh failure is handled safely, not thrown as a raw provider error", async () => {
    mockClient.refreshAccessToken.mockRejectedValue(new Error("invalid_grant: raw provider detail"));

    await expect(
      new GoogleProviderAdapter().refresh({ accessToken: "access-1", refreshToken: "refresh-1" }),
    ).rejects.toThrow(IntegrationProviderError);
  });

  it("refresh throws when there is no refresh token to use", async () => {

    await expect(new GoogleProviderAdapter().refresh({ accessToken: "access-1" })).rejects.toThrow(
      IntegrationProviderError,
    );
    expect(mockClient.refreshAccessToken).not.toHaveBeenCalled();
  });

  it("O: revoke calls Google's revoke endpoint with the refresh token", async () => {
    mockClient.revokeToken.mockResolvedValue({});

    await new GoogleProviderAdapter().revoke({ accessToken: "access-1", refreshToken: "refresh-1" });

    expect(mockClient.revokeToken).toHaveBeenCalledWith("refresh-1");
  });

  it("O: revoke does not throw when Google's revoke call fails", async () => {
    mockClient.revokeToken.mockRejectedValue(new Error("network error"));

    await expect(
      new GoogleProviderAdapter().revoke({ accessToken: "access-1", refreshToken: "refresh-1" }),
    ).resolves.toBeUndefined();
  });
});

// Incremental authorization. A capability is an extra permission asked for against the
// SAME Google account — the account is never disconnected first, and the stored refresh
// token survives (lib/integrations/store.ts's connect()). Everything below is about not
// asking for more than the capability needs, and not claiming one that was not granted.
describe("integrations/providers/google — incremental authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_OAUTH_CLIENT_ID = "test-client-id";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "test-client-secret";
    mockClient.generateAuthUrl.mockReturnValue("https://accounts.google.com/mock");
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("asks for the identity scopes only when no capability is named", () => {
    buildGoogleAuthorizationUrl("nonce");
    const call = mockClient.generateAuthUrl.mock.calls[0]![0];
    expect(call.scope).toEqual([...GOOGLE_SCOPES]);
    // No extra scopes means no re-consent prompt for someone who is only signing in.
    expect(call.prompt).toBeUndefined();
  });

  it("adds the Meet scope — and nothing else — for the meet capability", () => {
    buildGoogleAuthorizationUrl("nonce", ["meet"]);
    const call = mockClient.generateAuthUrl.mock.calls[0]![0];
    expect(call.scope).toEqual([...GOOGLE_SCOPES, "https://www.googleapis.com/auth/meetings.space.readonly"]);
    expect(GOOGLE_MEET_SCOPES).toEqual(["https://www.googleapis.com/auth/meetings.space.readonly"]);
  });

  it("never requests a Gmail scope, or the Meet scope that could create a space", () => {
    buildGoogleAuthorizationUrl("nonce", ["meet"]);
    const scopes: string[] = mockClient.generateAuthUrl.mock.calls[0]![0].scope;
    expect(scopes.join(" ")).not.toMatch(/gmail|mail\.google/i);
    // meetings.space.created only works for spaces this app created. Requesting it would
    // be both useless here and a wider grant than reading needs.
    expect(scopes).not.toContain("https://www.googleapis.com/auth/meetings.space.created");
  });

  it("keeps previously granted scopes and forces a consent screen for the new one", () => {
    buildGoogleAuthorizationUrl("nonce", ["meet"]);
    const call = mockClient.generateAuthUrl.mock.calls[0]![0];
    // include_granted_scopes is what makes this incremental rather than a replacement:
    // the resulting token still carries whatever was granted before.
    expect(call.include_granted_scopes).toBe(true);
    // Without prompt=consent Google may return a token with no refresh token on a repeat
    // authorization. connect() would then reuse the stored one — but asking is cheaper
    // than depending on that path.
    expect(call.prompt).toBe("consent");
    expect(call.access_type).toBe("offline");
  });

  it("does not duplicate a scope that is already in the identity set", () => {
    const scopes: string[] = (buildGoogleAuthorizationUrl("nonce", ["meet", "meet"]), mockClient.generateAuthUrl.mock.calls[0]![0].scope);
    expect(new Set(scopes).size).toBe(scopes.length);
  });

  it("hasGoogleCapability reads what Google granted, never what was requested", () => {
    expect(hasGoogleCapability([...GOOGLE_SCOPES], "meet")).toBe(false);
    expect(hasGoogleCapability([...GOOGLE_SCOPES, ...GOOGLE_MEET_SCOPES], "meet")).toBe(true);
    // A near-miss must not pass: a scope that merely mentions "meetings" is not the one.
    expect(hasGoogleCapability(["https://www.googleapis.com/auth/meetings.space.created"], "meet")).toBe(false);
  });

  it("isGoogleCapability rejects anything not on the allowlist", () => {
    expect(isGoogleCapability("meet")).toBe(true);
    expect(isGoogleCapability("gmail")).toBe(false);
    expect(isGoogleCapability("drive")).toBe(false);
    expect(isGoogleCapability(undefined)).toBe(false);
    // Prototype keys must not read as capabilities.
    expect(isGoogleCapability("toString")).toBe(false);
  });
});
