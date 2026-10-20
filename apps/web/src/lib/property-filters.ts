import type { ListingPurpose, PropertyType } from "@spire/contracts";

export interface PropertyFilters {
  q: string;
  type?: PropertyType;
  purpose?: ListingPurpose;
  neighborhoods: string[];
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  bedroomsMin?: number;
  parkingMin?: number;
}

export const EMPTY_FILTERS: PropertyFilters = { q: "", neighborhoods: [] };

export function filtersToSearchParams(filters: PropertyFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type) params.set("type", filters.type);
  if (filters.purpose) params.set("purpose", filters.purpose);
  filters.neighborhoods.forEach((n) => params.append("neighborhoods", n));
  if (filters.priceMin !== undefined) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax !== undefined) params.set("priceMax", String(filters.priceMax));
  if (filters.areaMin !== undefined) params.set("areaMin", String(filters.areaMin));
  if (filters.bedroomsMin !== undefined) params.set("bedroomsMin", String(filters.bedroomsMin));
  if (filters.parkingMin !== undefined) params.set("parkingMin", String(filters.parkingMin));
  return params;
}

export function searchParamsToFilters(params: URLSearchParams): PropertyFilters {
  const num = (key: string) => {
    const v = params.get(key);
    return v !== null && v !== "" ? Number(v) : undefined;
  };
  return {
    q: params.get("q") ?? "",
    type: (params.get("type") as PropertyType) || undefined,
    purpose: (params.get("purpose") as ListingPurpose) || undefined,
    neighborhoods: params.getAll("neighborhoods"),
    priceMin: num("priceMin"),
    priceMax: num("priceMax"),
    areaMin: num("areaMin"),
    bedroomsMin: num("bedroomsMin"),
    parkingMin: num("parkingMin"),
  };
}
