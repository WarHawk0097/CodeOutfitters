import "server-only";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getInquiryStorageConfig, getFormUploadLimits } from "./inquiry-storage-config";
import { getInquiryStorageProvider, getInquiryFileScanner } from "./inquiry-storage";
import {
  validateUploadedFile,
  EXT_TO_MIME,
  extensionOf,
  type UploadFormVariant,
} from "./inquiry-file-validation";
import { ALLOWED_EXTENSIONS } from "../../inquiry-upload-validation";
import { sanitizeFilename } from "./inquiry-filename";
import { mintAttachmentToken, hashAttachmentToken } from "./inquiry-upload-token";
import type { ScanStatus } from "./inquiry-file-scanner";

// Two-phase inquiry upload service (Work Order E Steps 10/12/13). Phase 1
// (authorize) validates the declared file, generates the server-owned object
// key, records an `authorized` row and returns a short-lived signed PUT URL.
// Phase 2 (complete) downloads the real bytes, verifies signature/size, scans
// for malware, and only on a clean scan mints a single-use opaque attachment
// token (SHA-256 at rest) the final submit consumes. The browser never chooses
// a key and never receives the service-role key.

// Public, non-PII failure taxonomy the client/analytics can surface.
export type UploadRejectReason =
  | "unsupported_type"
  | "too_large"
  | "too_many"
  | "total_exceeded"
  | "empty_file"
  | "signature_mismatch"
  | "scan_rejected"
  | "scan_unavailable"
  | "not_found"
  | "already_completed"
  | "expired";

export class UploadError extends Error {
  constructor(
    readonly status: number,
    readonly reason: UploadRejectReason,
    message: string,
  ) {
    super(message);
    this.name = "UploadError";
  }
}

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error("Inquiry upload is not configured (missing Supabase URL or secret key).");
  }
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type AuthorizeInput = {
  submissionId: string; // client-generated provisional submission id (uuid)
  formVariant: UploadFormVariant;
  filename: string;
  declaredMime: string;
  byteSize: number; // declared size, verified for real at complete time
};

export type AuthorizeResult = {
  attachmentId: string;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  storageKey: string;
  expiresAt: string;
};

export type CompleteInput = {
  submissionId: string;
  attachmentId: string;
};

export type CompleteResult = {
  attachmentId: string;
  scanStatus: ScanStatus;
  // Present ONLY when scan is clean — the raw single-use token, returned once.
  attachmentToken?: string;
  detectedMime: string;
  byteSize: number;
};

function allowedExtensionOf(filename: string): string | null {
  const ext = extensionOf(filename);
  return ext && (ALLOWED_EXTENSIONS as readonly string[]).includes(ext) ? ext : null;
}

