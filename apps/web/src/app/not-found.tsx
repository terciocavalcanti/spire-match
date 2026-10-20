import { SpireMark } from "@spire/ui-web";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <SpireMark className="h-8 w-8 text-ink-tertiary" />
      <h1 className="font-display text-3xl text-ink-primary">Página não encontrada</h1>
      <p className="max-w-sm text-bodyMd text-ink-secondary">
        O endereço acessado não existe ou foi movido.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-12 items-center justify-center rounded-pill bg-brand-charcoal px-6 text-button text-ink-inverse"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
