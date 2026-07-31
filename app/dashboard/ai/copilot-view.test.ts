// Node-env tests for the Copilot screen. No DOM, matching the rest of this repo:
// the reducer and the stream reader are plain functions and are called directly,
// the markup goes through react-dom/server, and the facts that only live in the
// component's wiring (which controller it builds, what it puts in the request
// body) are asserted against the source, as elsewhere in this codebase.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CopilotScreen, CopilotTranscript } from "./copilot-view";
import { readCopilotStream, type CopilotStreamEvent } from "./copilot-stream";
import {
  INITIAL_COPILOT_STATE,
  MAX_MESSAGE_LENGTH,
  canSend,
  copilotReducer,
  copilotRequestBody,
  errorMessage,
  isBusy,
  shouldSendOnKey,
  statusAnnouncement,
  type CopilotAction,
  type CopilotState,
} from "./copilot-state";
import { MAX_MESSAGE_LENGTH as SERVER_MAX_MESSAGE_LENGTH } from "@/lib/ai/server/copilot-request";

const here = fileURLToPath(new URL(".", import.meta.url));
const viewSrc = readFileSync(`${here}copilot-view.tsx`, "utf8");
const pageSrc = readFileSync(`${here}page.tsx`, "utf8");
const streamSrc = readFileSync(`${here}copilot-stream.ts`, "utf8");
const stateSrc = readFileSync(`${here}copilot-state.ts`, "utf8");

/** Drives the reducer through a script, the way the component would. */
function reduce(...actions: CopilotAction[]): CopilotState {
  return actions.reduce(copilotReducer, INITIAL_COPILOT_STATE);
}

const encoder = new TextEncoder();

/** A response whose body arrives in exactly the chunks given. */
function streamed(chunks: (string | Uint8Array)[], contentType = "text/event-stream"): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(typeof chunk === "string" ? encoder.encode(chunk) : chunk);
      }
      controller.close();
    },
  });
  return new Response(body, { headers: { "content-type": contentType } });
}

function frame(event: unknown, terminator = "\n\n"): string {
  return `data: ${JSON.stringify(event)}${terminator}`;
}

async function collect(response: Response): Promise<CopilotStreamEvent[]> {
  const events: CopilotStreamEvent[] = [];
  for await (const event of readCopilotStream(response)) events.push(event);
  return events;
}

const START = { type: "start", conversationId: "conv-1", messageId: "m1", providerId: "p", model: "m" };
const FINISH = { type: "finish", finishReason: "stop", usage: {}, costUsd: 0, latencyMs: 1 };

/* ------------------------------------------------------------------ rendering -- */

describe("Copilot screen rendering", () => {
  const html = renderToStaticMarkup(createElement(CopilotScreen));

  it("names itself and says it is read-only", () => {
    expect(html).toContain("Copilot");
    expect(html).toContain("Read-only preview");
    expect(html).toContain("reads no records and changes no data");
  });

  it("explains what the empty state can and cannot do", () => {
    expect(html).toContain("ask general operational questions");
    expect(html).toContain("try the streaming experience end to end");
    expect(html).toContain("CRM, projects, invoices, calls");
    expect(html).toContain("does not remember conversations between");
  });

  it("labels the composer and caps it at the endpoint's limit", () => {
    expect(html).toContain("Message Copilot");
    expect(html).toMatch(new RegExp(`maxlength="${MAX_MESSAGE_LENGTH}"`, "i"));
    expect(html).toContain("Enter sends · Shift+Enter adds a line");
    // The label's `for` has to reach the textarea's generated id.
    const forId = /<label for="([^"]+)"/.exec(html)?.[1];
    expect(forId).toBeTruthy();
    expect(html).toContain(`<textarea id="${forId}"`);
  });

  it("offers no way to send an empty message and nothing to stop or clear yet", () => {
    expect(html).toMatch(/<button type="submit" disabled=""/);
    expect(html).not.toContain(">Stop<");
    expect(html).not.toContain(">Clear conversation<");
  });

  it("shows no provider, model, token or cost detail", () => {
    for (const leak of ["gpt-", "openai", "sk-", "token", "usd", "latency"]) {
      expect(html.toLowerCase(), leak).not.toContain(leak);
    }
  });

  it("renders both roles with labels and preserved whitespace", () => {
    const state = reduce(
      { type: "submit", text: "line one\nline two" },
      { type: "start", conversationId: "conv-1" },
      { type: "delta", text: "part one " },
      { type: "delta", text: "part two" },
      { type: "finish" },
    );
    const transcript = renderToStaticMarkup(
      createElement(CopilotTranscript, { state, errorId: "err" }),
    );
    expect(transcript).toContain(">You</p>");
    expect(transcript).toContain(">Copilot</p>");
    expect(transcript).toContain("line one\nline two");
    expect(transcript).toContain("part one part two");
    expect(transcript).toContain("whitespace-pre-wrap");
  });

  it("renders assistant text as text, never as markup", () => {
    const state = reduce(
      { type: "submit", text: "hi" },
      { type: "delta", text: "<script>alert(1)</script>" },
      { type: "finish" },
    );
    const transcript = renderToStaticMarkup(
      createElement(CopilotTranscript, { state, errorId: "err" }),
    );
    expect(transcript).not.toContain("<script>");
    expect(transcript).toContain("&lt;script&gt;");
  });

  it("shows a stopped response as stopped, not as a failure", () => {
    const state = reduce(
      { type: "submit", text: "hi" },
      { type: "delta", text: "partial" },
      { type: "cancel" },
    );
    const transcript = renderToStaticMarkup(
      createElement(CopilotTranscript, { state, errorId: "err" }),
    );
    expect(transcript).toContain("You stopped this response.");
    expect(transcript).toContain("partial");
    expect(transcript).not.toContain('role="alert"');
  });
});

