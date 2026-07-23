// Shared UI primitives for apps/web. Component library built starting Phase 3
// (Overview/Leads/nav shell) per work/PHASED-IMPLEMENTATION-PLAN.md.
export const UI_PACKAGE_VERSION = "0.1.0";

export { Sidebar, NavList, NavDrawer, NAV_GROUPS, OPERATIONS_NAV, ADMINISTRATION_NAV } from "./sidebar";
export type { NavItem, NavGroup } from "./sidebar";

export { ShellHeader } from "./shell-header";
export type { ShellHeaderProps } from "./shell-header";

// C-D01 Overview. kpi-card.tsx and chart-container.tsx were REMOVED here, not
// relaxed: their generic four-detached-cards strip and single-series day chart
// are not the canonical Overview (CANON 45-46 is one bordered four-cell card,
// CANON 52 is a three-series 1090x212 plot), and nothing else imported them.
// chart-container.test.ts covered only that component's date-tick helpers and
// went with it — the canonical chart has fixed period labels and no date axis.
export {
  KpiStrip,
  KpiGridTablet,
  KpiGridMobile,
  LeadFlowCard,
  LeadFlowSummaryMobile,
  TodaysWorkCard,
  MeetingsProposalsCard,
  RecentActivityCard,
  NextUpCardMobile,
} from "./overview-cards";
export type {
  OverviewKpi,
  TodaysWorkItem,
  ActivityItem,
  LeadFlowGeometry,
} from "./overview-cards";

export { DateRangeFilter } from "./date-range-filter";
export type { DateRange, DateRangePreset, DateRangeFilterProps } from "./date-range-filter";

export { LeadsTable, pageWindow } from "./leads-table";
export type { LeadsTableProps, LeadsQuery } from "./leads-table";

export { PipelineJourney } from "./pipeline-journey";
export type { PipelineJourneyProps, PipelinePhase, PipelinePhaseSegment } from "./pipeline-journey";
