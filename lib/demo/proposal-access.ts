// Reading the secure-proposal fixtures out of the demo state.
//
// Pure selectors: no React, no store import, no clock. The public route renders on the server
// from the pristine seed and then hydrates against the session store, and both paths call the
// same functions here — so what a server render puts in the HTML and what the browser shows a
// moment later cannot be two different opinions about the same link.
//
// The public entry point is `demoPublicView`, and it is the ONLY function a public surface
// calls. It returns the sanitized view model and nothing else: no stored link row, no
// recipient email, no internal proposal id, no open counts. A public caller cannot reach the
// internal record even by accident, because it never receives one.
import {
  buildPublicViewModel,
  isDemoAccessToken,
  NOT_FOUND_VIEW,
  type ProposalAccessLink,
  type ProposalAccessState,
  type ProposalClientResponse,
  type ProposalPublication,
  type ProposalPublicViewModel,
  resolveAccessState,
} from "@/lib/proposals/access/model";
import type { DemoState } from "./types";

/** Where a secure link points. One place, so a link built for an email, a copy button and a
 *  test cannot drift into three different shapes. */
export function proposalAccessPath(token: string): string {
  return `/proposal/${token}`;
}

/** The link a demo token addresses, or null.
 *
 *  Malformed tokens are rejected on shape before any lookup, and a token that matches no
 *  fixture returns exactly the same null — the caller has no way to tell "badly formed" from
 *  "no such link" from "revoked link", which is the point. A public response that varied by
 *  reason would be a probing oracle. */
export function findLinkByDemoToken(
  state: Pick<DemoState, "accessLinks">,
  token: string,
): ProposalAccessLink | null {
  if (!isDemoAccessToken(token)) return null;
  return state.accessLinks.find((link) => link.demoToken === token) ?? null;
}

export function publicationById(
  state: Pick<DemoState, "publications">,
  publicationId: string,
): ProposalPublication | null {
  return state.publications.find((publication) => publication.id === publicationId) ?? null;
}

/** Publications of one internal proposal, newest version first. */
export function publicationsForProposal(
  state: Pick<DemoState, "publications">,
  internalProposalId: string,
): ProposalPublication[] {
  return state.publications
    .filter((publication) => publication.internalProposalId === internalProposalId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
}

/** Access links issued against one internal proposal, newest first. */
export function linksForProposal(
  state: Pick<DemoState, "publications" | "accessLinks">,
  internalProposalId: string,
): ProposalAccessLink[] {
  const ids = new Set(
    publicationsForProposal(state, internalProposalId).map((publication) => publication.id),
  );
  return state.accessLinks
    .filter((link) => ids.has(link.publicationId))
    .sort((a, b) => (a.createdAt === b.createdAt ? (a.id < b.id ? 1 : -1) : a.createdAt < b.createdAt ? 1 : -1));
}

export function responsesForProposal(
  state: Pick<DemoState, "publications" | "clientResponses">,
  internalProposalId: string,
): ProposalClientResponse[] {
  const ids = new Set(
    publicationsForProposal(state, internalProposalId).map((publication) => publication.id),
  );
  return state.clientResponses
    .filter((response) => ids.has(response.publicationId))
    .sort((a, b) => (a.respondedAt === b.respondedAt ? (a.id < b.id ? 1 : -1) : a.respondedAt < b.respondedAt ? 1 : -1));
}

export function responsesForLink(
  state: Pick<DemoState, "clientResponses">,
  accessLinkId: string,
): ProposalClientResponse[] {
  return state.clientResponses.filter((response) => response.accessLinkId === accessLinkId);
}

/** The state one link is in, for the internal Client Access panel. */
export function demoLinkState(
  state: Pick<DemoState, "publications">,
  link: ProposalAccessLink,
  now: string,
): ProposalAccessState {
  return resolveAccessState({
    link,
    publication: publicationById(state, link.publicationId),
    now,
  });
}

/** What a public request receives. The only function a public surface may call.
 *
 *  An unknown, malformed, or nonexistent token produces NOT_FOUND_VIEW — the same object, the
 *  same wording, the same absence of detail. Nothing in the result distinguishes a token that
 *  was never valid from one that addresses a real proposal in another workspace. */
export function demoPublicView(
  state: Pick<DemoState, "accessLinks" | "publications" | "clientResponses">,
  token: string,
  now: string,
): ProposalPublicViewModel {
  const link = findLinkByDemoToken(state, token);
  if (!link) return NOT_FOUND_VIEW;
  return buildPublicViewModel({
    link,
    publication: publicationById(state, link.publicationId),
    responses: responsesForLink(state, link.id),
    now,
  });
}
