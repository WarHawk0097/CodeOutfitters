// Secure client proposal access — domain tests (tests 160-199).
//
// This file guards the boundary between a workspace and a person outside it. The properties
// asserted here are the ones that, if they broke, would leak commercial terms, an internal
// note, a recipient's email address, or the existence of a proposal to somebody guessing
// tokens. They are asserted as properties of the module, not as spot checks of one fixture.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  ACCEPTANCE_AUTHORISATION_LABEL,
  ACCEPTANCE_RECORD_NOTICE,
  ACCESS_STATES,
  ACCESS_STATE_DETAIL,
  ACCESS_STATE_HEADING,
  ACCESS_STATE_LABELS,
  ACCESS_TOKEN_BYTES,
  ACCESS_TOKEN_LENGTH,
  CLIENT_RESPONSE_LABELS,
  CLIENT_RESPONSE_TYPES,
  DECLINE_CONFIRMATION_LABEL,
  DEMO_TOKEN_PREFIX,
  INTERNAL_PUBLICATION_FIELDS,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_NOTE_LENGTH,
  MIN_TYPED_NAME_LENGTH,
  NOT_FOUND_VIEW,
  NO_PUBLICATION_NOTICE,
  PUBLICATION_STATUSES,
  PUBLICATION_STATUS_LABELS,
  acceptsResponses,
  buildClientSnapshot,
  buildPublicViewModel,
  decisionConflict,
  freezeSnapshot,
  grantsContentAccess,
  isDemoAccessToken,
  isWellFormedAccessToken,
  resolveAccessState,
  responseMessageOf,
  responseTypeOf,
  responseTypedNameOf,
  sectionAnchors,
  validateResponseDraft,
  type ProposalAccessLink,
  type ProposalClientResponse,
  type ProposalPublication,
  type ProposalPublicSnapshot,
  type ResponseDraft,
} from "./model";
import type { ProposalBuilderDetail } from "@/lib/command-center/proposals/model";

const NOW = "2026-04-22T17:00:00.000Z";

const detail: ProposalBuilderDetail = {
  id: "PRO-2031",
  title: "Harbor Freight — Platform Rebuild",
  version: "v2",
  netTerms: "Net 30",
  sections: [
    { id: "overview", name: "Overview", kind: "content", body: "Why this work.", complete: true },
    { id: "pricing", name: "Investment", kind: "pricing", body: "  ", complete: true },
    { id: "timeline", name: "Milestones", kind: "milestones", body: "Phases.", complete: true },
  ],
  pricing: [
    { id: "l1", name: "Discovery", detail: "Two weeks", cents: 1_200_000 },
    { id: "l2", name: "Build", detail: "Six weeks", cents: 4_800_000 },
  ],
  milestones: [{ id: "m1", name: "Kickoff", timing: "Week 1", paymentPct: 30 }],
  validation: [],
  blockedReason: null,
} as unknown as ProposalBuilderDetail;

const snapshot = buildClientSnapshot({ detail, clientOrganisation: "Harbor Freight Co." });

function publication(overrides: Partial<ProposalPublication> = {}): ProposalPublication {
  return {
    id: "pub-2031-v2",
    workspaceId: "demo-workspace",
    internalProposalId: "PRO-2031",
    versionNumber: 2,
    versionLabel: "v2",
    title: detail.title,
    clientOrganisation: "Harbor Freight Co.",
    status: "published",
    publishedAt: "2026-04-18T15:05:00.000Z",
    publishedByUserId: "user-002",
    publishedByLabel: "Marc Devon",
    supersededByPublicationId: null,
    snapshot,
    ...overrides,
  };
}

function link(overrides: Partial<ProposalAccessLink> = {}): ProposalAccessLink {
  return {
    id: "lnk-2031-b",
    publicationId: "pub-2031-v2",
    workspaceId: "demo-workspace",
    recipientName: "Priya Raman",
    recipientEmail: "priya@harborfreight.example",
    tokenHash: "",
    demoToken: "demo-proposal-harbor-active",
    expiresAt: "2026-05-18T15:05:00.000Z",
    createdAt: "2026-04-18T15:06:00.000Z",
    createdByUserId: "user-002",
    revokedAt: null,
    revokedByUserId: null,
    firstOpenedAt: "2026-04-18T18:40:00.000Z",
    lastOpenedAt: "2026-04-21T09:12:00.000Z",
    openCount: 3,
    decision: "none",
    decidedAt: null,
    decidedByName: null,
    replacesAccessLinkId: null,
    replacedByAccessLinkId: null,
    ...overrides,
  };
}

