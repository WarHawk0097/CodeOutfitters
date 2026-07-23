// Overview screen, C-D01 per work/PHASED-IMPLEMENTATION-PLAN.md Phase 3.
// Canonical frames: C-D01 44-79 (desktop 1440x1000), T-01 856-883 (tablet
// 820x1180), MO-01 1040-1064 (mobile 390x844).
//
// Three frames, three compositions — they are not one layout at three widths:
//   desktop  KPI strip, then 1fr/372px split: [Lead Flow, Today's work] and a
//            right rail [Pipeline Journey, Meetings & proposals, Recent activity]
//   tablet   single column: KPI 2x2, Today's work, Lead Flow, Pipeline cards.
//            No right rail, no Meetings & proposals, no Recent activity.
//   mobile   Today's work FIRST, then two KPIs, meetings, and summary cards in
//            place of the chart and the phase list.
// Each is rendered in its own breakpoint block. Exactly one is ever visible.
//
// Server-rendered, with one client island: the Lead-flow chart. The KPI strip stays
// canonical (the design authority's own 34/9/7/4 figures, which no request can produce),
// but the former static Lead Flow plot is replaced by <LeadFlowChart/> — an interactive,
// store-derived recharts area chart. It intentionally reads the shared lead store, so its
// series are dataset-derived and will NOT match the canonical KPI figures beside it; that
// mismatch is documented in work/FULL-COMMAND-CENTER-CANONICAL-DEVIATIONS.md (D-Q01).
import {
  KpiGridMobile,
  KpiGridTablet,
  KpiStrip,
  MeetingsProposalsCard,
  NextUpCardMobile,
  PipelineJourney,
  RecentActivityCard,
  TodaysWorkCard,
} from "@command-center/ui";
import { LeadFlowChart } from "../../../components/dashboard/lead-flow-chart";
import {
  PIPELINE_JOURNEY_ACTIVE_COUNT,
  PIPELINE_PHASE_FIXTURES,
} from "../../../mocks/fixtures/pipeline-phases";
import {
  OVERVIEW_KPIS,
  OVERVIEW_KPIS_MOBILE,
  RECENT_ACTIVITY,
  TODAYS_WORK,
  TODAYS_WORK_OPEN_COUNT,
} from "../../../mocks/fixtures/overview-canonical";

export default function DashboardPage() {
  return (
    <>
      {/* ---------------------------------------------- desktop, CANON 44-79 */}
      <div className="hidden h-full min-h-0 flex-col xl:flex">
        <KpiStrip kpis={OVERVIEW_KPIS} />
        {/* CANON 48: fixed 372px rail, rows pinned to the frame height. */}
        <div className="mt-3.5 grid min-h-0 flex-1 grid-cols-[1fr_372px] grid-rows-[minmax(0,1fr)] gap-3.5">
          <div className="flex min-w-0 flex-col gap-[18px]">
            <LeadFlowChart />
            <TodaysWorkCard
              items={TODAYS_WORK}
              openCount={TODAYS_WORK_OPEN_COUNT}
              variant="desktop"
            />
          </div>
          <div className="flex h-full min-h-0 min-w-0 flex-col gap-3.5">
            <PipelineJourney
              activeCount={PIPELINE_JOURNEY_ACTIVE_COUNT}
              phases={PIPELINE_PHASE_FIXTURES}
              variant="desktop"
            />
            <MeetingsProposalsCard variant="desktop" />
            <RecentActivityCard items={RECENT_ACTIVITY} />
          </div>
        </div>
      </div>

      {/* ----------------------------------------------- tablet, CANON 859-880 */}
      <div className="hidden flex-col gap-4 md:flex xl:hidden">
        <KpiGridTablet kpis={OVERVIEW_KPIS} />
        <TodaysWorkCard items={TODAYS_WORK} openCount={TODAYS_WORK_OPEN_COUNT} variant="tablet" />
        <LeadFlowChart />
        <PipelineJourney
          activeCount={PIPELINE_JOURNEY_ACTIVE_COUNT}
          phases={PIPELINE_PHASE_FIXTURES}
          variant="tablet"
        />
      </div>

      {/* ---------------------------------------------- mobile, CANON 1043-1064 */}
      <div className="md:hidden">
        {/* CANON 1043: at mobile the title sits in the body, not the header
            (the header centre carries the brand mark there instead). */}
        <h1 className="text-[18px] font-semibold text-cc-ink">Overview</h1>
        <div className="text-[11px] text-cc-t3">Tue Apr 22 · 4 items need attention</div>

        <div className="mt-[11px]">
          <TodaysWorkCard
            items={TODAYS_WORK}
            openCount={TODAYS_WORK_OPEN_COUNT}
            variant="mobile"
          />
        </div>
        <div className="mt-[11px]">
          <KpiGridMobile kpis={OVERVIEW_KPIS_MOBILE} />
        </div>
        <div className="mt-[9px]">
          <MeetingsProposalsCard variant="mobile" />
        </div>
        <div className="mt-[9px]">
          <LeadFlowChart />
        </div>
        <div className="mt-[9px]">
          <PipelineJourney
            activeCount={PIPELINE_JOURNEY_ACTIVE_COUNT}
            phases={PIPELINE_PHASE_FIXTURES}
            variant="mobile"
          />
        </div>
        <div className="mt-[9px]">
          <NextUpCardMobile />
        </div>
      </div>
    </>
  );
}
