import "server-only";
import type { EmailProvider } from "./inquiry-email-provider";
import { MockEmailProvider } from "./mock-email-provider";
import { ResendEmailProvider } from "./resend-email-provider";

// Environment-driven provider selection, mirroring
// ./inquiry-repository-factory.ts: fail closed in production, never a silent
// mock default in any environment. Called by the route BEFORE persistence so
// a broken configuration cannot silently accept an inquiry that is
// guaranteed to fail every email.
export function createInquiryEmailProvider(): EmailProvider {
  const isProduction = process.env.NODE_ENV === "production";
  const mode = process.env.INQUIRY_EMAIL_PROVIDER;

  if (mode === "mock") {
    if (isProduction) {
      throw new Error("INQUIRY_EMAIL_PROVIDER=mock is not permitted in production (fail closed).");
    }
    return new MockEmailProvider();
  }

  if (mode === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.INQUIRY_EMAIL_FROM;
    const internalTo = process.env.INQUIRY_EMAIL_INTERNAL_TO;
    const missing = [
      !apiKey && "RESEND_API_KEY",
      !from && "INQUIRY_EMAIL_FROM",
      !internalTo && "INQUIRY_EMAIL_INTERNAL_TO",
    ].filter((v): v is string => Boolean(v));
    if (missing.length > 0) {
      throw new Error(`Resend email provider is misconfigured: missing ${missing.join(", ")}.`);
    }
    return new ResendEmailProvider({ apiKey: apiKey!, from: from! });
  }

  throw new Error(
    'INQUIRY_EMAIL_PROVIDER must be explicitly set to "mock" or "resend" (no silent default).',
  );
}
