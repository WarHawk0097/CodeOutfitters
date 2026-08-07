import { randomUUID } from "node:crypto";
import { createCopilotConversationStore } from "@/lib/ai/server/copilot-conversation-store";
import {
  jsonError,
  jsonOk,
  parseHistoryLimit,
  toConversationSummary,
} from "@/lib/ai/server/copilot-history";
import { resolveCopilotSubject } from "@/lib/ai/server/copilot-subject";

// This user's recent Copilot conversations.
//
// The same handler shape as the turn endpoint beside it: authenticate, validate,
// hand off, map. Identity is the part worth restating — the workspace and the
// user come from `resolveCopilotSubject`, which reads the session and the
// membership table, so there is no query parameter for either and no way to ask
// this endpoint about anybody else. RLS enforces the same thing again underneath,
// which is what makes the scoping arguments below a filter rather than a
// boundary.
//
// A GET with no body: nothing is read from the request except its `limit`, so a
// body sent here is ignored the way any GET ignores one.
//
// Node runtime: the Supabase SSR client requires it, matching POST /api/ai/copilot.
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const correlationId = randomUUID();

  // Identity first, so an anonymous caller never reaches the database and learns
  // nothing about the contract by probing it.
  const identity = await resolveCopilotSubject();
  if (!identity.ok) {
    return identity.reason === "unauthenticated"
      ? jsonError(401, "unauthorized", "Sign in to continue.", correlationId)
      : jsonError(403, "forbidden", "Your account has no active workspace.", correlationId);
  }

  const limit = parseHistoryLimit(new URL(request.url).searchParams.get("limit"));
  if (!limit.ok) {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      limit: limit.message,
    });
  }

  let store;
  try {
    store = await createCopilotConversationStore();
  } catch {
    // Only a misconfigured deployment lands here. Naming the missing variable
    // would publish it.
    return jsonError(503, "configuration", "Your history is not available.", correlationId);
  }

  try {
    const conversations = await store.list(
      identity.subject.workspaceId,
      identity.subject.userId,
      limit.limit,
    );
    // Newest first is the store's ordering, from the index the migration declares;
    // re-sorting here would be a second answer to the same question.
    return jsonOk({ ok: true, conversations: conversations.map(toConversationSummary) }, correlationId);
  } catch {
    // The store already raised a typed error carrying no Postgres text. Even that
    // safe message is not forwarded — this endpoint's copy is its own.
    return jsonError(503, "unavailable", "Your history is not available.", correlationId);
  }
}
