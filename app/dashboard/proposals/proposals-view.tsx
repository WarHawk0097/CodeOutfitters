"use client";
// Proposals — P-D01 (desktop directory), the tablet list and mobile cards, with create,
// edit, duplicate, the state transitions and a local preview/download.
//
// The three transitions the pipeline cares about — mark sent, mark accepted, mark declined —
// route through setProposalState, which moves the linked opportunity (Proposal Sent / Won /
// Lost) and the lead status with them. So marking a proposal accepted here is the same event
// the Pipeline board and Overview read; there is no second copy of the outcome.
//
// Nothing is emailed. "Mark sent" records a demo send; no proposal is delivered to a real
// address and the preview/download is generated locally in the browser.
import { useCallback, useMemo, useState } from "react";
import {
  createProposal,
  duplicateProposal,
  setProposalState,
  updateProposal,
} from "../../../lib/demo/actions";
import { LEAD_DIRECTORY } from "../../../lib/demo/seed";
import type { Proposal, ProposalState, Tone } from "../../../lib/demo/types";
import { useDemoQuery } from "../../../components/demo/use-demo-query";
import { TONE_INK } from "../../../components/demo/tone";
import { useBreakpoint } from "../../../components/demo/use-breakpoint";
import { MenuButton, type MenuItem } from "../../../components/demo/menu";
import { Dialog, DialogCancelButton, DialogSubmitButton } from "../../../components/demo/dialog";
import { SelectField, TextField } from "../../../components/demo/field";
import { RouteEmpty, RouteError, RouteLoading } from "../../../components/demo/route-states";
import { FilterMenu, RouteToolbar, SearchInput, ToolbarButton } from "../../../components/demo/toolbar";

// CANON 1428-1433 draws a directory, not per-state chips; these tones follow the same
// palette grammar the rest of the app uses (in-motion blue, waiting amber, won green,
// lost red, inert neutral).
const STATE_TONE: Record<ProposalState, Tone> = {
  DRAFT: "neutral",
  "INTERNAL REVIEW": "amber",
  APPROVED: "green",
  SENT: "blue",
  VIEWED: "blue",
  "CHANGES REQUESTED": "amber",
  ACCEPTED: "green",
  REJECTED: "red",
  EXPIRED: "neutral",
  ARCHIVED: "neutral",
};

const STATES: ProposalState[] = [
  "DRAFT",
  "INTERNAL REVIEW",
  "APPROVED",
  "SENT",
  "VIEWED",
  "CHANGES REQUESTED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "ARCHIVED",
];

const VALUE_BUCKETS = [
  { id: "under50", label: "Under $50k", test: (v: number) => v < 50_000 },
  { id: "50to100", label: "$50k – $100k", test: (v: number) => v >= 50_000 && v <= 100_000 },
  { id: "over100", label: "Over $100k", test: (v: number) => v > 100_000 },
] as const;

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const SECONDARY_ACTION =
  "rounded-cc-control border border-cc-line-strong px-[11px] py-[5px] text-[11.5px] font-semibold text-cc-t-table hover:border-cc-green-border hover:text-cc-green-ink";

type ProposalDraft = {
  client: string;
  leadName: string;
  service: string;
  value: string;
  ownerId: string;
  version: string;
  source: string;
};

/** The plain-text a proposal downloads as. Generated in the browser — no server renders a
 *  PDF, because that is production integration this demo does not perform. */
function proposalText(proposal: Proposal, ownerName: string): string {
  return [
    `CodeOutfitters — Proposal ${proposal.id}`,
    "",
    `Client:      ${proposal.client}`,
    `Lead:        ${proposal.leadName}`,
    `Service:     ${proposal.service}`,
    `Value:       ${money.format(proposal.value)}`,
    `Version:     ${proposal.version}`,
    `Status:      ${proposal.state}`,
    `Owner:       ${ownerName}`,
    `Source:      ${proposal.source}`,
    `Last event:  ${proposal.lastEvent}`,
    "",
    "This document was generated locally in demo mode. It was not delivered to any address.",
  ].join("\n");
}

