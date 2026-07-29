"use client";
// The Saved View control that sits in a record list's toolbar.
//
// One control, not a panel: a selector, a state line that only appears when there is something
// to say, and a management menu. The alternative — a row of eight buttons, most of them
// disabled most of the time — is what "do not overcrowd toolbars" is about, and it also makes
// the common case (pick a view, look at it) slower than the rare one (rename a view).
//
// Two honesty rules govern everything below, and both are enforced rather than merely
// intended:
//
//   * In demo mode these views live in this browser and every surface says so. There is no
//     Shared option that quietly saves locally; the option is visible and disabled with the
//     reason attached, because pretending the concept does not exist is its own kind of lie.
//   * In live mode there is no local fallback at all. The control renders the
//     provider-required notice and saves nothing, rather than writing to localStorage and
//     letting somebody believe their workspace has their view.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogCancelButton, DialogSubmitButton } from "../demo/dialog";
import { TextField } from "../demo/field";
import { MenuButton, type MenuItem } from "../demo/menu";
import { useCommandCenterConfig } from "./mode-provider";
import {
  defaultFilters,
  duplicateName,
  isDefaultState,
  isDirty,
  savedViewId,
  SAVED_VIEW_NAME_MAX,
  SCOPE_DESCRIPTORS,
  validateSavedViewDraft,
  type SavedView,
  type SavedViewFilterState,
  type SavedViewScope,
  type SavedViewSortState,
} from "../../lib/views/model";
import {
  defaultViewFor,
  deleteView,
  findView,
  parseSavedViews,
  renameView,
  saveView,
  serializeSavedViews,
  setBrowserDefault,
  viewsForScope,
  EMPTY_SAVED_VIEWS_STATE,
  SAVED_VIEWS_LOCAL_NOTICE,
  SAVED_VIEWS_STORAGE_KEY,
  type SavedViewsState,
} from "../../lib/views/store";
import {
  resolveSavedViewPlane,
  SAVED_VIEWS_PROVIDER_REQUIRED_REASON,
  SAVED_VIEWS_PROVIDER_REQUIRED_TITLE,
  SHARED_VIEWS_UNAVAILABLE_REASON,
} from "../../lib/views/provider";
import { DEMO_CURRENT_USER_ID } from "../../lib/demo/seed";
import {
  BTN_DISABLED,
  BTN_ICON,
  BTN_SECONDARY,
  BTN_SELECT,
  DISABLED_REASON,
  TOOLBAR_STATUS,
  TOOLBAR_STATUS_DIRTY,
  VARIANT_SELECTED,
} from "../../lib/command-center/ui/control-system";
import { ToolbarGroup, ToolbarStatus } from "../demo/toolbar";

const NO_VIEW = "__none__";

// The group's four parts, in the order the owner's brief fixes them: selector, manage,
// save, status. Every one of them is a shared control-system token, so the Saved View
// group is the same height and the same voice as the search field and the filters it now
// sits beside — it used to be five same-looking buttons at a height nothing else in the
// toolbar shared, which is what "excessive size, weak hierarchy" described.
//
// The selector is capped rather than left to grow: a 60-character view name would
// otherwise push the whole toolbar sideways.
const SELECTOR_CLASS = `${BTN_SELECT} max-w-[220px]`;
const SELECTOR_ACTIVE_CLASS = `${BTN_SELECT} ${VARIANT_SELECTED} max-w-[220px]`;

/** Management trigger. Icon-only, so its accessible name is the whole label. */
function ManageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <circle cx="3.25" cy="8" r="1.3" />
      <circle cx="8" cy="8" r="1.3" />
      <circle cx="12.75" cy="8" r="1.3" />
    </svg>
  );
}

/**
 * Browser-local Saved View state for one list.
 *
 * Reads once on mount rather than subscribing: the key is only written by this hook, so there
 * is nothing to hear about, and a storage listener would fire for every other tab's unrelated
 * writes. Every write goes through the pure functions in lib/views/store.ts and is persisted
 * whole, so a failed write leaves the previous payload intact rather than a half-updated one.
 */
