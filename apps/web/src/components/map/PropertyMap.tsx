"use client";

import "leaflet/dist/leaflet.css";

import type { PropertySummary } from "@spire/contracts";
import { haversineDistanceMeters } from "@spire/domain";
import L from "leaflet";
import { useEffect, useRef } from "react";

const NEARBY_RADIUS_METERS = 1_000;

/**
 * Tile server bruto do OpenStreetMap — decisão explícita do usuário,
 * ciente do trade-off: a política de uso do OSM
 * (https://operations.osmfoundation.org/policies/tiles/) não permite uso
 * pesado/comercial/automatizado sem acordo prévio, e a OSMF pode bloquear o
 * domínio/IP sem aviso se o tráfego crescer. Tentamos primeiro o basemap
 * "gratuito" da CARTO (Positron), mas a CARTO passou a exigir cadastro de
 * chave de API mesmo no tier free — não é mais keyless. Caminho de saída,
 * sem mudar nenhum código: configurar NEXT_PUBLIC_MAPTILER_API_KEY (infra já
 * pronta no projeto/Coolify) ou uma chave da CARTO, e trocar TILE_URL abaixo
 * para o endpoint correspondente.
 */
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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

export function PropertyMap({ points, center, userLocation, selectedPropertyId, onSelect, className }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userRadiusRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true }).setView(
      [center.lat, center.lng],
      13,
    );
    L.control.zoom({ position: "topright" }).addTo(map);
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    const markers = markersRef.current;

    return () => {
      map.remove();
      mapRef.current = null;
      // Markers filhos já foram destruídos junto com o mapa — zera as refs para que os
      // outros efeitos nunca tentem reaproveitar um marcador preso a esta instância.
      markers.clear();
      userMarkerRef.current = null;
      userRadiusRef.current = null;
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

      const wrapper = document.createElement("div");
      wrapper.style.cssText = `position:relative;width:${size}px;height:${size}px;`;

      if (isNearby) {
        const ping = document.createElement("span");
        ping.setAttribute("aria-hidden", "true");
        ping.className = "animate-ping";
        ping.style.cssText = `position:absolute;inset:0;border-radius:999px;background:rgba(51,59,40,0.55);`;
        wrapper.appendChild(ping);
      }

      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute(
        "aria-label",
        `${point.property.title} — ${point.score ?? "?"}% match${isNearby ? " — a menos de 1km de você" : ""}`,
      );
      button.style.cssText = `
        position:relative;display:flex;align-items:center;justify-content:center;
        width:${size}px;height:${size}px;border-radius:999px;
        background:${isSelected ? "#2A2820" : "#333B28"};color:#F7F4EC;
        font-family:Inter,sans-serif;font-weight:600;font-size:${isSelected ? 14 : 12}px;
        border:2px solid #F7F4EC;box-shadow:0 2px 8px rgba(33,31,25,0.25);cursor:pointer;
      `;
      button.textContent = point.score !== undefined ? String(point.score) : "•";
      button.onclick = () => onSelect(point.property.id);
      wrapper.appendChild(button);

      const marker = L.marker([location.lat, location.lng], {
        icon: L.divIcon({ html: wrapper, className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
      }).addTo(map);
      markersRef.current.set(point.property.id, marker);
    }
  }, [points, selectedPropertyId, onSelect, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo([center.lat, center.lng], map.getZoom(), { duration: 1 });
  }, [center.lat, center.lng]);

  // Marcador "você está aqui" + raio de 1km, acompanhando a posição em tempo real.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!userLocation) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      userRadiusRef.current?.remove();
      userRadiusRef.current = null;
      return;
    }

    const latLng: L.LatLngTuple = [userLocation.lat, userLocation.lng];

    if (userRadiusRef.current) {
      userRadiusRef.current.setLatLng(latLng);
    } else {
      userRadiusRef.current = L.circle(latLng, {
        radius: NEARBY_RADIUS_METERS,
        color: "#333B28",
        weight: 1.5,
        opacity: 0.4,
        fillColor: "#333B28",
        fillOpacity: 0.08,
        dashArray: "4,4",
      }).addTo(map);
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(latLng);
    } else {
      const dot = document.createElement("div");
      dot.setAttribute("aria-hidden", "true");
      dot.style.cssText = "position:relative;width:18px;height:18px;";
      dot.innerHTML = `
        <span class="animate-ping" style="position:absolute;inset:-6px;border-radius:999px;background:rgba(59,110,165,0.5);"></span>
        <span style="position:relative;display:block;width:18px;height:18px;border-radius:999px;background:#3B6EA5;border:3px solid #F7F4EC;box-shadow:0 1px 4px rgba(33,31,25,0.35);"></span>
      `;
      userMarkerRef.current = L.marker(latLng, {
        icon: L.divIcon({ html: dot, className: "", iconSize: [18, 18], iconAnchor: [9, 9] }),
        zIndexOffset: 1000,
      }).addTo(map);
    }
  }, [userLocation]);

  return <div ref={containerRef} className={className} role="application" aria-label="Mapa de imóveis" />;
}
