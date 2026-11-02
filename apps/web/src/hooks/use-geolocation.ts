"use client";

import { haversineDistanceMeters } from "@spire/domain";
import { useCallback, useEffect, useRef, useState } from "react";

export type GeolocationStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported";

// Abaixo deste raio, uma leitura nova do GPS/watchPosition é tratada como
// ruído de sensor e descartada — nunca chega a ser escrita no estado. Uma
// correção anterior tentou arredondar as coordenadas para uma grade fixa
// (~100m) só nos consumidores (useMatches, useRoute, PropertyMap), mas isso
// não resolve de verdade: quando a posição real do usuário cai perto de uma
// borda da grade, o ruído do sensor oscila entre dois buckets a cada leitura
// e a tela continua piscando. Medir a distância em relação à ÚLTIMA leitura
// ACEITA (histerese), em vez de contra uma grade fixa, elimina esse caso —
// só existe UM ponto de referência, que só se move quando o usuário de fato
// anda essa distância.
const MIN_MOVEMENT_METERS = 75;

/**
 * Localização somente durante a sessão visível, atrás de gesto explícito do
 * usuário (`request()`) — nunca solicitada automaticamente no mount. Após o
 * gesto, usa `watchPosition()` para acompanhar o deslocamento em tempo real
 * enquanto a tela estiver aberta (permitido pelo ADR — ver
 * docs/architecture/ADR_PWA_GEOLOCATION_LIMITS.md, item 1); o watch é
 * encerrado no unmount, nunca persiste em segundo plano.
 */
export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number | null } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastAcceptedRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      // Sem isso, um efeito de montagem que chama `request()` (ex.: o
      // parâmetro `ativarLocalizacao` de /mapa) nunca tenta de novo no
      // segundo passe do Strict Mode do React em dev: o watch já foi limpo
      // aqui, mas `watchIdRef`/`status` continuavam presos em "requesting"
      // com uma referência inválida, então `request()` via de novo achava
      // que já havia um watch ativo.
      watchIdRef.current = null;
      lastAcceptedRef.current = null;
      setStatus("idle");
    };
  }, []);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    if (watchIdRef.current !== null) return;
    setStatus("requesting");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        const last = lastAcceptedRef.current;
        if (last && haversineDistanceMeters(last, next) < MIN_MOVEMENT_METERS) {
          // Ruído de sensor, não movimento real — status confirma "granted"
          // (relevante na primeira leitura após "requesting"), mas a posição
          // oficial não muda, então nada que dependa de `location` refaz.
          setStatus("granted");
          return;
        }
        lastAcceptedRef.current = next;
        setLocation({ ...next, accuracy: position.coords.accuracy ?? null });
        setStatus("granted");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  }, []);

  /** Desativa o acompanhamento em tempo real — o usuário pode reativar a qualquer momento com `request()`. */
  const clear = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    lastAcceptedRef.current = null;
    setStatus("idle");
    setLocation(null);
  }, []);

  const toggle = useCallback(() => {
    if (watchIdRef.current !== null) clear();
    else request();
  }, [clear, request]);

  return { status, location, request, clear, toggle };
}
