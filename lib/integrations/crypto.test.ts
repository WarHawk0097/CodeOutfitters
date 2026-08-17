import { describe, it, expect, afterEach } from "vitest";
import { randomBytes } from "node:crypto";
import { decryptCredential, encryptCredential, __setKeyForTests } from "./crypto";

const validKey = randomBytes(32).toString("base64");

describe("integrations/crypto", () => {
  afterEach(() => {
    __setKeyForTests(undefined);
    delete process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY;
  });

  it("round-trips a plaintext credential", () => {
    __setKeyForTests(Buffer.from(validKey, "base64"));
    const plaintext = JSON.stringify({ accessToken: "abc", refreshToken: "xyz" });
    const ciphertext = encryptCredential(plaintext);
    expect(ciphertext).not.toContain("abc");
    expect(decryptCredential(ciphertext)).toBe(plaintext);
  });

  it("throws on a tampered ciphertext instead of returning garbage", () => {
    __setKeyForTests(Buffer.from(validKey, "base64"));
    const ciphertext = encryptCredential("secret");
    const [version, iv, tag, data] = ciphertext.split(".");
    const tampered = [version, iv, tag, `${data!.slice(0, -2)}zz`].join(".");
    expect(() => decryptCredential(tampered)).toThrow();
  });

  it("fails closed when the key is not configured", () => {
    __setKeyForTests(undefined);
    delete process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY;
    expect(() => encryptCredential("secret")).toThrow(/INTEGRATION_TOKEN_ENCRYPTION_KEY/);
  });

  it("fails closed on a malformed (wrong-length) key", () => {
    __setKeyForTests(undefined);
    process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY = Buffer.from("too-short").toString("base64");
    expect(() => encryptCredential("secret")).toThrow(/32 bytes/);
  });
});
