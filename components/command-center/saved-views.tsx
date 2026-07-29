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

const NO_VIEW = "__none__";

const CONTROL_CLASS =
  "rounded-cc-control border border-cc-line-strong bg-cc-surface px-[11px] py-[7px] text-[12px] font-semibold text-cc-t-table";

const ACTIVE_CONTROL_CLASS =
  "rounded-cc-control border border-cc-green-border bg-cc-green-tint px-[11px] py-[7px] text-[12px] font-semibold text-cc-green-ink";

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

  if (plane.kind !== "demo") {
    return (
      <span className="flex items-center gap-2">
        <button
          type="button"
          disabled
          aria-describedby={`saved-views-unavailable-${scope}`}
          className={`${CONTROL_CLASS} cursor-not-allowed opacity-60`}
        >
          Saved views
        </button>
        <span id={`saved-views-unavailable-${scope}`} className="max-w-[420px] text-[11px] text-cc-t3">
          {SAVED_VIEWS_PROVIDER_REQUIRED_TITLE}. {SAVED_VIEWS_PROVIDER_REQUIRED_REASON}
        </span>
      </span>
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

  const manageItems: MenuItem[] = selected === null
    ? [{ id: "noop", label: "Select a view to manage it", disabled: true }]
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

  const onManage = (id: string) => {
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
    <span className="flex flex-wrap items-center gap-2">
      <MenuButton
        label={`${selected?.name ?? "No view"} ▾`}
        ariaLabel={`Saved view for ${descriptor.label}: ${selected?.name ?? "no view"}`}
        items={selectorItems}
        onSelect={(id) => applyView(id === NO_VIEW ? null : (findView(state, id) ?? null))}
        className={selected ? ACTIVE_CONTROL_CLASS : CONTROL_CLASS}
        width={260}
      />

      <MenuButton
        label="⋯"
        ariaLabel={
          selected === null
            ? "Manage saved views — select a view first"
            : `Manage saved view ${selected.name}`
        }
        items={manageItems}
        onSelect={onManage}
        className={CONTROL_CLASS}
        align="right"
        width={260}
      />

      {dirty || unsavedWithoutView ? (
        <>
          {/* Textual, not a coloured dot. A state a person has to have been told the meaning of
              is not a state that has been communicated. */}
          <span className="text-[11.5px] font-semibold text-cc-amber-ink">Unsaved changes</span>
          {dirty && selected !== null && selected.ownership.kind !== "builtIn" ? (
            <button
              type="button"
              className={CONTROL_CLASS}
              onClick={() => {
                const updated: SavedView = { ...selected, filters, sort };
                const result = saveView(state, updated, { replace: true });
                if (!result.ok) {
                  setNotice(result.problem);
                  return;
                }
                commit(result.state);
                setNotice(`Updated “${selected.name}”.`);
              }}
            >
              Update view
            </button>
          ) : null}
          <button type="button" className={CONTROL_CLASS} onClick={() => setSaving(true)}>
            Save as new view
          </button>
          {selected !== null ? (
            <button type="button" className={CONTROL_CLASS} onClick={() => applyView(selected)}>
              Revert
            </button>
          ) : (
            <button type="button" className={CONTROL_CLASS} onClick={() => applyView(null)}>
              Clear filters
            </button>
          )}
        </>
      ) : (
        <button type="button" className={CONTROL_CLASS} onClick={() => setSaving(true)}>
          Save view
        </button>
      )}

      <span className="text-[11px] text-cc-t3">{SAVED_VIEWS_LOCAL_NOTICE}</span>

      {notice ? (
        <span role="status" aria-live="polite" className="text-[11px] text-cc-t3">
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
    </span>
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
