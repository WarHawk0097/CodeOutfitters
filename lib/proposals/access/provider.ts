// The secure-proposal provider contracts.
//
// Two boundaries, and they are not the same boundary:
//
//   internal   an authenticated staff member acting inside their own workspace. The
//              workspace comes from the session, never from the request body.
//   public     an anonymous holder of a secure token. Everything — workspace, publication,
//              proposal, actor, instant, resulting status — is DERIVED from the token by the
//              server. The only thing the browser supplies is the token, the message it
//              typed, and an idempotency key.
//
// The public intents below are the reason this file exists. Every field a browser could use
// to point the operation somewhere else is absent from the type, so a forged workspace or a
// backdated event is not "rejected by validation", it is unrepresentable.
//
// There is no fallback plane. If the live provider is not connected the public route says the
// proposal is temporarily unavailable and the internal panel says the provider is required.
// Live mode never shows demo publications, because a proposal a workspace did not publish is
// not a proposal, it is a document with somebody else's client's name on it.
import type {
  ClientResponseType,
  ProposalAccessLink,
  ProposalClientResponse,
  ProposalPublication,
  ProposalPublicViewModel,
} from "./model";

// ---------------------------------------------------------------------------
// Internal (authenticated, workspace-scoped)
// ---------------------------------------------------------------------------

/** Publish the current version of a proposal as an immutable client-safe snapshot.
 *
 *  Deliberately absent: `publishedAt`, `publishedByUserId`, `workspaceId`. The instant is the
 *  database clock, the author is the session, the workspace is the session's workspace. */
export type PublishProposalIntent = {
  internalProposalId: string;
  versionLabel: string;
};

/** Deliberately absent: `token`, `tokenHash`, `createdAt`, `createdByUserId`. The token is
 *  generated server-side and returned exactly once; nothing else about it is caller-supplied. */
export type CreateAccessLinkIntent = {
  publicationId: string;
  recipientName: string;
  recipientEmail: string;
  /** Absolute expiry, validated server-side against the server clock. A caller may ask for a
   *  date; it may not ask for one in the past. */
  expiresAt: string;
  /** Set when this link replaces one being revoked in the same operation. */
  replacesAccessLinkId?: string;
};

export type RevokeAccessLinkIntent = { accessLinkId: string };

/** The raw token exists in exactly one place in this system's lifetime: this result. */
export type CreatedAccessLink = {
  link: ProposalAccessLink;
  /** Show once, then discard. Never logged, never re-readable, never persisted. */
  rawToken: string;
};

export type ProposalAccessAdminProvider = {
  publish(intent: PublishProposalIntent): Promise<ProposalPublication>;
  listPublications(internalProposalId: string): Promise<ProposalPublication[]>;
  createLink(intent: CreateAccessLinkIntent): Promise<CreatedAccessLink>;
  revokeLink(intent: RevokeAccessLinkIntent): Promise<ProposalAccessLink>;
  listLinks(publicationId: string): Promise<ProposalAccessLink[]>;
  listResponses(publicationId: string): Promise<ProposalClientResponse[]>;
};

// ---------------------------------------------------------------------------
// Public (token-scoped, anonymous)
// ---------------------------------------------------------------------------

/** A meaningful open. `sessionKey` deduplicates one reader's session so a reload, a prefetch
 *  or a second tab does not inflate the count; it is opaque and carries no identity. */
export type RecordOpenIntent = {
  rawToken: string;
  sessionKey: string;
};

/** Everything the operation acts on is derived from `rawToken`.
 *
 *  Absent on purpose, and this is the whole point of the type: workspaceId, publicationId,
 *  proposalId, actorId, actorKind, occurredAt, resulting proposal status, access state, open
 *  count. A public caller states what it typed and nothing about where it lands. */
export type SubmitResponseIntent = {
  rawToken: string;
  responseType: ClientResponseType;
  message: string;
  typedName: string;
  authorizationConfirmed: boolean;
  /** Client-generated and scoped to the link server-side. A retry with the same key returns
   *  the stored response rather than writing a second one. */
  idempotencyKey: string;
};

