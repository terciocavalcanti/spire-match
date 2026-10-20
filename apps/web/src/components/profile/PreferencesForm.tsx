"use client";

import type { BuyerPreferences, ListingPurpose, PaymentMethod } from "@spire/contracts";
import { Button, Input } from "@spire/ui-web";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";

import { apiClient } from "@/lib/api-client";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  A_VISTA: "À vista",
  FINANCIAMENTO: "Financiamento",
  CONSORCIO: "Consórcio",
  PERMUTA: "Permuta",
};

function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const trimmed = draft.trim();
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setDraft("");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span key={value} className="flex items-center gap-1 rounded-pill bg-chip-activeBg px-3 py-1.5 text-bodySm text-chip-activeFg">
            {value}
            <button type="button" onClick={() => onChange(values.filter((v) => v !== value))} aria-label={`Remover ${value}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-brand-olive"
      />
    </div>
  );
}

interface PreferencesFormFieldsProps {
  initialPreferences: BuyerPreferences;
  onSaved?: () => void;
}

function PreferencesFormFields({ initialPreferences, onSaved }: PreferencesFormFieldsProps) {
  const queryClient = useQueryClient();

  const [budgetMin, setBudgetMin] = useState(initialPreferences.budgetMin?.toString() ?? "");
  const [budgetMax, setBudgetMax] = useState(initialPreferences.budgetMax?.toString() ?? "");
  const [neighborhoods, setNeighborhoods] = useState<string[]>(initialPreferences.desiredNeighborhoods);
  const [minAreaSqm, setMinAreaSqm] = useState(initialPreferences.minAreaSqm?.toString() ?? "");
  const [minBedrooms, setMinBedrooms] = useState<number | null>(initialPreferences.minBedrooms);
  const [minParkingSpaces, setMinParkingSpaces] = useState<number | null>(initialPreferences.minParkingSpaces);
  const [purpose, setPurpose] = useState<ListingPurpose | null>(initialPreferences.purpose);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPreferences.paymentMethods);
  const [features, setFeatures] = useState<string[]>(initialPreferences.desiredFeatures);
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.preferences.update({
        budgetMin: budgetMin ? Number(budgetMin) : null,
        budgetMax: budgetMax ? Number(budgetMax) : null,
        desiredNeighborhoods: neighborhoods,
        minAreaSqm: minAreaSqm ? Number(minAreaSqm) : null,
        minBedrooms,
        minParkingSpaces,
        purpose,
        paymentMethods,
        desiredFeatures: features,
        completeOnboarding: true,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["preferences"], data);
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSaved?.();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="space-y-5"
    >
      <div>
        <label className="text-bodySm font-medium text-ink-secondary">Orçamento (R$)</label>
        <div className="mt-1.5 grid grid-cols-2 gap-3">
          <Input type="number" placeholder="Mínimo" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
          <Input type="number" placeholder="Máximo" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-bodySm font-medium text-ink-secondary">Bairros de interesse</label>
        <div className="mt-1.5">
          <TagInput values={neighborhoods} onChange={setNeighborhoods} placeholder="Digite um bairro e tecle Enter" />
        </div>
      </div>

      <div>
        <label className="text-bodySm font-medium text-ink-secondary">Metragem mínima (m²)</label>
        <div className="mt-1.5">
          <Input type="number" value={minAreaSqm} onChange={(e) => setMinAreaSqm(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-bodySm font-medium text-ink-secondary">Quartos (mínimo)</label>
        <div className="mt-1.5 flex gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMinBedrooms(n)}
              className={
                minBedrooms === n
                  ? "flex h-10 w-10 items-center justify-center rounded-pill bg-brand-charcoal text-ink-inverse"
                  : "flex h-10 w-10 items-center justify-center rounded-pill bg-background-subtle text-ink-secondary"
              }
            >
              {n}
              {n === 4 ? "+" : ""}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-bodySm font-medium text-ink-secondary">Vagas (mínimo)</label>
        <div className="mt-1.5 flex gap-2">
          {[0, 1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMinParkingSpaces(n)}
              className={
                minParkingSpaces === n
                  ? "flex h-10 w-10 items-center justify-center rounded-pill bg-brand-charcoal text-ink-inverse"
                  : "flex h-10 w-10 items-center justify-center rounded-pill bg-background-subtle text-ink-secondary"
              }
            >
              {n}
              {n === 3 ? "+" : ""}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-bodySm font-medium text-ink-secondary">Finalidade</label>
        <div className="mt-1.5 flex gap-2">
          {(["MORAR", "INVESTIR"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPurpose(p)}
              className={
                purpose === p
                  ? "h-10 flex-1 rounded-pill bg-brand-charcoal text-button text-ink-inverse"
                  : "h-10 flex-1 rounded-pill bg-background-subtle text-button text-ink-secondary"
              }
            >
              {p === "MORAR" ? "Morar" : "Investir"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-bodySm font-medium text-ink-secondary">Forma de pagamento</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => {
            const active = paymentMethods.includes(method);
            return (
              <button
                key={method}
                type="button"
                onClick={() =>
                  setPaymentMethods((current) =>
                    active ? current.filter((m) => m !== method) : [...current, method],
                  )
                }
                className={
                  active
                    ? "rounded-pill bg-brand-charcoal px-4 py-2 text-bodySm text-ink-inverse"
                    : "rounded-pill bg-background-subtle px-4 py-2 text-bodySm text-ink-secondary"
                }
              >
                {PAYMENT_LABELS[method]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-bodySm font-medium text-ink-secondary">Características desejadas</label>
        <div className="mt-1.5">
          <TagInput values={features} onChange={setFeatures} placeholder="Ex.: vista mar, varanda gourmet" />
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={mutation.isPending}>
        {mutation.isPending ? "Salvando…" : saved ? "Salvo!" : "Salvar preferências"}
      </Button>
    </form>
  );
}

export function PreferencesForm({ onSaved }: { onSaved?: () => void } = {}) {
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["preferences"],
    queryFn: () => apiClient.preferences.get(),
  });

  if (isLoading || !preferences) {
    return <div className="h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />;
  }

  return <PreferencesFormFields initialPreferences={preferences} onSaved={onSaved} />;
}