function useSavedViews(scope: SavedViewScope) {
  const [state, setState] = useState<SavedViewsState>(EMPTY_SAVED_VIEWS_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setState(parseSavedViews(window.localStorage.getItem(SAVED_VIEWS_STORAGE_KEY), DEMO_CURRENT_USER_ID));
    setHydrated(true);
  }, []);

  const commit = useCallback((next: SavedViewsState) => {
    setState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, serializeSavedViews(next));
    }
  }, []);

  const views = useMemo(() => viewsForScope(state, scope), [state, scope]);

  return { state, views, hydrated, commit };
}

export function SavedViewsBar({
  scope,
  filters,
  sort = null,
  onApply,
}: {
  scope: SavedViewScope;
  filters: SavedViewFilterState;
  sort?: SavedViewSortState;
  /** Apply a view's state to the list. Called with the scope's defaults when a view is
   *  cleared, so "no view" and "reset" are the same code path. */
  onApply: (filters: SavedViewFilterState, sort: SavedViewSortState) => void;
}) {
  const { live } = useCommandCenterConfig();
  const plane = resolveSavedViewPlane(live);
  const { state, views, hydrated, commit } = useSavedViews(scope);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [renaming, setRenaming] = useState<SavedView | null>(null);
  const [deleting, setDeleting] = useState<SavedView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const descriptor = SCOPE_DESCRIPTORS[scope];
  const selected = selectedId === null ? null : findView(state, selectedId);

  // The browser default is applied once, after storage has been read, and only if the list is
  // still in its opening state. A default that overwrote a filter somebody arrived with — from
  // a search result, or from a link a colleague sent — would make shared links unreliable,
  // which is the one thing a saved view must not do.
  useEffect(() => {
    if (!hydrated || plane.kind !== "demo") return;
    const fallback = defaultViewFor(state, scope);
    if (fallback === null) return;
    if (!isDefaultState(scope, filters, sort)) return;
    setSelectedId(fallback.id);
    onApply(fallback.filters, fallback.sort);
    // Runs on hydration only. `filters` is deliberately absent from the dependency list: this
    // must not re-fire every time somebody types in the search box.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, plane.kind]);

  const dirty = selected !== null && isDirty(scope, selected, filters, sort);
  const unsavedWithoutView = selected === null && !isDefaultState(scope, filters, sort);

  // "Save view" is enabled exactly when saving would produce something that does not
  // already exist. Both of the two ways it can be pointless get their own sentence,
  // because "disabled" on its own is the state the owner reported as indistinguishable
  // from a live control.
  const savable = dirty || unsavedWithoutView;
  const saveDisabledReason =
    selected === null
      ? "Search, filter or sort this list first — there is nothing to save yet."
      : `“${selected.name}” already matches the filters and sort applied.`;

  if (plane.kind !== "demo") {
    return (
      <ToolbarGroup>
        {/* Really disabled, and it looks it: the muted surface and weak border of
            CONTROL_DISABLED, not an enabled control wearing reduced opacity. */}
        <button
          type="button"
          disabled
          aria-describedby={`saved-views-unavailable-${scope}`}
          className={BTN_DISABLED}
        >
          Saved views
        </button>
        <span id={`saved-views-unavailable-${scope}`} className={`max-w-[420px] ${DISABLED_REASON}`}>
          {SAVED_VIEWS_PROVIDER_REQUIRED_TITLE}. {SAVED_VIEWS_PROVIDER_REQUIRED_REASON}
        </span>
      </ToolbarGroup>
    );
  }

  const selectorItems: MenuItem[] = [
    { id: NO_VIEW, label: "No view — all records", selected: selected === null },
    ...views.map((view) => ({
      id: view.id,
      label: view.name,
      detail: state.defaults[scope] === view.id ? "default" : undefined,
      selected: view.id === selected?.id,
    })),
  ];

  // Update / Revert / Clear filters used to be three more buttons in the bar, appearing and
  // disappearing as the filters changed — a row that changes width as you type is why the
  // group read as "excessive size, weak hierarchy". They are management operations on a
  // view, so they live in the management menu with the rest of them. The bar itself keeps a
  // fixed shape: selector, manage, save, status.
  const dirtyItems: MenuItem[] = [
    ...(dirty && selected !== null && selected.ownership.kind !== "builtIn"
      ? [{ id: "update", label: "Update view", detail: "overwrites" } as MenuItem]
      : []),
    ...(dirty || unsavedWithoutView
      ? [{ id: "save-as", label: "Save as new view" } as MenuItem]
      : []),
    ...(dirty ? [{ id: "revert", label: "Revert" } as MenuItem] : []),
    ...(unsavedWithoutView ? [{ id: "clear", label: "Clear filters" } as MenuItem] : []),
  ];

  const manageItems: MenuItem[] = [
    ...dirtyItems,
    ...(selected === null
      ? [{ id: "noop", label: "Select a view to rename, duplicate or delete it", disabled: true } as MenuItem]
      : [
          {
            id: "rename",
            label: "Rename",
            disabled: selected.ownership.kind === "builtIn",
          },
          { id: "duplicate", label: "Duplicate" },
          {
            id: "delete",
            label: "Delete",
            disabled: selected.ownership.kind === "builtIn",
          },
          {
            id: "default",
            label:
              state.defaults[scope] === selected.id
                ? "Stop opening with this view"
                : "Open this list with this view",
          },
        ]),
  ];

  const applyView = (view: SavedView | null) => {
    setSelectedId(view?.id ?? null);
    setNotice(null);
    if (view === null) {
      onApply(defaultFilters(scope), null);
    } else {
      onApply(view.filters, view.sort);
    }
  };

  const updateSelected = () => {
    if (selected === null) return;
    const updated: SavedView = { ...selected, filters, sort };
    const result = saveView(state, updated, { replace: true });
    if (!result.ok) {
      setNotice(result.problem);
      return;
    }
    commit(result.state);
    setNotice(`Updated “${selected.name}”.`);
  };

  const onManage = (id: string) => {
    // The dirty-state operations run whether or not a view is selected — "Clear filters"
    // exists precisely for the no-view case — so they are handled above the guard.
    if (id === "update") return updateSelected();
    if (id === "save-as") return setSaving(true);
    if (id === "revert") return applyView(selected);
    if (id === "clear") return applyView(null);
    if (selected === null) return;
    if (id === "rename") {
      setRenaming(selected);
    } else if (id === "duplicate") {
      const name = duplicateName(views, scope, selected.name);
      const copy: SavedView = {
        ...selected,
        id: savedViewId(scope, name),
        name,
        ownership: { kind: "personal", userId: DEMO_CURRENT_USER_ID },
      };
      const result = saveView(state, copy);
      if (!result.ok) {
        setNotice(result.problem);
        return;
      }
      commit(result.state);
      setSelectedId(copy.id);
      setNotice(`Saved “${name}” in this browser.`);
    } else if (id === "delete") {
      setDeleting(selected);
    } else if (id === "default") {
      const clearing = state.defaults[scope] === selected.id;
      commit(setBrowserDefault(state, scope, clearing ? null : selected.id));
      setNotice(
        clearing
          ? `${descriptor.label} will open unfiltered in this browser.`
          : `${descriptor.label} will open with “${selected.name}” in this browser.`,
      );
    }
  };

  return (
    <ToolbarGroup>
      {/* SELECTOR. "No saved view" rather than "No view": the list is never viewless, it is
          the *saved view* that is unset, and the shorter label read as a broken state. */}
      <MenuButton
        label={selected?.name ?? "No saved view"}
        ariaLabel={`Saved view for ${descriptor.label}: ${selected?.name ?? "no view"}`}
        items={selectorItems}
        onSelect={(id) => applyView(id === NO_VIEW ? null : (findView(state, id) ?? null))}
        className={selected ? SELECTOR_ACTIVE_CLASS : SELECTOR_CLASS}
        width={260}
        chevron
        truncate
      />

      {/* MANAGE. Icon-only and square, so it reads as the group's overflow rather than a
          fourth peer button. Its accessible name is the whole label — "⋯" was not one. */}
      <MenuButton
        label={<ManageIcon />}
        ariaLabel={
          selected === null
            ? "Manage saved views — select a view first"
            : `Manage saved view ${selected.name}`
        }
        items={manageItems}
        onSelect={onManage}
        className={BTN_ICON}
        align="right"
        width={280}
      />

      {/* SAVE. One action, always in the same place. Disabled only when there is genuinely
          nothing to save, and then it says which of the two reasons applies. */}
      <button
        type="button"
        disabled={!savable}
        aria-describedby={savable ? undefined : `saved-views-save-reason-${scope}`}
        className={savable ? BTN_SECONDARY : BTN_DISABLED}
        onClick={() => setSaving(true)}
      >
        Save view
      </button>
      {savable ? null : (
        <span id={`saved-views-save-reason-${scope}`} className={DISABLED_REASON}>
          {saveDisabledReason}
        </span>
      )}

      {/* DIRTY STATE. Words, not a coloured dot: a state a person has to have been told the
          meaning of is not a state that has been communicated. */}
      {dirty || unsavedWithoutView ? (
        <span className={TOOLBAR_STATUS_DIRTY}>Unsaved changes</span>
      ) : null}

      {/* STATUS. Where the views went. Not a control, and never styled as one. */}
      <ToolbarStatus>{SAVED_VIEWS_LOCAL_NOTICE}</ToolbarStatus>

      {notice ? (
        <span role="status" aria-live="polite" className={TOOLBAR_STATUS}>
          {notice}
        </span>
      ) : null}

      <SaveViewDialog
        open={saving}
        scope={scope}
        filters={filters}
        sort={sort}
        existing={views}
        onClose={() => setSaving(false)}
        onSave={(view) => {
          const result = saveView(state, view);
          if (!result.ok) return result.problem;
          commit(result.state);
          setSelectedId(view.id);
          setSaving(false);
          setNotice(`Saved “${view.name}” in this browser.`);
          return null;
        }}
      />

      <RenameViewDialog
        view={renaming}
        onClose={() => setRenaming(null)}
        onRename={(name) => {
          if (renaming === null) return "That view is no longer available.";
          const result = renameView(state, renaming.id, name);
          if (!result.ok) return result.problem;
          commit(result.state);
          setSelectedId(result.view.id);
          setRenaming(null);
          setNotice(`Renamed to “${result.view.name}”.`);
          return null;
        }}
      />

      <Dialog
        open={deleting !== null}
        title="Delete saved view"
        description={
          deleting === null
            ? undefined
            : `“${deleting.name}” will be removed from this browser. Nothing about the records themselves changes.`
        }
        onClose={() => setDeleting(null)}
        footer={
          <>
            <DialogCancelButton onClick={() => setDeleting(null)} />
            <DialogSubmitButton label="Delete view" tone="red" form="delete-saved-view-form" />
          </>
        }
      >
        <form
          id="delete-saved-view-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (deleting === null) return;
            commit(deleteView(state, deleting.id));
            if (selectedId === deleting.id) applyView(null);
            setNotice(`Deleted “${deleting.name}”.`);
            setDeleting(null);
          }}
        >
          <p className="text-[12.5px] text-cc-t2">
            This cannot be undone. {SAVED_VIEWS_LOCAL_NOTICE.toLowerCase()}, so no one else is affected.
          </p>
        </form>
      </Dialog>
    </ToolbarGroup>
  );
}

