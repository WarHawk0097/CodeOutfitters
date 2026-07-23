"use client";

// Charting primitives adapted from shadcn/ui's chart.tsx for the Command Center.
// Trimmed to the single-theme (config.color) path this app uses, restyled with cc tokens,
// and typed against recharts 2.x payloads. Provides ChartContainer (ResponsiveContainer +
// per-series CSS vars), ChartTooltip/Content, and ChartLegend/Content.
import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "../../lib/utils";

export type ChartConfig = {
  [k: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
  };
};

type ChartContextProps = { config: ChartConfig };
const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error("useChart must be used within a <ChartContainer />");
  return context;
}

export function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex justify-center text-[11px] text-cc-t3",
          "[&_.recharts-cartesian-grid_line]:stroke-cc-line/60",
          "[&_.recharts-cartesian-axis-tick_text]:fill-cc-t3",
          "[&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorEntries = Object.entries(config).filter(([, c]) => c.color);
  if (!colorEntries.length) return null;
  return (
    <style
      // Per-series CSS custom properties consumed as var(--color-<key>) by the series.
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {\n${colorEntries
          .map(([key, c]) => `  --color-${key}: ${c.color};`)
          .join("\n")}\n}`,
      }}
    />
  );
}

export const ChartTooltip = RechartsPrimitive.Tooltip;

type TooltipPayloadItem = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
};

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  indicator = "dot",
  hideLabel = false,
  className,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: unknown;
  labelFormatter?: (value: unknown, payload: TooltipPayloadItem[]) => React.ReactNode;
  indicator?: "dot" | "line";
  hideLabel?: boolean;
  className?: string;
}) {
  const { config } = useChart();
  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        "grid min-w-[9rem] gap-1.5 rounded-[var(--cc-radius-control)] border border-cc-line",
        "bg-cc-surface px-2.5 py-2 text-[11px] shadow-md",
        className,
      )}
    >
      {!hideLabel && (
        <div className="font-medium text-cc-ink">
          {labelFormatter ? labelFormatter(label, payload) : String(label ?? "")}
        </div>
      )}
      <div className="grid gap-1">
        {payload.map((item, i) => {
          const key = String(item.dataKey ?? item.name ?? i);
          const itemConfig = config[key];
          const color = item.color ?? `var(--color-${key})`;
          return (
            <div key={key} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    "shrink-0",
                    indicator === "dot" ? "h-2 w-2 rounded-full" : "h-2 w-0.5 rounded-sm",
                  )}
                  style={{ backgroundColor: color }}
                />
                <span className="text-cc-t3">{itemConfig?.label ?? item.name ?? key}</span>
              </div>
              <span className="font-medium tabular-nums text-cc-ink">
                {typeof item.value === "number" ? item.value : String(item.value ?? "")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ChartLegend = RechartsPrimitive.Legend;

type LegendPayloadItem = { value?: string; dataKey?: string | number; color?: string };

export function ChartLegendContent({
  payload,
  className,
}: {
  payload?: LegendPayloadItem[];
  className?: string;
}) {
  const { config } = useChart();
  if (!payload?.length) return null;
  return (
    <div className={cn("flex items-center justify-center gap-4 pt-2", className)}>
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.value ?? "");
        const itemConfig = config[key];
        return (
          <div key={key} className="flex items-center gap-1.5 text-[11px] text-cc-t3">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color ?? `var(--color-${key})` }}
            />
            {itemConfig?.label ?? item.value}
          </div>
        );
      })}
    </div>
  );
}
