import "server-only";
import type { InquiryErrorCode } from "../inquiry-schema";

// Typed server error carrying the HTTP status and a SAFE public message. Never
// put stack traces, SQL, secrets, or internal DB detail in `publicMessage` or
// `fields` — those cross the trust boundary to the client (spec §9.16).
export class InquiryError extends Error {
  readonly code: InquiryErrorCode;
  readonly status: number;
  readonly publicMessage: string;
  readonly fields?: Record<string, string>;

  constructor(
    code: InquiryErrorCode,
    status: number,
    publicMessage: string,
    fields?: Record<string, string>,
  ) {
    super(`${code}: ${publicMessage}`);
    this.name = "InquiryError";
    this.code = code;
    this.status = status;
    this.publicMessage = publicMessage;
    this.fields = fields;
  }
}

export const validationError = (
  fields: Record<string, string>,
  message = "Please fix the highlighted fields.",
) => new InquiryError("validation", 422, message, fields);

export const idempotencyConflict = () =>
  new InquiryError(
    "duplicate",
    409,
    "This submission was already received with different details. Please start a new inquiry.",
  );

export const rateLimited = () =>
  new InquiryError(
    "rate_limited",
    429,
    "Too many submissions. Please wait a moment and try again.",
  );

export const bodyTooLarge = () =>
  new InquiryError("validation", 413, "The request is too large.");

export const badRequest = (message = "Malformed request.") =>
  new InquiryError("validation", 400, message);

export const serverError = () =>
  new InquiryError(
    "server_error",
    500,
    "Something went wrong on our end. Please try again shortly.",
  );

// Postgres raises the idempotency conflict from submit_inquiry with this token.
// Recognized structurally so a message-format change in the DB is a clear miss
// rather than a silent misclassification.
export function isIdempotencyConflict(err: unknown): boolean {
  const msg =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: unknown }).message)
      : "";
  const detail =
    err && typeof err === "object" && "details" in err
      ? String((err as { details: unknown }).details)
      : "";
  return (
    msg.includes("inquiry_idempotency_conflict") ||
    detail.includes("inquiry_idempotency_conflict")
  );
}
