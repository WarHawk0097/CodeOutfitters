import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  issueMeetingCaptureToken,
  MEETING_CAPTURE_TOKEN_TTL_SECONDS,
  resolveMeetingCaptureToken,
} from "@/lib/supabase/meeting-capture-token";

const NOW = Date.parse("2026-08-22T00:00:00.000Z");

describe("meeting capture credential", () => {
  beforeEach(() => {
    process.env.MEETING_CAPTURE_TOKEN_SECRET = "test-only-meeting-capture-secret-32-bytes";
  });

  it("issues a short-lived capture-only token with server-derived identity", () => {
    const issued = issueMeetingCaptureToken({ userId: "user-1", workspaceId: "workspace-1" }, NOW);
    expect(issued).not.toBeNull();
    expect(issued?.expiresAt).toBe(new Date(NOW + MEETING_CAPTURE_TOKEN_TTL_SECONDS * 1000).toISOString());
    expect(resolveMeetingCaptureToken(issued!.token, NOW)).toEqual({ userId: "user-1", workspaceId: "workspace-1" });
    expect(issued!.token).not.toContain("refresh_token");
    expect(issued!.token).not.toContain("access_token");
  });

  it.each([
    ["malformed", "not-a-token"],
    ["bad signature", "a.b.c"],
  ])("rejects %s credentials", (_label, token) => {
    expect(resolveMeetingCaptureToken(token, NOW)).toBeNull();
  });

  it("rejects expiry and tampering", () => {
    const issued = issueMeetingCaptureToken({ userId: "user-1", workspaceId: "workspace-1" }, NOW)!;
    expect(resolveMeetingCaptureToken(issued.token, NOW + (MEETING_CAPTURE_TOKEN_TTL_SECONDS + 1) * 1000)).toBeNull();
    const [header, payload, signature] = issued.token.split(".");
    expect(resolveMeetingCaptureToken(`${header}.${payload}x.${signature}`, NOW)).toBeNull();
  });

  it.each([
    ["scope", { scope: "dashboard" }],
    ["version", { v: "v2" }],
  ])("rejects a wrong %s even with a valid signature", (_label, replacement) => {
    const issued = issueMeetingCaptureToken({ userId: "user-1", workspaceId: "workspace-1" }, NOW)!;
    const [header, payload] = issued.token.split(".");
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const changedPayload = Buffer.from(JSON.stringify({ ...claims, ...replacement }), "utf8").toString("base64url");
    const body = `${header}.${changedPayload}`;
    const signature = createHmac("sha256", process.env.MEETING_CAPTURE_TOKEN_SECRET!).update(body).digest("base64url");
    expect(resolveMeetingCaptureToken(`${body}.${signature}`, NOW)).toBeNull();
  });
});
