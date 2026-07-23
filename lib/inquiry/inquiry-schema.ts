// Shared inquiry contract — the single source of truth for both the public
// marketing forms (react-hook-form resolver) and the server route handler
// (POST /api/inquiries). Field names and the request/response shapes are taken
// verbatim from the integration spec §8 (Inquiry data contract) and §9
// (Backend submission behavior). Client and server import the SAME schema so a
// field the server does not accept is a compile/parse error on the client, not
// a silent no-op.
//
// Trust boundary: this schema is validated AGAIN server-side in the route
// handler. Client-side parsing is UX; server-side parsing is the security
// boundary (spec §9.1). Do not weaken either.
import { z } from "zod";

// The six placements the shared engine renders into (spec §8 formVariant,
// §6 placement strategy, §7 popup). Exported as a const so form components and
// analytics reference the same literals.
export const FORM_VARIANTS = [
  "global_popup",
  "services_compact",
  "industries_compact",
  "contact_full",
  "case_study_contextual",
  "security_contextual",
] as const;
export type FormVariant = (typeof FORM_VARIANTS)[number];

export const VIEWPORT_CLASSES = ["desktop", "tablet", "mobile"] as const;
export type ViewportClass = (typeof VIEWPORT_CLASSES)[number];

// Normalizers applied on parse so client and server land on identical stored
// values. Kept minimal: trim everywhere, lowercase only the email.
const trimmed = z.string().trim();
const email = z.string().trim().toLowerCase().pipe(z.email());
const optionalText = trimmed.min(1).optional();

const ConsentSchema = z.object({
  // Legal consent gate — must be explicitly true (spec §18 validation). A
  // literal(true) rejects false/absent at the trust boundary.
  privacyAccepted: z.literal(true),
  marketingOptIn: z.boolean(),
});

const CampaignSchema = z
  .object({
    utmSource: optionalText,
    utmMedium: optionalText,
    utmCampaign: optionalText,
    utmTerm: optionalText,
    utmContent: optionalText,
    referrer: optionalText,
  })
  .optional();

const ClientContextSchema = z.object({
  locale: optionalText,
  timezone: optionalText,
  viewportClass: z.enum(VIEWPORT_CLASSES).optional(),
});

// strictObject: unknown top-level keys are rejected (spec §9.3 "Reject
// unsupported fields") rather than silently persisted.
export const InquirySubmissionRequestSchema = z.strictObject({
  // Client-generated idempotency key (spec §9.6). One id == one lead form
  // submission; a retried POST with the same id is a replay, not a duplicate.
  submissionId: z.uuid(),
  formVariant: z.enum(FORM_VARIANTS),

  // Source attribution (spec §8, §19). Free-form strings the client derives
  // from the page it rendered on; never PII.
  inquirySource: trimmed.min(1),
  sourcePage: trimmed.min(1),
  sourcePath: trimmed.min(1),
  sourceSection: optionalText,
  selectedService: optionalText,
  selectedIndustry: optionalText,
  selectedCaseStudy: optionalText,

  // Contact + company.
  firstName: trimmed.min(1).max(120),
  lastName: trimmed.max(120).optional(),
  workEmail: email,
  phone: trimmed.max(40).optional(),
  businessName: trimmed.min(1).max(200),
  jobTitle: trimmed.max(160).optional(),
  websiteUrl: z.string().trim().pipe(z.url()).optional(),
  companySize: optionalText,

  // The inquiry itself.
  workflowDescription: trimmed.min(10).max(5000),
  desiredOutcome: trimmed.max(2000).optional(),
  timeline: optionalText,
  budgetRange: optionalText,

  consent: ConsentSchema,

  // Opaque upload tokens issued by the upload endpoint (spec §11). The client
  // never sends raw files in this payload — it sends tokens the server
  // resolves to already-uploaded attachment records.
  attachmentTokens: z.array(z.string().min(1)).max(10).optional(),

  campaign: CampaignSchema,
  clientContext: ClientContextSchema,
});

export type InquirySubmissionRequest = z.infer<
  typeof InquirySubmissionRequestSchema
>;

// Success response (spec §8 InquirySubmissionResponse). Server-owned fields
// (leadId, status, appointment availability) come back from the server; the
// client never sets them (spec §8 "Server-owned fields").
export const InquirySubmissionResponseSchema = z.object({
  ok: z.literal(true),
  leadId: z.string(),
  submissionId: z.string(),
  status: z.literal("received"),
  appointmentNextStep: z.object({
    available: z.boolean(),
    url: z.string().optional(),
  }),
});
export type InquirySubmissionResponse = z.infer<
  typeof InquirySubmissionResponseSchema
>;

// Failure taxonomy (spec §9 "Failure behavior"). The server returns a non-2xx
// status with this body so the client can map to the right UX ("slot delayed"
// vs "try again" vs field errors) without leaking internals (spec §9.16).
export const INQUIRY_ERROR_CODES = [
  "validation",
  "duplicate",
  "upload_failed",
  "database_error",
  "email_delayed",
  "rate_limited",
  "server_error",
] as const;
export type InquiryErrorCode = (typeof INQUIRY_ERROR_CODES)[number];

export const InquirySubmissionErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.enum(INQUIRY_ERROR_CODES),
    message: z.string(),
    // Safe field-level validation errors (spec §9.15): field id -> message.
    // Never contains secrets or DB details.
    fields: z.record(z.string(), z.string()).optional(),
  }),
});
export type InquirySubmissionError = z.infer<
  typeof InquirySubmissionErrorSchema
>;

// Union both server outcomes so the client narrows on `ok`.
export type InquirySubmissionResult =
  | InquirySubmissionResponse
  | InquirySubmissionError;
