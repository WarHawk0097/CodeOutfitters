import { NextResponse } from "next/server";
import { buildRequestContext, readJsonBody } from "@/lib/inquiry/server/inquiry-request-context";
import { LiveProposalPublicProvider } from "@/lib/proposals/access/live-public-provider";
import { PublicProposalSubmitSchema, toSubmitIntent } from "@/lib/proposals/access/public-api";
import { publicProposalRateLimiter } from "@/lib/proposals/access/public-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const provider = new LiveProposalPublicProvider();
const HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function limited(request: Request): Response | null {
  const { ipHash } = buildRequestContext(request);
  const result = publicProposalRateLimiter.check(`public-proposal:${ipHash}`);
  if (result.allowed) return null;
  return NextResponse.json(
    { ok: false, error: { code: "rate_limited", message: "Please wait a moment and try again." } },
    {
      status: 429,
      headers: {
        ...HEADERS,
        "Retry-After": String(Math.max(1, Math.ceil((result.retryAfterMs ?? 1000) / 1000))),
      },
    },
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ secureToken: string }> },
): Promise<Response> {
  const rateLimited = limited(request);
  if (rateLimited) return rateLimited;
  const { secureToken } = await params;
  try {
    const view = await provider.resolve(secureToken);
    return NextResponse.json({ ok: true, view }, { headers: HEADERS });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "unavailable", message: "This proposal is temporarily unavailable." } },
      { status: 503, headers: HEADERS },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ secureToken: string }> },
): Promise<Response> {
  const rateLimited = limited(request);
  if (rateLimited) return rateLimited;
  const { secureToken } = await params;

  const body = await readJsonBody(request);
  if ("status" in body) {
    return NextResponse.json(
      { ok: false, error: { code: "invalid", message: "That response could not be processed." } },
      { status: body.status, headers: HEADERS },
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(body.text);
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "invalid", message: "That response could not be processed." } },
      { status: 400, headers: HEADERS },
    );
  }

  const parsed = PublicProposalSubmitSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "invalid", message: "Please check the response and try again." } },
      { status: 422, headers: HEADERS },
    );
  }
  const intent = toSubmitIntent(secureToken, parsed.data);
  if (!intent) {
    return NextResponse.json(
      { ok: false, error: { code: "invalid", message: "Please check the response and try again." } },
      { status: 422, headers: HEADERS },
    );
  }

  try {
    const result = await provider.submit(intent);
    const status = result.ok
      ? 200
      : result.reason === "rate_limited"
        ? 429
        : result.reason === "conflicting_decision" || result.reason === "closed"
          ? 409
          : result.reason === "not_available"
            ? 404
            : 503;
    return NextResponse.json(result, { status, headers: HEADERS });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "unavailable", message: "We could not record that just now." } },
      { status: 503, headers: HEADERS },
    );
  }
}
