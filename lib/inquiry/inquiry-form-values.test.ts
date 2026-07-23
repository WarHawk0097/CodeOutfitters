import { describe, expect, it } from "vitest";
import {
  CompactInquiryValuesSchema,
  FullInquiryValuesSchema,
  buildInquiryRequest,
} from "./inquiry-form-values";
import {
  buildSourceContext,
  type InquirySourceContext,
} from "./inquiry-source-context";
import {
  servicePrefill,
  industryPrefill,
  caseStudyPrefill,
  securityPrefill,
} from "./inquiry-contextual-prefill";

const source: InquirySourceContext = {
  inquirySource: "services_compact",
  sourcePage: "Services",
  sourcePath: "/services",
  sourceSection: "services-inline",
  clientContext: {},
};

describe("consent validation", () => {
  it("rejects when privacy is not accepted", () => {
    const result = CompactInquiryValuesSchema.safeParse({
      firstName: "Ada",
      workEmail: "ada@example.com",
      businessName: "Looms",
      workflowDescription: "Automate invoicing.",
      consent: { privacyAccepted: false, marketingOptIn: false },
    });
    expect(result.success).toBe(false);
  });
});

describe("buildInquiryRequest", () => {
  it("assembles a compact request and narrows consent to literal true", () => {
    const request = buildInquiryRequest({
      submissionId: "sub-1",
      formVariant: "services_compact",
      source,
      values: {
        firstName: "Ada",
        workEmail: "ada@example.com",
        businessName: "Looms",
        workflowDescription: "Automate invoicing.",
        consent: { privacyAccepted: true, marketingOptIn: true },
      },
    });
    expect(request.submissionId).toBe("sub-1");
    expect(request.consent).toEqual({ privacyAccepted: true, marketingOptIn: true });
    expect(request.sourceSection).toBe("services-inline");
  });

  it("drops blank optional strings so the wire contract stays clean", () => {
    const request = buildInquiryRequest({
      submissionId: "sub-2",
      formVariant: "contact_full",
      source: { ...source, inquirySource: "contact_full", sourcePage: "Contact" },
      values: {
        firstName: "Grace",
        lastName: "",
        workEmail: "grace@example.com",
        phone: "",
        businessName: "Navy",
        jobTitle: "",
        websiteUrl: "",
        companySize: "",
        workflowDescription: "Bulk report generation.",
        desiredOutcome: "",
        timeline: "",
        budgetRange: "",
        consent: { privacyAccepted: true, marketingOptIn: false },
      },
    });
    expect(request).not.toHaveProperty("websiteUrl");
    expect(request).not.toHaveProperty("phone");
    expect(request).not.toHaveProperty("lastName");
    expect(request.firstName).toBe("Grace");
  });

  it("omits attachmentTokens when none are supplied (Work Order D: uploads inert)", () => {
    const request = buildInquiryRequest({
      submissionId: "sub-3",
      formVariant: "services_compact",
      source,
      values: {
        firstName: "Ada",
        workEmail: "ada@example.com",
        businessName: "Looms",
        workflowDescription: "Automate invoicing.",
        consent: { privacyAccepted: true, marketingOptIn: false },
      },
    });
    expect(request).not.toHaveProperty("attachmentTokens");
  });
});

