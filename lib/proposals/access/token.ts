import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { ACCESS_TOKEN_BYTES, ACCESS_TOKEN_LENGTH } from "./model";

// Secure access-link tokens.
//
// SERVER ONLY. A token is generated once, shown once to the staff member who created the
// link, and never stored — what persistence holds is a SHA-256 hash. That is the difference
// between "a database leak exposes every client's proposal" and "a database leak exposes a
// list of hashes".
//
// What a token deliberately is NOT:
//   * not a UUID              — v4 gives 122 bits, and version/variant bits are structure
//   * not a timestamp         — a timestamp narrows the search space and leaks when it was made
//   * not base64-encoded JSON — decodable structure is not a secret
//   * not a JWT               — a JWT carries its payload to anybody who reads the URL
//   * not proposal id + salt  — that is a guessable prefix with a secret bolted on
//   * not client-generated    — a browser choosing its own token chooses its own access
//
// It is 32 bytes from the platform CSPRNG, base64url-encoded so it survives a URL, a copy,
// an email client and a paste, with no padding to be mangled.

export { ACCESS_TOKEN_BYTES, ACCESS_TOKEN_LENGTH };

/** A fresh access token. Returned to the caller once; the caller stores {@link hashAccessToken}
 *  of it and shows the raw value exactly once. */
export function generateAccessToken(): string {
  return randomBytes(ACCESS_TOKEN_BYTES).toString("base64url");
}

/** The stored form. Unsalted SHA-256 is correct here and a KDF would not be: the input is 256
 *  bits of uniform randomness, so there is no dictionary to run and no work factor worth
 *  paying on every page open. */
export function hashAccessToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

/** Constant-time hash comparison, for the paths that compare in application code rather than
 *  handing the hash to an indexed database lookup. */
export function accessTokenHashesEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
