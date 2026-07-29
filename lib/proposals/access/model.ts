// Secure client proposal access — the shared domain.
//
// One vocabulary for the whole feature: what a publication is, what an access link is, what
// state that link is in, and what a person outside the workspace is allowed to see. The
// internal Client Access panel, the public /proposal/[secureToken] page, the demo provider
// and the live provider all derive from this file, so the state a staff member reads and the
// state the client sees can never be two different opinions.
//
// Pure module: no React, no store, no clock, no crypto, no random source. Every function that
// needs "now" is handed it, because the demo has a fixed instant and the server has the
// database clock, and neither of them is this module's business.
//
// The line this file exists to hold: a public view model is BUILT here by naming the fields
// that may cross the boundary, never by deleting fields from an internal record. A record
// that grows a new internal field does not silently start leaking it.
import type { DocBlock, ProposalBuilderDetail } from "@/lib/command-center/proposals/model";

// ---------------------------------------------------------------------------
// Publication — an immutable, client-safe snapshot of one proposal version
// ---------------------------------------------------------------------------

export const PUBLICATION_STATUSES = ["published", "superseded", "withdrawn"] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export const PUBLICATION_STATUS_LABELS: Record<PublicationStatus, string> = {
  published: "Published",
  superseded: "Superseded by a newer version",
  withdrawn: "Withdrawn",
};

/** One navigable part of the published document. `id` is the anchor target, so every entry
 *  in the section navigation resolves to a heading that exists on the page. */
export type PublicSection = {
  id: string;
  navLabel: string;
  blocks: readonly DocBlock[];
};

/** Exactly what a client may read. Nothing outside this type is ever sent to a public
 *  request — see {@link INTERNAL_PUBLICATION_FIELDS} for what is deliberately held back. */
export type ProposalPublicSnapshot = {
  title: string;
  clientOrganisation: string;
  versionLabel: string;
  netTerms: string;
  currency: "USD";
  /** Null when the published version carries no priced total. */
  totalCents: number | null;
  sections: readonly PublicSection[];
};

/** Fields that live on the internal proposal/publication and must never appear in a public
 *  payload. Named so the exclusion is a testable list rather than a habit. */
export const INTERNAL_PUBLICATION_FIELDS = [
  "workspaceId",
  "internalProposalId",
  "publishedByUserId",
  "publishedByLabel",
  "recipientEmail",
  "tokenHash",
  "openCount",
  "firstOpenedAt",
  "lastOpenedAt",
  "revokedByUserId",
  "validation",
  "blockedReason",
  "pdfStatus",
  "internalNotes",
] as const;

export type ProposalPublication = {
  /** Public-safe surrogate id. Never the internal proposal id, and never sent to a client. */
  id: string;
  workspaceId: string;
  /** The internal record this was published from, e.g. "PRO-2031". Internal only. */
  internalProposalId: string;
  versionNumber: number;
  versionLabel: string;
  title: string;
  clientOrganisation: string;
  status: PublicationStatus;
  publishedAt: string;
  publishedByUserId: string;
  publishedByLabel: string;
  supersededByPublicationId: string | null;
  snapshot: ProposalPublicSnapshot;
};

/** Freeze a snapshot on the way in.
 *
 *  A publication is a historical fact: the version a client was sent. Publishing v2 must not
 *  reach back and edit what v1 said, so the snapshot is made structurally immutable at
 *  creation rather than protected by everybody remembering not to touch it. */
export function freezeSnapshot(snapshot: ProposalPublicSnapshot): ProposalPublicSnapshot {
  for (const section of snapshot.sections) {
    for (const block of section.blocks) Object.freeze(block);
    Object.freeze(section.blocks);
    Object.freeze(section);
  }
  Object.freeze(snapshot.sections);
  return Object.freeze(snapshot);
}

/** Build the client-safe snapshot from the authored proposal.
 *
 *  The BUILDER detail is the source, not the preview document: every proposal in a workspace
 *  has authored sections, whereas the assembled preview is a rendering concern that only one
 *  fixture carries in full. Publishing must not depend on how far a preview got.
 *
 *  What is dropped here is dropped on purpose: `validation` and `blockedReason` are the
 *  internal send gate and belong to the staff member deciding whether to publish at all, not
 *  to the client reading the result. The recipient individual is not carried either — the
 *  client organisation is client-safe, an internal contact record is not. */
