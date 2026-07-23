// Card primitive for the Dashboard Lead-flow chart. Styled with the existing Command
// Center theme tokens (cc-surface / cc-line / cc-ink / cc-t3), not shadcn's default
// card tokens. Minimal subset — only the parts the chart card uses.
import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-[var(--cc-radius-card)] border border-cc-line bg-cc-surface",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 px-4 pt-3.5 pb-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("text-[13px] font-semibold text-cc-ink", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-[11px] text-cc-t3", className)} {...props} />;
}

export function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("shrink-0", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-2 pb-3", className)} {...props} />;
}
