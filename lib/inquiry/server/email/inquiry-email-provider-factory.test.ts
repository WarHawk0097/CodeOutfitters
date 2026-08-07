import { afterEach, describe, expect, it, vi } from "vitest";
import { createInquiryEmailProvider } from "./inquiry-email-provider-factory";
import { MockEmailProvider } from "./mock-email-provider";
import { ResendEmailProvider } from "./resend-email-provider";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createInquiryEmailProvider", () => {
  it("selects Resend in production when fully configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("INQUIRY_EMAIL_PROVIDER", "resend");
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("INQUIRY_EMAIL_FROM", "inquiries@codeoutfitters.test");
    vi.stubEnv("INQUIRY_EMAIL_INTERNAL_TO", "staff@codeoutfitters.test");
    expect(createInquiryEmailProvider()).toBeInstanceOf(ResendEmailProvider);
  });

  it("rejects mock in production (fail closed)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("INQUIRY_EMAIL_PROVIDER", "mock");
    expect(() => createInquiryEmailProvider()).toThrow(/production/i);
  });

  it("fails closed in production when RESEND_API_KEY is missing, without leaking secrets", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("INQUIRY_EMAIL_PROVIDER", "resend");
    vi.stubEnv("INQUIRY_EMAIL_FROM", "inquiries@codeoutfitters.test");
    vi.stubEnv("INQUIRY_EMAIL_INTERNAL_TO", "staff@codeoutfitters.test");
    let err: unknown;
    try {
      createInquiryEmailProvider();
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toContain("RESEND_API_KEY");
    expect((err as Error).message).not.toMatch(/re_[a-zA-Z0-9]/);
  });

  it("fails closed when INQUIRY_EMAIL_FROM and INQUIRY_EMAIL_INTERNAL_TO are missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("INQUIRY_EMAIL_PROVIDER", "resend");
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    expect(() => createInquiryEmailProvider()).toThrow(/INQUIRY_EMAIL_FROM[\s\S]*INQUIRY_EMAIL_INTERNAL_TO/);
  });

  it("requires explicit provider selection outside production (no silent default)", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("INQUIRY_EMAIL_PROVIDER", "");
    expect(() => createInquiryEmailProvider()).toThrow(/explicitly/);
  });

  it("allows explicit mock outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("INQUIRY_EMAIL_PROVIDER", "mock");
    expect(createInquiryEmailProvider()).toBeInstanceOf(MockEmailProvider);
  });

  it("allows explicit resend outside production when fully configured", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("INQUIRY_EMAIL_PROVIDER", "resend");
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("INQUIRY_EMAIL_FROM", "inquiries@codeoutfitters.test");
    vi.stubEnv("INQUIRY_EMAIL_INTERNAL_TO", "staff@codeoutfitters.test");
    expect(createInquiryEmailProvider()).toBeInstanceOf(ResendEmailProvider);
  });
});
