import { SpireMark } from "@spire/ui-web";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "O imóvel certo, no lugar certo, na hora certa",
};

/**
 * Splash / boas-vindas (tela 1, `design/referencias/01_fluxo_inicial.png`).
 * O fundo é uma ilustração abstrata de skyline (marca própria), não uma foto
 * de imóvel real — fotografia de propriedades reais entra no Marco B via
 * storage S3-compatible, nunca reaproveitando as referências de design.
 */
export default function SplashPage() {
  return (
    <main className="relative flex min-h-dvh flex-col justify-end overflow-hidden bg-background-base">
      <div aria-hidden className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-taupe/30 via-background-base to-background-base" />
        <svg
          viewBox="0 0 400 800"
          preserveAspectRatio="xMidYMax slice"
          className="absolute inset-0 h-full w-full opacity-[0.16]"
        >
          <g fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-charcoal">
            <path d="M20 800V520L60 380L100 520V800" />
            <path d="M110 800V440L150 260L190 440V800" />
            <path d="M200 800V560L240 420L280 560V800" />
            <path d="M290 800V480L330 300L370 480V800" />
          </g>
        </svg>
      </div>

      <div className="relative z-10 px-6 pb-12 pt-24 sm:px-10">
        <div className="mb-10 flex items-center gap-2 text-ink-primary">
          <SpireMark className="h-6 w-6" />
          <div className="leading-none">
            <p className="font-display text-xl tracking-[0.25em]">SPIRE</p>
            <p className="text-caption tracking-[0.3em] text-ink-secondary">MATCH</p>
          </div>
        </div>

        <h1 className="max-w-sm font-display text-4xl leading-tight text-ink-primary">
          O imóvel certo,
          <br />
          no <em className="italic">lugar</em> certo,
          <br />
          na <em className="italic">hora</em> certa.
        </h1>

        <div className="mt-10 flex items-center gap-1.5" aria-hidden>
          <span className="h-1.5 w-5 rounded-pill bg-brand-charcoal" />
          <span className="h-1.5 w-1.5 rounded-pill bg-border-strong" />
          <span className="h-1.5 w-1.5 rounded-pill bg-border-strong" />
          <span className="h-1.5 w-1.5 rounded-pill bg-border-strong" />
        </div>

        <Link
          href="/onboarding"
          className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-pill bg-brand-charcoal text-button text-ink-inverse transition-colors hover:bg-brand-charcoalHover"
        >
          Começar
          <span aria-hidden>→</span>
        </Link>

        <p className="mt-4 text-center text-bodySm text-ink-secondary">
          Já tem uma conta?{" "}
          <Link href="/entrar" className="font-semibold text-ink-primary underline underline-offset-2">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
