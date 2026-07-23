import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { randomUUID, createHash } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";

// Work Order E — real-database proof of atomic, single-use attachment
// association (spec §9 atomicity, §11 tokens). Loads BOTH the base backend
// migration and the WO-E upload migration into an embedded Postgres (PGlite,
// no Docker) and drives public.submit_inquiry against real rows. Object
// storage is not involved here — this proves the SQL association contract.

const MIGRATIONS = [
  "../../../supabase/migrations/20260723_inquiry_backend.sql",
  "../../../supabase/migrations/20260724_inquiry_attachments_upload.sql",
].map((rel) => fileURLToPath(new URL(rel, import.meta.url)));

let db: PGlite;

function hash(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

async function count(table: string): Promise<number> {
  const r = await db.query<{ n: number }>(`select count(*)::int as n from public.${table}`);
  return r.rows[0]!.n;
}

function payload(submissionId: string, overrides: Record<string, unknown> = {}) {
  return {
    submissionId,
    formVariant: "contact_full",
    inquirySource: "contact_full",
    sourcePage: "Contact",
    sourcePath: "/contact",
    firstName: "Ada",
    workEmail: "ada@example.com",
    businessName: "Lovelace Ltd",
    workflowDescription: "Automate weekly reporting pipeline end to end.",
    consent: { privacyAccepted: true, marketingOptIn: false },
    ...overrides,
  };
}

async function submit(p: object, fingerprint: string) {
  const r = await db.query<{ result: { lead_id: string; replay: boolean } }>(
    "select public.submit_inquiry($1::jsonb, $2) as result",
    [JSON.stringify(p), fingerprint],
  );
  return r.rows[0]!.result;
}

// Seed an attachment row in a chosen lifecycle state. Returns the raw token.
async function seedAttachment(opts: {
  provisionalSubmissionId: string;
  uploadStatus?: string;
  scanStatus?: string;
  consumed?: boolean;
  tokenTtlMinutes?: number; // negative = already expired
  filename?: string;
}): Promise<{ rawToken: string; attachmentId: string }> {
  const attachmentId = randomUUID();
  const rawToken = randomUUID() + randomUUID();
  const tokenHash = hash(rawToken);
  const ttl = opts.tokenTtlMinutes ?? 30;
  await db.query(
    `insert into public.inquiry_attachments (
        id, provisional_submission_id, storage_bucket, storage_key,
        original_filename, sanitized_filename, declared_mime_type,
        detected_mime_type, byte_size, upload_status, scan_status,
        authorization_expires_at, upload_completed_at,
        attachment_token_hash, attachment_token_expires_at, token_consumed_at
     ) values (
        $1, $2, 'inquiry-attachments', $3,
        $4, $4, 'application/pdf',
        'application/pdf', 1024, $5, $6,
        now() + interval '30 minutes',
        case when $5 = 'completed' then now() else null end,
        $7, now() + ($8 || ' minutes')::interval,
        case when $9 then now() else null end
     )`,
    [
      attachmentId,
      opts.provisionalSubmissionId,
      `inquiries/${opts.provisionalSubmissionId}/${attachmentId}/${opts.filename ?? "report.pdf"}`,
      opts.filename ?? "report.pdf",
      opts.uploadStatus ?? "completed",
      opts.scanStatus ?? "clean",
      tokenHash,
      String(ttl),
      opts.consumed ?? false,
    ],
  );
  return { rawToken, attachmentId };
}

beforeEach(async () => {
  db = new PGlite({ extensions: { citext } });
  await db.exec("create role anon; create role authenticated; create role service_role;");
  for (const path of MIGRATIONS) await db.exec(readFileSync(path, "utf8"));
});

describe("WO-E attachment association", () => {
  it("associates a completed, unexpired token atomically and consumes it once", async () => {
    const sid = randomUUID();
    const { rawToken, attachmentId } = await seedAttachment({ provisionalSubmissionId: sid });

    const res = await submit(payload(sid, { attachmentTokenHashes: [hash(rawToken)] }), "fp-1");
    expect(res.replay).toBe(false);

    const a = await db.query<{
      lead_id: string | null;
      submission_id: string | null;
      token_consumed_at: string | null;
    }>("select lead_id, submission_id, token_consumed_at from public.inquiry_attachments where id = $1", [
      attachmentId,
    ]);
    expect(a.rows[0]!.lead_id).toBe(res.lead_id);
    expect(a.rows[0]!.submission_id).toBe(sid);
    expect(a.rows[0]!.token_consumed_at).not.toBeNull();

    // Timeline records inquiry_received + attachment_associated.
    expect(await count("lead_timeline_events")).toBe(2);
  });

  it("no-attachment inquiry still persists", async () => {
    const res = await submit(payload(randomUUID()), "fp-1");
    expect(res.replay).toBe(false);
    expect(await count("leads")).toBe(1);
    expect(await count("inquiry_attachments")).toBe(0);
  });

  it("rejects an unknown token hash and rolls back the whole inquiry", async () => {
    await expect(
      submit(payload(randomUUID(), { attachmentTokenHashes: [hash("nope")] }), "fp-1"),
    ).rejects.toThrow(/inquiry_attachment_token_invalid/);
    expect(await count("leads")).toBe(0);
    expect(await count("lead_form_submissions")).toBe(0);
  });

  it("rejects a token whose provisional submission differs (wrong submission)", async () => {
    const { rawToken } = await seedAttachment({ provisionalSubmissionId: randomUUID() });
    await expect(
      submit(payload(randomUUID(), { attachmentTokenHashes: [hash(rawToken)] }), "fp-1"),
    ).rejects.toThrow(/inquiry_attachment_wrong_submission/);
    expect(await count("leads")).toBe(0);
  });

  it("rejects an already-consumed token", async () => {
    const sid = randomUUID();
    const { rawToken } = await seedAttachment({ provisionalSubmissionId: sid, consumed: true });
    await expect(
      submit(payload(sid, { attachmentTokenHashes: [hash(rawToken)] }), "fp-1"),
    ).rejects.toThrow(/inquiry_attachment_token_consumed/);
    expect(await count("leads")).toBe(0);
  });

  it("rejects an incomplete (not-yet-uploaded) attachment", async () => {
    const sid = randomUUID();
    const { rawToken } = await seedAttachment({ provisionalSubmissionId: sid, uploadStatus: "authorized" });
    await expect(
      submit(payload(sid, { attachmentTokenHashes: [hash(rawToken)] }), "fp-1"),
    ).rejects.toThrow(/inquiry_attachment_incomplete/);
    expect(await count("leads")).toBe(0);
  });

  it("rejects an expired token", async () => {
    const sid = randomUUID();
    const { rawToken } = await seedAttachment({ provisionalSubmissionId: sid, tokenTtlMinutes: -5 });
    await expect(
      submit(payload(sid, { attachmentTokenHashes: [hash(rawToken)] }), "fp-1"),
    ).rejects.toThrow(/inquiry_attachment_token_expired/);
    expect(await count("leads")).toBe(0);
  });

  it("associates multiple attachments, but rolls back all when one token is bad", async () => {
    const sid = randomUUID();
    const good = await seedAttachment({ provisionalSubmissionId: sid, filename: "a.pdf" });
    const bad = await seedAttachment({ provisionalSubmissionId: sid, filename: "b.pdf", uploadStatus: "authorized" });
    await expect(
      submit(payload(sid, { attachmentTokenHashes: [hash(good.rawToken), hash(bad.rawToken)] }), "fp-1"),
    ).rejects.toThrow(/inquiry_attachment_incomplete/);
    // No partial association: the good attachment must NOT be bound.
    const a = await db.query<{ lead_id: string | null; token_consumed_at: string | null }>(
      "select lead_id, token_consumed_at from public.inquiry_attachments where id = $1",
      [good.attachmentId],
    );
    expect(a.rows[0]!.lead_id).toBeNull();
    expect(a.rows[0]!.token_consumed_at).toBeNull();
    expect(await count("leads")).toBe(0);
  });

  it("idempotent replay does not re-consume tokens or duplicate timeline rows", async () => {
    const sid = randomUUID();
    const { rawToken } = await seedAttachment({ provisionalSubmissionId: sid });
    const body = payload(sid, { attachmentTokenHashes: [hash(rawToken)] });
    await submit(body, "fp-1");
    const replay = await submit(body, "fp-1");
    expect(replay.replay).toBe(true);
    expect(await count("lead_form_submissions")).toBe(1);
    expect(await count("lead_timeline_events")).toBe(2); // not 4
  });
});
