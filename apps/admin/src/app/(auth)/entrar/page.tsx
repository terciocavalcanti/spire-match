import { SpireMark } from "@spire/ui-web";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 flex items-center gap-2 text-ink-primary">
        <SpireMark className="h-6 w-6" />
        <span className="font-display text-lg tracking-[0.2em]">SPIRE MATCH</span>
      </div>

      <h1 className="font-display text-3xl text-ink-primary">Painel comercial</h1>
      <p className="mt-2 text-bodyLg text-ink-secondary">Acesso restrito ao time comercial SPIRE.</p>

      <div className="mt-8">
        <LoginForm />
      </div>
    </main>
  );
}
