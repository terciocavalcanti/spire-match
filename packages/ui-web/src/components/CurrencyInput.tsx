import * as React from "react";

import { cn } from "../lib/cn";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export interface CurrencyInputProps {
  id?: string;
  /** Valor em reais (ex.: 1420000.5). `null` representa campo vazio. */
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

/**
 * Campo de moeda com máscara "de trás para frente": cada dígito digitado
 * entra como centavo e desloca os demais, sempre mantendo milhar e decimal
 * formatados (padrão comum em apps bancários, evita ambiguidade de onde
 * fica a vírgula enquanto o usuário digita).
 */
export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ id, value, onChange, placeholder, error, className }, ref) => {
    const describedBy = error && id ? `${id}-error` : undefined;
    const display = value === null || Number.isNaN(value) ? "" : currencyFormatter.format(value);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const digits = e.target.value.replace(/\D/g, "");
      if (!digits) {
        onChange(null);
        return;
      }
      onChange(Number.parseInt(digits, 10) / 100);
    }

    return (
      <div className="w-full min-w-0">
        <div
          className={cn(
            "flex h-14 min-w-0 items-center gap-3 rounded-xl border bg-background-elevated px-4 transition-colors",
            error ? "border-status-danger" : "border-border-subtle focus-within:border-brand-olive",
          )}
        >
          <input
            ref={ref}
            id={id}
            inputMode="numeric"
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            value={display}
            onChange={handleChange}
            placeholder={placeholder ?? "R$ 0,00"}
            className={cn(
              "h-full min-w-0 flex-1 bg-transparent text-bodyLg text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
              className,
            )}
          />
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
CurrencyInput.displayName = "CurrencyInput";
