// Release 4 — UNIVERSAL SEARCH UI (tests 22-40).
//
// The dialog is a client component, so these are source-surface tests in this repository's
// existing idiom for `.tsx`. What they guard is the set of properties that are invisible when
// correct and expensive when wrong: the combobox/listbox wiring the keyboard depends on, the
// focus return that a keyboard user notices immediately, the states that must exist instead of
// an empty box, and the rule that no row is rendered unless it opens something real.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  SEARCH_DIALOG_DESCRIPTION,
  SEARCH_INPUT_LABEL,
  SEARCH_TRIGGER_LABEL,
} from "./command-dialog";
import {
  availableScopes,
  groupResults,
  searchDocuments,
  MIN_QUERY_LENGTH,
  SEARCH_SCOPE_LABELS,
  SEARCH_SCOPES,
} from "../../lib/search/model";
import { buildDemoSearchIndex } from "../../lib/search/demo-index";
import { SEARCH_PROVIDER_REQUIRED_REASON, SEARCH_PROVIDER_REQUIRED_TITLE } from "../../lib/search/provider";
import { RECENT_ITEMS_NOTICE } from "../../lib/search/recent-items";
import { createSeedState } from "../../lib/demo/seed";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(`${repo}${path}`, "utf8");
const dialog = read("components/command-center/command-dialog.tsx");
const mount = read("components/command-center/command-center.tsx");
const shell = read("app/dashboard/shell-nav.tsx");
const layout = read("app/dashboard/layout.tsx");

const documents = buildDemoSearchIndex(createSeedState());

