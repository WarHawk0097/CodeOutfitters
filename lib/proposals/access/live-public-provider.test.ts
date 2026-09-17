import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { NOT_FOUND_VIEW } from "./model";
import { resolvedRowToView, type LiveResolvedRow } from "./live-public-provider";

const here = fileURLToPath(new URL(".", import.meta.url));

const snapshot = {
  title: "Automation rollout",
  clientOrganisation: "Acme",
  versionLabel: "v1",
  netTerms: "Net 14",
  currency: "USD" as const,
  totalCents: 125000,
  sections: [],
};

function row(overrides: Partial<LiveResolvedRow> = {}): LiveResolvedRow {
  return {
    link_id: "11111111-1111-4111-8111-111111111111",
    recipient_name: "Client Person",
    expires_at: "2030-01-01T00:00:00.000Z",
    revoked_at: null,
    decision: "none",
    decided_at: null,
    decided_by_name: null,
    publication_status: "published",
    has_newer_version: false,
    version_label: "v1",
    title: "Automation rollout",
    client_organisation: "Acme",
    snapshot,
    ...overrides,
  };
}

describe("live secure proposal public mapping", () => {
  it("returns the uniform not-found view when no resolved row exists", () => {
    expect(resolvedRowToView(null, [], "2029-01-01T00:00:00.000Z")).toBe(NOT_FOUND_VIEW);
  });

  it("builds an active public view without internal identifiers or recipient email", () => {
    const view = resolvedRowToView(row(), [], "2029-01-01T00:00:00.000Z");
    expect(view.state).toBe("active");
    expect(view.canRespond).toBe(true);
    expect(view.document).toEqual(snapshot);
    const serialised = JSON.stringify(view);
    expect(serialised).not.toContain("link_id");
    expect(serialised).not.toContain("recipient_email");
    expect(serialised).not.toContain("token_hash");
    expect(serialised).not.toContain("internal_proposal_id");
  });

  it("makes revoked and expired links indistinguishable from unknown links while keeping decided proposals readable", () => {
    expect(resolvedRowToView(row({ revoked_at: "2028-01-01T00:00:00.000Z" }), [], "2029-01-01T00:00:00.000Z")).toBe(NOT_FOUND_VIEW);
    expect(resolvedRowToView(row({ expires_at: "2028-01-01T00:00:00.000Z" }), [], "2029-01-01T00:00:00.000Z")).toBe(NOT_FOUND_VIEW);
    const accepted = resolvedRowToView(row({ decision: "accepted", decided_at: "2028-02-01T00:00:00.000Z", decided_by_name: "Client Person" }), [], "2029-01-01T00:00:00.000Z");
    expect(accepted.state).toBe("accepted");
    expect(accepted.document).toEqual(snapshot);
    expect(accepted.canRespond).toBe(false);
  });

  it("keeps raw tokens out of database RPC arguments", () => {
    const source = readFileSync(`${here}live-public-provider.ts`, "utf8");
    expect(source).toContain("hashAccessToken(rawToken)");
    expect(source).toContain("p_token_hash: tokenHash");
    expect(source).not.toContain("p_token: rawToken");
  });
});
