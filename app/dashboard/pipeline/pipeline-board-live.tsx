"use client";

// Live Pipeline board — real Lead rows, moved through their canonical stage via
// PATCH /api/leads/[id] (source: "pipeline"), atomic with a lead_stage_history row
// (supabase/migrations/20260813000000_leads_pipeline_stage.sql). A separate component
// from PipelineBoard (demo: Opportunity fixtures + pointer drag), per the split already
// established by lead-update-controls.tsx: live and demo are twin screens, not one
// screen branching internally.
//
// No pointer drag here. "Move to stage ▾" is already the canonical tablet/mobile/
// keyboard affordance for the demo board (T-03 926, MO-03 1097) and calls the same
// mutation drag does there — so making it the ONLY affordance here is not a corner
// cut, it is using the accessible path as the primary one. Desktop drag can be added
// later as a pure enhancement without touching this mutation.
//
// Card fields are exactly what Lead has: value/priority/context/nextAction/signal are
// Opportunity-only fixture enrichments with no column on public.leads.
//
// Concurrency/failure model: a move is never shown on the card until the PATCH
// resolves — there is no optimistic column change, so a failure has nothing to roll
// back, and a stale response (superseded by a second move on the same card) is
// dropped via a per-lead attempt token.
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchLeads } from "@/lib/data/leads";
import { RouteEmpty, RouteError, RouteLoading } from "@/components/demo/route-states";
import { MenuButton, type MenuItem } from "@/components/demo/menu";
import { Dialog, DialogCancelButton, DialogSubmitButton } from "@/components/demo/dialog";
import { TextAreaField } from "@/components/demo/field";
import { TONE_BASE } from "@/components/demo/tone";
import type { Tone } from "@/lib/demo/types";
import { ROW_ACTION_ICON_QUIET } from "@/lib/command-center/ui/control-system";
import { useStageWindow } from "./stage-window";
import {
  CANONICAL_LEAD_STATUS_ORDER,
  LEAD_STATUS_LABELS,
  LeadSchema,
  REASON_REQUIRED_STATUSES,
  type Lead,
  type LeadStatus,
} from "@command-center/contracts";