describe("universal search dialog (tests 22-40)", () => {
  // 22
  it("has one trigger label, used by both shapes of the control", () => {
    expect(SEARCH_TRIGGER_LABEL).toBe("Search Command Center");
    expect(mount.match(/aria-label=\{SEARCH_TRIGGER_LABEL\}/g)?.length).toBe(2);
    // The icon shape is not a second, unnamed control: it carries the same name and the same
    // shortcut hint as the field.
    expect(mount.match(/aria-keyshortcuts="Control\+K Meta\+K"/g)?.length).toBe(2);
    // The magnifier is decoration in both.
    expect(mount.match(/aria-hidden="true"/g)?.length).toBeGreaterThanOrEqual(2);
  });

  // 23
  it("is reachable by pointer on every viewport, not only by keyboard", () => {
    // Desktop field, tablet icon, and a phone slot that renders when the desktop slot does not.
    expect(shell).toContain('<CommandCenterTrigger variant="field" />');
    expect(shell).toContain('<span className="xl:hidden">');
    expect(shell).toContain("mobileRight");
    expect(shell.match(/<CommandCenterTrigger variant="icon" \/>/g)?.length).toBe(2);
    // Exactly one dialog for the whole shell, mounted at the layout, so two triggers can never
    // open two dialogs with the same shortcut.
    expect(layout).toContain("<CommandCenterProvider>");
    expect(mount.match(/<CommandDialog/g)?.length).toBe(1);
    expect(shell).not.toContain("<CommandDialog");
  });

  // 24
  it("opens on Ctrl+K and on Command+K, on either platform", () => {
    expect(mount).toContain("const modifier = event.metaKey || event.ctrlKey;");
    expect(mount).toContain('if (modifier && (event.key === "k" || event.key === "K"))');
    // The browser's own find-links shortcut must not also fire.
    expect(mount).toContain("event.preventDefault();");
    // The platform hint is read on the client only; guessing it during SSR is a hydration
    // mismatch on half the machines that load the page.
    expect(mount).toContain('const [hint, setHint] = useState("Ctrl K");');
    expect(mount).toContain('setHint("⌘ K")');
  });

  // 25
  it("keeps the bare slash shortcut out of anything a person is typing into", () => {
    expect(mount).toContain('if (event.key === "/" && !modifier && !event.altKey && !isTypingTarget(event.target))');
    expect(mount).toContain("if (target.isContentEditable) return true;");
    expect(mount).toContain('return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";');
  });

  // 26
  it("is a labelled modal dialog with a description a screen reader can use", () => {
    expect(dialog).toContain('role="dialog"');
    expect(dialog).toContain('aria-modal="true"');
    expect(dialog).toContain("aria-labelledby={titleId}");
    expect(dialog).toContain("aria-describedby={descriptionId}");
    expect(dialog).toContain("{SEARCH_TRIGGER_LABEL}");
    expect(dialog).toContain("{SEARCH_DIALOG_DESCRIPTION}");
    // The description says what to type and how to move, in words.
    expect(SEARCH_DIALOG_DESCRIPTION).toContain("arrow keys");
    expect(SEARCH_DIALOG_DESCRIPTION).toContain("Enter");
    expect(SEARCH_INPUT_LABEL).toBe("Search records and commands");
    // The backdrop closes on click but is hidden from assistive technology, which already has
    // Escape and a named Close control.
    expect(dialog).toContain('aria-hidden="true"\n        onClick={onClose}');
  });

  // 27
  it("wires the input as a combobox over the results list", () => {
    expect(dialog).toContain('role="combobox"');
    expect(dialog).toContain("aria-expanded={options.length > 0}");
    expect(dialog).toContain("aria-controls={listId}");
    expect(dialog).toContain("aria-activedescendant={active?.domId}");
    expect(dialog).toContain('aria-autocomplete="list"');
    expect(dialog).toContain("aria-label={SEARCH_INPUT_LABEL}");
    expect(dialog).toContain('autoComplete="off"');
  });

  // 28
  it("renders the results as a listbox of options with a selected state", () => {
    expect(dialog).toContain('role="listbox"');
    expect(dialog).toContain('aria-label="Search results and commands"');
    expect(dialog).toContain('role="option"');
    expect(dialog).toContain("aria-selected={selected}");
    // Each option carries its section in its accessible name, because a group heading rendered
    // as presentational text is not announced on its own.
    expect(dialog).toContain("aria-label={`${heading}. ${option.accessibleName}`}");
    expect(dialog).toContain('role="presentation"');
  });

  // 29
  it("moves the highlight with the arrow keys without moving focus, and opens on Enter", () => {
    for (const key of ["ArrowDown", "ArrowUp", "Home", "End", "Enter", "Escape"]) {
      expect(dialog, key).toContain(`event.key === "${key}"`);
    }
    expect(dialog).toContain("setActiveIndex((current) => (current + 1) % options.length);");
    expect(dialog).toContain("setActiveIndex((current) => (current - 1 + options.length) % options.length);");
    expect(dialog).toContain("options[activeIndex]?.onOpen();");
    // Focus stays in the input — there is no focus trap moving it into the list, which is what
    // would stop somebody typing to narrow while a row is highlighted.
    expect(dialog).not.toContain("node?.focus()");
    expect(dialog).toContain('node?.scrollIntoView({ block: "nearest" });');
  });

  // 30
  it("never leaves the highlight past the end of a list that just got shorter", () => {
    expect(dialog).toContain("setActiveIndex((current) => (current >= options.length ? 0 : current));");
    expect(dialog).toContain("}, [options.length]);");
    // Typing also resets to the top, so Enter opens the best match rather than whatever was
    // highlighted two keystrokes ago.
    expect(dialog).toContain("setText(event.target.value);\n              setActiveIndex(0);");
  });

  // 31
  it("focuses the input when it opens and gives focus back when it closes", () => {
    expect(dialog).toContain("inputRef.current?.focus();");
    expect(dialog).toContain("restoreFocusTo.current?.focus();");
    expect(dialog).toContain("}, [open, restoreFocusTo]);");
    // The trigger passes itself; the shortcut passes whatever had focus.
    expect(mount).toContain("onClick={() => openDialog(ref.current)}");
    expect(mount).toContain("document.activeElement instanceof HTMLElement ? document.activeElement : null");
  });

  // 32
  it("offers only the scopes the index can actually fill", () => {
    const scopes = availableScopes(documents);
    expect(scopes[0]).toBe("all");
    for (const scope of scopes) expect(SEARCH_SCOPES).toContain(scope);
    // Every offered scope returns something for at least one query, so no filter is a dead end.
    for (const scope of scopes.filter((candidate) => candidate !== "all")) {
      expect(documents.some((document) => searchDocuments([document], { text: document.title, scope }).length > 0)).toBe(
        true,
      );
      expect(SEARCH_SCOPE_LABELS[scope].trim()).not.toBe("");
    }
    // The filter row is not rendered at all when there is only "all" to choose.
    expect(dialog).toContain("scopes.length > 1");
    expect(dialog).toContain("aria-pressed={selected}");
  });

  // 33
  it("groups results under headings, in a stable order", () => {
    const results = searchDocuments(documents, { text: "north", scope: "all" });
    const groups = groupResults(results);
    expect(groups.length).toBeGreaterThan(1);
    // The same query gives the same headings in the same order every time — a palette whose
    // sections reshuffle between keystrokes cannot be used by muscle memory.
    expect(groups.map((group) => group.group)).toEqual(
      groupResults(searchDocuments(documents, { text: "north", scope: "all" })).map((group) => group.group),
    );
    expect(new Set(groups.map((group) => group.group)).size).toBe(groups.length);
    for (const group of groups) expect(group.results.length).toBeGreaterThan(0);
    // Rendering walks the same groups, so the visual order and the arrow-key order are one list.
    expect(dialog).toContain("const options = useMemo(() => sections.flatMap((section) => section.options), [sections]);");
  });

  // 34
  it("shows recent items and commands when the query is empty, rather than an empty box", () => {
    expect(dialog).toContain("} else if (visibleRecent.length > 0) {");
    expect(dialog).toContain("heading: RECENT_ITEMS_NOTICE,");
    expect(RECENT_ITEMS_NOTICE).toBe("Recent on this browser");
    // Commands are listed under both conditions: a few alongside results, more when idle.
    expect(dialog).toContain('matchCommands(commands, text, 5) : matchCommands(commands, "", 8)');
  });

  // 35
  it("says what to do next when there is nothing to show", () => {
    expect(dialog).toContain("<NoResults searching={searching} query={trimmed} />");
    expect(dialog).toContain("Nothing matches “${query}”.");
    expect(dialog).toContain("Try a lead, a company, a proposal number or fewer words.");
    expect(dialog).toContain("Type at least ${MIN_QUERY_LENGTH} characters to search records");
    expect(MIN_QUERY_LENGTH).toBe(2);
  });

  // 36
  it("has a loading state and does not search a query too short to mean anything", () => {
    expect(dialog).toContain('status === "loading"');
    expect(dialog).toContain("Loading…");
    expect(dialog).toContain("const searching = trimmed.length >= MIN_QUERY_LENGTH;");
  });

  // 37
  it("renders the provider-required state in live mode, with no demo records behind it", () => {
    expect(dialog).toContain('plane.kind !== "demo" ? (\n            <ProviderRequired />');
    expect(dialog).toContain("{SEARCH_PROVIDER_REQUIRED_TITLE}");
    expect(dialog).toContain("{SEARCH_PROVIDER_REQUIRED_REASON}");
    expect(SEARCH_PROVIDER_REQUIRED_TITLE.trim().length).toBeGreaterThan(0);
    expect(SEARCH_PROVIDER_REQUIRED_REASON.trim().length).toBeGreaterThan(40);
    // The index itself is never built outside demo mode, so there is nothing to fall back to.
    expect(dialog).toContain('() => (plane.kind === "demo" ? buildDemoSearchIndex(state) : [])');
    expect(dialog).toContain('const sections = useMemo<Section[]>(() => {\n    if (plane.kind !== "demo") return [];');
  });

  // 38
  it("names the record kind in text, and adds context only when there is context to add", () => {
    expect(dialog).toContain('{result?.typeLabel ?? command?.group ?? ""}');
    expect(dialog).toContain('[result.subtitle, result.status, result.ownerLabel].filter(Boolean).join(" · ")');
    expect(dialog).toContain("{result.timestampLabel}");
    // The spoken name leads with the kind, because a client's name alone is ambiguous between a
    // lead and the proposal written for it.
    expect(dialog).toContain(
      "accessibleName: [result.typeLabel, result.title, result.subtitle, result.status, result.ownerLabel]",
    );
  });

  // 39
  it("renders no row that does not open something, and announces what it found", () => {
    expect(dialog).not.toContain('href="#"');
    expect(dialog).toContain("router.push(href);");
    // Both row builders take an href from their record; neither has a no-op branch.
    expect(dialog).toContain("href: result.href,");
    expect(dialog).toContain("href: command.href,");
    expect(dialog).toContain('role="status" aria-live="polite"');
    expect(dialog).toContain("{announcement}");
  });

  // 40
  it("fits a small viewport, scrolls inside itself, and keeps rows thumb-sized", () => {
    // Height is capped against the viewport, and the scrolling happens in the results region so
    // the input and the key hints stay put.
    expect(dialog).toContain("max-h-[min(560px,calc(100vh-16vh))]");
    expect(dialog).toContain("min-h-0 flex-1 overflow-y-auto");
    expect(dialog).toContain("overflow-hidden rounded-cc-dialog");
    // Scope pills scroll sideways rather than wrapping into a tall block on a phone.
    expect(dialog).toContain("overflow-x-auto border-b border-cc-line");
    // A row is at least 44px tall, and touch opens it on pointer-down so the tap does not land
    // on whatever the closing dialog uncovers.
    expect(dialog).toContain("min-h-[44px]");
    expect(dialog).toContain("onMouseDown={(event) => {");
    // The page behind does not scroll while the dialog is open.
    expect(dialog).toContain('document.body.style.overflow');
  });
});
