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
 * Recursively redacts a structured payload.
 *
 * Depth is bounded because log fields occasionally carry a cyclic object, and a
 * logger is the last place a stack overflow should be able to originate.
 */
export function redactFields(value: unknown, depth = 0): unknown {
  if (depth > 6) return REDACTED;
  if (typeof value === "string") return redactSecrets(value);
  if (Array.isArray(value)) return value.map((item) => redactFields(item, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        SENSITIVE_KEYS.test(key) ? REDACTED : redactFields(item, depth + 1),
      ]),
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
