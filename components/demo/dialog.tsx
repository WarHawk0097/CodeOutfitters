"use client";
// The modal every route's create / edit / confirm flow uses.
//
// The brief forbids a dialog without a working Save or Cancel and a dialog with no reachable
// close control, so all three exist here once: Escape, the header close button, and the
// backdrop. Focus is trapped while open and restored to whatever opened it on close.
import { useCallback, useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Dialog({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  width = 460,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  width?: number;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const nodes = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (nodes.length === 0) return;
      const firstNode = nodes[0]!;
      const lastNode = nodes[nodes.length - 1]!;
      if (event.shiftKey && document.activeElement === firstNode) {
        event.preventDefault();
        lastNode.focus();
      } else if (!event.shiftKey && document.activeElement === lastNode) {
        event.preventDefault();
        firstNode.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    // The page behind a modal must not scroll under it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus();
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Decorative backdrop: the dialog already has a labelled close button and Escape, so
          this is a convenience and is hidden from assistive technology rather than announced
          as a second, unnamed control. */}
      <div className="absolute inset-0 bg-[rgba(20,26,30,.42)]" aria-hidden="true" onClick={close} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        style={{ width: "100%", maxWidth: width }}
        className="relative max-h-[calc(100vh-32px)] overflow-y-auto rounded-cc-dialog border border-cc-line bg-cc-surface shadow-[0_24px_64px_rgba(20,26,30,.24)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-cc-line px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[14.5px] font-semibold text-cc-ink">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-0.5 text-[11.5px] text-cc-t3">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={`Close ${title}`}
            className="-mr-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-cc-control text-cc-t3 hover:bg-cc-secondary"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <div className="px-4 py-4">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-cc-line px-4 py-3">{footer}</div>
      </div>
    </div>
  );
}

export function DialogCancelButton({ onClick, label = "Cancel" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-cc-control border border-cc-line-strong bg-cc-surface px-3 py-1.5 text-[12.5px] font-semibold text-cc-t-table"
    >
      {label}
    </button>
  );
}

export function DialogSubmitButton({
  label,
  tone = "green",
  form,
}: {
  label: string;
  tone?: "green" | "red";
  form?: string;
}) {
  return (
    <button
      type="submit"
      form={form}
      className={`rounded-cc-control px-3 py-1.5 text-[12.5px] font-semibold text-white ${
        tone === "red" ? "bg-cc-red" : "bg-cc-green"
      }`}
    >
      {label}
    </button>
  );
}
