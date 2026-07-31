import { randomUUID } from "node:crypto";
import { SSE_HEADERS, toSSEStream, type AIStreamEvent } from "@/lib/ai";
import { readJsonBody } from "@/lib/inquiry/server/inquiry-request-context";
import { createCopilotOrchestrator } from "@/lib/ai/server/create-copilot-orchestrator";
import { CopilotRequestSchema, fieldErrors } from "@/lib/ai/server/copilot-request";
import { resolveCopilotSubject } from "@/lib/ai/server/copilot-subject";

// The authenticated Copilot turn.
//
// A thin handler, in the shape the other route handlers here already take:
// authenticate, gate the body, validate, hand off, map. Everything the assistant
// actually does lives behind `lib/ai/`, and every decision that could widen what
// it does — provider, model, prompts, tools, identity, workspace — is made
// server-side and is not addressable from the body.
//
// Failures split at the moment the response starts. Before the first event there
// is still a status code to return, so those use the JSON error envelope the
// inquiry route established. After it, the status is already sent and a failure
// can only be a terminal SSE `error` frame.
//
// Node runtime: the Supabase SSR client and `node:crypto` both require it.
export const runtime = "nodejs";

type ErrorBody = {
  ok: false;
  error: { code: string; message: string; fields?: Record<string, string> };
};

/** Pre-stream status for a turn that failed before producing anything. */
const STATUS_BY_CODE: Readonly<Record<string, number>> = {
  "ai/rate_limit": 429,
  "ai/configuration": 503,
  "ai/permission": 403,
  "ai/validation": 400,
  "ai/unsupported": 400,
  "ai/timeout": 504,
  // Both "no such conversation" and "not yours" arrive here, carrying the same
  // text, so the endpoint cannot be used to discover which ids are real.
  "ai/cancelled": 404,
};

const NOT_FOUND = "Not found.";

function jsonError(
  status: number,
  code: string,
  message: string,
  correlationId: string,
  fields?: Record<string, string>,
): Response {
  const body: ErrorBody = { ok: false, error: { code, message, ...(fields ? { fields } : {}) } };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-correlation-id": correlationId,
    },
  });
}

/** Re-attaches an event that had to be pulled early to decide the status code. */
async function* withFirst(
  first: AIStreamEvent,
  rest: AsyncGenerator<AIStreamEvent, void, undefined>,
): AsyncGenerator<AIStreamEvent> {
  yield first;
  yield* rest;
}

export async function POST(request: Request): Promise<Response> {
  const correlationId = randomUUID();

  // Identity first: an anonymous caller never reaches body parsing, so nothing
  // about the contract is observable without a session.
  const identity = await resolveCopilotSubject();
  if (!identity.ok) {
    return identity.reason === "unauthenticated"
      ? jsonError(401, "unauthorized", "Sign in to continue.", correlationId)
      : jsonError(403, "forbidden", "Your account has no active workspace.", correlationId);
  }

  const bodyOrStatus = await readJsonBody(request);
  if ("status" in bodyOrStatus) {
    return bodyOrStatus.status === 413
      ? jsonError(413, "validation", "The request is too large.", correlationId)
      : jsonError(415, "validation", "Unsupported content type.", correlationId);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(bodyOrStatus.text);
  } catch {
    return jsonError(400, "validation", "Malformed JSON.", correlationId);
  }

  const parsed = CopilotRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(
      422,
      "validation",
      "Please fix the highlighted fields.",
      correlationId,
      fieldErrors(parsed.error),
    );
  }

  let events: AsyncGenerator<AIStreamEvent, void, undefined>;
  try {
    const orchestrator = createCopilotOrchestrator({ correlationId });
    events = orchestrator.run({
      subject: identity.subject,
      workspaceName: identity.workspaceName,
      text: parsed.data.message,
      ...(parsed.data.conversationId ? { conversationId: parsed.data.conversationId } : {}),
      ...(parsed.data.confirmed === undefined ? {} : { confirmed: parsed.data.confirmed }),
      signal: request.signal,
    });
  } catch {
    // Composition fails only when the deployment is misconfigured. The reason
    // stays server-side; naming the missing variable here would publish it.
    return jsonError(503, "configuration", "The assistant is not available.", correlationId);
  }

  // The rate limit, the conversation lookup and the provider handshake all happen
  // before the first event, so pulling one is what decides between a status code
  // and a stream. Nothing is buffered beyond it.
  let first: IteratorResult<AIStreamEvent, void>;
  try {
    first = await events.next();
  } catch {
    return jsonError(503, "unavailable", "The assistant is not available.", correlationId);
  }
  if (first.done) {
    return jsonError(503, "unavailable", "The assistant is not available.", correlationId);
  }
  if (first.value.type === "error") {
    await events.return(undefined);
    const status = STATUS_BY_CODE[first.value.code] ?? 502;
    const message = status === 404 ? NOT_FOUND : first.value.message;
    return jsonError(status, first.value.code, message, correlationId);
  }

  return new Response(
    toSSEStream(withFirst(first.value, events), () => ({
      type: "error",
      code: "ai/provider",
      message: "The assistant could not complete that request.",
      retryable: true,
    })),
    { headers: { ...SSE_HEADERS, "x-correlation-id": correlationId } },
  );
}
