import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill text-button font-body font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-olive focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-brand-charcoal text-ink-inverse hover:bg-brand-charcoalHover",
        secondary: "bg-background-subtle text-ink-primary hover:bg-border-subtle",
        outline: "border border-border-strong bg-transparent text-ink-primary hover:bg-background-subtle",
        ghost: "bg-transparent text-ink-primary hover:bg-background-subtle",
        destructive: "bg-status-danger text-ink-inverse hover:opacity-90",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-12 px-6",
        lg: "h-14 px-8 text-base",
        icon: "h-11 w-11 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
