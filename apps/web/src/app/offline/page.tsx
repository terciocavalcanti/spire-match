"use client";

import { SpireMark } from "@spire/ui-web";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex items-center gap-2 text-ink-primary">
        <SpireMark className="h-6 w-6" />
        <span className="font-display text-lg tracking-[0.2em]">VALORI MATCH</span>
      </div>
      <WifiOff className="h-8 w-8 text-ink-tertiary" aria-hidden />
      <h1 className="font-display text-2xl text-ink-primary">Você está sem conexão</h1>
      <p className="max-w-sm text-bodyMd text-ink-secondary">
        Não foi possível carregar esta página. Verifique sua internet — dados pessoais e de
        imóveis exigem conexão, não ficam disponíveis offline.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-2 inline-flex h-12 items-center justify-center rounded-pill bg-brand-charcoal px-6 text-button text-ink-inverse"
      >
        Tentar novamente
      </button>
    </main>
  );
}
