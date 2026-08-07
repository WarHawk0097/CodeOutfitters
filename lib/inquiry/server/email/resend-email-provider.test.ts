import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResendEmailProvider } from "./resend-email-provider";
import type { InquiryEmailRequest } from "./inquiry-email-provider";

function baseRequest(overrides: Partial<InquiryEmailRequest> = {}): InquiryEmailRequest {
  return {
    kind: "visitor_confirmation",
    inquiryId: "11111111-1111-1111-1111-111111111111",
    recipient: "visitor@example.com",
    replyTo: "staff@codeoutfitters.test",
    idempotencyKey: "inquiry/11111111-1111-1111-1111-111111111111/visitor_confirmation",
    inquiry: {
      firstName: "Ada",
      lastName: "Lovelace",
      workEmail: "visitor@example.com",
      businessName: "Lovelace Ltd",
      workflowDescription: "Automate weekly reporting",
    },
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("ResendEmailProvider", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts to the Resend API with the configured sender, auth header, and idempotency key", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "email_123" }));
    const provider = new ResendEmailProvider({ apiKey: "re_key", from: "inquiries@codeoutfitters.test" });
    const result = await provider.send(baseRequest());
    expect(result).toEqual({ providerId: "email_123" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.authorization).toBe("Bearer re_key");
    expect(init.headers["idempotency-key"]).toBe(baseRequest().idempotencyKey);
    expect(init.signal).toBeInstanceOf(AbortSignal);
    const body = JSON.parse(init.body as string);
    expect(body.from).toBe("inquiries@codeoutfitters.test");
    expect(body.to).toEqual(["visitor@example.com"]);
    expect(body.reply_to).toBe("staff@codeoutfitters.test");
  });

  it("routes internal_notification to the internal recipient with the visitor's reply-to", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "email_456" }));
    const provider = new ResendEmailProvider({ apiKey: "re_key", from: "inquiries@codeoutfitters.test" });
    await provider.send(
      baseRequest({
        kind: "internal_notification",
        recipient: "staff@codeoutfitters.test",
        replyTo: "visitor@example.com",
      }),
    );
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(init.body as string);
    expect(body.to).toEqual(["staff@codeoutfitters.test"]);
    expect(body.reply_to).toBe("visitor@example.com");
  });

  it("retries once on a network error, using the same idempotency key", async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(jsonResponse({ id: "email_after_retry" }));
    const provider = new ResendEmailProvider({ apiKey: "re_key", from: "inquiries@codeoutfitters.test" });
    const result = await provider.send(baseRequest());
    expect(result).toEqual({ providerId: "email_after_retry" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const key1 = (fetchMock.mock.calls[0][1] as { headers: Record<string, string> }).headers["idempotency-key"];
    const key2 = (fetchMock.mock.calls[1][1] as { headers: Record<string, string> }).headers["idempotency-key"];
    expect(key1).toBe(key2);
  });

  it("retries once on a 429/5xx response, then succeeds", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 503)).mockResolvedValueOnce(jsonResponse({ id: "email_ok" }));
    const provider = new ResendEmailProvider({ apiKey: "re_key", from: "inquiries@codeoutfitters.test" });
    const result = await provider.send(baseRequest());
    expect(result).toEqual({ providerId: "email_ok" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stops after two attempts if a transient failure persists", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));
    const provider = new ResendEmailProvider({ apiKey: "re_key", from: "inquiries@codeoutfitters.test" });
    await expect(provider.send(baseRequest())).rejects.toThrow(/500/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a permanent 401/422 failure", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "invalid api key" }, 401));
    const provider = new ResendEmailProvider({ apiKey: "re_key", from: "inquiries@codeoutfitters.test" });
    const err = await provider.send(baseRequest()).catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((err as Error).message).not.toContain("re_key");
  });

  it("rejects a successful response missing a message id, without retrying", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    const provider = new ResendEmailProvider({ apiKey: "re_key", from: "inquiries@codeoutfitters.test" });
    await expect(provider.send(baseRequest())).rejects.toThrow(/message id/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