describe("FullInquiryValuesSchema", () => {
  it("accepts a complete lead profile", () => {
    const result = FullInquiryValuesSchema.safeParse({
      firstName: "Grace",
      lastName: "Hopper",
      workEmail: "grace@example.com",
      phone: "555-0100",
      businessName: "Navy",
      jobTitle: "Engineer",
      websiteUrl: "https://example.com",
      companySize: "11-50",
      workflowDescription: "Bulk report generation.",
      desiredOutcome: "Ship faster.",
      timeline: "Within 1-3 months",
      budgetRange: "$5k - $15k",
      consent: { privacyAccepted: true, marketingOptIn: false },
    });
    expect(result.success).toBe(true);
  });

  // Optional inputs default to "" in the DOM. Per-step "Continue" runs the
  // resolver over the step's fields, so "" must validate or the user is stuck
  // on the Business/Workflow step (buildInquiryRequest drops the blanks later).
  it("accepts blank optional inputs so per-step advance is not blocked", () => {
    const result = FullInquiryValuesSchema.safeParse({
      firstName: "Grace",
      lastName: "",
      workEmail: "grace@example.com",
      phone: "",
      businessName: "Navy",
      jobTitle: "",
      websiteUrl: "",
      companySize: "",
      workflowDescription: "Bulk report generation.",
      desiredOutcome: "",
      timeline: "",
      budgetRange: "",
      consent: { privacyAccepted: true, marketingOptIn: false },
    });
    expect(result.success).toBe(true);
  });

  it("still rejects a malformed website when one is provided", () => {
    const result = FullInquiryValuesSchema.safeParse({
      firstName: "Grace",
      workEmail: "grace@example.com",
      businessName: "Navy",
      websiteUrl: "not-a-url",
      workflowDescription: "Bulk report generation.",
      consent: { privacyAccepted: true, marketingOptIn: false },
    });
    expect(result.success).toBe(false);
  });
});


// Exact wire payload proof per contextual placement (Work Order D §5). Each
// placement maps a clicked entity through the typed prefill layer, folds it into
// the SSR-safe source context, and assembles the body buildInquiryRequest sends
// to POST /api/inquiries. Asserts formVariant, the exact selected* value, and
// the source attribution — the same values the browser QA verifies on the wire.
const compactAnswers = {
  firstName: "Ada",
  workEmail: "ada@example.com",
  businessName: "Looms",
  workflowDescription: "Automate invoicing.",
  consent: { privacyAccepted: true as const, marketingOptIn: false },
};

function placementRequest(
  formVariant: Parameters<typeof buildSourceContext>[0]["formVariant"],
  pageName: string,
  prefill: {
    selectedService?: string;
    selectedIndustry?: string;
    selectedCaseStudy?: string;
    sourceSection?: string;
  },
) {
  const source = buildSourceContext({ formVariant, pageName, ...prefill });
  return buildInquiryRequest({
    submissionId: "sub-ctx",
    formVariant,
    source,
    values: compactAnswers,
  });
}

describe("contextual placement payloads", () => {
  it("SERVICES: services_compact carries the exact clicked service + attribution", () => {
    const request = placementRequest("services_compact", "Services", servicePrefill("whatsapp"));
    expect(request.formVariant).toBe("services_compact");
    expect(request.selectedService).toBe("WhatsApp Lead Automation");
    expect(request.selectedIndustry).toBeUndefined();
    expect(request.sourcePage).toBe("Services");
    expect(request.sourceSection).toBe("services-card-whatsapp");
  });

  it("INDUSTRIES: industries_compact carries the exact clicked industry + attribution", () => {
    const request = placementRequest("industries_compact", "Industries", industryPrefill("healthcare"));
    expect(request.formVariant).toBe("industries_compact");
    expect(request.selectedIndustry).toBe("Healthcare Clinics / Med-Spas");
    expect(request.selectedService).toBeUndefined();
    expect(request.sourcePage).toBe("Industries");
    expect(request.sourceSection).toBe("industries-card-healthcare");
  });

  it("CASE STUDIES: case_study_contextual carries the case study + mapped service", () => {
    const request = placementRequest(
      "case_study_contextual",
      "Case Studies",
      caseStudyPrefill("real-estate-whatsapp"),
    );
    expect(request.formVariant).toBe("case_study_contextual");
    expect(request.selectedCaseStudy).toBe("How a Real Estate Agency Doubled Lead Response Rate");
    expect(request.selectedService).toBe("WhatsApp Lead Automation");
    expect(request.sourcePage).toBe("Case Studies");
    expect(request.sourceSection).toBe("case-studies-card-real-estate-whatsapp");
  });

  it("SECURITY: security_contextual carries the stable security topic", () => {
    const request = placementRequest("security_contextual", "Security", securityPrefill());
    expect(request.formVariant).toBe("security_contextual");
    expect(request.selectedService).toBe("Security & Compliance Review");
    expect(request.sourceSection).toBe("security-inline");
  });
});
