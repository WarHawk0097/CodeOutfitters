// Conversation state.
//
// The reducer maintains totals incrementally, so every accounting test checks it
// against a full recomputation rather than against a hand-written number. The
// context selection tests exist because the failure mode there is a provider 400,
// which is expensive to discover in production and cheap to pin here.

import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import { InMemoryConversationStore } from "./in-memory-store";
import {
  appendMessage,
  createConversation,
  deriveTitle,
  recomputeTotals,
  selectContext,
} from "./state";
import { toWireMessage, type ConversationMessage, type MessageMetrics } from "./types";

const IDENTITY = { id: "conversation-1", workspaceId: "workspace-1", userId: "user-1" };

function metrics(overrides: Partial<MessageMetrics> = {}): MessageMetrics {
  return {
    providerId: "mock",
    model: "mock-model",
    usage: { inputTokens: 10, outputTokens: 5 },
    costUsd: 0.002,
    latencyMs: 120,
    finishReason: "stop",
    ...overrides,
  };
}

function message(overrides: Partial<ConversationMessage> = {}): ConversationMessage {
  return {
    id: "message-1",
    role: "user",
    content: "hello",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("createConversation", () => {
  it("is deterministic given an id and a clock", () => {
    expect(createConversation(IDENTITY, "2026-01-01T00:00:00.000Z")).toEqual({
      ...IDENTITY,
      title: "New conversation",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      messages: [],
      totals: { usage: { inputTokens: 0, outputTokens: 0 }, costUsd: 0, latencyMs: 0 },
    });
  });
});

describe("appendMessage", () => {
  it("returns a new record and leaves the original untouched", () => {
    const before = createConversation(IDENTITY, "2026-01-01T00:00:00.000Z");
    const after = appendMessage(before, message());

    expect(before.messages).toEqual([]);
    expect(after).not.toBe(before);
    expect(after.messages).toHaveLength(1);
  });

  it("advances updatedAt to the message's own timestamp", () => {
    const after = appendMessage(
      createConversation(IDENTITY, "2026-01-01T00:00:00.000Z"),
      message({ createdAt: "2026-01-02T00:00:00.000Z" }),
    );

    expect(after.updatedAt).toBe("2026-01-02T00:00:00.000Z");
    expect(after.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("ignores messages that carry no metrics", () => {
    const after = appendMessage(createConversation(IDENTITY, "2026-01-01T00:00:00.000Z"), message());
    expect(after.totals).toEqual({ usage: { inputTokens: 0, outputTokens: 0 }, costUsd: 0, latencyMs: 0 });
  });

  it("keeps incremental totals equal to a full recomputation", () => {
    let conversation = createConversation(IDENTITY, "2026-01-01T00:00:00.000Z");

    for (let index = 0; index < 5; index += 1) {
      conversation = appendMessage(
        conversation,
        message({
          id: `message-${index}`,
          role: "assistant",
          metrics: metrics({
            usage: { inputTokens: index, outputTokens: index * 2, cachedInputTokens: index },
          }),
        }),
      );
    }

    expect(conversation.totals).toEqual(recomputeTotals(conversation));
    expect(conversation.totals.usage).toEqual({
      inputTokens: 10,
      outputTokens: 20,
      cachedInputTokens: 10,
    });
    expect(conversation.totals.latencyMs).toBe(600);
  });
});

describe("deriveTitle", () => {
  it("collapses whitespace", () => {
    expect(deriveTitle("  draft   a   proposal \n")).toBe("draft a proposal");
  });

  it("falls back when there is nothing to title with", () => {
    expect(deriveTitle("   ")).toBe("New conversation");
  });

  it("truncates on a word boundary and marks the cut", () => {
    const title = deriveTitle("word ".repeat(40));

    expect(title.length).toBeLessThanOrEqual(61);
    expect(title.endsWith("…")).toBe(true);
    expect(title).not.toContain("  ");
  });

  it("leaves a title that already fits alone", () => {
    expect(deriveTitle("short enough")).toBe("short enough");
  });
});

describe("selectContext", () => {
  const history: readonly ConversationMessage[] = [
    message({ id: "m1", role: "user", content: "first" }),
    message({
      id: "m2",
      role: "assistant",
      content: "calling",
      toolCalls: [{ id: "call_1", name: "search_crm", arguments: "{}" }],
    }),
    message({
      id: "m3",
      role: "tool",
      content: "result",
      toolCallId: "call_1",
      metadata: { toolName: "search_crm" },
    }),
    message({ id: "m4", role: "assistant", content: "answer" }),
  ];

  it("keeps the trailing window", () => {
    const plain = [
      message({ id: "m1", content: "first" }),
      message({ id: "m2", role: "assistant", content: "second" }),
      message({ id: "m3", content: "third" }),
    ];

    expect(selectContext(plain, 2)).toEqual([
      { role: "assistant", content: "second" },
      { role: "user", content: "third" },
    ]);
  });

  it("returns everything when the budget is larger than the history", () => {
    expect(selectContext(history, 100)).toHaveLength(history.length);
  });

  it("never starts a window with an orphaned tool result", () => {
    // A window of 2 would begin at the tool message, whose call is no longer
    // present — providers reject that outright.
    expect(selectContext(history, 2)[0]?.role).not.toBe("tool");
    expect(selectContext(history, 2)).toEqual([{ role: "assistant", content: "answer" }]);
  });

  it("strips storage-only fields on the way to the wire", () => {
    const [wire] = selectContext([history[3] as ConversationMessage], 1);

    expect(wire && Object.keys(wire).sort()).toEqual(["content", "role"]);
  });
});

describe("toWireMessage", () => {
  it("carries tool calls on an assistant message", () => {
    const toolCalls = [{ id: "call_1", name: "search_crm", arguments: "{}" }];
    expect(toWireMessage(message({ role: "assistant", content: "x", toolCalls }))).toEqual({
      role: "assistant",
      content: "x",
      toolCalls,
    });
  });

  it("correlates a tool result with its call", () => {
    expect(
      toWireMessage(
        message({
          role: "tool",
          content: "result",
          toolCallId: "call_1",
          metadata: { toolName: "search_crm" },
        }),
      ),
    ).toEqual({ role: "tool", toolCallId: "call_1", name: "search_crm", content: "result" });
  });

  it("drops metrics, ids and timestamps", () => {
    const wire = toWireMessage(message({ role: "assistant", content: "x", metrics: metrics() }));
    expect(Object.keys(wire)).not.toContain("metrics");
    expect(Object.keys(wire)).not.toContain("id");
    expect(Object.keys(wire)).not.toContain("createdAt");
  });
});

describe("InMemoryConversationStore", () => {
  const conversation = createConversation(IDENTITY, "2026-01-01T00:00:00.000Z");

  it("refuses to create the same id twice", async () => {
    const store = new InMemoryConversationStore();
    await store.create(conversation);

    await expect(store.create(conversation)).rejects.toThrow(ValidationError);
  });

  it("appends through the reducer", async () => {
    const store = new InMemoryConversationStore();
    await store.create(conversation);

    const updated = await store.append(conversation.id, message({ metrics: metrics() }));

    expect(updated.messages).toHaveLength(1);
    expect(updated.totals).toEqual(recomputeTotals(updated));
    expect((await store.get(conversation.id))?.messages).toHaveLength(1);
  });

  it("fails on a conversation that does not exist", async () => {
    await expect(new InMemoryConversationStore().append("missing", message())).rejects.toThrow(
      ValidationError,
    );
  });

  it("scopes listings by workspace and user", async () => {
    const store = new InMemoryConversationStore();
    await store.create(conversation);
    await store.create(
      createConversation(
        { id: "other", workspaceId: "workspace-2", userId: "user-1" },
        "2026-01-01T00:00:00.000Z",
      ),
    );
    await store.create(
      createConversation(
        { id: "another-user", workspaceId: "workspace-1", userId: "user-2" },
        "2026-01-01T00:00:00.000Z",
      ),
    );

    const listed = await store.list("workspace-1", "user-1");
    expect(listed.map((entry) => entry.id)).toEqual(["conversation-1"]);
  });

  it("returns newest first", async () => {
    const store = new InMemoryConversationStore();
    await store.create(createConversation({ ...IDENTITY, id: "older" }, "2026-01-01T00:00:00.000Z"));
    await store.create(createConversation({ ...IDENTITY, id: "newer" }, "2026-02-01T00:00:00.000Z"));

    expect((await store.list("workspace-1", "user-1")).map((entry) => entry.id)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("deletes", async () => {
    const store = new InMemoryConversationStore();
    await store.create(conversation);
    await store.delete(conversation.id);

    expect(await store.get(conversation.id)).toBeUndefined();
  });
});
