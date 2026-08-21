import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { openTestDatabase, resetSchema } from "@/test/pglite-schema";

// Proves 20260820000000_meetings_transcripts.sql's RLS and column-grant hardening
// against real embedded Postgres — same pattern as
// lib/integrations/integration-connections.pglite.test.ts. Covers: cross-workspace read
// denial, authorized link create/read, the sync-only column set staying unwritable by
// `authenticated` (status/last_error/provider_conference_record_id), artifact/transcript/
// entry/insight rows being read-only to `authenticated` and workspace_id being correctly
// denormalized by trigger regardless of which workspace the service role claims on insert.
const MIGRATIONS = [
  "../../supabase/migrations/20260723_inquiry_backend.sql",
  "../../supabase/migrations/20260727_command_center_workspaces.sql",
  "../../supabase/migrations/20260818000000_integration_connections.sql",
  "../../supabase/migrations/20260820000000_meetings_transcripts.sql",
].map((rel) => fileURLToPath(new URL(rel, import.meta.url)));

const AUTH_STUB = `
  create schema if not exists auth;
  create table auth.users (
    id                 uuid primary key,
    email              text,
    email_confirmed_at timestamptz,
    raw_app_meta_data  jsonb not null default '{}'::jsonb
  );
  create or replace function auth.uid() returns uuid language sql stable as $fn$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  $fn$;
  grant usage on schema auth to authenticated;
  grant select on auth.users to authenticated;
`;

let db: PGlite;
let workspaceA: string;
let workspaceB: string;
let userA: string;
let userB: string;
let leadA: string;
let connectionA: string;

async function asUser(userId: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  await db.exec("set role authenticated");
}

// Real Supabase grants service_role BYPASSRLS at the platform level; PGlite's plain
// `create role service_role` has no such attribute, so writes that stand in for the
// service-role sync job run as the (superuser) bootstrap role instead — same
// `asVerifier()` pattern lib/booking-lead-linkage.pglite.test.ts uses for the same reason.
async function asVerifier() {
  await db.exec("reset role");
}

async function seedUser(id: string, email: string) {
  await asVerifier();
  await db.query(`insert into auth.users (id, email) values ($1, $2)`, [id, email]);
}

async function seedMembership(workspaceId: string, userId: string) {
  await asVerifier();
  await db.query(
    `insert into public.workspace_memberships (workspace_id, user_id, role, status) values ($1, $2, 'owner', 'active')`,
    [workspaceId, userId],
  );
}

beforeAll(async () => {
  db = await openTestDatabase();
}, 60_000);

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await resetSchema(db, { migrations: MIGRATIONS, authStub: AUTH_STUB });
  await asVerifier();

  const wsA = await db.query<{ id: string }>(
    `insert into public.workspaces (name, slug) values ('Workspace A', 'workspace-a-${randomUUID()}') returning id`,
  );
  const wsB = await db.query<{ id: string }>(
    `insert into public.workspaces (name, slug) values ('Workspace B', 'workspace-b-${randomUUID()}') returning id`,
  );
  workspaceA = wsA.rows[0]!.id;
  workspaceB = wsB.rows[0]!.id;

  userA = randomUUID();
  userB = randomUUID();
  await seedUser(userA, "a@example.test");
  await seedUser(userB, "b@example.test");
  await seedMembership(workspaceA, userA);
  await seedMembership(workspaceB, userB);

  const lead = await db.query<{ id: string }>(
    `insert into public.leads (workspace_id, first_name, business_name, workflow_description, work_email)
     values ($1, 'Ada', 'Acme', 'wants a site', 'ada@example.test') returning id`,
    [workspaceA],
  );
  leadA = lead.rows[0]!.id;

  const connection = await db.query<{ id: string }>(
    `insert into public.integration_connections
       (workspace_id, provider, provider_account_id, credential_ciphertext, connected_at, created_by)
     values ($1, 'google_calendar', 'google-acct-1', 'v1.iv.tag.ct', now(), $2)
     returning id`,
    [workspaceA, userA],
  );
  connectionA = connection.rows[0]!.id;
}, 60_000);

async function insertMeeting(workspaceId: string, connectionId: string, spaceId: string) {
  return db.query<{ id: string }>(
    `insert into public.meetings (workspace_id, lead_id, provider, connection_id, provider_space_id)
     values ($1, $2, 'google_meet', $3, $4)
     returning id`,
    [workspaceId, leadA, connectionId, spaceId],
  );
}

