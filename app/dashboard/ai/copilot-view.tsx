"use client";
// The Copilot screen. Everything interactive lives here; the page beside it is a
// server component that renders this and nothing else.
//
// Scope is deliberately one thing: type a message, watch the answer stream in,
// stop it if it is going nowhere. There is no persistence, no business data and no
// tool the assistant can reach — the endpoint behind this screen is read-only, and
// the empty state says so rather than letting the interface imply otherwise.
//
// Transitions and copy live in `copilot-state.ts`, stream decoding in
// `copilot-stream.ts`, so both can be tested in this repo's node environment.

import { useEffect, useId, useReducer, useRef, useState } from "react";
import {
  BTN_PRIMARY,
  BTN_QUIET,
  BTN_SECONDARY,
  FIELD_TEXTAREA,
} from "../../../lib/command-center/ui/control-system";
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

export function CopilotScreen() {
  const [state, dispatch] = useReducer(copilotReducer, INITIAL_COPILOT_STATE);
  const [draft, setDraft] = useState("");
  const composerId = useId();
  const errorId = `${composerId}-error`;
  const countId = `${composerId}-count`;

  // Holds the controller for the turn in flight. A new one is built per send: an
  // aborted controller stays aborted, so reusing it would cancel the next request
  // the instant it started.
  const abortRef = useRef<AbortController | null>(null);

  // Leaving the page mid-stream should not leave a fetch reading into a component
  // that no longer exists.
  useEffect(() => () => abortRef.current?.abort(), []);

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
    // Clearing while a response is arriving stops it first; the draft is left
    // alone, since the user typing it did not ask for it to be thrown away.
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "clear" });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* The shell header carries the <h1> for the route (shell-nav PAGE_META), so
          the screen's own header is a section heading rather than a second one. */}
      <header className={`${CARD} px-4 py-3`}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="text-[15px] font-semibold text-cc-ink">Copilot</h2>
          <span className="rounded-cc-control border border-cc-line bg-cc-soft px-2 py-0.5 font-cc-mono text-[10px] text-cc-t2">
            Read-only preview
          </span>
        </div>
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
          <span id={countId} className="basis-full text-[11px] text-cc-t3 sm:ml-auto sm:basis-auto">
            {/* Silent until the limit is close enough to matter; a counter that is
                always on is a counter nobody reads when it finally matters. */}
            {remaining <= REMAINING_VISIBLE_AT
              ? `${remaining} characters left`
              : "Enter sends · Shift+Enter adds a line"}
          </span>
        </div>
      </form>
    </div>
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
