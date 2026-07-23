import "server-only";
import { createHash } from "node:crypto";
import type { InquirySubmissionRequest } from "../inquiry-schema";

// Fields that make an inquiry "the same" for idempotency. A reused submissionId
// carrying a different fingerprint is a CONFLICT, not a replay (owner C).
//
// Deliberately EXCLUDED (transient / attribution that may vary harmlessly):
//   submissionId, inquirySource, sourcePage, sourcePath, sourceSection,
//   campaign, clientContext, attachmentTokens.
//
// INCLUDED (the substantive inquiry content the visitor entered):
const FINGERPRINT_FIELDS = [
  "formVariant",
  "firstName",
  "lastName",
  "workEmail",
  "phone",
  "businessName",
  "jobTitle",
  "websiteUrl",
  "companySize",
  "selectedService",
  "selectedIndustry",
  "selectedCaseStudy",
  "workflowDescription",
  "desiredOutcome",
  "timeline",
  "budgetRange",
] as const;

// Deterministic fingerprint of the validated (already normalized) payload.
// Operates on the schema-parsed request so trimming/lowercasing are already
// applied — the same content always hashes the same regardless of key order.
export function computeFingerprint(req: InquirySubmissionRequest): string {
  const canonical: Record<string, unknown> = {};
  for (const key of FINGERPRINT_FIELDS) {
    const value = (req as Record<string, unknown>)[key];
    if (value !== undefined) canonical[key] = value;
  }
  canonical.consent = {
    privacyAccepted: req.consent.privacyAccepted,
    marketingOptIn: req.consent.marketingOptIn,
  };
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

// Exposed for the self-documentation test: the exact set that forms the hash.
export const FINGERPRINT_FIELD_LIST: readonly string[] = [
  ...FINGERPRINT_FIELDS,
  "consent.privacyAccepted",
  "consent.marketingOptIn",
];
