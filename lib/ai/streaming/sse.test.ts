// Streaming.
//
// The parser is written against raw chunks rather than lines, so the tests split
// input in the places a real network splits it: mid-frame, mid-field and in the
// middle of a multi-byte character. A round trip through both halves pins the
// invariant that matters — what a client reconstructs is what the stack emitted.

import { describe, expect, it } from "vitest";
import {
  SSE_DONE,
  SSE_HEADERS,
  encodeSSE,
  encodeSSEDone,
  iterateStream,
  parseSSE,
  toSSEStream,
  type SSEFrame,
} from "./sse";
import { collectStream, isTerminalEvent, type AIStreamEvent } from "./events";

const FINISH: AIStreamEvent = {
  type: "finish",
  finishReason: "stop",
  usage: { inputTokens: 1, outputTokens: 2 },
  costUsd: 0,
  latencyMs: 5,
};

async function* of(...events: AIStreamEvent[]): AsyncGenerator<AIStreamEvent> {
  for (const event of events) yield event;
}

async function* chunks(...parts: Uint8Array[]): AsyncGenerator<Uint8Array> {
  for (const part of parts) yield part;
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  let text = "";
  const decoder = new TextDecoder();
  for await (const chunk of iterateStream(stream)) text += decoder.decode(chunk, { stream: true });
  return text + decoder.decode();
}

describe("headers", () => {
  it("disables every layer of buffering between here and the browser", () => {
    expect(SSE_HEADERS["Content-Type"]).toBe("text/event-stream; charset=utf-8");
    expect(SSE_HEADERS["Cache-Control"]).toContain("no-cache");
    expect(SSE_HEADERS["X-Accel-Buffering"]).toBe("no");
  });
});

describe("encodeSSE", () => {
  it("writes the discriminant as the event name and the whole event as data", () => {
    expect(encodeSSE({ type: "text-delta", text: "hi" })).toBe(
      'event: text-delta\ndata: {"type":"text-delta","text":"hi"}\n\n',
    );
  });

  it("cannot break framing with a newline in the payload", () => {
    const encoded = encodeSSE({ type: "text-delta", text: "line one\nline two" });

    expect(encoded.split("\n\n")).toHaveLength(2);
    expect(encoded).toContain("line one\\nline two");
  });

  it("terminates with a sentinel a client can stop on", () => {
    expect(encodeSSEDone()).toBe(`event: done\ndata: ${SSE_DONE}\n\n`);
  });
});

describe("toSSEStream", () => {
  it("emits every event and closes with the sentinel", async () => {
    const text = await readAll(toSSEStream(of({ type: "text-delta", text: "hi" }, FINISH)));

    expect(text).toContain("event: text-delta");
    expect(text).toContain("event: finish");
    expect(text.endsWith(`event: done\ndata: ${SSE_DONE}\n\n`)).toBe(true);
  });

  it("stops at a terminal event instead of trusting the producer to end", async () => {
    const text = await readAll(
      toSSEStream(of(FINISH, { type: "text-delta", text: "after the end" })),
    );

    expect(text).not.toContain("after the end");
  });

  it("turns a thrown failure into a terminal frame rather than a truncated body", async () => {
    async function* explodes(): AsyncGenerator<AIStreamEvent> {
      yield { type: "text-delta", text: "partial" };
      throw new Error("provider socket died: token=abc123");
    }

    const text = await readAll(
      toSSEStream(explodes(), () => ({
        type: "error",
        code: "ai/provider",
        message: "The assistant's model provider failed to respond.",
        retryable: true,
      })),
    );

    expect(text).toContain("event: error");
    expect(text).not.toContain("abc123");
    expect(text.endsWith(`event: done\ndata: ${SSE_DONE}\n\n`)).toBe(true);
  });

  it("propagates consumer cancellation back into the producer", async () => {
    let returned = false;
    async function* cancellable(): AsyncGenerator<AIStreamEvent> {
      try {
        for (;;) yield { type: "text-delta", text: "x" };
      } finally {
        returned = true;
      }
    }

    const stream = toSSEStream(cancellable());
    const reader = stream.getReader();
    await reader.read();
    await reader.cancel();

    expect(returned).toBe(true);
  });
});