export function buildClientSnapshot(input: {
  detail: ProposalBuilderDetail;
  clientOrganisation: string;
}): ProposalPublicSnapshot {
  const { detail, clientOrganisation } = input;

  const totalCents = detail.pricing.length
    ? detail.pricing.reduce((sum, line) => sum + line.cents, 0)
    : null;

  const sections: PublicSection[] = detail.sections.map((section, index) => {
    const eyebrow = String(index + 1).padStart(2, "0");
    const blocks: DocBlock[] = [{ kind: "heading", eyebrow, title: section.name }];
    if (section.body.trim() !== "") blocks.push({ kind: "paragraph", text: section.body });
    if (section.kind === "pricing" && totalCents !== null) {
      blocks.push({
        kind: "pricingTable",
        lines: detail.pricing,
        totalLabel: `Total · USD · ${detail.netTerms}`,
        totalCents,
      });
    }
    if (section.kind === "milestones" && detail.milestones.length) {
      blocks.push({ kind: "milestoneTable", milestones: detail.milestones });
    }
    return { id: section.id, navLabel: `${eyebrow} · ${section.name}`, blocks };
  });

  return freezeSnapshot({
    title: detail.title,
    clientOrganisation,
    versionLabel: detail.version,
    netTerms: detail.netTerms,
    currency: "USD",
    totalCents,
    sections,
  });
}

/** Section ids, for the navigation. Every one of these is rendered as an anchor target, so a
 *  navigation entry can never point at a heading that is not on the page. */
export function sectionAnchors(snapshot: ProposalPublicSnapshot): readonly string[] {
  return snapshot.sections.map((section) => section.id);
}

// ---------------------------------------------------------------------------
// Access link
// ---------------------------------------------------------------------------

export const ACCESS_DECISIONS = ["none", "accepted", "declined"] as const;
export type AccessDecision = (typeof ACCESS_DECISIONS)[number];

export type ProposalAccessLink = {
  id: string;
  publicationId: string;
  workspaceId: string;
  recipientName: string;
  /** Internal only. Never rendered on the public route and never in a public payload. */
  recipientEmail: string;
  /** The hash of the token. The raw token exists once, in the response to whoever created
   *  the link, and is never stored anywhere by this application. */
  tokenHash: string;
  /** Demo fixtures only, and null everywhere else.
   *
   *  A demo link has no secret to protect, so its token is authored, readable and stored in
   *  plain sight — that is the honest representation of a fixture. Keeping it in a separate,
   *  separately-typed field rather than putting it in `tokenHash` means "the live plane never
   *  persists a raw token" stays true as a property of the type, not as a convention someone
   *  has to remember while writing a seed file. */
  demoToken: string | null;
  expiresAt: string;
  createdAt: string;
  createdByUserId: string;
  revokedAt: string | null;
  revokedByUserId: string | null;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  openCount: number;
  decision: AccessDecision;
  decidedAt: string | null;
  /** The name the client typed when deciding. Null until a decision exists. */
  decidedByName: string | null;
  replacesAccessLinkId: string | null;
  replacedByAccessLinkId: string | null;
};

// ---------------------------------------------------------------------------
// Access state
// ---------------------------------------------------------------------------

export const ACCESS_STATES = [
  "active",
  "expired",
  "revoked",
  "superseded",
  "accepted",
  "declined",
  "not_found",
] as const;
export type ProposalAccessState = (typeof ACCESS_STATES)[number];

/** Internal labels — what a staff member reads in the Client Access panel. */
export const ACCESS_STATE_LABELS: Record<ProposalAccessState, string> = {
  active: "Active",
  expired: "Expired",
  revoked: "Revoked",
  superseded: "Superseded",
  accepted: "Accepted",
  declined: "Declined",
  not_found: "Not found",
};

/** Public headings. The revoked wording deliberately says nothing about why a link was
 *  revoked — the reason is an internal decision and is not the client's to read. */
export const ACCESS_STATE_HEADING: Record<ProposalAccessState, string> = {
  active: "Awaiting your response",
  expired: "This proposal link has expired",
  revoked: "This proposal link is no longer active",
  superseded: "A newer version of this proposal is available",
  accepted: "Proposal accepted",
  declined: "Proposal declined",
  not_found: "This proposal link is not available",
};