function response(overrides: Partial<ProposalClientResponse> = {}): ProposalClientResponse {
  return {
    id: "res-1",
    accessLinkId: "lnk-2031-b",
    publicationId: "pub-2031-v2",
    workspaceId: "demo-workspace",
    responseType: "question",
    message: "Can phase two start earlier?",
    typedName: "Priya Raman",
    authorizationConfirmed: false,
    idempotencyKey: "key-1",
    respondedAt: "2026-04-19T10:00:00.000Z",
    createdAt: "2026-04-19T10:00:00.000Z",
    ...overrides,
  };
}

describe("publication snapshots (tests 160-169)", () => {
  // 160
  it("builds the client snapshot from authored sections, not from a rendered preview", () => {
    expect(snapshot.title).toBe("Harbor Freight — Platform Rebuild");
    expect(snapshot.versionLabel).toBe("v2");
    expect(snapshot.clientOrganisation).toBe("Harbor Freight Co.");
    expect(snapshot.sections).toHaveLength(3);
  });

  // 161
  it("numbers sections and points every navigation entry at an anchor that exists", () => {
    expect(snapshot.sections.map((section) => section.navLabel)).toEqual([
      "01 · Overview",
      "02 · Investment",
      "03 · Milestones",
    ]);
    const anchors = sectionAnchors(snapshot);
    expect(anchors).toEqual(["overview", "pricing", "timeline"]);
    for (const anchor of anchors) {
      expect(snapshot.sections.some((section) => section.id === anchor)).toBe(true);
    }
  });

  // 162
  it("omits an empty body instead of emitting a blank paragraph", () => {
    const investment = snapshot.sections[1];
    expect(investment.blocks.some((block) => block.kind === "paragraph")).toBe(false);
    expect(snapshot.sections[0].blocks.some((block) => block.kind === "paragraph")).toBe(true);
  });

  // 163
  it("totals the priced lines once and labels the total with the currency and terms", () => {
    const table = snapshot.sections[1].blocks.find((block) => block.kind === "pricingTable");
    expect(table).toBeDefined();
    expect(snapshot.totalCents).toBe(6_000_000);
    expect(table).toMatchObject({ totalCents: 6_000_000, totalLabel: "Total · USD · Net 30" });
  });

  // 164
  it("carries a null total, and no pricing table, when nothing is priced", () => {
    const free = buildClientSnapshot({
      detail: { ...detail, pricing: [] } as ProposalBuilderDetail,
      clientOrganisation: "Harbor Freight Co.",
    });
    expect(free.totalCents).toBeNull();
    const blocks = free.sections.flatMap((section) => section.blocks);
    expect(blocks.some((block) => block.kind === "pricingTable")).toBe(false);
  });

  // 165
  it("renders milestones only where milestones were authored", () => {
    const blocks = snapshot.sections.flatMap((section) => section.blocks);
    expect(blocks.filter((block) => block.kind === "milestoneTable")).toHaveLength(1);
    const none = buildClientSnapshot({
      detail: { ...detail, milestones: [] } as ProposalBuilderDetail,
      clientOrganisation: "Harbor Freight Co.",
    });
    expect(none.sections.flatMap((s) => s.blocks).some((b) => b.kind === "milestoneTable")).toBe(false);
  });

  // 166
  it("freezes the snapshot, so publishing a later version cannot rewrite what an earlier one said", () => {
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.sections)).toBe(true);
    for (const section of snapshot.sections) {
      expect(Object.isFrozen(section)).toBe(true);
      expect(Object.isFrozen(section.blocks)).toBe(true);
      for (const block of section.blocks) expect(Object.isFrozen(block)).toBe(true);
    }
  });

  // 167
  it("a frozen snapshot rejects mutation rather than accepting it silently", () => {
    expect(() => {
      "use strict";
      (snapshot as { title: string }).title = "Rewritten";
    }).toThrow();
    expect(snapshot.title).toBe("Harbor Freight — Platform Rebuild");
  });

  // 168
  it("freezeSnapshot is idempotent and returns the same object", () => {
    const once = freezeSnapshot(snapshot);
    expect(once).toBe(snapshot);
  });

  // 169
  it("carries none of the internal fields into the client snapshot", () => {
    const keys = new Set(Object.keys(snapshot));
    for (const field of INTERNAL_PUBLICATION_FIELDS) expect(keys.has(field)).toBe(false);
    const serialized = JSON.stringify(snapshot);
    expect(serialized).not.toContain("priya@harborfreight.example");
    expect(serialized).not.toContain("user-002");
    expect(serialized).not.toContain("demo-workspace");
  });
});

