"use client";
// The "New X" create dialogs on Proposals, Pipeline, My Work, Meetings, and
// Follow-ups all open two ways: a toolbar button (local-only) and a command
// palette "Create ..." result that lands on the route with `?new=1` (see
// COMMAND_CREATE_PARAM in lib/search/commands.ts — one name for all of them so
// each route's handling of it is obviously the same as its neighbour's).
//
// Open state is derived, not synchronized: `open` is `local || requested`,
// computed during render, so there is no effect writing local state from a
// prop/URL read. Closing must also consume `?new=1` — otherwise the derived
// `open` would flip back to `true` on the next render because the query
// param never went away.
//
// setQueryParam does a read-modify-write against the current query string via
// history.replaceState (see use-view-query.ts), so it preserves every other
// param, doesn't push a history entry, and doesn't scroll — exactly what
// closing this dialog needs.
import { useCallback, useState } from "react";
import { COMMAND_CREATE_PARAM } from "../../lib/search/commands";
import { setQueryParam, useQueryParam } from "./use-view-query";

export type CommandCreateDialog = {
  open: boolean;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
};

export function useCommandCreateDialog(): CommandCreateDialog {
  const [localOpen, setLocalOpen] = useState(false);
  const requested = useQueryParam(COMMAND_CREATE_PARAM) === "1";

  const openCreateDialog = useCallback(() => setLocalOpen(true), []);
  const closeCreateDialog = useCallback(() => {
    setLocalOpen(false);
    if (requested) setQueryParam(COMMAND_CREATE_PARAM, "");
  }, [requested]);

  return { open: localOpen || requested, openCreateDialog, closeCreateDialog };
}
