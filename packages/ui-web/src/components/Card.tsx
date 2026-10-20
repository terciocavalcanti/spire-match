import * as React from "react";

import { cn } from "../lib/cn";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated shadow-sm",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";
