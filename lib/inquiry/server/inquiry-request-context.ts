import "server-only";
import { createHash, randomUUID } from "node:crypto";

// Per-request context derived from the incoming Request. Privacy-preserving:
// the raw IP is hashed and never persisted (owner C — no raw IP retention).
export type InquiryRequestContext = {
  correlationId: string;
  ipHash: string;
  userAgent: string;
};

// Salt for the IP hash. A stable per-deployment salt keeps rate-limit keys
// consistent within a deploy without storing reversible IPs.
const IP_SALT = process.env.INQUIRY_IP_HASH_SALT ?? "codeoutfitters-inquiry";

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(IP_SALT).update(ip).digest("hex").slice(0, 32);
}

export function buildRequestContext(req: Request): InquiryRequestContext {
  return {
    correlationId: randomUUID(),
    ipHash: hashIp(clientIp(req)),
    userAgent: req.headers.get("user-agent")?.slice(0, 256) ?? "",
  };
}

export const MAX_BODY_BYTES = 64 * 1024; // 64 KB — inquiry JSON is small; uploads go through a separate endpoint.

// Content-type + size gate. Returns null when acceptable, or an HTTP status to
// reject with (415 unsupported type, 413 too large). Reads the raw text so the
// route parses JSON exactly once.
export async function readJsonBody(
  req: Request,
): Promise<{ status: number } | { text: string }> {
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.toLowerCase().includes("application/json")) {
    return { status: 415 };
  }
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared && declared > MAX_BODY_BYTES) {
    return { status: 413 };
  }
  const text = await req.text();
  if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) {
    return { status: 413 };
  }
  return { text };
}