describe("access state (tests 170-179)", () => {
  // 170
  it("an unknown link and an unknown publication both resolve to not_found", () => {
    expect(resolveAccessState({ link: null, publication: publication(), now: NOW })).toBe("not_found");
    expect(resolveAccessState({ link: link(), publication: null, now: NOW })).toBe("not_found");
    expect(resolveAccessState({ link: null, publication: null, now: NOW })).toBe("not_found");
  });

  // 171
  it("a revoked link is closed even when a decision was already recorded", () => {
    const state = resolveAccessState({
      link: link({ revokedAt: "2026-04-20T10:00:00.000Z", decision: "accepted" }),
      publication: publication(),
      now: NOW,
    });
    expect(state).toBe("revoked");
  });

  // 172
  it("a withdrawn publication closes every link into it", () => {
    expect(
      resolveAccessState({ link: link(), publication: publication({ status: "withdrawn" }), now: NOW }),
    ).toBe("revoked");
  });

  // 173
  it("a decided proposal stays readable — a decision is not an error state", () => {
    expect(resolveAccessState({ link: link({ decision: "accepted" }), publication: publication(), now: NOW })).toBe("accepted");
    expect(resolveAccessState({ link: link({ decision: "declined" }), publication: publication(), now: NOW })).toBe("declined");
    expect(grantsContentAccess("accepted")).toBe(true);
    expect(grantsContentAccess("declined")).toBe(true);
  });

  // 174
  it("a superseded version stays readable, with the newer one announced", () => {
    const state = resolveAccessState({
      link: link(),
      publication: publication({ status: "superseded", supersededByPublicationId: "pub-2031-v3" }),
      now: NOW,
    });
    expect(state).toBe("superseded");
    expect(grantsContentAccess("superseded")).toBe(true);
  });

  // 175
  it("expiry is inclusive of the expiry instant and shows no document", () => {
    const expiring = link({ expiresAt: NOW });
    expect(resolveAccessState({ link: expiring, publication: publication(), now: NOW })).toBe("expired");
    expect(
      resolveAccessState({ link: link({ expiresAt: "2026-04-22T17:00:00.001Z" }), publication: publication(), now: NOW }),
    ).toBe("active");
    expect(grantsContentAccess("expired")).toBe(false);
  });

  // 176
  it("expired, revoked and not_found show a status page and no proposal content", () => {
    for (const state of ["expired", "revoked", "not_found"] as const) {
      expect(grantsContentAccess(state)).toBe(false);
    }
  });

  // 177
  it("only an active link accepts new client input", () => {
    for (const state of ACCESS_STATES) {
      expect(acceptsResponses(state)).toBe(state === "active");
    }
  });

  // 178
  it("every state has an internal label, a public heading and a public detail", () => {
    for (const state of ACCESS_STATES) {
      expect(ACCESS_STATE_LABELS[state].trim()).not.toBe("");
      expect(ACCESS_STATE_HEADING[state].trim()).not.toBe("");
      expect(ACCESS_STATE_DETAIL[state].trim()).not.toBe("");
    }
    for (const status of PUBLICATION_STATUSES) {
      expect(PUBLICATION_STATUS_LABELS[status].trim()).not.toBe("");
    }
  });

  // 179
  it("no public wording discloses why a link was closed or whether a proposal exists", () => {
    const publicCopy = [
      ...Object.values(ACCESS_STATE_HEADING),
      ...Object.values(ACCESS_STATE_DETAIL),
    ]
      .join(" ")
      .toLowerCase();
    for (const leak of ["workspace", "database", "invalid token", "does not exist", "unauthorized", "internal"]) {
      expect(publicCopy).not.toContain(leak);
    }
  });
});

