// The shared HTTP transport for every remote provider.
//
// Two concerns live here because both are the same mistake if each transport
// solves them itself: *when a request may be attempted again*, and *what a caller
// is allowed to put on the wire*. A per-vendor answer to either is a per-vendor
// hole.
//
// Where retry responsibility lives
// --------------------------------
// Here, and only here. `connect` owns the retry loop, and it covers connection
// establishment alone — everything up to and including the response status line.
// The moment a 2xx response exists the loop is over, so a stream that fails
// halfway through its body is *never* retried: the caller has already been handed
// tokens, and replaying the request would duplicate them and bill for both.
// Higher layers (the orchestrator, the route) must not add a retry of their own,
// and no vendor SDK retry may be enabled underneath — either would multiply with
// this one and turn a provider's brief 429 into a sustained one.
//
// The deadline deliberately outlives `connect`. A streamed body is read long
// after the response arrives, and it has to stay cancellable for as long as that
// takes; the caller therefore owns `Deadline.release`.

import { ProviderError, RateLimitError, toAIError } from "../errors";
import { startDeadline, withRetry, type Deadline } from "../observability/resilience";
import type { ProviderId } from "./message";
import type { ProviderOptionValue, ProviderOptions, ProviderRuntimeOptions } from "./types";

/**
 * Used when a factory is constructed without runtime options.
 *
 * Deliberately the same numbers as `AI_CONFIG_DEFAULTS`, but not imported from
 * there: `config.ts` is `server-only` and this module is reachable from tests
 * that never load a configuration. The registry passes the real values through.
 */
export const TRANSPORT_DEFAULTS = {
  requestTimeoutMs: 60_000,
  maxRetries: 2,
} as const;

export type TransportRequest = {
  url: string;
  headers: Readonly<Record<string, string>>;
  /** Serialised with `JSON.stringify`; already sanitised by the caller. */
  body: unknown;
};

/**
 * A successful connection, plus the deadline still governing its body.
 *
 * `release()` is the caller's to call, once the body has been read or abandoned.
 * Until then the deadline keeps a timer alive and the response keeps a socket.
 */
export type Connection = {
  readonly response: Response;
  readonly deadline: Deadline;
};

/**
 * Issues one request, retrying only failures that happened before a response.
 *
 * `build` is a function rather than a value so each attempt gets a fresh body —
 * a body may only be consumed once, and re-sending a spent stream is a failure
 * mode that only shows up under retry.
 */
export async function connect(
  providerId: ProviderId,
  build: () => TransportRequest,
  options: ProviderRuntimeOptions = {},
  outerSignal?: AbortSignal,
): Promise<Connection> {
  const timeoutMs = options.requestTimeoutMs ?? TRANSPORT_DEFAULTS.requestTimeoutMs;
  const fetchImpl = options.fetchImpl ?? fetch;

  return withRetry(
    async () => {
      // Per attempt, not per call: a retry that inherited an expired deadline
      // would fail instantly and pointlessly.
      const deadline = startDeadline(timeoutMs, outerSignal);
      let response: Response;

      try {
        const request = build();
        response = await fetchImpl(request.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...request.headers },
          body: JSON.stringify(request.body),
          signal: deadline.signal,
        });
      } catch (error) {
        deadline.release();
        // `fetch` reports every abort the same way, so the deadline is asked
        // whether this was its doing before the failure is classified.
        const cause = deadline.toError(error);
        throw toAIError(
          cause,
          () =>
            new ProviderError(providerId, `Request to ${providerId} failed`, {
              cause,
              retryable: true,
            }),
        );
      }

      if (response.ok) return { response, deadline };

      deadline.release();
      throw await toResponseError(providerId, response);
    },
    {
      maxRetries: options.maxRetries ?? TRANSPORT_DEFAULTS.maxRetries,
      ...(options.sleep ? { sleep: options.sleep } : {}),
    },
  );
}

/**
 * Maps a non-2xx response onto a typed error.
 *
 * The body is read into `message` because it is the only place a vendor explains
 * what went wrong. It stays server-side: `safeMessage` is what a client sees, and
 * no `AIError` copies `message` into it.
 */
async function toResponseError(providerId: ProviderId, response: Response): Promise<Error> {
  const detail = await response.text().catch(() => "");

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after"));
    return new RateLimitError(`${providerId} rate limited: ${detail}`, {
      ...(Number.isFinite(retryAfter) && retryAfter > 0 ? { retryAfterMs: retryAfter * 1000 } : {}),
    });
  }

  return new ProviderError(providerId, `${providerId} returned ${response.status}: ${detail}`, {
    httpStatus: response.status,
  });
}

