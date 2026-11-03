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

// `watchPosition` roda com `maximumAge: 30_000`, então em celular real a
// PRIMEIRA leitura costuma vir de um fix em cache/rede (até 30s desatualizado
// ou de baixa precisão), e o GPS pode levar VÁRIAS leituras — não só uma —
// pra convergir pra posição real, cada correção chegando um ou mais segundos
// depois da anterior (comum em ambiente fechado/sinal fraco). Enquanto isso,
// se a posição já tivesse sido exposta ao resto do app, conteúdo tocável
// (ex.: os cards de "Perto de você agora" em /inicio) pintaria com uma
// leitura, e uma correção seguinte — às vezes bem na hora em que o usuário
// está tocando a tela — trocaria o conteúdo debaixo do dedo, fazendo-o
// entrar num imóvel diferente do que viu. Uma primeira versão desta espera
// só protegia a PRIMEIRA leitura (assumindo que a segunda já seria a
// definitiva); na prática o GPS às vezes corrige mais de uma vez, e esse
// "só a primeira" deixava as correções seguintes passarem direto sem
// proteção. Por isso agora QUALQUER salto de ≥`MIN_MOVEMENT_METERS` (não só
// o primeiro) reinicia a espera de decantação: só quando uma leitura fica
// este tempo sem ser substituída por outro salto é que ela de fato vira
// `location`/"granted". Uma leitura dentro do raio de ruído da candidata
// pendente não reinicia a espera (ruído normal não trava a decantação).
const SETTLE_DELAY_MS = 1_500;

// Trava de segurança: nunca deixa o usuário olhando pro esqueleto de
// carregamento indefinidamente se o GPS nunca "acalmar" (sinal ruim demais
// pra convergir). Passado esse tempo desde o `request()`, a leitura mais
// recente é aceita na hora, mesmo que ainda estivesse em decantação.
const MAX_SETTLE_WAIT_MS = 8_000;

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
  // Candidata mais recente ainda em decantação (não commitada em `location`).
  // Enquanto existir, é ELA a referência de histerese para leituras novas —
  // não a última aceita, que pode já estar várias correções desatualizada.
  const pendingRef = useRef<{ lat: number; lng: number; accuracy: number | null } | null>(null);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestStartedAtRef = useRef<number | null>(null);

  function clearSettleTimeout() {
    if (settleTimeoutRef.current !== null) {
      clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }
  }

  const commit = useCallback((next: { lat: number; lng: number }, accuracy: number | null) => {
    clearSettleTimeout();
    pendingRef.current = null;
    lastAcceptedRef.current = next;
    setLocation({ ...next, accuracy });
    setStatus("granted");
  }, []);

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
      pendingRef.current = null;
      requestStartedAtRef.current = null;
      clearSettleTimeout();
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
    requestStartedAtRef.current = Date.now();
    pendingRef.current = null;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        const accuracy = position.coords.accuracy ?? null;
        // Mede contra a candidata em decantação se houver uma (pode já estar
        // várias correções à frente da última posição commitada); senão,
        // contra a última posição de fato commitada.
        const reference = pendingRef.current ?? lastAcceptedRef.current;

        if (reference && haversineDistanceMeters(reference, next) < MIN_MOVEMENT_METERS) {
          // Ruído de sensor, não um novo salto — não reinicia a decantação.
          // Se já existe algo commitado, confirma "granted" (relevante logo
          // após "requesting"); a posição oficial não muda.
          if (lastAcceptedRef.current) setStatus("granted");
          return;
        }

        const elapsedSinceRequest = Date.now() - (requestStartedAtRef.current ?? Date.now());
        if (elapsedSinceRequest >= MAX_SETTLE_WAIT_MS) {
          // Já esperamos o suficiente — expõe o que tiver em vez de deixar o
          // usuário olhando pro esqueleto de carregamento pra sempre.
          commit(next, accuracy);
          return;
        }

        // Salto real (≥ MIN_MOVEMENT_METERS) dentro da janela de segurança —
        // (re)inicia a decantação a partir desta leitura.
        pendingRef.current = { ...next, accuracy };
        clearSettleTimeout();
        settleTimeoutRef.current = setTimeout(() => {
          settleTimeoutRef.current = null;
          const candidate = pendingRef.current;
          if (candidate) commit(candidate, candidate.accuracy);
        }, SETTLE_DELAY_MS);
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  }, [commit]);

  /** Desativa o acompanhamento em tempo real — o usuário pode reativar a qualquer momento com `request()`. */
  const clear = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    lastAcceptedRef.current = null;
    pendingRef.current = null;
    requestStartedAtRef.current = null;
    clearSettleTimeout();
    setStatus("idle");
    setLocation(null);
  }, []);

  const toggle = useCallback(() => {
    if (watchIdRef.current !== null) clear();
    else request();
  }, [clear, request]);

  return { status, location, request, clear, toggle };
}