export const ACCESS_STATE_DETAIL: Record<ProposalAccessState, string> = {
  active: "Read the proposal below. You can ask a question, leave a comment, accept or decline.",
  expired:
    "The link you followed has passed its expiry date. Contact the person who sent it and they can issue a new one.",
  revoked:
    "The link you followed is no longer in use. Contact the person who sent it and they can issue a new one.",
  superseded:
    "This version has been replaced. You can still read it below; contact the person who sent it for the current version.",
  accepted: "This proposal version was accepted. It stays available to read below.",
  declined: "This proposal version was declined. It stays available to read below.",
  not_found:
    "We could not open a proposal for this link. Check that you copied the whole address, or contact the person who sent it.",
};

/** Resolve the one state a link is in.
 *
 *  Order matters and is deliberate:
 *    revoked      an explicitly withdrawn link is closed even if a decision was recorded,
 *                 as is any link pointing at a publication the workspace withdrew
 *    accepted     a decided proposal stays readable — a decision is not an error
 *    declined
 *    superseded   an older version is readable, with the newer one announced
 *    expired
 *    active
 *
 *  In particular an accepted proposal is NOT treated as invalid or missing. A client who
 *  accepted last week and clicks the link again should see what they accepted. */
export function resolveAccessState(input: {
  link: ProposalAccessLink | null;
  publication: ProposalPublication | null;
  now: string;
}): ProposalAccessState {
  const { link, publication, now } = input;
  if (!link || !publication) return "not_found";
  if (link.revokedAt !== null) return "revoked";
  // Withdrawing a version closes every link into it. Otherwise a link issued before the
  // withdrawal would keep serving the document the workspace has pulled.
  if (publication.status === "withdrawn") return "revoked";
  if (link.decision === "accepted") return "accepted";
  if (link.decision === "declined") return "declined";
  if (publication.status === "superseded") return "superseded";
  if (now >= link.expiresAt) return "expired";
  return "active";
}

/** Whether the state lets the client read the document at all. Expired, revoked and unknown
 *  links show a status page and no proposal content. */
export function grantsContentAccess(state: ProposalAccessState): boolean {
  return state === "active" || state === "accepted" || state === "declined" || state === "superseded";
}

/** Whether new client input is accepted. Only an active link takes a response — a decided,
 *  expired, revoked or superseded link is read-only. */
export function acceptsResponses(state: ProposalAccessState): boolean {
  return state === "active";
}

// ---------------------------------------------------------------------------
// Client responses
// ---------------------------------------------------------------------------

export const CLIENT_RESPONSE_TYPES = ["question", "comment", "acceptance", "decline"] as const;
export type ClientResponseType = (typeof CLIENT_RESPONSE_TYPES)[number];

export const CLIENT_RESPONSE_LABELS: Record<ClientResponseType, string> = {
  question: "Question from the client",
  comment: "Comment from the client",
  acceptance: "Proposal accepted by the client",
  decline: "Proposal declined by the client",
};

export type ProposalClientResponse = {
  id: string;
  accessLinkId: string;
  publicationId: string;
  workspaceId: string;
  responseType: ClientResponseType;
  /** Plain text. Rendered as text, never as markup. */
  message: string;
  /** The name the client typed. Required for an acceptance, optional elsewhere. */
  typedName: string;
  authorizationConfirmed: boolean;
  /** Server-scoped to the access link. A retry with the same key returns the stored
   *  response instead of writing a second one. */
  idempotencyKey: string;
  respondedAt: string;
  createdAt: string;
};

export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_NOTE_LENGTH = 2000;
export const MAX_DISPLAY_NAME_LENGTH = 120;
export const MIN_TYPED_NAME_LENGTH = 2;

export type ResponseDraft =
  | { type: "question"; message: string; displayName: string }
  | { type: "comment"; message: string; displayName: string }
  | { type: "acceptance"; typedName: string; authorised: boolean; note: string }
  | { type: "decline"; reason: string; confirmed: boolean };

/** Field-keyed validation errors, so a form can associate each message with its own input
 *  rather than dumping one sentence above the whole thing.
 *
 *  This runs on the client for immediate feedback AND on the trusted boundary before
 *  anything is written. The client's result is never the one that decides. */
