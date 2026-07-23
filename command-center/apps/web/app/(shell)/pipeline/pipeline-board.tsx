"use client";
// Pipeline board — C-D06 (desktop), C-D07/C-D08 (card and drag states), T-03 (tablet),
// MO-03 (mobile).
//
// One board renders all three forms. The forms differ STRUCTURALLY, not just in spacing:
// desktop pages four stage columns, tablet two, and mobile shows one stage at a time with a
// stepper. Rendering three copies behind CSS visibility would triple the interactive surface
// and let the copies drift, so the column count is read as data (useBreakpoint) and the
// markup below adapts.
//
// Movement is implemented twice on purpose. Pointer drag is the canonical desktop
// affordance (C-D08); "Move to stage ▾" is the canonical tablet and mobile affordance
// (T-03 926, MO-03 1097) and is also the keyboard path, which is why MO-03 1099 states
// "MOVE MENU = DRAG ALTERNATIVE (NO DRAG REQUIRED)". Both call the same mutation, so a
// card cannot end up in a different place depending on how it was moved.
import { useCallback, useMemo, useState } from "react";
import {
  createOpportunity,
  moveOpportunity,
  stageRequiresReason,
  updateOpportunity,
} from "../../../lib/demo/actions";
import { LEAD_DIRECTORY, PIPELINE_STAGES, STAGE_LABELS, STAGE_META } from "../../../lib/demo/seed";
import type { Opportunity, PipelineStage, Tone } from "../../../lib/demo/types";
import { useDemoQuery } from "../../../components/demo/use-demo-query";
import { TONE_BASE, TONE_INK } from "../../../components/demo/tone";
import { MenuButton, type MenuItem } from "../../../components/demo/menu";
import { Dialog, DialogCancelButton, DialogSubmitButton } from "../../../components/demo/dialog";
import { SelectField, TextAreaField, TextField } from "../../../components/demo/field";
import { RouteEmpty, RouteError, RouteLoading } from "../../../components/demo/route-states";
import { FilterMenu, RouteToolbar, SearchInput, ToolbarButton } from "../../../components/demo/toolbar";
import { useStageWindow } from "./stage-window";

// CANON 1379-1388 gives four stages a colour: Contacted G.nt, Appointment Pending G.am,
// Appointment Scheduled G.gr, Proposal Sent G.bl. The remaining seven are not drawn on any
// canonical board frame; their tones below are SYNTHETIC and follow the same semantic
// grammar (waiting = amber, in-motion = blue, closed-won = green, closed-lost = red).
const STAGE_TONE: Record<PipelineStage, Tone> = {
  New: "neutral",
  Contacted: "neutral",
  "Appt Pending": "amber",
  "Appt Scheduled": "green",
  "Discovery Done": "green",
  "Proposal Req.": "amber",
  "Proposal Sent": "blue",
  Negotiation: "blue",
  Won: "green",
  Lost: "red",
  FUL: "neutral",
};

const PRIORITIES = ["High", "Medium", "Low"] as const;

type EditDraft = {
  context: string;
  nextAction: string;
  ownerId: string;
  value: string;
  priority: string;
  stage: PipelineStage;
};

type CreateDraft = EditDraft & { leadId: string };

function money(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}

