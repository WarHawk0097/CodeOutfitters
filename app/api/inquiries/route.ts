import { InquirySubmissionRequestSchema } from "@/lib/inquiry/inquiry-schema";
import { submitInquiry } from "@/lib/inquiry/server/inquiry-service";
import { createInquiryRepository } from "@/lib/inquiry/server/inquiry-repository-factory";
import { MockEmailProvider } from "@/lib/inquiry/server/inquiry-email-dispatch";
import { ipRateLimiter, emailRateLimiter } from "@/lib/inquiry/server/inquiry-rate-limit";
import {
  buildRequestContext,
  readJsonBody,
} from "@/lib/inquiry/server/inquiry-request-context";
import {
  InquiryError,
  badRequest,
  serverError,
  validationError,
} from "@/lib/inquiry/server/inquiry-errors";

// Node runtime: the service-role Supabase client and node:crypto require it.
export const runtime = "nodejs";

// Thin Route Handler (spec §9 / owner C): parse -> validate -> service -> map.
// No DB, duplicate, email, or storage orchestration lives here — that is all
// behind lib/inquiry/server/*.
export async function POST(req: Request): Promise<Response> {
  const ctx = buildRequestContext(req);
  const headers = { "content-type": "application/json", "x-correlation-id": ctx.correlationId };

  const jsonOrStatus = await readJsonBody(req);
  if ("status" in jsonOrStatus) {
    // 415 unsupported content type / 413 too large — no body echoed.
    const message =
      jsonOrStatus.status === 413 ? "The request is too large." : "Unsupported content type.";
    return errorResponse(
      new InquiryError("validation", jsonOrStatus.status, message),
      headers,
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(jsonOrStatus.text);
  } catch {
    return errorResponse(badRequest("Malformed JSON."), headers);
  }

  // Honeypot (owner C — one signal among several, not the sole defense). The
  // hidden `_hp` field is not part of the strict schema; a bot that fills it is
  // rejected before validation. Strip it either way so strict parse succeeds.
  if (raw && typeof raw === "object") {
    const hp = (raw as Record<string, unknown>)._hp;
    if (typeof hp === "string" && hp.trim() !== "") {
      return errorResponse(badRequest("Invalid submission."), headers);
    }
    delete (raw as Record<string, unknown>)._hp;
  }

  // Server-side authoritative validation — the client's result is never trusted
  // (owner B/C). Strict schema also rejects unknown fields (422).
  const parsed = InquirySubmissionRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fields[key]) fields[key] = issue.message;
    }
    return errorResponse(validationError(fields), headers);
  }

  try {
    const repository = await createInquiryRepository();
    const result = await submitInquiry(parsed.data, ctx, {
      repository,
      emailProvider: new MockEmailProvider(),
      ipRateLimiter,
      emailRateLimiter,
    });
    // 200 for idempotent replay, 201 for a newly persisted inquiry.
    return new Response(JSON.stringify(result.response), {
      status: result.replay ? 200 : 201,
      headers,
    });
  } catch (err) {
    if (err instanceof InquiryError) return errorResponse(err, headers);
    // Never leak internals — map anything unexpected to a safe 500.
    return errorResponse(serverError(), headers);
  }
}

function errorResponse(err: InquiryError, headers: Record<string, string>): Response {
  const body = {
    ok: false as const,
    error: {
      code: err.code,
      message: err.publicMessage,
      ...(err.fields ? { fields: err.fields } : {}),
    },
  };
  return new Response(JSON.stringify(body), { status: err.status, headers });
}
