// Every way the AI stack is allowed to fail.
//
// One typed hierarchy, because the layers above have to make different decisions
// for different failures and a string message cannot be branched on: a rate limit
// is worth retrying, a validation error never is, and a permission denial must
// surface to the user as a refusal rather than as an outage. The pipeline retries
// on `retryable`, the transport maps `httpStatus`, and nothing anywhere parses an
// error message to decide what happened.
//
// `safeMessage` is the only text that may cross the network boundary to a client.
// Provider errors routinely quote the failing request back — including headers —
// so the raw message stays server-side in `message` and the client gets a constant.

/** Stable, machine-readable failure codes. Logged and branched on; never rendered raw. */
export type AIErrorCode =
  | "ai/configuration"
  | "ai/provider"
  | "ai/timeout"
  | "ai/rate_limit"
  | "ai/validation"
  | "ai/tool"
  | "ai/permission"
  | "ai/cancelled"
  | "ai/unsupported";

export type AIErrorOptions = {
  cause?: unknown;
  /** Overrides the per-class default. A 5xx from a provider is retryable; a 400 is not. */
  retryable?: boolean;
  /** Client-safe text. Defaults to a constant per class — never the raw message. */
  safeMessage?: string;
};

/** Base for everything thrown inside `lib/ai`. */
export class AIError extends Error {
  readonly code: AIErrorCode;
  readonly retryable: boolean;
  readonly safeMessage: string;

  constructor(code: AIErrorCode, message: string, options: AIErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = new.target.name;
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.safeMessage = options.safeMessage ?? "The assistant could not complete that request.";
  }

  /** The only representation that may be sent to a client. */
  toClientJSON(): { code: AIErrorCode; message: string; retryable: boolean } {
    return { code: this.code, message: this.safeMessage, retryable: this.retryable };
  }
}

/** Missing or malformed configuration. Never retryable — the process needs fixing. */
export class ConfigurationError extends AIError {
  constructor(message: string, options: AIErrorOptions = {}) {
    super("ai/configuration", message, {
      ...options,
      retryable: false,
      safeMessage: options.safeMessage ?? "The assistant is not configured.",
    });
  }
}

/** A provider answered, but not with a usable result. */
export class ProviderError extends AIError {
  readonly providerId: string;
  readonly httpStatus?: number;

  constructor(
    providerId: string,
    message: string,
    options: AIErrorOptions & { httpStatus?: number } = {},
  ) {
    super("ai/provider", message, {
      ...options,
      // 408/409/425/429 and 5xx are transient; everything else is the caller's fault.
      retryable: options.retryable ?? isTransientStatus(options.httpStatus),
      safeMessage: options.safeMessage ?? "The assistant's model provider failed to respond.",
    });
    this.providerId = providerId;
    this.httpStatus = options.httpStatus;
  }
}

export class TimeoutError extends AIError {
  readonly timeoutMs: number;

  constructor(timeoutMs: number, message = `Timed out after ${timeoutMs}ms`, options: AIErrorOptions = {}) {
    super("ai/timeout", message, {
      ...options,
      retryable: options.retryable ?? true,
      safeMessage: options.safeMessage ?? "The assistant took too long to respond.",
    });
    this.timeoutMs = timeoutMs;
  }
}

export class RateLimitError extends AIError {
  /** From `Retry-After` where the provider sends one. */
  readonly retryAfterMs?: number;

  constructor(message: string, options: AIErrorOptions & { retryAfterMs?: number } = {}) {
    super("ai/rate_limit", message, {
      ...options,
      retryable: options.retryable ?? true,
      safeMessage: options.safeMessage ?? "The assistant is rate limited. Try again shortly.",
    });
    this.retryAfterMs = options.retryAfterMs;
  }
}

/** Input that failed a schema. Covers tool arguments, config and client payloads. */
export class ValidationError extends AIError {
  /** Field-level detail. Safe to show: it describes the caller's own input shape. */
  readonly issues: readonly string[];

  constructor(message: string, issues: readonly string[] = [], options: AIErrorOptions = {}) {
    super("ai/validation", message, {
      ...options,
      retryable: false,
      safeMessage: options.safeMessage ?? "That request was not valid.",
    });
    this.issues = issues;
  }
}

/** A tool was reached and threw. Distinct from validation, which never reaches it. */
export class ToolError extends AIError {
  readonly toolName: string;

  constructor(toolName: string, message: string, options: AIErrorOptions = {}) {
    super("ai/tool", message, {
      ...options,
      retryable: options.retryable ?? false,
      safeMessage: options.safeMessage ?? "An assistant action failed.",
    });
    this.toolName = toolName;
  }
}

/** Deny-by-default refused this. The model never learns why. */
export class PermissionError extends AIError {
  readonly permission: string;

  constructor(permission: string, message = `Permission not granted: ${permission}`) {
    super("ai/permission", message, {
      retryable: false,
      safeMessage: "You do not have access to that.",
    });
    this.permission = permission;
  }
}

/** Caller aborted. Not a failure — never retried, never logged as an error. */
export class CancelledError extends AIError {
  constructor(message = "The request was cancelled") {
    super("ai/cancelled", message, { retryable: false, safeMessage: "The request was cancelled." });
  }
}

/** The selected model or provider cannot do what the request asked for. */
export class UnsupportedCapabilityError extends AIError {
  readonly capability: string;

  constructor(capability: string, message: string) {
    super("ai/unsupported", message, {
      retryable: false,
      safeMessage: "The selected model does not support that.",
    });
    this.capability = capability;
  }
}

function isTransientStatus(status: number | undefined): boolean {
  if (status === undefined) return false;
  if (status >= 500) return true;
  return status === 408 || status === 409 || status === 425 || status === 429;
}

/** Narrows unknown catch bindings without `any`. */
export function isAIError(value: unknown): value is AIError {
  return value instanceof AIError;
}

/** True when a failure is worth another attempt. The retry policy's only input. */
export function isRetryable(value: unknown): boolean {
  return isAIError(value) && value.retryable;
}

/**
 * Wraps anything thrown by a dependency so the layers above only ever see `AIError`.
 * An `AbortError` from `fetch` becomes `CancelledError`, so cancellation is never
 * reported as a provider outage.
 */
export function toAIError(value: unknown, fallback: () => AIError): AIError {
  if (isAIError(value)) return value;
  if (value instanceof Error && (value.name === "AbortError" || value.name === "TimeoutError")) {
    return new CancelledError();
  }
  const error = fallback();
  return error;
}
