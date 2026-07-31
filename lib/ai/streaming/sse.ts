// Server-Sent Events, in both directions.
//
// Outbound: turning an `AIStreamEvent` iterable into a byte stream a browser can
// consume. Inbound: parsing a provider's SSE response back into frames. Both live
// here because they are the same wire format, and one shared parser is one place
// for the framing bugs to be found.
//
// The transport is intentionally the thinnest possible layer over the event
// union. A future WebSocket carries the same JSON payloads; only the framing
// changes, and only this file would.

import type { AIStreamEvent } from "./events";
import { isTerminalEvent } from "./events";

export const SSE_HEADERS: Readonly<Record<string, string>> = {
  "Content-Type": "text/event-stream; charset=utf-8",
  // Streaming through a proxy that buffers defeats the entire point, and both of
  // these are needed to stop that happening.
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

/** The frame that closes a stream. Clients stop reading rather than reconnecting. */
export const SSE_DONE = "[DONE]";

/**
 * Encodes one event.
 *
 * `event:` carries the discriminant so a client can attach typed listeners, and
 * `data:` carries the whole event anyway so a single `onmessage` handler also
 * works. Newlines inside the JSON are impossible — `JSON.stringify` escapes
 * them — which is what keeps the framing safe without an escaping pass.
 */
export function encodeSSE(event: AIStreamEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

export function encodeSSEDone(): string {
  return `event: done\ndata: ${SSE_DONE}\n\n`;
}

/**
 * Bridges an event iterable to a `ReadableStream` of bytes.
 *
 * Errors are converted into a terminal `error` frame rather than tearing the
 * stream down, so a client always receives a reason instead of a truncated
 * response. Cancellation by the consumer propagates back into the iterable via
 * its `return()` method, which is what stops the provider call underneath.
 */
export function toSSEStream(
  events: AsyncIterable<AIStreamEvent>,
  onError?: (error: unknown) => AIStreamEvent,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const iterator = events[Symbol.asyncIterator]();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await iterator.next();
        if (done) {
          controller.enqueue(encoder.encode(encodeSSEDone()));
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(encodeSSE(value)));
        if (isTerminalEvent(value)) {
          controller.enqueue(encoder.encode(encodeSSEDone()));
          controller.close();
        }
      } catch (error) {
        const event = onError?.(error);
        if (event) controller.enqueue(encoder.encode(encodeSSE(event)));
        controller.enqueue(encoder.encode(encodeSSEDone()));
        controller.close();
      }
    },
    async cancel() {
      await iterator.return?.();
    },
  });
}

export type SSEFrame = { event?: string; data: string; id?: string };

/**
 * Parses an SSE byte stream into frames.
 *
 * Written against raw chunks rather than lines because network chunks split
 * anywhere — mid-field, mid-UTF-8 sequence — and a line-based parser that assumes
 * otherwise drops tokens under load. `TextDecoder` in streaming mode holds
 * partial code points; the `buffer` here holds partial frames.
 */
export async function* parseSSE(
  stream: AsyncIterable<Uint8Array>,
): AsyncGenerator<SSEFrame, void, undefined> {
  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of stream) {
    buffer += decoder.decode(chunk, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const frame = parseFrame(buffer.slice(0, boundary));
      if (frame) yield frame;
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
    }
  }

  buffer += decoder.decode();
  const trailing = parseFrame(buffer);
  if (trailing) yield trailing;
}

function parseFrame(raw: string): SSEFrame | undefined {
  const lines = raw.split("\n");
  let event: string | undefined;
  let id: string | undefined;
  const data: string[] = [];

  for (const line of lines) {
    // Comment lines, which is how keep-alives arrive.
    if (line === "" || line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    // One optional space after the colon is part of the format, not the value.
    const value = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");

    if (field === "event") event = value;
    else if (field === "data") data.push(value);
    else if (field === "id") id = value;
  }

  if (data.length === 0) return undefined;
  // Multiple `data:` lines in one frame join with newlines, per the spec.
  return { data: data.join("\n"), ...(event ? { event } : {}), ...(id ? { id } : {}) };
}

/** Adapts a `fetch` body to the async iterable `parseSSE` expects. */
export async function* iterateStream(body: ReadableStream<Uint8Array>): AsyncGenerator<Uint8Array> {
  const reader = body.getReader();
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
      if (value) yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
