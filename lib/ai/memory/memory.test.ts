// Memory key construction and tenant isolation.
//
// The whole safety property of these stores is that the key carries the scope.
// Two workspaces that build the same key share a value, and that is a
// cross-tenant leak wearing a cache hit's clothes — so the separator matters as
// much as the fields around it.
//
// The separator is `\u0000`, written as an escape rather than as a literal byte.
// A literal NUL makes the source file binary to Git, which silently removes it
// from diffs, blame and review. The tests below pin both halves: the character
// must still be a character no identifier can contain, and the file must stay
// text.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createInMemoryMemorySystem } from "./in-memory";
import type { MemoryRecord } from "./types";

const NUL = "\u0000";

const record = (overrides: Partial<MemoryRecord> = {}): MemoryRecord => ({
  id: "memory-1",
  text: "Prefers metric units.",
  source: "user",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("key construction", () => {
  it("keeps the separator out of the source file as a literal byte", () => {
    const source = readFileSync(new URL("./in-memory.ts", import.meta.url));

    // A file Git calls binary is a file nobody reviews.
    expect(source.includes(0)).toBe(false);
    expect(source.toString("utf8")).toContain("\\u0000");
  });

  it("uses a separator no identifier can contain", () => {
    // If this ever became a printable character, the collision tests below would
    // pass by luck rather than by construction.
    expect(NUL).toHaveLength(1);
    expect(encodeURIComponent(NUL)).toBe("%00");
  });

  it("does not collide when a scope field boundary is ambiguous", async () => {
    const memory = createInMemoryMemorySystem();

    // "a" + "bc" and "ab" + "c" concatenate identically without a separator.
    await memory.conversation.setSummary({ workspaceId: "a", conversationId: "bc" }, "first");
    await memory.conversation.setSummary({ workspaceId: "ab", conversationId: "c" }, "second");

    await expect(
      memory.conversation.getSummary({ workspaceId: "a", conversationId: "bc" }),
    ).resolves.toBe("first");
    await expect(
      memory.conversation.getSummary({ workspaceId: "ab", conversationId: "c" }),
    ).resolves.toBe("second");
  });

  it("does not collide across the three-part session scope", async () => {
    const memory = createInMemoryMemorySystem();

    await memory.session.set({ workspaceId: "w", userId: "u", sessionId: "s1" }, "k", "one");
    await memory.session.set({ workspaceId: "w", userId: "u", sessionId: "s2" }, "k", "two");

    await expect(
      memory.session.get({ workspaceId: "w", userId: "u", sessionId: "s1" }, "k"),
    ).resolves.toBe("one");
    await expect(
      memory.session.get({ workspaceId: "w", userId: "u", sessionId: "s2" }, "k"),
    ).resolves.toBe("two");
  });

  it("cannot be confused by a scope value that contains the separator", async () => {
    const memory = createInMemoryMemorySystem();
    const scope = { workspaceId: "w", userId: "u", sessionId: "s" };

    await memory.session.set(scope, "k", "real");
    // A key crafted to look like a different session's entry must not read it.
    await expect(memory.session.get(scope, `${NUL}k`)).resolves.toBeUndefined();
  });
});

describe("scope isolation", () => {
  it("keeps conversation summaries inside their workspace", async () => {
    const memory = createInMemoryMemorySystem();

    await memory.conversation.setSummary(
      { workspaceId: "workspace-1", conversationId: "conversation-1" },
      "tenant one",
    );

    await expect(
      memory.conversation.getSummary({
        workspaceId: "workspace-2",
        conversationId: "conversation-1",
      }),
    ).resolves.toBeUndefined();
  });

  it("keeps session values inside their user", async () => {
    const memory = createInMemoryMemorySystem();

    await memory.session.set(
      { workspaceId: "w", userId: "user-1", sessionId: "session-1" },
      "draft",
      "private",
    );

    await expect(
      memory.session.get({ workspaceId: "w", userId: "user-2", sessionId: "session-1" }, "draft"),
    ).resolves.toBeUndefined();
  });

  it("clears only the session it was asked to clear", async () => {
    const memory = createInMemoryMemorySystem();
    const kept = { workspaceId: "w", userId: "u", sessionId: "keep" };

    await memory.session.set({ workspaceId: "w", userId: "u", sessionId: "drop" }, "k", "gone");
    await memory.session.set(kept, "k", "still here");
    await memory.session.clear({ workspaceId: "w", userId: "u", sessionId: "drop" });

    await expect(
      memory.session.get({ workspaceId: "w", userId: "u", sessionId: "drop" }, "k"),
    ).resolves.toBeUndefined();
    await expect(memory.session.get(kept, "k")).resolves.toBe("still here");
  });

  it("keeps long-term memories inside their user", async () => {
    const memory = createInMemoryMemorySystem();

    await memory.longTerm.remember({ workspaceId: "w", userId: "user-1" }, record());

    await expect(memory.longTerm.recall({ workspaceId: "w", userId: "user-2" })).resolves.toEqual(
      [],
    );
    await expect(memory.longTerm.recall({ workspaceId: "other", userId: "user-1" })).resolves.toEqual(
      [],
    );
  });

  it("keeps preferences inside their user", async () => {
    const memory = createInMemoryMemorySystem();

    await memory.preferences.set({ workspaceId: "w", userId: "user-1" }, { tone: "terse" });

    await expect(memory.preferences.get({ workspaceId: "w", userId: "user-2" })).resolves.toEqual({});
  });

  it("keeps workspace memory inside its workspace", async () => {
    const memory = createInMemoryMemorySystem();

    await memory.workspace.set({ workspaceId: "workspace-1" }, [record()]);

    await expect(memory.workspace.get({ workspaceId: "workspace-2" })).resolves.toEqual([]);
  });
});

describe("expiry", () => {
  it("stops returning a session value once its ttl has passed", async () => {
    let now = 0;
    const memory = createInMemoryMemorySystem(() => now);
    const scope = { workspaceId: "w", userId: "u", sessionId: "s" };

    await memory.session.set(scope, "k", "v", 1_000);
    await expect(memory.session.get(scope, "k")).resolves.toBe("v");

    now = 1_000;
    await expect(memory.session.get(scope, "k")).resolves.toBeUndefined();
  });

  it("stops recalling a long-term record once it has expired", async () => {
    let now = Date.parse("2026-01-01T00:00:00.000Z");
    const memory = createInMemoryMemorySystem(() => now);
    const scope = { workspaceId: "w", userId: "u" };

    await memory.longTerm.remember(
      scope,
      record({ expiresAt: "2026-01-02T00:00:00.000Z" }),
    );
    await expect(memory.longTerm.recall(scope)).resolves.toHaveLength(1);

    now = Date.parse("2026-01-03T00:00:00.000Z");
    await expect(memory.longTerm.recall(scope)).resolves.toEqual([]);
  });
});
