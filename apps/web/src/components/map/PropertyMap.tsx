"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import type { PropertySummary } from "@spire/contracts";
import * as maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

// Turbopack não resolve o worker interno do MapLibre via `new URL(..., import.meta.url)`
// corretamente em dev; servimos o worker como asset estático (public/maplibre-gl-worker.mjs,
// copiado de node_modules/maplibre-gl/dist/) e apontamos explicitamente para ele.
// Atenção: ao atualizar a versão do maplibre-gl, recopiar esse arquivo também.
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
}

export interface MapPoint {
  property: PropertySummary;
  score?: number;
}

export interface PropertyMapProps {
  points: MapPoint[];
  center: { lat: number; lng: number };
  selectedPropertyId?: string | null;
  onSelect: (propertyId: string) => void;
  className?: string;
}

/**
 * Com NEXT_PUBLIC_MAPTILER_API_KEY configurada, usa o provedor licenciado
 * real (cartografia completa em qualquer zoom). Sem a chave — pendência
 * externa documentada — cai para o estilo de demonstração do próprio
 * MapLibre (demotiles.maplibre.org), que só tem dados até zoom ~6 (nível
 * país/continente): a interação (marcadores, seleção, clustering futuro)
 * já funciona de ponta a ponta, mas o fundo cartográfico de bairro só
 * aparece com um provedor real configurado.
 *
 * Deliberadamente NÃO usamos o tile server bruto do OSM aqui, nem em dev:
 * a política de uso do OSM proíbe consumo automatizado/embarcado sem
 * permissão explícita (https://operations.osmfoundation.org/policies/tiles/),
 * e o prompt mestre veta depender dele em produção — manter um único
 * caminho (demo vs. MapTiler) evita criar um hábito que teria de ser
 * removido depois.
 */
function resolveStyle(): string {
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  if (maptilerKey) {
    return `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`;
  }
  return "https://demotiles.maplibre.org/style.json";
}

export function PropertyMap({ points, center, selectedPropertyId, onSelect, className }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: resolveStyle(),
      center: [center.lng, center.lat],
      zoom: 13,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mapa é inicializado uma vez; recentralização é feita via flyTo abaixo
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of markersRef.current.values()) marker.remove();
    markersRef.current.clear();

    for (const point of points) {
      const { location } = point.property;
      if (!location) continue;

      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", `${point.property.title} — ${point.score ?? "?"}% match`);
      const isSelected = selectedPropertyId === point.property.id;
      el.style.cssText = `
        display:flex;align-items:center;justify-content:center;
        width:${isSelected ? 44 : 36}px;height:${isSelected ? 44 : 36}px;border-radius:999px;
        background:${isSelected ? "#2A2820" : "#333B28"};color:#F7F4EC;
        font-family:Inter,sans-serif;font-weight:600;font-size:${isSelected ? 14 : 12}px;
        border:2px solid #F7F4EC;box-shadow:0 2px 8px rgba(33,31,25,0.25);cursor:pointer;
      `;
      el.textContent = point.score !== undefined ? String(point.score) : "•";
      el.onclick = () => onSelect(point.property.id);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([location.lng, location.lat])
        .addTo(map);
      markersRef.current.set(point.property.id, marker);
    }
  }, [points, selectedPropertyId, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [center.lng, center.lat], essential: true });
  }, [center.lat, center.lng]);

  return <div ref={containerRef} className={className} role="application" aria-label="Mapa de imóveis" />;
}