export async function authorizeInquiryUpload(input: AuthorizeInput): Promise<AuthorizeResult> {
  const config = getInquiryStorageConfig();
  const limits = getFormUploadLimits(input.formVariant);
  const db = getServiceClient();

  if (input.byteSize <= 0) {
    throw new UploadError(422, "empty_file", "Empty file.");
  }
  if (input.byteSize > limits.maxFileBytes) {
    throw new UploadError(422, "too_large", "File exceeds the per-file size limit.");
  }
  const ext = allowedExtensionOf(input.filename);
  if (!ext) {
    throw new UploadError(422, "unsupported_type", "Unsupported file type.");
  }
  // Trust the extension→MIME mapping, not the browser-declared MIME. Declared
  // MIME must at least be consistent with the extension.
  const expectedMime = EXT_TO_MIME[ext];
  if (input.declaredMime && input.declaredMime !== expectedMime && ext !== "jpg" && ext !== "jpeg") {
    // jpg/jpeg both map to image/jpeg; otherwise require a match.
    if (!(expectedMime === "image/jpeg" && input.declaredMime === "image/jpeg")) {
      throw new UploadError(422, "unsupported_type", "Declared type does not match the file extension.");
    }
  }

  // Enforce per-form count and total across the in-progress set (authorized +
  // completed rows for this provisional submission).
  const { data: existing, error: listErr } = await db
    .from("inquiry_attachments")
    .select("byte_size")
    .eq("provisional_submission_id", input.submissionId)
    .in("upload_status", ["authorized", "completed"]);
  if (listErr) throw new Error(`Failed to read existing attachments: ${listErr.message}`);
  const rows = existing ?? [];
  if (rows.length + 1 > limits.maxFiles) {
    throw new UploadError(422, "too_many", "Too many files for this form.");
  }
  const currentTotal = rows.reduce((sum, r) => sum + (r.byte_size ?? 0), 0);
  if (currentTotal + input.byteSize > limits.maxTotalBytes) {
    throw new UploadError(422, "total_exceeded", "Total upload size exceeds the limit.");
  }

  const attachmentId = randomUUID();
  const sanitized = sanitizeFilename(input.filename, ext);
  const storageKey = `inquiries/${input.submissionId}/${attachmentId}/${sanitized}`;
  const provider = getInquiryStorageProvider();
  const authorization = await provider.authorizeUpload({
    storageKey,
    contentType: expectedMime,
    expiresInSeconds: config.uploadAuthTtlSeconds,
  });

  const { error: insertErr } = await db.from("inquiry_attachments").insert({
    id: attachmentId,
    provisional_submission_id: input.submissionId,
    storage_bucket: config.bucket,
    storage_key: storageKey,
    original_filename: input.filename,
    sanitized_filename: sanitized,
    declared_mime_type: expectedMime,
    byte_size: input.byteSize,
    upload_status: "authorized",
    scan_status: "pending",
    authorization_expires_at: authorization.expiresAt,
  });
  if (insertErr) {
    // Roll back the (empty) object slot best-effort; row never persisted.
    await provider.deleteObject(storageKey).catch(() => {});
    throw new Error(`Failed to record authorized upload: ${insertErr.message}`);
  }

  return {
    attachmentId,
    uploadUrl: authorization.uploadUrl,
    method: "PUT",
    headers: authorization.headers,
    storageKey,
    expiresAt: authorization.expiresAt,
  };
}