describe("the public view model (tests 180-189)", () => {
  // 180
  it("every failure produces the one identical not_found shape", () => {
    const unknownLink = buildPublicViewModel({ link: null, publication: publication(), responses: [], now: NOW });
    const unknownPublication = buildPublicViewModel({ link: link(), publication: null, responses: [], now: NOW });
    expect(unknownLink).toBe(NOT_FOUND_VIEW);
    expect(unknownPublication).toBe(NOT_FOUND_VIEW);
    expect(Object.isFrozen(NOT_FOUND_VIEW)).toBe(true);
  });

  // 181
  it("the not_found shape carries no document, no recipient and no ability to respond", () => {
    expect(NOT_FOUND_VIEW.document).toBeNull();
    expect(NOT_FOUND_VIEW.recipientName).toBeNull();
    expect(NOT_FOUND_VIEW.expiresAt).toBeNull();
    expect(NOT_FOUND_VIEW.decision).toBeNull();
    expect(NOT_FOUND_VIEW.responses).toHaveLength(0);
    expect(NOT_FOUND_VIEW.canRespond).toBe(false);
  });

  // 182
  it("is assembled by naming fields, so no internal column can ride along", () => {
    const view = buildPublicViewModel({ link: link(), publication: publication(), responses: [], now: NOW });
    expect(Object.keys(view).sort()).toEqual(
      [
        "canRespond",
        "decision",
        "detail",
        "document",
        "expiresAt",
        "heading",
        "newerVersionAvailable",
        "recipientName",
        "responses",
        "state",
      ].sort(),
    );
  });

  // 183
  it("never carries the recipient email, the workspace, the internal proposal id or a token hash", () => {
    const view = buildPublicViewModel({
      link: link({ tokenHash: "a-hash-that-must-not-travel" }),
      publication: publication(),
      responses: [response()],
      now: NOW,
    });
    const serialized = JSON.stringify(view);
    expect(serialized).not.toContain("priya@harborfreight.example");
    expect(serialized).not.toContain("demo-workspace");
    expect(serialized).not.toContain("PRO-2031");
    expect(serialized).not.toContain("a-hash-that-must-not-travel");
    expect(serialized).not.toContain("user-002");
  });

  // 184
  it("never carries the raw token, in any state", () => {
    for (const state of [link(), link({ revokedAt: NOW }), link({ decision: "accepted", decidedAt: NOW })]) {
      const view = buildPublicViewModel({ link: state, publication: publication(), responses: [], now: NOW });
      expect(JSON.stringify(view)).not.toContain("demo-proposal-harbor-active");
    }
  });

  // 185
  it("withholds the document in a state that does not grant content access", () => {
    const expired = buildPublicViewModel({
      link: link({ expiresAt: "2026-04-01T00:00:00.000Z" }),
      publication: publication(),
      responses: [response()],
      now: NOW,
    });
    expect(expired.state).toBe("expired");
    expect(expired.document).toBeNull();
    const active = buildPublicViewModel({ link: link(), publication: publication(), responses: [], now: NOW });
    expect(active.document).toBe(publication().snapshot);
  });

  // 186
  it("echoes only this link's questions and comments, oldest first", () => {
    const view = buildPublicViewModel({
      link: link(),
      publication: publication(),
      responses: [
        response({ id: "res-3", responseType: "comment", respondedAt: "2026-04-20T08:00:00.000Z" }),
        response({ id: "res-2", respondedAt: "2026-04-19T09:00:00.000Z" }),
        response({ id: "res-x", accessLinkId: "lnk-someone-else", respondedAt: "2026-04-19T09:30:00.000Z" }),
      ],
      now: NOW,
    });
    expect(view.responses.map((echo) => echo.id)).toEqual(["res-2", "res-3"]);
  });

  // 187
  it("does not echo a decision back as a message", () => {
    const view = buildPublicViewModel({
      link: link(),
      publication: publication(),
      responses: [
        response({ id: "res-a", responseType: "acceptance", message: "Looks good" }),
        response({ id: "res-d", responseType: "decline", message: "Budget moved" }),
      ],
      now: NOW,
    });
    expect(view.responses).toHaveLength(0);
  });

  // 188
  it("falls back to the link's recipient name when the client typed none", () => {
    const view = buildPublicViewModel({
      link: link(),
      publication: publication(),
      responses: [response({ typedName: "" })],
      now: NOW,
    });
    expect(view.responses[0].displayName).toBe("Priya Raman");
  });

  // 189
  it("reports a decision with the typed name, and announces a newer version only when one exists", () => {
    const decided = buildPublicViewModel({
      link: link({ decision: "accepted", decidedAt: "2026-04-20T14:58:00.000Z", decidedByName: "Priya Raman" }),
      publication: publication(),
      responses: [],
      now: NOW,
    });
    expect(decided.decision).toEqual({ kind: "accepted", at: "2026-04-20T14:58:00.000Z", typedName: "Priya Raman" });
    expect(decided.newerVersionAvailable).toBe(false);
    const superseded = buildPublicViewModel({
      link: link(),
      publication: publication({ status: "superseded" }),
      responses: [],
      now: NOW,
    });
    expect(superseded.newerVersionAvailable).toBe(true);
  });
});

