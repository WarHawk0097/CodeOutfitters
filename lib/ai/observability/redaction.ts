// Redaction, applied before anything is logged, traced or returned.
//
// Two distinct leaks are prevented here. The first is credentials: a provider
// error routinely quotes the request that failed, headers included, and that text
// must never reach a log sink. The second is prompt content: system prompts are
// product, user messages are customer data, and neither belongs in telemetry by
// default.
//
// The patterns are deliberately broad. A false positive costs a redacted log
// line; a false negative costs a key.
//
// `redactingTelemetry` is how any of this becomes load-bearing. Redaction that a
// call site has to remember to apply is redaction that will be forgotten, so the
// wrapper sits between the pipeline and the sink and there is no way past it.

import type { LogFields, Logger, LogLevel, Span, Telemetry } from "./types";

const SECRET_PATTERNS: readonly RegExp[] = [
  // Vendor key formats: a prefix, then a long opaque body.
  /\b(sk|rk|pk)-[A-Za-z0-9_-]{16,}/g,
  /\bsk-ant-[A-Za-z0-9_-]{16,}/g,
  /\bAIza[A-Za-z0-9_-]{30,}/g,
  // Authorization and API-key headers, however they are spelled.
  /\b(authorization|x-api-key|api[-_]?key|bearer)\b\s*[:=]?\s*["']?[A-Za-z0-9._~+/-]{12,}=*/gi,
  // JWTs, which show up whenever a session is echoed back.
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
];

export const REDACTED = "[redacted]";

/** Replaces anything that looks like a credential. Safe to call on any string. */
export function redactSecrets(input: string): string {
  return SECRET_PATTERNS.reduce((text, pattern) => text.replace(pattern, REDACTED), input);
}

/** Keys whose values are dropped wholesale rather than pattern-matched. */
const SENSITIVE_KEYS = /^(api_?key|apikey|authorization|token|secret|password|cookie|set-cookie)$/i;

/**
 * Keys that carry message bodies, at any depth.
 *
 * Matched by name rather than by inspecting the value, because "does this string
 * look like a prompt" has no answer. Applied only when `redactPrompts` is on, and
 * only to strings — a field already reduced to `{ length, hash }` is a summary,
 * not a body, and re-redacting it would throw away the only useful part.
 */
const CONTENT_KEYS =
  /^(prompt|prompts|text|content|message|messages|input|inputs|output|outputs|query|arguments|args|result|results|completion|instructions|reference|system)$/i;

/**
 * Recursively redacts a structured payload.
 *
 * Depth is bounded because log fields occasionally carry a cyclic object, and a
 * logger is the last place a stack overflow should be able to originate.
 *
 * Never mutates its argument: every container is rebuilt. The caller still owns
 * whatever it passed in, which matters because these are live objects the
 * pipeline is still using.
 */
export function redactFields(value: unknown, depth = 0, redactPrompts = false): unknown {
  if (depth > 6) return REDACTED;
  if (typeof value === "string") return redactSecrets(value);
  if (Array.isArray(value)) {
    return value.map((item) => redactFields(item, depth + 1, redactPrompts));
  }
  if (value && typeof value === "object") {
    // `Error` carries its interesting parts on non-enumerable properties, so
    // `Object.entries` would flatten it to `{}` and lose the classification the
    // sink is being handed it for.
    if (value instanceof Error) {
      return { name: value.name, message: redactSecrets(value.message) };
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => {
        if (SENSITIVE_KEYS.test(key)) return [key, REDACTED];
        if (redactPrompts && CONTENT_KEYS.test(key) && typeof item === "string") {
          return [key, summarizeText(item)];
        }
        return [key, redactFields(item, depth + 1, redactPrompts)];
      }),
    );
  }
  return value;
}

/**
 * Prompt text reduced to its shape.
 *
 * Length and a hash are enough to correlate a log line with a specific prompt
 * during an investigation without storing the prompt itself. The hash is FNV-1a:
 * non-cryptographic on purpose, since this is a correlation key and not a
 * commitment.
 */
export function summarizeText(text: string): { length: number; hash: string } {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return { length: text.length, hash: hash.toString(16).padStart(8, "0") };
}

// --- the seam ----------------------------------------------------------------

export type RedactionPolicy = {
  /** From `AIConfig.redactPrompts`. When true, message bodies become summaries. */
  redactPrompts: boolean;
  /** From `AIConfig.logLevel`. Records below it never reach the sink at all. */
  logLevel?: LogLevel | "silent";
};

const LEVEL_ORDER: readonly LogLevel[] = ["debug", "info", "warn", "error"];

function atLeast(level: LogLevel, threshold: LogLevel | "silent" | undefined): boolean {
  if (threshold === "silent") return false;
  if (!threshold) return true;
  return LEVEL_ORDER.indexOf(level) >= LEVEL_ORDER.indexOf(threshold);
}

function clean(fields: LogFields | undefined, policy: RedactionPolicy): LogFields | undefined {
  if (!fields) return undefined;
  return redactFields(fields, 0, policy.redactPrompts) as LogFields;
}

/**
 * Wraps a telemetry bundle so nothing reaches its sinks unredacted.
 *
 * Applied once, at the composition root, rather than at each call site: the
 * pipeline logs from a dozen places and a rule enforced by discipline is a rule
 * with a hole in it. The no-op sinks that ship today make an unredacted field
 * harmless *now*, which is precisely why the leak would go unnoticed until the
 * day a real backend is wired in — so the wrapper is unconditional.
 *
 * What survives is everything an operator actually pages on: provider id, model
 * id, latency, token usage, error code and retryability. What does not is
 * message bodies, credentials and anything matching a key pattern.
 */
export function redactingTelemetry(inner: Telemetry, policy: RedactionPolicy): Telemetry {
  const wrapLogger = (logger: Logger): Logger => ({
    log: (level, message, fields) => {
      if (!atLeast(level, policy.logLevel)) return;
      // The message is a developer-written constant, but it is redacted anyway:
      // an interpolated provider error is exactly how a key ends up in one.
      logger.log(level, redactSecrets(message), clean(fields, policy));
    },
    child: (fields) => wrapLogger(logger.child(clean(fields, policy) ?? {})),
  });

  const wrapSpan = (span: Span): Span => ({
    setAttributes: (fields) => span.setAttributes(clean(fields, policy) ?? {}),
    // Passed through whole. An `AIError` is already client-safe by construction,
    // and a span that cannot record the failure is not worth having; the sink
    // sees the same object the pipeline caught.
    recordError: (error) => span.recordError(error),
    end: () => span.end(),
  });

  return {
    logger: wrapLogger(inner.logger),
    tracer: {
      startSpan: (name, fields) => wrapSpan(inner.tracer.startSpan(name, clean(fields, policy))),
    },
    metrics: {
      // Tags are low-cardinality labels, but nothing stops a caller putting a
      // tool argument in one, so they go through the same filter.
      increment: (name, value, tags) => inner.metrics.increment(name, value, clean(tags, policy)),
      record: (name, value, tags) => inner.metrics.record(name, value, clean(tags, policy)),
    },
  };
}
