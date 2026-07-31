"use client";
// The Copilot screen. Everything interactive lives here; the page beside it is a
// server component that renders this and nothing else.
//
// Scope: type a message, watch the answer stream in, stop it if it is going
// nowhere, and reopen something said earlier. There is still no business data and
// no tool the assistant can reach — the endpoints behind this screen are
// read-only, and the empty state says so rather than letting the interface imply
// otherwise.
//
// Transitions and copy live in `copilot-state.ts`, stream decoding in
// `copilot-stream.ts`, the two history reads in `copilot-history.ts`, so all
// three can be tested in this repo's node environment.

import { useEffect, useId, useReducer, useRef, useState } from "react";
import {
  BTN_PRIMARY,
  BTN_QUIET,
  BTN_SECONDARY,
  FIELD_TEXTAREA,
} from "../../../lib/command-center/ui/control-system";
import { fetchConversation, fetchConversations } from "./copilot-history";
import type { CopilotState } from "./copilot-state";
import {
  INITIAL_COPILOT_STATE,
  MAX_MESSAGE_LENGTH,
  REMAINING_VISIBLE_AT,
  canSend,
  copilotReducer,
  copilotRequestBody,
  isBusy,
  shouldSendOnKey,
  statusAnnouncement,
} from "./copilot-state";
import { readCopilotStream } from "./copilot-stream";

const CARD = "rounded-cc-card border border-cc-line bg-cc-surface";

/** Long prose needs a measure; the shell's full width is far past readable. */
const MEASURE = "max-w-[68ch]";

/** Wrapped rather than passed bare: an unbound `fetch` throws in the browser. */
const browserFetch: typeof fetch = (input, init) => fetch(input, init);

