import "server-only";
import type { EmailProvider, EmailSendResult, InquiryEmailRequest } from "./inquiry-email-provider";
import { renderInquiryEmail } from "./inquiry-email-templates";

// Fixed in source (not env-configurable) per scope — no evidence yet requires
// per-environment tuning.
const REQUEST_TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 250;
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type ResendEmailProviderConfig = { apiKey: string; from: string };

function isTransientNetworkError(err: unknown): boolean {
  // AbortSignal.timeout() rejects with a DOMException named "TimeoutError";
  // a dropped connection rejects fetch with a TypeError. Both are transient.
  return err instanceof TypeError || (err instanceof DOMException && err.name === "TimeoutError");
}

function isTransientStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Uses fetch directly rather than the `resend` SDK: this repo already hand-rolls
// external HTTP adapters (see workers/anthropic-proposal-proxy.ts), and Resend's
// send-email call is a single POST with no need for SDK conveniences here.
export class ResendEmailProvider implements EmailProvider {
  constructor(private readonly config: ResendEmailProviderConfig) {}

  async send(request: InquiryEmailRequest): Promise<EmailSendResult> {
    const { subject, html, text } = renderInquiryEmail(request);
    const body = JSON.stringify({
      from: this.config.from,
      to: [request.recipient],
      ...(request.replyTo ? { reply_to: request.replyTo } : {}),
      subject,
      html,
      text,
    });
    const headers = {
      authorization: `Bearer ${this.config.apiKey}`,
      "content-type": "application/json",
      // Same key on every attempt/retry of this exact email — lets Resend
      // dedupe if a timed-out attempt actually landed.
      "idempotency-key": request.idempotencyKey,
    };

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let response: Response;
      try {
        response = await fetch(RESEND_ENDPOINT, {
          method: "POST",
          headers,
          body,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (err) {
        if (attempt < MAX_ATTEMPTS && isTransientNetworkError(err)) {
          await delay(RETRY_DELAY_MS);
          continue;
        }
        const reason = err instanceof Error ? err.message : "unknown error";
        throw new Error(`Resend request failed: ${reason}`);
      }

      if (!response.ok) {
        if (attempt < MAX_ATTEMPTS && isTransientStatus(response.status)) {
          await delay(RETRY_DELAY_MS);
          continue;
        }
        throw new Error(`Resend request failed with status ${response.status}`);
      }

      const parsed: unknown = await response.json().catch(() => null);
      const id = (parsed as { id?: unknown } | null)?.id;
      if (typeof id !== "string" || id.length === 0) {
        throw new Error("Resend response did not include a message id");
      }
      return { providerId: id };
    }

    throw new Error("Resend request failed after retries");
  }
}
