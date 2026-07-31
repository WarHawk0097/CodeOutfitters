// Retries, timeouts and rate limiting.
//
// Grouped in one module because they are the same concern seen three ways: how
// much work a caller is allowed to cause. They are policy, not transport, so they
// sit above the providers and apply identically to all of them — a vendor SDK's
// own retry logic would be invisible here and would multiply with this one.
//
// Everything is injectable (`sleep`, `now`) so the tests exercise the real
// backoff arithmetic without spending real seconds.

import { RateLimitError, TimeoutError, isRetryable } from "../errors";

export type RetryOptions = {
  maxRetries: number;
  /** Delay before the first retry. Doubles each attempt, capped by `maxDelayMs`. */
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Injected in tests; defaults to a real timer. */
  sleep?: (ms: number) => Promise<void>;
  /** Deterministic in tests; defaults to `Math.random`. */
  random?: () => number;
  onRetry?: (attempt: number, delayMs: number, error: unknown) => void;
};

const defaultSleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs an operation, retrying only failures marked retryable.
 *
 * Full jitter — a random delay in `[0, backoff]` rather than the backoff itself —
 * because synchronised retries from many requests are what turn a provider's
 * brief 429 into a sustained one. A `RateLimitError` carrying `retryAfterMs` wins
 * over the computed delay: the provider knows better than the formula.
 */
export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const baseDelayMs = options.baseDelayMs ?? 250;
  const maxDelayMs = options.maxDelayMs ?? 8_000;
  const sleep = options.sleep ?? defaultSleep;
  const random = options.random ?? Math.random;

  let lastError: unknown;
  for (let attempt = 0; attempt <= options.maxRetries; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === options.maxRetries) throw error;

      const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      const hinted = error instanceof RateLimitError ? error.retryAfterMs : undefined;
      const delayMs = hinted ?? Math.floor(random() * backoff);
      options.onRetry?.(attempt + 1, delayMs, error);
      await sleep(delayMs);
    }
  }
  throw lastError;
}

/**
 * Applies a deadline to a promise, and cancels the work underneath it.
 *
 * The returned signal is passed into the operation so that a timeout aborts the
 * in-flight request rather than merely abandoning it — otherwise a slow provider
 * call keeps a socket and its tokens alive after the caller has given up.
 */
export async function withTimeout<T>(
  timeoutMs: number,
  operation: (signal: AbortSignal) => Promise<T>,
  outerSignal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const forwardAbort = (): void => controller.abort();
  outerSignal?.addEventListener("abort", forwardAbort, { once: true });

  try {
    return await operation(controller.signal);
  } catch (error) {
    if (timedOut) throw new TimeoutError(timeoutMs, `Operation exceeded ${timeoutMs}ms`, { cause: error });
    throw error;
  } finally {
    clearTimeout(timer);
    outerSignal?.removeEventListener("abort", forwardAbort);
  }
}

/**
 * A fixed-window rate limiter, keyed per subject.
 *
 * In-memory and therefore per-instance: it bounds one process, not the fleet. The
 * interface is what matters — a Redis-backed limiter substitutes without any call
 * site changing. Stated plainly because a per-instance limiter that is mistaken
 * for a global one is worse than none.
 */
export class InMemoryRateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs = 60_000,
    private readonly now: () => number = Date.now,
  ) {}

  /** Throws `RateLimitError` when the window is exhausted; otherwise records the hit. */
  consume(key: string): void {
    const timestamp = this.now();
    const entry = this.hits.get(key);

    if (!entry || timestamp >= entry.resetAt) {
      this.hits.set(key, { count: 1, resetAt: timestamp + this.windowMs });
      return;
    }

    if (entry.count >= this.limit) {
      throw new RateLimitError(`Rate limit of ${this.limit} per ${this.windowMs}ms exceeded`, {
        retryAfterMs: entry.resetAt - timestamp,
      });
    }
    entry.count += 1;
  }

  /** Drops expired windows. Called opportunistically; nothing depends on it running. */
  prune(): void {
    const timestamp = this.now();
    for (const [key, entry] of this.hits) {
      if (timestamp >= entry.resetAt) this.hits.delete(key);
    }
  }
}
