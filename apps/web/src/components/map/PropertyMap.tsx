"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import type { PropertySummary } from "@spire/contracts";
import { haversineDistanceMeters } from "@spire/domain";
import * as maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

const NEARBY_RADIUS_METERS = 1_000;

/** Polígono aproximado de um círculo geográfico (GeoJSON), usado para o raio de 1km. */
function circlePolygon(center: { lat: number; lng: number }, radiusMeters: number, steps = 64): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const earthRadius = 6_371_000;
  const latRad = (center.lat * Math.PI) / 180;
  for (let i = 0; i <= steps; i++) {
    const bearing = (i / steps) * 2 * Math.PI;
    const dLat = (radiusMeters * Math.cos(bearing)) / earthRadius;
    const dLng = (radiusMeters * Math.sin(bearing)) / (earthRadius * Math.cos(latRad));
    coords.push([center.lng + (dLng * 180) / Math.PI, center.lat + (dLat * 180) / Math.PI]);
  }
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}

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
  /** Posição real do usuário (via `useGeolocation`) — quando presente, desenha o marcador "você está aqui" e o raio de 1km. */
  userLocation?: { lat: number; lng: number } | null;
  selectedPropertyId?: string | null;
  onSelect: (propertyId: string) => void;
  className?: string;
}

/** Executa `cb` assim que o estilo do mapa estiver pronto para receber source/layer. */
function whenStyleReady(map: maplibregl.Map, cb: () => void) {
  if (map.isStyleLoaded()) cb();
  else map.once("load", cb);
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

export function PropertyMap({ points, center, userLocation, selectedPropertyId, onSelect, className }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

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
    const markers = markersRef.current;

    return () => {
      map.remove();
      mapRef.current = null;
      // Markers filhos já foram destruídos junto com o mapa — zera as refs para que os
      // outros efeitos nunca tentem reaproveitar um marcador preso a esta instância.
      markers.clear();
      userMarkerRef.current = null;
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

      const isSelected = selectedPropertyId === point.property.id;
      const size = isSelected ? 44 : 36;
      const isNearby = Boolean(userLocation) && haversineDistanceMeters(userLocation!, location) <= NEARBY_RADIUS_METERS;

      // position:absolute (não relative) é essencial: o CSS do próprio MapLibre espera
      // que o elemento raiz do marcador fique fora do fluxo normal do documento (como o
      // dele mesmo define via `.maplibregl-marker`). Um `relative` aqui empilha os
      // marcadores em fluxo normal, um atrás do outro, e o `transform: translate(...)`
      // do MapLibre passa a somar-se a essa posição de fluxo em vez de partir de (0,0) —
      // o efeito só fica visível/grande quando há muitos marcadores antes dele no DOM.
      const wrapper = document.createElement("div");
      wrapper.style.cssText = `position:absolute;top:0;left:0;width:${size}px;height:${size}px;`;

      if (isNearby) {
        const ping = document.createElement("span");
        ping.setAttribute("aria-hidden", "true");
        ping.className = "animate-ping";
        ping.style.cssText = `position:absolute;inset:0;border-radius:999px;background:rgba(51,59,40,0.55);`;
        wrapper.appendChild(ping);
      }

      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute(
        "aria-label",
        `${point.property.title} — ${point.score ?? "?"}% match${isNearby ? " — a menos de 1km de você" : ""}`,
      );
      el.style.cssText = `
        position:relative;display:flex;align-items:center;justify-content:center;
        width:${size}px;height:${size}px;border-radius:999px;
        background:${isSelected ? "#2A2820" : "#333B28"};color:#F7F4EC;
        font-family:Inter,sans-serif;font-weight:600;font-size:${isSelected ? 14 : 12}px;
        border:2px solid #F7F4EC;box-shadow:0 2px 8px rgba(33,31,25,0.25);cursor:pointer;
      `;
      el.textContent = point.score !== undefined ? String(point.score) : "•";
      el.onclick = () => onSelect(point.property.id);
      wrapper.appendChild(el);

      const marker = new maplibregl.Marker({ element: wrapper })
        .setLngLat([location.lng, location.lat])
        .addTo(map);
      markersRef.current.set(point.property.id, marker);
    }
  }, [points, selectedPropertyId, onSelect, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [center.lng, center.lat], essential: true });
  }, [center.lat, center.lng]);

  // Marcador "você está aqui" + raio de 1km, acompanhando a posição em tempo real.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!userLocation) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      whenStyleReady(map, () => {
        const source = map.getSource("user-radius") as maplibregl.GeoJSONSource | undefined;
        source?.setData({ type: "FeatureCollection", features: [] });
      });
      return;
    }

    // Sempre recria o marcador (em vez de reaproveitar via ref) para nunca ficar preso a
    // uma instância de mapa antiga — o mesmo princípio do efeito de marcadores de imóveis
    // acima. Evita um marcador "órfão" caso o mapa seja recriado (ex.: remount em dev).
    userMarkerRef.current?.remove();
    const dot = document.createElement("div");
    dot.setAttribute("aria-hidden", "true");
    dot.style.cssText = "position:absolute;top:0;left:0;width:18px;height:18px;";
    dot.innerHTML = `
      <span class="animate-ping" style="position:absolute;inset:-6px;border-radius:999px;background:rgba(59,110,165,0.5);"></span>
      <span style="position:relative;display:block;width:18px;height:18px;border-radius:999px;background:#3B6EA5;border:3px solid #F7F4EC;box-shadow:0 1px 4px rgba(33,31,25,0.35);"></span>
    `;
    userMarkerRef.current = new maplibregl.Marker({ element: dot }).setLngLat([userLocation.lng, userLocation.lat]).addTo(map);

    whenStyleReady(map, () => {
      const circle = circlePolygon(userLocation, NEARBY_RADIUS_METERS);
      const source = map.getSource("user-radius") as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(circle);
        return;
      }
      map.addSource("user-radius", { type: "geojson", data: circle });
      map.addLayer({
        id: "user-radius-fill",
        type: "fill",
        source: "user-radius",
        paint: { "fill-color": "#333B28", "fill-opacity": 0.08 },
      });
      map.addLayer({
        id: "user-radius-line",
        type: "line",
        source: "user-radius",
        paint: { "line-color": "#333B28", "line-width": 1.5, "line-opacity": 0.4, "line-dasharray": [2, 2] },
      });
    });
  }, [userLocation]);

  return <div ref={containerRef} className={className} role="application" aria-label="Mapa de imóveis" />;
}
