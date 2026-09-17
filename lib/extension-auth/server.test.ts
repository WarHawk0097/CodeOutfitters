import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createPkceChallenge, isAllowedExtensionRedirect, isValidPkce, safeExtensionAuthResponse } from "./server";

const source = readFileSync(resolve(__dirname, "server.ts"), "utf8");

describe("extension auth security primitives", () => {
  it("validates PKCE and rejects a changed verifier", () => {
    const verifier = "a-secure-verifier-value";
    const challenge = createPkceChallenge(verifier);
    expect(isValidPkce(verifier, challenge)).toBe(true);
    expect(isValidPkce("wrong", challenge)).toBe(false);
  });

  it("uses base64url SHA-256 PKCE and creates the session before consuming the request", () => {
    expect(source).toContain('createHash("sha256").update(value).digest("base64url")');
    const exchangeSource = source.slice(source.indexOf("export async function exchangeExtensionAuthRequest"), source.indexOf("export function isAllowedExtensionRedirect"));
    expect(exchangeSource.indexOf('from("extension_auth_sessions").insert')).toBeLessThan(exchangeSource.indexOf('from("extension_auth_requests").update'));
    expect(source).toContain('.eq("status", "authorized").is("consumed_at", null)');
  });

  it("allowlists Chromium callback URLs and local callback only", () => {
    expect(isAllowedExtensionRedirect("https://abc.chromiumapp.org/extension-auth", "http://localhost:3005")).toBe(true);
    expect(isAllowedExtensionRedirect("https://evil.example/callback", "http://localhost:3005")).toBe(false);
    expect(isAllowedExtensionRedirect("http://localhost:3005/extension-auth/callback", "http://localhost:3005")).toBe(true);
  });

  it("returns only scoped opaque session material", () => {
    const response = safeExtensionAuthResponse({ accessToken: "opaque", expiresAt: "2026-08-24T00:00:00.000Z" });
    expect(response).toEqual({ accessToken: "opaque", expiresAt: "2026-08-24T00:00:00.000Z", scope: "meeting_capture" });
    expect(JSON.stringify(response)).not.toContain("refresh_token");
  });
});
