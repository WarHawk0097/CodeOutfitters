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
import {
  APPEARANCES,
  APPEARANCE_LABELS,
  SIDEBAR_STYLES,
  SIDEBAR_STYLE_LABELS,
  SIDEBAR_STYLE_SWATCHES,
  THEMES,
  THEME_DESCRIPTIONS,
  THEME_LABELS,
  THEME_SWATCHES,
  useDashboardTheme,
} from "../theme";

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
          <li>
            <a
              href="#settings-appearance"
              onClick={() => setActive("appearance")}
              className={
                active === "appearance"
                  ? "block rounded-cc-control bg-cc-green-tint px-3 py-1.5 text-[12px] font-semibold text-cc-green-ink"
                  : "block rounded-cc-control px-3 py-1.5 text-[12px] font-medium text-cc-t2 hover:bg-cc-secondary"
              }
            >
              Appearance
            </a>
          </li>
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
        <ThemeSettingsCard />
        {state.settings.map((section) => (
          <SettingsSectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}

// Live appearance controls. A selection applies immediately (and persists via
// the theme context's localStorage writes); there is no Save button because
// there is nothing to reconcile against a store — the preference IS the state.
//
// The three choices are deliberately separate controls: Palette (accent + all
// surfaces), Appearance (light / dark / system) and Sidebar style (the rail
// only), because they are independent and combining them into one grid made it
// impossible to say what a card was actually changing.
function ThemeSettingsCard() {
  const {
    theme,
    appearance,
    sidebarStyle,
    resolvedAppearance,
    isDefault,
    setTheme,
    setAppearance,
    setSidebarStyle,
    resetToDefaults,
  } = useDashboardTheme();

  return (
    <section
      id="settings-appearance"
      aria-labelledby="settings-appearance-title"
      className="scroll-mt-4 rounded-cc-card border border-cc-line bg-cc-surface p-4 xl:p-5"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="settings-appearance-title" className="text-[14px] font-semibold text-cc-ink">
            Appearance
          </h2>
          {/* Honest scope: nothing here is written to the account. */}
          <p className="mt-0.5 text-[12px] text-cc-t3">
            Personalizes the Command Center in this browser only. It is not saved to your account and
            does not affect the public site.
          </p>
        </div>
        <button
          type="button"
          onClick={resetToDefaults}
          disabled={isDefault}
          aria-describedby={isDefault ? "settings-appearance-reset-reason" : undefined}
          className={
            isDefault
              ? "cursor-not-allowed rounded-cc-control border border-cc-line-strong bg-cc-secondary px-3 py-1.5 text-[12px] font-semibold text-cc-t3"
              : "rounded-cc-control border border-cc-line-strong px-3 py-1.5 text-[12px] font-semibold text-cc-ink hover:border-cc-green hover:text-cc-green-ink"
          }
        >
          Reset to CodeOutfitters default
        </button>
        {isDefault ? (
          <span id="settings-appearance-reset-reason" className="sr-only">
            Already using the CodeOutfitters default palette, appearance and sidebar style.
          </span>
        ) : null}
      </div>

      <fieldset className="mb-5">
        <legend className="mb-1.5 text-[12px] font-medium text-cc-t2">Palette</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {THEMES.map((preset) => {
            const selected = theme === preset;
            const swatch = THEME_SWATCHES[preset];
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={selected}
                onClick={() => setTheme(preset)}
                className={`flex items-start gap-3 rounded-cc-card border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cc-green ${
                  selected ? "border-cc-green bg-cc-green-tint" : "border-cc-line hover:border-cc-t3"
                }`}
              >
                {/* Miniature rail + surface preview: the rail block on the left,
                    the canvas/surface/accent stack on the right. Four tokens,
                    not one dot, so the card previews the actual palette. */}
                <span
                  aria-hidden="true"
                  className="flex h-11 w-14 flex-shrink-0 overflow-hidden rounded-[6px] ring-1 ring-black/10"
                >
                  <span className="w-1/3" style={{ background: swatch.rail }} />
                  <span className="flex w-2/3 flex-col" style={{ background: swatch.canvas }}>
                    <span
                      className="mt-1 ml-1 h-2.5 rounded-[2px]"
                      style={{ background: swatch.surface }}
                    />
                    <span
                      className="mt-1 ml-1 h-1.5 w-1/2 rounded-[2px]"
                      style={{ background: swatch.accent }}
                    />
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-cc-ink">
                    {THEME_LABELS[preset]}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-cc-t3">
                    {THEME_DESCRIPTIONS[preset]}
                  </span>
                  {/* Never colour-only: the selected card says so in text. */}
                  <span
                    className={
                      selected ? "mt-1 block text-[11px] font-semibold text-cc-green-ink" : "sr-only"
                    }
                  >
                    Selected
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mb-5">
        <legend className="mb-1.5 text-[12px] font-medium text-cc-t2">Appearance mode</legend>
        <div className="inline-flex rounded-cc-control border border-cc-line p-0.5">
          {APPEARANCES.map((mode) => {
            const selected = appearance === mode;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={selected}
                onClick={() => setAppearance(mode)}
                className={`text-[12px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cc-green ${
                  selected
                    ? "rounded-[7px] bg-cc-green px-3 py-1.5 font-semibold text-white"
                    : "rounded-[7px] px-3 py-1.5 font-medium text-cc-t2 hover:text-cc-ink"
                }`}
              >
                {APPEARANCE_LABELS[mode]}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-cc-t3">
          {appearance === "system"
            ? `Following this device — currently ${resolvedAppearance}.`
            : `Always ${appearance}.`}
        </p>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-[12px] font-medium text-cc-t2">Sidebar style</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SIDEBAR_STYLES.map((style) => {
            const selected = sidebarStyle === style;
            return (
              <button
                key={style}
                type="button"
                aria-pressed={selected}
                onClick={() => setSidebarStyle(style)}
                className={`flex items-center gap-2.5 rounded-cc-control border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cc-green ${
                  selected ? "border-cc-green bg-cc-green-tint" : "border-cc-line hover:border-cc-t3"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-7 w-3.5 flex-shrink-0 rounded-[3px] ring-1 ring-black/10"
                  style={{ background: SIDEBAR_STYLE_SWATCHES[style] }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-medium text-cc-ink">
                    {SIDEBAR_STYLE_LABELS[style]}
                  </span>
                  <span
                    className={selected ? "block text-[11px] font-semibold text-cc-green-ink" : "sr-only"}
                  >
                    Selected
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </section>
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
          setSavedAt("Saved in this browser.");
        }}
      >
        {section.fields.map((field) => (
          <SettingFieldControl key={field.id} field={field} value={draft[field.id] ?? field.value} onChange={(v) => set(field.id, v)} />
        ))}

        <div className="mt-3 flex items-center gap-3">
          {/* Nothing edited yet, so there is nothing to save: disabled with the
              reason announced rather than enabled-and-inert. */}
          <button
            type="submit"
            disabled={!dirty}
            aria-describedby={dirty ? undefined : `${section.id}-save-reason`}
            className={
              dirty
                ? "rounded-cc-control bg-cc-green px-3 py-1.5 text-[12.5px] font-semibold text-white"
                : "cursor-not-allowed rounded-cc-control border border-cc-line-strong bg-cc-secondary px-3 py-1.5 text-[12.5px] font-semibold text-cc-t3"
            }
          >
            Save changes
          </button>
          {dirty ? null : (
            <span id={`${section.id}-save-reason`} className="sr-only">
              Change a field to save this section.
            </span>
          )}
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