export function CopilotScreen() {
  const [state, dispatch] = useReducer(copilotReducer, INITIAL_COPILOT_STATE);
  const [draft, setDraft] = useState("");
  // Collapsed on small screens only, where the list would otherwise push the
  // composer below the fold. The desktop layout ignores this entirely.
  const [historyOpen, setHistoryOpen] = useState(false);
  const composerId = useId();
  const errorId = `${composerId}-error`;
  const countId = `${composerId}-count`;
  const historyId = `${composerId}-history`;

  // Holds the controller for the turn in flight. A new one is built per send: an
  // aborted controller stays aborted, so reusing it would cancel the next request
  // the instant it started.
  const abortRef = useRef<AbortController | null>(null);
  // The history reads get their own, so opening a conversation cancels the
  // previous open rather than the answer currently streaming.
  const historyRef = useRef<AbortController | null>(null);

  async function loadHistory(signal?: AbortSignal) {
    dispatch({ type: "history_loading" });
    const result = await fetchConversations(browserFetch, signal);
    if (result.ok) dispatch({ type: "history_loaded", conversations: result.value });
    // An abort means this component asked for it, or went away. Neither is
    // something to put on screen.
    else if (result.code !== "aborted") dispatch({ type: "history_error", code: result.code });
  }

  // The list on arrival. Its own request, so a history that will not load leaves
  // the composer working.
  useEffect(() => {
    const controller = new AbortController();
    void loadHistory(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount.
  }, []);

  // Leaving the page mid-stream should not leave a fetch reading into a component
  // that no longer exists.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      historyRef.current?.abort();
    },
    [],
  );

  async function open(conversationId: string) {
    // Whatever was in flight belonged to the conversation being left.
    abortRef.current?.abort();
    abortRef.current = null;
    historyRef.current?.abort();
    const controller = new AbortController();
    historyRef.current = controller;

    dispatch({ type: "open", conversationId });
    const result = await fetchConversation(browserFetch, conversationId, controller.signal);
    if (result.ok) dispatch({ type: "opened", conversationId, messages: result.value });
    else if (result.code !== "aborted") {
      dispatch({ type: "open_error", conversationId, code: result.code });
    }
  }

  const busy = isBusy(state);
  const sendable = canSend(state, draft);
  const remaining = MAX_MESSAGE_LENGTH - draft.length;

  async function send() {
    if (!sendable) return;
    const text = draft.trim();
    const { conversationId } = state;

    setDraft("");
    dispatch({ type: "submit", text });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(copilotRequestBody(text, conversationId)),
        signal: controller.signal,
      });

      let closed = false;
      for await (const event of readCopilotStream(response)) {
        // Stop was pressed between frames; the reducer has already said so.
        if (controller.signal.aborted) return;
        if (event.type === "finish" || event.type === "error") closed = true;
        dispatch(event);
      }
      // A stream that simply ends still has to close the turn, or the composer
      // would stay disabled with nothing left to wait for.
      if (!closed && !controller.signal.aborted) dispatch({ type: "finish" });
      // The first turn of a new conversation is what creates it, and the server
      // titles it from that message — so the list is only correct after the turn,
      // not before it.
      if (!controller.signal.aborted) void loadHistory();
    } catch {
      // An aborted fetch rejects here, and a cancellation is not a failure.
      if (controller.signal.aborted) return;
      dispatch({ type: "error", code: "ai/provider" });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "cancel" });
  }

  function clear() {
    // Starting a new conversation. Anything arriving belongs to the old one, so
    // it is stopped first; the draft is left alone, since the user typing it did
    // not ask for it to be thrown away.
    abortRef.current?.abort();
    abortRef.current = null;
    historyRef.current?.abort();
    historyRef.current = null;
    dispatch({ type: "clear" });
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <HistoryPanel
        state={state}
        panelId={historyId}
        expanded={historyOpen}
        onToggle={() => setHistoryOpen((value) => !value)}
        onOpen={(id) => void open(id)}
        onNew={clear}
        onRetry={() => void loadHistory()}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {/* The shell header carries the <h1> for the route (shell-nav PAGE_META),
            and the history panel beside this one carries the only <h2>, so this
            card is description rather than a third heading of the same thing. */}
        <header className={`${CARD} px-4 py-3`}>
          <span className="inline-block rounded-cc-control border border-cc-line bg-cc-soft px-2 py-0.5 font-cc-mono text-[10px] text-cc-t2">
            Read-only preview
          </span>
          <p className={`mt-1 text-[12px] leading-[1.55] text-cc-t2 ${MEASURE}`}>
            An assistant you can talk to. It answers questions and nothing else — it
            reads no records and changes no data.
          </p>
        </header>

        <section className={`${CARD} px-4 py-4`} aria-label="Conversation">
          <CopilotTranscript state={state} errorId={errorId} />
        </section>

        <form
          className={`${CARD} px-4 py-3`}
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <label htmlFor={composerId} className="mb-1 block text-[11.5px] font-semibold text-cc-t2">
            Message Copilot
          </label>
          {/* A raw textarea rather than TextAreaField: this one needs a key handler,
              a hard length cap and two describedby targets, none of which that
              wrapper takes. The skin is the same shared token. */}
          <textarea
            id={composerId}
            rows={3}
            value={draft}
            disabled={busy}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="Ask a question…"
            aria-describedby={`${state.error ? `${errorId} ` : ""}${countId}`}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (!shouldSendOnKey(event)) return;
              // Enter sends, so it must not also insert the newline it was pressed for.
              event.preventDefault();
              void send();
            }}
            className={`${FIELD_TEXTAREA} resize-y disabled:cursor-not-allowed disabled:border-cc-line disabled:bg-cc-secondary disabled:text-cc-t3`}
          />

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="submit" disabled={!sendable} className={BTN_PRIMARY}>
              Send
            </button>
            {busy ? (
              <button type="button" onClick={stop} className={BTN_SECONDARY}>
                Stop
              </button>
            ) : null}
            {state.messages.length > 0 ? (
              <button type="button" onClick={clear} className={BTN_QUIET}>
                Clear conversation
              </button>
            ) : null}
            <span
              id={countId}
              className="basis-full text-[11px] text-cc-t3 sm:ml-auto sm:basis-auto"
            >
              {/* Silent until the limit is close enough to matter; a counter that is
                  always on is a counter nobody reads when it finally matters. */}
              {remaining <= REMAINING_VISIBLE_AT
                ? `${remaining} characters left`
                : "Enter sends · Shift+Enter adds a line"}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * The list of saved conversations.
 *
 * A column beside the transcript on a wide screen, a collapsed section above it
 * on a narrow one — the same markup either way, so nothing is rendered twice and
 * there is only ever one control per conversation for a screen reader to find.
 *
 * Titles are the only thing drawn. Ids are selectors rather than content, and
 * nothing about the provider, the model, the token count or the cost of a
 * conversation is in the payload for this panel to leak. There is no delete and no
 * rename: neither exists on the server, so offering either would be a lie.
 */
