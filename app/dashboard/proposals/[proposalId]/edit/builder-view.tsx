"use client";
// P-D03..P-D09 · PROPOSAL BUILDER — SCREEN_PROPOSAL_BUILDER (routes.json /proposals/[proposal-id]/edit,
// frames P-D03 builder / P-D04 navigator / P-D05 AI assist / P-D06 validation / P-D07 pricing /
// P-D08 milestones / P-D09 internal review). Canonical layout is a three-column workspace: a
// STRUCTURE navigator on the left, the rendered proposal page in the centre, and Content / Design /
// Data / AI Assist / Validation tabs on the right.
//
// This is a demo-presentation island. It reads a real, deterministic proposal from the client demo
// store (lib/demo) — the canonical showcase record is PRO-2034 (Solterra Energy, $86,400), whose
// pricing, milestones and validation are modelled verbatim from the P-D07/P-D08/P-D06 frames. Edits
// (section title/body, section reorder/add/remove, pricing line amounts) are local and NON-persistent:
// nothing is saved, generated, sent, or turned into a PDF here. Save / Request review / Preview / the
// AI Assist actions are backend- and approval-gated (api-contracts.json + state-machines.json), so they
// are disabled with honest reasons and never dead-link. Money is handled in integer cents so a subtotal
// is exact and every amount is validated (no NaN / Infinity / negative / fractional-cent totals).
import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GripVertical, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { Proposal } from "../../../../../lib/demo/types";
import { useDemoQuery } from "../../../../../components/demo/use-demo-query";
import { RouteError, RouteLoading } from "../../../../../components/demo/route-states";
import { TextAreaField, TextField } from "../../../../../components/demo/field";