export type SubmitResponseResult =
  | { ok: true; replay: boolean; view: ProposalPublicViewModel }
  | { ok: false; reason: PublicResponseRejection; view: ProposalPublicViewModel };

/** Why a public submission was refused. Each maps to one safe sentence — never a provider
 *  message, never a database error, never a field the client did not send. */
export const PUBLIC_RESPONSE_REJECTIONS = [
  "not_available",
  "closed",
  "conflicting_decision",
  "invalid",
  "rate_limited",
  "unavailable",
] as const;
export type PublicResponseRejection = (typeof PUBLIC_RESPONSE_REJECTIONS)[number];

export const PUBLIC_RESPONSE_REJECTION_MESSAGES: Record<PublicResponseRejection, string> = {
  not_available: "We could not open a proposal for this link.",
  closed: "This proposal is no longer accepting responses.",
  conflicting_decision:
    "A decision has already been recorded for this proposal. It cannot be changed from this page.",
  invalid: "Please check the highlighted fields and try again.",
  rate_limited: "Too many attempts. Please wait a moment and try again.",
  unavailable: "We could not record that just now. Please try again shortly.",
};

/**
 * Requirements on any live implementation of {@link ProposalPublicProvider}. These are stated
 * as a contract rather than enforced by a wrapper here, because there is no live public
 * request path in this release: the plane resolves to `provider_required`, so a rate limiter
 * written now would sit in front of nothing and would be a control that does not work.
 *
 *   * Hash the token in the caller (lib/proposals/access/token.ts) and pass only the hash to
 *     the database. A raw token in a query log is a raw token in a backup.
 *   * Rate-limit `resolve` and `submit` per request context, reusing the existing limiter in
 *     lib/inquiry/server/inquiry-rate-limit.ts with the hashed client identifier from
 *     inquiry-request-context.ts. Without it, a public route with no session is a token
 *     oracle that answers as fast as the network allows.
 *   * Return `rate_limited` from {@link PUBLIC_RESPONSE_REJECTIONS} rather than a network
 *     error, so the page can say something true to the person waiting.
 *   * Never log the token, the internal proposal id, or a database error message.
 */
export type ProposalPublicProvider = {
  /** Returns only the sanitized view model — never a stored row, never an internal id. */
  resolve(rawToken: string): Promise<ProposalPublicViewModel>;
  recordOpen(intent: RecordOpenIntent): Promise<void>;
  submit(intent: SubmitResponseIntent): Promise<SubmitResponseResult>;
};

// ---------------------------------------------------------------------------
// Plane resolution
// ---------------------------------------------------------------------------

export type SecureProposalPlane =
  | { kind: "demo" }
  | { kind: "provider_required"; reason: string };

export const SECURE_PROPOSAL_PROVIDER_REQUIRED_TITLE =
  "Client access is not connected yet";

export const SECURE_PROPOSAL_PROVIDER_REQUIRED_REASON =
  "This workspace is running in live mode. Publications, secure links and client responses are stored in the workspace database and read with your session, so they are not available until the secure proposal service is connected. Nothing is being kept in this browser, and no demo publication is being shown in its place.";

/** What a client sees when the live provider is absent. It does not say the proposal does not
 *  exist — that would be a lie about their proposal — and it does not show them a demo one. */
export const PUBLIC_TEMPORARILY_UNAVAILABLE_TITLE = "This proposal is temporarily unavailable";

export const PUBLIC_TEMPORARILY_UNAVAILABLE_DETAIL =
  "We could not load this proposal right now. Your link has not been changed. Please try again shortly, or contact the person who sent it to you.";

export function resolveSecureProposalPlane(live: boolean): SecureProposalPlane {
  return live
    ? { kind: "provider_required", reason: SECURE_PROPOSAL_PROVIDER_REQUIRED_REASON }
    : { kind: "demo" };
}