function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ProposalsScreen() {
  const { state, status, error, retry } = useDemoQuery();
  const breakpoint = useBreakpoint();

  const [q, setQ] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string | null>(null);
  const [valueFilter, setValueFilter] = useState<string | null>(null);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; next: ProposalState } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const ownerName = useCallback(
    (id: string) => (id === "unassigned" ? "Unassigned" : (state.team.find((m) => m.id === id)?.name ?? id)),
    [state.team],
  );

  const ownerOptions = useMemo(
    () => [...state.team.map((m) => ({ id: m.id, label: m.name })), { id: "unassigned", label: "Unassigned" }],
    [state.team],
  );

  const stateOptions = useMemo(() => STATES.map((s) => ({ id: s, label: s })), []);
  const valueOptions = useMemo(() => VALUE_BUCKETS.map((b) => ({ id: b.id, label: b.label })), []);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const bucket = VALUE_BUCKETS.find((b) => b.id === valueFilter);
    return state.proposals.filter((proposal) => {
      if (ownerFilter && proposal.ownerId !== ownerFilter) return false;
      if (stateFilter && proposal.state !== stateFilter) return false;
      if (bucket && !bucket.test(proposal.value)) return false;
      if (!needle) return true;
      return (
        proposal.id.toLowerCase().includes(needle) ||
        proposal.client.toLowerCase().includes(needle) ||
        proposal.leadName.toLowerCase().includes(needle) ||
        proposal.service.toLowerCase().includes(needle)
      );
    });
  }, [state.proposals, q, ownerFilter, stateFilter, valueFilter]);

  const totalValue = useMemo(() => rows.reduce((sum, p) => sum + p.value, 0), [rows]);
  const filtersApplied = Boolean(q || ownerFilter || stateFilter || valueFilter);
  const find = (id: string | null) => (id ? (state.proposals.find((p) => p.id === id) ?? null) : null);

  const detail = find(detailId);
  const editing = find(editId);
  const previewing = find(previewId);
  const confirming = confirm ? find(confirm.id) : null;

  const onDownload = (proposal: Proposal) => {
    downloadText(`${proposal.id}.txt`, proposalText(proposal, ownerName(proposal.ownerId)));
    setAnnouncement(`${proposal.id} downloaded to ${proposal.id}.txt (generated locally).`);
  };

  const onDuplicate = (proposal: Proposal) => {
    const id = duplicateProposal(proposal.id);
    setAnnouncement(`${proposal.id} duplicated as ${id}.`);
  };

  if (status === "loading") return <RouteLoading label="proposals" />;
  if (status === "error") return <RouteError label="proposals" error={error!} onRetry={retry} />;

  // CANON action set, plus the three pipeline transitions. Sent/accepted/declined open a
  // confirm dialog because they move the linked opportunity; archive is reversible enough to
  // fire straight from the menu.
  const rowMenu = (proposal: Proposal): MenuItem[] => [
    { id: "open", label: "Open details" },
    { id: "edit", label: "Edit proposal" },
    { id: "duplicate", label: "Duplicate" },
    { id: "preview", label: "Preview" },
    { id: "download", label: "Download (.txt)" },
    { id: "sent", label: "Mark sent", detail: "Moves opportunity to Proposal Sent", disabled: proposal.state === "SENT" },
    { id: "accepted", label: "Mark accepted", detail: "Moves opportunity to Won", disabled: proposal.state === "ACCEPTED" },
    { id: "declined", label: "Mark declined", detail: "Moves opportunity to Lost", disabled: proposal.state === "REJECTED" },
    { id: "archive", label: "Archive", disabled: proposal.state === "ARCHIVED" },
  ];

  const onMenuSelect = (proposal: Proposal, id: string) => {
    if (id === "open") setDetailId(proposal.id);
    else if (id === "edit") setEditId(proposal.id);
    else if (id === "duplicate") onDuplicate(proposal);
    else if (id === "preview") setPreviewId(proposal.id);
    else if (id === "download") onDownload(proposal);
    else if (id === "sent") setConfirm({ id: proposal.id, next: "SENT" });
    else if (id === "accepted") setConfirm({ id: proposal.id, next: "ACCEPTED" });
    else if (id === "declined") setConfirm({ id: proposal.id, next: "REJECTED" });
    else if (id === "archive") {
      setProposalState(proposal.id, "ARCHIVED");
      setAnnouncement(`${proposal.id} archived.`);
    }
  };

  const renderRow = (proposal: Proposal) => {
    const chip = (
      <span
        className="flex-shrink-0 font-cc-mono text-[8px] font-semibold tracking-[.05em] xl:text-[9.5px]"
        style={{ color: TONE_INK[STATE_TONE[proposal.state]] }}
      >
        {proposal.state}
      </span>
    );
    const menu = (
      <MenuButton
        label="⋯"
        ariaLabel={`Actions for ${proposal.id}`}
        align="right"
        width={280}
        items={rowMenu(proposal)}
        onSelect={(id) => onMenuSelect(proposal, id)}
        className="px-1 leading-none text-cc-icon-muted hover:text-cc-t2"
      />
    );

    if (breakpoint === "mobile") {
      return (
        <article
          key={proposal.id}
          aria-label={proposal.id}
          data-testid={`proposal-card-${proposal.id}`}
          className="mb-[9px] rounded-cc-card border border-cc-line bg-cc-surface px-[13px] py-[11px]"
        >
          <div className="flex justify-between gap-2">
            <button
              type="button"
              onClick={() => setDetailId(proposal.id)}
              className="min-w-0 truncate text-left text-[12.5px] font-semibold text-cc-ink"
            >
              {proposal.id} · {proposal.client}
            </button>
            <span className="flex flex-shrink-0 items-center gap-1.5">
              {chip}
              {menu}
            </span>
          </div>
          <div className="mt-0.5 text-[10.5px] text-cc-t3">
            {proposal.service} · {money.format(proposal.value)} · {proposal.version} · {ownerName(proposal.ownerId)}
          </div>
          <div className="mt-[3px] text-[10px] text-cc-t3">{proposal.lastEvent}</div>
          <div className="mt-[7px] flex gap-1.5">
            <button type="button" onClick={() => setPreviewId(proposal.id)} className={`flex-1 py-[7px] text-center ${SECONDARY_ACTION}`}>
              Preview
            </button>
            <button type="button" onClick={() => onDownload(proposal)} className={`flex-1 py-[7px] text-center ${SECONDARY_ACTION}`}>
              Download
            </button>
          </div>
        </article>
      );
    }

    return (
      <div
        key={proposal.id}
        data-testid={`proposal-row-${proposal.id}`}
        className="flex min-h-[58px] items-center gap-[13px] border-b border-cc-row-line px-4 py-2.5 last:border-b-0 xl:px-[18px]"
      >
        <span className="w-[74px] flex-shrink-0 font-cc-mono text-[11px] text-cc-t3">{proposal.id}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDetailId(proposal.id)}
              className="truncate text-[13px] font-semibold text-cc-ink hover:text-cc-green-ink"
            >
              {proposal.client}
            </button>
            <span className="truncate text-[11.5px] text-cc-t3">{proposal.leadName}</span>
          </div>
          <div className="mt-0.5 text-[11.5px] text-cc-t2">
            {proposal.service} · {proposal.version} · {ownerName(proposal.ownerId)} · {proposal.lastEvent}
          </div>
        </div>
        <span className="flex-shrink-0 font-cc-mono text-[12px] font-semibold text-cc-ink">{money.format(proposal.value)}</span>
        {chip}
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <button type="button" onClick={() => setPreviewId(proposal.id)} className={SECONDARY_ACTION}>
            Preview
          </button>
          {menu}
        </div>
      </div>
    );
  };

  return (
    <div>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <RouteToolbar>
        <SearchInput value={q} onChange={setQ} label="Search proposals by id, client, lead or service" />
        <FilterMenu label="Owner" allLabel="All owners" value={ownerFilter} options={ownerOptions} onChange={setOwnerFilter} />
        <FilterMenu label="Status" allLabel="Any status" value={stateFilter} options={stateOptions} onChange={setStateFilter} />
        <FilterMenu label="Value" allLabel="Any value" value={valueFilter} options={valueOptions} onChange={setValueFilter} />
        {filtersApplied ? (
          <ToolbarButton
            label="Clear filters"
            onClick={() => {
              setQ("");
              setOwnerFilter(null);
              setStateFilter(null);
              setValueFilter(null);
            }}
          />
        ) : null}
        <ToolbarButton label="New proposal" tone="primary" onClick={() => setCreateOpen(true)} />
      </RouteToolbar>

      {rows.length === 0 ? (
        <RouteEmpty
          title="No proposals to show"
          hint={filtersApplied ? "Clear a filter to see the rest." : "Create the first proposal to get started."}
        />
      ) : breakpoint === "mobile" ? (
        <>
          <p className="mb-2 font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">
            {rows.length} OF {state.proposals.length} · {money.format(totalValue)}
          </p>
          {rows.map(renderRow)}
        </>
      ) : (
        <div className="overflow-hidden rounded-cc-card border border-cc-line bg-cc-surface">
          <div className="flex items-center justify-between border-b border-cc-line bg-cc-secondary px-4 py-2 xl:px-[18px]">
            <span className="font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">
              {rows.length} OF {state.proposals.length}
            </span>
            <span className="font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">
              PIPELINE VALUE · {money.format(totalValue)}
            </span>
          </div>
          {rows.map(renderRow)}
        </div>
      )}

      {detail ? (
        <ProposalDetailDialog
          proposal={detail}
          ownerName={ownerName(detail.ownerId)}
          activity={state.activity.filter((entry) => entry.subjectId === detail.id)}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            setDetailId(null);
            setEditId(detail.id);
          }}
          onPreview={() => {
            setDetailId(null);
            setPreviewId(detail.id);
          }}
        />
      ) : null}

      {editing ? (
        <ProposalFormDialog
          title={`Edit ${editing.id}`}
          submitLabel="Save changes"
          owners={ownerOptions}
          initial={{
            client: editing.client,
            leadName: editing.leadName,
            service: editing.service,
            value: String(editing.value),
            ownerId: editing.ownerId,
            version: editing.version,
            source: editing.source,
          }}
          onClose={() => setEditId(null)}
          onSubmit={(draft) => {
            updateProposal(editing.id, {
              client: draft.client.trim(),
              leadName: draft.leadName.trim(),
              service: draft.service.trim(),
              value: Number(draft.value),
              ownerId: draft.ownerId,
              version: draft.version.trim(),
              source: draft.source.trim(),
            });
            setAnnouncement(`${editing.id} saved.`);
            setEditId(null);
          }}
        />
      ) : null}

      {createOpen ? (
        <CreateProposalDialog
          owners={ownerOptions}
          onClose={() => setCreateOpen(false)}
          onSubmit={(leadId, draft) => {
            const lead = LEAD_DIRECTORY.find((row) => row.id === leadId);
            if (!lead) return;
            const id = createProposal({
              leadId: lead.id,
              opportunityId: state.opportunities.find((o) => o.leadId === lead.id)?.id ?? null,
              client: draft.client.trim(),
              leadName: draft.leadName.trim(),
              service: draft.service.trim(),
              value: Number(draft.value),
              ownerId: draft.ownerId,
              version: draft.version.trim() || "v1",
              state: "DRAFT",
              lastEvent: "Created just now",
              source: draft.source.trim() || "Lead",
            });
            setAnnouncement(`${id} created for ${draft.client.trim()}.`);
            setCreateOpen(false);
          }}
        />
      ) : null}

      {previewing ? (
        <Dialog
          open
          title={`Preview — ${previewing.id}`}
          description={`${previewing.client} · ${previewing.service}`}
          onClose={() => setPreviewId(null)}
          width={560}
          footer={
            <>
              <DialogCancelButton onClick={() => setPreviewId(null)} label="Close" />
              <button
                type="button"
                onClick={() => onDownload(previewing)}
                className="rounded-cc-control bg-cc-green px-3 py-1.5 text-[12.5px] font-semibold text-white"
              >
                Download (.txt)
              </button>
            </>
          }
        >
          <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-cc-control bg-cc-soft px-3 py-3 font-cc-mono text-[11.5px] leading-[1.6] text-cc-t-table">
            {proposalText(previewing, ownerName(previewing.ownerId))}
          </pre>
        </Dialog>
      ) : null}

      {confirming && confirm ? (
        <ConfirmStateDialog
          proposal={confirming}
          next={confirm.next}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            setProposalState(confirming.id, confirm.next);
            setAnnouncement(
              confirm.next === "SENT"
                ? `${confirming.id} marked sent in demo mode — no email was delivered. Opportunity moved to Proposal Sent.`
                : confirm.next === "ACCEPTED"
                  ? `${confirming.id} accepted. Opportunity moved to Won.`
                  : `${confirming.id} declined. Opportunity moved to Lost.`,
            );
            setConfirm(null);
          }}
        />
      ) : null}
    </div>
  );
}

