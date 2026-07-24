"use client";
// P-D12 / P-D15..P-D17 + PDF-01..15 · PROPOSAL PREVIEW — SCREEN_PROPOSAL_PREVIEW (routes.json
// /proposals/[proposal-id]/preview). This is the internal, read-only assembled preview: the proposal
// rendered page-for-page exactly as the PDF and the client secure view present it, one canonical page
// at a time, with a preview toolbar (page navigation, zoom, print layout).
//
// It is a demo-presentation island. It reads a real, deterministic proposal from the client demo store
// (lib/demo) and renders the canonical assembled document from the shared proposal domain
// (lib/command-center/proposals) — the same $86,400 total, milestone schedule, and validation the
// builder uses. Because demo builder edits are non-persistent, the preview shows the SAVED proposal,
// never unsaved local edits. Every backend/approval-gated action — PDF generation & download, Send,
// the secure client link — is disabled with an honest reason and never dead-links. A blocked
// validation finding holds the send gate (state-machines.json: blocked prevents send). Content is real,
// selectable DOM: nothing is canvas-rendered text.
import { useId, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import type { Proposal } from "../../../../../lib/demo/types";
import { useDemoQuery } from "../../../../../components/demo/use-demo-query";
import { RouteError, RouteLoading } from "../../../../../components/demo/route-states";
import { formatUsd } from "../../../../../lib/command-center/proposals/money";
import { isSendBlocked, unresolvedCount } from "../../../../../lib/command-center/proposals/validation";
import { buildPreviewDocument, CANONICAL_DEMO_PROPOSAL_ID } from "../../../../../lib/command-center/proposals/fixtures";
import type {
  DocBlock,
  PdfStatus,
  ProposalDocPage,
  ProposalPreviewDocument,
  ValidationItem,
  ValidationStatus,
} from "../../../../../lib/command-center/proposals/model";

export { CANONICAL_DEMO_PROPOSAL_ID };

// ─── Zoom (local, non-persistent; fit-width / fit-page / discrete %) ──────────────────────────────
export type ZoomMode = "fit-width" | "fit-page" | number;
export const ZOOM_STEPS = [75, 100, 125, 150] as const;

export function zoomLabel(zoom: ZoomMode): string {
  return zoom === "fit-width" ? "Fit width" : zoom === "fit-page" ? "Fit page" : `${zoom}%`;
}

/** Next/previous discrete zoom %, clamped. Fit modes step into the % ladder at 100%. */
export function stepZoom(zoom: ZoomMode, dir: -1 | 1): ZoomMode {
  const current = typeof zoom === "number" ? zoom : 100;
  const idx = ZOOM_STEPS.indexOf(current as (typeof ZOOM_STEPS)[number]);
  const nextIdx = Math.min(ZOOM_STEPS.length - 1, Math.max(0, (idx === -1 ? 1 : idx) + dir));
  return ZOOM_STEPS[nextIdx];
}

/** Scale factor for a page at a given zoom. Fit modes are handled by CSS width, so they map to 1. */
export function zoomScale(zoom: ZoomMode): number {
  return typeof zoom === "number" ? zoom / 100 : 1;
}

/** Clamp a page index into range. */
export function clampPage(index: number, count: number): number {
  return Math.min(count - 1, Math.max(0, index));
}

// ─── Route shell: store lookup + loading / error / not-found ──────────────────────────────────────
export function ProposalPreviewView({ proposalId }: { proposalId: string }) {
  const { state, status, error, retry } = useDemoQuery();

  if (status === "loading") return <RouteLoading label="proposal preview" />;
  if (status === "error") return <RouteError label="proposal preview" error={error!} onRetry={retry} />;

  const proposal = state.proposals.find((p) => p.id === proposalId) ?? null;
  if (!proposal) return <PreviewNotFound proposalId={proposalId} />;

  return <PreviewWorkspace proposal={proposal} document={buildPreviewDocument(proposal)} />;
}

export function PreviewNotFound({ proposalId }: { proposalId: string }) {
  return (
    <div className="cc-scope mx-auto max-w-2xl font-cc-body">
      <BackLink proposalId={proposalId} />
      <div className="rounded-cc-card border border-cc-line-strong bg-cc-surface p-8 text-center shadow-[0_14px_40px_rgba(20,26,30,.08)]">
        <h1 className="text-[15px] font-semibold text-cc-ink-strong">Proposal not found</h1>
        <p className="mx-auto mt-2 max-w-md text-[12px] leading-[1.6] text-cc-t3">
          Proposal <span className="font-cc-mono text-cc-ink">{proposalId}</span> isn&apos;t in this demo
          workspace, so there is nothing to preview.
        </p>
        <Link
          href="/dashboard/proposals"
          className="mt-4 inline-flex rounded-cc-control border border-cc-line px-3 py-1.5 text-[12px] font-semibold text-cc-ink transition-colors hover:border-cc-green-border"
        >
          Back to proposals
        </Link>
      </div>
    </div>
  );
}

function BackLink({ proposalId }: { proposalId: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium">
      <Link href="/dashboard/proposals" className="inline-flex items-center gap-1 text-cc-t3 transition-colors hover:text-cc-ink">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to proposals
      </Link>
      <Link href={`/dashboard/proposals/${proposalId}/edit`} className="text-cc-t3 transition-colors hover:text-cc-ink">
        Back to editor
      </Link>
    </div>
  );
}

// ─── The preview workspace ────────────────────────────────────────────────────────────────────────
const PDF_STATUS_TEXT: Record<PdfStatus, string> = {
  ready: "PDF ready",
  outdated: "PDF outdated",
  generating: "Generating PDF",
  failed: "PDF failed",
};

export function PreviewWorkspace({
  proposal,
  document,
  initialPageIndex = 0,
}: {
  proposal: Proposal;
  document: ProposalPreviewDocument;
  initialPageIndex?: number;
}) {
  const [pageIndex, setPageIndex] = useState(clampPage(initialPageIndex, document.pages.length));
  const [zoom, setZoom] = useState<ZoomMode>("fit-width");
  const [printLayout, setPrintLayout] = useState(false);

  const page = document.pages[pageIndex] ?? document.pages[0];
  const sendBlocked = isSendBlocked(document.validation);
  const unresolved = unresolvedCount(document.validation);
  const sendReasonId = useId();

  const go = (dir: -1 | 1) => setPageIndex((i) => clampPage(i + dir, document.pages.length));

  return (
    <div className="cc-scope flex min-h-0 flex-1 flex-col font-cc-body">
      <BackLink proposalId={proposal.id} />

      {/* Toolbar — title, PDF status, page navigation, zoom, print layout, and gated actions. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-cc-line pb-3">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-cc-ink-strong">
            <span className="font-cc-mono text-[12px] text-cc-ink">{proposal.id}</span>
            <span>{document.client} — proposal preview</span>
            <span className="font-cc-mono text-[10px] font-medium text-cc-t3">{document.version}</span>
          </h1>
          <p className="mt-0.5 text-[11px] text-cc-t3">
            Read-only. This preview shows the saved proposal, page-for-page with the PDF and the client view.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <PdfStatusBadge status={document.pdfStatus} />
          <Link
            href={`/dashboard/proposals/${proposal.id}/edit`}
            className="rounded-cc-control border border-cc-line px-3 py-1.5 text-[11.5px] font-semibold text-cc-ink transition-colors hover:border-cc-green-border"
          >
            Edit proposal
          </Link>
          <GatedButton label="Download PDF" reason="PDF generation and download are available in the live workspace." />
          <GatedButton
            label="Send"
            primary
            reason={
              sendBlocked
                ? "Send is blocked until the flagged validation issue is resolved, and is available in the live workspace."
                : "Sending is available in the live workspace."
            }
            describedBy={sendBlocked ? sendReasonId : undefined}
          />
          <GatedButton label="Share secure link" reason="The secure client link is created in the live workspace." />
        </div>
      </div>

      {/* Page + zoom controls. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <nav aria-label="Proposal pages" className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={pageIndex === 0}
            aria-label="Previous page"
            className="rounded-cc-control border border-cc-line p-1.5 text-cc-ink disabled:opacity-40 hover:border-cc-green-border"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-cc-mono text-[11px] text-cc-t2" aria-live="polite">
            {page.pageFooter} <span className="text-cc-t3">· {page.navLabel}</span>
          </span>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={pageIndex === document.pages.length - 1}
            aria-label="Next page"
            className="rounded-cc-control border border-cc-line p-1.5 text-cc-ink disabled:opacity-40 hover:border-cc-green-border"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>

        <div className="flex items-center gap-1" role="group" aria-label="Zoom">
          <button type="button" onClick={() => setZoom((z) => stepZoom(z, -1))} aria-label="Zoom out" className="rounded-cc-control border border-cc-line p-1.5 text-cc-ink hover:border-cc-green-border">
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[64px] text-center font-cc-mono text-[11px] text-cc-t2" aria-live="polite">
            {zoomLabel(zoom)}
          </span>
          <button type="button" onClick={() => setZoom((z) => stepZoom(z, 1))} aria-label="Zoom in" className="rounded-cc-control border border-cc-line p-1.5 text-cc-ink hover:border-cc-green-border">
            <Plus className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setZoom("fit-width")} aria-pressed={zoom === "fit-width"} className={`ml-1 rounded-cc-control border px-2 py-1 text-[11px] font-semibold ${zoom === "fit-width" ? "border-cc-green-border bg-cc-green-tint text-cc-green-ink" : "border-cc-line text-cc-ink"}`}>
            Fit width
          </button>
          <button type="button" onClick={() => setZoom("fit-page")} aria-pressed={zoom === "fit-page"} className={`rounded-cc-control border px-2 py-1 text-[11px] font-semibold ${zoom === "fit-page" ? "border-cc-green-border bg-cc-green-tint text-cc-green-ink" : "border-cc-line text-cc-ink"}`}>
            Fit page
          </button>
        </div>

        <button
          type="button"
          onClick={() => setPrintLayout((v) => !v)}
          aria-pressed={printLayout}
          className={`rounded-cc-control border px-2.5 py-1 text-[11px] font-semibold ${printLayout ? "border-cc-green-border bg-cc-green-tint text-cc-green-ink" : "border-cc-line text-cc-ink"}`}
        >
          {printLayout ? "Print layout · on" : "Print layout"}
        </button>
      </div>

      {/* Assembled page canvas + validation rail. */}
      <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-h-0 overflow-auto rounded-cc-card border border-cc-line bg-cc-secondary p-4 lg:p-8">
          <div
            className="mx-auto motion-safe:transition-[width,transform]"
            style={{
              width: zoom === "fit-width" ? "100%" : zoom === "fit-page" ? "min(100%, 620px)" : `${620 * zoomScale(zoom)}px`,
              maxWidth: printLayout ? "794px" : "760px",
            }}
          >
            <DocPageView page={page} printLayout={printLayout} />
          </div>
        </div>

        <aside className="min-h-0">
          <ValidationRail
            items={document.validation}
            blockedReason={document.blockedReason}
            unresolved={unresolved}
            sendReasonId={sendReasonId}
            pdfStatus={document.pdfStatus}
            pdfStatusDetail={document.pdfStatusDetail}
          />
        </aside>
      </div>
    </div>
  );
}

function PdfStatusBadge({ status }: { status: PdfStatus }) {
  const tone: Record<PdfStatus, string> = {
    ready: "bg-cc-green-tint text-cc-green-ink",
    outdated: "bg-[#F4EBD4] text-[#6E5A1E]",
    generating: "bg-cc-soft text-cc-t2",
    failed: "bg-cc-red-ink/10 text-cc-red-ink",
  };
  return (
    <span className={`rounded-cc-control px-[7px] py-[3px] font-cc-mono text-[9px] font-semibold tracking-[.04em] ${tone[status]}`}>
      {PDF_STATUS_TEXT[status].toUpperCase()}
    </span>
  );
}

// A backend/approval-gated action, disabled with an honest, screen-reader-associated reason.
function GatedButton({
  label,
  reason,
  primary,
  describedBy,
}: {
  label: string;
  reason: string;
  primary?: boolean;
  describedBy?: string;
}) {
  const ownId = useId();
  return (
    <>
      <button
        type="button"
        disabled
        aria-describedby={describedBy ?? ownId}
        className={
          primary
            ? "cursor-not-allowed rounded-cc-control bg-cc-green/60 px-3 py-1.5 text-[11.5px] font-semibold text-white/80"
            : "cursor-not-allowed rounded-cc-control border border-cc-line px-3 py-1.5 text-[11.5px] font-semibold text-cc-t3"
        }
      >
        {label}
      </button>
      {describedBy ? null : (
        <span id={ownId} className="sr-only">
          {reason}
        </span>
      )}
    </>
  );
}

function ValidationRail({
  items,
  blockedReason,
  unresolved,
  sendReasonId,
  pdfStatus,
  pdfStatusDetail,
}: {
  items: ValidationItem[];
  blockedReason: string | null;
  unresolved: number;
  sendReasonId: string;
  pdfStatus: PdfStatus;
  pdfStatusDetail: string;
}) {
  const statusLabel: Record<ValidationStatus, string> = { valid: "VALID", review: "REVIEW", blocked: "BLOCKED" };
  const statusTone: Record<ValidationStatus, string> = {
    valid: "text-cc-green-ink",
    review: "text-cc-t2",
    blocked: "text-cc-red-ink",
  };
  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-cc-card border border-cc-line-strong bg-cc-surface p-[14px]">
        <h2 className="font-cc-mono text-[9.5px] font-semibold tracking-[.08em] text-cc-t3">
          VALIDATION · {unresolved} TO RESOLVE
        </h2>
        <ul className="mt-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 border-b border-cc-row-line py-1.5">
              <span className="text-[11px] text-cc-t2">{item.label}</span>
              <span className={`font-cc-mono text-[8.5px] font-semibold ${statusTone[item.status]}`}>{statusLabel[item.status]}</span>
            </li>
          ))}
        </ul>
        {blockedReason ? (
          <div id={sendReasonId} className="mt-3 rounded-cc-control border border-cc-red-ink/25 bg-cc-red-ink/5 px-3 py-2">
            <p className="text-[10.5px] font-semibold text-cc-red-ink">BLOCKED — {blockedReason}</p>
            <p className="mt-1 text-[10px] text-cc-t3">A blocked proposal cannot be sent until it is resolved.</p>
          </div>
        ) : null}
      </section>

      <section className="rounded-cc-card border border-cc-line-strong bg-cc-surface p-[14px]">
        <h2 className="font-cc-mono text-[9.5px] font-semibold tracking-[.08em] text-cc-t3">PDF · {PDF_STATUS_TEXT[pdfStatus].toUpperCase()}</h2>
        <p className="mt-2 text-[11px] leading-[1.6] text-cc-t3">{pdfStatusDetail}</p>
        <p className="mt-2 text-[10.5px] text-cc-t3">Generating and downloading the PDF are available in the live workspace.</p>
      </section>
    </div>
  );
}