describe("parseSSE", () => {
  const encoder = new TextEncoder();

  it("reassembles a frame split across chunks", async () => {
    const raw = encoder.encode('event: text-delta\ndata: {"type":"text-delta","text":"hi"}\n\n');
    const frames: SSEFrame[] = [];
    for await (const frame of parseSSE(chunks(raw.slice(0, 20), raw.slice(20)))) frames.push(frame);

    expect(frames).toEqual([
      { event: "text-delta", data: '{"type":"text-delta","text":"hi"}' },
    ]);
  });

  it("holds a multi-byte character split across chunks", async () => {
    const raw = encoder.encode('data: {"text":"héllo"}\n\n');
    const split = raw.indexOf(0xc3) + 1; // Between the two bytes of "é".
    const frames: SSEFrame[] = [];
    for await (const frame of parseSSE(chunks(raw.slice(0, split), raw.slice(split)))) {
      frames.push(frame);
    }

    expect(frames[0]?.data).toBe('{"text":"héllo"}');
  });

  it("ignores keep-alive comments", async () => {
    const frames: SSEFrame[] = [];
    for await (const frame of parseSSE(chunks(encoder.encode(": ping\n\ndata: one\n\n")))) {
      frames.push(frame);
    }

    expect(frames).toEqual([{ data: "one" }]);
  });

  it("joins multiple data lines per the specification", async () => {
    const frames: SSEFrame[] = [];
    for await (const frame of parseSSE(chunks(encoder.encode("data: one\ndata: two\n\n")))) {
      frames.push(frame);
    }

    expect(frames[0]?.data).toBe("one\ntwo");
  });

  it("yields a trailing frame that was never terminated", async () => {
    const frames: SSEFrame[] = [];
    for await (const frame of parseSSE(chunks(encoder.encode("data: unterminated")))) {
      frames.push(frame);
    }

    expect(frames).toEqual([{ data: "unterminated" }]);
  });

  it("keeps the id field and drops a field it does not know", async () => {
    const frames: SSEFrame[] = [];
    for await (const frame of parseSSE(chunks(encoder.encode("id: 7\nretry: 100\ndata: one\n\n")))) {
      frames.push(frame);
    }

    expect(frames).toEqual([{ id: "7", data: "one" }]);
  });
});

