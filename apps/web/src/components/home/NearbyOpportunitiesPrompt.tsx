"use client";

import { Button } from "@spire/ui-web";
import { Compass } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import type { useGeolocation } from "@/hooks/use-geolocation";

const DISMISSED_KEY = "valori:perto-de-voce-prompt-dismissed";

const noopSubscribe = () => () => {};

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return true;
  }
}

/**
 * Convite único (nunca repetido) para o comprador ir direto ao mapa com a
 * localização já em ativação. Só aparece enquanto `geo.status === "idle"`
 * (nunca decidido nesta sessão) e nunca mais depois de dispensado uma vez —
 * pedir localização repetidamente treina o usuário a recusar no automático,
 * o que é praticamente irreversível depois (ver ADR_PWA_GEOLOCATION_LIMITS.md).
 */
export function NearbyOpportunitiesPrompt({ geo }: { geo: ReturnType<typeof useGeolocation> }) {
  const router = useRouter();
  // getServerSnapshot = true (dispensado) evita renderizar o convite no HTML
  // do servidor; no cliente, useSyncExternalStore troca para o valor real do
  // localStorage logo após a hidratação, sem warning de mismatch.
  const dismissedBefore = useSyncExternalStore(noopSubscribe, readDismissed, () => true);
  const [justDismissed, setJustDismissed] = useState(false);

  function dismiss() {
    setJustDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // localStorage indisponível (modo privado, etc.) — só não persiste entre sessões.
    }
  }

  if (dismissedBefore || justDismissed || geo.status !== "idle") return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-brand-olive/30 bg-background-elevated p-4">
      <Compass className="mt-0.5 h-5 w-5 shrink-0 text-brand-olive" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-bodyMd font-medium text-ink-primary">Deseja procurar oportunidades agora?</p>
        <p className="mt-1 text-bodySm text-ink-secondary">
          Ative sua localização e veja no mapa os imóveis mais próximos de você.
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              dismiss();
              // A ativação real acontece na própria /mapa (ver uso de
              // `ativarLocalizacao` lá) — pedir aqui e navegar na sequência
              // cancelaria o watchPosition no desmonte desta página antes da
              // resposta chegar.
              router.push("/mapa?ativarLocalizacao=1");
            }}
          >
            Ver no mapa
          </Button>
          <Button size="sm" variant="outline" onClick={dismiss}>
            Agora não
          </Button>
        </div>
      </div>
    </div>
  );
}
