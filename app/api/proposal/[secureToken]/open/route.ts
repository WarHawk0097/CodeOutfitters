import { NextResponse } from "next/server";
import { buildRequestContext, readJsonBody } from "@/lib/inquiry/server/inquiry-request-context";
import { LiveProposalPublicProvider } from "@/lib/proposals/access/live-public-provider";
import { PublicProposalOpenSchema } from "@/lib/proposals/access/public-api";
import { publicProposalRateLimiter } from "@/lib/proposals/access/public-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const provider = new LiveProposalPublicProvider();
const HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ secureToken: string }> },
): Promise<Response> {
  const { ipHash } = buildRequestContext(request);
  const limited = publicProposalRateLimiter.check(`public-proposal:${ipHash}`);
  if (!limited.allowed) {
    return new NextResponse(null, {
      status: 429,
      headers: {
        ...HEADERS,
        "Retry-After": String(Math.max(1, Math.ceil((limited.retryAfterMs ?? 1000) / 1000))),
      },
    });
  }

  const body = await readJsonBody(request);
  if ("status" in body) return new NextResponse(null, { status: body.status, headers: HEADERS });
  let raw: unknown;
  try {
    raw = JSON.parse(body.text);
  } catch {
    return new NextResponse(null, { status: 400, headers: HEADERS });
  }
  const parsed = PublicProposalOpenSchema.safeParse(raw);
  if (!parsed.success) return new NextResponse(null, { status: 422, headers: HEADERS });

  const { secureToken } = await params;
  try {
    await provider.recordOpen({ rawToken: secureToken, sessionKey: parsed.data.sessionKey });
    // Deliberately no body. An open endpoint never reveals whether the token matched.
    return new NextResponse(null, { status: 204, headers: HEADERS });
  } catch {
    // Same empty shape; availability is not a token oracle.
    return new NextResponse(null, { status: 503, headers: HEADERS });
  }
}