describe("parseSSE line endings", () => {
  const encoder = new TextEncoder();

  async function framesOf(...parts: string[]): Promise<SSEFrame[]> {
    const frames: SSEFrame[] = [];
    for await (const frame of parseSSE(chunks(...parts.map((part) => encoder.encode(part))))) {
      frames.push(frame);
    }
    return frames;
  }

  // The specification allows LF, CRLF and bare CR, and proxies rewrite between
  // them. A parser that only splits on "\n\n" reads a CRLF stream as one frame
  // whose every field name is prefixed with a stray CR — which is to say, no
  // frames at all.
  it("parses LF frames", async () => {
    await expect(framesOf("data: one\n\ndata: two\n\n")).resolves.toEqual([
      { data: "one" },
      { data: "two" },
    ]);
  });

  it("parses CRLF frames", async () => {
    await expect(framesOf("data: one\r\n\r\ndata: two\r\n\r\n")).resolves.toEqual([
      { data: "one" },
      { data: "two" },
    ]);
  });

  it("parses bare CR frames", async () => {
    await expect(framesOf("data: one\r\rdata: two\r\r")).resolves.toEqual([
      { data: "one" },
      { data: "two" },
    ]);
  });

  it("parses a stream that mixes line endings", async () => {
    await expect(framesOf("event: a\r\ndata: one\n\r\ndata: two\r\r")).resolves.toEqual([
      { event: "a", data: "one" },
      { data: "two" },
    ]);
  });

  it("handles a CRLF boundary split between the CR and the LF", async () => {
    await expect(framesOf("data: one\r\n\r", "\ndata: two\r\n\r\n")).resolves.toEqual([
      { data: "one" },
      { data: "two" },
    ]);
  });

  it("handles a chunk that ends on a CR belonging to a field's own line ending", async () => {
    await expect(framesOf("event: a\r", "\ndata: one\r\n\r\n")).resolves.toEqual([
      { event: "a", data: "one" },
    ]);
  });

  it("yields a trailing CRLF frame that was never terminated", async () => {
    await expect(framesOf("data: unterminated\r\n")).resolves.toEqual([{ data: "unterminated" }]);
  });

  it("yields a trailing frame whose stream ended on a bare CR", async () => {
    await expect(framesOf("data: unterminated\r")).resolves.toEqual([{ data: "unterminated" }]);
  });

  it("holds a multi-byte character split across chunks in a CRLF stream", async () => {
    const raw = encoder.encode('data: {"text":"héllo"}\r\n\r\n');
    const split = raw.indexOf(0xc3) + 1;
    const frames: SSEFrame[] = [];
    for await (const frame of parseSSE(chunks(raw.slice(0, split), raw.slice(split)))) {
      frames.push(frame);
    }

    expect(frames).toEqual([{ data: '{"text":"héllo"}' }]);
  });

  it("emits every frame when several arrive in one chunk", async () => {
    await expect(
      framesOf("data: one\r\n\r\ndata: two\r\n\r\ndata: three\r\n\r\n"),
    ).resolves.toEqual([{ data: "one" }, { data: "two" }, { data: "three" }]);
  });

  it("ignores CRLF keep-alive comments", async () => {
    await expect(framesOf(": ping\r\n\r\ndata: one\r\n\r\n")).resolves.toEqual([{ data: "one" }]);
  });

  it("joins multiple CRLF data lines without leaking the carriage returns", async () => {
    const [frame] = await framesOf("data: one\r\ndata: two\r\n\r\n");

    expect(frame?.data).toBe("one\ntwo");
    expect(frame?.data).not.toContain("\r");
  });
});

describe("round trip", () => {
  it("reconstructs exactly what was sent", async () => {
    const sent: AIStreamEvent[] = [
      { type: "start", conversationId: "c1", messageId: "m1", providerId: "mock", model: "mock-model" },
      { type: "text-delta", text: "héllo " },
      { type: "text-delta", text: "world" },
      { type: "tool-call", toolCall: { id: "call_1", name: "search_crm", arguments: '{"q":"a"}' } },
      FINISH,
    ];

    const received: AIStreamEvent[] = [];
    for await (const frame of parseSSE(iterateStream(toSSEStream(of(...sent))))) {
      if (frame.data === SSE_DONE) continue;
      received.push(JSON.parse(frame.data) as AIStreamEvent);
    }

    expect(received).toEqual(sent);
  });
});

describe("collectStream", () => {
  it("reduces a stream to the result a non-streaming call would have returned", async () => {
    const collected = await collectStream(
      of(
        { type: "start", conversationId: "c1", messageId: "m1", providerId: "mock", model: "mock-model" },
        { type: "reasoning-delta", text: "thinking" },
        { type: "text-delta", text: "he" },
        { type: "text-delta", text: "llo" },
        { type: "step", step: 1, label: "respond" },
        FINISH,
      ),
    );

    expect(collected).toEqual({
      text: "hello",
      reasoning: "thinking",
      toolCalls: [],
      finishReason: "stop",
      usage: { inputTokens: 1, outputTokens: 2 },
      costUsd: 0,
    });
  });

  it("reports a failed stream as an error, not as a short answer", async () => {
    const collected = await collectStream(
      of(
        { type: "text-delta", text: "partial" },
        { type: "error", code: "ai/rate_limit", message: "Rate limited.", retryable: true },
      ),
    );

    expect(collected.finishReason).toBe("error");
    expect(collected.error?.code).toBe("ai/rate_limit");
    expect(collected.text).toBe("partial");
  });
});

describe("isTerminalEvent", () => {
  it("is true for exactly the two events that end a stream", () => {
    expect(isTerminalEvent(FINISH)).toBe(true);
    expect(isTerminalEvent({ type: "error", code: "ai/timeout", message: "x", retryable: true })).toBe(
      true,
    );
    expect(isTerminalEvent({ type: "text-delta", text: "x" })).toBe(false);
  });
});
