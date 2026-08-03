import "server-only";
import type {
  InquirySubmissionRequest,
  InquirySubmissionResponse,
} from "../inquiry-schema";
import type { InquiryRepository } from "./inquiry-repository";
import type { EmailKind, EmailProvider, InquiryEmailRequest } from "./email/inquiry-email-provider";
import { buildEmailIdempotencyKey, resolveInquiryEmailInternalTo } from "./email/inquiry-email-provider";
import type { RateLimiter } from "./inquiry-rate-limit";
import type { InquiryRequestContext } from "./inquiry-request-context";
import { computeFingerprint } from "./inquiry-idempotency";
import { normalizeIdentityEmail } from "./inquiry-duplicate-policy";
import { rateLimited } from "./inquiry-errors";

export type EmailDeliveryState = "sent" | "delayed";

export type InquiryServiceResult = {
  response: InquirySubmissionResponse;
  // The route maps replay -> 200, new -> 201.
  replay: boolean;
  emailDelivery: EmailDeliveryState;
};

export type InquiryServiceDeps = {
  repository: InquiryRepository;
  emailProvider: EmailProvider;
  ipRateLimiter: RateLimiter;
  emailRateLimiter: RateLimiter;
};

// The application service (spec §9). Thin orchestration: rate-limit, persist
// atomically, then dispatch email AFTER commit. The DB transaction (repository)
// is the only place multi-table writes happen — this layer never does partial
// sequential writes.
export async function submitInquiry(
  payload: InquirySubmissionRequest,
  ctx: InquiryRequestContext,
  deps: InquiryServiceDeps,
): Promise<InquiryServiceResult> {
  const emailKey = normalizeIdentityEmail(payload.workEmail);

  // Rate limit both by IP and by normalized email (owner C burst protection).
  if (
    !deps.ipRateLimiter.check(ctx.ipHash).allowed ||
    !deps.emailRateLimiter.check(emailKey).allowed
  ) {
    throw rateLimited();
  }

  const fingerprint = computeFingerprint(payload);

  // Atomic persistence. Throws InquiryError (e.g. idempotency conflict) which
  // the route maps to a status code.
  const persisted = await deps.repository.persist(payload, fingerprint);

  // Post-commit email dispatch. Best-effort: the lead is already durable, so an
  // email failure never fails the inquiry — it downgrades emailDelivery and
  // marks the event. On a replay we do not re-send (the original already ran).
  let emailDelivery: EmailDeliveryState = "sent";
  if (!persisted.replay) {
    emailDelivery = await dispatchEmails(payload, persisted.submissionId, deps);
  }

  return {
    replay: persisted.replay,
    emailDelivery,
    response: {
      ok: true,
      leadId: persisted.leadId,
      submissionId: persisted.submissionId,
      status: "received",
      // Appointment wiring is a later work order; not available yet.
      appointmentNextStep: { available: false },
    },
  };
}

async function dispatchEmails(
  payload: InquirySubmissionRequest,
  submissionId: string,
  deps: InquiryServiceDeps,
): Promise<EmailDeliveryState> {
  const inquiry = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    workEmail: payload.workEmail,
    businessName: payload.businessName,
    workflowDescription: payload.workflowDescription,
  };

  // Recipient/reply-to are resolved per job, inside its own try — the internal
  // recipient is never sourced from visitor input (bug fixed: it previously
  // reused payload.workEmail for internal_notification too).
  const jobs: Array<{ kind: EmailKind; build: () => InquiryEmailRequest }> = [
    {
      kind: "visitor_confirmation",
      build: () => ({
        kind: "visitor_confirmation",
        inquiryId: submissionId,
        recipient: payload.workEmail,
        replyTo: resolveInquiryEmailInternalTo(),
        idempotencyKey: buildEmailIdempotencyKey(submissionId, "visitor_confirmation"),
        inquiry,
      }),
    },
    {
      kind: "internal_notification",
      build: () => ({
        kind: "internal_notification",
        inquiryId: submissionId,
        recipient: resolveInquiryEmailInternalTo(),
        replyTo: payload.workEmail,
        idempotencyKey: buildEmailIdempotencyKey(submissionId, "internal_notification"),
        inquiry,
      }),
    },
  ];

  let anyFailed = false;
  for (const job of jobs) {
    try {
      const { providerId } = await deps.emailProvider.send(job.build());
      await deps.repository.markEmailEvent(submissionId, job.kind, "sent", providerId);
    } catch {
      anyFailed = true;
      // Mark failed but keep going; never throw — inquiry already succeeded.
      await safeMarkFailed(deps.repository, submissionId, job.kind);
    }
  }
  return anyFailed ? "delayed" : "sent";
}

async function safeMarkFailed(
  repository: InquiryRepository,
  submissionId: string,
  kind: EmailKind,
): Promise<void> {
  try {
    await repository.markEmailEvent(submissionId, kind, "failed");
  } catch {
    // Even the status update failed — swallow; the inquiry is still a success.
  }
}
