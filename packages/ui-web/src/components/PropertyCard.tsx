import type { PropertySummary } from "@spire/contracts";
import { BedDouble, Car, Heart, Ruler } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/cn";

import { MatchBadge } from "./MatchBadge";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export interface PropertyCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "property"> {
  property: PropertySummary;
  /** Score 0-100, ou `undefined` quando não há Match calculado para este card. */
  score?: number | null;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  /** Distância em metros (telas "perto de você") — omitida quando indisponível. */
  distanceMeters?: number | null;
  LinkComponent?: React.ComponentType<React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>;
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

export function PropertyCard({
  property,
  score,
  isFavorite,
  onToggleFavorite,
  distanceMeters,
  LinkComponent,
  className,
  ...props
}: PropertyCardProps) {
  const Anchor = LinkComponent ?? "a";

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated", className)} {...props}>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-background-subtle">
        <Anchor href={`/imoveis/${property.slug}`} aria-label={property.title}>
          {property.coverImageUrl ? (
            <img
              src={property.coverImageUrl}
              alt={property.title}
              className="h-full w-full object-cover transition-transform hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-tertiary">Sem foto</div>
          )}
        </Anchor>

        {score !== undefined && (
          <div className="absolute left-3 top-3">
            <MatchBadge score={score} />
          </div>
        )}

        {onToggleFavorite && (
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            aria-pressed={isFavorite}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background-elevated/90 text-ink-primary shadow-sm"
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-status-danger text-status-danger")} />
          </button>
        )}

        {distanceMeters !== undefined && distanceMeters !== null && (
          <span className="absolute bottom-3 left-3 rounded-pill bg-background-elevated/90 px-2.5 py-1 text-caption text-ink-primary">
            {formatDistance(distanceMeters)}
          </span>
        )}
      </div>

      <Anchor href={`/imoveis/${property.slug}`} className="block px-4 py-3">
        <p className="text-price font-display text-ink-primary">{currencyFormatter.format(property.price)}</p>
        <p className="mt-0.5 text-bodySm text-ink-secondary">
          {property.neighborhood}, {property.city}
        </p>
        <div className="mt-2 flex items-center gap-3 text-bodySm text-ink-secondary">
          <span className="flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5" /> {property.areaSqm.toFixed(0)} m²
          </span>
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" /> {property.bedrooms}
          </span>
          <span className="flex items-center gap-1">
            <Car className="h-3.5 w-3.5" /> {property.parkingSpaces}
          </span>
        </div>
      </Anchor>
    </div>
  );
}
