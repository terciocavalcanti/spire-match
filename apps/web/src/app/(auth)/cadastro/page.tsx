import { SpireMark } from "@spire/ui-web";
import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 flex items-center gap-2 text-ink-primary">
        <SpireMark className="h-6 w-6" />
        <span className="font-display text-lg tracking-[0.2em]">VALORI MATCH</span>
      </div>

      <h1 className="font-display text-3xl text-ink-primary">Criar sua conta</h1>
      <p className="mt-2 text-bodyLg text-ink-secondary">
        Leva menos de um minuto — depois você conta suas preferências para montarmos seus matches.
      </p>

      <div className="mt-8">
        <RegisterForm />
      </div>
    </main>
  );
}