/* ----------------------------------------------------------------- submission -- */

describe("Copilot submission", () => {
  it("refuses an empty or whitespace-only draft", () => {
    expect(canSend(INITIAL_COPILOT_STATE, "")).toBe(false);
    expect(canSend(INITIAL_COPILOT_STATE, "   \n ")).toBe(false);
    expect(canSend(INITIAL_COPILOT_STATE, "hello")).toBe(true);
  });

  it("refuses a draft past the endpoint's limit", () => {
    expect(canSend(INITIAL_COPILOT_STATE, "x".repeat(MAX_MESSAGE_LENGTH))).toBe(true);
    expect(canSend(INITIAL_COPILOT_STATE, "x".repeat(MAX_MESSAGE_LENGTH + 1))).toBe(false);
  });

  it("uses the same limit the endpoint enforces", () => {
    expect(MAX_MESSAGE_LENGTH).toBe(SERVER_MAX_MESSAGE_LENGTH);
    expect(MAX_MESSAGE_LENGTH).toBe(4_000);
  });

  it("allows no second request while one is open", () => {
    const busy = reduce({ type: "submit", text: "first" });
    expect(isBusy(busy)).toBe(true);
    expect(canSend(busy, "second")).toBe(false);
    // Even if something got past the guard, the reducer will not open two turns.
    expect(copilotReducer(busy, { type: "submit", text: "second" })).toBe(busy);
  });

  it("sends on Enter and adds a line on Shift+Enter", () => {
    expect(shouldSendOnKey({ key: "Enter", shiftKey: false })).toBe(true);
    expect(shouldSendOnKey({ key: "Enter", shiftKey: true })).toBe(false);
    expect(shouldSendOnKey({ key: "a", shiftKey: false })).toBe(false);
    // Enter that is accepting an IME candidate is not a send.
    expect(shouldSendOnKey({ key: "Enter", shiftKey: false, isComposing: true })).toBe(false);
  });

  it("puts the user's message on screen before any response arrives", () => {
    const state = reduce({ type: "submit", text: "hello" });
    expect(state.status).toBe("submitting");
    expect(state.messages.map((m) => [m.role, m.text])).toEqual([
      ["user", "hello"],
      ["assistant", ""],
    ]);
  });
});

/* ------------------------------------------------------------------ streaming -- */

