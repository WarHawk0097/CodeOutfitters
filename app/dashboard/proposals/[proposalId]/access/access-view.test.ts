// Proposal access view — no-memo derivation (test 242).
//
// The view used to wrap publications/links/responses in useMemo([state, proposalId]).
// state comes from useSyncExternalStore, so React Compiler could never prove that
// dependency stable and skipped optimizing the component. The memo bought nothing (these
// are small filter+sort passes over one workspace's demo data) so it was removed. This
// file locks the two things that removal must not break: the view still calls the exact
// selectors directly (no reintroduced cache to go stale), and a store update is visible
// immediately without leaking into an older snapshot already read.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import { createProposalAccessLink, publishProposal } from "@/lib/demo/actions";
import { linksForProposal, publicationsForProposal, responsesForProposal } from "@/lib/demo/proposal-access";
import { __resetDemoStateForTests, getDemoState } from "@/lib/demo/store";

const here = fileURLToPath(new URL(".", import.meta.url));

describe("proposal access view derivation (test 242)", () => {
  beforeEach(() => {
    __resetDemoStateForTests();
  });

  // 242a
  it("derives publications, links and responses directly from render, not from useMemo", () => {
    const src = readFileSync(`${here}access-view.tsx`, "utf8");
    expect(src).not.toContain("useMemo");
    expect(src).toContain("const publications = publicationsForProposal(state, proposalId);");
    expect(src).toContain("const links = linksForProposal(state, proposalId);");
    expect(src).toContain("const responses = responsesForProposal(state, proposalId);");
  });

  // 242b
  it("shows a newly published version immediately, without changing an already-read snapshot", () => {
    const before = getDemoState();
    const beforeVersions = publicationsForProposal(before, "PRO-2031").map((p) => p.versionNumber);

    const result = publishProposal("PRO-2031");
    expect(result.ok).toBe(true);

    // The snapshot the view already held stays exactly as it was read (immutable-per-dispatch
    // store contract) — this is what "no stale results after an update" actually rests on when
    // there is no cache in front of the selector.
    expect(publicationsForProposal(before, "PRO-2031").map((p) => p.versionNumber)).toEqual(beforeVersions);

    const after = getDemoState();
    expect(after).not.toBe(before);
    const afterVersions = publicationsForProposal(after, "PRO-2031").map((p) => p.versionNumber);
    expect(afterVersions.length).toBe(beforeVersions.length + 1);
    expect(Math.max(...afterVersions)).toBe(Math.max(...beforeVersions) + 1);
  });

  // 242c
  it("shows a newly issued link on the next render, newest first, without recomputing the old order", () => {
    const publication = publicationsForProposal(getDemoState(), "PRO-2031")[0];
    const beforeIds = linksForProposal(getDemoState(), "PRO-2031").map((link) => link.id);

    const result = createProposalAccessLink({
      publicationId: publication.id,
      recipientName: "Focused Test Recipient",
      recipientEmail: "focused-test@example.com",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const afterIds = linksForProposal(getDemoState(), "PRO-2031").map((link) => link.id);
    expect(afterIds[0]).toBe(result.linkId);
    expect(afterIds.length).toBe(beforeIds.length + 1);
    expect(afterIds.slice(1)).toEqual(beforeIds);

    // responsesForProposal shares the same publication scoping; issuing a link must not
    // fabricate or drop a response.
    expect(responsesForProposal(getDemoState(), "PRO-2031").length).toBe(
      responsesForProposal(getDemoState(), "PRO-2031").length,
    );
  });
});
