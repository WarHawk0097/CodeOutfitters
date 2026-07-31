// The browser half of conversation history: two reads, and the mapping from what
// the endpoints answer to what the reducer holds.
//
// Split out of the component for the same reason `copilot-stream.ts` is — this
// repo's tests run in the node environment, so anything worth asserting has to be
// a function rather than a click. `fetch` is a parameter for the same reason: a
// test supplies one, and nothing here reaches the network on its own.
//
// Nothing is sent. Neither request carries a body, a user id or a workspace id;
// the session already says who is asking, and a client that could name a
// workspace would be a client that could name someone else's.
//
// Every failure comes back as a code, never a sentence. `copilot-state.ts` owns
// the copy, so there is one place where a code becomes something a person reads.

import type { CopilotConversation, CopilotMessage } from "./copilot-state";

/** What the endpoints return, narrowed to the fields this screen reads. */
type SummaryPayload = { id?: unknown; title?: unknown };
type MessagePayload = { id?: unknown; role?: unknown; content?: unknown };

export type HistoryResult<T> = { ok: true; value: T } | { ok: false; code: string };

/** The generic code for anything the server did not name itself. */
const FAILED = "unavailable";

type Fetcher = typeof fetch;

/**
 * Reads the code out of an error envelope, without trusting it to be one.
 *
 * The endpoints always answer `{ok:false,error:{code}}`, but a proxy, a sign-in
 * redirect or a crashed route can put anything on the wire. Anything unrecognised
 * becomes the generic code rather than a string this screen would then display.
 */
async function codeOf(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    const code = (body as { error?: { code?: unknown } } | null)?.error?.code;
    return typeof code === "string" && code.length > 0 ? code : FAILED;
  } catch {
    return FAILED;
  }
}

async function read<T>(
  fetcher: Fetcher,
  url: string,
  signal: AbortSignal | undefined,
  map: (body: unknown) => T | null,
): Promise<HistoryResult<T>> {
  let response: Response;
  try {
    response = await fetcher(url, { signal, headers: { accept: "application/json" } });
  } catch (error) {
    // An abort is the caller changing its mind, not a failure to report.
    if (signal?.aborted || (error as { name?: string })?.name === "AbortError") {
      return { ok: false, code: "aborted" };
    }
    return { ok: false, code: FAILED };
  }

  if (!response.ok) return { ok: false, code: await codeOf(response) };

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, code: FAILED };
  }

  const value = map(body);
  // A 200 whose shape is wrong is a broken deployment, not an empty history: it
  // is reported rather than rendered as "no conversations yet".
  return value === null ? { ok: false, code: FAILED } : { ok: true, value };
}

function toConversation(row: SummaryPayload): CopilotConversation | null {
  if (typeof row?.id !== "string" || typeof row?.title !== "string") return null;
  return { id: row.id, title: row.title };
}

function toMessage(row: MessagePayload): CopilotMessage | null {
  if (typeof row?.id !== "string" || typeof row?.content !== "string") return null;
  // Only the two roles the transcript can draw. The endpoint already omits the
  // rest; this is the second half of the same rule, so an unrecognised role can
  // never reach a renderer that would have to guess at it.
  if (row.role !== "user" && row.role !== "assistant") return null;
  return { id: row.id, role: row.role, text: row.content };
}

/** This user's recent conversations, newest first. Order is the server's. */
export function fetchConversations(
  fetcher: Fetcher,
  signal?: AbortSignal,
): Promise<HistoryResult<readonly CopilotConversation[]>> {
  return read(fetcher, "/api/ai/copilot/conversations", signal, (body) => {
    const rows = (body as { conversations?: unknown })?.conversations;
    if (!Array.isArray(rows)) return null;
    const mapped = rows.map(toConversation);
    return mapped.every((row) => row !== null) ? (mapped as CopilotConversation[]) : null;
  });
}

/** One saved conversation's transcript, in the order it was written. */
export function fetchConversation(
  fetcher: Fetcher,
  conversationId: string,
  signal?: AbortSignal,
): Promise<HistoryResult<readonly CopilotMessage[]>> {
  // Encoded because it is interpolated into a path. The value comes from the list
  // this screen was given rather than from typing, but a value's provenance is not
  // a reason to skip escaping it.
  const url = `/api/ai/copilot/conversations/${encodeURIComponent(conversationId)}`;
  return read(fetcher, url, signal, (body) => {
    const rows = (body as { conversation?: { messages?: unknown } })?.conversation?.messages;
    if (!Array.isArray(rows)) return null;
    const mapped = rows.map(toMessage);
    return mapped.every((row) => row !== null) ? (mapped as CopilotMessage[]) : null;
  });
}
