import "server-only";

// Backend-compatible rate-limit abstraction (owner C hardening 0.4).
//
// CLASSIFICATION: the shipped implementation (InMemoryRateLimiter) is
// PROCESS-MEMORY and therefore DEVELOPMENT_AND_TEST_ONLY. It does NOT provide
// production protection: state is per-process and resets on redeploy / is not
// shared across serverless instances, so a distributed attacker or a
// multi-instance deployment bypasses it.
//
// UNRESOLVED PRODUCTION DECISION: the durable production limiter (Upstash/KV,
// Redis, or a provider-managed WAF rule) is NOT chosen yet and is deferred —
// no external rate-limit provider is added in Work Order D. The route depends
// only on the RateLimiter interface below, so the production adapter drops in
// without touching callers. See work/RATE-LIMIT-CLASSIFICATION.md.
//
// `check` is synchronous today; the production adapter interface is async-ready
// via checkAsync so a network-backed store can implement it without a breaking
// change (callers should migrate to checkAsync when a durable limiter lands).
export type RateLimitResult = { allowed: boolean; retryAfterMs?: number };

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

// Production adapter interface (prepared, unimplemented — owner 0.4). A durable
// limiter implements this; nothing in Work Order D provides one.
export interface DurableRateLimiter {
  checkAsync(key: string): Promise<RateLimitResult>;
}

type Window = { count: number; resetAt: number };

// DEVELOPMENT_AND_TEST_ONLY: in-memory fixed-window limiter, per-process. Not a
// production control (see CLASSIFICATION above). The RateLimiter/DurableRateLimiter
// interfaces are the upgrade path to a shared store.
export class InMemoryRateLimiter implements RateLimiter {
  private readonly windows = new Map<string, Window>();
  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  check(key: string): RateLimitResult {
    const now = Date.now();
    const w = this.windows.get(key);
    if (!w || now >= w.resetAt) {
      this.windows.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true };
    }
    if (w.count >= this.limit) {
      return { allowed: false, retryAfterMs: w.resetAt - now };
    }
    w.count += 1;
    return { allowed: true };
  }
}

// Shared limiters. Two keys guard different abuse shapes (owner C): per-IP
// burst and per-normalized-email burst.
const PER_IP_LIMIT = Number(process.env.INQUIRY_RATE_LIMIT_IP ?? "10");
const PER_EMAIL_LIMIT = Number(process.env.INQUIRY_RATE_LIMIT_EMAIL ?? "5");
const WINDOW_MS = Number(process.env.INQUIRY_RATE_LIMIT_WINDOW_MS ?? String(10 * 60 * 1000));

export const ipRateLimiter: RateLimiter = new InMemoryRateLimiter(PER_IP_LIMIT, WINDOW_MS);
export const emailRateLimiter: RateLimiter = new InMemoryRateLimiter(PER_EMAIL_LIMIT, WINDOW_MS);
