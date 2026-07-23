import "server-only";

// Email provider boundary. Work Order C uses a MOCK provider only — no real
// Resend request is authorized (owner C). Work Order F swaps in the real Resend
// adapter behind this same interface.
export type EmailKind = "visitor_confirmation" | "internal_notification";
export type EmailSendResult = { providerId: string };

export interface EmailProvider {
  send(kind: EmailKind, recipient: string): Promise<EmailSendResult>;
}

// Local mock: never touches the network. Returns a synthetic provider id so the
// post-commit flow and the email_events status update can be exercised locally.
export class MockEmailProvider implements EmailProvider {
  async send(kind: EmailKind, _recipient: string): Promise<EmailSendResult> {
    return { providerId: `mock_${kind}_${Date.now()}` };
  }
}

// Fails on demand — used by tests to prove that an email failure never fails the
// inquiry and correctly marks the event 'failed'.
export class FailingEmailProvider implements EmailProvider {
  async send(): Promise<EmailSendResult> {
    throw new Error("mock email provider failure");
  }
}
