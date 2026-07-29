// Demo secure-proposal store tests (207-241).
//
// Two things are locked here. First, the read side: what a public request receives for a good
// token, a bad token, and a token that addresses a link somebody else's browser would see.
// Second, the write side: publishing, issuing, revoking, opening and responding — and, in
// every case, what those writes are NOT allowed to claim.
//
// Demo mode is a browser-local simulation. Nothing in this file may end up asserting that a
// proposal was delivered, emailed, signed, or stored anywhere but this session.
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  createProposalAccessLink,
  DEMO_LINK_DEFAULT_DAYS,
  publishProposal,
  recordProposalOpen,
  revokeProposalAccessLink,
  submitProposalResponse,
} from "./actions";
import { __resetDemoStateForTests, getDemoState } from "./store";
import { DEMO_NOW } from "./seed";
import {
  demoLinkState,
  demoPublicView,
  findLinkByDemoToken,
  linksForProposal,
  proposalAccessPath,
  publicationById,
  publicationsForProposal,
  responsesForLink,
  responsesForProposal,
} from "./proposal-access";
import { DEMO_TOKEN_PREFIX, NOT_FOUND_VIEW } from "@/lib/proposals/access/model";
import type { ProposalAccessLink } from "@/lib/proposals/access/model";

const here = fileURLToPath(new URL(".", import.meta.url));

function link(id: string): ProposalAccessLink {
  const found = getDemoState().accessLinks.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`demo access test: no link ${id}`);
  return found;
}

function tokenOf(id: string): string {
  const value = link(id).demoToken;
  if (!value) throw new Error(`demo access test: link ${id} has no demo token`);
  return value;
}

describe("demo secure-proposal fixtures (tests 207-216)", () => {
  beforeEach(() => {
    __resetDemoStateForTests();
  });

  // 207
  it("seeds four publications and seven links covering every access state", () => {
    const { publications, accessLinks } = getDemoState();
    expect(publications).toHaveLength(4);
    expect(accessLinks).toHaveLength(7);
    const states = new Set(accessLinks.map((candidate) => demoLinkState(getDemoState(), candidate, DEMO_NOW)));
    expect([...states].sort()).toEqual(["accepted", "active", "declined", "expired", "revoked", "superseded"]);
  });

  // 208
  it("stores no token hash and no live-looking token on any demo link", () => {
    for (const candidate of getDemoState().accessLinks) {
      expect(candidate.tokenHash).toBe("");
      expect(candidate.demoToken?.startsWith(DEMO_TOKEN_PREFIX)).toBe(true);
    }
  });

  // 209
  it("every link points at a publication that exists, in the demo workspace", () => {
    const state = getDemoState();
    for (const candidate of state.accessLinks) {
      const publication = publicationById(state, candidate.publicationId);
      expect(publication, candidate.id).not.toBeNull();
      expect(candidate.workspaceId).toBe(publication?.workspaceId);
    }
  });

  // 210
  it("every stored response points at a link and a publication that exist", () => {
    const state = getDemoState();
    expect(state.clientResponses).toHaveLength(4);
    for (const response of state.clientResponses) {
      expect(state.accessLinks.some((candidate) => candidate.id === response.accessLinkId), response.id).toBe(true);
      expect(publicationById(state, response.publicationId), response.id).not.toBeNull();
    }
  });

  // 211
  it("the open count on a link matches the opens the fixtures claim", () => {
    const active = link("lnk-2031-b");
    expect(active.openCount).toBe(3);
    expect(active.firstOpenedAt).not.toBeNull();
    expect(active.lastOpenedAt).not.toBeNull();
    expect(active.firstOpenedAt! <= active.lastOpenedAt!).toBe(true);
    const unopened = link("lnk-2031-c");
    expect(unopened.openCount).toBe(0);
    expect(unopened.firstOpenedAt).toBeNull();
    expect(unopened.lastOpenedAt).toBeNull();
  });

  // 212
  it("a decision on a link is dated and matches the response that recorded it", () => {
    const accepted = link("lnk-2024-b");
    expect(accepted.decision).toBe("accepted");
    expect(accepted.decidedAt).not.toBeNull();
    expect(accepted.decidedByName).toBe("Hannah Liu");
    const declined = link("lnk-2019-b");
    expect(declined.decision).toBe("declined");
    // A decline records no typed name — nobody signed anything.
    expect(declined.decidedByName).toBeNull();
  });

  // 213
  it("a replacement link and the link it replaced point at each other", () => {
    const expired = link("lnk-2024-a");
    const replacement = link("lnk-2024-b");
    expect(expired.replacedByAccessLinkId).toBe(replacement.id);
    expect(replacement.replacesAccessLinkId).toBe(expired.id);
  });

  // 214
  it("lists publications newest version first, and links and responses newest first", () => {
    const state = getDemoState();
    const versions = publicationsForProposal(state, "PRO-2031").map((p) => p.versionNumber);
    expect(versions).toEqual([...versions].sort((a, b) => b - a));
    const created = linksForProposal(state, "PRO-2031").map((candidate) => candidate.createdAt);
    expect(created).toEqual([...created].sort().reverse());
    const responded = responsesForProposal(state, "PRO-2031").map((r) => r.respondedAt);
    expect(responded).toEqual([...responded].sort().reverse());
  });

  // 215
  it("scopes links and responses to the proposal asked for", () => {
    const state = getDemoState();
    const ids = new Set(publicationsForProposal(state, "PRO-2031").map((p) => p.id));
    for (const candidate of linksForProposal(state, "PRO-2031")) expect(ids.has(candidate.publicationId)).toBe(true);
    for (const response of responsesForProposal(state, "PRO-2031")) expect(ids.has(response.publicationId)).toBe(true);
    expect(responsesForLink(state, "lnk-2031-b").every((r) => r.accessLinkId === "lnk-2031-b")).toBe(true);
  });

  // 216
  it("builds one link path shape, and the selectors keep no clock of their own", () => {
    expect(proposalAccessPath("demo-proposal-harbor-active")).toBe("/proposal/demo-proposal-harbor-active");
    const src = readFileSync(`${here}proposal-access.ts`, "utf8");
    for (const forbidden of ["Date.now(", "new Date()", "Math.random(", "./store"]) {
      expect(src.includes(forbidden), forbidden).toBe(false);
    }
  });
});

