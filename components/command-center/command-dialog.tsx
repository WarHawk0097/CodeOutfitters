"use client";
// Universal search and the command palette, in one dialog.
//
// One dialog rather than two because there is only one question behind both: "get me to the
// thing I am thinking about." Sometimes that thing is a record and sometimes it is a screen,
// and making a person decide which kind of control to open before they have typed is a decision
// the software can make for them.
//
// The accessibility shape is the combobox-with-listbox pattern, and the important consequence
// is that DOM focus never leaves the input. Arrow keys move `aria-activedescendant`, not focus,
// which is what lets somebody keep typing to narrow while a row is highlighted. A focus trap
// that moved focus into the list — the pattern components/demo/dialog.tsx uses, correctly, for
// forms — would break that, which is why this dialog is written out here rather than wrapped
// around that one.
//
// What is deliberately absent: no fake latency, no optimistic anything, no animation to
// respect or not respect, and no command that reports success without doing something. Every
// row in this dialog either navigates to a route that exists or is not rendered.
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  availableScopes,
  flattenGroups,
  groupResults,
  searchDocuments,
  MIN_QUERY_LENGTH,
  SEARCH_SCOPE_LABELS,
  type CommandCenterSearchResult,
  type SearchPermissionContext,
  type SearchScope,
} from "../../lib/search/model";
import { buildDemoSearchIndex, demoSearchUniverse } from "../../lib/search/demo-index";
import {
  commandsFor,
  groupCommands,
  matchCommands,
  type CommandCenterCommand,
} from "../../lib/search/commands";
import {
  resolveSearchPlane,
  SEARCH_PROVIDER_REQUIRED_REASON,
  SEARCH_PROVIDER_REQUIRED_TITLE,
} from "../../lib/search/provider";
import {
  parseRecentItems,
  recentItemTypeLabel,
  rememberItem,
  serializeRecentItems,
  usableRecentItems,
  RECENT_ITEMS_NOTICE,
  RECENT_ITEMS_STORAGE_KEY,
  type RecentItem,
} from "../../lib/search/recent-items";
import { DEMO_CURRENT_USER_ID } from "../../lib/demo/seed";
import { useDemoQuery } from "../demo/use-demo-query";
import { useCommandCenterConfig } from "./mode-provider";

export const SEARCH_TRIGGER_LABEL = "Search Command Center";

export const SEARCH_INPUT_LABEL = "Search records and commands";

export const SEARCH_DIALOG_DESCRIPTION =
  "Type to search leads, tasks, meetings, proposals, follow-ups and communications, or to run a command. Use the up and down arrow keys to move through results and Enter to open one.";

/** One navigable row, whatever section it came from. Search results, commands and recent items
 *  share this shape so the arrow keys walk one list rather than three, and so Enter has exactly
 *  one meaning: open `href`. */
type Option = {
  /** DOM id — `aria-activedescendant` points at it. */
  domId: string;
  href: string;
  /** What a screen reader should say for the row, in full. Not a repeat of the visible title:
   *  "Lead, Harbor Logistics, Discovery Done" is specific in a way "Harbor Logistics" is not. */
  accessibleName: string;
  onOpen: () => void;
};

/** An option plus whichever record it was built from, so the row can render the right shape
 *  without a discriminant field that would have to be kept in step with the two builders. */
type Row = Option & {
  result?: CommandCenterSearchResult;
  command?: CommandCenterCommand;
};

type Section = {
  heading: string;
  options: Row[];
};

