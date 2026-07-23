import { describe, expect, it } from "vitest";
import {
  CompactInquiryValuesSchema,
  FullInquiryValuesSchema,
  buildInquiryRequest,
} from "./inquiry-form-values";
import type { InquirySourceContext } from "./inquiry-source-context";

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
});
