import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AuthorizeUploadInput,
  AuthorizeUploadResult,
  InquiryStorageProvider,
  ObjectMetadata,
  SignedDownload,
} from "./inquiry-storage-provider";
import { getInquiryStorageConfig } from "./inquiry-storage-config";

// Supabase Storage provider (spec §11 / Work Order E Step 9). The SAME class
// runs against the local Docker stack and (after owner approval) production —
// only NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY / bucket change. The
// service-role key is used SERVER-SIDE ONLY: it never has a NEXT_PUBLIC_ prefix,
// is never returned to the browser, and is never logged. Fails CLOSED when
// configuration is absent.

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error("Inquiry storage is not configured (missing Supabase URL or secret key).");
  }
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function baseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Inquiry storage is not configured (missing Supabase URL).");
  return url.replace(/\/+$/, "");
}

export class SupabaseInquiryStorageProvider implements InquiryStorageProvider {
  private readonly bucket: string;

  constructor(
    private readonly client: SupabaseClient = getServiceClient(),
    bucket: string = getInquiryStorageConfig().bucket,
  ) {
    this.bucket = bucket;
  }

  async authorizeUpload(input: AuthorizeUploadInput): Promise<AuthorizeUploadResult> {
    // Short-lived signed upload into the private bucket. The token authorizes
    // exactly this key; no bucket-wide credential leaves the server.
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUploadUrl(input.storageKey, { upsert: false });
    if (error || !data) {
      throw new Error(`Failed to authorize upload: ${error?.message ?? "unknown"}`);
    }
    // supabase-js returns a path; qualify it against the Storage REST base.
    const signed = data.signedUrl.startsWith("http")
      ? data.signedUrl
      : `${baseUrl()}/storage/v1${data.signedUrl.startsWith("/") ? "" : "/"}${data.signedUrl}`;
    return {
      uploadUrl: signed,
      method: "PUT",
      headers: {
        "content-type": input.contentType,
        "cache-control": "3600",
        "x-upsert": "false",
      },
      storageKey: input.storageKey,
      expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000).toISOString(),
    };
  }

  async objectExists(storageKey: string): Promise<boolean> {
    return (await this.getObjectMetadata(storageKey)).exists;
  }

  async getObjectMetadata(storageKey: string): Promise<ObjectMetadata> {
    const slash = storageKey.lastIndexOf("/");
    const dir = slash >= 0 ? storageKey.slice(0, slash) : "";
    const name = slash >= 0 ? storageKey.slice(slash + 1) : storageKey;
    const { data, error } = await this.client.storage.from(this.bucket).list(dir, {
      search: name,
      limit: 100,
    });
    if (error) throw new Error(`Failed to read object metadata: ${error.message}`);
    const found = data?.find((o) => o.name === name);
    if (!found) return { exists: false, size: 0, contentType: null };
    const meta = found.metadata as { size?: number; mimetype?: string } | null;
    return {
      exists: true,
      size: meta?.size ?? 0,
      contentType: meta?.mimetype ?? null,
    };
  }

  async verifyUploadedObject(storageKey: string, maxBytes: number) {
    const metadata = await this.getObjectMetadata(storageKey);
    if (!metadata.exists) {
      return { metadata, head: new Uint8Array(), bytes: new Uint8Array() };
    }
    const { data, error } = await this.client.storage.from(this.bucket).download(storageKey);
    if (error || !data) {
      throw new Error(`Failed to download object for verification: ${error?.message ?? "unknown"}`);
    }
    const full = new Uint8Array(await data.arrayBuffer());
    const bytes = full.length > maxBytes ? full.subarray(0, maxBytes) : full;
    const head = full.subarray(0, Math.min(full.length, 512));
    return { metadata, head, bytes };
  }

  async deleteObject(storageKey: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([storageKey]);
    // Idempotent: a missing object is not an error for cleanup/remove flows.
    if (error && !/not.*found/i.test(error.message)) {
      throw new Error(`Failed to delete object: ${error.message}`);
    }
  }

  async createSignedDownload(storageKey: string, expiresInSeconds: number): Promise<SignedDownload> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(storageKey, expiresInSeconds);
    if (error || !data) {
      throw new Error(`Failed to create signed download: ${error?.message ?? "unknown"}`);
    }
    const url = data.signedUrl.startsWith("http")
      ? data.signedUrl
      : `${baseUrl()}/storage/v1${data.signedUrl.startsWith("/") ? "" : "/"}${data.signedUrl}`;
    return {
      url,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    };
  }
}