export function CommandDialog({
  open,
  onClose,
  restoreFocusTo,
}: {
  open: boolean;
  onClose: () => void;
  restoreFocusTo: React.RefObject<HTMLElement | null>;
}) {
  const router = useRouter();
  const { live } = useCommandCenterConfig();
  const { state, status } = useDemoQuery();
  const plane = resolveSearchPlane(live);

  const [text, setText] = useState("");
  const [scope, setScope] = useState<SearchScope>("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<readonly RecentItem[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;
  const listId = `${baseId}-list`;

  // Demo only. In live mode nothing below is reached — the provider-required notice renders
  // instead — so the index is never built from fixtures for a live workspace.
  const documents = useMemo(
    () => (plane.kind === "demo" ? buildDemoSearchIndex(state) : []),
    [plane.kind, state],
  );
  const universe = useMemo(() => demoSearchUniverse(state), [state]);

  const context = useMemo<SearchPermissionContext>(() => {
    const member = state.team.find((candidate) => candidate.id === DEMO_CURRENT_USER_ID);
    return {
      workspaceId: null,
      userId: DEMO_CURRENT_USER_ID,
      // The demo team's roles are the product's own labels ("Administrator", "Sales"); the
      // permission model's are the database's. Anything unrecognised falls to the least
      // privileged role rather than the most, so a fixture gap cannot reveal a control.
      role: member?.role === "Administrator" ? "admin" : "member",
      live,
    };
  }, [state.team, live]);

  const scopes = useMemo(() => availableScopes(documents), [documents]);
  const commands = useMemo(() => commandsFor(context), [context]);

  // Reset per opening rather than per close: a dialog that reopens holding the last query looks
  // broken, and clearing on close would blank the list as it disappears.
  useEffect(() => {
    if (!open) return;
    setText("");
    setScope("all");
    setActiveIndex(0);
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    setRecent(parseRecentItems(window.localStorage.getItem(RECENT_ITEMS_STORAGE_KEY)));
  }, [open]);

  // `openedAt` is a counter, not a clock read. It only ever has to answer "which of these was
  // opened later", and deriving it from the list already stored keeps the demo free of
  // `Date.now()` — so two runs of the same interactions produce the same stored list, which is
  // what makes this testable without freezing time.
  const remember = useCallback((item: Omit<RecentItem, "openedAt">) => {
    if (typeof window === "undefined") return;
    const stored = parseRecentItems(window.localStorage.getItem(RECENT_ITEMS_STORAGE_KEY));
    const highest = stored.reduce((max, entry) => Math.max(max, entry.openedAt), 0);
    const next = rememberItem(stored, { ...item, openedAt: highest + 1 });
    window.localStorage.setItem(RECENT_ITEMS_STORAGE_KEY, serializeRecentItems(next));
    setRecent(next);
  }, []);

  const openHref = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  const trimmed = text.trim();
  const searching = trimmed.length >= MIN_QUERY_LENGTH;

  const results = useMemo(
    () => (searching && plane.kind === "demo" ? searchDocuments(documents, { text, scope }) : []),
    [searching, plane.kind, documents, text, scope],
  );
  const resultGroups = useMemo(() => groupResults(results), [results]);
  const flatResults = useMemo(() => flattenGroups(resultGroups), [resultGroups]);

  const matchedCommands = useMemo(
    () => (searching ? matchCommands(commands, text, 5) : matchCommands(commands, "", 8)),
    [searching, commands, text],
  );

  // Recent items are re-checked against the index and the current role every time the dialog
  // renders them, not when they were stored. A record that has since been deleted, or a screen
  // this role may not open, drops out here rather than becoming a link to a 404.
  const visibleRecent = useMemo(
    () =>
      plane.kind === "demo"
        ? usableRecentItems(recent, { routes: universe.routes, knownIds: universe.ids, context })
        : [],
    [plane.kind, recent, universe, context],
  );

  const sections = useMemo<Section[]>(() => {
    if (plane.kind !== "demo") return [];
    const built: Section[] = [];
    let counter = 0;
    const nextId = () => `${baseId}-option-${counter++}`;

    if (searching) {
      for (const group of resultGroups) {
        built.push({
          heading: group.group,
          options: group.results.map((result) => resultOption(result, nextId(), openHref, remember)),
        });
      }
    } else if (visibleRecent.length > 0) {
      built.push({
        heading: RECENT_ITEMS_NOTICE,
        options: visibleRecent.map((item) => ({
          domId: nextId(),
          href: item.href,
          accessibleName: `${recentItemTypeLabel(item)}, ${item.title}, opened recently on this browser`,
          onOpen: () => openHref(item.href),
        })),
      });
    }

    for (const group of groupCommands(matchedCommands)) {
      built.push({
        heading: group.group,
        options: group.commands.map((command) => commandOption(command, nextId(), openHref)),
      });
    }
    return built;
  }, [
    plane.kind,
    searching,
    resultGroups,
    visibleRecent,
    matchedCommands,
    baseId,
    openHref,
    remember,
  ]);

  const options = useMemo(() => sections.flatMap((section) => section.options), [sections]);

  // A shortened list must not leave the highlight past its end — that would make Enter do
  // nothing, which is the exact failure this dialog is not allowed to have.
  useEffect(() => {
    setActiveIndex((current) => (current >= options.length ? 0 : current));
  }, [options.length]);

  const active = options[activeIndex] ?? null;

  useEffect(() => {
    if (active === null || listRef.current === null) return;
    const node = listRef.current.querySelector<HTMLElement>(`#${CSS.escape(active.domId)}`);
    node?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (options.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + options.length) % options.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      options[activeIndex]?.onOpen();
    }
  };

  // Focus goes back to whatever opened the dialog. Without this, closing with Escape drops
  // focus onto <body> and a keyboard user restarts from the top of the page.
  useEffect(() => {
    if (open) return;
    restoreFocusTo.current?.focus();
  }, [open, restoreFocusTo]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const announcement =
    plane.kind !== "demo"
      ? SEARCH_PROVIDER_REQUIRED_TITLE
      : status === "loading"
        ? "Loading"
        : searching
          ? `${results.length} ${results.length === 1 ? "result" : "results"} for ${trimmed}`
          : `${options.length} suggestions`;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[8vh]">
      {/* Decorative: the dialog is labelled, has Escape, and has a named Close control, so a
          second unnamed control here would only add noise for assistive technology. */}
      <div
        className="absolute inset-0 bg-[rgba(20,26,30,.42)]"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={onKeyDown}
        className="relative flex max-h-[min(560px,calc(100vh-16vh))] w-full max-w-[620px] flex-col overflow-hidden rounded-cc-dialog border border-cc-line bg-cc-surface shadow-[0_24px_64px_rgba(20,26,30,.24)]"
      >
        <h2 id={titleId} className="sr-only">
          {SEARCH_TRIGGER_LABEL}
        </h2>
        <p id={descriptionId} className="sr-only">
          {SEARCH_DIALOG_DESCRIPTION}
        </p>

        <div className="flex items-center gap-2 border-b border-cc-line px-3 py-2.5">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
            className="shrink-0 text-cc-t3"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={options.length > 0}
            aria-controls={listId}
            aria-activedescendant={active?.domId}
            aria-autocomplete="list"
            aria-label={SEARCH_INPUT_LABEL}
            autoComplete="off"
            spellCheck={false}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search records, or type a command…"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-cc-ink outline-none placeholder:text-cc-t3"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${SEARCH_TRIGGER_LABEL}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-cc-control text-cc-t3 hover:bg-cc-secondary"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {plane.kind === "demo" && scopes.length > 1 ? (
          <div
            role="group"
            aria-label="Limit results to one kind of record"
            // Horizontally scrollable rather than wrapping: on a 375px screen seven pills would
            // become three rows and push the results off the bottom of the dialog.
            className="flex gap-1.5 overflow-x-auto border-b border-cc-line px-3 py-2"
          >
            {scopes.map((candidate) => {
              const selected = candidate === scope;
              return (
                <button
                  key={candidate}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setScope(candidate);
                    setActiveIndex(0);
                  }}
                  className={`shrink-0 rounded-cc-control border px-2.5 py-1 text-[11.5px] font-semibold ${
                    selected
                      ? "border-cc-green-border bg-cc-green-tint text-cc-green-ink"
                      : "border-cc-line text-cc-t2 hover:text-cc-ink"
                  }`}
                >
                  {SEARCH_SCOPE_LABELS[candidate]}
                </button>
              );
            })}
          </div>
        ) : null}

        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Search results and commands"
          className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5"
        >
          {plane.kind !== "demo" ? (
            <ProviderRequired />
          ) : status === "loading" ? (
            <p className="px-2.5 py-6 text-center text-[12.5px] text-cc-t3">Loading…</p>
          ) : options.length === 0 ? (
            <NoResults searching={searching} query={trimmed} />
          ) : (
            <SectionList sections={sections} active={active} onActivate={setActiveIndex} />
          )}
        </div>

        <p className="border-t border-cc-line px-3 py-2 text-[11px] text-cc-t3">
          <kbd className="font-cc-mono">↑</kbd> <kbd className="font-cc-mono">↓</kbd> to move ·{" "}
          <kbd className="font-cc-mono">Enter</kbd> to open ·{" "}
          <kbd className="font-cc-mono">Esc</kbd> to close
        </p>

        <span role="status" aria-live="polite" className="sr-only">
          {announcement}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

