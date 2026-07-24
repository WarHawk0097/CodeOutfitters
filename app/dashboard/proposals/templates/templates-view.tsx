"use client";
// P-D02 / P-D14 · PROPOSAL TEMPLATES — SCREEN_PROPOSAL_TEMPLATES (routes.json /proposals/templates,
// frames P-D02 + P-D14). The canonical template model lives in
// integration-layer/proposal-templates.json and is deliberately small: five named starting
// templates, each of which DEFINES section order, default copy, required information and visual
// variants — and, by canon, a template NEVER carries hard-coded prices or timelines (those are
// set per proposal in the builder).
//
// So this screen is a template catalogue with a local, read-only preview — NOT a SaaS template
// library. No usage counts, owners, statuses, categories, thumbnails, or save/duplicate/delete/
// publish actions are invented, because none are canonically evidenced. "Use template" is the one
// canonical forward action; it would open SCREEN_PROPOSAL_BUILDER (/proposals/[proposal-id]/edit),
// which is not built yet, so it stays disabled with an honest reason and never dead-links.
import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Dialog, DialogCancelButton } from "../../../../components/demo/dialog";
import { RouteToolbar, SearchInput, ToolbarButton } from "../../../../components/demo/toolbar";
import { RouteEmpty } from "../../../../components/demo/route-states";

export type ProposalTemplateViewModel = {
  id: string;
  // Verbatim canonical name (proposal-templates.json).
  name: string;
  // A clearly-sample one-line description. Deterministic, fictional, repository-owned. It never
  // states a price or timeline — those are forbidden on a template by canon.
  description: string;
};

// The five canonical templates, verbatim from integration-layer/proposal-templates.json.
export const PROPOSAL_TEMPLATES: readonly ProposalTemplateViewModel[] = [
  {
    id: "ai-automation",
    name: "AI Automation",
    description: "Sample outline for an AI automation engagement — problem framing, solution narrative and delivery approach.",
  },
  {
    id: "custom-software",
    name: "Custom Software",
    description: "Sample outline for a custom software build — scope, architecture summary and delivery approach.",
  },
  {
    id: "web-application",
    name: "Web Application",
    description: "Sample outline for a web application project — experience goals, scope and delivery approach.",
  },
  {
    id: "workflow-integration",
    name: "Workflow Integration",
    description: "Sample outline for a workflow integration — systems in scope, data flow and delivery approach.",
  },
  {
    id: "discovery-and-strategy",
    name: "Discovery and Strategy",
    description: "Sample outline for a discovery and strategy engagement — objectives, activities and outcomes.",
  },
];

// What a template DEFINES (proposal-templates.json "define"), and what it must never carry
// (proposal-templates.json "forbidden"). Shared across every template by canon.
export const TEMPLATE_DEFINES: readonly string[] = [
  "Section order",
  "Default copy",
  "Required information",
  "Visual variants",
];
export const TEMPLATE_EXCLUDES: readonly string[] = ["Hard-coded prices", "Hard-coded timelines"];

/** Pure, deterministic, case-insensitive name/description search. No side effects. */
export function filterTemplates(
  list: readonly ProposalTemplateViewModel[],
  query: string,
): readonly ProposalTemplateViewModel[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return list;
  return list.filter(
    (t) => t.name.toLowerCase().includes(needle) || t.description.toLowerCase().includes(needle),
  );
}

export function TemplatesView() {
  return (
    <div className="cc-scope mx-auto max-w-4xl font-cc-body">
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium">
        <Link
          href="/dashboard/proposals"
          className="inline-flex items-center gap-1 text-cc-t3 transition-colors hover:text-cc-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to proposals
        </Link>
        <Link
          href="/dashboard/proposals/new"
          className="text-cc-t3 transition-colors hover:text-cc-ink"
        >
          Back to proposal source
        </Link>
      </div>
      <TemplatesContent />
    </div>
  );
}

