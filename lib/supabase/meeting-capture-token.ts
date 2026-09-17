import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const VERSION = "v1";
const SCOPE = "meeting_capture";
export const MEETING_CAPTURE_TOKEN_TTL_SECONDS = 10 * 60;

export type MeetingCaptureTokenContext = {
  userId: string;
  workspaceId: string;
};

type Claims = MeetingCaptureTokenContext & {
  v: string;
  scope: string;
  iat: number;
  exp: number;
  jti: string;
};

function secret(): string | null {
  const value = process.env.MEETING_CAPTURE_TOKEN_SECRET;
  return value && value.length >= 32 ? value : null;
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(input: string, key: string): string {
  return createHmac("sha256", key).update(input).digest("base64url");
}

export function issueMeetingCaptureToken(
  context: MeetingCaptureTokenContext,
  now = Date.now(),
): { token: string; expiresAt: string } | null {
  const key = secret();
  if (!key) return null;
  const issuedAt = Math.floor(now / 1000);
  const claims: Claims = {
    v: VERSION,
    scope: SCOPE,
    userId: context.userId,
    workspaceId: context.workspaceId,
    iat: issuedAt,
    exp: issuedAt + MEETING_CAPTURE_TOKEN_TTL_SECONDS,
    jti: randomUUID(),
  };
  const body = `${encode(JSON.stringify({ alg: "HS256", typ: "MCAP", v: VERSION }))}.${encode(JSON.stringify(claims))}`;
  return {
    token: `${body}.${sign(body, key)}`,
    expiresAt: new Date((claims.exp) * 1000).toISOString(),
  };
}

export function resolveMeetingCaptureToken(
  token: string,
  now = Date.now(),
): MeetingCaptureTokenContext | null {
  const key = secret();
  if (!key || !token || token.length > 4096) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expected = sign(`${header}.${payload}`, key);
  const actualBytes = Buffer.from(signature, "base64url");
  const expectedBytes = Buffer.from(expected, "base64url");
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return null;
  try {
    const parsedHeader = JSON.parse(Buffer.from(header, "base64url").toString("utf8")) as Record<string, unknown>;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<Claims>;
    const nowSeconds = Math.floor(now / 1000);
    if (parsedHeader.v !== VERSION || parsedHeader.alg !== "HS256" || parsedHeader.typ !== "MCAP") return null;
    if (claims.v !== VERSION || claims.scope !== SCOPE || !claims.jti) return null;
    if (!claims.userId || !claims.workspaceId || !claims.iat || !claims.exp) return null;
    if (claims.exp <= nowSeconds || claims.iat > nowSeconds + 30) return null;
    return { userId: claims.userId, workspaceId: claims.workspaceId };
  } catch {
    return null;
  }
}
