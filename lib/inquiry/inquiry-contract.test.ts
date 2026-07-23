import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import {
  InquirySubmissionRequestSchema,
  type InquirySubmissionRequest,
} from "./inquiry-schema";
import { computeFingerprint, FINGERPRINT_FIELD_LIST } from "./server/inquiry-idempotency";
import {
  LEAD_IDENTITY_KEY,
  MERGEABLE_LEAD_FIELDS,
  PRESERVED_LEAD_FIELDS,
  normalizeIdentityEmail,
} from "./server/inquiry-duplicate-policy";

function base(overrides: Record<string, unknown> = {}) {
  return {
    submissionId: randomUUID(),
    formVariant: "contact_full",
    inquirySource: "contact_full",
    sourcePage: "Contact",
    sourcePath: "/contact",
    firstName: "Ada",
    workEmail: "ada@example.com",
    businessName: "Lovelace Ltd",
    workflowDescription: "Automate the weekly reporting pipeline end to end.",
    consent: { privacyAccepted: true, marketingOptIn: false },
    clientContext: { viewportClass: "desktop" },
    ...overrides,
  };
}

describe("InquirySubmissionRequestSchema", () => {
  it("accepts a valid payload and normalizes email", () => {
    const r = InquirySubmissionRequestSchema.parse(base({ workEmail: " Ada@Example.COM " }));
    expect(r.workEmail).toBe("ada@example.com");
  });

  it("rejects unknown top-level fields (strict)", () => {
    expect(InquirySubmissionRequestSchema.safeParse(base({ isAdmin: true })).success).toBe(false);
  });

  it("rejects privacyAccepted=false at the consent gate", () => {
    expect(
      InquirySubmissionRequestSchema.safeParse(
        base({ consent: { privacyAccepted: false, marketingOptIn: false } }),
      ).success,
    ).toBe(false);
  });

  it("rejects a malformed submissionId (non-uuid)", () => {
    expect(InquirySubmissionRequestSchema.safeParse(base({ submissionId: "nope" })).success).toBe(false);
  });

  it("rejects a too-short workflow description", () => {
    expect(InquirySubmissionRequestSchema.safeParse(base({ workflowDescription: "short" })).success).toBe(false);
  });
});

describe("computeFingerprint", () => {
  const parse = (o: Record<string, unknown> = {}) =>
    InquirySubmissionRequestSchema.parse(base(o)) as InquirySubmissionRequest;

  it("is deterministic and independent of transient fields", () => {
    const a = parse({ submissionId: randomUUID(), clientContext: { viewportClass: "mobile" } });
    const b = parse({ submissionId: randomUUID(), clientContext: { viewportClass: "desktop" } });
    // Different submissionId + viewport (transient) -> SAME fingerprint.
    expect(computeFingerprint(a)).toBe(computeFingerprint(b));
  });

  it("changes when substantive content changes", () => {
    const a = parse();
    const b = parse({ workflowDescription: "A completely different automation need entirely." });
    expect(computeFingerprint(a)).not.toBe(computeFingerprint(b));
  });

  it("documents its field set", () => {
    expect(FINGERPRINT_FIELD_LIST).toContain("workEmail");
    expect(FINGERPRINT_FIELD_LIST).toContain("consent.privacyAccepted");
    expect(FINGERPRINT_FIELD_LIST).not.toContain("submissionId");
    expect(FINGERPRINT_FIELD_LIST).not.toContain("campaign");
  });
});

describe("duplicate policy", () => {
  it("identity key is normalized work email", () => {
    expect(LEAD_IDENTITY_KEY).toBe("normalized_work_email");
    expect(normalizeIdentityEmail(" Ada@Example.COM ")).toBe("ada@example.com");
  });

  it("keeps authoritative fields out of the mergeable set", () => {
    for (const f of PRESERVED_LEAD_FIELDS) {
      expect(MERGEABLE_LEAD_FIELDS).not.toContain(f);
    }
  });
});
