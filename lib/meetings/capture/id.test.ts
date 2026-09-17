import { describe, it, expect } from "vitest";
import {
  CAPTURE_ID_PREFIX,
  captureArtifactId,
  captureEntryId,
  isCaptureArtifactId,
  sessionIdFromArtifactId,
} from "./id";

describe("capture deterministic ids", () => {
  const session = "8f3c2d4e-9a1b-4c5d-8e6f-1a2b3c4d5e6f";

  it("artifact id is deterministic per session", () => {
    expect(captureArtifactId(session)).toBe(`${CAPTURE_ID_PREFIX}:${session}`);
    expect(captureArtifactId(session)).toBe(captureArtifactId(session));
  });

  it("entry id is deterministic per (session, sequence)", () => {
    expect(captureEntryId(session, 0)).toBe(`${CAPTURE_ID_PREFIX}:${session}:0`);
    expect(captureEntryId(session, 1)).toBe(`${CAPTURE_ID_PREFIX}:${session}:1`);
    expect(captureEntryId(session, 0)).toBe(captureEntryId(session, 0));
  });

  it("retrying a batch yields identical ids (idempotency under unique constraints)", () => {
    const batch1 = [0, 1, 2].map((sequence) => captureEntryId(session, sequence));
    const batch2 = [0, 1, 2].map((sequence) => captureEntryId(session, sequence));
    expect(batch1).toEqual(batch2);
  });

  it("isCaptureArtifactId / sessionIdFromArtifactId round-trip", () => {
    const artifactId = captureArtifactId(session);
    expect(isCaptureArtifactId(artifactId)).toBe(true);
    expect(sessionIdFromArtifactId(artifactId)).toBe(session);
  });

  it("does not misclassify a provider artifact id", () => {
    expect(isCaptureArtifactId("conferenceRecords/abc/transcripts/1")).toBe(false);
    expect(sessionIdFromArtifactId("conferenceRecords/abc/transcripts/1")).toBeNull();
  });

  it("different sessions never collide", () => {
    const other = "aaaaaaaa-1111-2222-3333-444444444444";
    expect(captureArtifactId(session)).not.toBe(captureArtifactId(other));
    expect(captureEntryId(session, 0)).not.toBe(captureEntryId(other, 0));
  });
});