describe("Copilot streaming", () => {
  it("reads a whole turn frame by frame", async () => {
    const events = await collect(
      streamed([
        frame(START),
        frame({ type: "text-delta", text: "Hello" }),
        frame({ type: "text-delta", text: " there" }),
        frame(FINISH),
        "data: [DONE]\n\n",
      ]),
    );
    expect(events).toEqual([
      { type: "start", conversationId: "conv-1" },
      { type: "delta", text: "Hello" },
      { type: "delta", text: " there" },
      { type: "finish" },
    ]);
  });

  it("survives a frame split across chunks", async () => {
    const whole = frame({ type: "text-delta", text: "split" });
    const events = await collect(
      streamed([whole.slice(0, 9), whole.slice(9, 20), whole.slice(20), "data: [DONE]\n\n"]),
    );
    expect(events).toEqual([{ type: "delta", text: "split" }]);
  });

  it("survives a multi-byte character split across chunks", async () => {
    const bytes = encoder.encode(frame({ type: "text-delta", text: "café ☕" }));
    const cut = bytes.length - 6;
    const events = await collect(streamed([bytes.slice(0, cut), bytes.slice(cut)]));
    expect(events).toEqual([{ type: "delta", text: "café ☕" }]);
  });

  it("reads CRLF frames", async () => {
    const events = await collect(
      streamed([frame({ type: "text-delta", text: "crlf" }, "\r\n\r\n"), "data: [DONE]\r\n\r\n"]),
    );
    expect(events).toEqual([{ type: "delta", text: "crlf" }]);
  });

  it("stops at [DONE] and never treats it as content", async () => {
    const events = await collect(
      streamed(["data: [DONE]\n\n", frame({ type: "text-delta", text: "after" })]),
    );
    expect(events).toEqual([]);
  });

  it("ignores protocol events this slice does not render", async () => {
    const events = await collect(
      streamed([
        frame({ type: "step", step: 1, label: "thinking" }),
        frame({ type: "reasoning-delta", text: "internal" }),
        frame({ type: "tool-call", toolCallId: "t", toolName: "x", args: {} }),
        frame({ type: "text-delta", text: "visible" }),
        frame(FINISH),
      ]),
    );
    expect(events).toEqual([{ type: "delta", text: "visible" }, { type: "finish" }]);
  });

  it("skips a frame it cannot parse rather than ending the turn", async () => {
    const events = await collect(
      streamed(["data: { not json\n\n", frame({ type: "text-delta", text: "still here" })]),
    );
    expect(events).toEqual([{ type: "delta", text: "still here" }]);
  });

  it("reports an in-stream error event and reads no further", async () => {
    const events = await collect(
      streamed([
        frame({ type: "text-delta", text: "partial" }),
        frame({ type: "error", code: "ai/provider", message: "boom", retryable: true }),
        frame({ type: "text-delta", text: "unreachable" }),
      ]),
    );
    expect(events).toEqual([
      { type: "delta", text: "partial" },
      { type: "error", code: "ai/provider" },
    ]);
  });

  it("turns a JSON failure sent before the stream into one error", async () => {
    const response = new Response(
      JSON.stringify({ ok: false, error: { code: "ai/rate_limit", message: "Too many." } }),
      { status: 429, headers: { "content-type": "application/json" } },
    );
    expect(await collect(response)).toEqual([{ type: "error", code: "ai/rate_limit" }]);
  });

  it("falls back to a generic code when the failure body says nothing usable", async () => {
    const response = new Response("<html>gateway</html>", {
      status: 502,
      headers: { "content-type": "text/html" },
    });
    expect(await collect(response)).toEqual([{ type: "error", code: "ai/provider" }]);
  });
});

/* --------------------------------------------------------------- cancellation -- */

describe("Copilot cancellation", () => {
  it("keeps what already arrived and reports no failure", () => {
    const state = reduce(
      { type: "submit", text: "hi" },
      { type: "start", conversationId: "conv-1" },
      { type: "delta", text: "half a sentence" },
      { type: "cancel" },
    );
    expect(state.status).toBe("cancelled");
    expect(state.error).toBeNull();
    expect(state.messages.at(-1)?.text).toBe("half a sentence");
  });

  it("leaves no empty bubble when nothing had arrived yet", () => {
    const state = reduce({ type: "submit", text: "hi" }, { type: "cancel" });
    expect(state.messages.map((m) => m.role)).toEqual(["user"]);
    expect(state.streamingId).toBeNull();
  });

  it("lets the next message be sent afterwards", () => {
    const state = reduce({ type: "submit", text: "hi" }, { type: "cancel" });
    expect(canSend(state, "again")).toBe(true);
    const next = copilotReducer(state, { type: "submit", text: "again" });
    expect(next.status).toBe("submitting");
    // Ids stay unique across turns, so React never reuses a stopped bubble's key.
    expect(new Set(next.messages.map((m) => m.id)).size).toBe(next.messages.length);
  });

  it("builds a controller per send and never reuses an aborted one", () => {
    expect(viewSrc).toContain("const controller = new AbortController();");
    expect(viewSrc).toContain("abortRef.current = controller;");
    expect(viewSrc).toContain("signal: controller.signal");
    // Stop drops the controller, so the next send cannot pick it back up.
    expect(viewSrc).toMatch(/abortRef\.current\?\.abort\(\);\s*\n\s*abortRef\.current = null;/);
  });
});

