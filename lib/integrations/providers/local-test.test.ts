import { describe, it, expect } from "vitest";
import createLocalTestProviderAdapter from "./local-test";
import { IntegrationProviderError } from "../provider";

describe("local_test provider adapter", () => {
  it("exchangeCode parses the fixture string into an account + credentials", async () => {
    const adapter = createLocalTestProviderAdapter();
    const result = await adapter.exchangeCode("acct-1|ada@example.test|scope.a,scope.b");
    expect(result.providerAccountId).toBe("acct-1");
    expect(result.providerAccountEmail).toBe("ada@example.test");
    expect(result.grantedScopes).toEqual(["scope.a", "scope.b"]);
    expect(result.credentials.accessToken).toContain("acct-1");
    expect(result.credentials.refreshToken).toContain("acct-1");
  });

  it("exchangeCode rejects a code with no account id", async () => {
    const adapter = createLocalTestProviderAdapter();
    await expect(adapter.exchangeCode("")).rejects.toThrow(IntegrationProviderError);
  });

  it("G: refresh produces a distinct credential from a valid refresh token", async () => {
    const adapter = createLocalTestProviderAdapter();
    const { credentials } = await adapter.exchangeCode("acct-1");
    const refreshed = await adapter.refresh(credentials);
    expect(refreshed.credentials.accessToken).not.toBe(credentials.accessToken);
    expect(refreshed.credentials.refreshToken).toBe(credentials.refreshToken);
  });

  it("H: refresh failure throws a safe, token-free error", async () => {
    const adapter = createLocalTestProviderAdapter();
    try {
      await adapter.refresh({ accessToken: "x", refreshToken: "revoked:acct-1" });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(IntegrationProviderError);
      const message = (error as IntegrationProviderError).message;
      expect(message).not.toContain("revoked:acct-1");
      expect(message.length).toBeLessThan(200);
    }
  });

  it("H: refresh with no refresh token throws rather than reusing the access token", async () => {
    const adapter = createLocalTestProviderAdapter();
    await expect(adapter.refresh({ accessToken: "x" })).rejects.toThrow(IntegrationProviderError);
  });

  it("revoke never throws, even for an already-invalid credential", async () => {
    const adapter = createLocalTestProviderAdapter();
    await expect(adapter.revoke({ accessToken: "x", refreshToken: "revoked:acct-1" })).resolves.toBeUndefined();
  });

  it("inspect reports revoked, expired, and healthy states", async () => {
    const adapter = createLocalTestProviderAdapter();
    expect((await adapter.inspect({ accessToken: "x", refreshToken: "revoked:acct-1" })).health).toBe("revoked");
    expect(
      (await adapter.inspect({ accessToken: "x", expiresAt: new Date(Date.now() - 1000).toISOString() })).health,
    ).toBe("expired");
    expect((await adapter.inspect({ accessToken: "x" })).health).toBe("healthy");
  });
});
