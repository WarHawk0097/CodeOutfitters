// Conversation history on the client: the two reads, the reducer transitions they
// drive, and what the panel draws for each of them.
//
// Node environment, like the rest of this screen's tests, so the browser half is
// exercised as functions and as static markup rather than through a DOM. `fetch`
// is injected everywhere below; nothing here touches the network.
//
// The properties being defended: a stale answer can never overwrite a newer
// choice, a history that will not load never stops anyone typing, and the panel
// shows a title and nothing else about a conversation.

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { fetchConversation, fetchConversations } from "./copilot-history";
import { HistoryPanel } from "./copilot-view";
import type { CopilotAction, CopilotState } from "./copilot-state";
import {
  INITIAL_COPILOT_STATE,
  canSend,
  copilotReducer,
  copilotRequestBody,
  statusAnnouncement,
} from "./copilot-state";

const historySrc = readFileSync(new URL("./copilot-history.ts", import.meta.url), "utf8");
const viewSrc = readFileSync(new URL("./copilot-view.tsx", import.meta.url), "utf8");

const OTHER = "22222222-2222-4222-8222-222222222222";

function reduce(...actions: CopilotAction[]): CopilotState {
  return actions.reduce(copilotReducer, INITIAL_COPILOT_STATE);
}

/** A `fetch` that answers once with `body`, recording what it was asked for. */
function stubFetch(
  status: number,
  body: unknown,
): { fetch: typeof fetch; urls: string[]; inits: (RequestInit | undefined)[] } {
  const urls: string[] = [];
  const inits: (RequestInit | undefined)[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    urls.push(String(input));
    inits.push(init);
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  };
  return { fetch: fetcher, urls, inits };
}

const LIST_OK = {
  ok: true,
  conversations: [
    { id: "c2", title: "Newest", createdAt: "x", updatedAt: "y", messageCount: 4 },
    { id: "c1", title: "Older", createdAt: "x", updatedAt: "y", messageCount: 2 },
  ],
};

const DETAIL_OK = {
  ok: true,
  conversation: {
    id: "c1",
    title: "Older",
    createdAt: "x",
    updatedAt: "y",
    messages: [
      { id: "m1", role: "user", content: "How did Q2 close?", createdAt: "x" },
      { id: "m2", role: "assistant", content: "Up 12%.", createdAt: "x" },
    ],
  },
};

/* ------------------------------------------------------------------- reads -- */