/* ---------------------------------------------------------------- conversation -- */

describe("Copilot conversation", () => {
  it("sends only a message on the first turn", () => {
    expect(copilotRequestBody("hello", null)).toEqual({ message: "hello" });
  });

  it("sends the server's conversation id on later turns", () => {
    const state = reduce(
      { type: "submit", text: "hi" },
      { type: "start", conversationId: "conv-42" },
      { type: "finish" },
    );
    expect(state.conversationId).toBe("conv-42");
    expect(copilotRequestBody("next", state.conversationId)).toEqual({
      message: "next",
      conversationId: "conv-42",
    });
  });

  it("invents no conversation id of its own", () => {
    expect(INITIAL_COPILOT_STATE.conversationId).toBeNull();
    expect(reduce({ type: "submit", text: "hi" }).conversationId).toBeNull();
    for (const src of [viewSrc, stateSrc, streamSrc]) {
      expect(src).not.toMatch(/randomUUID|Math\.random/);
    }
  });

  it("forgets the conversation on an explicit clear", () => {
    const state = reduce(
      { type: "submit", text: "hi" },
      { type: "start", conversationId: "conv-1" },
      { type: "delta", text: "answer" },
      { type: "finish" },
      { type: "clear" },
    );
    expect(state.messages).toEqual([]);
    expect(state.conversationId).toBeNull();
    expect(state.status).toBe("idle");
    // The counter survives, so a cleared id can never be handed out twice.
    expect(state.turn).toBe(1);
    expect(copilotReducer(state, { type: "submit", text: "new" }).messages[0]?.id).toBe("u2");
  });

  it("claims nothing about deleting server data", () => {
    expect(viewSrc).toContain("Clear conversation");
    expect(viewSrc).not.toMatch(/\bdelete[ds]?\b.*(server|history|record)/i);
  });

  it("keeps the transcript in memory only", () => {
    for (const src of [viewSrc, stateSrc, streamSrc]) {
      expect(src).not.toMatch(/localStorage|sessionStorage|document\.cookie|indexedDB/);
    }
  });
});

/* ------------------------------------------------------------------- security -- */

