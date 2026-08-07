import { describe, expect, it } from "vitest";
import { renderInquiryEmail } from "./inquiry-email-templates";
import type { InquiryEmailRequest } from "./inquiry-email-provider";

function request(overrides: Partial<InquiryEmailRequest> = {}): InquiryEmailRequest {
  return {
    kind: "visitor_confirmation",
    inquiryId: "sub-1",
    recipient: "visitor@example.com",
    idempotencyKey: "inquiry/sub-1/visitor_confirmation",
    inquiry: {
      firstName: "Ada <script>alert(1)</script>",
      lastName: "Lovelace",
      workEmail: "visitor@example.com",
      businessName: "<b>Lovelace</b> Ltd",
      workflowDescription: "Automate <script>alert(1)</script> weekly reports",
    },
    ...overrides,
  };
}

describe("renderInquiryEmail", () => {
  it("renders a visitor confirmation with escaped content, a text fallback, and no secrets", () => {
    const rendered = renderInquiryEmail(request());
    expect(rendered.subject).toBeTruthy();
    expect(rendered.html).not.toContain("<script>");
    expect(rendered.html).toContain("&lt;script&gt;");
    expect(rendered.text.length).toBeGreaterThan(0);
    expect(rendered.html).toContain("sub-1");
    expect(rendered.html).not.toMatch(/secret|apiKey|RESEND_API_KEY/i);
  });

  it("renders an internal notification with escaped business content", () => {
    const rendered = renderInquiryEmail(
      request({ kind: "internal_notification", recipient: "staff@codeoutfitters.test" }),
    );
    expect(rendered.html).toContain("&lt;b&gt;Lovelace&lt;/b&gt; Ltd");
    expect(rendered.html).not.toContain("<b>Lovelace</b>");
    expect(rendered.text).toContain("visitor@example.com");
  });

  it("never renders a raw JSON dump of the request", () => {
    const rendered = renderInquiryEmail(request());
    expect(rendered.html).not.toMatch(/\{"kind"/);
    expect(rendered.text).not.toMatch(/\{"kind"/);
  });
});
