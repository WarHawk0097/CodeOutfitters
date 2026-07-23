"use client";
// Settings — the canonical form, rendered generically over every section in the shared demo
// state (13 of them). Each field renders by its `kind`; a field marked `secret` renders as a
// notice, never an input, because demo mode never asks for or stores a credential.
//
// Saving writes to the local demo store only. No provider is connected and no secret is ever
// written — saveSettingsSection skips secret fields.
import { useMemo, useState } from "react";
import { saveSettingsSection } from "../../../lib/demo/actions";
import type { SettingField, SettingsSection, Tone } from "../../../lib/demo/types";
import { useDemoQuery } from "../../../components/demo/use-demo-query";
import { TONE_INK } from "../../../components/demo/tone";
import { SecretFieldNotice, SelectField, TextAreaField, TextField, ToggleField } from "../../../components/demo/field";
import { RouteError, RouteLoading } from "../../../components/demo/route-states";

export function SettingsScreen() {
  const { state, status, error, retry } = useDemoQuery();
  const [active, setActive] = useState<string | null>(null);

  if (status === "loading") return <RouteLoading label="settings" />;
  if (status === "error") return <RouteError label="settings" error={error!} onRetry={retry} />;

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
      {/* Section index — a real in-page anchor list, not a no-op. */}
      <nav aria-label="Settings sections" className="xl:sticky xl:top-0 xl:w-56 xl:flex-shrink-0">
        <ul className="flex flex-wrap gap-1.5 xl:flex-col">
          {state.settings.map((section) => (
            <li key={section.id}>
              <a
                href={`#settings-${section.id}`}
                onClick={() => setActive(section.id)}
                className={
                  active === section.id
                    ? "block rounded-cc-control bg-cc-green-tint px-3 py-1.5 text-[12px] font-semibold text-cc-green-ink"
                    : "block rounded-cc-control px-3 py-1.5 text-[12px] font-medium text-cc-t2 hover:bg-cc-secondary"
                }
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 flex-1 space-y-4">
        {state.settings.map((section) => (
          <SettingsSectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}

function SettingsSectionCard({ section }: { section: SettingsSection }) {
  // The editable draft holds only the non-secret fields; secret fields never enter it, so
  // they can never be written.
  const initial = useMemo(() => {
    const values: Record<string, string> = {};
    for (const field of section.fields) if (!field.secret) values[field.id] = field.value;
    return values;
  }, [section.fields]);

  const [draft, setDraft] = useState<Record<string, string>>(initial);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const dirty = section.fields.some((f) => !f.secret && draft[f.id] !== f.value);
  const set = (id: string, value: string) => {
    setDraft((d) => ({ ...d, [id]: value }));
    setSavedAt(null);
  };

  return (
    <section
      id={`settings-${section.id}`}
      aria-labelledby={`settings-${section.id}-title`}
      className="scroll-mt-4 rounded-cc-card border border-cc-line bg-cc-surface p-4 xl:p-5"
    >
      <div className="mb-3">
        <h2 id={`settings-${section.id}-title`} className="text-[14px] font-semibold text-cc-ink">
          {section.label}
        </h2>
        <p className="mt-0.5 text-[12px] text-cc-t3">{section.description}</p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          saveSettingsSection(section.id, draft);
          setSavedAt("Saved to the local demo store.");
        }}
      >
        {section.fields.map((field) => (
          <SettingFieldControl key={field.id} field={field} value={draft[field.id] ?? field.value} onChange={(v) => set(field.id, v)} />
        ))}

        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={!dirty}
            className={
              dirty
                ? "rounded-cc-control bg-cc-green px-3 py-1.5 text-[12.5px] font-semibold text-white"
                : "cursor-not-allowed rounded-cc-control border border-cc-line-strong bg-cc-secondary px-3 py-1.5 text-[12.5px] font-semibold text-cc-t3"
            }
          >
            Save changes
          </button>
          <span role="status" aria-live="polite" className="text-[11.5px] text-cc-t3">
            {savedAt ?? (dirty ? "Unsaved changes" : "")}
          </span>
        </div>
      </form>
    </section>
  );
}

function StatusChip({ status, tone }: { status: string; tone?: Tone }) {
  const key = tone ?? "neutral";
  return (
    <span
      className="ml-2 inline-block rounded-full border border-cc-line bg-cc-soft px-2 py-0.5 font-cc-mono text-[9.5px] font-semibold"
      style={{ color: TONE_INK[key] }}
    >
      {status}
    </span>
  );
}

function SettingFieldControl({ field, value, onChange }: { field: SettingField; value: string; onChange: (value: string) => void }) {
  if (field.secret) return <SecretFieldNotice label={field.label} help={field.help} />;

  let control;
  if (field.kind === "toggle") {
    // Seed toggles carry "on"/"off"; keep that convention on write so saved values match.
    control = <ToggleField label={field.label} hint={field.help} checked={value === "on"} onChange={(checked) => onChange(checked ? "on" : "off")} />;
  } else if (field.kind === "textarea") {
    control = <TextAreaField label={field.label} value={value} hint={field.help} onChange={onChange} />;
  } else if (field.kind === "select") {
    control = (
      <SelectField
        label={field.label}
        value={value}
        hint={field.help}
        onChange={onChange}
        options={(field.options ?? []).map((option) => ({ value: option, label: option }))}
      />
    );
  } else {
    control = <TextField label={field.label} type={field.kind === "email" ? "email" : "text"} value={value} hint={field.help} onChange={onChange} />;
  }

  // Provider/state chip (CANON 1440 `st`). Rendered above the control so the label type
  // stays a plain string.
  if (!field.status) return control;
  return (
    <div>
      <div className="mb-1 flex items-center">
        <span className="text-[11px] font-cc-mono tracking-[.05em] text-cc-t3">STATUS</span>
        <StatusChip status={field.status} tone={field.statusTone} />
      </div>
      {control}
    </div>
  );
}
