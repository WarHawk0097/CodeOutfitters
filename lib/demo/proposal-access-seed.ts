// Deterministic secure-proposal fixtures for the demo plane.
//
// SCOPE: demo only. Nothing here is transmitted, nothing here is a secret, and no Supabase
// request is made to read or write any of it. The live plane never sees these records — a
// published proposal belongs to the workspace that published it, so live mode shows the
// provider-required notice rather than somebody else's client's document.
//
// Two properties this file exists to keep true:
//
//   1. Demo tokens are visibly not secrets. They are authored, readable, prefixed
//      `demo-proposal-`, and stored in `demoToken` — never in `tokenHash`, which stays empty
//      here because there is no secret to hash. A reader who sees one of these in a URL can
//      tell at a glance that nothing confidential is behind it.
//
//   2. Every fixture agrees with the proposal record it hangs off. PRO-2031 says "viewed 3×",
//      so its active link has openCount 3. PRO-2024 says "Accepted Apr 12", so its accepted
//      link was decided on April 12. A demo that contradicts itself between two screens is a
//      bug report waiting to be filed against a feature that works.
//
// Every instant is authored. No Date.now(), no new Date(), no Math.random() — the same reason
// seed.ts pins DEMO_NOW: a demo that reads the clock renders differently every run, and a
// screenshot taken today would not reproduce tomorrow.
import { buildProposalDetail } from "@/lib/command-center/proposals/fixtures";
import {
  buildClientSnapshot,
  type ProposalAccessLink,
  type ProposalClientResponse,
  type ProposalPublication,
} from "@/lib/proposals/access/model";
import type { Proposal } from "./types";
import { CURRENT_USER } from "../identity/current-user";

/** The one workspace the demo plane represents. Demo mode never selects a workspace — there
 *  is exactly one, and no browser input can point at another. */
export const DEMO_WORKSPACE_ID = "demo-workspace";

/** Authored instant. Kept as a helper only so the fixture table below reads as a table. */
function at(day: string, time: string): string {
  return `${day}T${time}:00.000Z`;
}

// ---------------------------------------------------------------------------
// Publications
//
// Three of the five demo proposals have been published. The other two have not, on purpose:
//   PRO-2034  DRAFT and validation-BLOCKED — it exercises the honest publish-blocked path.
//   PRO-2029  INTERNAL REVIEW — a proposal nobody has sent yet is the ordinary case, and the
//             Client Access panel has to say so without looking like a failure.
// ---------------------------------------------------------------------------

type PublicationFixture = {
  id: string;
  internalProposalId: string;
  versionNumber: number;
  versionLabel: string;
  status: ProposalPublication["status"];
  publishedAt: string;
  publishedByUserId: string;
  publishedByLabel: string;
  supersededByPublicationId: string | null;
};

const PUBLICATION_FIXTURES: readonly PublicationFixture[] = [
  // PRO-2031 was sent at v1, revised, and re-published at v2. The v1 publication stays —
  // deleting it would erase the version a client was actually sent.
  {
    id: "pub-2031-v1",
    internalProposalId: "PRO-2031",
    versionNumber: 1,
    versionLabel: "v1",
    status: "superseded",
    publishedAt: at("2026-04-10", "09:20"),
    publishedByUserId: "user-001",
    publishedByLabel: "Priya Nair",
    supersededByPublicationId: "pub-2031-v2",
  },
  {
    id: "pub-2031-v2",
    internalProposalId: "PRO-2031",
    versionNumber: 2,
    versionLabel: "v2",
    status: "published",
    publishedAt: at("2026-04-18", "15:05"),
    publishedByUserId: "user-001",
    publishedByLabel: "Priya Nair",
    supersededByPublicationId: null,
  },
  {
    id: "pub-2024-v3",
    internalProposalId: "PRO-2024",
    versionNumber: 3,
    versionLabel: "v3",
    status: "published",
    publishedAt: at("2026-04-06", "11:30"),
    publishedByUserId: "user-002",
    publishedByLabel: CURRENT_USER.name,
    supersededByPublicationId: null,
  },
  {
    id: "pub-2019-v1",
    internalProposalId: "PRO-2019",
    versionNumber: 1,
    versionLabel: "v1",
    status: "published",
    publishedAt: at("2026-03-24", "16:45"),
    publishedByUserId: "user-001",
    publishedByLabel: "Priya Nair",
    supersededByPublicationId: null,
  },
];

