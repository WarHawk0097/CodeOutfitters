import "server-only";

// Email provider boundary (Work Order F). MockEmailProvider and
// ResendEmailProvider both implement this same interface — see
// ./inquiry-email-provider-factory.ts for environment-based selection.
export type EmailKind = "visitor_confirmation" | "internal_notification";
export type EmailSendResult = { providerId: string };

// The only inquiry fields a template may use, taken verbatim from
// InquirySubmissionRequestSchema (lib/inquiry/inquiry-schema.ts). Adding a
// field here means it is now allowed into an email — do not widen this
// without an explicit decision to expose more of the payload.
export type InquiryEmailRequest = {
  kind: EmailKind;
  inquiryId: string;
  recipient: string;
  replyTo?: string;
  idempotencyKey: string;
  inquiry: {
    firstName: string;
    lastName?: string;
    workEmail: string;
    businessName: string;
    workflowDescription: string;
  };
};

export interface EmailProvider {
  send(request: InquiryEmailRequest): Promise<EmailSendResult>;
}

// Deterministic, PII-free provider idempotency key. Same key on every retry
// of the same email (inquiryId is the client-generated submission UUID —
// already known to the visitor, not a secret).
export function buildEmailIdempotencyKey(inquiryId: string, kind: EmailKind): string {
  return `inquiry/${inquiryId}/${kind}`;
}

// The internal staff recipient. Deliberately independent from anything the
// visitor submits — INQUIRY_EMAIL_INTERNAL_TO is the only source. Throws
// (rather than falling back to visitor input) when unset; the caller
// (inquiry-service.ts) treats that as a per-job failure, never as a reason
// to send the internal notification to the visitor.
export function resolveInquiryEmailInternalTo(): string {
  const internalTo = process.env.INQUIRY_EMAIL_INTERNAL_TO;
  if (!internalTo) {
    throw new Error("INQUIRY_EMAIL_INTERNAL_TO is not configured.");
  }
  return internalTo;
}
