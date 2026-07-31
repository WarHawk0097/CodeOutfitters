// The Copilot screen's state, as a reducer rather than a pile of booleans.
//
// One turn moves through a fixed set of states — idle, submitting, streaming, and
// then exactly one of completed, cancelled or error — and every control on the
// screen is derived from that status. Written here, apart from the component, so
// the transitions can be tested without a DOM: this repo's route tests run in the
// node environment, so anything worth asserting has to be a function.
//
// Saved conversations live alongside the open turn, because they are the same
// screen: picking one out of the list replaces the transcript and hands the
// composer a conversation id to continue from. The list and the transcript load
// independently and fail independently — a history that will not load must not
// stop anyone typing.
//
// Nothing is stored in the browser. What survives a reload survives because the
// server has it; this object is rebuilt empty every time the page mounts.

/** Mirrors `MAX_MESSAGE_LENGTH` in `lib/ai/server/copilot-request.ts`. */
export const MAX_MESSAGE_LENGTH = 4_000;

/** Show the remaining count only once it is close enough to matter. */
export const REMAINING_VISIBLE_AT = 500;

export type CopilotStatus =
  | "idle"
  | "submitting"
  | "streaming"
  | "completed"
  | "cancelled"
  | "error";

export type CopilotMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

/**
 * One row of the history list.
 *
 * Two fields, because two is all the panel draws. The endpoint also returns
 * timestamps and a message count; they are dropped at the edge rather than
 * carried here, so there is nothing extra for a later change to start rendering.
 * The id is a selector, never something the interface shows.
 */
export type CopilotConversation = {
  id: string;
  title: string;
};

/** Whether the list of saved conversations has arrived. */
export type HistoryStatus = "idle" | "loading" | "ready" | "error";

/** Whether a chosen conversation's transcript has arrived. */
export type TranscriptStatus = "idle" | "loading" | "error";

export type CopilotState = {
  status: CopilotStatus;
  messages: readonly CopilotMessage[];
  /** The assistant message currently being written into, if a turn is open. */
  streamingId: string | null;
  /**
   * The server's id for this conversation, learned from the `start` event or from
   * opening a saved one, and held in memory only. Never minted here — a
   * client-invented id would be a claim about server state that no server made.
   *
   * Doubles as the guard against a slow transcript overwriting a newer choice:
   * a response is only applied while it still names the conversation on screen.
   */
  conversationId: string | null;
  /** Already safe for display. Codes are mapped to copy on the way in. */
  error: string | null;
  /** Monotonic, so message keys stay unique across a clear. */
  turn: number;
  /** Newest first, as the endpoint returned them. Never re-sorted here. */
  conversations: readonly CopilotConversation[];
  historyStatus: HistoryStatus;
  /** Safe copy for a list that would not load. Never blocks the composer. */
  historyError: string | null;
  transcriptStatus: TranscriptStatus;
  transcriptError: string | null;
};

export const INITIAL_COPILOT_STATE: CopilotState = {
  status: "idle",
  messages: [],
  streamingId: null,
  conversationId: null,
  error: null,
  turn: 0,
  conversations: [],
  historyStatus: "idle",
  historyError: null,
  transcriptStatus: "idle",
  transcriptError: null,
};

export type CopilotAction =
  | { type: "submit"; text: string }
  | { type: "start"; conversationId: string }
  | { type: "delta"; text: string }
  | { type: "finish" }
  | { type: "error"; code: string }
  | { type: "cancel" }
  | { type: "clear" }
  | { type: "history_loading" }
  | { type: "history_loaded"; conversations: readonly CopilotConversation[] }
  | { type: "history_error"; code: string }
  | { type: "open"; conversationId: string }
  | { type: "opened"; conversationId: string; messages: readonly CopilotMessage[] }
  | { type: "open_error"; conversationId: string; code: string };

/**
 * User-facing copy for every failure this screen can reach.
 *
 * Keyed by the code the endpoint already returns, because the endpoint's codes
 * are the client-safe projection — the provider's own message never travels this
 * far. The code itself is never the visible sentence.
 */
const ERROR_COPY: Readonly<Record<string, string>> = {
  unauthorized: "Your session has ended. Sign in again to continue.",
  forbidden: "This account has no active workspace, so the assistant is unavailable.",
  validation: "That message couldn't be sent. Edit it and try again.",
  "ai/validation": "That message couldn't be sent. Edit it and try again.",
  "ai/unsupported": "The assistant can't handle that request yet.",
  "ai/rate_limit": "That's a lot of requests in a short time. Wait a moment and try again.",
  "ai/permission": "The assistant isn't allowed to do that.",
  "ai/configuration": "The assistant is unavailable right now. Try again shortly.",
  unavailable: "The assistant is unavailable right now. Try again shortly.",
  configuration: "The assistant is unavailable right now. Try again shortly.",
  "ai/provider": "The assistant couldn't finish that response. Try again.",
  "ai/timeout": "The assistant took too long to respond. Try again.",
  "ai/cancelled": "That conversation is no longer available. Start a new one.",
  // Deleted, never created, or somebody else's — the endpoint answers all three
  // the same way, so the copy has to fit all three without guessing which.
  not_found: "That conversation is no longer available.",
};

const GENERIC_ERROR = "Something went wrong. Try again.";

/** Safe copy for a code, never the code itself. */
export function errorMessage(code: string): string {
  return ERROR_COPY[code] ?? GENERIC_ERROR;
}

/** A turn that failed or was stopped before any text arrived leaves no bubble. */
function withoutEmptyStream(state: CopilotState): readonly CopilotMessage[] {
  return state.messages.filter(
    (message) => message.id !== state.streamingId || message.text.length > 0,
  );
}