// ---------------------------------------------------------------------------
// Access links — one per access state the feature can be in
//
//   demo-proposal-harbor-superseded   superseded   an older version, still readable
//   demo-proposal-harbor-active       active       opened 3×, awaiting a decision
//   demo-proposal-harbor-awaiting     active       issued to a second stakeholder, never opened
//   demo-proposal-petal-expired       expired      passed its expiry, replaced by the next one
//   demo-proposal-petal-accepted      accepted     decided, and still readable afterwards
//   demo-proposal-titan-revoked       revoked      withdrawn, replaced by the next one
//   demo-proposal-titan-declined      declined     decided, and still readable afterwards
//
// The seventh state, not_found, has no fixture by definition: it is what an unknown token
// produces, and inventing a record for it would defeat the point.
// ---------------------------------------------------------------------------

type LinkFixture = Omit<ProposalAccessLink, "workspaceId" | "tokenHash">;

const LINK_FIXTURES: readonly LinkFixture[] = [
  {
    id: "lnk-2031-a",
    publicationId: "pub-2031-v1",
    recipientName: "Gregory Mullins",
    recipientEmail: "gregory.mullins@harborco.example",
    demoToken: "demo-proposal-harbor-superseded",
    expiresAt: at("2026-05-10", "09:20"),
    createdAt: at("2026-04-10", "09:22"),
    createdByUserId: "user-001",
    revokedAt: null,
    revokedByUserId: null,
    firstOpenedAt: at("2026-04-10", "13:40"),
    lastOpenedAt: at("2026-04-14", "08:15"),
    openCount: 2,
    decision: "none",
    decidedAt: null,
    decidedByName: null,
    replacesAccessLinkId: null,
    replacedByAccessLinkId: null,
  },
  // PRO-2031's proposal row reads "Sent Apr 18 · viewed 3×". openCount is 3 for that reason.
  {
    id: "lnk-2031-b",
    publicationId: "pub-2031-v2",
    recipientName: "Gregory Mullins",
    recipientEmail: "gregory.mullins@harborco.example",
    demoToken: "demo-proposal-harbor-active",
    expiresAt: at("2026-05-18", "15:05"),
    createdAt: at("2026-04-18", "15:07"),
    createdByUserId: "user-001",
    revokedAt: null,
    revokedByUserId: null,
    firstOpenedAt: at("2026-04-18", "18:02"),
    lastOpenedAt: at("2026-04-21", "10:26"),
    openCount: 3,
    decision: "none",
    decidedAt: null,
    decidedByName: null,
    replacesAccessLinkId: null,
    replacedByAccessLinkId: null,
  },
  // A second stakeholder on the same publication. One link per recipient is the whole reason
  // links are per-recipient: revoking one person's access must not revoke the other's.
  {
    id: "lnk-2031-c",
    publicationId: "pub-2031-v2",
    recipientName: "Dana Whitfield",
    recipientEmail: "dana.whitfield@harborco.example",
    demoToken: "demo-proposal-harbor-awaiting",
    expiresAt: at("2026-05-18", "15:05"),
    createdAt: at("2026-04-18", "15:09"),
    createdByUserId: "user-001",
    revokedAt: null,
    revokedByUserId: null,
    firstOpenedAt: null,
    lastOpenedAt: null,
    openCount: 0,
    decision: "none",
    decidedAt: null,
    decidedByName: null,
    replacesAccessLinkId: null,
    replacedByAccessLinkId: null,
  },
  // The short-dated first link on PRO-2024 lapsed before the client decided, so a second one
  // was issued. The lapsed link is kept: "this expired and was reissued" is the history.
  {
    id: "lnk-2024-a",
    publicationId: "pub-2024-v3",
    recipientName: "Hannah Liu",
    recipientEmail: "hannah.liu@petalandstem.example",
    demoToken: "demo-proposal-petal-expired",
    expiresAt: at("2026-04-10", "11:32"),
    createdAt: at("2026-04-06", "11:32"),
    createdByUserId: "user-002",
    revokedAt: null,
    revokedByUserId: null,
    firstOpenedAt: at("2026-04-07", "09:14"),
    lastOpenedAt: at("2026-04-07", "09:14"),
    openCount: 1,
    decision: "none",
    decidedAt: null,
    decidedByName: null,
    replacesAccessLinkId: null,
    replacedByAccessLinkId: "lnk-2024-b",
  },
  // PRO-2024's proposal row reads "Accepted Apr 12".
  {
    id: "lnk-2024-b",
    publicationId: "pub-2024-v3",
    recipientName: "Hannah Liu",
    recipientEmail: "hannah.liu@petalandstem.example",
    demoToken: "demo-proposal-petal-accepted",
    expiresAt: at("2026-05-10", "12:05"),
    createdAt: at("2026-04-10", "12:05"),
    createdByUserId: "user-002",
    revokedAt: null,
    revokedByUserId: null,
    firstOpenedAt: at("2026-04-11", "08:40"),
    lastOpenedAt: at("2026-04-12", "14:55"),
    openCount: 2,
    decision: "accepted",
    decidedAt: at("2026-04-12", "14:58"),
    decidedByName: "Hannah Liu",
    replacesAccessLinkId: "lnk-2024-a",
    replacedByAccessLinkId: null,
  },
  {
    id: "lnk-2019-a",
    publicationId: "pub-2019-v1",
    recipientName: "Marcus Cole",
    recipientEmail: "marcus.cole@titanmfg.example",
    demoToken: "demo-proposal-titan-revoked",
    expiresAt: at("2026-04-24", "16:47"),
    createdAt: at("2026-03-24", "16:47"),
    createdByUserId: "user-001",
    revokedAt: at("2026-03-27", "10:15"),
    revokedByUserId: "user-001",
    firstOpenedAt: at("2026-03-25", "07:50"),
    lastOpenedAt: at("2026-03-25", "07:50"),
    openCount: 1,
    decision: "none",
    decidedAt: null,
    decidedByName: null,
    replacesAccessLinkId: null,
    replacedByAccessLinkId: "lnk-2019-b",
  },
  // Declined. `decidedByName` is null and not "Marcus Cole": declining does not ask for a
  // typed name, so recording one would be a name nobody typed.
  {
    id: "lnk-2019-b",
    publicationId: "pub-2019-v1",
    recipientName: "Marcus Cole",
    recipientEmail: "marcus.cole@titanmfg.example",
    demoToken: "demo-proposal-titan-declined",
    expiresAt: at("2026-04-27", "10:18"),
    createdAt: at("2026-03-27", "10:18"),
    createdByUserId: "user-001",
    revokedAt: null,
    revokedByUserId: null,
    firstOpenedAt: at("2026-03-28", "09:05"),
    lastOpenedAt: at("2026-04-02", "11:20"),
    openCount: 4,
    decision: "declined",
    decidedAt: at("2026-04-02", "11:24"),
    decidedByName: null,
    replacesAccessLinkId: "lnk-2019-a",
    replacedByAccessLinkId: null,
  },
];

