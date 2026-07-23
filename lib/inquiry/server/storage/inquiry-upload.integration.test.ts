import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  authorizeInquiryUpload,
  completeInquiryUpload,
  deleteInquiryUpload,
  UploadError,
} from "./inquiry-upload-service";
import { SupabaseInquiryRepository } from "../supabase-inquiry-repository";
import { computeFingerprint } from "../inquiry-idempotency";
import { EICAR_SIGNATURE } from "./inquiry-file-scanner";

// Work Order E Step 23 — Docker Supabase integration proof. Exercises the REAL
// two-phase upload against the local Storage bucket + ClamAV + Postgres. This
// suite fails when the stack is down (see test/integration-setup.ts); it never
// mocks. Requires: npm run supabase:start AND the ClamAV container healthy.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const secret = process.env.SUPABASE_SECRET_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const bucket = process.env.INQUIRY_STORAGE_BUCKET ?? "inquiry-attachments";
const admin = createClient(url, secret, { auth: { persistSession: false } });

const MINIMAL_PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

// Track storage keys + lead ids to clean up.
const createdKeys: string[] = [];
const createdLeadIds: string[] = [];

async function putSigned(uploadUrl: string, headers: Record<string, string>, bytes: Uint8Array) {
  const res = await fetch(uploadUrl, { method: "PUT", headers, body: bytes });
  if (!res.ok) throw new Error(`Signed PUT failed: ${res.status} ${await res.text()}`);
}

function basePayload(submissionId: string, tokens: string[]) {
  return {
    submissionId,
    formVariant: "contact_full",
    inquirySource: "contact_full",
    sourcePage: "Contact",
    sourcePath: "/contact",
    firstName: "Ada",
    workEmail: `ada+${submissionId.slice(0, 8)}@example.com`,
    businessName: "Lovelace Ltd",
    workflowDescription: "Automate weekly reporting pipeline end to end.",
    consent: { privacyAccepted: true, marketingOptIn: false },
    attachmentTokens: tokens,
  } as never;
}

afterAll(async () => {
  for (const key of createdKeys) await admin.storage.from(bucket).remove([key]).catch(() => {});
});

describe("WO-E upload integration (Docker Supabase + ClamAV)", () => {
  it("authorizes, uploads, verifies, scans clean, mints a token, and associates atomically", async () => {
    const submissionId = randomUUID();
    const auth = await authorizeInquiryUpload({
      submissionId,
      formVariant: "contact_full",
      filename: "brief.pdf",
      declaredMime: "application/pdf",
      byteSize: MINIMAL_PDF.length,
    });
    createdKeys.push(auth.storageKey);
    expect(auth.uploadUrl).toMatch(/^http:\/\/(127\.0\.0\.1|localhost)/);

    await putSigned(auth.uploadUrl, auth.headers, MINIMAL_PDF);

    const complete = await completeInquiryUpload({ submissionId, attachmentId: auth.attachmentId });
    expect(complete.scanStatus).toBe("clean");
    expect(complete.attachmentToken).toBeTruthy();

    const repo = new SupabaseInquiryRepository();
    const payload = basePayload(submissionId, [complete.attachmentToken!]);
    const result = await repo.persist(payload, computeFingerprint(payload));
    createdLeadIds.push(result.leadId);
    expect(result.submissionId).toBe(submissionId);

    const { data } = await admin
      .from("inquiry_attachments")
      .select("submission_id, lead_id, token_consumed_at, scan_status, upload_status")
      .eq("id", auth.attachmentId)
      .single();
    expect(data!.submission_id).toBe(submissionId);
    expect(data!.lead_id).toBe(result.leadId);
    expect(data!.token_consumed_at).not.toBeNull();
    expect(data!.scan_status).toBe("clean");
    expect(data!.upload_status).toBe("completed");
  });

  it("issues an authenticated short-lived signed download for a clean object", async () => {
    const submissionId = randomUUID();
    const auth = await authorizeInquiryUpload({
      submissionId,
      formVariant: "contact_full",
      filename: "doc.pdf",
      declaredMime: "application/pdf",
      byteSize: MINIMAL_PDF.length,
    });
    createdKeys.push(auth.storageKey);
    await putSigned(auth.uploadUrl, auth.headers, MINIMAL_PDF);
    await completeInquiryUpload({ submissionId, attachmentId: auth.attachmentId });

    const { data, error } = await admin.storage.from(bucket).createSignedUrl(auth.storageKey, 60);
    expect(error).toBeNull();
    const dl = await fetch(data!.signedUrl);
    expect(dl.ok).toBe(true);
    expect(new Uint8Array(await dl.arrayBuffer()).length).toBe(MINIMAL_PDF.length);
  });

  it("rejects a malware upload (EICAR) at scan time and deletes the object", async () => {
    const submissionId = randomUUID();
    const eicar = new TextEncoder().encode(EICAR_SIGNATURE);
    const auth = await authorizeInquiryUpload({
      submissionId,
      formVariant: "contact_full",
      filename: "sheet.csv",
      declaredMime: "text/csv",
      byteSize: eicar.length,
    });
    createdKeys.push(auth.storageKey);
    await putSigned(auth.uploadUrl, auth.headers, eicar);

    await expect(completeInquiryUpload({ submissionId, attachmentId: auth.attachmentId })).rejects.toMatchObject({
      reason: "scan_rejected",
    });

    // Object removed; row marked failed with no usable token.
    const { data } = await admin
      .from("inquiry_attachments")
      .select("upload_status, scan_status, attachment_token_hash")
      .eq("id", auth.attachmentId)
      .single();
    expect(data!.upload_status).toBe("failed");
    expect(data!.scan_status).toBe("rejected");
    expect(data!.attachment_token_hash).toBeNull();
  });

  it("denies anonymous download of a private object", async () => {
    const submissionId = randomUUID();
    const auth = await authorizeInquiryUpload({
      submissionId,
      formVariant: "contact_full",
      filename: "secret.pdf",
      declaredMime: "application/pdf",
      byteSize: MINIMAL_PDF.length,
    });
    createdKeys.push(auth.storageKey);
    await putSigned(auth.uploadUrl, auth.headers, MINIMAL_PDF);
    await completeInquiryUpload({ submissionId, attachmentId: auth.attachmentId });

    const anon = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data, error } = await anon.storage.from(bucket).download(auth.storageKey);
    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it("removes a not-yet-associated upload and deletes its object", async () => {
    const submissionId = randomUUID();
    const auth = await authorizeInquiryUpload({
      submissionId,
      formVariant: "services_compact",
      filename: "extra.pdf",
      declaredMime: "application/pdf",
      byteSize: MINIMAL_PDF.length,
    });
    await putSigned(auth.uploadUrl, auth.headers, MINIMAL_PDF);
    await completeInquiryUpload({ submissionId, attachmentId: auth.attachmentId });

    await deleteInquiryUpload(submissionId, auth.attachmentId);

    const { data } = await admin.storage.from(bucket).download(auth.storageKey);
    expect(data).toBeNull();
    const { data: row } = await admin
      .from("inquiry_attachments")
      .select("id")
      .eq("id", auth.attachmentId)
      .maybeSingle();
    expect(row).toBeNull();
  });

  it("rejects an unsupported type at authorize", async () => {
    await expect(
      authorizeInquiryUpload({
        submissionId: randomUUID(),
        formVariant: "contact_full",
        filename: "malware.exe",
        declaredMime: "application/octet-stream",
        byteSize: 1024,
      }),
    ).rejects.toBeInstanceOf(UploadError);
  });
});