export function validateResponseDraft(draft: ResponseDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  const tooLong = (value: string, max: number) => value.trim().length > max;

  if (draft.type === "question" || draft.type === "comment") {
    const message = draft.message.trim();
    if (message === "") {
      errors.message =
        draft.type === "question" ? "Enter your question." : "Enter your comment.";
    } else if (tooLong(draft.message, MAX_MESSAGE_LENGTH)) {
      errors.message = `Keep this under ${MAX_MESSAGE_LENGTH} characters.`;
    }
    if (tooLong(draft.displayName, MAX_DISPLAY_NAME_LENGTH)) {
      errors.displayName = `Keep this under ${MAX_DISPLAY_NAME_LENGTH} characters.`;
    }
    return errors;
  }

  if (draft.type === "acceptance") {
    const name = draft.typedName.trim();
    if (name.length < MIN_TYPED_NAME_LENGTH) errors.typedName = "Enter your full name.";
    else if (tooLong(draft.typedName, MAX_DISPLAY_NAME_LENGTH)) {
      errors.typedName = `Keep this under ${MAX_DISPLAY_NAME_LENGTH} characters.`;
    }
    if (!draft.authorised) {
      errors.authorised = "Confirm that you are authorised to accept this proposal.";
    }
    if (tooLong(draft.note, MAX_NOTE_LENGTH)) {
      errors.note = `Keep this under ${MAX_NOTE_LENGTH} characters.`;
    }
    return errors;
  }

  if (!draft.confirmed) errors.confirmed = "Confirm that you want to decline this proposal.";
  if (tooLong(draft.reason, MAX_NOTE_LENGTH)) {
    errors.reason = `Keep this under ${MAX_NOTE_LENGTH} characters.`;
  }
  return errors;
}

export function responseTypeOf(draft: ResponseDraft): ClientResponseType {
  return draft.type === "acceptance" ? "acceptance" : draft.type === "decline" ? "decline" : draft.type;
}

/** The stored message for a draft. An acceptance stores its optional note, a decline its
 *  optional reason — the decision itself is carried by the type, not by the prose. */
export function responseMessageOf(draft: ResponseDraft): string {
  switch (draft.type) {
    case "question":
    case "comment":
      return draft.message.trim();
    case "acceptance":
      return draft.note.trim();
    case "decline":
      return draft.reason.trim();
  }
}

export function responseTypedNameOf(draft: ResponseDraft): string {
  switch (draft.type) {
    case "question":
    case "comment":
      return draft.displayName.trim();
    case "acceptance":
      return draft.typedName.trim();
    case "decline":
      return "";
  }
}

/** A decision the client already made, or null. Used to reject a conflicting second
 *  decision before anything is written. */
export function decisionConflict(
  link: ProposalAccessLink,
  next: ClientResponseType,
): AccessDecision | null {
  if (next !== "acceptance" && next !== "decline") return null;
  if (link.decision === "none") return null;
  const wanted: AccessDecision = next === "acceptance" ? "accepted" : "declined";
  return link.decision === wanted ? null : link.decision;
}

// ---------------------------------------------------------------------------
// The public view model — the only shape a public request may receive
// ---------------------------------------------------------------------------

export type PublicResponseEcho = {
  id: string;
  kind: "question" | "comment";
  message: string;
  displayName: string;
  submittedAt: string;
};

export type ProposalPublicViewModel = {
  state: ProposalAccessState;
  heading: string;
  detail: string;
  /** Present only when the state grants content access. */
  document: ProposalPublicSnapshot | null;
  /** The person the link was issued to, for the greeting. Never their email address. */
  recipientName: string | null;
  expiresAt: string | null;
  decision: { kind: "accepted" | "declined"; at: string; typedName: string | null } | null;
  newerVersionAvailable: boolean;
  /** The client's own questions and comments on this link, echoed back so a submission is
   *  visibly received rather than silently swallowed. */
  responses: readonly PublicResponseEcho[];
  canRespond: boolean;
};

/** One shape for every failure. A malformed token, an unknown token, a token for a deleted
 *  publication and a token for another workspace all produce exactly this — so the page can
 *  never be used to tell one from another. */
export const NOT_FOUND_VIEW: ProposalPublicViewModel = Object.freeze({
  state: "not_found" as const,
  heading: ACCESS_STATE_HEADING.not_found,
  detail: ACCESS_STATE_DETAIL.not_found,
  document: null,
  recipientName: null,
  expiresAt: null,
  decision: null,
  newerVersionAvailable: false,
  responses: [] as readonly PublicResponseEcho[],
  canRespond: false,
});

