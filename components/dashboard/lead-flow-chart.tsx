"use client";

// Dashboard Lead-flow chart. Replaces the former static LeadFlowCard / LeadFlowSummaryMobile.
//
// Data: derived from the SAME shared lead source every other route reads — fetched through
// the mock `/api/leads` endpoint (so overrides from demo mutations are already applied) and
// bucketed by lib/dashboard/lead-flow (pure, UTC-safe, anchored at REFERENCE_NOW). Refetches
// when the shared demo store mutates, so a status change on another route moves the series.
//
// Two independent (NON-stacked) area series: New leads (createdAt) and Qualified leads
// (qualifiedAt / qualification milestone). Tooltip values are therefore real counts, not a
// visually accumulated total.
import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import type { Lead } from "@command-center/contracts";
import { useDemoState } from "../../lib/demo/store";
import { fetchLeads } from "../../lib/data/leads";
import {
  aggregateLeadFlow,
  DEFAULT_LEAD_FLOW_RANGE,
  formatBucketDate,
  leadFlowRange,
  leadFlowTotals,
  LEAD_FLOW_RANGES,
  LEAD_FLOW_SERIES,
  type LeadFlowRangeValue,
} from "../../lib/dashboard/lead-flow";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui-cc/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../ui-cc/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui-cc/select";

const chartConfig = {
  newLeads: { label: LEAD_FLOW_SERIES.newLeads.label, color: LEAD_FLOW_SERIES.newLeads.colorVar },
  qualifiedLeads: {
    label: LEAD_FLOW_SERIES.qualifiedLeads.label,
    color: LEAD_FLOW_SERIES.qualifiedLeads.colorVar,
  },
} satisfies ChartConfig;

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; leads: Lead[] };

export function LeadFlowChart({ className }: { className?: string }) {
  // Subscribing re-runs the fetch effect whenever the shared store mutates, so the
  // chart reflects lead status/owner overrides made anywhere in the session.
  const demoState = useDemoState();
  const [range, setRange] = React.useState<LeadFlowRangeValue>(DEFAULT_LEAD_FLOW_RANGE);
  const [state, setState] = React.useState<LoadState>({ status: "loading" });
  const [isRangePending, startRangeTransition] = React.useTransition();
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    // No synchronous setState here: on a background refetch (store mutation / Retry) the
    // previous data stays visible until the new data resolves — no skeleton flash — and the
    // initial `loading` state already covers the first mount.
    // pageSize 200 > the 128-row dataset, so page 1 is the whole set in one request.
    fetchLeads({ pageSize: 200 })
      .then((res) => {
        if (!cancelled) setState({ status: "ready", leads: res.rows });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
    // demoState: refetch on any store mutation. reloadKey: manual Retry.
  }, [demoState, reloadKey]);

  const leads = state.status === "ready" ? state.leads : null;
  const points = React.useMemo(
    () => (leads ? aggregateLeadFlow(leads, range) : []),
    [leads, range],
  );
  const totals = React.useMemo(() => leadFlowTotals(points), [points]);
  const activeRange = leadFlowRange(range);
  const isEmpty = leads !== null && totals.newTotal === 0 && totals.qualifiedTotal === 0;

  const onRangeChange = (value: string) => {
    startRangeTransition(() => setRange(value as LeadFlowRangeValue));
  };

  const summary =
    leads === null
      ? "Lead-flow chart is loading."
      : `${totals.newTotal} new leads and ${totals.qualifiedTotal} qualified leads during ${activeRange.summaryLabel}.`;

  return (
    <Card className={className}>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle>Lead flow</CardTitle>
          <CardDescription>New and qualified leads over the selected period</CardDescription>
        </div>
        <CardAction>
          <Select value={range} onValueChange={onRangeChange}>
            {/* Visible at every width — no `hidden` class. */}
            <SelectTrigger className="w-[132px]" aria-label="Select lead-flow period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_FLOW_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent>
        {/* Accessible, text-based source of the period totals — never the chart alone. */}
        <p className="sr-only" role="status" aria-live="polite">
          {summary}
        </p>

        <div
          className="relative h-[210px] w-full sm:h-[230px] md:h-[240px] xl:h-[250px]"
          data-testid="lead-flow-plot"
        >
          {state.status === "error" ? (
            <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />
          ) : leads === null ? (
            <LoadingSkeleton />
          ) : isEmpty ? (
            <EmptyState label={activeRange.label} />
          ) : (
            <div
              className="h-full w-full transition-opacity"
              style={{ opacity: isRangePending ? 0.6 : 1 }}
              aria-busy={isRangePending}
            >
              <ChartContainer config={chartConfig} className="h-full w-full">
                <AreaChart data={points} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillNewLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-newLeads)" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="var(--color-newLeads)" stopOpacity={0.06} />
                    </linearGradient>
                    <linearGradient id="fillQualifiedLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-qualifiedLeads)" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="var(--color-qualifiedLeads)" stopOpacity={0.06} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={28}
                    tickFormatter={(value) => formatBucketDate(String(value))}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        labelFormatter={(value) => formatBucketDate(String(value))}
                      />
                    }
                  />
                  {/* No stackId: the two metrics are independent, so each area shows its
                      own count rather than a cumulative total. */}
                  <Area
                    dataKey="newLeads"
                    name="New leads"
                    type="monotone"
                    stroke="var(--color-newLeads)"
                    fill="url(#fillNewLeads)"
                    strokeWidth={2}
                  />
                  <Area
                    dataKey="qualifiedLeads"
                    name="Qualified leads"
                    type="monotone"
                    stroke="var(--color-qualifiedLeads)"
                    fill="url(#fillQualifiedLeads)"
                    strokeWidth={2}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex h-full w-full flex-col justify-end gap-2 px-2 pb-6" aria-hidden="true">
      <div className="h-full w-full animate-pulse rounded-md bg-cc-line/50" />
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-center">
      <p className="text-[12px] font-medium text-cc-ink">No leads in this period</p>
      <p className="text-[11px] text-cc-t3">Nothing recorded for {label.toLowerCase()}.</p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex h-full w-full flex-col items-center justify-center gap-2 text-center"
    >
      <p className="text-[12px] font-medium text-cc-ink">Couldn’t load lead flow</p>
      <p className="text-[11px] text-cc-t3">The lead data request failed.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 rounded-[var(--cc-radius-control)] border border-cc-line bg-cc-surface px-3 py-1 text-[12px] font-medium text-cc-ink hover:bg-cc-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-cc-blue"
      >
        Retry
      </button>
    </div>
  );
}
