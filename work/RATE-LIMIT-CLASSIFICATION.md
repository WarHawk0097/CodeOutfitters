# Inquiry rate-limit classification (Work Order C hardening 0.4)

## Current implementation
- **Type:** PROCESS-MEMORY (`InMemoryRateLimiter`, `lib/inquiry/server/inquiry-rate-limit.ts`).
- **Classification:** `DEVELOPMENT_AND_TEST_ONLY`.
- **Not production protection.** State is per-process: it resets on redeploy and is
  not shared across serverless instances, so it does not enforce a global limit.

## What is in place
- `RateLimiter` interface (synchronous) — used by the service/route today.
- `DurableRateLimiter` interface (async) — prepared production adapter surface.
- Two keys guard distinct abuse shapes: per-IP-hash burst and per-normalized-email burst.
- IP is hashed (never persisted raw) via `inquiry-request-context.ts`.

## Unresolved production decision
No durable limiter is chosen yet. **No external rate-limit provider was added in
Work Order D.** Candidates (require owner decision + provisioning):
- Upstash Redis / Vercel KV (`@upstash/ratelimit`)
- Self-managed Redis
- Provider-managed WAF / edge rule

When chosen, implement `DurableRateLimiter`, wire it behind the existing
interface, and migrate callers to `checkAsync`. No caller change beyond the
factory is required.

**Status:** REQUIRES_HUMAN_DECISION.
