"use client";
// The Saved View control that sits in a record list's toolbar — live mode.
//
// Same control surface as ../demo/saved-views's demo bar (selector, manage menu, save
// button, status line) but every write goes to app/api/dashboard/saved-views/**, never to
// localStorage. There is no fallback to demo fixtures here: a load failure renders an error
// state, an empty workspace renders an empty selector, and a permission the caller does not
// have renders as a disabled menu item, not a hidden one — the same honesty rule
// lib/views/provider.ts documents for the plane split.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogCancelButton, DialogSubmitButton } from "../demo/dialog";
import { TextField } from "../demo/field";
import { MenuButton, type MenuItem } from "../demo/menu";
import { ToolbarGroup, ToolbarStatus } from "../demo/toolbar";
import {
  canCreateSharedView,
  canEditSavedView,
  defaultFilters,
  duplicateName,
  isDefaultState,
  isDirty,
  SAVED_VIEW_NAME_MAX,
  SCOPE_DESCRIPTORS,
  validateSavedViewDraft,
  type SavedView,
  type SavedViewFilterState,
  type SavedViewScope,
  type SavedViewSortState,
} from "../../lib/views/model";
import { defaultViewsForScope } from "../../lib/views/defaults";
import type { WorkspaceRole } from "../../lib/dashboard/roles";
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

const NO_VIEW = "__none__";

const SELECTOR_CLASS = `${BTN_SELECT} max-w-[220px]`;
const SELECTOR_ACTIVE_CLASS = `${BTN_SELECT} ${VARIANT_SELECTED} max-w-[220px]`;

/** Why the Shared radio is offered but not selectable for this caller. Distinct from
 *  SHARED_VIEWS_UNAVAILABLE_REASON in lib/views/provider.ts, which is about demo mode not
 *  having a workspace database at all — here the database exists, the caller's role does not
 *  qualify. */
const SHARED_REQUIRES_ADMIN_REASON =
  "Only workspace admins and owners can publish a view the whole workspace sees.";

function ManageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <circle cx="3.25" cy="8" r="1.3" />
      <circle cx="8" cy="8" r="1.3" />
      <circle cx="12.75" cy="8" r="1.3" />
    </svg>
  );
}

type Viewer = { userId: string; role: WorkspaceRole };

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; serverViews: SavedView[]; defaultViewId: string | null; viewer: Viewer };

async function parseApi(res: Response): Promise<{ ok: boolean; body: any }> {
  const body = await res.json().catch(() => null);
  return { ok: res.ok && body?.ok === true, body };
}

async function fetchSavedViews(scope: SavedViewScope): Promise<LoadState> {
  try {
    const res = await fetch(`/api/dashboard/saved-views?scope=${encodeURIComponent(scope)}`, {
      headers: { accept: "application/json" },
    });
    const { ok, body } = await parseApi(res);
    if (!ok) {
      return { status: "error", message: body?.error?.message ?? "Saved Views could not be loaded." };
    }
    return {
      status: "ready",
      serverViews: body.views as SavedView[],
      defaultViewId: (body.defaultViewId as string | null) ?? null,
      viewer: body.viewer as Viewer,
    };
  } catch {
    return { status: "error", message: "Saved Views could not be loaded." };
  }
}

async function callApi(
  path: string,
  init: RequestInit,
): Promise<{ ok: true; body: any } | { ok: false; message: string }> {
  try {
    const res = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", accept: "application/json", ...(init.headers ?? {}) },
    });
    const { ok, body } = await parseApi(res);
    if (!ok) return { ok: false, message: body?.error?.message ?? "That could not be completed." };
    return { ok: true, body };
  } catch {
    return { ok: false, message: "That could not be completed." };
  }
}

function createView(
  scope: SavedViewScope,
  name: string,
  filters: SavedViewFilterState,
  sort: SavedViewSortState,
  visibility: "personal" | "shared",
) {
  return callApi("/api/dashboard/saved-views", {
    method: "POST",
    body: JSON.stringify({ scope, name, filters, sort, visibility }),
  });
}