describe("meetings_transcripts RLS + grants", () => {
  it("an authorized member can link a meeting and read it back", async () => {
    await asUser(userA);
    const inserted = await insertMeeting(workspaceA, connectionA, "spaces/abc123");
    expect(inserted.rows).toHaveLength(1);

    const read = await db.query<{ status: string }>(`select status from public.meetings where workspace_id = $1`, [
      workspaceA,
    ]);
    expect(read.rows).toHaveLength(1);
    expect(read.rows[0]!.status).toBe("pending_sync");
  });

  it("Workspace A cannot read Workspace B's meeting", async () => {
    await asVerifier();
    const connB = await db.query<{ id: string }>(
      `insert into public.integration_connections
         (workspace_id, provider, provider_account_id, credential_ciphertext, connected_at, created_by)
       values ($1, 'google_calendar', 'google-acct-b', 'v1.iv.tag.ct', now(), $2)
       returning id`,
      [workspaceB, userB],
    );
    await asUser(userB);
    await insertMeeting(workspaceB, connB.rows[0]!.id, "spaces/other");

    await asUser(userA);
    const read = await db.query(`select id from public.meetings where workspace_id = $1`, [workspaceB]);
    expect(read.rows).toHaveLength(0);
  });

  it("authenticated can rename a meeting but cannot write sync-only columns", async () => {
    await asUser(userA);
    const inserted = await insertMeeting(workspaceA, connectionA, "spaces/abc123");
    const meetingId = inserted.rows[0]!.id;

    await db.query(`update public.meetings set title = 'Discovery call' where id = $1`, [meetingId]);
    const read = await db.query<{ title: string }>(`select title from public.meetings where id = $1`, [meetingId]);
    expect(read.rows[0]!.title).toBe("Discovery call");

    await expect(
      db.query(`update public.meetings set status = 'transcript_ready' where id = $1`, [meetingId]),
    ).rejects.toThrow();
    await expect(
      db.query(`update public.meetings set last_error = 'nope' where id = $1`, [meetingId]),
    ).rejects.toThrow();
  });

  it("service role sync can advance status and denormalizes workspace_id on child rows", async () => {
    await asUser(userA);
    const inserted = await insertMeeting(workspaceA, connectionA, "spaces/abc123");
    const meetingId = inserted.rows[0]!.id;

    await asVerifier();
    await db.query(
      `update public.meetings set status = 'transcript_ready', provider_conference_record_id = 'conferenceRecords/xyz', last_synced_at = now() where id = $1`,
      [meetingId],
    );

    const artifact = await db.query<{ id: string; workspace_id: string }>(
      `insert into public.meeting_artifacts (meeting_id, artifact_type, provider_artifact_id, state)
       values ($1, 'transcript', 'conferenceRecords/xyz/transcripts/1', 'FILE_GENERATED')
       returning id, workspace_id`,
      [meetingId],
    );
    expect(artifact.rows[0]!.workspace_id).toBe(workspaceA);

    const transcript = await db.query<{ id: string; workspace_id: string }>(
      `insert into public.transcripts (meeting_artifact_id, state) values ($1, 'FILE_GENERATED')
       returning id, workspace_id`,
      [artifact.rows[0]!.id],
    );
    expect(transcript.rows[0]!.workspace_id).toBe(workspaceA);

    const entry = await db.query<{ workspace_id: string }>(
      `insert into public.transcript_entries
         (transcript_id, provider_entry_id, speaker_label, sequence, text)
       values ($1, 'entries/1', 'Ada', 0, 'Hello there')
       returning workspace_id`,
      [transcript.rows[0]!.id],
    );
    expect(entry.rows[0]!.workspace_id).toBe(workspaceA);

    const insight = await db.query<{ workspace_id: string }>(
      `insert into public.ai_meeting_insights (meeting_id, transcript_id, insight_type, model, payload)
       values ($1, $2, 'meeting_intelligence', 'test-model', '{}'::jsonb)
       returning workspace_id`,
      [meetingId, transcript.rows[0]!.id],
    );
    expect(insight.rows[0]!.workspace_id).toBe(workspaceA);

    await asUser(userA);
    const read = await db.query<{ status: string }>(`select status from public.meetings where id = $1`, [meetingId]);
    expect(read.rows[0]!.status).toBe("transcript_ready");

    const readEntries = await db.query(`select id from public.transcript_entries where workspace_id = $1`, [
      workspaceA,
    ]);
    expect(readEntries.rows).toHaveLength(1);
  });

  it("authenticated cannot directly insert a meeting_artifact (no insert grant)", async () => {
    await asUser(userA);
    const inserted = await insertMeeting(workspaceA, connectionA, "spaces/abc123");

    await expect(
      db.query(
        `insert into public.meeting_artifacts (meeting_id, artifact_type, provider_artifact_id)
         values ($1, 'transcript', 'x')`,
        [inserted.rows[0]!.id],
      ),
    ).rejects.toThrow();
  });
});
