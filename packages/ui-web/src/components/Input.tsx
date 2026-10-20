import * as React from "react";

import { cn } from "../lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, rightElement, error, id, ...props }, ref) => {
    const describedBy = error && id ? `${id}-error` : undefined;
    return (
      <div className="w-full">
        <div
          className={cn(
            "flex h-14 items-center gap-3 rounded-xl border bg-background-elevated px-4 transition-colors",
            error ? "border-status-danger" : "border-border-subtle focus-within:border-brand-olive",
          )}
        >
          {icon && <span className="text-ink-tertiary">{icon}</span>}
          <input
            ref={ref}
            id={id}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              "h-full flex-1 bg-transparent text-bodyLg text-ink-primary placeholder:text-ink-tertiary focus:outline-none",
              className,
            )}
            {...props}
          />
          {rightElement}
        </div>
        {error && (
          <p id={describedBy} role="alert" className="mt-1.5 text-bodySm text-status-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