function resultOption(
  result: CommandCenterSearchResult,
  domId: string,
  openHref: (href: string) => void,
  remember: (item: Omit<RecentItem, "openedAt">) => void,
): Row {
  return {
    domId,
    href: result.href,
    // Type first, because "Proposal" and "Lead" can share a client's name and the row is
    // otherwise ambiguous read aloud. Status and owner follow only when the record has them.
    accessibleName: [result.typeLabel, result.title, result.subtitle, result.status, result.ownerLabel]
      .filter((part) => part !== "" && part !== undefined)
      .join(", "),
    onOpen: () => {
      remember({ type: result.type, id: result.id, href: result.href, title: result.title });
      openHref(result.href);
    },
    result,
  };
}

function commandOption(
  command: CommandCenterCommand,
  domId: string,
  openHref: (href: string) => void,
): Row {
  return {
    domId,
    href: command.href,
    accessibleName: `${command.label}. ${command.detail}`,
    onOpen: () => openHref(command.href),
    command,
  };
}

function SectionList({
  sections,
  active,
  onActivate,
}: {
  sections: readonly Section[];
  active: Option | null;
  onActivate: (index: number) => void;
}) {
  let index = -1;
  return (
    <>
      {sections.map((section) => (
        <div key={`${section.heading}-${section.options[0]?.domId ?? ""}`} className="mb-1">
          {/* `presentation` on the heading: a listbox may only contain options, so a real
              heading element inside it would be an invalid child. The group name is carried
              into each row's accessible name instead, where it is always announced rather than
              only when the reader passes over it. */}
          <p
            role="presentation"
            className="px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[.07em] text-cc-t3"
          >
            {section.heading}
          </p>
          {section.options.map((option) => {
            index += 1;
            const optionIndex = index;
            const selected = active?.domId === option.domId;
            return (
              <OptionRow
                key={option.domId}
                option={option}
                heading={section.heading}
                selected={selected}
                onHover={() => onActivate(optionIndex)}
              />
            );
          })}
        </div>
      ))}
    </>
  );
}