export function HistoryPanel({
  state,
  panelId,
  expanded,
  onToggle,
  onOpen,
  onNew,
  onRetry,
}: {
  state: CopilotState;
  panelId: string;
  expanded: boolean;
  onToggle: () => void;
  onOpen: (conversationId: string) => void;
  onNew: () => void;
  onRetry: () => void;
}) {
  return (
    <aside
      aria-label="Conversation history"
      className={`${CARD} px-3 py-3 lg:w-64 lg:shrink-0`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold text-cc-ink">Conversations</h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          className={`${BTN_QUIET} lg:hidden`}
        >
          {expanded ? "Hide" : "Show"}
        </button>
      </div>

      {/* Hidden rather than unmounted on a narrow screen, so `aria-controls` always
          points at something and the list does not reload on every toggle. */}
      <div id={panelId} className={`${expanded ? "block" : "hidden"} lg:block`}>
        <button type="button" onClick={onNew} className={`${BTN_SECONDARY} mt-2 w-full`}>
          New conversation
        </button>

        {state.historyStatus === "loading" ? (
          <p className="mt-3 text-[12px] text-cc-t2">Loading your conversations…</p>
        ) : null}

        {state.historyStatus === "error" ? (
          <div className="mt-3">
            {/* Not role="alert": failing to load a list is not urgent enough to
                interrupt whatever is being typed. */}
            <p role="status" className="text-[12px] leading-[1.5] text-cc-t2">
              {state.historyError}
            </p>
            <button type="button" onClick={onRetry} className={`${BTN_QUIET} mt-2`}>
              Try again
            </button>
          </div>
        ) : null}

        {state.historyStatus === "ready" && state.conversations.length === 0 ? (
          <p className="mt-3 text-[12px] leading-[1.5] text-cc-t2">
            Nothing saved yet. Send a message and this conversation will appear here.
          </p>
        ) : null}

        {state.conversations.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-1">
            {state.conversations.map((conversation) => {
              const selected = conversation.id === state.conversationId;
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(conversation.id)}
                    // Marks the open one for assistive technology; the weight and
                    // the rule beside it mark it for everyone else, so the state is
                    // never carried by colour alone.
                    aria-current={selected ? "true" : undefined}
                    className={`w-full rounded-cc-control border-l-2 px-2 py-1.5 text-left text-[12px] leading-[1.45] ${
                      selected
                        ? "border-cc-ink bg-cc-soft font-semibold text-cc-ink"
                        : "border-transparent text-cc-t2 hover:bg-cc-soft"
                    }`}
                  >
                    {/* Rendered as text. A title is the first thing a user wrote,
                        so it is exactly the string that must never become markup. */}
                    {conversation.title}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}

/**
 * Everything the conversation area shows for a given state.
 *
 * Split out from the screen because it is a pure function of the state and can
 * therefore be rendered — and asserted on — without a browser.
 */
export function CopilotTranscript({
  state,
  errorId,
}: {
  state: CopilotState;
  errorId: string;
}) {
  if (state.transcriptStatus === "loading") {
    return (
      <>
        <p className="text-[12px] text-cc-t2">Opening conversation…</p>
        <p role="status" aria-live="polite" className="sr-only">
          {statusAnnouncement(state)}
        </p>
      </>
    );
  }

  if (state.transcriptStatus === "error") {
    return (
      <>
        <p
          role="alert"
          className={`rounded-cc-control border border-cc-red-border bg-cc-red-tint px-3 py-2 text-[12px] font-semibold leading-[1.5] text-cc-red-ink ${MEASURE}`}
        >
          {state.transcriptError}
        </p>
        <p className="mt-2 text-[12px] text-cc-t2">
          Pick another conversation, or start a new one.
        </p>
        <p role="status" aria-live="polite" className="sr-only">
          {statusAnnouncement(state)}
        </p>
      </>
    );
  }

  return (
    <>
      {state.messages.length === 0 ? (
        <EmptyState />
      ) : (
        // Not a live region: the deltas arrive a few characters at a time, and
        // announcing each one would read a partial word on every frame. The
        // status line below carries the transitions instead.
        <ol aria-live="off" className="flex flex-col gap-4">
          {state.messages.map((message) => (
            <li key={message.id} className={MEASURE}>
              <p className="mb-1 text-[11px] font-semibold text-cc-t2">
                {message.role === "user" ? "You" : "Copilot"}
              </p>
              <p className="whitespace-pre-wrap break-words text-[13px] leading-[1.6] text-cc-ink">
                {message.text}
              </p>
            </li>
          ))}
        </ol>
      )}

      {state.error ? (
        <p
          id={errorId}
          role="alert"
          className={`mt-4 rounded-cc-control border border-cc-red-border bg-cc-red-tint px-3 py-2 text-[12px] font-semibold leading-[1.5] text-cc-red-ink ${MEASURE}`}
        >
          {state.error}
        </p>
      ) : null}

      {state.status === "cancelled" ? (
        <p className="mt-4 text-[12px] text-cc-t2">You stopped this response.</p>
      ) : null}

      {/* Transitions only — one short sentence per state change. */}
      <p role="status" aria-live="polite" className="sr-only">
        {statusAnnouncement(state)}
      </p>
    </>
  );
}

function EmptyState() {
  return (
    <div className={`text-[12px] leading-[1.6] text-cc-t2 ${MEASURE}`}>
      <p className="text-[13px] font-semibold text-cc-ink">Start a conversation</p>
      <p className="mt-1">In this version you can:</p>
      <ul className="mt-1 list-disc pl-5">
        <li>ask general operational questions</li>
        <li>try the streaming experience end to end</li>
        <li>get answers without anything in the business changing</li>
      </ul>
      <p className="mt-2">
        It cannot yet reach your CRM, projects, invoices, calls or any private
        organisational knowledge, and it does not remember conversations between
        visits.
      </p>
    </div>
  );
}
