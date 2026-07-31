// The Copilot screen's state, as a reducer rather than a pile of booleans.
//
// One turn moves through a fixed set of states — idle, submitting, streaming, and
// then exactly one of completed, cancelled or error — and every control on the
// screen is derived from that status. Written here, apart from the component, so
// the transitions can be tested without a DOM: this repo's route tests run in the
// node environment, so anything worth asserting has to be a function.
//
// No message is stored anywhere but in this object. There is no local storage, no
// server-side history in this slice, and a reload starts a new conversation.

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

export type CopilotState = {
  status: CopilotStatus;
  messages: readonly CopilotMessage[];
  /** The assistant message currently being written into, if a turn is open. */
  streamingId: string | null;
  /**
   * The server's id for this conversation, learned from the `start` event and
   * held in memory only. Never minted here — a client-invented id would be a
   * claim about server state that no server made.
   */
  conversationId: string | null;
  /** Already safe for display. Codes are mapped to copy on the way in. */
  error: string | null;
  /** Monotonic, so message keys stay unique across a clear. */
  turn: number;
};

export const INITIAL_COPILOT_STATE: CopilotState = {
  status: "idle",
  messages: [],
  streamingId: null,
  conversationId: null,
  error: null,
  turn: 0,
};

export type CopilotAction =
  | { type: "submit"; text: string }
  | { type: "start"; conversationId: string }
  | { type: "delta"; text: string }
  | { type: "finish" }
  | { type: "error"; code: string }
  | { type: "cancel" }
  | { type: "clear" };

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
  "ai/provider": "The assistant couldn't finish that response. Try again.",
  "ai/timeout": "The assistant took too long to respond. Try again.",
  "ai/cancelled": "That conversation is no longer available. Start a new one.",
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
      // The turn counter survives so a new message can never reuse a key. Nothing
      // is deleted server-side; this drops the local view of the conversation.
      return { ...INITIAL_COPILOT_STATE, turn: state.turn };
  }
}

export function isBusy(state: CopilotState): boolean {
  return state.status === "submitting" || state.status === "streaming";
}

/** Whether the composer's current contents may be sent. */
export function canSend(state: CopilotState, draft: string): boolean {
  const text = draft.trim();
  return !isBusy(state) && text.length > 0 && text.length <= MAX_MESSAGE_LENGTH;
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
