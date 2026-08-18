"use client";
// Dashboard-global Copilot: a floating trigger and a right-side drawer, mounted once in
// ShellLayout so it survives navigation between dashboard routes and the conversation state
// inside CopilotScreen is never torn down by a page change.
//
// The drawer renders the exact same CopilotScreen as the full /dashboard/ai page — same
// reducer, same endpoint, same honest "read-only preview" framing. There is no separate,
// smaller AI surface to keep in sync or to accidentally fake. It passes historyPanel={false}
// so the drawer stays a single active conversation, no history rail — that layout is a
// `lg` viewport media query inside CopilotScreen, which would otherwise fire from the
// browser's width regardless of how wide this panel is, not from the panel's own width.
// "New conversation" is still reachable in the drawer via the composer's own "Clear
// conversation" button once a conversation has messages.
//
// Escape/backdrop/focus-restore mirrors components/command-center/command-dialog.tsx: that
// dialog is centered and this one is a side panel, but the accessibility shape (role="dialog",
// aria-modal, Escape closes, focus returns to the trigger, body scroll locked while open) is
// the same problem solved the same way.
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CopilotScreen } from "../../app/dashboard/ai/copilot-view";

const PANEL =
  "fixed inset-0 z-[60] flex flex-col border-cc-line bg-cc-surface shadow-[0_24px_64px_rgba(20,26,30,.24)] sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[420px] sm:border-l lg:w-[640px]";

export function CopilotLauncher() {
  const [open, setOpen] = useState(false);
  // CopilotScreen fetches conversation history on mount. Rendering it only after the first
  // open — rather than always, hidden — means a visitor who never touches Copilot never pays
  // for that request, the same "don't fetch what isn't on screen" reasoning behind the
  // dedup fix in lib/data/leads.ts and lib/tasks/use-live-tasks.ts. Once opened, it stays
  // mounted so its state survives subsequent close/reopen and navigation.
  const [everOpened, setEverOpened] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  // On the full Copilot page itself, the floating trigger would open a second, independent
  // conversation beside the one already on screen. Hidden there rather than disabled: an
  // unreachable-but-visible button is worse than no button.
  const onFullCopilotPage = usePathname() === "/dashboard/ai";

  // Close the drawer the moment navigation lands on the full Copilot page (e.g. a sidebar
  // link click while the drawer was open, not just the in-drawer "Open full Copilot" link,
  // which already closes it via its own onClick). Adjusted synchronously during render —
  // React's documented pattern for "reset state when a prop changes" — rather than in a
  // useEffect, which would commit one render late and briefly flash the drawer open on the
  // page that's supposed to never show it.
  const [prevOnFullCopilotPage, setPrevOnFullCopilotPage] = useState(onFullCopilotPage);
  if (onFullCopilotPage !== prevOnFullCopilotPage) {
    setPrevOnFullCopilotPage(onFullCopilotPage);
    if (onFullCopilotPage) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    // Initial focus into the panel, not just onto <body>, on open — the trigger already had
    // focus, so this is the same "somewhere useful inside what just appeared" move the search
    // dialog makes onto its input.
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) return;
    triggerRef.current?.focus();
  }, [open]);

  return (
    <>
      {onFullCopilotPage ? null : (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            setEverOpened(true);
            setOpen(true);
          }}
          aria-label="Open Copilot"
          aria-haspopup="dialog"
          aria-expanded={open}
          title="Copilot"
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-cc-line bg-cc-ink text-cc-surface shadow-[0_8px_24px_rgba(20,26,30,.28)] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-cc-green focus-visible:outline-offset-2"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path d="M12 3a7 7 0 0 0-7 7v3.5A2.5 2.5 0 0 0 7.5 16H8v3l3.5-3H12a7 7 0 0 0 0-13Z" />
          </svg>
        </button>
      )}

      {/* Mounted from first open onward, visibility toggled by `hidden` rather than by
          conditional rendering after that — CopilotScreen's draft and conversation state must
          survive close/reopen and navigation between dashboard routes, which an
          unmount-on-close would throw away every time. */}
      {everOpened ? (
      <div className={`fixed inset-0 z-[60] ${open ? "" : "hidden"}`}>
        <div
          className="absolute inset-0 bg-[rgba(20,26,30,.42)]"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
            }
          }}
          className={PANEL}
        >
          <div className="flex items-center justify-between gap-2 border-b border-cc-line px-4 py-3">
            <h2 id={titleId} className="text-[13px] font-semibold text-cc-ink">
              Copilot
            </h2>
            <div className="flex items-center gap-1">
              <Link
                href="/dashboard/ai"
                onClick={() => setOpen(false)}
                className="rounded-cc-control px-2 py-1 text-[11.5px] font-semibold text-cc-t2 hover:bg-cc-secondary hover:text-cc-ink"
              >
                Open full Copilot
              </Link>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close Copilot"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-cc-control text-cc-t3 hover:bg-cc-secondary"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <CopilotScreen historyPanel={false} />
          </div>
        </div>
      </div>
      ) : null}
    </>
  );
}