describe("client response validation (tests 190-195)", () => {
  // 190
  it("requires a question or comment to say something", () => {
    expect(validateResponseDraft({ type: "question", message: "   ", displayName: "" })).toEqual({
      message: "Enter your question.",
    });
    expect(validateResponseDraft({ type: "comment", message: "", displayName: "" })).toEqual({
      message: "Enter your comment.",
    });
    expect(validateResponseDraft({ type: "question", message: "Why?", displayName: "" })).toEqual({});
  });

  // 191
  it("bounds every free-text field, keyed by the field that is wrong", () => {
    const long = (n: number) => "x".repeat(n);
    expect(validateResponseDraft({ type: "question", message: long(MAX_MESSAGE_LENGTH + 1), displayName: "" })).toHaveProperty("message");
    expect(
      validateResponseDraft({ type: "comment", message: "ok", displayName: long(MAX_DISPLAY_NAME_LENGTH + 1) }),
    ).toHaveProperty("displayName");
    expect(
      validateResponseDraft({ type: "acceptance", typedName: "Priya Raman", authorised: true, note: long(MAX_NOTE_LENGTH + 1) }),
    ).toHaveProperty("note");
    expect(validateResponseDraft({ type: "decline", reason: long(MAX_NOTE_LENGTH + 1), confirmed: true })).toHaveProperty("reason");
  });

  // 192
  it("an acceptance needs a typed name and an explicit authorisation confirmation", () => {
    const errors = validateResponseDraft({ type: "acceptance", typedName: " ", authorised: false, note: "" });
    expect(Object.keys(errors).sort()).toEqual(["authorised", "typedName"]);
    expect(
      validateResponseDraft({ type: "acceptance", typedName: "x".repeat(MIN_TYPED_NAME_LENGTH), authorised: true, note: "" }),
    ).toEqual({});
  });

  // 193
  it("a decline needs an explicit confirmation and no typed name", () => {
    expect(validateResponseDraft({ type: "decline", reason: "", confirmed: false })).toEqual({
      confirmed: "Confirm that you want to decline this proposal.",
    });
    expect(validateResponseDraft({ type: "decline", reason: "", confirmed: true })).toEqual({});
    expect(responseTypedNameOf({ type: "decline", reason: "", confirmed: true })).toBe("");
  });

  // 194
  it("maps each draft to its stored type, message and typed name, trimmed", () => {
    const drafts: ResponseDraft[] = [
      { type: "question", message: "  Why?  ", displayName: "  Priya  " },
      { type: "comment", message: "  Nice  ", displayName: "" },
      { type: "acceptance", typedName: "  Priya Raman  ", authorised: true, note: "  Go  " },
      { type: "decline", reason: "  Budget  ", confirmed: true },
    ];
    expect(drafts.map(responseTypeOf)).toEqual([...CLIENT_RESPONSE_TYPES]);
    expect(drafts.map(responseMessageOf)).toEqual(["Why?", "Nice", "Go", "Budget"]);
    expect(drafts.map(responseTypedNameOf)).toEqual(["Priya", "", "Priya Raman", ""]);
    for (const type of CLIENT_RESPONSE_TYPES) expect(CLIENT_RESPONSE_LABELS[type].trim()).not.toBe("");
  });

  // 195
  it("rejects a decision that conflicts with one already recorded, and allows a repeat of the same one", () => {
    expect(decisionConflict(link(), "acceptance")).toBeNull();
    expect(decisionConflict(link(), "question")).toBeNull();
    expect(decisionConflict(link({ decision: "accepted" }), "acceptance")).toBeNull();
    expect(decisionConflict(link({ decision: "accepted" }), "decline")).toBe("accepted");
    expect(decisionConflict(link({ decision: "declined" }), "acceptance")).toBe("declined");
    // A question against a decided link is not a decision conflict — the gate for that is the
    // access state, not this function.
    expect(decisionConflict(link({ decision: "declined" }), "comment")).toBeNull();
  });
});