// ---------------------------------------------------------------------------
// Client responses
//
// Each one belongs to a link that was in a state that accepted responses at the time it was
// written — a question on an active link, a decision on the link that carries that decision.
// ---------------------------------------------------------------------------

type ResponseFixture = Omit<ProposalClientResponse, "workspaceId" | "publicationId">;

const RESPONSE_FIXTURES: readonly ResponseFixture[] = [
  {
    id: "res-2031-b-1",
    accessLinkId: "lnk-2031-b",
    responseType: "question",
    message:
      "The integration scope covers our accounting platform and the client portal. Does the fixed price hold if we add a second portal environment for staging?",
    typedName: "Gregory Mullins",
    authorizationConfirmed: false,
    idempotencyKey: "demo-res-2031-b-1",
    respondedAt: at("2026-04-19", "09:12"),
    createdAt: at("2026-04-19", "09:12"),
  },
  {
    id: "res-2031-b-2",
    accessLinkId: "lnk-2031-b",
    responseType: "comment",
    message:
      "Sharing this with our finance lead before we confirm. The milestone split works for us as written.",
    typedName: "Gregory Mullins",
    authorizationConfirmed: false,
    idempotencyKey: "demo-res-2031-b-2",
    respondedAt: at("2026-04-21", "10:31"),
    createdAt: at("2026-04-21", "10:31"),
  },
  {
    id: "res-2024-b-1",
    accessLinkId: "lnk-2024-b",
    responseType: "acceptance",
    message: "Happy to proceed. Please send the schedule for the first milestone.",
    typedName: "Hannah Liu",
    authorizationConfirmed: true,
    idempotencyKey: "demo-res-2024-b-1",
    respondedAt: at("2026-04-12", "14:58"),
    createdAt: at("2026-04-12", "14:58"),
  },
  // PRO-2019's proposal row reads "Went in-house".
  {
    id: "res-2019-b-1",
    accessLinkId: "lnk-2019-b",
    responseType: "decline",
    message: "We are taking this in-house for now. Thanks for the detail on the phasing.",
    typedName: "",
    authorizationConfirmed: false,
    idempotencyKey: "demo-res-2019-b-1",
    respondedAt: at("2026-04-02", "11:24"),
    createdAt: at("2026-04-02", "11:24"),
  },
];

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

