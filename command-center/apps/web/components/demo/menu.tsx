"use client";
// The one dropdown every route uses: "Move to stage ▾", owner and service filters, row
// action menus, bulk actions.
//
// Built rather than borrowed because the canonical control is a plain text trigger ending in
// "▾" with no library chrome, and because the brief forbids a menu that cannot close. It
// implements the WAI-ARIA menu button pattern: aria-haspopup/aria-expanded/aria-controls on
// the trigger, roving focus inside, Escape and outside-click close, and focus restored to the
// trigger on close so the keyboard never lands nowhere.
import { useCallback, useEffect, useId, useRef, useState } from "react";

export type MenuItem = {
  id: string;
  label: string;
  /** Second line, e.g. a stage's current count. Announced as part of the item name. */
  detail?: string;
  disabled?: boolean;
  /** Marks the item that reflects current state (the stage a card is already in). */
  selected?: boolean;
};

export function MenuButton({
  label,
  ariaLabel,
  items,
  onSelect,
  className,
  align = "left",
  width = 220,
}: {
  label: string;
  /** Needed when the visible label is shorthand ("Move ▾") and the record is ambiguous. */
  ariaLabel?: string;
  items: readonly MenuItem[];
  onSelect: (id: string) => void;
  className?: string;
  align?: "left" | "right";
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  // pointerdown, not click: a click on another trigger would otherwise open the second menu
  // and immediately close it again on the same gesture.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[active]?.focus();
  }, [open, active]);

  const openAt = (index: number) => {
    setActive(index);
    setOpen(true);
  };

  const onTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openAt(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openAt(items.length - 1);
    }
  };

  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + items.length) % items.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(items.length - 1);
    } else if (event.key === "Tab") {
      // Tab out closes rather than trapping — a menu is not a dialog.
      setOpen(false);
    }
  };

  return (
    <span className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? close(false) : openAt(0))}
        onKeyDown={onTriggerKeyDown}
        className={className}
      >
        {label}
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={ariaLabel ?? label}
          onKeyDown={onMenuKeyDown}
          style={align === "right" ? { width, right: 0 } : { width, left: 0 }}
          className="absolute top-[calc(100%+4px)] z-30 max-h-[320px] overflow-y-auto rounded-cc-card border border-cc-line bg-cc-surface py-1 text-left shadow-[0_12px_28px_rgba(20,26,30,.16)]"
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              role="menuitem"
              tabIndex={index === active ? 0 : -1}
              aria-disabled={item.disabled || undefined}
              aria-current={item.selected ? "true" : undefined}
              onClick={() => {
                if (item.disabled) return;
                close(true);
                onSelect(item.id);
              }}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[12.5px] focus-visible:bg-cc-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cc-green ${
                item.disabled ? "cursor-default text-cc-t3" : "text-cc-ink hover:bg-cc-secondary"
              }`}
            >
              <span className="min-w-0 truncate">
                {item.selected ? <span aria-hidden="true">✓ </span> : null}
                {item.label}
              </span>
              {item.detail ? (
                <span className="flex-shrink-0 font-cc-mono text-[10.5px] text-cc-t3">{item.detail}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </span>
  );
}
