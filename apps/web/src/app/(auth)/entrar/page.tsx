import { SpireMark } from "@spire/ui-web";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 flex items-center gap-2 text-ink-primary">
        <SpireMark className="h-6 w-6" />
        <span className="font-display text-lg tracking-[0.2em]">VALORI MATCH</span>
      </div>

      <h1 className="font-display text-3xl text-ink-primary">Acesse sua conta</h1>
      <p className="mt-2 text-bodyLg text-ink-secondary">
        Entre para ver seus matches personalizados.
      </p>

      <div className="mt-8">
        <LoginForm />
      </div>

      <div className="mt-6 flex items-center gap-3 text-ink-tertiary">
        <span className="h-px flex-1 bg-border-subtle" />
        <span className="text-bodySm">ou continue com</span>
        <span className="h-px flex-1 bg-border-subtle" />
      </div>

      <div className="mt-6 space-y-3">
        {(["Google", "Apple"] as const).map((provider) => (
          <button
            key={provider}
            type="button"
            disabled
            title="Disponível assim que a integração OIDC for configurada"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-pill border border-border-subtle bg-background-elevated text-button text-ink-tertiary opacity-60"
          >
            Continuar com {provider}
            <span className="rounded-pill bg-background-subtle px-2 py-0.5 text-caption">em breve</span>
          </button>
        ))}
      </div>
    </main>
  );
}
