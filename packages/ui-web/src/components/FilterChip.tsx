import * as React from "react";

import { cn } from "../lib/cn";

export interface FilterChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ active, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-pill px-4 text-bodySm font-medium transition-colors",
        active ? "bg-chip-activeBg text-chip-activeFg" : "bg-chip-inactiveBg text-chip-inactiveFg",
        className,
      )}
      {...props}
    />
  ),
);
FilterChip.displayName = "FilterChip";
