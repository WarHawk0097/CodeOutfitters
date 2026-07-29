"use client";
// DATE_RANGE_FILTER per Dashboard/docs/COMPONENT-SOURCE-MAP.md row 12
// (date-range-picker.tsx): trigger w/ applied state, popover: presets + start/end + clear.
// Map suggests react-aria-components DateRangePicker — not an authorized new dependency
// (only @tanstack/react-table is). Built with native <input type="date"> pair + preset
// buttons instead: covers the named behaviors (preset, clear, applied-state) with native
// keyboard/a11y/touch-target support, no new dependency. Calendar-grid popover visual
// parity with date-range-picker.tsx is PENDING_HUMAN_VISUAL_REVIEW.
import { useState } from "react";
import {
  BTN_SELECT,
  CONTROL_BASE,
  FIELD_CONTROL,
  ROW_ACTION,
  SIZE_COMPACT,
  VARIANT_PRIMARY,
  VARIANT_SELECTED,
  VARIANT_TERTIARY,
} from "./control-system";
import { MenuChevron } from "../../../components/demo/menu";

export type DateRange = { start: string | null; end: string | null };

export type DateRangePreset = { label: string; getRange: () => DateRange };

export type DateRangeFilterProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: DateRangePreset[];
};

export function DateRangeFilter({ value, onChange, presets = [] }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const applied = Boolean(value.start || value.end);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={applied ? `${BTN_SELECT} ${VARIANT_SELECTED}` : BTN_SELECT}
      >
        <span className="min-w-0 truncate">
          {applied ? `${value.start ?? "..."} → ${value.end ?? "..."}` : "Date range"}
        </span>
        <MenuChevron />
      </button>

      {open ? (
        <div className="absolute z-10 mt-1 w-64 rounded-cc-card border border-cc-line bg-cc-surface p-3 shadow-lg">
          {presets.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-1">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChange(preset.getRange())}
                  className={ROW_ACTION}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          ) : null}

          <label className="mb-1 block text-xs text-cc-t3">
            Start
            <input
              type="date"
              value={value.start ?? ""}
              onChange={(e) => onChange({ ...value, start: e.target.value || null })}
              className={`mt-1 ${FIELD_CONTROL}`}
            />
          </label>
          <label className="mb-2 block text-xs text-cc-t3">
            End
            <input
              type="date"
              value={value.end ?? ""}
              onChange={(e) => onChange({ ...value, end: e.target.value || null })}
              className={`mt-1 ${FIELD_CONTROL}`}
            />
          </label>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => onChange({ start: null, end: null })}
              className={`${CONTROL_BASE} ${SIZE_COMPACT} ${VARIANT_TERTIARY}`}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`${CONTROL_BASE} ${SIZE_COMPACT} ${VARIANT_PRIMARY}`}
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
