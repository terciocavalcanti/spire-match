import * as React from "react";

import { cn } from "../lib/cn";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-subtle bg-background-elevated px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      {icon && <div className="text-ink-tertiary">{icon}</div>}
      <p className="font-display text-xl text-ink-primary">{title}</p>
      {description && <p className="max-w-sm text-bodyMd text-ink-secondary">{description}</p>}
      {action}
    </div>
  );
}
