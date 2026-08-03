import "server-only";
import type { InquiryEmailRequest } from "./inquiry-email-provider";

export type RenderedEmail = { subject: string; html: string; text: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Deterministic, escaped, plain-text-first templates. No secrets, no raw
// JSON dumps, no untrusted HTML. Visitor-facing template exposes only the
// submissionId (already known to the visitor) — never the internal leadId.
export function renderInquiryEmail(request: InquiryEmailRequest): RenderedEmail {
  const { inquiry } = request;
  const name = escapeHtml(`${inquiry.firstName}${inquiry.lastName ? ` ${inquiry.lastName}` : ""}`);
  const business = escapeHtml(inquiry.businessName);
  const workflow = escapeHtml(inquiry.workflowDescription);
  const reference = escapeHtml(request.inquiryId);

  if (request.kind === "visitor_confirmation") {
    const subject = "We received your CodeOutfitters inquiry";
    const text = [
      `Hi ${inquiry.firstName},`,
      "",
      "Thanks for reaching out to CodeOutfitters. We received your inquiry and will be in touch shortly.",
      `Reference: ${request.inquiryId}`,
    ].join("\n");
    const html = [
      `<p>Hi ${name},</p>`,
      "<p>Thanks for reaching out to CodeOutfitters. We received your inquiry and will be in touch shortly.</p>",
      `<p>Reference: ${reference}</p>`,
    ].join("\n");
    return { subject, html, text };
  }

  const subject = `New inquiry: ${inquiry.businessName.replace(/[\r\n]+/g, " ")}`;
  const text = [
    `New inquiry from ${name.length ? inquiry.firstName : ""} at ${inquiry.businessName}.`,
    `Reply-to: ${inquiry.workEmail}`,
    "",
    inquiry.workflowDescription,
    `Reference: ${request.inquiryId}`,
  ].join("\n");
  const html = [
    `<p>New inquiry from ${name} at ${business}.</p>`,
    `<p>Reply-to: ${escapeHtml(inquiry.workEmail)}</p>`,
    `<p>${workflow}</p>`,
    `<p>Reference: ${reference}</p>`,
  ].join("\n");
  return { subject, html, text };
}
