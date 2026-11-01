"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GeolocationStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported";

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
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
        });
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
    setStatus("idle");
    setLocation(null);
  }, []);

  const toggle = useCallback(() => {
    if (watchIdRef.current !== null) clear();
    else request();
  }, [clear, request]);

  return { status, location, request, clear, toggle };
}
