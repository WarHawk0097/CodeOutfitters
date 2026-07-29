// The one public origin.
//
// Core v1 ships on Vercel's project domain, so `https://codeoutfitters.vercel.app`
// is the client-facing origin — not a per-deployment hostname, not a branch alias,
// not an `m.` subdomain. Every absolute URL a server response can emit resolves
// through here, and the production host redirect below folds Vercel's system
// aliases onto the canonical one.
//
// The request's own host is never used to build an absolute URL: a forwarded host
// is attacker-controllable, and a link in a password-reset email or a piece of
// canonical metadata built from it is a redirect vector. The host only answers the
// narrower question "am I currently being served on a non-canonical alias", where
// the answer is a redirect to a constant.

/** The client-facing origin. Any change to this is an architecture decision —
 *  see docs/architecture/CANONICAL-URL-POLICY.md. */
export const CANONICAL_ORIGIN = "https://codeoutfitters.vercel.app";
export const CANONICAL_HOST = "codeoutfitters.vercel.app";

/** Local development. Overridable with NEXT_PUBLIC_SITE_URL for a non-default port. */
export const DEVELOPMENT_ORIGIN = "http://localhost:3000";

export type OriginEnv = {
  /** Vercel's own environment marker: "production" | "preview" | "development". */
  VERCEL_ENV?: string;
  /** The per-deployment hostname Vercel injects, with no scheme. */
  VERCEL_URL?: string;
  NEXT_PUBLIC_SITE_URL?: string;
};

function normalize(value: string | undefined): string | null {
  const trimmed = value?.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
}

/**
 * The origin to use when an absolute URL is unavoidable — canonical metadata, a
 * sitemap entry, an emailed link.
 *
 * production → the canonical origin, always.
 * preview    → that preview's own deployment URL, so a preview links to itself.
 * anything else → NEXT_PUBLIC_SITE_URL if it parses, else localhost.
 */
export function publicOrigin(env: OriginEnv = process.env as OriginEnv): string {
  if (env.VERCEL_ENV === "production") return CANONICAL_ORIGIN;
  if (env.VERCEL_ENV === "preview") {
    const preview = normalize(env.VERCEL_URL && `https://${env.VERCEL_URL}`);
    // A preview with no injected URL is a broken assumption, not a reason to
    // hand out the production origin from a preview build.
    if (preview) return preview;
  }
  return normalize(env.NEXT_PUBLIC_SITE_URL) ?? DEVELOPMENT_ORIGIN;
}

/** Paths the host redirect must not touch: the OAuth exchange, the client-facing
 *  proposal link, the API surface, and Vercel's own internals. */
const REDIRECT_EXEMPT = ["/api", "/auth", "/proposal", "/_next", "/_vercel"];

export function isRedirectExempt(pathname: string): boolean {
  return REDIRECT_EXEMPT.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export type HostRedirectInput = {
  host: string | null | undefined;
  pathname: string;
  search?: string;
  env?: OriginEnv;
};

/**
 * The absolute canonical URL a production request on a non-canonical host should
 * be sent to, or null to leave the request alone.
 *
 * Only production redirects. A preview deployment, a branch alias and local
 * development all keep their own hostname — a preview that bounced to production
 * could not be reviewed, which is the whole point of a preview.
 *
 * The target is built from the canonical constant plus the request's own path and
 * query, so the host header cannot steer the destination, and a request already on
 * the canonical host returns null: no loop.
 */
export function canonicalHostRedirect({
  host,
  pathname,
  search = "",
  env = process.env as OriginEnv,
}: HostRedirectInput): string | null {
  if (env.VERCEL_ENV !== "production") return null;
  const hostname = host?.trim().toLowerCase().split(":")[0];
  if (!hostname || hostname === CANONICAL_HOST) return null;
  if (isRedirectExempt(pathname)) return null;
  return `${CANONICAL_ORIGIN}${pathname}${search}`;
}
