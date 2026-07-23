// Per-variant form-value schemas + the request builder (spec §5 "shared form
// engine", §8 contract). The public forms only collect a SUBSET of the wire
// contract — the id, formVariant, source attribution, campaign, and client
// context are injected at submit time, never typed by the user. These schemas
// are what react-hook-form's zodResolver validates; the assembled request is
// re-validated by InquirySubmissionRequestSchema in the api client and again on
// the server (the real trust boundary).
import { z } from "zod";
import {
  InquirySubmissionRequestSchema,
  type InquirySubmissionRequest,
  type FormVariant,
} from "./inquiry-schema";
import type { InquirySourceContext } from "./inquiry-source-context";

// Consent as the FORM sees it: privacyAccepted is a boolean (so the checkbox can
// default to false) that must be true to pass. The wire contract uses
// literal(true); the builder narrows to that after validation.
const FormConsentSchema = z.object({
  privacyAccepted: z.boolean().refine((v) => v === true, {
    message: "Please accept the privacy policy to continue.",
  }),
  marketingOptIn: z.boolean(),
});

// Compact placements (global_popup, services_compact, industries_compact):
// name, work email, business name, one workflow description, consent.
export const CompactInquiryValuesSchema = InquirySubmissionRequestSchema.pick({
  firstName: true,
  workEmail: true,
  businessName: true,
  workflowDescription: true,
})
  .extend({ consent: FormConsentSchema })
  .strip();
export type CompactInquiryValues = z.infer<typeof CompactInquiryValuesSchema>;

// Full Contact placement (contact_full): the complete lead profile across the
// multi-step flow (spec §6 Contact steps).
export const FullInquiryValuesSchema = InquirySubmissionRequestSchema.pick({
  firstName: true,
  lastName: true,
  workEmail: true,
  phone: true,
  businessName: true,
  jobTitle: true,
  websiteUrl: true,
  companySize: true,
  workflowDescription: true,
  desiredOutcome: true,
  timeline: true,
  budgetRange: true,
})
  .extend({
    consent: FormConsentSchema,
    // These optional inputs default to "" in the DOM. The request schema rejects
    // "" (optionalText requires min 1; websiteUrl requires a URL), which would
    // block per-step "Continue" for anyone who leaves them blank. Treat blank as
    // absent here so the step can advance; a non-blank value is still
    // format-checked, and buildInquiryRequest drops the blanks before the wire
    // contract validates.
    websiteUrl: z.union([z.literal(""), z.string().trim().pipe(z.url())]).optional(),
    companySize: z.string().trim().optional(),
    timeline: z.string().trim().optional(),
    budgetRange: z.string().trim().optional(),
  })
  .strip();
export type FullInquiryValues = z.infer<typeof FullInquiryValuesSchema>;

export type InquiryFormValues = CompactInquiryValues | FullInquiryValues;

// Empty optional text inputs arrive as "" from the DOM; the wire contract wants
// them absent (e.g. websiteUrl "" would fail z.url()). Drop blanks before
// assembling the request.
function withoutBlanks<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === "" || value === undefined) continue;
    (out as Record<string, unknown>)[key] = value;
  }
  return out;
}

export type BuildInquiryRequestInput = {
  submissionId: string;
  formVariant: FormVariant;
  values: InquiryFormValues;
  source: InquirySourceContext;
  // Opaque upload tokens (spec §11). Work Order D never issues real tokens, so
  // this stays empty/undefined until Work Order E activates uploads.
  attachmentTokens?: string[];
};

// Assembles the full wire payload. `consent.privacyAccepted` is narrowed to the
// literal `true` the contract requires (the resolver already guaranteed it).
export function buildInquiryRequest(
  input: BuildInquiryRequestInput,
): InquirySubmissionRequest {
  const { values, source } = input;
  const consent = { privacyAccepted: true as const, marketingOptIn: values.consent.marketingOptIn };

  const request = {
    submissionId: input.submissionId,
    formVariant: input.formVariant,
    inquirySource: source.inquirySource,
    sourcePage: source.sourcePage,
    sourcePath: source.sourcePath,
    ...withoutBlanks({
      sourceSection: source.sourceSection,
      selectedService: source.selectedService,
      selectedIndustry: source.selectedIndustry,
      selectedCaseStudy: source.selectedCaseStudy,
    }),
    ...withoutBlanks({
      firstName: values.firstName,
      lastName: "lastName" in values ? values.lastName : undefined,
      phone: "phone" in values ? values.phone : undefined,
      jobTitle: "jobTitle" in values ? values.jobTitle : undefined,
      websiteUrl: "websiteUrl" in values ? values.websiteUrl : undefined,
      companySize: "companySize" in values ? values.companySize : undefined,
      desiredOutcome: "desiredOutcome" in values ? values.desiredOutcome : undefined,
      timeline: "timeline" in values ? values.timeline : undefined,
      budgetRange: "budgetRange" in values ? values.budgetRange : undefined,
    }),
    workEmail: values.workEmail,
    businessName: values.businessName,
    workflowDescription: values.workflowDescription,
    consent,
    ...(input.attachmentTokens && input.attachmentTokens.length > 0
      ? { attachmentTokens: input.attachmentTokens }
      : {}),
    ...(source.campaign ? { campaign: source.campaign } : {}),
    clientContext: source.clientContext,
  };

  return request as InquirySubmissionRequest;
}
