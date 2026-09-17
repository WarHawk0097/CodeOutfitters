import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(__dirname, "page.tsx"), "utf8");

describe("extension approval page honesty", () => {
  it("does not claim extension connection from server-side approval alone", () => {
    expect(source).toContain('title="Authorization approved"');
    expect(source).toContain("Return to the extension to finish connecting.");
    expect(source).not.toContain('title="CodeOutfitters extension connected"');
  });
});
