"use client";

import type { ListingPurpose, PropertyType } from "@spire/contracts";
import { Button, FilterChip } from "@spire/ui-web";
import { X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { filtersToSearchParams, searchParamsToFilters } from "@/lib/property-filters";

const KNOWN_NEIGHBORHOODS = ["Boa Viagem", "Pina", "Setúbal", "Casa Forte"];
const PROPERTY_TYPES: PropertyType[] = ["APARTAMENTO", "CASA", "COBERTURA"];
const TYPE_LABELS: Record<PropertyType, string> = { APARTAMENTO: "Apartamento", CASA: "Casa", COBERTURA: "Cobertura" };

function FiltrosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = useMemo(() => searchParamsToFilters(searchParams), [searchParams]);

  const [neighborhoods, setNeighborhoods] = useState<string[]>(initial.neighborhoods);
  const [priceMin, setPriceMin] = useState(initial.priceMin?.toString() ?? "");
  const [priceMax, setPriceMax] = useState(initial.priceMax?.toString() ?? "");
  const [areaMin, setAreaMin] = useState(initial.areaMin?.toString() ?? "");
  const [bedroomsMin, setBedroomsMin] = useState<number | undefined>(initial.bedroomsMin);
  const [parkingMin, setParkingMin] = useState<number | undefined>(initial.parkingMin);
  const [type, setType] = useState<PropertyType | undefined>(initial.type);
  const [purpose, setPurpose] = useState<ListingPurpose | undefined>(initial.purpose);

  function toggleNeighborhood(n: string) {
    setNeighborhoods((current) => (current.includes(n) ? current.filter((x) => x !== n) : [...current, n]));
  }

  function apply() {
    const params = filtersToSearchParams({
      q: initial.q,
      neighborhoods,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      areaMin: areaMin ? Number(areaMin) : undefined,
      bedroomsMin,
      parkingMin,
      type,
      purpose,
    });
    router.push(`/explorar?${params.toString()}`);
  }

  function clearAll() {
    setNeighborhoods([]);
    setPriceMin("");
    setPriceMax("");
    setAreaMin("");
    setBedroomsMin(undefined);
    setParkingMin(undefined);
    setType(undefined);
    setPurpose(undefined);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-6">
      <div className="flex items-center justify-between">
        <Link href="/explorar" aria-label="Fechar" className="text-ink-primary">
          <X className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-xl text-ink-primary">Filtros</h1>
        <button type="button" onClick={clearAll} className="text-bodySm font-medium text-ink-secondary">
          Limpar tudo
        </button>
      </div>

      <div className="mt-6 flex-1 space-y-6 overflow-y-auto">
        <div>
          <label className="text-bodySm font-medium text-ink-secondary">Faixa de preço (R$)</label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Mínimo"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="h-12 rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary focus:outline-none focus:border-brand-olive"
            />
            <input
              type="number"
              placeholder="Máximo"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="h-12 rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary focus:outline-none focus:border-brand-olive"
            />
          </div>
        </div>

        <div>
          <label className="text-bodySm font-medium text-ink-secondary">Bairros</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {KNOWN_NEIGHBORHOODS.map((n) => (
              <FilterChip key={n} active={neighborhoods.includes(n)} onClick={() => toggleNeighborhood(n)}>
                {n}
              </FilterChip>
            ))}
          </div>
        </div>

        <div>
          <label className="text-bodySm font-medium text-ink-secondary">Metragem mínima (m²)</label>
          <input
            type="number"
            value={areaMin}
            onChange={(e) => setAreaMin(e.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary focus:outline-none focus:border-brand-olive"
          />
        </div>

        <div>
          <label className="text-bodySm font-medium text-ink-secondary">Quartos (mínimo)</label>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4].map((n) => (
              <FilterChip key={n} active={bedroomsMin === n} onClick={() => setBedroomsMin(bedroomsMin === n ? undefined : n)}>
                {n}
                {n === 4 ? "+" : ""}
              </FilterChip>
            ))}
          </div>
        </div>

        <div>
          <label className="text-bodySm font-medium text-ink-secondary">Vagas (mínimo)</label>
          <div className="mt-2 flex gap-2">
            {[0, 1, 2, 3].map((n) => (
              <FilterChip key={n} active={parkingMin === n} onClick={() => setParkingMin(parkingMin === n ? undefined : n)}>
                {n}
                {n === 3 ? "+" : ""}
              </FilterChip>
            ))}
          </div>
        </div>

        <div>
          <label className="text-bodySm font-medium text-ink-secondary">Tipo de imóvel</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((t) => (
              <FilterChip key={t} active={type === t} onClick={() => setType(type === t ? undefined : t)}>
                {TYPE_LABELS[t]}
              </FilterChip>
            ))}
          </div>
        </div>

        <div>
          <label className="text-bodySm font-medium text-ink-secondary">Finalidade</label>
          <div className="mt-2 flex gap-2">
            {(["MORAR", "INVESTIR"] as const).map((p) => (
              <FilterChip key={p} active={purpose === p} onClick={() => setPurpose(purpose === p ? undefined : p)}>
                {p === "MORAR" ? "Morar" : "Investir"}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      <Button onClick={apply} size="lg" className="mt-6 w-full">
        Aplicar filtros
      </Button>
    </main>
  );
}

export default function FiltrosPage() {
  return (
    <Suspense fallback={null}>
      <FiltrosContent />
    </Suspense>
  );
}
