import "server-only";
import type { EmailProvider, EmailSendResult, InquiryEmailRequest } from "./inquiry-email-provider";

// Local mock: never touches the network. Only ever selected by an explicit
// INQUIRY_EMAIL_PROVIDER=mock (never a silent default) and refused in
// production by the factory.
export class MockEmailProvider implements EmailProvider {
  async send(request: InquiryEmailRequest): Promise<EmailSendResult> {
    return { providerId: `mock_${request.kind}_${Date.now()}` };
  }
}

// Fails on demand — used by tests to prove an email failure never fails the
// inquiry and correctly marks the event 'failed'.
export class FailingEmailProvider implements EmailProvider {
  async send(): Promise<EmailSendResult> {
    throw new Error("mock email provider failure");
  }
}