// ---------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------

function SaveViewDialog({
  open,
  scope,
  filters,
  sort,
  existing,
  onClose,
  onSave,
}: {
  open: boolean;
  scope: SavedViewScope;
  filters: SavedViewFilterState;
  sort: SavedViewSortState;
  existing: readonly SavedView[];
  onClose: () => void;
  /** Returns a problem to show, or null on success. */
  onSave: (view: SavedView) => string | null;
}) {
  const { live } = useCommandCenterConfig();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setError(null);
  }, [open]);

  const submit = () => {
    const trimmed = name.trim();
    const problems = validateSavedViewDraft({ scope, name: trimmed, filters, sort });
    if (problems.length > 0) {
      setError(problems[0] ?? "That view cannot be saved.");
      return;
    }
    if (existing.some((view) => view.id === savedViewId(scope, trimmed))) {
      setError(`A view named “${trimmed}” already exists.`);
      return;
    }
    const problem = onSave({
      id: savedViewId(scope, trimmed),
      scope,
      name: trimmed,
      filters,
      sort,
      columns: [],
      ownership: { kind: "personal", userId: DEMO_CURRENT_USER_ID },
    });
    setError(problem);
  };

  return (
    <Dialog
      open={open}
      title="Save this view"
      description={`The filters currently applied to ${SCOPE_DESCRIPTORS[scope].label} will be saved under a name you choose.`}
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <DialogSubmitButton label="Save view" form="save-saved-view-form" />
        </>
      }
    >
      <form
        id="save-saved-view-form"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
      <TextField
        label="View name"
        value={name}
        onChange={setName}
        required
        hint={`Up to ${SAVED_VIEW_NAME_MAX} characters.`}
        error={error ?? undefined}
      />
      <fieldset className="mt-3 border-0 p-0">
        <legend className="text-[11.5px] font-semibold text-cc-t2">Who can see it</legend>
        <label className="mt-1.5 flex items-start gap-2 text-[12px] text-cc-ink">
          <input type="radio" name="saved-view-visibility" defaultChecked className="mt-0.5" />
          <span>
            Just me — {SAVED_VIEWS_LOCAL_NOTICE.toLowerCase()}
          </span>
        </label>
        {/* Shown and disabled rather than hidden: the option is real, it is simply not
            available without a workspace database, and the reason is attached to the control
            rather than left for somebody to discover. */}
        <label className="mt-1.5 flex items-start gap-2 text-[12px] text-cc-t3">
          <input
            type="radio"
            name="saved-view-visibility"
            disabled
            aria-describedby="saved-view-shared-reason"
            className="mt-0.5"
          />
          <span>
            My whole workspace
            <span id="saved-view-shared-reason" className="mt-0.5 block text-[11px]">
              {live ? SAVED_VIEWS_PROVIDER_REQUIRED_REASON : SHARED_VIEWS_UNAVAILABLE_REASON}
            </span>
          </span>
        </label>
      </fieldset>
      </form>
    </Dialog>
  );
}

function RenameViewDialog({
  view,
  onClose,
  onRename,
}: {
  view: SavedView | null;
  onClose: () => void;
  onRename: (name: string) => string | null;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (view === null) return;
    setName(view.name);
    setError(null);
  }, [view]);

  return (
    <Dialog
      open={view !== null}
      title="Rename saved view"
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <DialogSubmitButton label="Save name" form="rename-saved-view-form" />
        </>
      }
    >
      <form
        id="rename-saved-view-form"
        onSubmit={(event) => {
          event.preventDefault();
          setError(onRename(name));
        }}
      >
        <TextField
          label="View name"
          value={name}
          onChange={setName}
          required
          hint={`Up to ${SAVED_VIEW_NAME_MAX} characters.`}
          error={error ?? undefined}
        />
      </form>
    </Dialog>
  );
}
