"use client";
// P-D02 · CREATE PROPOSAL (SOURCES) — SCREEN_PROPOSAL_CREATE (Command Center Final.dc.html
// lines 626-638), as a full-page, deep-linkable route. This canonical screen is the source
// picker that opens the proposal builder: it chooses WHERE a new proposal starts from (an
// analysed meeting, a template, a lead, or blank/revision). It is NOT the line-item /
// pricing / terms editor — that is SCREEN_PROPOSAL_BUILDER (P-D03…P-D09) at the separate
// /proposals/[proposal-id]/edit route, so none of those fields are invented here.
//
//   - No provider is connected and no proposal record can be created in demo mode, so
//     "Continue" (which would open the builder / create a draft) is disabled with an honest
//     reason. Nothing is saved, sent, generated, or persisted.
//   - Source selection is a safe, in-memory, non-persistent local interaction. The source
//     descriptions are deterministic, fictional, repository-owned fixtures.
//
// View-model note: the richer proposal presentation contracts (line items, pricing, terms)
// belong to the builder slice; this screen only needs the source options below.
import { useId, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export type ProposalSourceOption = {
  id: "meeting" | "template" | "lead" | "blank";
  title: string;
  description: string;
};

// P-D02 631-634 fixture. Deterministic, fictional, repository-owned. "From meeting" is the
// canonical default (drawn selected in the frame).
export const PROPOSAL_SOURCES: readonly ProposalSourceOption[] = [
  {
    id: "meeting",
    title: "From meeting",
    description: "Solterra discovery · approved Solution Canvas · 14 confirmed requirements",
  },
  {
    id: "template",
    title: "From template",
    description: "AI Automation · Custom Software · Web Application · Workflow Integration · Discovery & Strategy",
  },
  {
    id: "lead",
    title: "From lead",
    description: "Prefill client, service, and inquiry context",
  },
  {
    id: "blank",
    title: "Blank / revision",
    description: "Start clean, or revise PRO-2031 as v3",
  },
];

export const DEFAULT_SOURCE: ProposalSourceOption["id"] = "meeting";

export function CreateView() {
  return (
    <div className="cc-scope mx-auto max-w-3xl font-cc-body">
      <Link
        href="/dashboard/proposals"
        className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-cc-t3 transition-colors hover:text-cc-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to proposals
      </Link>
      <CreateContent />
    </div>
  );
}

// Pure presentation — the only local state is the non-persistent selected source. No hooks
// that touch window/store, so it renders under react-dom/server in the node test env and its
// markup can be asserted directly.
export function CreateContent() {
  const [source, setSource] = useState<ProposalSourceOption["id"]>(DEFAULT_SOURCE);
  const groupId = useId();
  const noteId = useId();

  return (
    <div className="overflow-hidden rounded-cc-card border border-cc-line-strong bg-cc-surface shadow-[0_14px_40px_rgba(20,26,30,.08)]">
      {/* P-D02 627: header + the canonical fact-import subtitle. */}
      <div className="border-b border-cc-line px-[18px] py-[13px]">
        <h1 className="text-[15px] font-semibold text-cc-ink-strong">Create proposal</h1>
        <p className="text-[11.5px] text-cc-t3">
          Only confirmed requirements and approved Canvas content import as fact.
        </p>
      </div>

      {/* P-D02 628-634: the source picker. Native radios give real keyboard operation and
          an accessible checked state for free — the selection is never colour-only. */}
      <fieldset className="px-[18px] py-4">
        <legend className="font-cc-mono text-[10.5px] font-bold tracking-[.08em] text-cc-t-header">
          PROPOSAL SOURCE
        </legend>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {PROPOSAL_SOURCES.map((option) => {
            const selected = source === option.id;
            return (
              <label
                key={option.id}
                className={
                  "cursor-pointer rounded-cc-card border p-[13px] outline-none transition-colors focus-within:ring-2 focus-within:ring-cc-green-border " +
                  (selected
                    ? "border-cc-green bg-cc-green-tint/40 shadow-[0_0_0_3px_rgba(47,125,79,.10)]"
                    : "border-cc-line hover:border-cc-line-strong")
                }
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-semibold text-cc-ink-strong">{option.title}</span>
                  {/* The wrapping label also names this input, but that name is the
                      whole card including the description. An explicit aria-label keeps
                      the accessible name short and stable (the generated group name is
                      not a name at all). */}
                  <input
                    type="radio"
                    name={groupId}
                    value={option.id}
                    aria-label={option.title}
                    checked={selected}
                    onChange={() => setSource(option.id)}
                    className="h-3.5 w-3.5 accent-cc-green"
                  />
                  {selected && <span className="sr-only">Selected</span>}
                </span>
                <span className="mt-1 block text-[11px] leading-[1.5] text-cc-t2">
                  {option.description}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* P-D02 636: footer. Cancel is a plain navigation; Continue would open the proposal
          builder / create a draft, which cannot happen in demo — so it stays disabled with
          an honest reason and never dead-links to the unbuilt builder route. */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-cc-line bg-cc-soft px-[18px] py-3">
        <Link
          href="/dashboard/proposals"
          className="rounded-cc-control border border-cc-line px-3 py-1.5 text-[12px] font-semibold text-cc-t2 outline-none hover:text-cc-ink focus-visible:ring-2 focus-visible:ring-cc-green-border"
        >
          Cancel
        </Link>
        <button
          type="button"
          disabled
          aria-describedby={noteId}
          className="cursor-not-allowed rounded-cc-control bg-cc-green/60 px-3.5 py-1.5 text-[12px] font-semibold text-white/80"
        >
          Continue
        </button>
      </div>

      <p id={noteId} className="border-t border-cc-line px-[18px] py-3 text-[11.5px] leading-[1.5] text-cc-t3">
        No provider is connected in demo mode, so a new proposal cannot be created or saved
        here. Continue opens the proposal builder for the selected source; nothing is drafted,
        sent, generated, or persisted from this screen.
      </p>
    </div>
  );
}
