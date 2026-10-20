import * as React from "react";

/** Marca abstrata de três torres ascendentes, conforme o ícone das pranchas. */
export function SpireMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 20" fill="none" className={className} aria-hidden>
      <path d="M2 20V9L5 2L8 9V20" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9.5 20V6L12 1L14.5 6V20" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M17 20V10L19.5 5L22 10V20" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