// ─── One assembled document page (real, selectable DOM) ───────────────────────────────────────────
function DocPageView({ page, printLayout }: { page: ProposalDocPage; printLayout: boolean }) {
  const isCover = page.kind === "cover";
  return (
    <article
      aria-label={`Proposal page — ${page.navLabel}`}
      className={`flex min-h-[520px] flex-col rounded-cc-card p-8 shadow-[0_18px_50px_rgba(19,23,26,.14)] sm:p-10 ${
        isCover ? "bg-[#17190F] text-[#F4F1E6]" : "bg-white text-cc-t-table"
      } ${printLayout ? "rounded-none" : ""}`}
    >
      <div className="flex-1">
        {page.blocks.map((block, i) => (
          <BlockView key={i} block={block} onCover={isCover} />
        ))}
      </div>
      <footer className={`mt-8 flex justify-between border-t pt-3 font-cc-mono text-[9px] ${isCover ? "border-white/15 text-white/50" : "border-cc-row-line text-cc-t3"}`}>
        <span>CODEOUTFITTERS · SOLTERRA ENERGY</span>
        <span>{page.pageFooter}</span>
      </footer>
    </article>
  );
}

function BlockView({ block, onCover }: { block: DocBlock; onCover: boolean }) {
  switch (block.kind) {
    case "heading":
      return (
        <div className="mt-6 first:mt-0">
          <div className={`font-cc-mono text-[10px] tracking-[.18em] ${onCover ? "text-[#8F937F]" : "text-cc-t3"}`}>{block.eyebrow}</div>
          {block.title ? (
            <h2 className={`mt-2 font-semibold tracking-[-.02em] ${onCover ? "text-[30px] leading-[1.15]" : "text-[22px] text-cc-ink-strong"}`}>{block.title}</h2>
          ) : null}
        </div>
      );
    case "paragraph":
      return <p className={`mt-3 text-[12.5px] leading-[1.7] ${onCover ? "text-[#A9AC9F]" : "text-cc-t-table"}`}>{block.text}</p>;
    case "stat":
      return (
        <div className={`mt-4 inline-block w-full border-t-2 pt-2 ${block.accent ? "border-cc-green" : "border-cc-ink-strong"}`}>
          <div className={`font-cc-mono text-[20px] font-semibold ${block.accent ? "text-cc-green-ink" : "text-cc-ink-strong"}`}>{block.value}</div>
          <div className="mt-0.5 text-[10px] text-cc-t3">{block.label}</div>
        </div>
      );
    case "card":
      return (
        <div className={`mt-3 rounded-cc-control border p-3 ${block.accent ? "border-l-[3px] border-cc-green-border bg-cc-green-tint" : "border-cc-line"}`}>
          <div className={`text-[11.5px] font-semibold ${block.accent ? "text-cc-green-ink" : "text-cc-ink"}`}>{block.title}</div>
          <p className="mt-1 text-[11px] leading-[1.6] text-cc-t2">{block.body}</p>
        </div>
      );
    case "compare":
      return (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-cc-control border border-cc-line p-3">
            <div className="font-cc-mono text-[9px] tracking-[.1em] text-cc-t3">TODAY</div>
            <p className="mt-1 text-[11px] leading-[1.55] text-cc-t2">{block.today}</p>
          </div>
          <div className="rounded-cc-control border border-cc-green-border bg-cc-green-tint p-3">
            <div className="font-cc-mono text-[9px] tracking-[.1em] text-cc-green-ink">WITH CODEOUTFITTERS</div>
            <p className="mt-1 text-[11px] leading-[1.55] text-cc-green-ink">{block.withUs}</p>
          </div>
        </div>
      );
    case "flow":
      return (
        <ol className="mt-4 flex flex-wrap items-stretch gap-2">
          {block.steps.map((step, i) => (
            <li key={i} className="flex items-center gap-2">
              <div className={`rounded-cc-control border p-2 text-center ${step.gate ? "border-cc-green-border bg-cc-green-tint" : "border-cc-line"}`}>
                <div className={`text-[10.5px] font-semibold ${step.gate ? "text-cc-green-ink" : "text-cc-ink"}`}>{step.label}</div>
                <div className="text-[9px] text-cc-t3">{step.hint}</div>
              </div>
              {i < block.steps.length - 1 ? <span aria-hidden className="text-cc-t3">→</span> : null}
            </li>
          ))}
        </ol>
      );
    case "pricingTable":
      return (
        <table className="mt-4 w-full border-collapse text-left">
          <caption className="sr-only">Investment</caption>
          <tbody>
            {block.lines.map((line) => (
              <tr key={line.id} className="border-b border-cc-row-line">
                <th scope="row" className="py-2 pr-3 text-[11.5px] font-medium text-cc-ink">
                  {line.name} <span className="font-normal text-cc-t3">· {line.detail}</span>
                </th>
                <td className="py-2 text-right font-cc-mono text-[11.5px] font-semibold text-cc-ink">{formatUsd(line.cents)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="py-2 pr-3 text-left text-[11.5px] font-semibold text-cc-ink">{block.totalLabel}</th>
              <td className="py-2 text-right font-cc-mono text-[13px] font-bold text-cc-ink-strong">{formatUsd(block.totalCents)}</td>
            </tr>
          </tfoot>
        </table>
      );
    case "milestoneTable":
      return (
        <table className="mt-3 w-full border-collapse text-left">
          <caption className="sr-only">Delivery milestones</caption>
          <tbody>
            {block.milestones.map((m) => (
              <tr key={m.id} className="border-b border-cc-row-line">
                <td className="w-24 py-2 font-cc-mono text-[10px] text-cc-t3">{m.timing}</td>
                <th scope="row" className="py-2 text-[12px] font-semibold text-cc-ink">{m.name}</th>
                <td className="py-2 text-right font-cc-mono text-[10.5px] font-semibold text-cc-green-ink">payment {m.paymentPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    case "keyValue":
      return (
        <dl className="mt-4 flex flex-col gap-1.5">
          {block.rows.map((row) => (
            <div key={row.label} className={`flex justify-between gap-3 border-b pb-1.5 ${onCover ? "border-white/15" : "border-cc-row-line"}`}>
              <dt className={`text-[10px] font-cc-mono tracking-[.08em] ${onCover ? "text-white/50" : "text-cc-t3"}`}>{row.label.toUpperCase()}</dt>
              <dd className={`text-[11px] font-medium ${onCover ? "text-white/80" : "text-cc-ink"}`}>{row.value}</dd>
            </div>
          ))}
        </dl>
      );
    case "note":
      return <p className="mt-3 rounded-cc-control border border-dashed border-cc-line px-3 py-2 text-[10px] leading-[1.5] text-cc-t3">{block.text}</p>;
    default: {
      // Exhaustiveness guard — every DocBlock kind is handled above.
      const _never: never = block;
      return _never;
    }
  }
}