function ProposalDetailDialog({
  proposal,
  ownerName,
  activity,
  onClose,
  onEdit,
  onPreview,
}: {
  proposal: Proposal;
  ownerName: string;
  activity: readonly { id: string; message: string }[];
  onClose: () => void;
  onEdit: () => void;
  onPreview: () => void;
}) {
  return (
    <Dialog
      open
      title={`${proposal.id} · ${proposal.client}`}
      description={`${proposal.service} · ${proposal.version}`}
      onClose={onClose}
      width={520}
      footer={
        <>
          <DialogCancelButton onClick={onClose} label="Close" />
          <button
            type="button"
            onClick={onPreview}
            className="rounded-cc-control border border-cc-line-strong bg-cc-surface px-3 py-1.5 text-[12.5px] font-semibold text-cc-t-table"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-cc-control bg-cc-green px-3 py-1.5 text-[12.5px] font-semibold text-white"
          >
            Edit proposal
          </button>
        </>
      }
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
        <dt className="text-cc-t3">Client</dt>
        <dd className="text-cc-ink">{proposal.client}</dd>
        <dt className="text-cc-t3">Lead</dt>
        <dd className="text-cc-ink">{proposal.leadName}</dd>
        <dt className="text-cc-t3">Value</dt>
        <dd className="text-cc-ink">{money.format(proposal.value)}</dd>
        <dt className="text-cc-t3">Status</dt>
        <dd className="text-cc-ink">{proposal.state}</dd>
        <dt className="text-cc-t3">Owner</dt>
        <dd className="text-cc-ink">{ownerName}</dd>
        <dt className="text-cc-t3">Source</dt>
        <dd className="text-cc-ink">{proposal.source}</dd>
        <dt className="text-cc-t3">Related opportunity</dt>
        <dd className="text-cc-ink">{proposal.opportunityId ?? "None linked"}</dd>
        <dt className="text-cc-t3">Last event</dt>
        <dd className="text-cc-ink">{proposal.lastEvent}</dd>
      </dl>
      <h3 className="mt-4 font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">ACTIVITY HISTORY</h3>
      {activity.length === 0 ? (
        <p className="mt-1 text-[11.5px] text-cc-t3">No demo activity recorded for this proposal yet.</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {activity.map((entry) => (
            <li key={entry.id} className="text-[11.5px] text-cc-t-table">
              {entry.message}
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

function ConfirmStateDialog({
  proposal,
  next,
  onClose,
  onConfirm,
}: {
  proposal: Proposal;
  next: ProposalState;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const copy: Record<string, { title: string; body: string; label: string; tone: "green" | "red" }> = {
    SENT: {
      title: `Mark ${proposal.id} sent`,
      body: "This records a demo send and moves the linked opportunity to Proposal Sent. No email is delivered to any address.",
      label: "Mark sent",
      tone: "green",
    },
    ACCEPTED: {
      title: `Mark ${proposal.id} accepted`,
      body: "This moves the linked opportunity to Won and updates the lead status. Recorded in the local demo store only.",
      label: "Mark accepted",
      tone: "green",
    },
    REJECTED: {
      title: `Mark ${proposal.id} declined`,
      body: "This moves the linked opportunity to Lost and updates the lead status. Recorded in the local demo store only.",
      label: "Mark declined",
      tone: "red",
    },
  };
  const c = copy[next]!;
  return (
    <Dialog
      open
      title={c.title}
      description={`${proposal.client} · ${proposal.service}`}
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <button
            type="button"
            onClick={onConfirm}
            className={
              c.tone === "red"
                ? "rounded-cc-control bg-cc-red-ink px-3 py-1.5 text-[12.5px] font-semibold text-white"
                : "rounded-cc-control bg-cc-green px-3 py-1.5 text-[12.5px] font-semibold text-white"
            }
          >
            {c.label}
          </button>
        </>
      }
    >
      <p className="text-[12.5px] leading-[1.5] text-cc-t-table">{c.body}</p>
    </Dialog>
  );
}

function ProposalFormDialog({
  title,
  submitLabel,
  owners,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  owners: readonly { id: string; label: string }[];
  initial: ProposalDraft;
  onClose: () => void;
  onSubmit: (draft: ProposalDraft) => void;
}) {
  const [draft, setDraft] = useState<ProposalDraft>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof ProposalDraft, string>>>({});
  const patch = (values: Partial<ProposalDraft>) => setDraft((d) => ({ ...d, ...values }));
  return (
    <Dialog
      open
      title={title}
      description="Saved to the local demo store in this browser only."
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <DialogSubmitButton label={submitLabel} form="proposal-form" />
        </>
      }
    >
      <form
        id="proposal-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const next = validateProposalDraft(draft);
          setErrors(next);
          if (Object.keys(next).length === 0) onSubmit(draft);
        }}
      >
        <TextField label="Client" value={draft.client} error={errors.client} onChange={(client) => patch({ client })} />
        <TextField label="Lead name" value={draft.leadName} error={errors.leadName} onChange={(leadName) => patch({ leadName })} />
        <TextField label="Service" value={draft.service} error={errors.service} onChange={(service) => patch({ service })} />
        <TextField label="Value (USD)" type="number" value={draft.value} error={errors.value} onChange={(value) => patch({ value })} />
        <TextField label="Version" value={draft.version} onChange={(version) => patch({ version })} hint="e.g. v1, v2." />
        <SelectField
          label="Owner"
          value={draft.ownerId}
          onChange={(ownerId) => patch({ ownerId })}
          options={owners.map((owner) => ({ value: owner.id, label: owner.label }))}
        />
        <TextField label="Source" value={draft.source} onChange={(source) => patch({ source })} hint="e.g. Lead, Meeting, Template." />
      </form>
    </Dialog>
  );
}

function CreateProposalDialog({
  owners,
  onClose,
  onSubmit,
}: {
  owners: readonly { id: string; label: string }[];
  onClose: () => void;
  onSubmit: (leadId: string, draft: ProposalDraft) => void;
}) {
  const available = useMemo(() => LEAD_DIRECTORY.slice(0, 40), []);
  const first = available[0];
  const [leadId, setLeadId] = useState(first?.id ?? "");
  const [draft, setDraft] = useState<ProposalDraft>({
    client: first?.company ?? "",
    leadName: first?.name ?? "",
    service: first?.serviceInterest ?? "AI Automation",
    value: "40000",
    ownerId: owners[0]?.id ?? "unassigned",
    version: "v1",
    source: "Lead",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProposalDraft, string>>>({});
  const patch = (values: Partial<ProposalDraft>) => setDraft((d) => ({ ...d, ...values }));

  return (
    <Dialog
      open
      title="New proposal"
      description="Added to the local demo store only — no proposal is delivered to any address."
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <DialogSubmitButton label="Create proposal" form="create-proposal-form" />
        </>
      }
    >
      <form
        id="create-proposal-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const next = validateProposalDraft(draft);
          setErrors(next);
          if (Object.keys(next).length === 0) onSubmit(leadId, draft);
        }}
      >
        <SelectField
          label="Lead"
          value={leadId}
          onChange={(id) => {
            setLeadId(id);
            const lead = available.find((row) => row.id === id);
            if (lead) patch({ client: lead.company, leadName: lead.name, service: lead.serviceInterest ?? draft.service });
          }}
          options={available.map((lead) => ({ value: lead.id, label: `${lead.name} — ${lead.company}` }))}
        />
        <TextField label="Client" value={draft.client} error={errors.client} onChange={(client) => patch({ client })} />
        <TextField label="Lead name" value={draft.leadName} error={errors.leadName} onChange={(leadName) => patch({ leadName })} />
        <TextField label="Service" value={draft.service} error={errors.service} onChange={(service) => patch({ service })} />
        <TextField label="Value (USD)" type="number" value={draft.value} error={errors.value} onChange={(value) => patch({ value })} />
        <SelectField
          label="Owner"
          value={draft.ownerId}
          onChange={(ownerId) => patch({ ownerId })}
          options={owners.map((owner) => ({ value: owner.id, label: owner.label }))}
        />
        <TextField label="Source" value={draft.source} onChange={(source) => patch({ source })} />
      </form>
    </Dialog>
  );
}

export function validateProposalDraft(draft: ProposalDraft): Partial<Record<keyof ProposalDraft, string>> {
  const errors: Partial<Record<keyof ProposalDraft, string>> = {};
  if (!draft.client.trim()) errors.client = "Client is required.";
  if (!draft.leadName.trim()) errors.leadName = "Lead name is required.";
  if (!draft.service.trim()) errors.service = "Service is required.";
  const value = Number(draft.value);
  if (!draft.value.trim() || !Number.isFinite(value) || value < 0) errors.value = "Enter a value of 0 or more.";
  return errors;
}
