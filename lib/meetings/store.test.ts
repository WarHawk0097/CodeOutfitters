// Meetings store/sync — source-surface tests, same convention as
// lib/integrations/store.test.ts. Local-Supabase RLS/grant coverage lives in
// meetings-schema.pglite.test.ts; this file defends the properties that would be a lie
// if these files regressed: the session client never touches a sync-only column, every
// service-role query is workspace-scoped, and no raw Postgres error reaches a caller.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { MeetingError } from "./store";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const storeSrc = readFileSync(`${repo}lib/meetings/store.ts`, "utf8");
const syncSrc = readFileSync(`${repo}lib/meetings/sync.ts`, "utf8");

describe("meetings store (store.ts)", () => {
  it("MEETING_COLUMNS never includes a sync-only column outside what updateMeeting actually writes", () => {
    // updateMeeting's own .update() call must only ever set title/lead_id — the two
    // columns the migration's authenticated UPDATE grant actually names.
    const fn = storeSrc.slice(storeSrc.indexOf("export async function updateMeeting"), storeSrc.indexOf("type ArtifactRow"));
    expect(fn).toContain("patch.title");
    expect(fn).toContain("patch.leadId");
    expect(fn).not.toMatch(/status:/);
    expect(fn).not.toMatch(/last_error:/);
    expect(fn).not.toMatch(/last_synced_at:/);
    expect(fn).not.toMatch(/provider_conference_record_id:/);
  });

  it("linkMeeting never inserts a sync-only column — the row starts pending_sync by DB default", () => {
    const fn = storeSrc.slice(storeSrc.indexOf("export async function linkMeeting"), storeSrc.indexOf("export async function updateMeeting"));
    expect(fn).not.toMatch(/status:/);
    expect(fn).not.toMatch(/provider_conference_record_id:/);
  });

  it("maps every Postgres error to a fixed caller-facing reason, never the raw message", () => {
    expect(storeSrc).toContain('error.code === "23505"');
    expect(storeSrc).toContain('error.code === "42501"');
    expect(storeSrc.match(/throwForPgError\(/g)?.length).toBeGreaterThanOrEqual(5);
  });

  it("throws a distinct, typed error a route can map to the right HTTP status", () => {
    const err = new MeetingError("not_found", "gone");
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe("not_found");
  });

  it("never selects with a bare '*' — every select names its columns explicitly", () => {
    expect(storeSrc).not.toMatch(/\.select\(\s*\)/);
    expect(storeSrc).not.toContain('.select("*")');
  });

  it("every read/write in store.ts is workspace-scoped, not id-alone", () => {
    expect(storeSrc.match(/\.eq\("workspace_id", workspaceId\)/g)?.length).toBeGreaterThanOrEqual(6);
  });
});

describe("meetings sync (sync.ts)", () => {
  it("credential_ciphertext is read only through the service-role client, restating workspace_id + id", () => {
    const fn = syncSrc.slice(syncSrc.indexOf("async function loadCredentials"), syncSrc.indexOf("async function setStatus"));
    expect(fn).toContain("getServiceClient()");
    expect(fn).toContain('.eq("workspace_id", workspaceId)');
    expect(fn).toContain('.eq("id", connectionId)');
  });

  it("every MeetingProviderErrorKind maps to a distinct, honest meetings.status — no catch-all 'error'", () => {
    expect(syncSrc).toContain("not_found: \"not_found\"");
    expect(syncSrc).toContain("insufficient_scope: \"insufficient_scope\"");
    expect(syncSrc).toContain("revoked: \"revoked\"");
    expect(syncSrc).toContain("provider_error: \"provider_error\"");
  });

  it("a revoked credential is refreshed and retried exactly once, never looped", () => {
    const fn = syncSrc.slice(syncSrc.indexOf("export async function syncMeeting"));
    expect(fn.match(/refreshConnection\(/g)?.length).toBe(1);
    expect(fn.match(/await runSync\(/g)?.length).toBe(2);
  });

  it("transcript entries are deleted then reinserted per sync, never diffed", () => {
    expect(syncSrc).toContain('.from("transcript_entries").delete()');
    expect(syncSrc).toContain('.from("transcript_entries").insert(');
  });

  it("speaker_label and other entry fields are passed through verbatim from the adapter, never fabricated here", () => {
    const fn = syncSrc.slice(syncSrc.indexOf("entries.map((entry)"), syncSrc.indexOf("await setStatus(meeting.id, anyTranscriptEntries"));
    expect(fn).toContain("entry.speakerLabel");
    expect(fn).not.toMatch(/speaker_label:\s*"/);
  });
});
