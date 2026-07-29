// Secure access-link tokens (tests 200-206).
//
// The token is the entire authentication story for the public route: whoever holds it reads
// the proposal. So the properties asserted here are unforgeability (enough entropy, from the
// platform CSPRNG), unpredictability (no structure, no timestamp, no id), and the fact that
// the raw value is never what persistence keeps.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  ACCESS_TOKEN_BYTES,
  ACCESS_TOKEN_LENGTH,
  accessTokenHashesEqual,
  generateAccessToken,
  hashAccessToken,
} from "./token";
import { isWellFormedAccessToken } from "./model";

const src = readFileSync(fileURLToPath(new URL("./token.ts", import.meta.url)), "utf8");

describe("secure access-link tokens (tests 200-206)", () => {
  // 200
  it("is 256 bits of base64url with no padding, and passes the shared shape check", () => {
    expect(ACCESS_TOKEN_BYTES).toBe(32);
    expect(ACCESS_TOKEN_LENGTH).toBe(43);
    for (let i = 0; i < 200; i += 1) {
      const token = generateAccessToken();
      expect(token).toHaveLength(ACCESS_TOKEN_LENGTH);
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(token).not.toContain("=");
      expect(isWellFormedAccessToken(token)).toBe(true);
    }
  });

  // 201
  it("comes from the platform CSPRNG, never from Math.random or a timestamp", () => {
    expect(src).toContain('from "node:crypto"');
    expect(src).toContain("randomBytes(ACCESS_TOKEN_BYTES)");
    expect(src).not.toContain("Math.random(");
    expect(src).not.toContain("Date.now(");
    expect(src).not.toContain("new Date()");
  });

  // 202
  it("carries no structure: no repeats, no shared prefix, every position varies", () => {
    const tokens = Array.from({ length: 500 }, () => generateAccessToken());
    expect(new Set(tokens).size).toBe(tokens.length);
    // A UUID, a base64 JSON payload or an id-plus-salt scheme all pin at least one character
    // position. Nothing here may.
    for (let position = 0; position < ACCESS_TOKEN_LENGTH; position += 1) {
      const seen = new Set(tokens.map((token) => token[position]));
      expect(seen.size, `position ${position}`).toBeGreaterThan(4);
    }
  });

  // 203
  it("hashes to a stable unsalted SHA-256 hex digest — the stored form, not the raw value", () => {
    const token = generateAccessToken();
    const digest = hashAccessToken(token);
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(digest).toBe(hashAccessToken(token));
    expect(digest).toBe(createHash("sha256").update(token, "utf8").digest("hex"));
    expect(digest).not.toContain(token);
    expect(hashAccessToken(generateAccessToken())).not.toBe(digest);
  });

  // 204
  it("compares hashes in constant time and refuses a length mismatch instead of throwing", () => {
    const a = hashAccessToken("one");
    const b = hashAccessToken("two");
    expect(accessTokenHashesEqual(a, a)).toBe(true);
    expect(accessTokenHashesEqual(a, b)).toBe(false);
    expect(accessTokenHashesEqual(a, "")).toBe(false);
    expect(accessTokenHashesEqual(a, `${a}x`)).toBe(false);
    expect(accessTokenHashesEqual("", "")).toBe(true);
    expect(src).toContain("timingSafeEqual");
  });

  // 205
  it("differs in about half its bits for a one-character input change", () => {
    // Not a property of our code so much as a property of the hash we chose — asserted so a
    // future "cheaper" hash cannot be swapped in unnoticed.
    const left = hashAccessToken("token-a");
    const right = hashAccessToken("token-b");
    let differing = 0;
    for (let i = 0; i < left.length; i += 1) if (left[i] !== right[i]) differing += 1;
    expect(differing).toBeGreaterThan(left.length / 3);
  });

  // 206
  it("is server-only, so no bundle can pull token generation into the browser", () => {
    expect(src.startsWith('import "server-only";')).toBe(true);
  });
});
