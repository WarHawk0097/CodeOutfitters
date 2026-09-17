import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildPublishedSnapshot } from "./live-admin-provider";

const here = fileURLToPath(new URL(".", import.meta.url));

describe("live proposal admin provider", () => {
  it("builds a client-safe snapshot from validated publish input", () => {
    const snapshot = buildPublishedSnapshot({
      title: "Automation rollout",
      clientOrganisation: "Acme",
      versionLabel: "v1",
      netTerms: "Net 14",
      sections: [{ name: "Executive summary", body: "We will automate intake and follow-up." }],
    });
    expect(snapshot.title).toBe("Automation rollout");
    expect(snapshot.sections[0]?.navLabel).toBe("01 · Executive summary");
    expect(JSON.stringify(snapshot)).not.toMatch(/workspace|owner|email|token|internal/i);
  });

  it("generates and hashes access tokens on the server instead of accepting a token from the browser", () => {
    const source = readFileSync(`${here}live-admin-provider.ts`, "utf8");
    expect(source).toContain("generateAccessToken()");
    expect(source).toContain("hashAccessToken(rawToken)");
    expect(source).not.toMatch(/intent\.rawToken|input\.rawToken|token:\s*intent/);
  });

  it("scopes every link mutation to the trusted workspace", () => {
    const source = readFileSync(`${here}live-admin-provider.ts`, "utf8");
    expect(source).toContain('.eq("workspace_id", context.workspaceId)');
    expect(source).toContain('created_by: context.userId');
  });
});
