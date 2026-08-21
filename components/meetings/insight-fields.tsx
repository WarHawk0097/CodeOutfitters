// How a grounded AI field is rendered, in one place.
//
// Every extracted field carries three things — a value, a confidence, and the transcript
// entries it came from — and all three are shown together or the field is not shown at
// all. That is the whole rule: a reader must never have to guess whether a line is
// something the client said or something the model worked out.
//
// UNKNOWN is rendered as absence, not as an empty row. A section with nothing in it
// disappears, and the screen around it says so in words.
//
// Evidence shows speaker and timestamp where the provider supplied them, and nothing
// where it did not. It never shows reasoning — only what was said and by whom.
import type { AIFieldValue } from "@/lib/meetings/ai/schema";

export function Confidence({ value }: { value: AIFieldValue["confidence"] }) {
  return (
    <span
      data-confidence={value}
      className="ml-2 rounded-cc-control bg-cc-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cc-t3"
    >
      {value}
    </span>
  );
}

export function Evidence({ field }: { field: AIFieldValue }) {
  if (field.evidence.length === 0) return null;
  return (
    <span className="ml-2 text-[10px] text-cc-t4" data-evidence-count={field.evidence.length}>
      {field.evidence
        .map((ref) => [ref.speakerLabel, ref.timestamp].filter(Boolean).join(" ") || "transcript entry")
        .join(" · ")}
    </span>
  );
}

/** True when a field has something to say. Exported because the callers that render a
 *  single field (rather than a list) need the same test. */
export function hasValue(field: AIFieldValue | undefined | null): field is AIFieldValue {
  return Boolean(field && field.confidence !== "unknown" && field.value);
}

export function FieldLine({ field }: { field: AIFieldValue }) {
  return (
    <>
      {field.value}
      <Confidence value={field.confidence} />
      <Evidence field={field} />
    </>
  );
}

export function FieldList({
  label,
  fields,
  emptyLabel,
}: {
  label: string;
  fields: readonly AIFieldValue[] | undefined;
  /** Rendered instead of nothing when the caller wants the absence stated explicitly. */
  emptyLabel?: string;
}) {
  const shown = (fields ?? []).filter(hasValue);
  if (shown.length === 0) {
    if (!emptyLabel) return null;
    return (
      <div className="mt-3">
        <p className="text-[11px] uppercase tracking-wide text-cc-t4">{label}</p>
        <p className="mt-1 text-[12.5px] text-cc-t3">{emptyLabel}</p>
      </div>
    );
  }
  return (
    <div className="mt-3">
      <p className="text-[11px] uppercase tracking-wide text-cc-t4">{label}</p>
      <ul className="mt-1 space-y-1">
        {shown.map((field, index) => (
          <li key={index} className="text-[12.5px] text-cc-ink">
            <FieldLine field={field} />
          </li>
        ))}
      </ul>
    </div>
  );
}
