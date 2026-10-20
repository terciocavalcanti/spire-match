"use client";

import { SpireMark } from "@spire/ui-web";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PreferencesForm } from "@/components/profile/PreferencesForm";
import { useCurrentUser } from "@/hooks/use-current-user";

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: user } = useCurrentUser();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-6">
      <div className="flex items-center justify-between">
        <Link href="/" aria-label="Voltar" className="text-ink-primary">
          ←
        </Link>
        <div className="flex flex-1 items-center gap-1.5 px-4" aria-hidden>
          <span className="h-1 flex-1 rounded-pill bg-brand-charcoal" />
          <span className="h-1 flex-1 rounded-pill bg-border-subtle" />
          <span className="h-1 flex-1 rounded-pill bg-border-subtle" />
        </div>
        <Link href="/inicio" className="text-bodySm font-medium text-ink-secondary">
          Pular
        </Link>
      </div>

      <div className="mt-10 flex items-center gap-2 text-ink-primary">
        <SpireMark className="h-5 w-5" />
        <span className="font-display text-base tracking-[0.2em]">SPIRE MATCH</span>
      </div>

      <h1 className="mt-6 font-display text-2xl text-ink-primary">
        Conte-nos o seu perfil{user ? `, ${firstName(user.name)}` : ""}
      </h1>
      <p className="mt-2 text-bodyMd text-ink-secondary">
        Assim encontramos os imóveis ideais para você.
      </p>

      <div className="mt-6">
        <PreferencesForm onSaved={() => router.push("/inicio")} />
      </div>
    </main>
  );
}
