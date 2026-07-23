import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import type { InquirySubmissionRequest } from "../inquiry-schema";
import type {
  InquiryRepository,
  PersistResult,
  EmailEventStatus,
} from "./inquiry-repository";
import { idempotencyConflict, isIdempotencyConflict, serverError } from "./inquiry-errors";
import { toSubmitPayload } from "./inquiry-submit-payload";

// LOCAL / TEST ONLY repository (owner directive: "use the safe local
// repository/test mode"). Runs the REAL migration inside an embedded Postgres
// (PGlite, no Docker, no network) so POST /api/inquiries persists and enforces
// idempotency exactly like production — WITHOUT touching Supabase. Selected only
// when INQUIRY_REPOSITORY_MODE=pglite; the factory fails closed in production.
//
// A single in-process database is shared across requests (and HMR reloads) so
// idempotent replay and duplicate detection work within a dev session. Data is
// in-memory and vanishes when the server stops — that is the point.
const MIGRATION_PATH = join(process.cwd(), "supabase", "migrations", "20260723_inquiry_backend.sql");

type GlobalWithDb = typeof globalThis & { __inquiryPglite?: Promise<PGlite> };

async function initDb(): Promise<PGlite> {
  const db = new PGlite({ extensions: { citext } });
  // Roles the migration's GRANT/REVOKE reference; absent in bare Postgres.
  await db.exec("create role anon; create role authenticated; create role service_role;");
  await db.exec(readFileSync(MIGRATION_PATH, "utf8"));
  return db;
}

function getDb(): Promise<PGlite> {
  const g = globalThis as GlobalWithDb;
  if (!g.__inquiryPglite) g.__inquiryPglite = initDb();
  return g.__inquiryPglite;
}

export class PgliteInquiryRepository implements InquiryRepository {
  async persist(
    payload: InquirySubmissionRequest,
    fingerprint: string,
  ): Promise<PersistResult> {
    const db = await getDb();
    try {
      const res = await db.query<{
        result: { lead_id: string; submission_id: string; status: "received"; replay: boolean };
      }>("select public.submit_inquiry($1::jsonb, $2) as result", [
        JSON.stringify(toSubmitPayload(payload)),
        fingerprint,
      ]);
      const row = res.rows[0]!.result;
      return {
        leadId: row.lead_id,
        submissionId: row.submission_id,
        status: row.status,
        replay: row.replay,
      };
    } catch (err) {
      if (isIdempotencyConflict(err)) throw idempotencyConflict();
      throw serverError();
    }
  }

  async markEmailEvent(
    submissionId: string,
    emailType: "visitor_confirmation" | "internal_notification",
    status: EmailEventStatus,
    providerId?: string,
  ): Promise<void> {
    // Best-effort, mirrors the Supabase repo: never fail the (committed) inquiry.
    try {
      const db = await getDb();
      await db.query(
        "update public.email_events set status = $1, provider_id = coalesce($2, provider_id) where submission_id = $3 and email_type = $4",
        [status, providerId ?? null, submissionId, emailType],
      );
    } catch {
      // swallow — status update is non-critical
    }
  }
}
