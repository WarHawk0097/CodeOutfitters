import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { submitInquiry } from "./inquiry-service";
import type { InquiryRepository, PersistResult, EmailEventStatus } from "./inquiry-repository";
import { MockEmailProvider, FailingEmailProvider } from "./inquiry-email-dispatch";
import type { RateLimiter } from "./inquiry-rate-limit";
import { InquiryError, idempotencyConflict } from "./inquiry-errors";
import { InquirySubmissionRequestSchema } from "../inquiry-schema";
import type { InquiryRequestContext } from "./inquiry-request-context";

const ctx: InquiryRequestContext = { correlationId: "cid", ipHash: "iphash", userAgent: "ua" };
const allow: RateLimiter = { check: () => ({ allowed: true }) };
const deny: RateLimiter = { check: () => ({ allowed: false, retryAfterMs: 1000 }) };

function payload() {
  return InquirySubmissionRequestSchema.parse({
    submissionId: randomUUID(),
    formVariant: "contact_full",
    inquirySource: "contact_full",
    sourcePage: "Contact",
    sourcePath: "/contact",
    firstName: "Ada",
    workEmail: "ada@example.com",
    businessName: "Lovelace Ltd",
    workflowDescription: "Automate the weekly reporting pipeline end to end.",
    consent: { privacyAccepted: true, marketingOptIn: false },
    clientContext: { viewportClass: "desktop" },
  });
}

class FakeRepository implements InquiryRepository {
  emailMarks: Array<{ type: string; status: EmailEventStatus }> = [];
  constructor(
    private readonly result: PersistResult,
    private readonly onPersist?: () => void,
  ) {}
  async persist(): Promise<PersistResult> {
    this.onPersist?.();
    return this.result;
  }
  async markEmailEvent(_s: string, type: "visitor_confirmation" | "internal_notification", status: EmailEventStatus): Promise<void> {
    this.emailMarks.push({ type, status });
  }
}

const newResult = (): PersistResult => ({
  leadId: randomUUID(),
  submissionId: randomUUID(),
  status: "received",
  replay: false,
});

describe("submitInquiry service", () => {
  it("persists a new inquiry, sends both emails, marks them sent", async () => {
    const repo = new FakeRepository(newResult());
    const res = await submitInquiry(payload(), ctx, {
      repository: repo,
      emailProvider: new MockEmailProvider(),
      ipRateLimiter: allow,
      emailRateLimiter: allow,
    });
    expect(res.response.ok).toBe(true);
    expect(res.replay).toBe(false);
    expect(res.emailDelivery).toBe("sent");
    expect(repo.emailMarks).toEqual([
      { type: "visitor_confirmation", status: "sent" },
      { type: "internal_notification", status: "sent" },
    ]);
  });

  it("does not re-send email on an idempotent replay", async () => {
    const repo = new FakeRepository({ ...newResult(), replay: true });
    const res = await submitInquiry(payload(), ctx, {
      repository: repo,
      emailProvider: new MockEmailProvider(),
      ipRateLimiter: allow,
      emailRateLimiter: allow,
    });
    expect(res.replay).toBe(true);
    expect(repo.emailMarks).toHaveLength(0);
  });

  it("email failure is non-fatal: inquiry still succeeds, events marked failed", async () => {
    const repo = new FakeRepository(newResult());
    const res = await submitInquiry(payload(), ctx, {
      repository: repo,
      emailProvider: new FailingEmailProvider(),
      ipRateLimiter: allow,
      emailRateLimiter: allow,
    });
    expect(res.response.ok).toBe(true);
    expect(res.emailDelivery).toBe("delayed");
    expect(repo.emailMarks.every((m) => m.status === "failed")).toBe(true);
  });

  it("throws 429 when rate limited (never reaches persistence)", async () => {
    let persisted = false;
    const repo = new FakeRepository(newResult(), () => (persisted = true));
    await expect(
      submitInquiry(payload(), ctx, {
        repository: repo,
        emailProvider: new MockEmailProvider(),
        ipRateLimiter: deny,
        emailRateLimiter: allow,
      }),
    ).rejects.toMatchObject({ status: 429 });
    expect(persisted).toBe(false);
  });

  it("propagates an idempotency conflict as a 409 InquiryError", async () => {
    const repo: InquiryRepository = {
      async persist() {
        throw idempotencyConflict();
      },
      async markEmailEvent() {},
    };
    const err = await submitInquiry(payload(), ctx, {
      repository: repo,
      emailProvider: new MockEmailProvider(),
      ipRateLimiter: allow,
      emailRateLimiter: allow,
    }).catch((e) => e);
    expect(err).toBeInstanceOf(InquiryError);
    expect(err.status).toBe(409);
  });
});