/** Assemble the public view model by naming every field that may cross the boundary.
 *
 *  Nothing is spread from a stored row here. A publication or a link that grows a new
 *  internal column does not start appearing on a client's screen because somebody forgot to
 *  delete it from a payload. */
export function buildPublicViewModel(input: {
  link: ProposalAccessLink | null;
  publication: ProposalPublication | null;
  responses: readonly ProposalClientResponse[];
  now: string;
}): ProposalPublicViewModel {
  const state = resolveAccessState(input);
  if (state === "not_found") return NOT_FOUND_VIEW;

  const link = input.link!;
  const publication = input.publication!;
  const shows = grantsContentAccess(state);

  const echoes: PublicResponseEcho[] = input.responses
    .filter(
      (response) =>
        response.accessLinkId === link.id &&
        (response.responseType === "question" || response.responseType === "comment"),
    )
    .sort((a, b) => (a.respondedAt === b.respondedAt ? (a.id < b.id ? -1 : 1) : a.respondedAt < b.respondedAt ? -1 : 1))
    .map((response) => ({
      id: response.id,
      kind: response.responseType as "question" | "comment",
      message: response.message,
      displayName: response.typedName || link.recipientName,
      submittedAt: response.respondedAt,
    }));

  return {
    state,
    heading: ACCESS_STATE_HEADING[state],
    detail: ACCESS_STATE_DETAIL[state],
    document: shows ? publication.snapshot : null,
    recipientName: link.recipientName,
    expiresAt: link.expiresAt,
    decision:
      link.decision === "none"
        ? null
        : {
            kind: link.decision === "accepted" ? "accepted" : "declined",
            at: link.decidedAt ?? link.createdAt,
            typedName: link.decidedByName,
          },
    newerVersionAvailable: publication.status === "superseded",
    responses: echoes,
    canRespond: acceptsResponses(state),
  };
}

// ---------------------------------------------------------------------------
// Token shape
//
// Generation and hashing are server-only (lib/proposals/access/token.ts). What lives here is
// the SHAPE check, because the public route validates the shape of what it was handed before
// it does anything with it, and the public route's domain logic is shared with the browser.
// ---------------------------------------------------------------------------

/** 256 bits. Not negotiable: this is the only thing standing between a URL and a client's
 *  commercial terms. */
export const ACCESS_TOKEN_BYTES = 32;
/** base64url of 32 bytes, unpadded. */
export const ACCESS_TOKEN_LENGTH = 43;

const LIVE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** Demo tokens are deliberately, visibly not secrets. A reader who sees one in a URL should
 *  be able to tell at a glance that nothing confidential is behind it. */
export const DEMO_TOKEN_PREFIX = "demo-proposal-";
const DEMO_TOKEN_PATTERN = /^demo-proposal-[a-z0-9][a-z0-9-]{2,60}$/;

export function isWellFormedAccessToken(raw: string): boolean {
  return LIVE_TOKEN_PATTERN.test(raw);
}

export function isDemoAccessToken(raw: string): boolean {
  return DEMO_TOKEN_PATTERN.test(raw);
}

// ---------------------------------------------------------------------------
// Copy the product must not drift on
// ---------------------------------------------------------------------------

/** What acceptance in this product is, stated plainly. It is a recorded decision with a
 *  typed name against a specific version — it is not run through a certified e-signature
 *  provider, and this release makes no claim about legal enforceability. */
export const ACCEPTANCE_RECORD_NOTICE =
  "This records your acceptance of this proposal version with the name you type below. It is not a certified electronic signature and is not presented through a third-party certified electronic-signature service.";

export const ACCEPTANCE_AUTHORISATION_LABEL =
  "I am authorised to accept this proposal on behalf of the recipient organisation.";

export const DECLINE_CONFIRMATION_LABEL =
  "I want to decline this proposal version. This decision cannot be changed from this page.";

/** Shown where a proposal has never been published. Not an error — most proposals in a
 *  workspace have not been sent to anybody. */
export const NO_PUBLICATION_NOTICE =
  "This proposal has not been published to a client yet. Publish a version to create a secure link and start recording client activity.";
