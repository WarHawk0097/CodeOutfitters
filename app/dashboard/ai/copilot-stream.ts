// Turns one `POST /api/ai/copilot` response into the handful of events this
// screen actually renders.
//
// The endpoint answers in one of two shapes: a JSON error envelope when the
// request never reached the assistant, or an SSE stream once it did. Both are
// handled here so the component only ever sees start / delta / finish / error.
//
// Imports reach `lib/ai/streaming/sse` directly and never `lib/ai` — the barrel
// pulls in providers and server configuration, none of which belongs in a browser
// bundle. `sse.ts` and its one runtime dependency, `events.ts`, import nothing but
// each other, so they are safe to ship to the client.

import type { AIStreamEvent } from "@/lib/ai/streaming/events";
import { SSE_DONE, iterateStream, parseSSE } from "@/lib/ai/streaming/sse";

export type CopilotStreamEvent =
  | { type: "start"; conversationId: string }
  | { type: "delta"; text: string }
  | { type: "finish" }
  | { type: "error"; code: string };

/** The route's failure envelope, as much of it as the client is allowed to see. */
type ErrorEnvelope = { ok?: boolean; error?: { code?: unknown } };

const GENERIC_CODE = "ai/provider";

/** Read the code out of a pre-stream JSON failure, without trusting its shape. */
async function envelopeCode(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorEnvelope;
    const code = body.error?.code;
    return typeof code === "string" && code.length > 0 ? code : GENERIC_CODE;
  } catch {
    // A non-JSON body from an error status tells us nothing worth showing.
    return GENERIC_CODE;
  }
}

/**
 * Yields render events as they arrive.
 *
 * Nothing is buffered: each frame is dispatched as it is parsed, which is the
 * whole point of the endpoint streaming in the first place.
 */
export async function* readCopilotStream(response: Response): AsyncGenerator<CopilotStreamEvent> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok || !contentType.includes("text/event-stream")) {
    yield { type: "error", code: await envelopeCode(response) };
    return;
  }

  if (!response.body) {
    yield { type: "error", code: GENERIC_CODE };
    return;
  }

  for await (const frame of parseSSE(iterateStream(response.body))) {
    if (frame.data === SSE_DONE) return;

    let event: AIStreamEvent;
    try {
      event = JSON.parse(frame.data) as AIStreamEvent;
    } catch {
      // A frame we cannot read is not a reason to end a working response.
      continue;
    }

    switch (event.type) {
      case "start":
        yield { type: "start", conversationId: event.conversationId };
        break;
      case "text-delta":
        yield { type: "delta", text: event.text };
        break;
      case "finish":
        // Usage, cost, latency, provider and model all arrive here and all stay
        // here: this UI shows none of them.
        yield { type: "finish" };
        return;
      case "error":
        yield { type: "error", code: event.code };
        return;
      default:
        // Reasoning, tool calls, tool results and step markers are part of the
        // protocol but have nothing to show in a read-only slice.
        break;
    }
  }
}
