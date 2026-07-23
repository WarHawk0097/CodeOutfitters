import "server-only";

// Duplicate-lead policy (spec §10 / owner C). Documented here in one place; the
// actual merge is executed atomically inside public.submit_inquiry (SQL), so
// this module is the human-readable contract + the guards the tests assert
// against. Keep the two in sync.

// Identity key: a lead is "the same lead" iff the normalized work email matches.
// A future stricter key (email + business_name) is compatible with this design.
export const LEAD_IDENTITY_KEY = "normalized_work_email" as const;

export function normalizeIdentityEmail(workEmail: string): string {
  return workEmail.trim().toLowerCase();
}

// Fields NEVER used alone to merge leads (too weak / unsafe — owner C).
export const FORBIDDEN_SOLE_MATCH_FIELDS = [
  "first_name",
  "phone_fragment",
  "company_name",
  "ip",
  "referrer",
] as const;

// On an existing lead, only these client-provided fields may fill a BLANK
// existing value. They never overwrite a non-blank value, and everything not
// listed here (status, assigned_owner, internal_notes, pipeline/appointment/
// proposal state) is preserved untouched.
export const MERGEABLE_LEAD_FIELDS = [
  "last_name",
  "phone",
  "job_title",
  "website_url",
  "company_size",
  "service_interest",
  "industry",
  "desired_outcome",
  "timeline",
  "budget_range",
] as const;

// Authoritative internal fields that a re-submission must never modify.
export const PRESERVED_LEAD_FIELDS = [
  "status",
  "assigned_owner",
  "internal_notes",
  "appointment_status",
  "proposal_status",
  "last_contacted_at",
  "next_follow_up_at",
] as const;
