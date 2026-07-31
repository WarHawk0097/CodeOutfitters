import { randomUUID } from "node:crypto";
import { isUuid } from "@/lib/dashboard/validation";
import { createCopilotConversationStore } from "@/lib/ai/server/copilot-conversation-store";
import { jsonError, jsonOk, toConversationDetail } from "@/lib/ai/server/copilot-history";
import { resolveCopilotSubject } from "@/lib/ai/server/copilot-subject";

// One saved conversation, as much of it as the dashboard may render.
//
// Every denial past authentication is the same 404 with the same sentence. A
// conversation that was never created, one that was deleted, one belonging to a
// colleague in this workspace and one belonging to another workspace entirely all
// produce it, because any difference between them would turn this endpoint into a
// way of asking whether an id is real. The store answers `undefined` for all of
// them for the same reason — see `can_use_ai_conversation` in the migration.
//
// A malformed id is answered differently on purpose: it is a bug in the caller,
// not a question about somebody else's data, and it never reaches the database.
//
// Node runtime: the Supabase SSR client requires it, matching POST /api/ai/copilot.
export const runtime = "nodejs";

const NOT_FOUND = "That conversation is not available.";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
): Promise<Response> {
  const correlationId = randomUUID();

  const identity = await resolveCopilotSubject();
  if (!identity.ok) {
    return identity.reason === "unauthenticated"
      ? jsonError(401, "unauthorized", "Sign in to continue.", correlationId)
      : jsonError(403, "forbidden", "Your account has no active workspace.", correlationId);
  }

  const { conversationId } = await params;
  if (!isUuid(conversationId)) {
    return jsonError(422, "validation", "Please fix the highlighted fields.", correlationId, {
      conversationId: "That conversation id is not valid.",
    });
  }

  let store;
  try {
    store = await createCopilotConversationStore();
  } catch {
    return jsonError(503, "configuration", "Your history is not available.", correlationId);
  }

  let conversation;
  try {
    // No workspace or user argument: scoping a read the policies already scope
    // would suggest the boundary lives in TypeScript.
    conversation = await store.get(conversationId);
  } catch {
    return jsonError(503, "unavailable", "Your history is not available.", correlationId);
  }

  // The active workspace, not merely a reachable one. A user who belongs to two
  // workspaces can hold a conversation in each, and the history list only ever
  // shows the one they are currently in — so opening the other by id would
  // contradict the list rather than extend it. Same 404 as everything else.
  if (!conversation || conversation.workspaceId !== identity.subject.workspaceId) {
    return jsonError(404, "not_found", NOT_FOUND, correlationId);
  }

  return jsonOk({ ok: true, conversation: toConversationDetail(conversation) }, correlationId);
}
