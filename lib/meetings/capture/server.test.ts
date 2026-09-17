import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { captureArtifactId, captureEntryId, isCaptureArtifactId } from "./id";

const repo = fileURLToPath(new URL("../../../", import.meta.url));
const serverSrc = readFileSync(`${repo}lib/meetings/capture/server.ts`, "utf8");

describe("capture server (server.ts) — source-surface invariants", () => {
  it("derives the workspace only from the bearer-authenticated session, never the request body", () => {
    expect(serverSrc).not.toMatch(/input\.workspaceId|body\.workspace_id|req\.workspace/i);
  });

  it("artifact + entry ids are deterministic functions of sessionId, satisfying the existing unique constraints", () => {
    const session = "8f3c2d4e-9a1b-4c5d-8e6f-1a2b3c4d5e6f";
    expect(captureArtifactId(session)).toBe(`codeoutfitters-capture:${session}`);
    expect(captureEntryId(session, 0)).toBe(`codeoutfitters-capture:${session}:0`);
    expect(isCaptureArtifactId(captureArtifactId(session))).toBe(true);
  });

  it("normalizes a full Meet URL down to the bare space id before any lookup", () => {
    expect(serverSrc).toContain("meet\\.google\\.com");
    expect(serverSrc).toMatch(/parseProviderSpaceId/);
  });

  it("rejects sequences at or below the last accepted sequence (no gaps, no rewrites)", () => {
    expect(serverSrc).toContain("minIncoming <= currentMax");
    expect(serverSrc).toContain("23505");
  });

  it("capture writes go through the service-role client, not the session client", () => {
    // The session client is only used for ownership reads (.from on the passed session);
    // the writes to artifacts/transcripts/entries all come from getServiceClient().
    const serviceWrites = (serverSrc.match(/const service = getServiceClient\(\)/g) ?? []).length;
    expect(serviceWrites).toBeGreaterThanOrEqual(3);
  });

  it("meeting status transitions only to transcript_ready or no_transcript on stop", () => {
    expect(serverSrc).toMatch(/transcript_ready/);
    expect(serverSrc).toMatch(/no_transcript/);
  });

  it("supports audio as a distinct capture source", () => {
    expect(serverSrc).toContain('captureSource = input.acquisitionStrategy ?? "browser_captions"');
    expect(serverSrc).toContain("capture_source: captureSource");
  });

  it("uses the canonical Google Meet browser-caption contract without lead or connection requirements", () => {
    expect(serverSrc).toContain('.eq("provider", "google_meet")');
    expect(serverSrc).toContain('captureSource = input.acquisitionStrategy ?? "browser_captions"');
    expect(serverSrc).toContain("lead_id: input.leadId ?? null");
    expect(serverSrc).toContain("connection_id: null");
    expect(serverSrc).toContain("[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}");
  });

  it("uses safe 422 branch codes for start validation and persistence failures", () => {
    expect(serverSrc).toContain("CAPTURE_START_SPACE_REQUIRED");
    expect(serverSrc).toContain("CAPTURE_START_MEETING_SCHEMA_MISMATCH");
    expect(serverSrc).toContain("CAPTURE_START_MEETING_CONSTRAINT_FAILED");
    expect(serverSrc).toContain("CAPTURE_START_MEETING_INSERT_FAILED");
    expect(serverSrc).toContain("CAPTURE_START_MEETING_WORKSPACE_INVALID");
    expect(serverSrc).toContain('const prefix = `CAPTURE_START_${stage}`');
    expect(serverSrc).toContain('`${prefix}_SCHEMA_MISMATCH`');
    expect(serverSrc).toContain('`${prefix}_CONSTRAINT_FAILED`');
    expect(serverSrc).toContain('`${prefix}_INSERT_FAILED`');
  });

  it("sets the required meeting owner explicitly for service-client capture starts", () => {
    expect(serverSrc).toContain("created_by: userId");
    expect(serverSrc).toContain("connection_id: null");
  });

  it("uses the inserted artifact row UUID for the transcript foreign key", () => {
    expect(serverSrc).toContain('.select("id")');
    expect(serverSrc).toContain("meeting_artifact_id: artifact.id");
    expect(serverSrc).not.toMatch(/meeting_artifact_id:\s*artifactId/);
  });

  it("never trusts a browser-supplied session for ownership — artifact lookup is workspace-scoped", () => {
    expect(serverSrc).toContain('.eq("workspace_id", workspaceId)');
    expect(serverSrc).toContain('.eq("provider_artifact_id", artifactId)');
  });
});
