import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getInquiryStorageProvider } from "./inquiry-storage";

// Orphan cleanup (Work Order E Step 15). Reclaims storage + rows that never
// became part of a submitted Lead, WITHOUT ever touching an associated
// attachment. Safe to run repeatedly (idempotent) and safe to run locally on a
// schedule the owner controls — this file installs no cron itself.
//
// Removed (object + row):
//   * authorized uploads whose authorization window has expired,
//   * completed-but-unsubmitted uploads older than the retention window,
//   * failed uploads older than the retention window.
// Never removed:
//   * anything with submission_id set or token_consumed_at set (associated),
//   * anything still within its retention/authorization window.
//
// Logs are structured and PII-free: only ids, states, and counts — never
// filenames, emails, tokens, or storage contents.

export type OrphanCleanupResult = {
  scanned: number;
  removed: number;
  objectsDeleted: number;
  skippedAssociated: number;
  byReason: Record<string, number>;
};

type OrphanRow = {
  id: string;
  storage_key: string;
  upload_status: string;
  scan_status: string | null;
  submission_id: string | null;
  token_consumed_at: string | null;
  authorization_expires_at: string | null;
  upload_completed_at: string | null;
  created_at: string;
};

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error("Inquiry orphan cleanup is not configured (missing Supabase URL or secret key).");
  }
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}

function retentionMs(): number {
  const hours = Number(process.env.INQUIRY_ORPHAN_RETENTION_HOURS ?? "24");
  return (Number.isFinite(hours) && hours > 0 ? hours : 24) * 60 * 60 * 1000;
}

function classifyOrphan(row: OrphanRow, now: number, retention: number): string | null {
  // Never touch an associated attachment.
  if (row.submission_id || row.token_consumed_at) return null;

  if (row.upload_status === "authorized") {
    const exp = row.authorization_expires_at ? new Date(row.authorization_expires_at).getTime() : 0;
    return exp && exp < now ? "expired_authorization" : null;
  }
  if (row.upload_status === "failed") {
    return new Date(row.created_at).getTime() < now - retention ? "failed" : null;
  }
  if (row.upload_status === "completed") {
    const completed = row.upload_completed_at ? new Date(row.upload_completed_at).getTime() : new Date(row.created_at).getTime();
    return completed < now - retention ? "completed_unsubmitted" : null;
  }
  return null;
}

export async function cleanupInquiryOrphans(): Promise<OrphanCleanupResult> {
  const db = getServiceClient();
  const provider = getInquiryStorageProvider();
  const now = Date.now();
  const retention = retentionMs();

  const { data, error } = await db
    .from("inquiry_attachments")
    .select(
      "id, storage_key, upload_status, scan_status, submission_id, token_consumed_at, authorization_expires_at, upload_completed_at, created_at",
    )
    .is("submission_id", null)
    .is("token_consumed_at", null);
  if (error) throw new Error(`Orphan cleanup failed to scan attachments: ${error.message}`);

  const rows = (data ?? []) as OrphanRow[];
  const result: OrphanCleanupResult = {
    scanned: rows.length,
    removed: 0,
    objectsDeleted: 0,
    skippedAssociated: 0,
    byReason: {},
  };

  for (const row of rows) {
    const reason = classifyOrphan(row, now, retention);
    if (!reason) {
      result.skippedAssociated += 1;
      continue;
    }
    // Delete the object first (idempotent — a missing object is fine), then the
    // row. If the object delete throws for a real reason, skip the row so the
    // next run retries rather than orphaning storage.
    try {
      await provider.deleteObject(row.storage_key);
      result.objectsDeleted += 1;
    } catch {
      continue;
    }
    const { error: delErr } = await db.from("inquiry_attachments").delete().eq("id", row.id);
    if (delErr) continue;
    result.removed += 1;
    result.byReason[reason] = (result.byReason[reason] ?? 0) + 1;
  }

  // Structured, PII-free summary log.
  console.log(
    JSON.stringify({ event: "inquiry_orphan_cleanup", ...result }),
  );
  return result;
}
