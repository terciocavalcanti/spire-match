"use client";

import { Download, Share } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as { standalone?: boolean }).standalone === true;
}

/**
 * Instalação sob demanda (seção 10 do prompt mestre) — nunca um prompt
 * automático repetitivo. Android/desktop usam `beforeinstallprompt`; iOS
 * Safari não expõe esse evento, então orientamos o fluxo manual.
 */
export function InstallPwaCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  // Renderiza oculto no SSR (sem navigator/localStorage) e só revela a UI
  // depois de montar no cliente — evita mismatch de hidratação. O setState
  // único aqui é o padrão aceito para UI exclusivamente client-side.
  const [clientState, setClientState] = useState<{ ready: boolean; ios: boolean; dismissed: boolean }>({
    ready: false,
    ios: false,
    dismissed: true,
  });

  useEffect(() => {
    let initialDismissed = isStandalone();
    if (!initialDismissed) {
      try {
        initialDismissed = localStorage.getItem("spire:pwa-install-dismissed") === "1";
      } catch {
        // localStorage indisponível (modo privado) — segue sem lembrar a dispensa.
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- revelação única de UI client-only após montar (evita mismatch de SSR)
    setClientState({ ready: true, ios: isIos(), dismissed: initialDismissed });

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  const { ready, ios, dismissed } = clientState;

  function dismiss() {
    setClientState((current) => ({ ...current, dismissed: true }));
    try {
      localStorage.setItem("spire:pwa-install-dismissed", "1");
    } catch {
      // ignora — apenas não lembra a preferência nesta sessão
    }
  }

  if (!ready || dismissed || (!ios && !deferredPrompt)) return null;

  return (
    <div className="rounded-2xl border border-border-subtle bg-background-elevated p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background-subtle text-ink-primary">
          <Download className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="font-display text-bodyLg text-ink-primary">Instalar o VALORI MATCH</p>
          {ios ? (
            <p className="mt-1 text-bodySm text-ink-secondary">
              Toque em <Share className="mx-1 inline h-3.5 w-3.5" /> Compartilhar e depois em
              &ldquo;Adicionar à Tela de Início&rdquo;.
            </p>
          ) : (
            <p className="mt-1 text-bodySm text-ink-secondary">
              Acesso rápido direto da tela inicial, sem precisar abrir o navegador.
            </p>
          )}
          <div className="mt-3 flex gap-3">
            {!ios && deferredPrompt && (
              <button
                type="button"
                onClick={async () => {
                  await deferredPrompt.prompt();
                  await deferredPrompt.userChoice;
                  setDeferredPrompt(null);
                  dismiss();
                }}
                className="rounded-pill bg-brand-charcoal px-4 py-2 text-bodySm font-semibold text-ink-inverse"
              >
                Instalar
              </button>
            )}
            <button type="button" onClick={dismiss} className="text-bodySm font-medium text-ink-secondary">
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
