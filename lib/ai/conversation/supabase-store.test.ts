// The Supabase-backed conversation store, exercised against a Postgres stand-in.
//
// The division of labour matters here. This file proves the half that lives in
// TypeScript: which statements the store issues, how a row becomes a
// `ConversationMessage` and back, that ordering is taken from the sequence rather
// than from a timestamp several messages share, that a driver error never reaches
// a caller carrying Postgres text. The half that lives in SQL — that the policies
// are declared, that they bite, that a second user really cannot read the first
// one's transcript — is proved in ai-conversations-migration.pglite.test.ts,
// against the migration file itself. Neither file can cover for the other.
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AIError, ValidationError } from "../errors";
import { createConversation } from "./state";
import { ConversationStoreError, SupabaseConversationStore } from "./supabase-store";
import type { Conversation, ConversationMessage } from "./types";
import { FakeSupabase } from "@/test/fake-supabase";

const WORKSPACE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER_WORKSPACE = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";

const CONVERSATION_A = "0000000a-0000-4000-8000-000000000001";
const CONVERSATION_B = "0000000b-0000-4000-8000-000000000002";

// One instant for several messages, on purpose: it is the condition that makes
// created_at useless as an ordering key and the sequence load-bearing.
const T0 = "2026-08-02T10:00:00.000Z";
const T1 = "2026-08-02T10:00:01.000Z";

let fake: FakeSupabase;
let store: SupabaseConversationStore;

function asClient(instance: FakeSupabase): SupabaseClient {
  return instance as unknown as SupabaseClient;
}

function newConversation(id: string, userId = USER_A, workspaceId = WORKSPACE): Conversation {
  return createConversation({ id, workspaceId, userId }, T0, "Quarterly numbers");
}

const userMessage = (id: string, text: string, at = T0): ConversationMessage => ({
  id,
  role: "user",
  content: text,
  createdAt: at,
});

beforeEach(() => {
  fake = new FakeSupabase({ workspaceId: WORKSPACE, userId: USER_A });
  store = new SupabaseConversationStore(asClient(fake));
});

