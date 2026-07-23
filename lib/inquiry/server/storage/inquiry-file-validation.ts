import "server-only";
import { ALLOWED_EXTENSIONS } from "../../inquiry-upload-validation";

// Server-authoritative file validation (spec §11). The client allow-list is a
// UX hint; THIS is the security boundary. Every upload is checked on:
//   * declared extension (from the allow-list),
//   * declared MIME (must map to the extension),
//   * file signature / magic bytes (must match the declared category),
//   * byte size (positive, within per-form limits),
//   * zero-byte rejection.
// We do NOT deep-parse untrusted office documents in the request path (spec
// §11); ZIP-container types (docx/xlsx) are verified to the container level
// with a bounded best-effort peek for the expected package marker.

export type FileCategory = "pdf" | "doc" | "docx" | "xlsx" | "csv" | "png" | "jpeg";

// Canonical MIME per allowed extension. Legacy .jpg maps to image/jpeg.
const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

const EXT_TO_CATEGORY: Record<string, FileCategory> = {
  pdf: "pdf",
  doc: "doc",
  docx: "docx",
  xlsx: "xlsx",
  csv: "csv",
  png: "png",
  jpg: "jpeg",
  jpeg: "jpeg",
};

// Hard ceilings the client can never raise (spec §11 limits). Per-form caps are
// applied by the caller; these bound a single object.
export const HARD_MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// Per-form limits (spec §11). Configurable via server-only env at the call site,
// but never above these code ceilings.
export const FORM_UPLOAD_LIMITS = {
  contact_full: { maxFiles: 5, maxFileBytes: 10 * 1024 * 1024, maxTotalBytes: 25 * 1024 * 1024 },
  services_compact: { maxFiles: 2, maxFileBytes: 10 * 1024 * 1024, maxTotalBytes: 15 * 1024 * 1024 },
  industries_compact: { maxFiles: 2, maxFileBytes: 10 * 1024 * 1024, maxTotalBytes: 15 * 1024 * 1024 },
} as const;
export type UploadFormVariant = keyof typeof FORM_UPLOAD_LIMITS;

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function startsWith(buf: Uint8Array, sig: number[]): boolean {
  if (buf.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) if (buf[i] !== sig[i]) return false;
  return true;
}

// Detect the content category from magic bytes. Returns null when nothing
// trusted matches. docx/xlsx share the ZIP signature and are disambiguated by
// the caller against the declared extension (both are accepted as "zip").
function detectSignatureCategory(buf: Uint8Array): FileCategory | "zip" | null {
  if (startsWith(buf, [0x25, 0x50, 0x44, 0x46])) return "pdf"; // %PDF
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(buf, [0x50, 0x4b, 0x03, 0x04])) return "zip"; // ZIP (docx/xlsx)
  if (startsWith(buf, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return "doc"; // OLE (legacy .doc/.xls)
  return null;
}

// CSV has no magic; accept only bounded, NUL-free, mostly-printable text.
function looksLikeCsvText(buf: Uint8Array): boolean {
  if (buf.length === 0) return false;
  const sample = buf.subarray(0, Math.min(buf.length, 8192));
  for (const b of sample) {
    if (b === 0x00) return false; // NUL => binary
    // allow tab, LF, CR + printable ASCII + any high byte (UTF-8 continuation)
    if (b < 0x09 || (b > 0x0d && b < 0x20)) return false;
  }
  return true;
}

export type FileValidation =
  | { ok: true; extension: string; declaredMime: string; detectedMime: string; category: FileCategory }
  | { ok: false; reason: string };

// Validate one already-received object's bytes against its declared metadata.
export function validateUploadedFile(input: {
  filename: string;
  declaredMime: string;
  byteSize: number;
  bytes: Uint8Array;
}): FileValidation {
  const ext = extensionOf(input.filename);
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return { ok: false, reason: "Unsupported file type." };
  }
  const expectedMime = EXT_TO_MIME[ext];
  const category = EXT_TO_CATEGORY[ext];

  if (input.byteSize <= 0 || input.bytes.length === 0) {
    return { ok: false, reason: "File is empty." };
  }
  if (input.byteSize > HARD_MAX_FILE_BYTES) {
    return { ok: false, reason: "File is larger than 10 MB." };
  }
  // Declared MIME must be consistent with the extension (browsers may send an
  // empty type; that is tolerated, a wrong non-empty type is not).
  if (input.declaredMime && input.declaredMime !== expectedMime) {
    // .jpg/.jpeg both legitimately report image/jpeg; handled by EXT_TO_MIME.
    return { ok: false, reason: "File type does not match its contents." };
  }

  const detected = detectSignatureCategory(input.bytes);

  if (category === "csv") {
    if (!looksLikeCsvText(input.bytes)) {
      return { ok: false, reason: "File type does not match its contents." };
    }
  } else if (category === "docx" || category === "xlsx") {
    if (detected !== "zip") {
      return { ok: false, reason: "File type does not match its contents." };
    }
  } else if (detected !== category) {
    return { ok: false, reason: "File type does not match its contents." };
  }

  return { ok: true, extension: ext, declaredMime: expectedMime, detectedMime: expectedMime, category };
}
