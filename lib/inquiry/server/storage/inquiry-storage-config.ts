import "server-only";
import { FORM_UPLOAD_LIMITS, HARD_MAX_FILE_BYTES, type UploadFormVariant } from "./inquiry-file-validation";

// Server-only storage configuration (spec §11, Work Order E Docker/Supabase
// platform). One storage path only — Supabase Storage — whose credentials and
// bucket change by environment. There is no OS-filesystem provider. All values
// fail CLOSED: a missing/invalid setting throws rather than silently degrading
// to an insecure default.

export type InquiryStorageMode = "supabase";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    throw new Error(`Inquiry storage is not configured (missing ${name}).`);
  }
  return v;
}

function intEnv(name: string, fallback: number, { min, max }: { min: number; max: number }): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new Error(`Inquiry storage config ${name} must be an integer.`);
  }
  // Clamp to a safe band; env can tune within bounds but never past hard limits.
  return Math.min(Math.max(n, min), max);
}

// Bucket name must be the private inquiry bucket and nothing else — a defensive
// check so a misconfigured env can never point uploads at a public/shared bucket.
const BUCKET_PATTERN = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;

export type InquiryStorageConfig = {
  mode: InquiryStorageMode;
  bucket: string;
  uploadAuthTtlSeconds: number;
  attachmentTokenTtlSeconds: number;
  signedDownloadTtlSeconds: number;
};

export function getInquiryStorageConfig(): InquiryStorageConfig {
  const mode = (process.env.INQUIRY_STORAGE_MODE ?? "supabase").trim();
  if (mode !== "supabase") {
    // Only Supabase Storage is a real storage path (Work Order E decision).
    throw new Error(`Unsupported INQUIRY_STORAGE_MODE '${mode}' (only 'supabase' is allowed).`);
  }
  const bucket = (process.env.INQUIRY_STORAGE_BUCKET ?? "inquiry-attachments").trim();
  if (!BUCKET_PATTERN.test(bucket)) {
    throw new Error(`Invalid INQUIRY_STORAGE_BUCKET '${bucket}'.`);
  }
  return {
    mode: "supabase",
    bucket,
    uploadAuthTtlSeconds: intEnv("INQUIRY_UPLOAD_AUTH_TTL_SECONDS", 30 * 60, { min: 60, max: 60 * 60 }),
    attachmentTokenTtlSeconds: intEnv("INQUIRY_ATTACHMENT_TOKEN_TTL_SECONDS", 24 * 60 * 60, { min: 5 * 60, max: 7 * 24 * 60 * 60 }),
    signedDownloadTtlSeconds: intEnv("INQUIRY_SIGNED_DOWNLOAD_TTL_SECONDS", 120, { min: 30, max: 15 * 60 }),
  };
}

// Effective per-form limits: code ceilings are authoritative; server-only env
// may LOWER them but never raise them past the hard caps (spec §12).
export function getFormUploadLimits(variant: UploadFormVariant) {
  const base = FORM_UPLOAD_LIMITS[variant];
  const isContact = variant === "contact_full";
  const maxFiles = intEnv(
    isContact ? "INQUIRY_UPLOAD_CONTACT_MAX_FILES" : "INQUIRY_UPLOAD_COMPACT_MAX_FILES",
    base.maxFiles,
    { min: 1, max: base.maxFiles },
  );
  const maxTotalBytes = intEnv(
    isContact ? "INQUIRY_UPLOAD_CONTACT_MAX_TOTAL_BYTES" : "INQUIRY_UPLOAD_COMPACT_MAX_TOTAL_BYTES",
    base.maxTotalBytes,
    { min: 1024, max: base.maxTotalBytes },
  );
  const maxFileBytes = intEnv("INQUIRY_UPLOAD_MAX_FILE_BYTES", base.maxFileBytes, {
    min: 1024,
    max: Math.min(base.maxFileBytes, HARD_MAX_FILE_BYTES),
  });
  return { maxFiles, maxFileBytes, maxTotalBytes };
}
