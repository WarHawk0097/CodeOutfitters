import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { authorizeInquiryUpload, completeInquiryUpload } from "./inquiry-upload-service";
import { cleanupInquiryOrphans } from "./inquiry-orphan-cleanup";

// Work Order E Step 15 — orphan cleanup against real Docker Supabase Storage.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const secret = process.env.SUPABASE_SECRET_KEY!;
const bucket = process.env.INQUIRY_STORAGE_BUCKET ?? "inquiry-attachments";
const admin = createClient(url, secret, { auth: { persistSession: false } });
const PDF = new TextEncoder().encode("%PDF-1.4\n%%EOF\n");
const keys: string[] = [];

async function put(u: string, h: Record<string, string>, b: Uint8Array) {
  const r = await fetch(u, { method: "PUT", headers: h, body: b });
  if (!r.ok) throw new Error(`PUT ${r.status}`);
}

afterAll(async () => {
  for (const k of keys) await admin.storage.from(bucket).remove([k]).catch(() => {});
});

describe("WO-E orphan cleanup", () => {
  it("removes an expired authorization but keeps a fresh authorized upload", async () => {
    const expiredSid = randomUUID();
    const expired = await authorizeInquiryUpload({
      submissionId: expiredSid,
      formVariant: "contact_full",
      filename: "old.pdf",
      declaredMime: "application/pdf",
      byteSize: PDF.length,
    });
    keys.push(expired.storageKey);
    await put(expired.uploadUrl, expired.headers, PDF);
    // Force its authorization window into the past.
    await admin
      .from("inquiry_attachments")
      .update({ authorization_expires_at: new Date(Date.now() - 60_000).toISOString() })
      .eq("id", expired.attachmentId);

    const freshSid = randomUUID();
    const fresh = await authorizeInquiryUpload({
      submissionId: freshSid,
      formVariant: "contact_full",
      filename: "new.pdf",
      declaredMime: "application/pdf",
      byteSize: PDF.length,
    });
    keys.push(fresh.storageKey);

    const result = await cleanupInquiryOrphans();
    expect(result.byReason.expired_authorization ?? 0).toBeGreaterThanOrEqual(1);

    const gone = await admin.from("inquiry_attachments").select("id").eq("id", expired.attachmentId).maybeSingle();
    expect(gone.data).toBeNull();
    const kept = await admin.from("inquiry_attachments").select("id").eq("id", fresh.attachmentId).maybeSingle();
    expect(kept.data).not.toBeNull();
  });

  it("never removes an associated attachment", async () => {
    // A completed upload with a consumed token stands in for an associated one.
    const sid = randomUUID();
    const a = await authorizeInquiryUpload({
      submissionId: sid,
      formVariant: "contact_full",
      filename: "keep.pdf",
      declaredMime: "application/pdf",
      byteSize: PDF.length,
    });
    keys.push(a.storageKey);
    await put(a.uploadUrl, a.headers, PDF);
    await completeInquiryUpload({ submissionId: sid, attachmentId: a.attachmentId });
    await admin
      .from("inquiry_attachments")
      .update({
        submission_id: sid,
        token_consumed_at: new Date().toISOString(),
        upload_completed_at: new Date(Date.now() - 72 * 3600_000).toISOString(),
      })
      .eq("id", a.attachmentId);

    await cleanupInquiryOrphans();
    const kept = await admin.from("inquiry_attachments").select("id").eq("id", a.attachmentId).maybeSingle();
    expect(kept.data).not.toBeNull();
  });
});
