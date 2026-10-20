import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-ink-primary">Política de Privacidade</h1>
      <p className="mt-4 text-bodyMd text-ink-secondary">
        A Política de Privacidade definitiva (mapa de dados LGPD, finalidades, bases legais e
        retenção) será publicada aqui no Marco F, junto do checklist de conformidade em
        <code className="mx-1 rounded bg-background-subtle px-1.5 py-0.5 text-bodySm">
          docs/security/LGPD_DATA_MAP.md
        </code>
        .
      </p>
    </main>
  );
}