describe("token shape and product copy (tests 196-199)", () => {
  // 196
  it("a live token is 256 bits of base64url and nothing else passes", () => {
    expect(ACCESS_TOKEN_BYTES).toBe(32);
    expect(ACCESS_TOKEN_LENGTH).toBe(43);
    expect(isWellFormedAccessToken("a".repeat(43))).toBe(true);
    expect(isWellFormedAccessToken("A-b_9".padEnd(43, "z"))).toBe(true);
    for (const bad of [
      "",
      "a".repeat(42),
      "a".repeat(44),
      `${"a".repeat(42)}+`,
      `${"a".repeat(42)}=`,
      `${"a".repeat(42)}/`,
      "../../etc/passwd",
      "0000-0000-0000-0000-0000-0000-000000000000",
    ]) {
      expect(isWellFormedAccessToken(bad)).toBe(false);
    }
  });

  // 197
  it("a demo token is visibly not a secret, and is never mistaken for a live one", () => {
    expect(DEMO_TOKEN_PREFIX).toBe("demo-proposal-");
    expect(isDemoAccessToken("demo-proposal-harbor-active")).toBe(true);
    expect(isWellFormedAccessToken("demo-proposal-harbor-active")).toBe(false);
    for (const bad of ["demo-proposal-", "demo-proposal-a", "demo-proposal-UPPER", "proposal-harbor", `demo-proposal-${"a".repeat(80)}`]) {
      expect(isDemoAccessToken(bad)).toBe(false);
    }
  });

  // 198
  it("acceptance is described as a recorded decision, never as a certified electronic signature", () => {
    expect(ACCEPTANCE_RECORD_NOTICE).toContain("not a certified electronic signature");
    const copy = [ACCEPTANCE_RECORD_NOTICE, ACCEPTANCE_AUTHORISATION_LABEL, DECLINE_CONFIRMATION_LABEL, NO_PUBLICATION_NOTICE]
      .join(" ")
      .toLowerCase();
    for (const claim of ["legally binding", "legally enforceable", "e-signed", "docusign", "certified signature"]) {
      expect(copy).not.toContain(claim);
    }
    expect(ACCEPTANCE_AUTHORISATION_LABEL.toLowerCase()).toContain("authorised");
    expect(DECLINE_CONFIRMATION_LABEL.toLowerCase()).toContain("decline");
  });

  // 199
  it("the domain module stays pure: no clock, no randomness, no crypto, no storage", () => {
    const src = readFileSync(fileURLToPath(new URL("./model.ts", import.meta.url)), "utf8");
    for (const forbidden of ["Date.now(", "new Date()", "Math.random(", "localStorage", "sessionStorage", "fetch("]) {
      expect(src.includes(forbidden), forbidden).toBe(false);
    }
    // "crypto" appears in prose here (the module says where hashing lives), so the check is
    // on imports rather than on the word.
    expect(src).not.toMatch(/from\s+"(node:)?crypto"/);
    expect(src).not.toContain("crypto.");
    // Importable from the browser: the public page's client island imports this module, so a
    // server-only guard here would break the route rather than protect anything.
    expect(src).not.toMatch(/^import\s+"server-only"/m);
  });
});
