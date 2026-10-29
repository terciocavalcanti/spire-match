import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termos de Uso" };

export default function TermosPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-ink-primary">Termos de Uso</h1>
      <p className="mt-4 text-bodyMd text-ink-secondary">
        Os Termos de Uso definitivos da VALORI MATCH estão em elaboração jurídica e serão publicados
        aqui antes do lançamento em produção (Marco F). Esta página é um placeholder real de rota —
        não um texto legal vinculante.
      </p>
    </main>
  );
}