// --- provider option sanitisation --------------------------------------------

/**
 * Wire fields the pipeline decides, for the `/chat/completions` dialect.
 *
 * These are not "fields a vendor happens to also accept" — each one is a control
 * the rest of the stack depends on. `model` is what capability checks and cost
 * accounting were computed against; `messages` is the prompt hierarchy, so
 * setting it replaces the system layer wholesale; `stream` decides which reader
 * runs; `tools` and `tool_choice` are the permission-filtered inventory, and
 * adding to them re-opens the gate the planner closed; the token ceilings and `n`
 * are what bound the cost of a single request.
 */
export const OPENAI_PROTECTED_FIELDS: ReadonlySet<string> = new Set([
  "model",
  "messages",
  "stream",
  "stream_options",
  "tools",
  "tool_choice",
  // The pre-tools spelling. Still accepted by several compatible endpoints, and
  // therefore still a way to introduce a callable the planner never offered.
  "functions",
  "function_call",
  "response_format",
  "max_tokens",
  "max_completion_tokens",
  "n",
]);

/** The same list for the Anthropic dialect, where `system` is a top-level field. */
export const ANTHROPIC_PROTECTED_FIELDS: ReadonlySet<string> = new Set([
  "model",
  "messages",
  "system",
  "stream",
  "tools",
  "tool_choice",
  "max_tokens",
]);

/** Bounds recursion on a value that may be attacker-shaped. */
const MAX_OPTION_DEPTH = 8;

/**
 * Keys that are never a vendor option at any depth, only a way to reach the
 * prototype chain of whatever the value is merged into.
 */
const FORBIDDEN_KEYS: ReadonlySet<string> = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Reduces caller-supplied vendor options to what is safe to put on the wire.
 *
 * Two rules, both deny-by-default. A protected key is dropped, because the
 * pipeline already decided that field. A value that is not JSON — a function, a
 * `Date`, a class instance, `undefined` — is dropped, because a value whose shape
 * cannot be enumerated cannot be checked, and an unenumerable value is exactly
 * how a protected field gets smuggled in one level down.
 *
 * Dropping rather than throwing: an unusable option is a caller mistake, not an
 * attack in progress, and failing the whole request would make a harmless typo
 * an outage. What matters is that it never reaches the vendor.
 *
 * The input is never mutated. The result is a fresh, null-prototype-free plain
 * object safe to spread into a request body.
 */
export function sanitizeProviderOptions(
  options: ProviderOptions | undefined,
  protectedFields: ReadonlySet<string>,
): Record<string, ProviderOptionValue> {
  if (!options || typeof options !== "object") return {};

  const safe: Record<string, ProviderOptionValue> = {};
  for (const [key, value] of Object.entries(options)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    // Case-insensitively, because JSON keys are compared by the vendor after its
    // own normalisation and `Stream` is not meaningfully different from `stream`.
    if (protectedFields.has(key.toLowerCase())) continue;

    const cleaned = cleanValue(value, 0);
    if (cleaned !== undefined) safe[key] = cleaned;
  }
  return safe;
}

/** Returns a JSON-safe copy, or `undefined` when the value cannot be one. */
function cleanValue(value: unknown, depth: number): ProviderOptionValue | undefined {
  if (depth > MAX_OPTION_DEPTH) return undefined;
  if (value === null) return null;

  switch (typeof value) {
    case "string":
    case "boolean":
      return value;
    case "number":
      // `NaN` and the infinities serialise to `null`, which is a different value
      // than the caller wrote. Dropping is the honest translation.
      return Number.isFinite(value) ? value : undefined;
    case "object":
      break;
    default:
      return undefined;
  }

  if (Array.isArray(value)) {
    const items: ProviderOptionValue[] = [];
    for (const item of value) {
      const cleaned = cleanValue(item, depth + 1);
      // A hole would shift every later index, so an unusable element drops the
      // array rather than silently reordering it.
      if (cleaned === undefined) return undefined;
      items.push(cleaned);
    }
    return items;
  }

  // Plain objects only. A class instance, a `Map`, a `Date` — anything with a
  // custom prototype — is rejected rather than flattened into something the
  // caller did not write.
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return undefined;

  const nested: Record<string, ProviderOptionValue> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    const cleaned = cleanValue(item, depth + 1);
    if (cleaned !== undefined) nested[key] = cleaned;
  }
  return nested;
}