// ─── Money (integer cents; exact sums, validated parsing) ────────────────────────────────────────
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** Seed proposal values are whole dollars (lib/demo/seed `value: 86400`). */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Format integer cents as USD. Whole-dollar amounts render without cents, matching the frames. */
export function formatUsd(cents: number): string {
  const whole = cents % 100 === 0;
  return whole
    ? usd.format(cents / 100)
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/**
 * Parse a user-entered amount into integer cents. Rejects everything that would corrupt a total:
 * empty, non-numeric, NaN, Infinity, negative, and more than two decimal places. Accepts an optional
 * thousands separator and a leading `$`.
 */
export function parseAmountToCents(input: string): { ok: true; cents: number } | { ok: false } {
  const cleaned = input.trim().replace(/^\$/, "").replace(/,/g, "");
  if (cleaned === "") return { ok: false };
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return { ok: false };
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return { ok: false };
  return { ok: true, cents: Math.round(value * 100) };
}

/** Sum of the parseable line amounts, in cents. Invalid lines are excluded, never coerced to 0-total. */
export function sumCents(amounts: readonly string[]): number {
  return amounts.reduce((total, raw) => {
    const parsed = parseAmountToCents(raw);
    return parsed.ok ? total + parsed.cents : total;
  }, 0);
}

/** Total of the milestone payment percentages. A valid schedule sums to exactly 100. */
export function scheduleTotalPct(milestones: readonly { paymentPct: number }[]): number {
  return milestones.reduce((total, m) => total + m.paymentPct, 0);
}

export function isScheduleBalanced(milestones: readonly { paymentPct: number }[]): boolean {
  return scheduleTotalPct(milestones) === 100;
}

/** Immutable move-up / move-down. Out-of-range moves return the list unchanged (used for a11y reorder). */
export function moveItem<T>(list: readonly T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return [...list];
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

// ─── Canonical builder detail ─────────────────────────────────────────────────────────────────────
export const CANONICAL_DEMO_PROPOSAL_ID = "PRO-2034";

export type BuilderSection = {
  id: string;
  name: string;
  required: boolean;
  kind: "content" | "pricing" | "milestones";
  body: string;
};

export type PricingLine = { id: string; name: string; detail: string; cents: number };
export type Milestone = { id: string; name: string; timing: string; paymentPct: number };
export type ValidationStatus = "valid" | "review" | "blocked";
export type ValidationItem = { id: string; label: string; status: ValidationStatus };

export type ProposalBuilderDetail = {
  title: string;
  version: string;
  sections: BuilderSection[];
  pricing: PricingLine[];
  netTerms: string;
  milestones: Milestone[];
  validation: ValidationItem[];
  blockedReason: string | null;
};

// The canonical section spine. Order is template-defined (proposal-templates.json "Section order")
// and REQ flags follow "Required information" — no per-proposal pricing or timeline is baked in here.
function canonicalSections(proposal: Proposal): BuilderSection[] {
  return [
    { id: "cover", name: "Cover", required: false, kind: "content", body: `${proposal.client} — proposal cover.` },
    { id: "executive-summary", name: "Executive summary", required: true, kind: "content", body: "Executive summary of the engagement, outcomes, and value. Review before sending." },
    { id: "context", name: "Understanding & context", required: false, kind: "content", body: `Current state and goals for ${proposal.client}.` },
    { id: "proposed-solution", name: "Proposed solution", required: true, kind: "content", body: "Orders sync from SAP ERP with an approval gate before any write-back; today's manual re-keying is removed." },
    { id: "scope", name: "Scope & deliverables", required: true, kind: "content", body: `Scope and deliverables for the ${proposal.service} engagement.` },
    { id: "approach", name: "Approach & timeline", required: false, kind: "content", body: "Phased delivery approach, from discovery through acceptance." },
    { id: "pricing", name: "Pricing", required: true, kind: "pricing", body: "" },
    { id: "milestones", name: "Milestones & payment schedule", required: true, kind: "milestones", body: "" },
    { id: "terms", name: "Terms & validity", required: true, kind: "content", body: "Payment terms Net 21. Applicable tax is set per client locale. Proposal valid for 30 days." },
    { id: "case-studies", name: "Case studies", required: false, kind: "content", body: "Relevant, approved case studies only." },
    { id: "team", name: "Team", required: false, kind: "content", body: "Delivery team and roles." },
    { id: "assumptions", name: "Assumptions", required: false, kind: "content", body: "Assumptions the estimate depends on." },
    { id: "next-steps", name: "Next steps", required: false, kind: "content", body: "Acceptance and kickoff next steps." },
    { id: "appendix", name: "Appendix", required: false, kind: "content", body: "Supporting detail." },
  ];
}

// Verbatim from the P-D07 frame: four lines summing to the seed total ($86,400), Net 21.
const PRO_2034_PRICING: PricingLine[] = [
  { id: "discovery", name: "Discovery & solution design", detail: "Requirements, solution canvas, delivery plan", cents: dollarsToCents(12000) },
  { id: "build", name: "Core build — Custom Software", detail: "Approval-gated order sync and workflow", cents: dollarsToCents(48000) },
  { id: "integrations", name: "Integrations — SAP ERP", detail: "Bi-directional sync with write-back gate", cents: dollarsToCents(16400) },
  { id: "handover", name: "QA, deployment & handover", detail: "Testing, cutover, and enablement", cents: dollarsToCents(10000) },
];

// P-D08 frame: schedule sums to 100%.
const PRO_2034_MILESTONES: Milestone[] = [
  { id: "kickoff", name: "Kickoff & discovery", timing: "On signature", paymentPct: 20 },
  { id: "design", name: "Design sign-off", timing: "Week 3", paymentPct: 20 },
  { id: "build", name: "Build complete", timing: "Week 8", paymentPct: 40 },
  { id: "acceptance", name: "Acceptance & handover", timing: "Week 11", paymentPct: 20 },
];

// P-D06 frame: "2 TO RESOLVE" with a BLOCKED banner on the unsupported uptime claim.
const PRO_2034_VALIDATION: ValidationItem[] = [
  { id: "pricing-sum", label: "Pricing lines sum to the proposal total", status: "valid" },
  { id: "schedule", label: "Milestone schedule totals 100%", status: "valid" },
  { id: "client", label: "Client and recipient details present", status: "valid" },
  { id: "exec-review", label: "Executive summary reviewed", status: "review" },
  { id: "uptime", label: "Uptime claim needs a source", status: "blocked" },
];

/**
 * Build the canonical builder detail for a demo proposal. PRO-2034 is modelled verbatim from the
 * frames. Any other real demo proposal renders honestly from the one canonical money fact we have —
 * its total value as a single line — with no invented breakdown, milestones, or validation findings.
 */
export function buildProposalDetail(proposal: Proposal): ProposalBuilderDetail {
  const sections = canonicalSections(proposal);
  if (proposal.id === CANONICAL_DEMO_PROPOSAL_ID) {
    return {
      title: "Executive Solution Proposal",
      version: proposal.version,
      sections,
      pricing: PRO_2034_PRICING,
      netTerms: "Net 21",
      milestones: PRO_2034_MILESTONES,
      validation: PRO_2034_VALIDATION,
      blockedReason: "Cannot send until the unsupported uptime claim is removed or sourced.",
    };
  }
  return {
    title: `${proposal.service} proposal`,
    version: proposal.version,
    sections: sections.filter((s) => s.kind !== "milestones"),
    pricing: [
      { id: "total", name: `${proposal.service} engagement`, detail: "Total set per proposal", cents: dollarsToCents(proposal.value) },
    ],
    netTerms: "Net 21",
    milestones: [],
    validation: [
      { id: "client", label: "Client and recipient details present", status: "valid" },
      { id: "review", label: "Proposal reviewed before sending", status: "review" },
    ],
    blockedReason: null,
  };
}

// ─── Route shell: store lookup + loading / error / not-found ──────────────────────────────────────
export function ProposalBuilderView({ proposalId }: { proposalId: string }) {
  const { state, status, error, retry } = useDemoQuery();

  if (status === "loading") return <RouteLoading label="proposal" />;
  if (status === "error") return <RouteError label="proposal" error={error!} onRetry={retry} />;

  const proposal = state.proposals.find((p) => p.id === proposalId) ?? null;
  if (!proposal) return <BuilderNotFound proposalId={proposalId} />;

  return <BuilderWorkspace proposal={proposal} detail={buildProposalDetail(proposal)} />;
}

// Unknown / invalid id: an honest not-found that never fabricates a record and links back to the
// directory. Deliberately NOT notFound()/404 — the route itself is valid; this proposal just isn't in
// the demo workspace.
export function BuilderNotFound({ proposalId }: { proposalId: string }) {
  return (
    <div className="cc-scope mx-auto max-w-2xl font-cc-body">
      <BackLink />
      <div className="rounded-cc-card border border-cc-line-strong bg-cc-surface p-8 text-center shadow-[0_14px_40px_rgba(20,26,30,.08)]">
        <h1 className="text-[15px] font-semibold text-cc-ink-strong">Proposal not found</h1>
        <p className="mx-auto mt-2 max-w-md text-[12px] leading-[1.6] text-cc-t3">
          Proposal <span className="font-cc-mono text-cc-ink">{proposalId}</span> isn&apos;t in this demo
          workspace. Open a proposal from the directory to edit it.
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

function BackLink() {
  return (
    <div className="mb-4">
      <Link
        href="/dashboard/proposals"
        className="inline-flex items-center gap-1 text-xs font-medium text-cc-t3 transition-colors hover:text-cc-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to proposals
      </Link>
    </div>
  );
}

// ─── The workspace (local, non-persistent edits only) ─────────────────────────────────────────────
const TABS = ["Content", "Design", "Data", "AI Assist", "Validation"] as const;
type Tab = (typeof TABS)[number];

export function BuilderWorkspace({
  proposal,
  detail,
  initialTab = "Content",
  initialSectionId,
}: {
  proposal: Proposal;
  detail: ProposalBuilderDetail;
  // Test seams so a single render can assert a given tab/section panel; the UI still defaults to
  // the Content tab and the first section.
  initialTab?: Tab;
  initialSectionId?: string;
}) {
  const [title, setTitle] = useState(detail.title);
  const [sections, setSections] = useState<BuilderSection[]>(detail.sections);
  // Pricing amounts are edited as strings so a partial/invalid entry never corrupts the total.
  const [amounts, setAmounts] = useState<string[]>(detail.pricing.map((p) => String(p.cents / 100)));
  const [activeId, setActiveId] = useState<string>(initialSectionId ?? detail.sections[0]?.id ?? "");
  const [tab, setTab] = useState<Tab>(initialTab);

  const active = sections.find((s) => s.id === activeId) ?? sections[0];
  const subtotalCents = useMemo(() => sumCents(amounts), [amounts]);
  const hasInvalidAmount = amounts.some((a) => !parseAmountToCents(a).ok);

  const initial = useMemo(
    () => JSON.stringify({ title: detail.title, sections: detail.sections, amounts: detail.pricing.map((p) => String(p.cents / 100)) }),
    [detail],
  );
  const dirty = JSON.stringify({ title, sections, amounts }) !== initial;

  const reset = () => {
    setTitle(detail.title);
    setSections(detail.sections);
    setAmounts(detail.pricing.map((p) => String(p.cents / 100)));
  };

  const setSectionBody = (id: string, body: string) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, body } : s)));
  const setSectionName = (id: string, name: string) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));

  return (
    <div className="cc-scope flex min-h-0 flex-1 flex-col font-cc-body">
      <BackLink />

      {/* Header — id · client — title, DRAFT badge, and backend/approval-gated actions. */}
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-cc-line pb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-cc-mono text-[12px] font-semibold text-cc-ink">{proposal.id}</span>
            <span className="text-[14px] font-semibold text-cc-ink-strong">
              {proposal.client} — {title}
            </span>
            <span className="rounded-cc-control bg-cc-green-tint px-[7px] py-[2px] font-cc-mono text-[9px] font-semibold tracking-[.04em] text-cc-green-ink">
              DRAFT {detail.version} · AI GENERATED · UNREVIEWED
            </span>
          </div>
          <p className="mt-1 text-[11px] text-cc-t3" aria-live="polite">
            {dirty
              ? "Unsaved — changes in this demo workspace aren't saved."
              : "Changes in this demo workspace aren't saved."}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {dirty ? (
            <button
              type="button"
              onClick={reset}
              className="rounded-cc-control border border-cc-line px-3 py-1.5 text-[11.5px] font-semibold text-cc-ink transition-colors hover:border-cc-green-border"
            >
              Discard edits
            </button>
          ) : null}
          <GatedAction label="Preview" />
          <GatedAction label="Request review" />
          <GatedAction label="Save" primary />
        </div>
      </header>

      {/* Three-column workspace: STRUCTURE navigator · page canvas · Content/Design/Data/AI/Validation. */}
      <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
        <StructureNav
          sections={sections}
          activeId={active?.id ?? ""}
          onSelect={setActiveId}
          onMove={(index, dir) => setSections((prev) => moveItem(prev, index, dir))}
          onAdd={() =>
            setSections((prev) => [
              ...prev,
              { id: `section-${prev.length + 1}-${Date.now()}`, name: "Untitled section", required: false, kind: "content", body: "" },
            ])
          }
          onRemove={(id) => {
            setSections((prev) => prev.filter((s) => s.id !== id || s.required));
            if (activeId === id) setActiveId(detail.sections[0]?.id ?? "");
          }}
        />

        <Canvas
          section={active}
          pricing={detail.pricing}
          amounts={amounts}
          subtotalCents={subtotalCents}
          hasInvalidAmount={hasInvalidAmount}
          netTerms={detail.netTerms}
          milestones={detail.milestones}
        />

        <aside className="min-h-0 rounded-cc-card border border-cc-line-strong bg-cc-surface">
          <TabStrip tab={tab} onTab={setTab} />
          <div className="p-[14px]">
            {tab === "Content" ? (
              <ContentTab
                section={active}
                onName={setSectionName}
                onBody={setSectionBody}
                pricing={detail.pricing}
                amounts={amounts}
                onAmount={(i, v) => setAmounts((prev) => prev.map((a, idx) => (idx === i ? v : a)))}
                subtotalCents={subtotalCents}
              />
            ) : tab === "Design" ? (
              <DataDesignNote
                heading="Visual variants"
                body="A template defines the visual variants. Applying and previewing variants is available in the live workspace."
              />
            ) : tab === "Data" ? (
              <DataTab proposal={proposal} />
            ) : tab === "AI Assist" ? (
              <AiAssistTab />
            ) : (
              <ValidationTab items={detail.validation} blockedReason={detail.blockedReason} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// A backend- or approval-gated action, disabled with an honest, screen-reader-associated reason.
function GatedAction({ label, primary }: { label: string; primary?: boolean }) {
  const reasonId = useId();
  return (
    <>
      <button
        type="button"
        disabled
        aria-describedby={reasonId}
        className={
          primary
            ? "cursor-not-allowed rounded-cc-control bg-cc-green/60 px-3 py-1.5 text-[11.5px] font-semibold text-white/80"
            : "cursor-not-allowed rounded-cc-control border border-cc-line px-3 py-1.5 text-[11.5px] font-semibold text-cc-t3"
        }
      >
        {label}
      </button>
      <span id={reasonId} className="sr-only">
        {label} is available in the live workspace. Nothing is saved, sent, or generated in this demo.
      </span>
    </>
  );
}

function StructureNav({
  sections,
  activeId,
  onSelect,
  onMove,
  onAdd,
  onRemove,
}: {
  sections: BuilderSection[];
  activeId: string;
  onSelect: (id: string) => void;
  onMove: (index: number, dir: -1 | 1) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <nav aria-label="Proposal structure" className="min-h-0 rounded-cc-card border border-cc-line-strong bg-cc-surface p-[10px]">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-cc-mono text-[9.5px] font-semibold tracking-[.08em] text-cc-t3">STRUCTURE</h2>
      </div>
      <ul className="flex flex-col gap-[1px]">
        {sections.map((section, index) => {
          const selected = section.id === activeId;
          return (
            <li key={section.id} className={`group flex items-center gap-1 rounded-cc-control px-1.5 py-1 ${selected ? "bg-cc-green-tint" : "hover:bg-cc-soft"}`}>
              <GripVertical aria-hidden className="h-3 w-3 shrink-0 text-cc-icon-muted" />
              <button
                type="button"
                onClick={() => onSelect(section.id)}
                aria-current={selected ? "true" : undefined}
                className="min-w-0 flex-1 truncate text-left text-[11.5px] text-cc-t2"
              >
                {section.name}
              </button>
              {section.required ? (
                <span className="font-cc-mono text-[8px] font-semibold text-cc-t3">REQ</span>
              ) : null}
              <span className="flex shrink-0 items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label={`Move ${section.name} up`} className="rounded p-0.5 text-cc-icon-muted disabled:opacity-30 hover:text-cc-ink">
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => onMove(index, 1)} disabled={index === sections.length - 1} aria-label={`Move ${section.name} down`} className="rounded p-0.5 text-cc-icon-muted disabled:opacity-30 hover:text-cc-ink">
                  <ChevronDown className="h-3 w-3" />
                </button>
                {!section.required ? (
                  <button type="button" onClick={() => onRemove(section.id)} aria-label={`Remove ${section.name}`} className="rounded p-0.5 text-cc-icon-muted hover:text-cc-red-ink">
                    <Trash2 className="h-3 w-3" />
                  </button>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 inline-flex items-center gap-1 rounded-cc-control border border-cc-line px-2 py-1 text-[11px] font-semibold text-cc-ink transition-colors hover:border-cc-green-border"
      >
        <Plus className="h-3 w-3" /> Add section
      </button>
    </nav>
  );
}

function Canvas({
  section,
  pricing,
  amounts,
  subtotalCents,
  hasInvalidAmount,
  netTerms,
  milestones,
}: {
  section: BuilderSection | undefined;
  pricing: PricingLine[];
  amounts: string[];
  subtotalCents: number;
  hasInvalidAmount: boolean;
  netTerms: string;
  milestones: Milestone[];
}) {
  return (
    <div className="min-h-0 overflow-auto rounded-cc-card border border-cc-line bg-cc-secondary p-4">
      <div className="mx-auto max-w-[640px] rounded-cc-card bg-white p-8 shadow-[0_18px_50px_rgba(19,23,26,.14)]">
        {!section ? (
          <p className="text-[12px] text-cc-t3">Select a section to preview it.</p>
        ) : section.kind === "pricing" ? (
          <PricingCanvas pricing={pricing} amounts={amounts} subtotalCents={subtotalCents} hasInvalidAmount={hasInvalidAmount} netTerms={netTerms} />
        ) : section.kind === "milestones" ? (
          <MilestonesCanvas milestones={milestones} />
        ) : (
          <>
            <div className="font-cc-mono text-[10px] tracking-[.18em] text-cc-t3">SECTION</div>
            <h3 className="mt-2 text-[22px] font-semibold tracking-[-.02em] text-cc-ink-strong">{section.name}</h3>
            <p className="mt-3 whitespace-pre-wrap text-[12.5px] leading-[1.7] text-cc-t-table">{section.body}</p>
          </>
        )}
      </div>
    </div>
  );
}

function PricingCanvas({
  pricing,
  amounts,
  subtotalCents,
  hasInvalidAmount,
  netTerms,
}: {
  pricing: PricingLine[];
  amounts: string[];
  subtotalCents: number;
  hasInvalidAmount: boolean;
  netTerms: string;
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-cc-ink-strong">Pricing</h3>
        <span className="font-cc-mono text-[9px] font-semibold text-cc-green-ink">USD</span>
      </div>
      <ul className="mt-3">
        {pricing.map((line, i) => {
          const parsed = parseAmountToCents(amounts[i] ?? "");
          return (
            <li key={line.id} className="flex justify-between gap-3 border-b border-cc-row-line py-2">
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-cc-ink">{line.name}</div>
                <div className="text-[10.5px] text-cc-t3">{line.detail}</div>
              </div>
              <span className="font-cc-mono text-[12px] font-semibold text-cc-ink">
                {parsed.ok ? formatUsd(parsed.cents) : "—"}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-cc-ink">Subtotal · {netTerms}</span>
        <span className="font-cc-mono text-[14px] font-bold text-cc-ink-strong">{formatUsd(subtotalCents)}</span>
      </div>
      {hasInvalidAmount ? (
        <p className="mt-2 text-[10.5px] text-cc-red-ink">One or more amounts are invalid and are excluded from the subtotal.</p>
      ) : null}
      <p className="mt-2 text-[10.5px] leading-[1.5] text-cc-t3">
        Applicable tax is set per client locale and is not calculated here. Discounts require authorization.
      </p>
    </>
  );
}

function MilestonesCanvas({ milestones }: { milestones: Milestone[] }) {
  const balanced = isScheduleBalanced(milestones);
  return (
    <>
      <h3 className="text-[15px] font-semibold text-cc-ink-strong">Milestones &amp; payment schedule</h3>
      {milestones.length === 0 ? (
        <p className="mt-3 text-[12px] text-cc-t3">The payment schedule is set per proposal in the live workspace.</p>
      ) : (
        <>
          <ul className="mt-3">
            {milestones.map((m) => (
              <li key={m.id} className="flex items-start gap-3 border-b border-cc-row-line py-2">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cc-green" aria-hidden />
                <div className="flex-1">
                  <div className="text-[12px] font-semibold text-cc-ink">{m.name}</div>
                  <div className="text-[10.5px] text-cc-t3">{m.timing} · payment {m.paymentPct}%</div>
                </div>
              </li>
            ))}
          </ul>
          <p className={`mt-3 text-[10.5px] font-semibold ${balanced ? "text-cc-green-ink" : "text-cc-red-ink"}`}>
            Schedule totals {scheduleTotalPct(milestones)}%{balanced ? " · balanced" : " · must total 100%"}
          </p>
        </>
      )}
    </>
  );
}

function TabStrip({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <div role="tablist" aria-label="Builder tools" className="flex border-b border-cc-line">
      {TABS.map((t) => {
        const selected = t === tab;
        return (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onTab(t)}
            className={`flex-1 px-2 py-2 text-[10.5px] font-semibold transition-colors ${
              selected ? "border-b-2 border-cc-green text-cc-ink-strong" : "text-cc-t3 hover:text-cc-ink"
            }`}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

function ContentTab({
  section,
  onName,
  onBody,
  pricing,
  amounts,
  onAmount,
  subtotalCents,
}: {
  section: BuilderSection | undefined;
  onName: (id: string, name: string) => void;
  onBody: (id: string, body: string) => void;
  pricing: PricingLine[];
  amounts: string[];
  onAmount: (index: number, value: string) => void;
  subtotalCents: number;
}) {
  if (!section) return <p className="text-[11.5px] text-cc-t3">Select a section to edit.</p>;

  if (section.kind === "pricing") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[11px] text-cc-t3">Edit line amounts. The subtotal updates live; invalid entries are excluded.</p>
        {pricing.map((line, i) => {
          const raw = amounts[i] ?? "";
          const invalid = !parseAmountToCents(raw).ok;
          return (
            <TextField
              key={line.id}
              label={line.name}
              type="text"
              value={raw}
              onChange={(v) => onAmount(i, v)}
              error={invalid ? "Enter a valid non-negative amount." : undefined}
            />
          );
        })}
        <div className="flex items-center justify-between border-t border-cc-line pt-2">
          <span className="text-[11.5px] font-semibold text-cc-ink">Subtotal</span>
          <span className="font-cc-mono text-[12.5px] font-bold text-cc-ink-strong">{formatUsd(subtotalCents)}</span>
        </div>
        <p className="text-[10.5px] text-cc-t3">Tax is set per client locale. Discounts require authorization and are available in the live workspace.</p>
      </div>
    );
  }

  if (section.kind === "milestones") {
    return <p className="text-[11.5px] leading-[1.6] text-cc-t3">The milestone payment schedule must total 100% and is edited in the live workspace.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <TextField label="Section title" value={section.name} onChange={(v) => onName(section.id, v)} />
      <TextAreaField label="Section content" value={section.body} onChange={(v) => onBody(section.id, v)} rows={8} />
    </div>
  );
}

function DataTab({ proposal }: { proposal: Proposal }) {
  const facts: Array<[string, string]> = [
    ["Client", proposal.client],
    ["Lead", proposal.leadName],
    ["Service", proposal.service],
    ["Source", proposal.source],
    ["Total value", usd.format(proposal.value)],
  ];
  return (
    <div>
      <p className="text-[11px] leading-[1.5] text-cc-t3">
        Only confirmed requirements and approved Canvas content import as fact.
      </p>
      <dl className="mt-3 flex flex-col gap-1.5">
        {facts.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-cc-row-line pb-1.5">
            <dt className="text-[11px] text-cc-t3">{k}</dt>
            <dd className="text-[11px] font-medium text-cc-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DataDesignNote({ heading, body }: { heading: string; body: string }) {
  return (
    <div>
      <h3 className="font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">{heading.toUpperCase()}</h3>
      <p className="mt-2 text-[11.5px] leading-[1.6] text-cc-t3">{body}</p>
    </div>
  );
}

function AiAssistTab() {
  const reasonId = useId();
  return (
    <div>
      <div className="flex flex-wrap gap-1.5" aria-describedby={reasonId}>
        {["Rewrite", "Shorten", "Make executive", "Clarify scope"].map((label) => (
          <button
            key={label}
            type="button"
            disabled
            className="cursor-not-allowed rounded-cc-control border border-cc-line px-2.5 py-1 text-[10.5px] font-semibold text-cc-t3"
          >
            {label}
          </button>
        ))}
      </div>
      <p id={reasonId} className="mt-3 text-[10.5px] leading-[1.5] text-cc-t3">
        AI assistance may not invent pricing, timelines, case studies, or integrations. Every generation is
        tracked: source · time · reviewer · approval. Generating content is available in the live workspace.
      </p>
    </div>
  );
}

function ValidationTab({ items, blockedReason }: { items: ValidationItem[]; blockedReason: string | null }) {
  const unresolved = items.filter((i) => i.status !== "valid").length;
  const label: Record<ValidationStatus, string> = { valid: "VALID", review: "REVIEW", blocked: "BLOCKED" };
  const tone: Record<ValidationStatus, string> = {
    valid: "text-cc-green-ink",
    review: "text-cc-t2",
    blocked: "text-cc-red-ink",
  };
  return (
    <div>
      <h3 className="font-cc-mono text-[9.5px] font-semibold tracking-[.08em] text-cc-t3">
        VALIDATION · {unresolved} TO RESOLVE
      </h3>
      <ul className="mt-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 border-b border-cc-row-line py-1.5">
            <span className="text-[11px] text-cc-t2">{item.label}</span>
            <span className={`font-cc-mono text-[8.5px] font-semibold ${tone[item.status]}`}>{label[item.status]}</span>
          </li>
        ))}
      </ul>
      {blockedReason ? (
        <div className="mt-3 rounded-cc-control border border-cc-red-ink/25 bg-cc-red-ink/5 px-3 py-2">
          <p className="text-[10.5px] font-semibold text-cc-red-ink">BLOCKED — {blockedReason}</p>
          <p className="mt-1 text-[10px] text-cc-t3">A blocked proposal cannot be sent until it is resolved.</p>
        </div>
      ) : null}
    </div>
  );
}