function updateView(
  id: string,
  scope: SavedViewScope,
  name: string,
  filters: SavedViewFilterState,
  sort: SavedViewSortState,
) {
  return callApi(`/api/dashboard/saved-views/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ scope, name, filters, sort }),
  });
}

function deleteViewApi(id: string) {
  return callApi(`/api/dashboard/saved-views/${id}`, { method: "DELETE" });
}

function setDefaultApi(id: string, scope: SavedViewScope, isDefaultFlag: boolean) {
  return callApi(`/api/dashboard/saved-views/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ scope, isDefault: isDefaultFlag }),
  });
}

export function SavedViewsLiveBar({
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
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [appliedDefault, setAppliedDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [renaming, setRenaming] = useState<SavedView | null>(null);
  const [deleting, setDeleting] = useState<SavedView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const descriptor = SCOPE_DESCRIPTORS[scope];

  const refresh = useCallback(async () => {
    const next = await fetchSavedViews(scope);
    setLoad(next);
    return next;
  }, [scope]);

  useEffect(() => {
    let cancelled = false;
    setLoad({ status: "loading" });
    setSelectedId(null);
    setAppliedDefault(false);
    setNotice(null);
    setActionError(null);
    fetchSavedViews(scope).then((next) => {
      if (!cancelled) setLoad(next);
    });
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const views = useMemo(() => {
    const builtins = defaultViewsForScope(scope);
    return load.status === "ready" ? [...builtins, ...load.serverViews] : builtins;
  }, [scope, load]);

  const selected = selectedId === null ? null : (views.find((v) => v.id === selectedId) ?? null);

  // The caller's default view is applied once, after the first successful load, and only if
  // the list is still in its opening state — the same rule the demo bar applies to the
  // browser-local default, for the same reason: a default that overwrote a filter somebody
  // arrived with (a search result, a link) would make shared links unreliable.
  useEffect(() => {
    if (load.status !== "ready" || appliedDefault) return;
    setAppliedDefault(true);
    if (load.defaultViewId === null) return;
    if (!isDefaultState(scope, filters, sort)) return;
    const view = load.serverViews.find((v) => v.id === load.defaultViewId);
    if (view === undefined) return;
    setSelectedId(view.id);
    onApply(view.filters, view.sort);
    // Runs once per load, gated by `appliedDefault` above — `filters`/`sort`/`onApply` are
    // deliberately absent so this does not re-fire on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, appliedDefault]);

  if (load.status === "loading") {
    return (
      <ToolbarGroup>
        <ToolbarStatus>Loading saved views…</ToolbarStatus>
      </ToolbarGroup>
    );
  }

  if (load.status === "error") {
    return (
      <ToolbarGroup>
        <button type="button" disabled aria-describedby={`saved-views-error-${scope}`} className={BTN_DISABLED}>
          Saved views
        </button>
        <span id={`saved-views-error-${scope}`} role="alert" className={`max-w-[420px] ${DISABLED_REASON}`}>
          {load.message}
        </span>
      </ToolbarGroup>
    );
  }

  const viewer = load.viewer;
  const dirty = selected !== null && isDirty(scope, selected, filters, sort);
  const unsavedWithoutView = selected === null && !isDefaultState(scope, filters, sort);
  const savable = dirty || unsavedWithoutView;
  const saveDisabledReason =
    selected === null
      ? "Search, filter or sort this list first — there is nothing to save yet."
      : `“${selected.name}” already matches the filters and sort applied.`;
  const editable = selected !== null && canEditSavedView(selected, viewer);
  const isCallerDefault = selected !== null && load.defaultViewId === selected.id;
  const canDefault =
    selected !== null && selected.ownership.kind === "personal" && selected.ownership.userId === viewer.userId;

  const applyView = (view: SavedView | null) => {
    setSelectedId(view?.id ?? null);
    setNotice(null);
    setActionError(null);
    if (view === null) onApply(defaultFilters(scope), null);
    else onApply(view.filters, view.sort);
  };

  const selectorItems: MenuItem[] = [
    { id: NO_VIEW, label: "No view — all records", selected: selected === null },
    ...views.map((view) => ({
      id: view.id,
      label: view.name,
      detail: load.defaultViewId === view.id ? "default" : undefined,
      selected: view.id === selected?.id,
    })),
  ];

  const dirtyItems: MenuItem[] = [
    ...(dirty && selected !== null && editable
      ? [{ id: "update", label: "Update view", detail: "overwrites" } as MenuItem]
      : []),
    ...(dirty || unsavedWithoutView ? [{ id: "save-as", label: "Save as new view" } as MenuItem] : []),
    ...(dirty ? [{ id: "revert", label: "Revert" } as MenuItem] : []),
    ...(unsavedWithoutView ? [{ id: "clear", label: "Clear filters" } as MenuItem] : []),
  ];

  const manageItems: MenuItem[] = [
    ...dirtyItems,
    ...(selected === null
      ? [{ id: "noop", label: "Select a view to rename, duplicate or delete it", disabled: true } as MenuItem]
      : [
          { id: "rename", label: "Rename", disabled: !editable },
          { id: "duplicate", label: "Duplicate" },
          { id: "delete", label: "Delete", disabled: !editable },
          {
            id: "default",
            label: isCallerDefault ? "Stop opening with this view" : "Open this list with this view",
            disabled: !canDefault,
          },
        ]),
  ];

  const updateSelected = async () => {
    if (selected === null) return;
    setBusy(true);
    const result = await updateView(selected.id, scope, selected.name, filters, sort);
    setBusy(false);
    if (!result.ok) return setActionError(result.message);
    await refresh();
    setNotice(`Updated “${selected.name}”.`);
  };

  const duplicateSelected = async () => {
    if (selected === null) return;
    const name = duplicateName(views, scope, selected.name);
    setBusy(true);
    const result = await createView(scope, name, selected.filters, selected.sort, "personal");
    setBusy(false);
    if (!result.ok) return setActionError(result.message);
    await refresh();
    setSelectedId((result.body.view as SavedView).id);
    setNotice(`Saved “${name}”.`);
  };

  const toggleDefault = async () => {
    if (selected === null) return;
    setBusy(true);
    const result = await setDefaultApi(selected.id, scope, !isCallerDefault);
    setBusy(false);
    if (!result.ok) return setActionError(result.message);
    await refresh();
    setNotice(
      isCallerDefault
        ? `${descriptor.label} will open unfiltered.`
        : `${descriptor.label} will open with “${selected.name}”.`,
    );
  };

  const onManage = (id: string) => {
    if (id === "update") return void updateSelected();
    if (id === "save-as") return setSaving(true);
    if (id === "revert") return applyView(selected);
    if (id === "clear") return applyView(null);
    if (selected === null) return;
    if (id === "rename") setRenaming(selected);
    else if (id === "duplicate") void duplicateSelected();
    else if (id === "delete") setDeleting(selected);
    else if (id === "default") void toggleDefault();
  };

  return (
    <ToolbarGroup>
      {/* SELECTOR */}
      <MenuButton
        label={selected?.name ?? "No saved view"}
        ariaLabel={`Saved view for ${descriptor.label}: ${selected?.name ?? "no view"}`}
        items={selectorItems}
        onSelect={(id) => applyView(id === NO_VIEW ? null : (views.find((v) => v.id === id) ?? null))}
        className={selected ? SELECTOR_ACTIVE_CLASS : SELECTOR_CLASS}
        width={260}
        chevron
        truncate
      />

      {/* MANAGE */}
      <MenuButton
        label={<ManageIcon />}
        ariaLabel={
          selected === null ? "Manage saved views — select a view first" : `Manage saved view ${selected.name}`
        }
        items={manageItems}
        onSelect={onManage}
        className={BTN_ICON}
        align="right"
        width={280}
      />

      {/* SAVE */}
      <button
        type="button"
        disabled={!savable || busy}
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

      {dirty || unsavedWithoutView ? <span className={TOOLBAR_STATUS_DIRTY}>Unsaved changes</span> : null}
      {busy ? <ToolbarStatus>Saving…</ToolbarStatus> : null}

      {notice ? (
        <span role="status" aria-live="polite" className={TOOLBAR_STATUS}>
          {notice}
        </span>
      ) : null}
      {actionError ? (
        <span role="alert" className={TOOLBAR_STATUS_DIRTY}>
          {actionError}
        </span>
      ) : null}

      <SaveViewDialog
        open={saving}
        scope={scope}
        filters={filters}
        sort={sort}
        viewer={viewer}
        onClose={() => setSaving(false)}
        onSave={async (name, visibility) => {
          const result = await createView(scope, name, filters, sort, visibility);
          if (!result.ok) return result.message;
          await refresh();
          setSelectedId((result.body.view as SavedView).id);
          setSaving(false);
          setNotice(`Saved “${name}”.`);
          return null;
        }}
      />

      <RenameViewDialog
        view={renaming}
        onClose={() => setRenaming(null)}
        onRename={async (name) => {
          if (renaming === null) return "That view is no longer available.";
          const result = await updateView(renaming.id, scope, name, renaming.filters, renaming.sort);
          if (!result.ok) return result.message;
          await refresh();
          setSelectedId(renaming.id);
          setRenaming(null);
          setNotice(`Renamed to “${name}”.`);
          return null;
        }}
      />

      <Dialog
        open={deleting !== null}
        title="Delete saved view"
        description={
          deleting === null
            ? undefined
            : `“${deleting.name}” will be removed. Nothing about the records themselves changes.`
        }
        onClose={() => setDeleting(null)}
        footer={
          <>
            <DialogCancelButton onClick={() => setDeleting(null)} />
            <DialogSubmitButton label="Delete view" tone="red" form="delete-saved-view-live-form" />
          </>
        }
      >
        <form
          id="delete-saved-view-live-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (deleting === null) return;
            const target = deleting;
            setBusy(true);
            const result = await deleteViewApi(target.id);
            setBusy(false);
            setDeleting(null);
            if (!result.ok) return setActionError(result.message);
            await refresh();
            if (selectedId === target.id) applyView(null);
            setNotice(`Deleted “${target.name}”.`);
          }}
        >
          <p className="text-[12.5px] text-cc-t2">This cannot be undone.</p>
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
  viewer,
  onClose,
  onSave,
}: {
  open: boolean;
  scope: SavedViewScope;
  filters: SavedViewFilterState;
  sort: SavedViewSortState;
  viewer: Viewer;
  onClose: () => void;
  /** Resolves to a problem to show, or null on success. */
  onSave: (name: string, visibility: "personal" | "shared") => Promise<string | null>;
}) {
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"personal" | "shared">("personal");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const sharedAllowed = canCreateSharedView(viewer);

  useEffect(() => {
    if (!open) return;
    setName("");
    setVisibility("personal");
    setError(null);
  }, [open]);

  const submit = async () => {
    const trimmed = name.trim();
    const problems = validateSavedViewDraft({ scope, name: trimmed, filters, sort });
    if (problems.length > 0) {
      setError(problems[0] ?? "That view cannot be saved.");
      return;
    }
    setSubmitting(true);
    const problem = await onSave(trimmed, visibility);
    setSubmitting(false);
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
          <DialogSubmitButton label={submitting ? "Saving…" : "Save view"} form="save-saved-view-live-form" />
        </>
      }
    >
      <form
        id="save-saved-view-live-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
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
            <input
              type="radio"
              name="saved-view-visibility"
              checked={visibility === "personal"}
              onChange={() => setVisibility("personal")}
              className="mt-0.5"
            />
            <span>Just me</span>
          </label>
          <label className={`mt-1.5 flex items-start gap-2 text-[12px] ${sharedAllowed ? "text-cc-ink" : "text-cc-t3"}`}>
            <input
              type="radio"
              name="saved-view-visibility"
              disabled={!sharedAllowed}
              checked={visibility === "shared"}
              onChange={() => setVisibility("shared")}
              aria-describedby={sharedAllowed ? undefined : "saved-view-shared-reason"}
              className="mt-0.5"
            />
            <span>
              My whole workspace
              {sharedAllowed ? null : (
                <span id="saved-view-shared-reason" className="mt-0.5 block text-[11px]">
                  {SHARED_REQUIRES_ADMIN_REASON}
                </span>
              )}
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
  onRename: (name: string) => Promise<string | null>;
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
          <DialogSubmitButton label="Save name" form="rename-saved-view-live-form" />
        </>
      }
    >
      <form
        id="rename-saved-view-live-form"
        onSubmit={(event) => {
          event.preventDefault();
          void onRename(name).then(setError);
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
