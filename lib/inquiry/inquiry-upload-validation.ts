// Client-side attachment validation (spec §11). PREPARED ONLY — Work Order D
// does not activate uploads: no file leaves the browser, no token is issued, and
// nothing is ever reported as "uploaded". This module is the client mirror of
// the server-authoritative allow-list so a user gets fast feedback; the server
// re-validates when uploads are activated in Work Order E.
//
// Allowed types come verbatim from spec §11: PDF, DOC, DOCX, XLSX, CSV, PNG,
// JPG/JPEG.
export const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xlsx",
  "csv",
  "png",
  "jpg",
  "jpeg",
] as const;

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/png",
  "image/jpeg",
]);

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB client hint
export const MAX_FILES = 10; // matches attachmentTokens max in the contract

// Per-form caps (Work Order E). Client mirror of the server FORM_UPLOAD_LIMITS
// in lib/inquiry/server/storage/inquiry-file-validation.ts — the server stays
// authoritative; these only drive fast UX feedback. Only these three variants
// accept uploads; popups/contextual placements never mount the uploader.
export const FORM_UPLOAD_LIMITS_CLIENT = {
  contact_full: { maxFiles: 5, maxFileBytes: MAX_FILE_BYTES, maxTotalBytes: 25 * 1024 * 1024 },
  services_compact: { maxFiles: 2, maxFileBytes: MAX_FILE_BYTES, maxTotalBytes: 15 * 1024 * 1024 },
  industries_compact: { maxFiles: 2, maxFileBytes: MAX_FILE_BYTES, maxTotalBytes: 15 * 1024 * 1024 },
} as const;

export type UploadFormVariantClient = keyof typeof FORM_UPLOAD_LIMITS_CLIENT;

// The `accept` attribute for the file picker — extensions the allow-list permits.
export const UPLOAD_ACCEPT_ATTRIBUTE = ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",");

export type RejectedFile = { name: string; reason: string };
export type FileValidationResult = {
  accepted: File[];
  rejected: RejectedFile[];
};

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function isAllowedType(file: File): boolean {
  if (file.type && ALLOWED_MIME_TYPES.has(file.type)) return true;
  // Some browsers report an empty/generic type; fall back to extension.
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(extensionOf(file.name));
}

// Validates a candidate selection against an already-accepted set (so re-adding
// respects the 10-file cap). Pure and DOM-free for unit testing.
export function validateFiles(
  candidates: File[],
  existing: File[] = [],
): FileValidationResult {
  const accepted: File[] = [];
  const rejected: RejectedFile[] = [];
  let count = existing.length;

  for (const file of candidates) {
    if (count >= MAX_FILES) {
      rejected.push({ name: file.name, reason: `Only ${MAX_FILES} files allowed.` });
      continue;
    }
    if (!isAllowedType(file)) {
      rejected.push({ name: file.name, reason: "Unsupported file type." });
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      rejected.push({ name: file.name, reason: "File is larger than 10 MB." });
      continue;
    }
    accepted.push(file);
    count += 1;
  }

  return { accepted, rejected };
}
