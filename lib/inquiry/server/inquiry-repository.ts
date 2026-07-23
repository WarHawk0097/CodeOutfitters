import "server-only";
import type { InquirySubmissionRequest } from "../inquiry-schema";

// The persistence boundary the service depends on. Keeping it an interface lets
// tests inject a fake and lets the atomic transaction live behind one method —
// callers cannot accidentally do non-atomic multi-step writes.
export type PersistResult = {
  leadId: string;
  submissionId: string;
  status: "received";
  replay: boolean;
};

export type EmailEventStatus = "sent" | "failed" | "delayed";

export interface InquiryRepository {
  // Executes the full atomic persistence transaction (public.submit_inquiry).
  persist(
    payload: InquirySubmissionRequest,
    fingerprint: string,
  ): Promise<PersistResult>;

  // Post-commit email lifecycle update (spec §16). Best-effort: a failure here
  // never fails the inquiry, since the lead is already durably persisted.
  markEmailEvent(
    submissionId: string,
    emailType: "visitor_confirmation" | "internal_notification",
    status: EmailEventStatus,
    providerId?: string,
  ): Promise<void>;
}
