"use client";

import "leaflet/dist/leaflet.css";

import type { PropertySummary } from "@spire/contracts";
import { haversineDistanceMeters } from "@spire/domain";
import L from "leaflet";
import { LocateFixed } from "lucide-react";
import { useEffect, useRef } from "react";

const NEARBY_RADIUS_METERS = 1_000;
// Zoom inicial alto o bastante para já mostrar o nome das ruas ao redor do
// ponto de partida (13 mostrava só o bairro, sem rótulos de rua legíveis).
const INITIAL_ZOOM = 15;

// Mesmo arredondamento de useRoute.ts (~100m) — só para decidir QUANDO
// refazer os marcadores de imóvel, nunca para o cálculo de distância em si.
function roundForDependency(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Com NEXT_PUBLIC_MAPTILER_API_KEY configurada, usa tiles raster do MapTiler
 * (plano gratuito — exige atribuição visível, já coberta pelo
 * attributionControl padrão do Leaflet). Sem a chave, cai para o tile server
 * bruto do OpenStreetMap — ciente do trade-off: a política de uso do OSM
 * (https://operations.osmfoundation.org/policies/tiles/) não permite uso
 * pesado/comercial/automatizado sem acordo prévio, e a OSMF pode bloquear o
 * domínio/IP sem aviso se o tráfego crescer. Nunca falha silenciosamente
 * como "mapa ativo" sem fonte real — sempre um dos dois providers funciona.
 */
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
const TILE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v4/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
  : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = MAPTILER_KEY
  ? '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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
  /** Geometria da rota até o imóvel selecionado (via `useRoute`) — [lat, lng] por ponto. */
  routeCoordinates?: [number, number][] | null;
  className?: string;
}

export function PropertyMap({
  points,
  center,
  userLocation,
  selectedPropertyId,
  onSelect,
  routeCoordinates,
  className,
}: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userRadiusRef = useRef<L.Circle | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true }).setView(
      [center.lat, center.lng],
      INITIAL_ZOOM,
    );
    L.control.zoom({ position: "topright" }).addTo(map);
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19, crossOrigin: true }).addTo(map);
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
      routeLineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mapa é inicializado uma vez; recentralização é feita via flyTo abaixo
  }, []);

  // Recalcula o layout interno do Leaflet quando o contêiner muda de tamanho
  // (ex.: alternar tela cheia) — sem isso, o mapa continua renderizado no
  // tamanho antigo até o usuário interagir manualmente.
  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const userLocationLatForMarkers = userLocation ? roundForDependency(userLocation.lat) : undefined;
  const userLocationLngForMarkers = userLocation ? roundForDependency(userLocation.lng) : undefined;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- userLocation entra arredondado (~100m) acima; a cada tick bruto do GPS este efeito removeria e recriaria TODOS os marcadores de imóvel, piscando o mapa inteiro
  }, [points, selectedPropertyId, onSelect, userLocationLatForMarkers, userLocationLngForMarkers]);

  // Recentraliza só na transição de "sem localização" para "localização
  // obtida" (ligar/desligar "Minha localização") — nunca a cada atualização
  // de watchPosition, senão o flyTo contínuo faz a tela "piscar"/animar sem
  // parar enquanto o GPS reporta novas coordenadas (a cada poucos segundos).
  const hasUserLocationRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const hasUserLocation = Boolean(userLocation);
    if (hasUserLocation !== hasUserLocationRef.current) {
      hasUserLocationRef.current = hasUserLocation;
      map.flyTo([center.lat, center.lng], map.getZoom(), { duration: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- centraliza só na transição de userLocation, não a cada tick de center
  }, [userLocation]);

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

  // Linha da rota até o imóvel selecionado (useRoute, calculada na página).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    routeLineRef.current?.remove();
    routeLineRef.current = null;

    if (routeCoordinates && routeCoordinates.length > 1) {
      routeLineRef.current = L.polyline(routeCoordinates, {
        color: "#3B6EA5",
        weight: 4,
        opacity: 0.85,
      }).addTo(map);
      map.fitBounds(routeLineRef.current.getBounds(), { padding: [48, 48] });
    }
  }, [routeCoordinates]);

  // A div que o Leaflet monta precisa de um className que NUNCA muda entre
  // renders: Leaflet adiciona classes como "leaflet-container" via
  // classList.add() direto no DOM, fora do React. Se essa MESMA div também
  // recebesse a prop `className` (que muda ao alternar tela cheia), o React
  // reescreveria `element.className` inteiro a cada mudança, apagando as
  // classes do Leaflet — e sem "leaflet-container", o CSS do próprio Leaflet
  // que neutraliza o max-width:100% do reset de imagem do Tailwind parava de
  // valer, zerando a largura calculada dos tiles (mapa ficava cinza).
  function recenter() {
    const map = mapRef.current;
    if (!map) return;
    const target = userLocation ?? center;
    map.flyTo([target.lat, target.lng], map.getZoom(), { duration: 1 });
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <div ref={containerRef} className="h-full w-full" role="application" aria-label="Mapa de imóveis" />
      <button
        type="button"
        onClick={recenter}
        aria-label="Voltar para o ponto onde você está"
        className="absolute left-3 top-16 z-[1001] flex h-9 w-9 items-center justify-center rounded-full bg-background-elevated/90 text-ink-primary shadow-sm"
      >
        <LocateFixed className="h-4 w-4" />
      </button>
    </div>
  );
}
