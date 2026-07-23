import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { InquirySubmissionRequest } from "../inquiry-schema";
import type {
  InquiryRepository,
  PersistResult,
  EmailEventStatus,
} from "./inquiry-repository";
import { idempotencyConflict, isIdempotencyConflict, serverError } from "./inquiry-errors";
import { toSubmitPayload } from "./inquiry-submit-payload";

// Server-only Supabase client using the SERVICE-ROLE (secret) key. This key
// bypasses RLS and is the sole write path. It MUST NOT use a NEXT_PUBLIC_
// prefix, be imported by a Client Component, or be returned/logged (owner C).
function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    // Fail closed — never fall back to the anon key for a privileged write.
    throw new Error("Inquiry backend is not configured (missing Supabase URL or secret key).");
  }
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export class SupabaseInquiryRepository implements InquiryRepository {
  // Lazily created so importing this module (e.g. for types) never requires the
  // secret to be present, but any actual persist() call does.
  constructor(private readonly client: SupabaseClient = getServiceClient()) {}

  async persist(
    payload: InquirySubmissionRequest,
    fingerprint: string,
  ): Promise<PersistResult> {
    const { data, error } = await this.client.rpc("submit_inquiry", {
      p_payload: toSubmitPayload(payload),
      p_fingerprint: fingerprint,
    });

    if (error) {
      if (isIdempotencyConflict(error)) throw idempotencyConflict();
      // Do not leak the DB error to the client; map to a safe server error.
      throw serverError();
    }

    const row = data as {
      lead_id: string;
      submission_id: string;
      status: "received";
      replay: boolean;
    };
    return {
      leadId: row.lead_id,
      submissionId: row.submission_id,
      status: row.status,
      replay: row.replay,
    };
  }

  async markEmailEvent(
    submissionId: string,
    emailType: "visitor_confirmation" | "internal_notification",
    status: EmailEventStatus,
    providerId?: string,
  ): Promise<void> {
    // Best-effort: swallow errors so a status-update failure never surfaces as
    // an inquiry failure (the lead is already committed).
    await this.client
      .from("email_events")
      .update({ status, ...(providerId ? { provider_id: providerId } : {}) })
      .eq("submission_id", submissionId)
      .eq("email_type", emailType);
  }
}
