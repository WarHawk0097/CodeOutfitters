"use client";
// Search and filter chrome shared by the record routes.
//
// The canonical frames draw a search field as an icon plus placeholder with no visible
// label (C-D05 143, C-D01 42). That is kept, and the accessible name is supplied by
// aria-label rather than by adding a caption the design does not have.
import type { ReactNode } from "react";
import { MenuButton, type MenuItem } from "./menu";

export function RouteToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-cc-card border border-cc-line bg-cc-surface px-3 py-2.5">
      {children}
    </div>
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
    <span className="flex h-9 min-w-[180px] flex-1 items-center gap-[9px] rounded-cc-control border border-cc-line bg-cc-secondary px-3">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A868D" strokeWidth={2} aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        value={value}
        aria-label={label}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-[13px] text-cc-ink outline-none placeholder:text-cc-t3"
      />
    </span>
  );
}

const FILTER_CLASS =
  "rounded-cc-control border border-cc-line-strong bg-cc-surface px-[11px] py-[7px] text-[12px] font-semibold text-cc-t-table";

const FILTER_ACTIVE_CLASS =
  "rounded-cc-control border border-cc-green-border bg-cc-green-tint px-[11px] py-[7px] text-[12px] font-semibold text-cc-green-ink";

/** A single-select filter. `null` is the "all" option, which is always present so an
 *  applied filter can always be removed — a filter with no way back is a dead end. */
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
      label={`${selected ? selected.label : allLabel} ▾`}
      ariaLabel={`${label}: ${selected ? selected.label : allLabel}`}
      items={items}
      onSelect={(id) => onChange(id === "__all__" ? null : id)}
      className={value ? FILTER_ACTIVE_CLASS : FILTER_CLASS}
    />
  );
}

export function ToolbarButton({
  label,
  onClick,
  tone = "plain",
}: {
  label: string;
  onClick: () => void;
  tone?: "plain" | "primary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        tone === "primary"
          ? "rounded-cc-control bg-cc-green px-[13px] py-2 text-[12.5px] font-semibold text-white"
          : FILTER_CLASS
      }
    >
      {label}
    </button>
  );
}
