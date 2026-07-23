// Typed client for POST /api/inquiries (spec §5 shared capability "API client",
// §9 backend boundary). Every inquiry form variant submits through this one
// function, so error mapping, idempotent-replay handling, and response parsing
// live in exactly one place. Mirrors the repo's existing fetch-wrapper +
// discriminated-result conventions (see command-center lib/data/leads.ts and
// lib/booking-actions.ts).
import {
  InquirySubmissionRequestSchema,
  InquirySubmissionResponseSchema,
  InquirySubmissionErrorSchema,
  type InquirySubmissionRequest,
  type InquirySubmissionResult,
  type InquiryErrorCode,
} from "./inquiry-schema";

const ENDPOINT = "/api/inquiries";

function errorResult(
  code: InquiryErrorCode,
  message: string,
  fields?: Record<string, string>,
): InquirySubmissionResult {
  return { ok: false, error: { code, message, ...(fields ? { fields } : {}) } };
}

// Maps a non-2xx status with no parseable typed body to a failure code, so the
// UX still routes correctly when the server errors before it can serialize a
// contract body (spec §9 failure taxonomy).
function codeForStatus(status: number): InquiryErrorCode {
  if (status === 409) return "duplicate";
  if (status === 429) return "rate_limited";
  if (status === 400 || status === 422) return "validation";
  return "server_error";
}

export async function submitInquiry(
  request: InquirySubmissionRequest,
): Promise<InquirySubmissionResult> {
  // Client-side contract guard: never put a payload on the wire the server
  // would reject. The form resolver already validated fields; this enforces
  // the WIRE shape (strict, normalized) one last time.
  const parsed = InquirySubmissionRequestSchema.safeParse(request);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fields[key]) fields[key] = issue.message;
    }
    return errorResult("validation", "Please fix the highlighted fields.", fields);
  }

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return errorResult(
      "server_error",
      "Could not reach the server. Please check your connection and try again.",
    );
  }

  // Read the body once; it may be a success body, a typed error body, or empty.
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // no/invalid JSON body — fall through to status-based handling
  }

  if (res.ok) {
    // Idempotent replay (spec §9.6) returns the same success body, so success
    // parsing covers both first-submit and replay uniformly.
    const success = InquirySubmissionResponseSchema.safeParse(body);
    if (success.success) return success.data;
    return errorResult(
      "server_error",
      "The submission was accepted but the response was unexpected. Please contact us to confirm.",
    );
  }

  const typed = InquirySubmissionErrorSchema.safeParse(body);
  if (typed.success) return typed.data;

  return errorResult(
    codeForStatus(res.status),
    "Something went wrong submitting your inquiry. Please try again.",
  );
}