// CANON 1379-1388's four canonical tones plus the same synthetic extension pipeline-board.tsx
// uses for the other seven stages — duplicated rather than imported so this file has no
// dependency on lib/demo/seed.ts.
const STAGE_TONE: Record<LeadStatus, Tone> = {
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

type MoveState = { movingId: string | null; errors: Record<string, string> };

export function PipelineBoardLive() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [move, setMove] = useState<MoveState>({ movingId: null, errors: {} });
  const [gate, setGate] = useState<{ id: string; stage: LeadStatus } | null>(null);
  const [gateReason, setGateReason] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const tokens = useRef(new Map<string, number>());
  const window_ = useStageWindow();

  useEffect(() => {
    let active = true;
    fetchLeads({ pageSize: 200 })
      .then((res) => {
        if (active) setLeads(res.rows as Lead[]);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const doMove = useCallback(async (id: string, name: string, toStage: LeadStatus, reason?: string) => {
    const myToken = (tokens.current.get(id) ?? 0) + 1;
    tokens.current.set(id, myToken);
    setMove((prev) => ({ movingId: id, errors: { ...prev.errors, [id]: "" } }));

    let res: Response;
    try {
      res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: toStage, reason, source: "pipeline" }),
      });
    } catch {
      if (tokens.current.get(id) !== myToken) return;
      setMove((prev) => ({ movingId: null, errors: { ...prev.errors, [id]: "Network error — try again." } }));
      return;
    }
    const body = await res.json().catch(() => null);
    if (tokens.current.get(id) !== myToken) return; // superseded by a later move on this card

    if (!res.ok) {
      setMove((prev) => ({
        movingId: null,
        errors: { ...prev.errors, [id]: body?.error?.message ?? "That move failed." },
      }));
      return;
    }
    const updated = LeadSchema.parse(body);
    setLeads((prev) => (prev ? prev.map((l) => (l.id === id ? updated : l)) : prev));
    setMove((prev) => ({ movingId: null, errors: { ...prev.errors, [id]: "" } }));
    setAnnouncement(`${name} moved to ${LEAD_STATUS_LABELS[toStage]}.`);
  }, []);

  const performMove = useCallback(
    (id: string, name: string, toStage: LeadStatus) => {
      if (REASON_REQUIRED_STATUSES.includes(toStage)) {
        setGate({ id, stage: toStage });
        setGateReason("");
        setGateError(null);
        return;
      }
      void doMove(id, name, toStage);
    },
    [doMove],
  );

  if (error) {
    return (
      <RouteError
        label="the pipeline"
        error={error}
        onRetry={() => {
          setError(null);
          setAttempt((n) => n + 1);
        }}
      />
    );
  }
  if (!leads) return <RouteLoading label="the pipeline" />;

  const countByStage = new Map<LeadStatus, number>();
  for (const stage of CANONICAL_LEAD_STATUS_ORDER) countByStage.set(stage, 0);
  for (const lead of leads) countByStage.set(lead.status, (countByStage.get(lead.status) ?? 0) + 1);

  const gateCard = gate ? (leads.find((l) => l.id === gate.id) ?? null) : null;

  const stageMenuItems = (lead: Lead): MenuItem[] =>
    CANONICAL_LEAD_STATUS_ORDER.map((stage) => ({
      id: stage,
      label: `Move to ${LEAD_STATUS_LABELS[stage]}`,
      detail: String(countByStage.get(stage) ?? 0),
      selected: stage === lead.status,
      disabled: stage === lead.status || move.movingId === lead.id,
    }));

  return (
    <div>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-cc-mono text-[10.5px] text-cc-t3">
          {leads.length} {leads.length === 1 ? "lead" : "leads"}
        </span>
        <span className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => window_.step(-1)}
            disabled={!window_.canPrev}
            aria-label="Previous stages"
            className={ROW_ACTION_ICON_QUIET}
          >
            ‹
          </button>
          <span className="font-cc-mono text-[10.5px] text-cc-t3">
            STAGES {window_.start + 1}–{Math.min(window_.start + window_.columns, window_.total)} OF {window_.total}
          </span>
          <button
            type="button"
            onClick={() => window_.step(1)}
            disabled={!window_.canNext}
            aria-label="Next stages"
            className={ROW_ACTION_ICON_QUIET}
          >
            ›
          </button>
        </span>
      </div>

      {leads.length === 0 ? (
        <RouteEmpty title="No leads yet" hint="Leads appear here once they come in." />
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${window_.columns}, minmax(0, 1fr))` }}
        >
          {window_.stages.map((stage) => {
            const cards = leads.filter((l) => l.status === stage);
            const count = countByStage.get(stage) ?? 0;
            return (
              <section
                key={stage}
                aria-label={`${LEAD_STATUS_LABELS[stage]}, ${count} ${count === 1 ? "lead" : "leads"}`}
                className="rounded-cc-card border border-cc-line bg-cc-lane p-[10px]"
              >
                <div className="px-2 pt-1.5 pb-3">
                  <div className="flex items-center gap-2">
                    <i
                      aria-hidden="true"
                      className="h-[9px] w-[9px] rounded-[2px]"
                      style={{ background: TONE_BASE[STAGE_TONE[stage]] }}
                    />
                    <span className="text-[13.5px] font-semibold">{LEAD_STATUS_LABELS[stage]}</span>
                  </div>
                  <div className="mt-[3px] text-[11.5px] text-cc-t2">
                    {count} {count === 1 ? "lead" : "leads"}
                  </div>
                </div>
                {cards.length === 0 ? (
                  <p className="rounded-cc-control border border-dashed border-cc-line-strong px-3 py-4 text-center font-cc-mono text-[9.5px] text-cc-t4">
                    NO LEADS IN THIS STAGE
                  </p>
                ) : (
                  cards.map((lead) => {
                    const saving = move.movingId === lead.id;
                    const cardError = move.errors[lead.id];
                    return (
                      <article
                        key={lead.id}
                        data-testid={`pipeline-card-${lead.id}`}
                        className="mb-[10px] rounded-cc-card-lg border border-cc-line bg-cc-surface px-[14px] py-[13px]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-[14px] font-semibold text-cc-ink">
                            {lead.name}
                          </span>
                          <MenuButton
                            label={saving ? "Saving…" : "Move to stage"}
                            ariaLabel={`Move ${lead.name} to another stage`}
                            align="right"
                            width={240}
                            items={stageMenuItems(lead)}
                            onSelect={(id) => performMove(lead.id, lead.name, id as LeadStatus)}
                            chevron
                            className={ROW_ACTION_ICON_QUIET}
                          />
                        </div>
                        <div className="mt-px text-[12px] text-cc-t3">
                          {lead.company}
                          {lead.serviceInterest ? <> · <span className="text-cc-t-table">{lead.serviceInterest}</span></> : null}
                        </div>
                        <div className="mt-[9px] flex items-center justify-between gap-2 rounded-cc-control bg-cc-secondary px-[9px] py-[7px]">
                          <span className="min-w-0 truncate text-[11.5px] text-cc-t2">
                            {lead.ownerName ?? "Unassigned"}
                          </span>
                          {lead.nextStepLabel ? (
                            <span className="flex-shrink-0 text-[11.5px] font-semibold text-cc-green-ink">
                              {lead.nextStepLabel}
                            </span>
                          ) : null}
                        </div>
                        {cardError ? (
                          <p role="alert" className="mt-[7px] text-[11px] font-semibold text-cc-red-ink">
                            {cardError}
                          </p>
                        ) : null}
                      </article>
                    );
                  })
                )}
              </section>
            );
          })}
        </div>
      )}

      {gate && gateCard ? (
        <Dialog
          open
          title={`Move ${gateCard.name} to ${LEAD_STATUS_LABELS[gate.stage]}`}
          description="This stage is gated — record why the lead is closing here."
          onClose={() => setGate(null)}
          footer={
            <>
              <DialogCancelButton onClick={() => setGate(null)} />
              <DialogSubmitButton label="Move card" form="pipeline-live-gate-form" />
            </>
          }
        >
          <form
            id="pipeline-live-gate-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const reason = gateReason.trim();
              if (reason.length < 3) {
                setGateError("Give a reason of at least 3 characters.");
                return;
              }
              void doMove(gate.id, gateCard.name, gate.stage, reason);
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
              hint="Recorded on this lead's activity history."
            />
          </form>
        </Dialog>
      ) : null}
    </div>
  );
}
