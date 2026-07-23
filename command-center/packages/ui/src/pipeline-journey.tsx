// PIPELINE_JOURNEY per Dashboard/docs/COMPONENT-SOURCE-MAP.md COMP_PIPELINE_JOURNEY,
// canonicalDesignFrame C-D01 (SCREEN_OVERVIEW), source:
// Dashboard/Command Center Final.dc.html lines 62-66 (desktop rail widget),
// 875-879 (tablet phase cards), 1060-1062 (mobile bottleneck summary).
// Scope: compact 6-phase summary only. The full expandable exact-status detail
// screen (C-D03/C-D04, per-status sub-cards) is a separate frame, NOT in Phase 3's
// acceptance-frames list (C-D01, C-D05, MO-01, MO-02, T-01, T-02) — not built here.
// No expand/hover interaction implemented in this widget, so no client boundary needed.
//
// The three canonical frames render the same six phases three different ways: a
// vertical rail list with a colour bar and alert badges (desktop), a 3-column
// card grid with no conversion age and no alerts (tablet), and a single
// bottleneck sentence (mobile). Hence an explicit `variant` rather than one
// markup tree stretched across all three.
//
// The `segments` field is design-authority data (CANON 1352-1359) that the C-D01
// widget does not draw — the distribution bar belongs to C-D04. It is carried on
// the type rather than dropped, so the fixture stays a faithful copy of source.
//
// Data-model note: phase names, counts, conversion/age text, and alert text have no
// backing contract or endpoint in @command-center/contracts — they exist only as
// inline mock data in the design source's JS (mkPhase calls). Per the anti-invention
// instruction, this component takes phases as a typed prop rather than deriving them
// from LeadStatusSchema (whose 6-value enum does not map cleanly onto the design's
// 6-phase model). Callers pass design-authority sample values (see
// apps/web/mocks/fixtures/pipeline-phases.ts) until a real pipeline-aggregation
// contract exists in a later phase.

export type PipelinePhaseSegment = { color: string; widthPercent: string };

export type PipelinePhase = {
  name: string;
  color: string;
  count: string;
  conversionText: string;
  ageText: string;
  alertText?: string | null;
  alertColor?: string;
  alertTint?: string;
  segments: PipelinePhaseSegment[];
};

export type PipelineJourneyProps = {
  activeCount: string;
  phases: PipelinePhase[];
  variant: "desktop" | "tablet" | "mobile";
};

const CARD = "rounded-cc-card border border-cc-line bg-cc-surface";

export function PipelineJourney({ activeCount, phases, variant }: PipelineJourneyProps) {
  if (variant === "mobile") return <MobileSummary activeCount={activeCount} phases={phases} />;
  if (variant === "tablet") return <TabletCards activeCount={activeCount} phases={phases} />;

  // CANON 62-66.
  return (
    <div className={CARD}>
      <div className="px-4 pt-3 pb-2.5">
        <h2 className="text-[15px] font-semibold text-cc-ink">Pipeline Journey</h2>
        <div className="mt-px text-[11.5px] text-cc-t3">
          {activeCount} active · {phases.length} phases · all 11 statuses inside
        </div>
      </div>
      {phases.map((p) => (
        <div
          key={p.name}
          className="flex items-center gap-3 border-t border-cc-soft px-4 py-[7px]"
        >
          <div
            className="h-[30px] w-1.5 shrink-0 rounded-[3px]"
            style={{ backgroundColor: p.color }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[13px] font-semibold text-cc-ink">{p.name}</span>
              <span className="font-cc-mono text-[11px] text-cc-t2">{p.count}</span>
            </div>
            <div className="text-[11px] text-cc-t3">
              {p.conversionText} · avg {p.ageText}
            </div>
          </div>
          {p.alertText ? (
            <span
              className="shrink-0 rounded-[4px] px-[7px] py-0.5 text-[10.5px] font-semibold whitespace-nowrap"
              style={{
                color: p.alertColor ?? "var(--cc-amber-ink)",
                backgroundColor: p.alertTint ?? "var(--cc-amber-tint)",
              }}
            >
              {p.alertText}
            </span>
          ) : null}
        </div>
      ))}
      <div className="border-t border-cc-soft px-4 pt-[7px] pb-2 text-[11px] text-cc-t3">
        Hover or expand a phase for its exact statuses
      </div>
    </div>
  );
}

// CANON 875-878.
function TabletCards({ activeCount, phases }: { activeCount: string; phases: PipelinePhase[] }) {
  return (
    <div className={CARD}>
      <div className="px-4 pt-[11px] pb-2 text-[13px] font-semibold text-cc-ink">
        Pipeline Journey{" "}
        <span className="font-cc-mono text-[10px] font-normal text-cc-t3">
          · {activeCount} ACTIVE · TAP A PHASE FOR EXACT STATUSES
        </span>
      </div>
      <div className="grid grid-cols-3 gap-[9px] px-4 pb-3.5">
        {phases.map((p) => (
          <div key={p.name} className="rounded-cc-control border border-cc-line px-[11px] py-[9px]">
            <div className="flex items-center gap-1.5">
              <i
                className="h-[7px] w-[7px] shrink-0 rounded-[2px]"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-[11.5px] font-semibold text-cc-ink">{p.name}</span>
            </div>
            <div className="mt-[5px] font-cc-mono text-[17px] font-semibold text-cc-ink">
              {p.count}
            </div>
            <div className="text-[9.5px] text-cc-t3">{p.conversionText}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// CANON 1060-1062. The bottleneck sentence names the first phase carrying an
// alert rather than hard-coding "Appointment" — the canonical text is exactly
// what that derivation produces from the canonical phases.
function MobileSummary({ activeCount, phases }: { activeCount: string; phases: PipelinePhase[] }) {
  const bottleneck = phases.find((p) => p.alertText);
  return (
    <div className={`${CARD} px-[13px] py-2.5`}>
      <div className="flex justify-between">
        <span className="text-[11.5px] font-semibold text-cc-ink">Pipeline Journey</span>
        <span className="text-[10px] font-semibold text-cc-green">Statuses ▾</span>
      </div>
      <div className="mt-[3px] text-[10.5px] text-cc-t2">
        {activeCount} active
        {bottleneck ? (
          <>
            {" · bottleneck: "}
            <b style={{ color: bottleneck.alertColor ?? "var(--cc-amber-ink)" }}>
              {bottleneck.name} — {bottleneck.alertText}
            </b>
          </>
        ) : null}
      </div>
    </div>
  );
}
