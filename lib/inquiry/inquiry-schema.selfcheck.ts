// Framework-less runtime check for the inquiry contract. Run: `npx tsx
// lib/inquiry/inquiry-schema.selfcheck.ts`. Not named *.test.ts so a future
// vitest setup (work order H) does not collect it as a suite. Asserts the
// security-relevant behaviors: consent gate, strict unknown-key rejection,
// email normalization, and the idempotency-key requirement.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { InquirySubmissionRequestSchema } from "./inquiry-schema";

function validPayload() {
  return {
    submissionId: randomUUID(),
    formVariant: "contact_full" as const,
    inquirySource: "contact_full",
    sourcePage: "Contact",
    sourcePath: "/contact",
    firstName: "  Ada  ",
    workEmail: "  Ada@Example.COM ",
    businessName: "Lovelace Ltd",
    workflowDescription: "We need to automate our weekly reporting pipeline.",
    consent: { privacyAccepted: true, marketingOptIn: false },
    clientContext: { viewportClass: "desktop" as const },
  };
}

// Valid payload parses and normalizes (trim + lowercase email).
const ok = InquirySubmissionRequestSchema.parse(validPayload());
assert.equal(ok.workEmail, "ada@example.com", "email lowercased+trimmed");
assert.equal(ok.firstName, "Ada", "firstName trimmed");

// Consent must be explicitly true — false is rejected at the trust boundary.
assert.equal(
  InquirySubmissionRequestSchema.safeParse({
    ...validPayload(),
    consent: { privacyAccepted: false, marketingOptIn: false },
  }).success,
  false,
  "privacyAccepted:false rejected",
);

// Unknown top-level keys are rejected (strict), not silently persisted.
assert.equal(
  InquirySubmissionRequestSchema.safeParse({
    ...validPayload(),
    isAdmin: true,
  }).success,
  false,
  "unknown key rejected",
);

// A non-UUID idempotency key is rejected.
assert.equal(
  InquirySubmissionRequestSchema.safeParse({
    ...validPayload(),
    submissionId: "not-a-uuid",
  }).success,
  false,
  "non-uuid submissionId rejected",
);

// A too-short workflow description is rejected.
assert.equal(
  InquirySubmissionRequestSchema.safeParse({
    ...validPayload(),
    workflowDescription: "short",
  }).success,
  false,
  "short workflowDescription rejected",
);

console.log("inquiry-schema.selfcheck: all assertions passed");
