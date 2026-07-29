"use client";
// Mounting the Command Center: the shortcut, the trigger, and the one dialog they both open.
//
// Exactly one dialog exists for the whole shell. Mounting it per header slot would give two
// dialogs the same shortcut and let both open at once, which is the sort of thing that only
// shows up on the one screen where both slots render.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CommandDialog, SEARCH_TRIGGER_LABEL } from "./command-dialog";

type CommandCenterApi = {
  open: boolean;
  /** Open the dialog. `returnFocusTo` is where focus goes when it closes — normally the control
   *  that opened it. Defaults to whatever had focus, which is right for the shortcut. */
  openDialog: (returnFocusTo?: HTMLElement | null) => void;
  closeDialog: () => void;
};

const CommandCenterContext = createContext<CommandCenterApi>({
  open: false,
  openDialog: () => {},
  closeDialog: () => {},
});

export function useCommandCenter(): CommandCenterApi {
  return useContext(CommandCenterContext);
}

/** True when the keystroke landed in something a person is typing into. A shortcut that fires
 *  while somebody is writing a follow-up note steals the keystroke and opens a dialog over
 *  their sentence, so the bare `/` shortcut is suppressed here. Ctrl/Cmd+K is not: it is not a
 *  character anybody types into a field. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function CommandCenterProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const restoreRef = useRef<HTMLElement | null>(null);

  const openDialog = useCallback((returnFocusTo?: HTMLElement | null) => {
    restoreRef.current =
      returnFocusTo ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setOpen(true);
  }, []);

  const closeDialog = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;
      // Cmd+K on macOS, Ctrl+K everywhere else. Both are listened for on both platforms rather
      // than sniffing the user agent: a Mac user on an external PC keyboard reaches for Ctrl,
      // and a browser that reports the wrong platform should not cost somebody their shortcut.
      if (modifier && (event.key === "k" || event.key === "K")) {
        event.preventDefault();
        setOpen((current) => {
          if (!current) {
            restoreRef.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }
          return !current;
        });
        return;
      }
      if (event.key === "/" && !modifier && !event.altKey && !isTypingTarget(event.target)) {
        event.preventDefault();
        restoreRef.current =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <CommandCenterContext.Provider value={{ open, openDialog, closeDialog }}>
      {children}
      <CommandDialog open={open} onClose={closeDialog} restoreFocusTo={restoreRef} />
    </CommandCenterContext.Provider>
  );
}

/** The platform's own modifier, for the hint on the trigger. Read from the client only — a
 *  server render has no platform, and guessing one produces a hydration mismatch on half the
 *  machines that load the page. */
function useShortcutHint(): string {
  const [hint, setHint] = useState("Ctrl K");
  useEffect(() => {
    const platform = navigator.platform ?? "";
    if (/mac|iphone|ipad|ipod/i.test(platform)) setHint("⌘ K");
  }, []);
  return hint;
}

/**
 * The visible way in.
 *
 * Two shapes, because the header has two very different amounts of room. `field` is the search
 * box the desktop header was designed around; `icon` is the same control at tablet and phone
 * widths, where a 300px field does not fit. Both are real buttons with the same accessible
 * name, so the keyboard shortcut is never the only way to reach search — which it would be if
 * the small viewports simply dropped the control.
 */
export function CommandCenterTrigger({ variant }: { variant: "field" | "icon" }) {
  const { openDialog } = useCommandCenter();
  const ref = useRef<HTMLButtonElement>(null);
  const hint = useShortcutHint();

  if (variant === "icon") {
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => openDialog(ref.current)}
        aria-label={SEARCH_TRIGGER_LABEL}
        aria-keyshortcuts="Control+K Meta+K"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-cc-control text-cc-t2 hover:bg-cc-secondary hover:text-cc-ink focus-visible:outline-2 focus-visible:outline-cc-green"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => openDialog(ref.current)}
      aria-label={SEARCH_TRIGGER_LABEL}
      aria-keyshortcuts="Control+K Meta+K"
      className="hidden h-9 w-[300px] items-center gap-[9px] rounded-cc-control border border-cc-line bg-cc-secondary px-3 text-left hover:border-cc-line-strong focus-visible:outline-2 focus-visible:outline-cc-green xl:flex"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" className="text-cc-t3">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <span className="min-w-0 flex-1 truncate text-[13px] text-cc-t3">Search…</span>
      {/* The hint is decorative duplication of `aria-keyshortcuts`, which is what assistive
          technology actually reads. */}
      <span aria-hidden="true" className="shrink-0 font-cc-mono text-[10.5px] text-cc-t3">
        {hint}
      </span>
    </button>
  );
}
