import "server-only";

import { InMemoryRateLimiter } from "@/lib/inquiry/server/inquiry-rate-limit";

const LIMIT = Number(process.env.PROPOSAL_PUBLIC_RATE_LIMIT ?? "40");
const WINDOW_MS = Number(process.env.PROPOSAL_PUBLIC_RATE_LIMIT_WINDOW_MS ?? String(60_000));

// The token itself is deliberately not part of the limiter key. Rate limiting must not create
// a token-existence oracle where valid and invalid links occupy different buckets.
export const publicProposalRateLimiter = new InMemoryRateLimiter(LIMIT, WINDOW_MS);