export async function completeInquiryUpload(input: CompleteInput): Promise<CompleteResult> {
  const config = getInquiryStorageConfig();
  const db = getServiceClient();
  const provider = getInquiryStorageProvider();

  const { data: row, error } = await db
    .from("inquiry_attachments")
    .select(
      "id, provisional_submission_id, storage_key, original_filename, declared_mime_type, upload_status, authorization_expires_at",
    )
    .eq("id", input.attachmentId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load attachment: ${error.message}`);
  if (!row || row.provisional_submission_id !== input.submissionId) {
    throw new UploadError(404, "not_found", "Attachment not found.");
  }
  if (row.upload_status === "completed") {
    // Idempotent replay: safe to re-run without a new token/side effect.
    throw new UploadError(409, "already_completed", "Upload already completed.");
  }
  if (row.upload_status !== "authorized") {
    throw new UploadError(409, "already_completed", "Upload is not awaiting completion.");
  }
  if (row.authorization_expires_at && new Date(row.authorization_expires_at).getTime() < Date.now()) {
    await failAttachment(db, provider, input.attachmentId, row.storage_key);
    throw new UploadError(410, "expired", "Upload authorization has expired.");
  }

  const limits = getFormUploadLimits("contact_full"); // hard per-file ceiling
  const { metadata, bytes } = await provider.verifyUploadedObject(row.storage_key, limits.maxFileBytes);
  if (!metadata.exists) {
    await failAttachment(db, provider, input.attachmentId, row.storage_key);
    throw new UploadError(404, "not_found", "Uploaded object not found.");
  }

  const check = validateUploadedFile({
    filename: row.original_filename,
    declaredMime: row.declared_mime_type,
    byteSize: metadata.size || bytes.length,
    bytes,
  });
  if (!check.ok) {
    await failAttachment(db, provider, input.attachmentId, row.storage_key);
    const r = check.reason.toLowerCase();
    const reason: UploadRejectReason = r.includes("empty")
      ? "empty_file"
      : r.includes("larger") || r.includes("size")
        ? "too_large"
        : "signature_mismatch";
    throw new UploadError(422, reason, "The uploaded file failed verification.");
  }

  // Synchronous malware scan (ClamAV INSTREAM). Only a clean scan yields a token.
  const scanner = getInquiryFileScanner();
  const scan = await scanner.scan(bytes);
  const byteSize = metadata.size || bytes.length;

  if (scan.status === "rejected") {
    await failAttachment(db, provider, input.attachmentId, row.storage_key, "rejected", check.detectedMime, byteSize);
    throw new UploadError(422, "scan_rejected", "The uploaded file was rejected by the security scanner.");
  }
  if (scan.status !== "clean") {
    // failed/unavailable: keep the object (retryable), no token issued.
    await db
      .from("inquiry_attachments")
      .update({
        upload_status: "completed",
        upload_completed_at: new Date().toISOString(),
        detected_mime_type: check.detectedMime,
        byte_size: byteSize,
        scan_status: scan.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.attachmentId);
    throw new UploadError(422, "scan_unavailable", "The security scan could not be completed. Please retry.");
  }

  // Clean: mint the single-use opaque token; store only its hash.
  const rawToken = mintAttachmentToken();
  const tokenHash = hashAttachmentToken(rawToken);
  const tokenExpiresAt = new Date(Date.now() + config.attachmentTokenTtlSeconds * 1000).toISOString();
  const { error: updateErr } = await db
    .from("inquiry_attachments")
    .update({
      upload_status: "completed",
      upload_completed_at: new Date().toISOString(),
      detected_mime_type: check.detectedMime,
      byte_size: byteSize,
      scan_status: "clean",
      attachment_token_hash: tokenHash,
      attachment_token_expires_at: tokenExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.attachmentId);
  if (updateErr) throw new Error(`Failed to complete upload: ${updateErr.message}`);

  return {
    attachmentId: input.attachmentId,
    scanStatus: "clean",
    attachmentToken: rawToken,
    detectedMime: check.detectedMime,
    byteSize,
  };
}

export async function deleteInquiryUpload(submissionId: string, attachmentId: string): Promise<void> {
  const db = getServiceClient();
  const provider = getInquiryStorageProvider();
  const { data: row, error } = await db
    .from("inquiry_attachments")
    .select("id, provisional_submission_id, storage_key, submission_id, token_consumed_at")
    .eq("id", attachmentId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load attachment: ${error.message}`);
  if (!row || row.provisional_submission_id !== submissionId) {
    throw new UploadError(404, "not_found", "Attachment not found.");
  }
  // Never remove an attachment already associated with a submitted lead.
  if (row.submission_id || row.token_consumed_at) {
    throw new UploadError(409, "already_completed", "Attachment is already associated with a submission.");
  }
  await provider.deleteObject(row.storage_key);
  await db.from("inquiry_attachments").delete().eq("id", attachmentId);
}

async function failAttachment(
  db: SupabaseClient,
  provider: ReturnType<typeof getInquiryStorageProvider>,
  attachmentId: string,
  storageKey: string,
  scanStatus?: ScanStatus,
  detectedMime?: string,
  byteSize?: number,
): Promise<void> {
  await provider.deleteObject(storageKey).catch(() => {});
  await db
    .from("inquiry_attachments")
    .update({
      upload_status: "failed",
      ...(scanStatus ? { scan_status: scanStatus } : {}),
      ...(detectedMime ? { detected_mime_type: detectedMime } : {}),
      ...(byteSize ? { byte_size: byteSize } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", attachmentId)
    .then(() => undefined, () => undefined);
}