export type ProposalAccessSeed = {
  publications: ProposalPublication[];
  accessLinks: ProposalAccessLink[];
  clientResponses: ProposalClientResponse[];
};

/** Build the secure-proposal fixtures from the seeded proposals.
 *
 *  Snapshots are built from the same authored proposal content the builder screen edits, so a
 *  published version is what the proposal actually says rather than a second body of prose
 *  invented for the client-facing route. A publication of an earlier version carries that
 *  version's label; its content is the authored content, because this demo has no historical
 *  revisions to draw from and fabricating a diff would be a claim, not a fixture. */
export function buildProposalAccessSeed(proposals: readonly Proposal[]): ProposalAccessSeed {
  const byId = new Map(proposals.map((proposal) => [proposal.id, proposal]));

  const publications: ProposalPublication[] = [];
  for (const fixture of PUBLICATION_FIXTURES) {
    const proposal = byId.get(fixture.internalProposalId);
    if (!proposal) continue;
    const detail = buildProposalDetail(proposal);
    publications.push({
      id: fixture.id,
      workspaceId: DEMO_WORKSPACE_ID,
      internalProposalId: fixture.internalProposalId,
      versionNumber: fixture.versionNumber,
      versionLabel: fixture.versionLabel,
      title: detail.title,
      clientOrganisation: proposal.client,
      status: fixture.status,
      publishedAt: fixture.publishedAt,
      publishedByUserId: fixture.publishedByUserId,
      publishedByLabel: fixture.publishedByLabel,
      supersededByPublicationId: fixture.supersededByPublicationId,
      snapshot: buildClientSnapshot({
        detail: { ...detail, version: fixture.versionLabel },
        clientOrganisation: proposal.client,
      }),
    });
  }

  const publicationIds = new Set(publications.map((publication) => publication.id));

  const accessLinks: ProposalAccessLink[] = LINK_FIXTURES.filter((fixture) =>
    publicationIds.has(fixture.publicationId),
  ).map((fixture) => ({
    ...fixture,
    workspaceId: DEMO_WORKSPACE_ID,
    // Empty on purpose. A demo link has no secret behind it, so there is nothing to hash;
    // the readable token lives in `demoToken`. Live links are the reverse and always will be.
    tokenHash: "",
  }));

  const linkIndex = new Map(accessLinks.map((link) => [link.id, link]));

  const clientResponses: ProposalClientResponse[] = [];
  for (const fixture of RESPONSE_FIXTURES) {
    const link = linkIndex.get(fixture.accessLinkId);
    if (!link) continue;
    clientResponses.push({
      ...fixture,
      publicationId: link.publicationId,
      workspaceId: DEMO_WORKSPACE_ID,
    });
  }

  return { publications, accessLinks, clientResponses };
}