describe("Copilot history reads", () => {
  it("asks for the list without naming a user or a workspace", async () => {
    const stub = stubFetch(200, LIST_OK);

    const result = await fetchConversations(stub.fetch);

    expect(result).toEqual({
      ok: true,
      value: [
        { id: "c2", title: "Newest" },
        { id: "c1", title: "Older" },
      ],
    });
    expect(stub.urls).toEqual(["/api/ai/copilot/conversations"]);
    // A GET with no body: there is nothing about identity for a client to assert.
    expect(stub.inits[0]?.method).toBeUndefined();
    expect(stub.inits[0]?.body).toBeUndefined();
  });

  it("keeps the server's order rather than sorting again", async () => {
    const stub = stubFetch(200, LIST_OK);

    const result = await fetchConversations(stub.fetch);

    expect(result.ok && result.value.map((row) => row.title)).toEqual(["Newest", "Older"]);
  });

  it("drops every field the panel does not draw", async () => {
    const stub = stubFetch(200, LIST_OK);

    const result = await fetchConversations(stub.fetch);

    expect(result.ok && Object.keys(result.value[0]!).sort()).toEqual(["id", "title"]);
  });

  it("reads one conversation and keeps its messages in order", async () => {
    const stub = stubFetch(200, DETAIL_OK);

    const result = await fetchConversation(stub.fetch, "c1");

    expect(stub.urls).toEqual(["/api/ai/copilot/conversations/c1"]);
    expect(result).toEqual({
      ok: true,
      value: [
        { id: "m1", role: "user", text: "How did Q2 close?" },
        { id: "m2", role: "assistant", text: "Up 12%." },
      ],
    });
  });

  it("escapes the id it puts in the path", async () => {
    const stub = stubFetch(200, DETAIL_OK);

    await fetchConversation(stub.fetch, "../../admin?x=1");

    expect(stub.urls[0]).toBe("/api/ai/copilot/conversations/..%2F..%2Fadmin%3Fx%3D1");
  });

  it("reports the server's code and never a sentence of its own", async () => {
    for (const [status, code] of [
      [401, "unauthorized"],
      [403, "forbidden"],
      [404, "not_found"],
      [503, "unavailable"],
    ] as const) {
      const stub = stubFetch(status, { ok: false, error: { code, message: "ignored" } });
      expect(await fetchConversation(stub.fetch, "c1")).toEqual({ ok: false, code });
    }
  });

  it("falls back to a generic code when the failure body says nothing usable", async () => {
    for (const body of [{}, { error: {} }, { error: { code: "" } }, "<html>502</html>"]) {
      const stub = stubFetch(502, body);
      expect(await fetchConversations(stub.fetch)).toEqual({ ok: false, code: "unavailable" });
    }
  });

  it("treats a wrongly shaped 200 as a failure, not as an empty history", async () => {
    for (const body of [{ ok: true }, { conversations: null }, { conversations: [{ id: 1 }] }]) {
      const stub = stubFetch(200, body);
      expect(await fetchConversations(stub.fetch)).toEqual({ ok: false, code: "unavailable" });
    }
  });

  it("refuses a role it has no renderer for rather than guessing at it", async () => {
    const stub = stubFetch(200, {
      conversation: {
        messages: [{ id: "m1", role: "system", content: "You are a copilot.", createdAt: "x" }],
      },
    });

    expect(await fetchConversation(stub.fetch, "c1")).toEqual({ ok: false, code: "unavailable" });
  });

  it("reports an abort as its own code, so nothing is shown for it", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetcher: typeof fetch = async () => {
      throw Object.assign(new Error("aborted"), { name: "AbortError" });
    };

    expect(await fetchConversations(fetcher, controller.signal)).toEqual({
      ok: false,
      code: "aborted",
    });
  });

  it("reports a network failure without exposing it", async () => {
    const fetcher: typeof fetch = async () => {
      throw new Error("getaddrinfo ENOTFOUND db.acme.supabase.co");
    };

    const result = await fetchConversations(fetcher);

    expect(result).toEqual({ ok: false, code: "unavailable" });
    expect(JSON.stringify(result)).not.toContain("supabase");
  });

  it("sends no identity, no filter and no mutating verb", () => {
    expect(historySrc).not.toMatch(/workspaceId|userId|providerId|\bmodel\b/);
    expect(historySrc).not.toMatch(/method:\s*"(POST|PUT|PATCH|DELETE)"/);
    expect(historySrc).not.toContain("localStorage");
    expect(historySrc).not.toContain("sessionStorage");
  });
});

/* --------------------------------------------------------------- selection -- */