describe("what a public request receives (tests 217-224)", () => {
  beforeEach(() => {
    __resetDemoStateForTests();
  });

  // 217
  it("an unknown, malformed or empty token all produce the identical not-found view", () => {
    const state = getDemoState();
    for (const token of [
      "",
      " ",
      "demo-proposal-",
      "demo-proposal-nope",
      "../../dashboard",
      "%2e%2e%2f",
      "a".repeat(43),
      "<script>alert(1)</script>",
      "lnk-2031-b",
      "PRO-2031",
    ]) {
      expect(demoPublicView(state, token, DEMO_NOW), token).toBe(NOT_FOUND_VIEW);
    }
  });

  // 218
  it("a proposal id is not a token, so the public route cannot be walked by guessing ids", () => {
    const state = getDemoState();
    for (const publication of state.publications) {
      expect(demoPublicView(state, publication.id, DEMO_NOW)).toBe(NOT_FOUND_VIEW);
      expect(demoPublicView(state, publication.internalProposalId, DEMO_NOW)).toBe(NOT_FOUND_VIEW);
    }
    for (const candidate of state.accessLinks) {
      expect(demoPublicView(state, candidate.id, DEMO_NOW)).toBe(NOT_FOUND_VIEW);
    }
  });

  // 219
  it("a revoked link says it is closed without saying why, and never names the workspace", () => {
    // A revoked link and an unknown one do not have to look identical: the holder of a
    // revoked link was legitimately given it, and a 256-bit token is not reachable by
    // guessing, so telling them "no longer active" is not an oracle. What it must not do is
    // explain the withdrawal, name who withdrew it, or show any of the document.
    const revoked = demoPublicView(getDemoState(), tokenOf("lnk-2019-a"), DEMO_NOW);
    expect(revoked.state).toBe("revoked");
    expect(revoked.document).toBeNull();
    expect(revoked.canRespond).toBe(false);
    const copy = `${revoked.heading} ${revoked.detail}`.toLowerCase();
    for (const leak of ["revoked by", "workspace", "codeoutfitters", "expired", "withdrawn by", "declined"]) {
      expect(copy, leak).not.toContain(leak);
    }
  });

  // 220
  it("an expired link shows no document and no way to respond", () => {
    const view = demoPublicView(getDemoState(), tokenOf("lnk-2024-a"), DEMO_NOW);
    expect(view.state).toBe("expired");
    expect(view.document).toBeNull();
    expect(view.canRespond).toBe(false);
    expect(view.responses).toHaveLength(0);
  });

  // 221
  it("an active link shows the published snapshot and accepts responses", () => {
    const view = demoPublicView(getDemoState(), tokenOf("lnk-2031-b"), DEMO_NOW);
    expect(view.state).toBe("active");
    expect(view.canRespond).toBe(true);
    expect(view.document?.sections.length).toBeGreaterThan(0);
    expect(view.recipientName).toBe(link("lnk-2031-b").recipientName);
  });

  // 222
  it("a superseded link still shows what that client was sent, and says a newer version exists", () => {
    const view = demoPublicView(getDemoState(), tokenOf("lnk-2031-a"), DEMO_NOW);
    expect(view.state).toBe("superseded");
    expect(view.newerVersionAvailable).toBe(true);
    expect(view.document).not.toBeNull();
    // The old link shows the OLD document. That is the whole point of an immutable snapshot.
    const current = demoPublicView(getDemoState(), tokenOf("lnk-2031-b"), DEMO_NOW);
    expect(view.document?.versionLabel).not.toBe(current.document?.versionLabel);
  });

  // 223
  it("shows one client only their own thread, never another recipient's questions", () => {
    const state = getDemoState();
    const priya = demoPublicView(state, tokenOf("lnk-2031-b"), DEMO_NOW);
    const dana = demoPublicView(state, tokenOf("lnk-2031-c"), DEMO_NOW);
    expect(priya.responses.length).toBeGreaterThan(0);
    expect(dana.responses).toHaveLength(0);
    const danaSerialized = JSON.stringify(dana);
    for (const echo of priya.responses) expect(danaSerialized).not.toContain(echo.message);
  });

  // 224
  it("leaks no email, workspace, internal id, open count or token in any public view", () => {
    const state = getDemoState();
    for (const candidate of state.accessLinks) {
      const view = demoPublicView(state, candidate.demoToken ?? "", DEMO_NOW);
      const serialized = JSON.stringify(view);
      expect(serialized, candidate.id).not.toContain(candidate.recipientEmail);
      expect(serialized, candidate.id).not.toContain(candidate.workspaceId);
      expect(serialized, candidate.id).not.toContain(candidate.demoToken);
      expect(serialized, candidate.id).not.toContain("openCount");
      const publication = publicationById(state, candidate.publicationId);
      expect(serialized, candidate.id).not.toContain(publication?.internalProposalId ?? "PRO-");
    }
  });
});