// Pure presentation. The only local state is the non-persistent search text and the selected
// template id used to open the read-only preview. The preview dialog is mounted only while a
// template is selected, so the default markup renders under react-dom/server for tests.
export function TemplatesContent() {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const noteId = useId();

  const rows = useMemo(() => filterTemplates(PROPOSAL_TEMPLATES, q), [q]);
  const selected = selectedId ? PROPOSAL_TEMPLATES.find((t) => t.id === selectedId) ?? null : null;

  return (
    <div className="overflow-hidden rounded-cc-card border border-cc-line-strong bg-cc-surface shadow-[0_14px_40px_rgba(20,26,30,.08)]">
      {/* Header — states the honest posture: these are sample starting points, not a stored library. */}
      <div className="border-b border-cc-line px-[18px] py-[13px]">
        <h1 className="text-[15px] font-semibold text-cc-ink-strong">Proposal templates</h1>
        <p className="text-[11.5px] text-cc-t3">
          Sample starting points for a new proposal. A template sets the section order and default
          copy — prices and timelines are always set per proposal, never in the template.
        </p>
      </div>

      <div className="px-[18px] py-4">
        <RouteToolbar>
          <SearchInput value={q} onChange={setQ} label="Search templates by name" />
          {q ? <ToolbarButton label="Clear search" onClick={() => setQ("")} /> : null}
        </RouteToolbar>

        {rows.length === 0 ? (
          <RouteEmpty title="No templates match your search" hint="Clear the search to see every template." />
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {rows.map((template) => (
              <li key={template.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(template.id)}
                  className="flex h-full w-full flex-col rounded-cc-card border border-cc-line p-[13px] text-left outline-none transition-colors hover:border-cc-green-border focus-visible:ring-2 focus-visible:ring-cc-green-border"
                >
                  <span className="text-[12.5px] font-semibold text-cc-ink-strong">{template.name}</span>
                  <span className="mt-1 block text-[11px] leading-[1.5] text-cc-t2">{template.description}</span>
                  <span className="mt-2 font-cc-mono text-[9.5px] font-semibold tracking-[.06em] text-cc-t3">
                    PREVIEW
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p id={noteId} className="border-t border-cc-line px-[18px] py-3 text-[11.5px] leading-[1.5] text-cc-t3">
        Templates are read-only samples in this demo workspace. Selecting one opens a local preview;
        nothing is created, saved, or sent. Editing templates and starting a proposal from one are
        available in the live workspace.
      </p>

      {selected ? <TemplatePreviewDialog template={selected} onClose={() => setSelectedId(null)} /> : null}
    </div>
  );
}

// Read-only preview. "Use template" is the one canonical forward action, but it would open the
// proposal builder, which is not built yet — so it is disabled with an honest reason and never
// dead-links.
function TemplatePreviewDialog({
  template,
  onClose,
}: {
  template: ProposalTemplateViewModel;
  onClose: () => void;
}) {
  const reasonId = "use-template-reason";
  return (
    <Dialog
      open
      title={`Preview — ${template.name}`}
      description="Sample template · read-only in this demo workspace"
      onClose={onClose}
      width={520}
      footer={
        <>
          <DialogCancelButton onClick={onClose} label="Close" />
          <button
            type="button"
            disabled
            aria-describedby={reasonId}
            className="cursor-not-allowed rounded-cc-control bg-cc-green/60 px-3 py-1.5 text-[12.5px] font-semibold text-white/80"
          >
            Use template
          </button>
        </>
      }
    >
      <TemplatePreviewBody template={template} reasonId={reasonId} />
    </Dialog>
  );
}

/** Pure preview body — rendered inside the dialog, and exercised directly in tests. */
export function TemplatePreviewBody({
  template,
  reasonId,
}: {
  template: ProposalTemplateViewModel;
  reasonId: string;
}) {
  return (
    <div className="text-[12.5px] leading-[1.6] text-cc-t-table">
      <p>{template.description}</p>

      <h3 className="mt-4 font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">THIS TEMPLATE DEFINES</h3>
      <ul className="mt-1 list-disc pl-5">
        {TEMPLATE_DEFINES.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h3 className="mt-4 font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">NEVER IN A TEMPLATE</h3>
      <ul className="mt-1 list-disc pl-5 text-cc-t3">
        {TEMPLATE_EXCLUDES.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mt-1 text-[11px] text-cc-t3">Prices and timelines are set per proposal in the builder.</p>

      <p id={reasonId} className="mt-4 text-[11.5px] text-cc-t3">
        Starting a proposal from a template is available in the live workspace. Nothing is created
        or saved from this preview.
      </p>
    </div>
  );
}