describe("Copilot history state", () => {
  it("holds the list without disturbing the composer", () => {
    const state = reduce(
      { type: "submit", text: "hi" },
      { type: "start", conversationId: "c9" },
      { type: "delta", text: "Up" },
      { type: "history_loaded", conversations: [{ id: "c1", title: "Older" }] },
    );

    expect(state.status).toBe("streaming");
    expect(state.messages.at(-1)?.text).toBe("Up");
    expect(state.conversations).toEqual([{ id: "c1", title: "Older" }]);
  });

  it("lets a failing list leave the assistant usable", () => {
    const state = reduce({ type: "history_loading" }, { type: "history_error", code: "unavailable" });

    expect(state.historyStatus).toBe("error");
    expect(state.historyError).toBe("The assistant is unavailable right now. Try again shortly.");
    // The thing that failed is the list, and only the list.
    expect(state.status).toBe("idle");
    expect(state.error).toBeNull();
    expect(canSend(state, "hello")).toBe(true);
  });

  it("shows the safe copy for a failing list, never the code", () => {
    for (const code of ["unauthorized", "forbidden", "unavailable", "configuration", "boom"]) {
      const state = copilotReducer(INITIAL_COPILOT_STATE, { type: "history_error", code });
      // A sentence, not an identifier. "unavailable" is a word that legitimately
      // appears in the copy, so the test is that the code was never the message.
      expect(state.historyError).toMatch(/^[A-Z].*\.$/);
      expect(state.historyError).not.toBe(code);
      expect(state.historyError).not.toMatch(/[a-z]_[a-z]|ai\//);
    }
  });

  it("empties the transcript the moment a conversation is chosen", () => {
    const state = reduce(
      { type: "submit", text: "hi" },
      { type: "start", conversationId: "c9" },
      { type: "delta", text: "Up 12%." },
      { type: "open", conversationId: "c1" },
    );

    // Nothing from the previous conversation is left showing under the new name.
    expect(state.messages).toEqual([]);
    expect(state.conversationId).toBe("c1");
    expect(state.transcriptStatus).toBe("loading");
  });

  it("will not send into a conversation whose earlier turns have not arrived", () => {
    const state = reduce({ type: "open", conversationId: "c1" });

    expect(canSend(state, "and Q1?")).toBe(false);
    expect(statusAnnouncement(state)).toBe("Opening conversation.");
  });

  it("loads a transcript and hands the composer the id to continue from", () => {
    const state = reduce(
      { type: "open", conversationId: "c1" },
      {
        type: "opened",
        conversationId: "c1",
        messages: [
          { id: "m1", role: "user", text: "How did Q2 close?" },
          { id: "m2", role: "assistant", text: "Up 12%." },
        ],
      },
    );

    expect(state.transcriptStatus).toBe("idle");
    expect(state.messages.map((m) => m.text)).toEqual(["How did Q2 close?", "Up 12%."]);
    expect(canSend(state, "and Q1?")).toBe(true);
    // The continuation carries the saved conversation, so the server appends to it
    // rather than starting a second one.
    expect(copilotRequestBody("and Q1?", state.conversationId)).toEqual({
      message: "and Q1?",
      conversationId: "c1",
    });
  });

  it("keeps the reopened turns and appends the new one", () => {
    const state = reduce(
      { type: "open", conversationId: "c1" },
      {
        type: "opened",
        conversationId: "c1",
        messages: [{ id: "m1", role: "user", text: "How did Q2 close?" }],
      },
      { type: "submit", text: "and Q1?" },
      { type: "start", conversationId: "c1" },
      { type: "delta", text: "Up 4%." },
      { type: "finish" },
    );

    expect(state.messages.map((m) => m.text)).toEqual(["How did Q2 close?", "and Q1?", "Up 4%."]);
    // Server ids and local ids share a list, so a collision would drop a bubble.
    expect(new Set(state.messages.map((m) => m.id)).size).toBe(state.messages.length);
  });

  it("ignores a transcript that arrives after a different one was chosen", () => {
    const state = reduce(
      { type: "open", conversationId: "c1" },
      { type: "open", conversationId: "c2" },
      {
        type: "opened",
        conversationId: "c2",
        messages: [{ id: "m9", role: "user", text: "Second." }],
      },
      // c1 finally answers. It is no longer the conversation on screen.
      {
        type: "opened",
        conversationId: "c1",
        messages: [{ id: "m1", role: "user", text: "First." }],
      },
    );

    expect(state.conversationId).toBe("c2");
    expect(state.messages.map((m) => m.text)).toEqual(["Second."]);
  });

  it("ignores a failure that arrives after a different conversation was chosen", () => {
    const state = reduce(
      { type: "open", conversationId: "c1" },
      { type: "open", conversationId: "c2" },
      {
        type: "opened",
        conversationId: "c2",
        messages: [{ id: "m9", role: "user", text: "Second." }],
      },
      { type: "open_error", conversationId: "c1", code: "not_found" },
    );

    expect(state.transcriptStatus).toBe("idle");
    expect(state.transcriptError).toBeNull();
    expect(state.messages).toHaveLength(1);
  });

  it("ignores a transcript that arrives after a new conversation was started", () => {
    const state = reduce(
      { type: "open", conversationId: "c1" },
      { type: "clear" },
      {
        type: "opened",
        conversationId: "c1",
        messages: [{ id: "m1", role: "user", text: "First." }],
      },
    );

    expect(state.conversationId).toBeNull();
    expect(state.messages).toEqual([]);
  });

  it("says the same thing for a deleted, a missing and somebody else's conversation", () => {
    const state = reduce(
      { type: "open", conversationId: "c1" },
      { type: "open_error", conversationId: "c1", code: "not_found" },
    );

    expect(state.transcriptStatus).toBe("error");
    expect(state.transcriptError).toBe("That conversation is no longer available.");
    expect(state.messages).toEqual([]);
    // Nothing is said about whether the id was ever real.
    expect(state.transcriptError).not.toMatch(/deleted|permission|workspace|owner/i);
  });

  it("starts a new local conversation without losing the list", () => {
    const state = reduce(
      { type: "history_loaded", conversations: [{ id: "c1", title: "Older" }] },
      { type: "open", conversationId: "c1" },
      { type: "opened", conversationId: "c1", messages: [{ id: "m1", role: "user", text: "Hi" }] },
      { type: "clear" },
    );

    expect(state.conversationId).toBeNull();
    expect(state.messages).toEqual([]);
    expect(state.transcriptStatus).toBe("idle");
    // The list describes the account, not the conversation being left.
    expect(state.conversations).toEqual([{ id: "c1", title: "Older" }]);
    expect(state.historyStatus).toBe("ready");
    // The next message therefore starts a conversation rather than continuing one.
    expect(copilotRequestBody("hello", state.conversationId)).toEqual({ message: "hello" });
  });

  it("stores nothing in the browser between visits", () => {
    expect(viewSrc).not.toMatch(/localStorage|sessionStorage|document\.cookie/);
  });
});

/* ------------------------------------------------------------------- panel -- */

describe("Copilot history panel", () => {
  const render = (state: CopilotState, expanded = true) =>
    renderToStaticMarkup(
      createElement(HistoryPanel, {
        state,
        panelId: "history",
        expanded,
        onToggle: () => {},
        onOpen: () => {},
        onNew: () => {},
        onRetry: () => {},
      }),
    );

  const ready = (conversations: { id: string; title: string }[]): CopilotState =>
    copilotReducer(INITIAL_COPILOT_STATE, { type: "history_loaded", conversations });

  it("names itself and offers a new conversation before anything has loaded", () => {
    const html = render(INITIAL_COPILOT_STATE);

    expect(html).toContain('aria-label="Conversation history"');
    expect(html).toContain("<h2");
    expect(html).toContain("Conversations</h2>");
    expect(html).toContain("New conversation");
  });

  it("shows a title per conversation and nothing else about it", () => {
    const html = render(ready([{ id: OTHER, title: "Quarterly numbers" }]));

    expect(html).toContain("Quarterly numbers");
    // The id is a selector, not content.
    expect(html).not.toContain(OTHER);
    // Word-bounded: the class names are full of substrings like "ms" and "cost".
    for (const forbidden of [/gpt-/i, /openai/i, /\btokens?\b/i, /\bcost\b/i, /\d+\s?ms\b/, /messageCount/]) {
      expect(html, String(forbidden)).not.toMatch(forbidden);
    }
  });

  it("renders a title as text, never as markup", () => {
    const html = render(ready([{ id: "c1", title: "<img src=x onerror=alert(1)>" }]));

    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
    expect(viewSrc).not.toContain("dangerouslySetInnerHTML");
  });

  it("marks the open conversation by more than colour", () => {
    const state = { ...ready([{ id: "c1", title: "Older" }]), conversationId: "c1" };

    const html = render(state);

    expect(html).toContain('aria-current="true"');
    expect(html).toContain("font-semibold");
    expect(html).toContain("border-l-2");
    // And unmarked when it is not the one on screen.
    expect(render(ready([{ id: "c1", title: "Older" }]))).not.toContain("aria-current");
  });

  it("offers nothing this slice cannot do", () => {
    const html = render(ready([{ id: "c1", title: "Older" }]));

    for (const absent of ["Delete", "Rename", "Pin", "Share", "Search", "Load more"]) {
      expect(html, absent).not.toContain(absent);
    }
  });

  it("says what an empty history means rather than showing a blank column", () => {
    const html = render(ready([]));

    expect(html).toContain("Nothing saved yet.");
    expect(html).not.toContain("<ul");
  });

  it("says the list is loading", () => {
    const html = render(
      copilotReducer(INITIAL_COPILOT_STATE, { type: "history_loading" }),
    );

    expect(html).toContain("Loading your conversations…");
  });

  it("offers a retry when the list fails, and still offers a new conversation", () => {
    const html = render(
      copilotReducer(INITIAL_COPILOT_STATE, { type: "history_error", code: "unavailable" }),
    );

    expect(html).toContain("The assistant is unavailable right now.");
    expect(html).toContain("Try again");
    // The failure is reported quietly; it does not interrupt what is being typed.
    expect(html).toContain('role="status"');
    expect(html).not.toContain('role="alert"');
    expect(html).toContain("New conversation");
  });

  it("is one list, disclosed on a narrow screen and a column on a wide one", () => {
    const collapsed = render(ready([{ id: "c1", title: "Older" }]), false);

    expect(collapsed).toContain('aria-expanded="false"');
    expect(collapsed).toContain('aria-controls="history"');
    expect(collapsed).toContain('id="history"');
    // Hidden by class rather than unmounted, so `aria-controls` always resolves
    // and the desktop breakpoint can override it.
    expect(collapsed).toContain("Older");
    expect(collapsed).toMatch(/class="hidden lg:block"/);
    expect(render(ready([{ id: "c1", title: "Older" }]), true)).toMatch(/class="block lg:block"/);
    // One control per conversation, at either size.
    expect(collapsed.match(/Older/g)).toHaveLength(1);
  });

  it("keeps every control a real button", () => {
    const html = render(ready([{ id: "c1", title: "Older" }]));

    expect(html.match(/<div[^>]*onclick/i)).toBeNull();
    expect(html).toMatch(/<button type="button"[^>]*>Older<\/button>/);
  });
});
