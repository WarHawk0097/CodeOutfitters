import "server-only";

// Storage provider abstraction (spec §11 / Work Order E Step 9). ONE
// production-capable interface with ONE Supabase-backed implementation; local
// and production differ only by environment (URL/key/bucket), never by code
// path. No OS-filesystem provider exists. Mocks are permitted ONLY in isolated
// unit tests, never on the browser-QA / integration path.

export type AuthorizeUploadInput = {
  // Server-generated object key (spec §11 key layout). The browser never
  // chooses or sees the raw key beyond what the signed URL encodes.
  storageKey: string;
  contentType: string;
  expiresInSeconds: number;
};

export type AuthorizeUploadResult = {
  // Fully-qualified URL the browser PUTs the file bytes to (short-lived signed
  // upload). No service-role key or bucket-wide credential is exposed.
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  storageKey: string;
  expiresAt: string; // ISO
};

export type ObjectMetadata = {
  exists: boolean;
  size: number;
  contentType: string | null;
};

export type SignedDownload = {
  url: string;
  expiresAt: string; // ISO
};

export interface InquiryStorageProvider {
  authorizeUpload(input: AuthorizeUploadInput): Promise<AuthorizeUploadResult>;
  objectExists(storageKey: string): Promise<boolean>;
  getObjectMetadata(storageKey: string): Promise<ObjectMetadata>;
  // Reads enough bytes for signature verification (spec §11 completion step).
  verifyUploadedObject(storageKey: string, maxBytes: number): Promise<{
    metadata: ObjectMetadata;
    head: Uint8Array;
    bytes: Uint8Array; // full object bytes (for scanning); bounded by caller
  }>;
  deleteObject(storageKey: string): Promise<void>;
  createSignedDownload(storageKey: string, expiresInSeconds: number): Promise<SignedDownload>;
}
