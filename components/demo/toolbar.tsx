"use client";
// Search and filter chrome shared by the record routes.
//
// The canonical frames draw a search field as an icon plus placeholder with no visible
// label (C-D05 143, C-D01 42). That is kept, and the accessible name is supplied by
// aria-label rather than by adding a caption the design does not have.
//
// Every control here is assembled from lib/command-center/ui/control-system.ts, so the
// search field, the filter triggers, "Reset demo tasks" and the Saved View group are one
// height, one radius and one padding scale instead of the 30/34/36px mixture the owner
// photographed. The route order is fixed by RouteToolbar's callers and asserted in
// app/dashboard/visual-system.test.ts: search, filters, reset/secondary, Saved Views.
import type { ReactNode } from "react";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_SELECT,
  BTN_DISABLED,
  DISABLED_REASON,
  TOOLBAR_DIVIDER,
  TOOLBAR_GROUP,
  TOOLBAR_ROW,
  TOOLBAR_SEARCH,
  TOOLBAR_STATUS,
  VARIANT_SELECTED,
} from "../../lib/command-center/ui/control-system";
import { MenuButton, type MenuItem } from "./menu";

/** One toolbar row per route. Groups wrap as units; nothing overflows sideways. */
export function RouteToolbar({ children }: { children: ReactNode }) {
  return <div className={TOOLBAR_ROW}>{children}</div>;
}

/** A related cluster inside the toolbar — the filters, or the Saved View controls. */
export function ToolbarGroup({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${TOOLBAR_GROUP} ${className}`}>{children}</div>;
}

/** Rule between two toolbar groups. Decorative, so it disappears once the row wraps. */
export function ToolbarDivider() {
  return <span aria-hidden="true" className={TOOLBAR_DIVIDER} />;
}

/**
 * Informational copy in a toolbar. A `span`, never a button: "Saved in this browser." is
 * a statement about where the data went, and styling it like the controls beside it made
 * the owner read it as an action.
 */
export function ToolbarStatus({
  children,
  id,
  live = false,
}: {
  children: ReactNode;
  id?: string;
  live?: boolean;
}) {
  return (
    <span id={id} role={live ? "status" : undefined} aria-live={live ? "polite" : undefined} className={TOOLBAR_STATUS}>
      {children}
    </span>
  );
}

export function SearchInput({
  value,
  onChange,
  label,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
}) {
  return (
    <span className={TOOLBAR_SEARCH}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" className="shrink-0 text-cc-t2">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        value={value}
        aria-label={label}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-[12.5px] text-cc-ink outline-none placeholder:text-cc-t3"
      />
    </span>
  );
}

/** A single-select filter. `null` is the "all" option, which is always present so an
 *  applied filter can always be removed — a filter with no way back is a dead end.
 *
 *  The selected value is rendered at full ink strength. It previously shared its colour
 *  with the placeholder, which made an applied filter unreadable as an applied filter. */
export function FilterMenu({
  label,
  value,
  options,
  onChange,
  allLabel,
}: {
  label: string;
  value: string | null;
  options: readonly { id: string; label: string; count?: number }[];
  onChange: (value: string | null) => void;
  allLabel: string;
}) {
  const selected = options.find((option) => option.id === value);
  const items: MenuItem[] = [
    { id: "__all__", label: allLabel, selected: value === null },
    ...options.map((option) => ({
      id: option.id,
      label: option.label,
      detail: option.count === undefined ? undefined : String(option.count),
      selected: option.id === value,
    })),
  ];
  return (
    <MenuButton
      label={selected ? selected.label : allLabel}
      ariaLabel={`${label}: ${selected ? selected.label : allLabel}`}
      items={items}
      onSelect={(id) => onChange(id === "__all__" ? null : id)}
      chevron
      className={value ? `${BTN_SELECT} ${VARIANT_SELECTED}` : BTN_SELECT}
    />
  );
}

/**
 * A toolbar action. `tone` picks the variant; an enabled button never borrows the
 * disabled foreground, which is why "Reset demo tasks" no longer looks switched off.
 *
 * A disabled toolbar action must say why: `disabledReason` is rendered as adjacent copy
 * and wired through aria-describedby, so the reason reaches a screen reader too.
 */
export function ToolbarButton({
  label,
  onClick,
  tone = "secondary",
  disabled = false,
  disabledReason,
}: {
  label: string;
  onClick: () => void;
  tone?: "secondary" | "primary";
  disabled?: boolean;
  disabledReason?: string;
}) {
  const reasonId = disabled && disabledReason ? `toolbar-reason-${label.replace(/[^a-zA-Z]+/g, "-").toLowerCase()}` : undefined;
  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-describedby={reasonId}
      className={disabled ? BTN_DISABLED : tone === "primary" ? BTN_PRIMARY : BTN_SECONDARY}
    >
      {label}
    </button>
  );
  if (!reasonId) return button;
  return (
    <span className={TOOLBAR_GROUP}>
      {button}
      <span id={reasonId} className={DISABLED_REASON}>
        {disabledReason}
      </span>
    </span>
  );
}
