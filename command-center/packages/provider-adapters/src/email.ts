// EmailProvider — work/PROVIDER-ADAPTER-PLAN.md row 1
// Shape: sendEmail(to, template, data) -> {id, status}
// Mock strategy: fixture handler returning fixed success/failure per test case.
import type { ProviderStatus } from "./types";

export interface SendEmailResult {
  id: string;
  status: "sent" | "email_failed";
}

export interface EmailProvider {
  status: ProviderStatus;
  sendEmail(to: string, template: string, data: Record<string, string>): Promise<SendEmailResult>;
}

// ponytail: single deterministic trigger (to === "fail@example.test") for the
// failure path — good enough to exercise both branches without a fixture file per case.
export class MockEmailProvider implements EmailProvider {
  status: ProviderStatus = "NOT_CONFIGURED";

  async sendEmail(to: string, _template: string, _data: Record<string, string>): Promise<SendEmailResult> {
    if (to === "fail@example.test") {
      return { id: "email-mock-failed-001", status: "email_failed" };
    }
    return { id: "email-mock-sent-001", status: "sent" };
  }
}
