"use client";

import "leaflet/dist/leaflet.css";

import type { PropertySummary } from "@spire/contracts";
import { haversineDistanceMeters } from "@spire/domain";
import L from "leaflet";
import { LocateFixed } from "lucide-react";
import { useEffect, useRef } from "react";

const NEARBY_RADIUS_METERS = 1_000;
// Zoom "normal" de abertura do mapa — visão de bairro, mostrando vários
// imóveis de contexto. O zoom fechado (LOCATION_ZOOM) só entra em ação
// quando o usuário ativa "Minha localização", não no carregamento inicial.
const INITIAL_ZOOM = 13;
// Zoom ao ativar a localização — perto o bastante pra ver ruas e pontos de
// referência legíveis (testado visualmente: 15 ainda exigia apertar "+"
// várias vezes; 19/maxZoom ficou exagerado, só 1 imóvel visível e número de
// lote em vez de nome de rua; 17 é o equilíbrio certo).
const LOCATION_ZOOM = 17;

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
  // Enquanto o flyTo entre INITIAL_ZOOM e LOCATION_ZOOM está em andamento,
  // vários imóveis realmente próximos (distintos no mundo real) colapsam
  // visualmente no zoom largo e ficam a poucos pixels uns dos outros — o
  // Leaflet sempre entrega o clique ao marcador geometricamente "por cima"
  // (z-index por posição Y na tela), então um toque em QUALQUER um dos
  // marcadores sobrepostos sempre seleciona o mesmo (o que está no topo),
  // nunca o que o usuário realmente tocou. Como o cluster se separa
  // perfeitamente assim que a câmera assenta (confirmado via medição de
  // pixels), a correção é simplesmente ignorar cliques em marcadores
  // enquanto a câmera ainda está em voo, não mudar o zoom/clustering.
  const isFlyingRef = useRef(false);

  function flyToGuarded(map: L.Map, latlng: L.LatLngTuple, zoom: number, duration: number) {
    isFlyingRef.current = true;
    map.once("moveend", () => {
      isFlyingRef.current = false;
    });
    map.flyTo(latlng, zoom, { duration });
  }

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
      button.onclick = () => {
        if (isFlyingRef.current) return;
        onSelect(point.property.id);
      };
      wrapper.appendChild(button);

      const marker = L.marker([location.lat, location.lng], {
        icon: L.divIcon({ html: wrapper, className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
      }).addTo(map);
      markersRef.current.set(point.property.id, marker);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- userLocation entra arredondado (~100m) acima; a cada tick bruto do GPS este efeito removeria e recriaria TODOS os marcadores de imóvel, piscando o mapa inteiro
  }, [points, selectedPropertyId, onSelect, userLocationLatForMarkers, userLocationLngForMarkers]);

  // Reage só na TRANSIÇÃO de "sem localização" para "localização obtida" (ligar/
  // desligar "Minha localização") — nunca a cada atualização de watchPosition,
  // senão a animação contínua faz a tela "piscar"/animar sem parar enquanto o
  // GPS reporta novas coordenadas (a cada poucos segundos). O mapa abre no
  // zoom "normal" (INITIAL_ZOOM); ativar a localização é o que de fato aciona
  // o zoom fechado (LOCATION_ZOOM) sobre a posição do usuário; desativar volta
  // para o zoom normal. Usa flyTo aqui de propósito (diferente do botão de
  // recentralizar abaixo) — o objetivo agora É mudar o zoom de forma visível,
  // não só re-centralizar mantendo o mesmo zoom.
  const hasUserLocationRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const hasUserLocation = Boolean(userLocation);
    if (hasUserLocation !== hasUserLocationRef.current) {
      hasUserLocationRef.current = hasUserLocation;
      const targetZoom = hasUserLocation ? LOCATION_ZOOM : INITIAL_ZOOM;
      flyToGuarded(map, [center.lat, center.lng], targetZoom, 1.5);
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
  // Sem fitBounds automático: a rota é calculada assim que o usuário ativa a
  // localização (sempre há um imóvel selecionado por padrão, mesmo sem o
  // usuário ter tocado em nada), e um fitBounds aqui desfazia o zoom que o
  // efeito acima acabou de aplicar sobre a posição do usuário — ele via isso
  // como "ativei a localização e o mapa ficou sem zoom". A linha da rota
  // ainda é desenhada normalmente; o usuário pode dar zoom out manualmente
  // se quiser ver o trajeto inteiro.
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
    if (userLocation) {
      // Com localização ativa, "voltar para onde estou" inclui o zoom
      // fechado — não só re-centralizar no zoom atual (que pode já ter sido
      // alterado manualmente pelo usuário ao explorar o mapa).
      flyToGuarded(map, [userLocation.lat, userLocation.lng], LOCATION_ZOOM, 1);
    } else {
      map.panTo([center.lat, center.lng], { duration: 1 });
    }
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
