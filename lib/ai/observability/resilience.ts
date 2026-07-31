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
 * A running request deadline.
 *
 * Separate from `withTimeout` because a streamed response outlives the call that
 * started it: the generator that reads the body needs the same signal, and needs
 * to decide for itself when the deadline stops applying. Everything else about
 * the two is identical, and `withTimeout` is written in terms of this.
 */
export type Deadline = {
  /** Passed to `fetch`. Aborts when the caller aborts or the deadline expires. */
  readonly signal: AbortSignal;
  /** True once this deadline, rather than the caller, aborted the work. */
  expired(): boolean;
  /** Releases the timer and the listener. Idempotent, and safe in a `finally`. */
  release(): void;
  /**
   * Re-types a failure this deadline caused.
   *
   * An aborted `fetch` reports `AbortError` whoever aborted it, so the caller
   * cannot tell a timeout from a cancellation without asking the deadline. A
   * failure it did not cause is returned untouched.
   */
  toError(cause: unknown): unknown;
};

/**
 * Starts a deadline, and cancels the work underneath it when it expires.
 *
 * The signal is what makes this a deadline rather than a stopwatch: a timeout
 * aborts the in-flight request instead of merely abandoning it, so a slow
 * provider stops holding a socket and its tokens the moment the caller gives up.
 */
export function startDeadline(timeoutMs: number, outerSignal?: AbortSignal): Deadline {
  const controller = new AbortController();
  let timedOut = false;
  let released = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const forwardAbort = (): void => controller.abort();
  // An already-aborted caller must not wait for an event that has been and gone.
  if (outerSignal?.aborted) controller.abort();
  else outerSignal?.addEventListener("abort", forwardAbort, { once: true });

  return {
    signal: controller.signal,
    expired: () => timedOut,
    release: () => {
      if (released) return;
      released = true;
      clearTimeout(timer);
      outerSignal?.removeEventListener("abort", forwardAbort);
    },
    toError: (cause) =>
      timedOut ? new TimeoutError(timeoutMs, `Operation exceeded ${timeoutMs}ms`, { cause }) : cause,
  };
}

/** Applies a deadline to a single promise. The whole-operation form of `startDeadline`. */
export async function withTimeout<T>(
  timeoutMs: number,
  operation: (signal: AbortSignal) => Promise<T>,
  outerSignal?: AbortSignal,
): Promise<T> {
  const deadline = startDeadline(timeoutMs, outerSignal);
  try {
    return await operation(deadline.signal);
  } catch (error) {
    throw deadline.toError(error);
  } finally {
    deadline.release();
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
/**
 * When a new key finds the map this big, expired windows are swept first.
 *
 * A threshold rather than a timer: nothing else in this module runs on a
 * schedule, and a sweep on a request that was going to allocate anyway is cheaper
 * than an interval that keeps the process awake.
 */
const MAX_TRACKED_KEYS = 10_000;

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
      // Only a new key can grow the map, so that is the only place growth needs
      // checking. Without this, one entry per subject ever seen is retained for
      // the lifetime of the process — a slow leak that a rate limiter, of all
      // things, should not be the source of.
      if (!entry && this.hits.size >= MAX_TRACKED_KEYS) this.prune();
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

  /** Drops expired windows. Called from `consume` when the map is large, and safe to call at any time. */
  prune(): void {
    const timestamp = this.now();
    for (const [key, entry] of this.hits) {
      if (timestamp >= entry.resetAt) this.hits.delete(key);
    }
  }
}