function OptionRow({
  option,
  heading,
  selected,
  onHover,
}: {
  option: Row;
  heading: string;
  selected: boolean;
  onHover: () => void;
}) {
  const result = option.result;
  const command = option.command;
  return (
    <div
      id={option.domId}
      role="option"
      aria-selected={selected}
      aria-label={`${heading}. ${option.accessibleName}`}
      // Pointer and touch both land here. `onMouseDown` rather than `onClick` so the input does
      // not lose focus first and close the dialog out from under the tap.
      onMouseDown={(event) => {
        event.preventDefault();
        option.onOpen();
      }}
      onMouseEnter={onHover}
      className={`flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-cc-control px-2.5 py-1.5 ${
        selected ? "bg-cc-secondary" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          {/* The record kind is text, never an icon alone — an icon-only type marker is
              unreadable to a screen reader and ambiguous in high contrast. */}
          <span className="shrink-0 font-cc-mono text-[10px] uppercase tracking-[.06em] text-cc-t3">
            {result?.typeLabel ?? command?.group ?? ""}
          </span>
          <span className="truncate text-[13px] font-semibold text-cc-ink">
            {result?.title ?? command?.label ?? ""}
          </span>
        </div>
        <p className="truncate text-[11.5px] text-cc-t3">
          {result ? [result.subtitle, result.status, result.ownerLabel].filter(Boolean).join(" · ") : (command?.detail ?? "")}
        </p>
      </div>
      {result?.timestampLabel ? (
        <span className="shrink-0 font-cc-mono text-[10.5px] text-cc-t3">{result.timestampLabel}</span>
      ) : null}
    </div>
  );
}

function NoResults({ searching, query }: { searching: boolean; query: string }) {
  return (
    <p className="px-2.5 py-6 text-center text-[12.5px] text-cc-t3">
      {searching
        ? `Nothing matches “${query}”. Try a lead, a company, a proposal number or fewer words.`
        : `Type at least ${MIN_QUERY_LENGTH} characters to search records, or pick a command below.`}
    </p>
  );
}

function ProviderRequired() {
  return (
    <div className="px-3 py-6">
      <p className="text-[13px] font-semibold text-cc-ink">{SEARCH_PROVIDER_REQUIRED_TITLE}</p>
      <p className="mt-1 text-[12px] leading-[1.5] text-cc-t3">{SEARCH_PROVIDER_REQUIRED_REASON}</p>
    </div>
  );
}