describe("Copilot security boundaries", () => {
  it("sends nothing but the message and an optional conversation id", () => {
    const keys = Object.keys(copilotRequestBody("hi", "conv-1"));
    expect(keys.sort()).toEqual(["conversationId", "message"]);
    for (const forbidden of [
      "userId",
      "workspaceId",
      "providerId",
      "model",
      "tools",
      "permissions",
      "systemPrompt",
      "developerPrompt",
      "providerOptions",
      "apiKey",
      "history",
      "context",
    ]) {
      expect(stateSrc, forbidden).not.toMatch(new RegExp(`${forbidden}\\s*:`));
    }
  });

  it("posts to the endpoint and nowhere else", () => {
    const urls = viewSrc.match(/fetch\(\s*"([^"]+)"/g) ?? [];
    expect(urls).toEqual(['fetch("/api/ai/copilot"']);
  });

  it("reads no session, workspace or Supabase value on the client", () => {
    for (const src of [viewSrc, pageSrc, streamSrc, stateSrc]) {
      expect(src).not.toMatch(/from ["'][^"']*supabase/);
      expect(src).not.toMatch(/process\.env/);
    }
    // The page hands the client component no props at all.
    expect(pageSrc).toContain("<CopilotScreen />");
  });

  it("imports no server AI barrel into the client bundle", () => {
    for (const src of [viewSrc, streamSrc, stateSrc]) {
      expect(src).not.toMatch(/from ["']@\/lib\/ai["']/);
      expect(src).not.toMatch(/from ["'][^"']*lib\/ai\/(server|providers|index)/);
    }
    // Only the two streaming modules, which import nothing but each other.
    expect(streamSrc).toContain('from "@/lib/ai/streaming/sse"');
  });

  it("shows safe copy for every failure and never a raw code", () => {
    const codes = [
      "unauthorized",
      "forbidden",
      "validation",
      "ai/rate_limit",
      "ai/configuration",
      "unavailable",
      "ai/timeout",
      "ai/cancelled",
      "ai/provider",
    ];
    for (const code of codes) {
      const copy = errorMessage(code);
      expect(copy, code).toMatch(/^[A-Z].*[.]$/);
      // A sentence, never an identifier: no namespaced code, no slug, no trace.
      expect(copy, code).not.toMatch(/[a-z]+\/[a-z_]+|_|\bat \/|\.ts:|Error:|sk-/);
    }
    expect(errorMessage("something/unheard-of")).toBe("Something went wrong. Try again.");
  });

  it("renders an error as safe copy, not as an object or a stack", () => {
    const state = copilotReducer(reduce({ type: "submit", text: "hi" }), {
      type: "error",
      code: "ai/rate_limit",
    });
    expect(state.error).toBe(errorMessage("ai/rate_limit"));
    const transcript = renderToStaticMarkup(
      createElement(CopilotTranscript, { state, errorId: "err" }),
    );
    expect(transcript).toContain('role="alert"');
    expect(transcript).toContain("Wait a moment and try again.");
    expect(transcript).not.toContain("ai/rate_limit");
  });

  it("writes no assistant output as raw HTML", () => {
    expect(viewSrc).not.toContain("dangerouslySetInnerHTML");
  });
});

/* -------------------------------------------------------------- accessibility -- */

describe("Copilot accessibility", () => {
  const html = renderToStaticMarkup(createElement(CopilotScreen));

  it("names each region once, and never repeats the route's own heading", () => {
    // The shell renders <h1>Copilot</h1> for this route. The screen used to repeat
    // it in an <h2> directly underneath, which read as two headings for one thing;
    // the only <h2> now names the panel that needed one.
    expect(html).toMatch(/<h2[^>]*>Conversations<\/h2>/);
    expect(html.match(/<h2/g)).toHaveLength(1);
    expect(html).not.toMatch(/<h[1-6][^>]*>Copilot<\/h[1-6]>/);
    expect(html).toContain('aria-label="Conversation"');
    expect(html).toContain('aria-label="Conversation history"');
  });

  it("announces state changes politely, not every token", () => {
    expect(html).toContain('role="status" aria-live="polite"');
    expect(viewSrc).toContain('<ol aria-live="off"');
    const state = reduce({ type: "submit", text: "hi" }, { type: "start", conversationId: "c" });
    expect(statusAnnouncement(state)).toBe("The assistant is responding.");
    expect(statusAnnouncement(INITIAL_COPILOT_STATE)).toBe("");
    expect(statusAnnouncement(copilotReducer(state, { type: "cancel" }))).toBe("Response stopped.");
  });

  it("moves focus on no streamed event", () => {
    expect(viewSrc).not.toMatch(/\.focus\(\)|scrollIntoView/);
  });

  it("associates an error with the composer", () => {
    expect(viewSrc).toContain("aria-describedby={`${state.error ? `${errorId} ` : \"\"}${countId}`}");
  });

  it("keeps every control keyboard-operable with a visible focus ring", () => {
    // No div-as-button anywhere, and the shared tokens carry focus-visible.
    expect(viewSrc).not.toMatch(/<div[^>]*onClick/);
    expect(html).toMatch(/<button type="submit"/);
    expect(html).toContain("focus-visible:outline-cc-green");
  });

  it("relies on more than colour for the error and the stopped state", () => {
    const errored = copilotReducer(reduce({ type: "submit", text: "hi" }), {
      type: "error",
      code: "ai/timeout",
    });
    expect(renderToStaticMarkup(createElement(CopilotTranscript, { state: errored, errorId: "e" })))
      .toContain("The assistant took too long to respond.");
  });
});