export function PipelineBoard() {
  const { state, status, error, retry } = useDemoQuery();
  const window_ = useStageWindow();

  const [q, setQ] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [serviceFilter, setServiceFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [gate, setGate] = useState<{ id: string; stage: PipelineStage } | null>(null);
  const [gateReason, setGateReason] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);

  // Pointer drag and keyboard grab are separate states: a keyboard grab survives across
  // renders and has an origin to return to on Escape, a pointer drag does not.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<PipelineStage | null>(null);
  const [grab, setGrab] = useState<{ id: string; origin: PipelineStage } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const ownerName = useCallback(
    (id: string) => (id === "unassigned" ? "Unassigned" : (state.team.find((m) => m.id === id)?.name ?? id)),
    [state.team],
  );
  const ownerInitials = useCallback(
    (id: string) => (id === "unassigned" ? "—" : (state.team.find((m) => m.id === id)?.initials ?? "?")),
    [state.team],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.opportunities.filter((o) => {
      if (ownerFilter && o.ownerId !== ownerFilter) return false;
      if (serviceFilter && o.service !== serviceFilter) return false;
      if (priorityFilter && o.priority !== priorityFilter) return false;
      if (!needle) return true;
      return (
        o.name.toLowerCase().includes(needle) ||
        o.company.toLowerCase().includes(needle) ||
        o.service.toLowerCase().includes(needle)
      );
    });
  }, [state.opportunities, q, ownerFilter, serviceFilter, priorityFilter]);

  // Counted over the FILTERED set, so a column header can never claim more cards than the
  // column shows. With no filter applied these are the canonical stage counts.
  const countByStage = useMemo(() => {
    const counts = new Map<PipelineStage, number>();
    for (const stage of PIPELINE_STAGES) counts.set(stage, 0);
    for (const o of filtered) counts.set(o.stage, (counts.get(o.stage) ?? 0) + 1);
    return counts;
  }, [filtered]);

  const serviceOptions = useMemo(() => {
    const services = new Map<string, number>();
    for (const o of state.opportunities) services.set(o.service, (services.get(o.service) ?? 0) + 1);
    return [...services]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([id, count]) => ({ id, label: id, count }));
  }, [state.opportunities]);

  const ownerOptions = useMemo(
    () => [
      ...state.team.map((m) => ({ id: m.id, label: m.name })),
      { id: "unassigned", label: "Unassigned" },
    ],
    [state.team],
  );

  const filtersApplied = Boolean(q || ownerFilter || serviceFilter || priorityFilter);

  const performMove = useCallback(
    (id: string, stage: PipelineStage, reason?: string) => {
      const card = state.opportunities.find((o) => o.id === id);
      if (!card || card.stage === stage) return;
      if (stageRequiresReason(stage) && !reason) {
        setGate({ id, stage });
        setGateReason("");
        setGateError(null);
        return;
      }
      moveOpportunity(id, stage, reason);
      setAnnouncement(
        `${card.name} moved to ${STAGE_LABELS[stage]}. ${STAGE_LABELS[stage]} now has ${
          (countByStage.get(stage) ?? 0) + 1
        } cards.`,
      );
    },
    [state.opportunities, countByStage],
  );

  const onCardKeyDown = useCallback(
    (event: React.KeyboardEvent, card: Opportunity) => {
      // CANON 213: "press Space to pick up and ⌥ + arrows to move". Escape cancels, which
      // means returning the card to the stage the grab started in — a cancel that left the
      // card where the last arrow put it would be a lie.
      if (event.key === " ") {
        event.preventDefault();
        if (grab?.id === card.id) {
          setGrab(null);
          setAnnouncement(`${card.name} dropped in ${STAGE_LABELS[card.stage]}.`);
        } else {
          setGrab({ id: card.id, origin: card.stage });
          setAnnouncement(`${card.name} picked up from ${STAGE_LABELS[card.stage]}. Use Alt with the arrow keys to move it, Escape to cancel.`);
        }
        return;
      }
      if (event.key === "Escape" && grab?.id === card.id) {
        event.preventDefault();
        if (card.stage !== grab.origin) moveOpportunity(card.id, grab.origin);
        setGrab(null);
        setAnnouncement(`Move cancelled. ${card.name} returned to ${STAGE_LABELS[grab.origin]}.`);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        setDetailId(card.id);
        return;
      }
      if (!grab || grab.id !== card.id || !event.altKey) return;
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const index = PIPELINE_STAGES.indexOf(card.stage);
      const next = PIPELINE_STAGES[index + (event.key === "ArrowRight" ? 1 : -1)];
      if (!next) {
        setAnnouncement(`${card.name} is already in the ${event.key === "ArrowRight" ? "last" : "first"} stage.`);
        return;
      }
      // A gated stage opens the reason dialog, which takes focus — so the grab ends here
      // rather than leaving an invisible pick-up active behind a modal.
      if (stageRequiresReason(next)) setGrab(null);
      performMove(card.id, next);
    },
    [grab, performMove],
  );

  const detail = detailId ? state.opportunities.find((o) => o.id === detailId) ?? null : null;
  const editing = editId ? state.opportunities.find((o) => o.id === editId) ?? null : null;
  const gateCard = gate ? state.opportunities.find((o) => o.id === gate.id) ?? null : null;

  if (status === "loading") return <RouteLoading label="the pipeline" />;
  if (status === "error") return <RouteError label="the pipeline" error={error!} onRetry={retry} />;

  const stageMenuItems = (card: Opportunity): MenuItem[] =>
    PIPELINE_STAGES.map((stage) => ({
      id: stage,
      label: STAGE_LABELS[stage],
      detail: String(countByStage.get(stage) ?? 0),
      selected: stage === card.stage,
      disabled: stage === card.stage,
    }));

  const renderCard = (card: Opportunity, form: "desktop" | "tablet" | "mobile") => {
    const tone = card.signal?.tone;
    const grabbed = grab?.id === card.id;
    return (
      <article
        key={card.id}
        tabIndex={0}
        aria-roledescription="Pipeline card"
        aria-label={`${card.name}, ${card.company}, ${STAGE_LABELS[card.stage]}`}
        aria-grabbed={grabbed || undefined}
        draggable={form === "desktop"}
        onDragStart={(event) => {
          setDraggingId(card.id);
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", card.id);
        }}
        onDragEnd={() => {
          setDraggingId(null);
          setDropStage(null);
        }}
        onKeyDown={(event) => onCardKeyDown(event, card)}
        data-testid={`pipeline-card-${card.id}`}
        className={`mb-[10px] rounded-cc-card-lg border bg-cc-surface px-[14px] py-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cc-green ${
          grabbed
            ? "border-cc-green shadow-[0_6px_18px_rgba(47,125,79,.22)]"
            : draggingId === card.id
              ? "border-dashed border-cc-line-strong opacity-60"
              : "border-cc-line hover:border-cc-green-border hover:shadow-[0_4px_12px_rgba(20,26,30,.08)]"
        }`}
      >
        {tone ? (
          <div
            aria-hidden="true"
            className="-mx-[14px] -mt-[13px] mb-[10px] h-[3px] rounded-t-[3px]"
            style={{ background: TONE_BASE[tone] }}
          />
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[14px] font-semibold text-cc-ink">{card.name}</span>
          <span className="flex flex-shrink-0 items-center gap-[7px]">
            {card.signal ? (
              <span
                className="text-[10px] font-bold uppercase tracking-[.05em]"
                style={{ color: TONE_INK[card.signal.tone] }}
              >
                {card.signal.label}
              </span>
            ) : null}
            <MenuButton
              label="⋯"
              ariaLabel={`Actions for ${card.name}`}
              align="right"
              width={240}
              items={[
                { id: "open", label: "Open details" },
                { id: "edit", label: "Edit opportunity" },
                ...stageMenuItems(card).map((item) => ({ ...item, label: `Move to ${item.label}` })),
              ]}
              onSelect={(id) => {
                if (id === "open") setDetailId(card.id);
                else if (id === "edit") setEditId(card.id);
                else performMove(card.id, id as PipelineStage);
              }}
              className="px-1 leading-none text-cc-icon-muted hover:text-cc-t2"
            />
          </span>
        </div>

        <div className="mt-px text-[12px] text-cc-t3">
          {card.company} · <span className="text-cc-t-table">{card.service}</span>
        </div>
        <div className="mt-[9px] text-[12px] leading-[1.45] text-cc-t-table">{card.context}</div>

        {form === "mobile" ? (
          <div className="mt-[9px] flex gap-[7px]">
            <button
              type="button"
              onClick={() => setDetailId(card.id)}
              className="flex-1 rounded-cc-control border border-cc-line-strong py-[9px] text-center text-[11.5px] font-semibold text-cc-t-table"
            >
              Open
            </button>
            <MenuButton
              label="Move to stage ▾"
              ariaLabel={`Move ${card.name} to another stage`}
              align="right"
              items={stageMenuItems(card)}
              onSelect={(id) => performMove(card.id, id as PipelineStage)}
              className="flex-1 rounded-cc-control border border-cc-green-border bg-cc-green-tint py-[9px] text-center text-[11.5px] font-semibold text-cc-green-ink"
            />
          </div>
        ) : form === "tablet" ? (
          <div className="mt-[10px] flex items-center justify-between gap-2 rounded-cc-control bg-cc-secondary px-[9px] py-[7px]">
            <span className="min-w-0 truncate text-[11px] text-cc-t2">{ownerName(card.ownerId)}</span>
            <MenuButton
              label="Move to stage ▾"
              ariaLabel={`Move ${card.name} to another stage`}
              align="right"
              items={stageMenuItems(card)}
              onSelect={(id) => performMove(card.id, id as PipelineStage)}
              className="flex-shrink-0 text-[11px] font-semibold text-cc-green-ink"
            />
          </div>
        ) : (
          <div className="mt-[11px] flex items-center justify-between gap-2 rounded-cc-control bg-cc-secondary px-[9px] py-[7px]">
            <span className="flex min-w-0 items-center gap-[7px]">
              <span
                aria-hidden="true"
                className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[5px] bg-cc-soft text-[8.5px] font-bold text-cc-green-ink"
              >
                {ownerInitials(card.ownerId)}
              </span>
              <span className="min-w-0 truncate text-[11.5px] text-cc-t2">{ownerName(card.ownerId)}</span>
            </span>
            <span className="flex-shrink-0 text-[11.5px] font-semibold text-cc-green-ink">{card.nextAction}</span>
          </div>
        )}
      </article>
    );
  };

  const renderColumn = (stage: PipelineStage, form: "desktop" | "tablet") => {
    const cards = filtered.filter((o) => o.stage === stage);
    const meta = STAGE_META[stage];
    const count = countByStage.get(stage) ?? 0;
    return (
      <section
        key={stage}
        aria-label={`${STAGE_LABELS[stage]}, ${count} ${count === 1 ? "lead" : "leads"}`}
        onDragOver={(event) => {
          if (!draggingId) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          setDropStage(stage);
        }}
        onDragLeave={() => setDropStage((current) => (current === stage ? null : current))}
        onDrop={(event) => {
          event.preventDefault();
          const id = event.dataTransfer.getData("text/plain") || draggingId;
          setDraggingId(null);
          setDropStage(null);
          if (id) performMove(id, stage);
        }}
        data-testid={`pipeline-column-${stage}`}
        className={`rounded-cc-card border p-[10px] ${
          dropStage === stage ? "border-cc-green bg-cc-green-tint" : "border-cc-line bg-cc-lane"
        } ${form === "desktop" ? "min-h-[820px]" : ""}`}
      >
        <div className="px-2 pt-1.5 pb-3">
          <div className="flex items-center gap-2">
            <i
              aria-hidden="true"
              className="h-[9px] w-[9px] rounded-[2px]"
              style={{ background: TONE_BASE[STAGE_TONE[stage]] }}
            />
            <span className={form === "desktop" ? "text-[14px] font-semibold" : "text-[13.5px] font-semibold"}>
              {STAGE_LABELS[stage]}
            </span>
          </div>
          <div className="mt-[3px] text-[11.5px] text-cc-t2">
            {count} {count === 1 ? "lead" : "leads"}
            {meta ? ` · average age ${meta.averageAge}` : ""}
          </div>
          {form === "desktop" && meta ? <div className="text-[11px] text-cc-t3">{meta.note}</div> : null}
        </div>
        {cards.length === 0 ? (
          <p className="rounded-cc-control border border-dashed border-cc-line-strong px-3 py-4 text-center font-cc-mono text-[9.5px] text-cc-t4">
            {filtersApplied ? "NO CARDS MATCH THE CURRENT FILTERS" : "NO CARDS IN THIS STAGE"}
          </p>
        ) : (
          cards.map((card) => renderCard(card, form))
        )}
      </section>
    );
  };

  const mobileStage = window_.stages[0]!;
  const mobileCards = filtered.filter((o) => o.stage === mobileStage);
  const mobileMeta = STAGE_META[mobileStage];

  return (
    <div>
      {/* Announced, not shown. A move is visible on screen as the card changing column; a
          screen-reader user needs it stated, including the resulting stage count. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/* The canonical board frames draw no toolbar. Search, owner, service and priority
          filters are required by the implementation brief, so they are added here as a
          documented additive deviation rather than omitted. */}
      <RouteToolbar>
        <SearchInput value={q} onChange={setQ} label="Search pipeline by name, company or service" />
        <FilterMenu label="Owner" allLabel="All owners" value={ownerFilter} options={ownerOptions} onChange={setOwnerFilter} />
        <FilterMenu label="Service" allLabel="All services" value={serviceFilter} options={serviceOptions} onChange={setServiceFilter} />
        <FilterMenu
          label="Priority"
          allLabel="All priorities"
          value={priorityFilter}
          options={PRIORITIES.map((p) => ({ id: p, label: p }))}
          onChange={setPriorityFilter}
        />
        {filtersApplied ? (
          <ToolbarButton
            label="Clear filters"
            onClick={() => {
              setQ("");
              setOwnerFilter(null);
              setServiceFilter(null);
              setPriorityFilter(null);
            }}
          />
        ) : null}
        <ToolbarButton label="New opportunity" tone="primary" onClick={() => setCreateOpen(true)} />
      </RouteToolbar>

      {window_.breakpoint === "mobile" ? (
        <>
          {/* MO-03 1091: stage stepper, position line and progress dots. */}
          <div className="-mx-4 mb-[11px] border-b border-cc-line bg-cc-surface px-4 py-[11px]">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => window_.step(-1)}
                disabled={!window_.canPrev}
                aria-label="Previous stage"
                className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-cc-control border border-cc-line-strong text-cc-t2 disabled:opacity-40"
              >
                <span aria-hidden="true">‹</span>
              </button>
              <div className="text-center">
                <div className="flex items-center justify-center gap-[7px]">
                  <i
                    aria-hidden="true"
                    className="h-2 w-2 rounded-[2px]"
                    style={{ background: TONE_BASE[STAGE_TONE[mobileStage]] }}
                  />
                  <span className="text-[13.5px] font-semibold">{STAGE_LABELS[mobileStage]}</span>
                </div>
                <div className="mt-0.5 text-[10px] text-cc-t3">
                  Stage {window_.start + 1} of {window_.total} · {mobileCards.length}{" "}
                  {mobileCards.length === 1 ? "lead" : "leads"}
                  {mobileMeta ? ` · avg ${mobileMeta.averageAge}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => window_.step(1)}
                disabled={!window_.canNext}
                aria-label="Next stage"
                className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-cc-control border border-cc-t-table text-cc-ink disabled:opacity-40"
              >
                <span aria-hidden="true">›</span>
              </button>
            </div>
            <div className="mt-[9px] flex items-center justify-center gap-1">
              {PIPELINE_STAGES.map((stage, index) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => window_.setStart(index)}
                  aria-label={`Show ${STAGE_LABELS[stage]}`}
                  aria-current={index === window_.start ? "true" : undefined}
                  className={
                    index === window_.start
                      ? "h-[5px] w-4 rounded-[3px] bg-cc-ink-strong"
                      : "h-[5px] w-[5px] rounded-full bg-cc-line-strong"
                  }
                />
              ))}
            </div>
          </div>

          {mobileCards.length === 0 ? (
            <RouteEmpty
              title={filtersApplied ? "No cards match the current filters" : "No cards in this stage"}
              hint={filtersApplied ? "Clear a filter, or step to another stage." : "Step to another stage."}
            />
          ) : (
            <>
              {mobileCards.map((card) => renderCard(card, "mobile"))}
              <p className="rounded-cc-card border-[1.5px] border-dashed border-cc-icon-muted p-3.5 text-center font-cc-mono text-[9.5px] text-cc-t4">
                MOVE MENU = DRAG ALTERNATIVE (NO DRAG REQUIRED)
              </p>
            </>
          )}
        </>
      ) : (
        <div
          className={`grid gap-4 ${window_.breakpoint === "desktop" ? "grid-cols-4" : "grid-cols-2 gap-[14px]"}`}
        >
          {window_.stages.map((stage) => renderColumn(stage, window_.breakpoint === "desktop" ? "desktop" : "tablet"))}
        </div>
      )}

      {detail ? (
        <OpportunityDetailDialog
          opportunity={detail}
          ownerName={ownerName(detail.ownerId)}
          activity={state.activity.filter((entry) => entry.subjectId === detail.id)}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            setDetailId(null);
            setEditId(detail.id);
          }}
        />
      ) : null}

      {editing ? (
        <OpportunityFormDialog
          title={`Edit ${editing.name}`}
          description="Saved to the local demo store in this browser only."
          submitLabel="Save changes"
          owners={ownerOptions}
          initial={{
            context: editing.context,
            nextAction: editing.nextAction,
            ownerId: editing.ownerId,
            value: String(editing.value),
            priority: editing.priority,
            stage: editing.stage,
          }}
          onClose={() => setEditId(null)}
          onSubmit={(draft) => {
            updateOpportunity(editing.id, {
              context: draft.context.trim(),
              nextAction: draft.nextAction.trim(),
              ownerId: draft.ownerId,
              value: Number(draft.value),
              priority: draft.priority as Opportunity["priority"],
              stage: draft.stage,
            });
            setAnnouncement(`${editing.name} updated.`);
            setEditId(null);
          }}
        />
      ) : null}

      {createOpen ? (
        <CreateOpportunityDialog
          owners={ownerOptions}
          takenLeadIds={new Set(state.opportunities.map((o) => o.leadId))}
          onClose={() => setCreateOpen(false)}
          onSubmit={(draft) => {
            const lead = LEAD_DIRECTORY.find((row) => row.id === draft.leadId);
            if (!lead) return;
            createOpportunity({
              leadId: lead.id,
              name: lead.name,
              company: lead.company,
              service: lead.serviceInterest ?? "AI Automation",
              context: draft.context.trim(),
              nextAction: draft.nextAction.trim(),
              ownerId: draft.ownerId,
              stage: draft.stage,
              signal: null,
              value: Number(draft.value),
              priority: draft.priority as Opportunity["priority"],
            });
            setAnnouncement(`${lead.name} added to ${STAGE_LABELS[draft.stage]}.`);
            setCreateOpen(false);
          }}
        />
      ) : null}

      {gate && gateCard ? (
        <Dialog
          open
          title={`Move ${gateCard.name} to ${STAGE_LABELS[gate.stage]}`}
          description="This stage is gated — record why the lead is closing here."
          onClose={() => setGate(null)}
          footer={
            <>
              <DialogCancelButton onClick={() => setGate(null)} />
              <DialogSubmitButton label="Move card" form="pipeline-gate-form" />
            </>
          }
        >
          <form
            id="pipeline-gate-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const reason = gateReason.trim();
              if (reason.length < 3) {
                setGateError("Give a reason of at least 3 characters.");
                return;
              }
              performMove(gate.id, gate.stage, reason);
              setGate(null);
            }}
          >
            <TextAreaField
              label="Reason"
              value={gateReason}
              onChange={(value) => {
                setGateReason(value);
                if (gateError) setGateError(null);
              }}
              error={gateError ?? undefined}
              hint="Recorded on this opportunity's activity history."
            />
          </form>
        </Dialog>
      ) : null}
    </div>
  );
}

function OpportunityDetailDialog({
  opportunity,
  ownerName,
  activity,
  onClose,
  onEdit,
}: {
  opportunity: Opportunity;
  ownerName: string;
  activity: readonly { id: string; message: string }[];
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <Dialog
      open
      title={opportunity.name}
      description={`${opportunity.company} · ${opportunity.service}`}
      onClose={onClose}
      width={520}
      footer={
        <>
          <DialogCancelButton onClick={onClose} label="Close" />
          <button
            type="button"
            onClick={onEdit}
            className="rounded-cc-control bg-cc-green px-3 py-1.5 text-[12.5px] font-semibold text-white"
          >
            Edit opportunity
          </button>
        </>
      }
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
        <dt className="text-cc-t3">Stage</dt>
        <dd className="text-cc-ink">{STAGE_LABELS[opportunity.stage]}</dd>
        <dt className="text-cc-t3">Owner</dt>
        <dd className="text-cc-ink">{ownerName}</dd>
        <dt className="text-cc-t3">Value</dt>
        <dd className="text-cc-ink">{money(opportunity.value)}</dd>
        <dt className="text-cc-t3">Priority</dt>
        <dd className="text-cc-ink">{opportunity.priority}</dd>
        <dt className="text-cc-t3">Next action</dt>
        <dd className="text-cc-ink">{opportunity.nextAction}</dd>
      </dl>
      <p className="mt-3 border-t border-cc-line pt-3 text-[12.5px] text-cc-t-table">{opportunity.context}</p>
      <h3 className="mt-4 font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">ACTIVITY HISTORY</h3>
      {activity.length === 0 ? (
        <p className="mt-1 text-[11.5px] text-cc-t3">No demo activity recorded for this opportunity yet.</p>
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

function OpportunityFormDialog({
  title,
  description,
  submitLabel,
  owners,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  description: string;
  submitLabel: string;
  owners: readonly { id: string; label: string }[];
  initial: EditDraft;
  onClose: () => void;
  onSubmit: (draft: EditDraft) => void;
}) {
  const [draft, setDraft] = useState<EditDraft>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof EditDraft, string>>>({});

  return (
    <Dialog
      open
      title={title}
      description={description}
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <DialogSubmitButton label={submitLabel} form="opportunity-form" />
        </>
      }
    >
      <form
        id="opportunity-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const next = validateOpportunityDraft(draft);
          setErrors(next);
          if (Object.keys(next).length === 0) onSubmit(draft);
        }}
      >
        <OpportunityFields draft={draft} errors={errors} owners={owners} onChange={setDraft} />
      </form>
    </Dialog>
  );
}

function CreateOpportunityDialog({
  owners,
  takenLeadIds,
  onClose,
  onSubmit,
}: {
  owners: readonly { id: string; label: string }[];
  takenLeadIds: ReadonlySet<string>;
  onClose: () => void;
  onSubmit: (draft: CreateDraft) => void;
}) {
  // Only leads that are not already on the board, so a create cannot produce two cards for
  // the same person — the brief's "no card may duplicate" applies to creation too.
  const available = useMemo(
    () => LEAD_DIRECTORY.filter((lead) => !takenLeadIds.has(lead.id)).slice(0, 40),
    [takenLeadIds],
  );
  const [draft, setDraft] = useState<CreateDraft>({
    leadId: available[0]?.id ?? "",
    context: "",
    nextAction: "",
    ownerId: owners[0]?.id ?? "unassigned",
    value: "12000",
    priority: "Medium",
    stage: "New",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateDraft, string>>>({});

  if (available.length === 0) {
    return (
      <Dialog
        open
        title="New opportunity"
        description="Every lead in the demo dataset already has a pipeline card."
        onClose={onClose}
        footer={<DialogCancelButton onClick={onClose} label="Close" />}
      >
        <p className="text-[12.5px] text-cc-t-table">
          Nothing to add. Reset the demo data to start over.
        </p>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      title="New opportunity"
      description="Added to the local demo store in this browser only."
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <DialogSubmitButton label="Create opportunity" form="create-opportunity-form" />
        </>
      }
    >
      <form
        id="create-opportunity-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const next: Partial<Record<keyof CreateDraft, string>> = validateOpportunityDraft(draft);
          if (!draft.leadId) next.leadId = "Choose the lead this opportunity belongs to.";
          setErrors(next);
          if (Object.keys(next).length === 0) onSubmit(draft);
        }}
      >
        <SelectField
          label="Lead"
          value={draft.leadId}
          error={errors.leadId}
          onChange={(leadId) => setDraft((d) => ({ ...d, leadId }))}
          options={available.map((lead) => ({ value: lead.id, label: `${lead.name} — ${lead.company}` }))}
        />
        <OpportunityFields
          draft={draft}
          errors={errors}
          owners={owners}
          onChange={(next) => setDraft((d) => ({ ...d, ...next }))}
        />
      </form>
    </Dialog>
  );
}

function OpportunityFields({
  draft,
  errors,
  owners,
  onChange,
}: {
  draft: EditDraft;
  errors: Partial<Record<keyof EditDraft, string>>;
  owners: readonly { id: string; label: string }[];
  onChange: (draft: EditDraft) => void;
}) {
  const patch = (values: Partial<EditDraft>) => onChange({ ...draft, ...values });
  return (
    <>
      <SelectField
        label="Stage"
        value={draft.stage}
        onChange={(stage) => patch({ stage: stage as PipelineStage })}
        options={PIPELINE_STAGES.map((stage) => ({ value: stage, label: STAGE_LABELS[stage] }))}
      />
      <SelectField
        label="Owner"
        value={draft.ownerId}
        onChange={(ownerId) => patch({ ownerId })}
        options={owners.map((owner) => ({ value: owner.id, label: owner.label }))}
      />
      <TextField
        label="Value (USD)"
        type="number"
        value={draft.value}
        error={errors.value}
        onChange={(value) => patch({ value })}
      />
      <SelectField
        label="Priority"
        value={draft.priority}
        onChange={(priority) => patch({ priority })}
        options={PRIORITIES.map((p) => ({ value: p, label: p }))}
      />
      <TextAreaField
        label="Context"
        value={draft.context}
        error={errors.context}
        onChange={(context) => patch({ context })}
        hint="The line the card shows on the board."
      />
      <TextField
        label="Next action"
        value={draft.nextAction}
        error={errors.nextAction}
        onChange={(nextAction) => patch({ nextAction })}
      />
    </>
  );
}

export function validateOpportunityDraft(draft: EditDraft): Partial<Record<keyof EditDraft, string>> {
  const errors: Partial<Record<keyof EditDraft, string>> = {};
  if (!draft.context.trim()) errors.context = "Context is required — it is the line the card shows.";
  if (!draft.nextAction.trim()) errors.nextAction = "Next action is required.";
  const value = Number(draft.value);
  if (!draft.value.trim() || Number.isNaN(value) || value < 0) errors.value = "Value must be a number of 0 or more.";
  return errors;
}
