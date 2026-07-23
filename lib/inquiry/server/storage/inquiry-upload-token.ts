import "server-only";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";

// Single-use attachment token (spec §11). The raw token is returned to the
// browser exactly once (from POST /api/inquiries/uploads/complete) and is the
// ONLY thing the client sends back in the final POST /api/inquiries payload.
// The database never stores the raw token — only its SHA-256 hash — so a leaked
// row cannot be replayed into a valid token. Association consumes the token
// atomically inside submit_inquiry (token_consumed_at set once), so the same
// token can never bind an attachment twice.

// 32 random bytes = 256 bits of entropy; base64url so it is URL/JSON safe and
// carries no delimiters a naive parser could choke on.
export function mintAttachmentToken(): string {
  return randomBytes(32).toString("base64url");
}

// Deterministic hash stored at rest and matched during association. Hex so it
// round-trips cleanly through jsonb / text[] into Postgres.
export function hashAttachmentToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

// Constant-time comparison for any in-process token check (the DB match is by
// hashed lookup; this guards TS-side comparisons against timing leaks).
export function attachmentTokenMatches(rawToken: string, storedHash: string): boolean {
  const a = Buffer.from(hashAttachmentToken(rawToken), "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
