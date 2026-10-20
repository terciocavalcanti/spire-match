import { Sparkles } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/cn";

export interface MatchBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0-100. Quando `null`, exibe estado "sem score" em vez de inventar um número. */
  score: number | null;
  size?: "sm" | "lg";
}

/**
 * Selo "% MATCH" reproduzido das telas de referência (Home, Mapa, Swipe,
 * Detalhe). `score === null` cobre o estado legítimo de score ainda não
 * calculado — nunca deve ser preenchido com um valor fictício.
 */
export function MatchBadge({ score, size = "sm", className, ...props }: MatchBadgeProps) {
  if (score === null) {
    return (
      <div
        className={cn(
          "inline-flex items-center rounded-xl bg-background-subtle px-3 py-2 text-caption text-ink-tertiary",
          className,
        )}
        {...props}
      >
        Calculando match…
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={`${score}% de compatibilidade`}
      className={cn(
        "inline-flex flex-col items-center justify-center rounded-xl bg-brand-olive text-ink-inverse shadow-md",
        size === "lg" ? "gap-1 px-5 py-4" : "gap-0.5 px-3 py-2",
        className,
      )}
      {...props}
    >
      <Sparkles className={size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5"} aria-hidden />
      <span className={cn("font-body font-semibold leading-none", size === "lg" ? "text-2xl" : "text-base")}>
        {score}%
      </span>
      <span className="text-[10px] uppercase tracking-wide leading-none">Match</span>
    </div>
  );
}