export function copilotReducer(state: CopilotState, action: CopilotAction): CopilotState {
  switch (action.type) {
    case "submit": {
      // Guarded here as well as in the component: a reducer that can be driven
      // into two open turns is a reducer that will be.
      if (isBusy(state)) return state;
      const turn = state.turn + 1;
      return {
        ...state,
        status: "submitting",
        error: null,
        turn,
        streamingId: `a${turn}`,
        messages: [
          ...state.messages,
          { id: `u${turn}`, role: "user", text: action.text },
          { id: `a${turn}`, role: "assistant", text: "" },
        ],
      };
    }

    case "start":
      return { ...state, status: "streaming", conversationId: action.conversationId };

    case "delta": {
      if (!state.streamingId) return state;
      return {
        ...state,
        status: "streaming",
        messages: state.messages.map((message) =>
          message.id === state.streamingId
            ? { ...message, text: message.text + action.text }
            : message,
        ),
      };
    }

    case "finish":
      return {
        ...state,
        status: "completed",
        streamingId: null,
        messages: withoutEmptyStream(state),
      };

    case "error":
      return {
        ...state,
        status: "error",
        streamingId: null,
        error: errorMessage(action.code),
        // Whatever already arrived stays on screen; only an empty turn is dropped.
        messages: withoutEmptyStream(state),
      };

    case "cancel":
      return {
        ...state,
        status: "cancelled",
        streamingId: null,
        // Stopping is not a failure, so it never renders as one.
        error: null,
        messages: withoutEmptyStream(state),
      };

    case "clear":
      // Starting fresh. The turn counter survives so a new message can never
      // reuse a key, and the history list survives because it describes the
      // account rather than the conversation being left. Nothing is deleted
      // server-side; this drops the local view and forgets the id, which is what
      // makes the next message start a new conversation.
      return {
        ...INITIAL_COPILOT_STATE,
        turn: state.turn,
        conversations: state.conversations,
        historyStatus: state.historyStatus,
        historyError: state.historyError,
      };

    case "history_loading":
      return { ...state, historyStatus: "loading", historyError: null };

    case "history_loaded":
      return {
        ...state,
        historyStatus: "ready",
        historyError: null,
        conversations: action.conversations,
      };

    case "history_error":
      // The list is the only thing that failed. Status, messages and the composer
      // are untouched on purpose.
      return { ...state, historyStatus: "error", historyError: errorMessage(action.code) };

    case "open":
      // The transcript is emptied immediately rather than left showing the
      // previous conversation under the new one's name.
      return {
        ...state,
        status: "idle",
        messages: [],
        streamingId: null,
        conversationId: action.conversationId,
        error: null,
        transcriptStatus: "loading",
        transcriptError: null,
      };

    case "opened":
      // Stale answers are dropped by name. Two clicks in flight at once resolve in
      // whatever order the network decides, and only the one still on screen may
      // write to it — `conversationId` changes on every open and on every clear,
      // so it is the identity of the current choice.
      if (action.conversationId !== state.conversationId) return state;
      return {
        ...state,
        status: "idle",
        transcriptStatus: "idle",
        transcriptError: null,
        messages: action.messages,
      };

    case "open_error":
      if (action.conversationId !== state.conversationId) return state;
      return {
        ...state,
        transcriptStatus: "error",
        transcriptError: errorMessage(action.code),
        messages: [],
      };
  }
}

export function isBusy(state: CopilotState): boolean {
  return state.status === "submitting" || state.status === "streaming";
}

/**
 * Whether the composer's current contents may be sent.
 *
 * A transcript still loading blocks it: the id is already set, so a message sent
 * now would be appended to a conversation whose earlier turns are not on screen.
 */
export function canSend(state: CopilotState, draft: string): boolean {
  const text = draft.trim();
  return (
    !isBusy(state) &&
    state.transcriptStatus !== "loading" &&
    text.length > 0 &&
    text.length <= MAX_MESSAGE_LENGTH
  );
}

/**
 * Enter sends, Shift+Enter breaks the line.
 *
 * `isComposing` is checked because an IME uses Enter to accept a candidate, and
 * sending there would truncate the word the user was still spelling.
 */
export function shouldSendOnKey(event: {
  key: string;
  shiftKey: boolean;
  isComposing?: boolean;
}): boolean {
  return event.key === "Enter" && !event.shiftKey && !event.isComposing;
}

/**
 * What the polite live region announces.
 *
 * Transitions only. Announcing the deltas themselves would read a partial word
 * on every frame, so the transcript is not the live region — this is.
 */
export function statusAnnouncement(state: CopilotState): string {
  // Opening a saved conversation replaces everything below it, so it is announced
  // ahead of whatever the previous turn ended as.
  if (state.transcriptStatus === "loading") return "Opening conversation.";
  if (state.transcriptStatus === "error") return state.transcriptError ?? GENERIC_ERROR;
  switch (state.status) {
    case "submitting":
      return "Sending your message.";
    case "streaming":
      return "The assistant is responding.";
    case "completed":
      return "Response complete.";
    case "cancelled":
      return "Response stopped.";
    case "error":
      return state.error ?? GENERIC_ERROR;
    case "idle":
      return "";
  }
}

/**
 * The request body, in full.
 *
 * Identity is resolved from the session on the server, so there is nothing to
 * send about it: no user id, no workspace id, no provider, no model, no tools, no
 * prompt and no history. `confirmed` is omitted because this slice offers no
 * mutating action for anyone to confirm.
 */
export function copilotRequestBody(
  text: string,
  conversationId: string | null,
): { message: string; conversationId?: string } {
  return { message: text, ...(conversationId ? { conversationId } : {}) };
}