describe("SupabaseConversationStore — creating", () => {
  it("writes the conversation it is handed and returns that same record", async () => {
    const conversation = newConversation(CONVERSATION_A);

    const created = await store.create(conversation);

    // The id is the caller's, not the database's: it is generated server-side by the
    // orchestrator and the column default is only a backstop. A store that returned
    // a different id would break the id the stream already announced.
    expect(created).toEqual(conversation);
    expect(fake.conversations).toHaveLength(1);
    expect(fake.conversations[0]).toMatchObject({
      id: CONVERSATION_A,
      workspace_id: WORKSPACE,
      user_id: USER_A,
      title: "Quarterly numbers",
      created_at: T0,
    });
  });

  it("reports a reused id as a validation failure, not a store failure", async () => {
    await store.create(newConversation(CONVERSATION_A));

    await expect(store.create(newConversation(CONVERSATION_A))).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});

describe("SupabaseConversationStore — reading", () => {
  it("returns the messages in sequence order, not timestamp order", async () => {
    await store.create(newConversation(CONVERSATION_A));
    // All three share one instant, which is what a single turn actually produces.
    await store.append(CONVERSATION_A, userMessage("m1", "How did Q2 close?"));
    await store.append(CONVERSATION_A, {
      id: "m2",
      role: "assistant",
      content: "",
      createdAt: T0,
      toolCalls: [{ id: "call_1", name: "lookup", arguments: '{"q":"Q2"}' }],
    });
    await store.append(CONVERSATION_A, {
      id: "m3",
      role: "tool",
      content: "42",
      createdAt: T0,
      toolCallId: "call_1",
      metadata: { toolName: "lookup" },
    });

    const loaded = await store.get(CONVERSATION_A);

    expect(loaded?.messages.map((message) => message.id)).toEqual(["m1", "m2", "m3"]);
  });

  it("round-trips every role the message vocabulary declares", async () => {
    await store.create(newConversation(CONVERSATION_A));
    const messages: ConversationMessage[] = [
      { id: "s", role: "system", content: "You are read-only.", createdAt: T0 },
      { id: "d", role: "developer", content: "Cite the workspace.", createdAt: T0 },
      { id: "u", role: "user", content: "Hello", createdAt: T0 },
      { id: "a", role: "assistant", content: "Hi", createdAt: T0 },
      {
        id: "t",
        role: "tool",
        content: "{}",
        createdAt: T0,
        toolCallId: "call_9",
        metadata: { toolName: "noop" },
      },
    ];
    for (const message of messages) await store.append(CONVERSATION_A, message);

    const loaded = await store.get(CONVERSATION_A);

    expect(loaded?.messages).toEqual(messages);
  });

  it("keeps an assistant message's tool calls intact", async () => {
    await store.create(newConversation(CONVERSATION_A));
    const calls = [
      { id: "call_1", name: "listLeads", arguments: '{"limit":5}' },
      { id: "call_2", name: "countTasks", arguments: "{}" },
    ];
    await store.append(CONVERSATION_A, {
      id: "m1",
      role: "assistant",
      content: "Looking that up.",
      createdAt: T0,
      toolCalls: calls,
    });

    const loaded = await store.get(CONVERSATION_A);

    expect(loaded?.messages[0]?.toolCalls).toEqual(calls);
  });

  it("survives a metrics round trip and folds the totals back", async () => {
    await store.create(newConversation(CONVERSATION_A));
    const metrics = {
      providerId: "openai",
      model: "gpt-5-mini",
      usage: { inputTokens: 1200, outputTokens: 340, cachedInputTokens: 800, reasoningTokens: 64 },
      costUsd: 0.00123456,
      latencyMs: 812,
      finishReason: "stop" as const,
    };
    await store.append(CONVERSATION_A, userMessage("m1", "How did Q2 close?"));
    await store.append(CONVERSATION_A, {
      id: "m2",
      role: "assistant",
      content: "Up 12%.",
      createdAt: T1,
      metrics,
    });

    const loaded = await store.get(CONVERSATION_A);

    expect(loaded?.messages[1]?.metrics).toEqual(metrics);
    // A user message costs nothing to store, so it contributes nothing to the sum.
    expect(loaded?.messages[0]?.metrics).toBeUndefined();
    expect(loaded?.totals).toEqual({
      usage: { inputTokens: 1200, outputTokens: 340, cachedInputTokens: 800, reasoningTokens: 64 },
      costUsd: 0.00123456,
      latencyMs: 812,
    });
  });

  it("answers undefined for a conversation that is not there", async () => {
    expect(await store.get(CONVERSATION_A)).toBeUndefined();
  });

  it("answers exactly the same for a conversation belonging to somebody else", async () => {
    // Same workspace, different person — the case a workspace-wide policy would get
    // wrong. Seeded past the policies, as a fixture written by the table owner.
    fake.seedConversation({
      id: CONVERSATION_B,
      workspace_id: WORKSPACE,
      user_id: USER_B,
      title: "Not yours",
      created_at: T0,
      updated_at: T0,
    });

    const missing = await store.get(CONVERSATION_A);
    const theirs = await store.get(CONVERSATION_B);

    expect(theirs).toBe(missing);
    expect(theirs).toBeUndefined();
  });
});

describe("SupabaseConversationStore — listing", () => {
  it("returns only this user's conversations in this workspace, newest first", async () => {
    await store.create(newConversation(CONVERSATION_A));
    await store.create(newConversation(CONVERSATION_B));
    // Touching the second one makes it the most recent.
    await store.append(CONVERSATION_B, userMessage("m1", "Later", T1));
    fake.seedConversation({
      id: "0000000c-0000-4000-8000-000000000003",
      workspace_id: OTHER_WORKSPACE,
      user_id: USER_A,
      title: "Another workspace",
      created_at: T0,
      updated_at: T1,
    });
    fake.seedConversation({
      id: "0000000d-0000-4000-8000-000000000004",
      workspace_id: WORKSPACE,
      user_id: USER_B,
      title: "Another user",
      created_at: T0,
      updated_at: T1,
    });

    const listed = await store.list(WORKSPACE, USER_A);

    expect(listed.map((conversation) => conversation.id)).toEqual([
      CONVERSATION_B,
      CONVERSATION_A,
    ]);
  });

  it("honours the limit and reads every transcript in one statement", async () => {
    for (const id of [CONVERSATION_A, CONVERSATION_B]) {
      await store.create(newConversation(id));
      await store.append(id, userMessage(`${id}-m1`, "Hello"));
    }
    fake.calls.length = 0;

    const listed = await store.list(WORKSPACE, USER_A, 1);

    expect(listed).toHaveLength(1);
    expect(listed[0]?.messages).toHaveLength(1);
    // One statement for the conversations and one for all of their messages. A store
    // that fetched messages per conversation would show a third here, and a hundred
    // on a real history page.
    expect(fake.calls).toEqual(["ai_conversations", "ai_messages"]);
  });

  it("returns nothing, and asks nothing further, when there is no history", async () => {
    fake.calls.length = 0;

    expect(await store.list(WORKSPACE, USER_A)).toEqual([]);
    expect(fake.calls).toEqual(["ai_conversations"]);
  });
});

describe("SupabaseConversationStore — appending", () => {
  it("returns the conversation with the new message folded in", async () => {
    await store.create(newConversation(CONVERSATION_A));

    const updated = await store.append(CONVERSATION_A, userMessage("m1", "Hello"));

    expect(updated.messages.map((message) => message.id)).toEqual(["m1"]);
    expect(updated.id).toBe(CONVERSATION_A);
  });

  it("refuses an unknown conversation and one that is not yours identically", async () => {
    fake.seedConversation({
      id: CONVERSATION_B,
      workspace_id: WORKSPACE,
      user_id: USER_B,
      title: "Not yours",
      created_at: T0,
      updated_at: T0,
    });

    const unknown = await store
      .append(CONVERSATION_A, userMessage("m1", "Hello"))
      .catch((error: unknown) => error);
    const theirs = await store
      .append(CONVERSATION_B, userMessage("m2", "Hello"))
      .catch((error: unknown) => error);

    expect(unknown).toBeInstanceOf(ValidationError);
    expect(theirs).toBeInstanceOf(ValidationError);
    // Same class and same text: an attacker holding a real id learns nothing an
    // attacker holding a guessed one does not.
    expect((theirs as ValidationError).safeMessage).toBe((unknown as ValidationError).safeMessage);
    expect(fake.messages).toHaveLength(0);
  });

  it("refuses content this schema cannot hold rather than flattening it", async () => {
    await store.create(newConversation(CONVERSATION_A));

    await expect(
      store.append(CONVERSATION_A, {
        id: "m1",
        role: "user",
        content: [{ type: "text", text: "Look at this" }, { type: "image", mediaType: "image/png", url: "https://example.test/x.png" }],
        createdAt: T0,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    // Nothing partial was written on the way to the refusal.
    expect(fake.messages).toHaveLength(0);
  });
});

describe("SupabaseConversationStore — deleting", () => {
  it("removes the conversation and its messages", async () => {
    await store.create(newConversation(CONVERSATION_A));
    await store.append(CONVERSATION_A, userMessage("m1", "Hello"));

    await store.delete(CONVERSATION_A);

    expect(await store.get(CONVERSATION_A)).toBeUndefined();
    expect(fake.messages).toHaveLength(0);
  });

  it("is silent about a conversation it cannot reach", async () => {
    fake.seedConversation({
      id: CONVERSATION_B,
      workspace_id: WORKSPACE,
      user_id: USER_B,
      title: "Not yours",
      created_at: T0,
      updated_at: T0,
    });

    await expect(store.delete(CONVERSATION_B)).resolves.toBeUndefined();
    // Silent, and also ineffective: the row is still there.
    expect(fake.conversations).toHaveLength(1);
  });
});

describe("SupabaseConversationStore — failures", () => {
  const PG_TEXT =
    'new row violates row-level security policy for table "ai_messages" at character 42';

  it("turns a driver failure into a typed error carrying no Postgres text", async () => {
    fake.failNext("ai_conversations", { code: "57P01", message: PG_TEXT });

    const error = await store.get(CONVERSATION_A).catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(ConversationStoreError);
    expect(error).toBeInstanceOf(AIError);
    const failure = error as ConversationStoreError;
    expect(failure.code).toBe("ai/provider");
    expect(failure.retryable).toBe(true);
    // Neither the safe projection nor the internal message may carry the driver's
    // text: the safe one is shown to a user, and the internal one is logged.
    expect(failure.safeMessage).not.toContain("row-level security");
    expect(failure.safeMessage).not.toContain("ai_messages");
    expect(failure.message).not.toContain(PG_TEXT);
    expect(failure.toClientJSON()).toEqual({
      code: "ai/provider",
      message: failure.safeMessage,
      retryable: true,
    });
  });

  it("reports a failure on each operation without leaking which statement it was", async () => {
    await store.create(newConversation(CONVERSATION_A));

    fake.failNext("ai_conversations", { code: "08006", message: PG_TEXT });
    const listFailure = await store.list(WORKSPACE, USER_A).catch((error: unknown) => error);

    fake.failNext("ai_messages", { code: "08006", message: PG_TEXT });
    const appendFailure = await store
      .append(CONVERSATION_A, userMessage("m1", "Hello"))
      .catch((error: unknown) => error);

    fake.failNext("ai_conversations", { code: "08006", message: PG_TEXT });
    const deleteFailure = await store.delete(CONVERSATION_A).catch((error: unknown) => error);

    for (const failure of [listFailure, appendFailure, deleteFailure]) {
      expect(failure).toBeInstanceOf(ConversationStoreError);
      expect((failure as AIError).safeMessage).toBe(
        "The assistant could not reach its conversation history.",
      );
    }
  });
});

describe("SupabaseConversationStore — privileges", () => {
  const source = readFileSync(
    fileURLToPath(new URL("./supabase-store.ts", import.meta.url)),
    "utf8",
  );

  it("has no service-role path and reads no credentials of its own", () => {
    // The client arrives as a constructor argument; anything else here would be a
    // second way to reach the database, and the only one able to bypass RLS.
    expect(source).not.toContain("service_role");
    expect(source).not.toContain("SERVICE_ROLE");
    expect(source).not.toContain("process.env");
    expect(source).not.toContain("createBrowserClient");
    expect(source).not.toContain("createServerClient");
    expect(source).not.toContain("createClient(");
  });

  it("never scopes a read in TypeScript that the policies already scope", () => {
    // `get` takes an id and nothing else. Adding a workspace filter here would read
    // as defence and behave as a second, weaker boundary that can drift from the one
    // in SQL.
    expect(source).toMatch(/async get\(id: string\): Promise<Conversation \| undefined>/);
  });
});