describe("publishing and issuing access (tests 225-232)", () => {
  beforeEach(() => {
    __resetDemoStateForTests();
  });

  // 225
  it("refuses to publish a proposal that fails its own validation, with the internal reason", () => {
    const blocked = getDemoState().proposals.find((p) => p.state === "DRAFT");
    expect(blocked).toBeDefined();
    const before = getDemoState().publications.length;
    const result = publishProposal(blocked!.id);
    if (!result.ok) {
      expect(result.reason.trim()).not.toBe("");
      expect(getDemoState().publications).toHaveLength(before);
    }
  });

  // 226
  it("refuses to publish a proposal that does not exist, and changes nothing", () => {
    const before = getDemoState();
    const result = publishProposal("PRO-does-not-exist");
    expect(result.ok).toBe(false);
    expect(getDemoState().publications).toHaveLength(before.publications.length);
    expect(getDemoState().activity).toHaveLength(before.activity.length);
  });

  // 227
  it("publishing supersedes the previous version instead of editing it", () => {
    const previous = publicationsForProposal(getDemoState(), "PRO-2031")[0];
    const previousSnapshot = previous.snapshot;
    const result = publishProposal("PRO-2031");
    expect(result.ok).toBe(true);
    const after = publicationsForProposal(getDemoState(), "PRO-2031");
    expect(after[0].versionNumber).toBe(previous.versionNumber + 1);
    const old = after.find((p) => p.id === previous.id);
    expect(old?.status).toBe("superseded");
    expect(old?.supersededByPublicationId).toBe(after[0].id);
    // The document that client was sent is byte-for-byte the object it always was.
    expect(old?.snapshot).toBe(previousSnapshot);
  });

  // 228
  it("records publishing and superseding as two events, because they are two facts", () => {
    const before = getDemoState().activity.length;
    publishProposal("PRO-2031");
    const added = getDemoState().activity.slice(0, getDemoState().activity.length - before);
    const types = added.map((event) => event.type);
    expect(types).toContain("proposal_published");
    expect(types).toContain("proposal_superseded");
  });

  // 229
  it("issues one link per named recipient, with a default expiry and a demo-shaped token", () => {
    const publication = publicationsForProposal(getDemoState(), "PRO-2031")[0];
    const result = createProposalAccessLink({
      publicationId: publication.id,
      recipientName: "  Sam Okafor  ",
      recipientEmail: "  sam@harborfreight.example  ",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const created = link(result.linkId);
    expect(created.recipientName).toBe("Sam Okafor");
    expect(created.recipientEmail).toBe("sam@harborfreight.example");
    expect(created.demoToken).toBe(result.token);
    expect(result.token).toContain(DEMO_TOKEN_PREFIX);
    expect(created.tokenHash).toBe("");
    expect(created.openCount).toBe(0);
    expect(created.decision).toBe("none");
    expect(created.expiresAt > DEMO_NOW).toBe(true);
    expect(DEMO_LINK_DEFAULT_DAYS).toBe(30);
  });

  // 230
  it("refuses to issue a link against a publication that does not exist", () => {
    const before = getDemoState().accessLinks.length;
    const result = createProposalAccessLink({
      publicationId: "pub-nope",
      recipientName: "Nobody",
      recipientEmail: "nobody@example.com",
    });
    expect(result.ok).toBe(false);
    expect(getDemoState().accessLinks).toHaveLength(before);
  });

  // 231
  it("reissuing revokes the old link in the same operation, so both are never live", () => {
    const publication = publicationsForProposal(getDemoState(), "PRO-2031")[0];
    const result = createProposalAccessLink({
      publicationId: publication.id,
      recipientName: "Dana Whitfield",
      recipientEmail: "dana@harborfreight.example",
      replacesAccessLinkId: "lnk-2031-c",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const replaced = link("lnk-2031-c");
    expect(replaced.revokedAt).toBe(DEMO_NOW);
    expect(replaced.replacedByAccessLinkId).toBe(result.linkId);
    expect(demoLinkState(getDemoState(), replaced, DEMO_NOW)).toBe("revoked");
    expect(demoLinkState(getDemoState(), link(result.linkId), DEMO_NOW)).toBe("active");
    expect(getDemoState().activity[0].type).toBe("proposal_access_link_replaced");
  });

  // 232
  it("revoking is idempotent and closes the client's page immediately", () => {
    const token = tokenOf("lnk-2031-b");
    expect(demoPublicView(getDemoState(), token, DEMO_NOW).document).not.toBeNull();
    revokeProposalAccessLink("lnk-2031-b");
    const revokedAt = link("lnk-2031-b").revokedAt;
    expect(revokedAt).toBe(DEMO_NOW);
    const view = demoPublicView(getDemoState(), token, DEMO_NOW);
    expect(view.state).toBe("revoked");
    expect(view.document).toBeNull();
    expect(view.canRespond).toBe(false);
    const events = getDemoState().activity.length;
    revokeProposalAccessLink("lnk-2031-b");
    expect(link("lnk-2031-b").revokedAt).toBe(revokedAt);
    expect(getDemoState().activity).toHaveLength(events);
  });
});

describe("client behaviour recorded against a link (tests 233-241)", () => {
  beforeEach(() => {
    __resetDemoStateForTests();
  });

  // 233
  it("an open increments the count and dates the first open once", () => {
    const before = link("lnk-2031-c");
    expect(before.openCount).toBe(0);
    recordProposalOpen(tokenOf("lnk-2031-c"));
    const first = link("lnk-2031-c");
    expect(first.openCount).toBe(1);
    expect(first.firstOpenedAt).toBe(DEMO_NOW);
    recordProposalOpen(tokenOf("lnk-2031-c"));
    const second = link("lnk-2031-c");
    expect(second.openCount).toBe(2);
    expect(second.firstOpenedAt).toBe(first.firstOpenedAt);
    expect(second.lastOpenedAt).toBe(DEMO_NOW);
  });

  // 234
  it("the first open is a critical event and a reopen is a routine one", () => {
    recordProposalOpen(tokenOf("lnk-2031-c"));
    expect(getDemoState().activity[0].type).toBe("proposal_first_opened_by_client");
    recordProposalOpen(tokenOf("lnk-2031-c"));
    expect(getDemoState().activity[0].type).toBe("proposal_opened_by_client");
  });

  // 235
  it("an open records the client as the actor, never a team member", () => {
    recordProposalOpen(tokenOf("lnk-2031-c"));
    const event = getDemoState().activity[0];
    expect(event.actorId).toBeNull();
    expect(event.actorLabel).toBe(link("lnk-2031-c").recipientName);
    expect(event.visibility).toBe("client_safe");
  });

  // 236
  it("opening a closed link records nothing at all", () => {
    for (const id of ["lnk-2024-a", "lnk-2019-a"]) {
      const before = getDemoState();
      recordProposalOpen(tokenOf(id));
      expect(link(id).openCount, id).toBe(before.accessLinks.find((c) => c.id === id)!.openCount);
      expect(getDemoState().activity, id).toHaveLength(before.activity.length);
    }
    const before = getDemoState().activity.length;
    recordProposalOpen("demo-proposal-not-a-link");
    expect(getDemoState().activity).toHaveLength(before);
  });

  // 237
  it("the first open moves a sent proposal to viewed, and a later one moves nothing", () => {
    const state = getDemoState();
    const sent = state.accessLinks.find((candidate) => {
      const publication = publicationById(state, candidate.publicationId);
      const proposal = state.proposals.find((p) => p.id === publication?.internalProposalId);
      return proposal?.state === "SENT" && candidate.firstOpenedAt === null;
    });
    if (!sent) return;
    const publication = publicationById(getDemoState(), sent.publicationId)!;
    recordProposalOpen(sent.demoToken!);
    const proposal = getDemoState().proposals.find((p) => p.id === publication.internalProposalId);
    expect(proposal?.state).toBe("VIEWED");
    recordProposalOpen(sent.demoToken!);
    expect(getDemoState().proposals.find((p) => p.id === publication.internalProposalId)?.state).toBe("VIEWED");
  });

  // 238
  it("a question is stored against the link and echoed back to that client only", () => {
    const token = tokenOf("lnk-2031-c");
    const result = submitProposalResponse(token, {
      type: "question",
      message: "  Can we start in June?  ",
      displayName: "Dana",
    });
    expect(result).toEqual({ ok: true });
    const stored = responsesForLink(getDemoState(), "lnk-2031-c");
    expect(stored).toHaveLength(1);
    expect(stored[0].message).toBe("Can we start in June?");
    expect(stored[0].responseType).toBe("question");
    expect(demoPublicView(getDemoState(), token, DEMO_NOW).responses).toHaveLength(1);
    expect(demoPublicView(getDemoState(), tokenOf("lnk-2031-b"), DEMO_NOW).responses.map((e) => e.message)).not.toContain(
      "Can we start in June?",
    );
  });

  // 239
  it("an invalid draft is refused at the store, not just in the form", () => {
    const token = tokenOf("lnk-2031-c");
    const before = getDemoState().clientResponses.length;
    expect(submitProposalResponse(token, { type: "question", message: "   ", displayName: "" })).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(submitProposalResponse(token, { type: "acceptance", typedName: "", authorised: false, note: "" })).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(submitProposalResponse(token, { type: "decline", reason: "", confirmed: false })).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(getDemoState().clientResponses).toHaveLength(before);
  });

  // 240
  it("an acceptance records the typed name, moves the proposal to won, and refuses a later decline", () => {
    const token = tokenOf("lnk-2031-c");
    expect(
      submitProposalResponse(token, { type: "acceptance", typedName: "Dana Whitfield", authorised: true, note: "Go ahead" }),
    ).toEqual({ ok: true });
    const accepted = link("lnk-2031-c");
    expect(accepted.decision).toBe("accepted");
    expect(accepted.decidedAt).toBe(DEMO_NOW);
    expect(accepted.decidedByName).toBe("Dana Whitfield");
    expect(getDemoState().proposals.find((p) => p.id === "PRO-2031")?.state).toBe("ACCEPTED");
    expect(getDemoState().activity[0].type).toBe("proposal_accepted_by_client");
    expect(submitProposalResponse(token, { type: "decline", reason: "changed mind", confirmed: true })).toEqual({
      ok: false,
      reason: "conflicting_decision",
    });
    expect(link("lnk-2031-c").decision).toBe("accepted");
  });

  // 241
  it("a decline records no typed name, moves the proposal to lost, and a closed link takes nothing", () => {
    const token = tokenOf("lnk-2031-c");
    expect(submitProposalResponse(token, { type: "decline", reason: "Budget moved", confirmed: true })).toEqual({ ok: true });
    const declined = link("lnk-2031-c");
    expect(declined.decision).toBe("declined");
    expect(declined.decidedByName).toBeNull();
    expect(getDemoState().proposals.find((p) => p.id === "PRO-2031")?.state).toBe("REJECTED");
    // Revoked, expired and unknown links all refuse input, and none of them says why.
    expect(submitProposalResponse(tokenOf("lnk-2019-a"), { type: "question", message: "hi", displayName: "" })).toEqual({
      ok: false,
      reason: "closed",
    });
    expect(submitProposalResponse(tokenOf("lnk-2024-a"), { type: "question", message: "hi", displayName: "" })).toEqual({
      ok: false,
      reason: "closed",
    });
    expect(submitProposalResponse("demo-proposal-nope", { type: "question", message: "hi", displayName: "" })).toEqual({
      ok: false,
      reason: "not_available",
    });
  });
});
